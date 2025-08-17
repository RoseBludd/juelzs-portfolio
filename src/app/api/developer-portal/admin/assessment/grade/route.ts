import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMainDbPool } from "@/lib/db-pool";
import { assessmentEvaluationService } from '../../../services/AssessmentEvaluationService';

// Validation schema for request body
const gradeRequestSchema = z.object({
  applicantId: z.string(),
  assessmentId: z.string(),
  prData: z.object({
    url: z.string(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    user: z.object({
      login: z.string(),
    }),
    files: z.array(
      z.object({
        filename: z.string(),
        status: z.string(),
        additions: z.number(),
        deletions: z.number(),
        changes: z.number(),
        patch: z.string().optional(),
      })
    ),
    commits_data: z.array(
      z.object({
        sha: z.string(),
        commit: z.object({
          message: z.string(),
        }),
      })
    ).optional(),
  }),
  role: z.string().min(1, "Role is required").transform(val => val.trim()),
  githubUrl: z.string(),
  regrade: z.boolean().optional(), // Optional flag to indicate this is a regrade request
});

export async function POST(request: NextRequest) {
  try {
    console.log('ANTHROPIC_API_KEY available:', !!process.env.ANTHROPIC_API_KEY);
    
    const body = await request.json();
    const validatedData = gradeRequestSchema.parse(body);
    
    // Extract relevant data for grading
    const { 
      applicantId, 
      assessmentId, 
      prData, 
      role, 
      githubUrl, 
      regrade 
    } = validatedData;
    
    console.log(`Processing assessment for applicant: ${applicantId}, role: ${role}`);
    
    if (regrade) {
      console.log(`Handling regrade request for applicant: ${applicantId}, assessment: ${assessmentId}`);
    } else {
      console.log(`Handling initial grading request for applicant: ${applicantId}`);
    }
    
    // Analyze the PR data to generate a grade using the Anthropic API
    const gradeResult = await analyzePullRequest(prData, role, regrade);
    
    const db = getMainDbPool();
    
    // Update the application with the assessment results
    if (assessmentId !== 'unknown') {
      // Check if there's an existing AssessmentResult
      const existingAssessmentQuery = `
        SELECT * FROM "AssessmentResult" WHERE id = $1
      `;
      const existingAssessmentResult = await db.query(existingAssessmentQuery, [assessmentId]);
      const existingAssessment = existingAssessmentResult.rows[0];
      
      if (existingAssessment) {
        // Update existing assessment
        const updateAssessmentQuery = `
          UPDATE "AssessmentResult" 
          SET 
            score = $1,
            passed = $2,
            feedback = $3,
            "criteriaScores" = $4,
            strengths = $5,
            improvements = $6,
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $7
        `;
        
        await db.query(updateAssessmentQuery, [
          gradeResult.finalScore,
          gradeResult.finalScore >= 70,
          gradeResult.overallFeedback,
          JSON.stringify(gradeResult.technicalAssessment),
          JSON.stringify(gradeResult.strengths),
          JSON.stringify(gradeResult.improvements),
          assessmentId
        ]);
        
        console.log(`Updated assessment record with new scores: ${gradeResult.finalScore}%`);
        
        // Add relation to application using raw query if needed
        try {
          const updateApplicationIdQuery = `
            UPDATE "AssessmentResult" 
            SET "applicationId" = $1::uuid 
            WHERE id = $2
          `;
          await db.query(updateApplicationIdQuery, [applicantId, assessmentId]);
        } catch (error) {
          console.log('Note: Could not update applicationId - relation may not exist yet:', error);
        }
      }
    }
    
    // Get the current application to merge with existing github_submission
    const currentApplicationQuery = `
      SELECT github_submission FROM developer_applications WHERE id = $1
    `;
    const currentApplicationResult = await db.query(currentApplicationQuery, [applicantId]);
    const currentApplication = currentApplicationResult.rows[0];
    
    // Create updated github_submission object
    const existingGithubSubmission = currentApplication?.github_submission || {};
    const updatedGithubSubmission = {
      ...existingGithubSubmission,
      url: githubUrl,
      status: gradeResult.finalScore >= 70 ? 'completed' : 'failed',
      pr_number: prData.number,
      tasks_done: getTasksCompleted(prData),
      total_tasks: 4, // Assuming 4 total tasks
      submitted_at: regrade ? (existingGithubSubmission.submitted_at || new Date().toISOString()) : new Date().toISOString(),
      last_updated: new Date().toISOString(),
      graded: true,
      grade_result: gradeResult,
    };
    
    // Update the application with GitHub submission status
    const updateApplicationQuery = `
      UPDATE developer_applications 
      SET 
        github_submission = $1,
        status = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    
    await db.query(updateApplicationQuery, [
      JSON.stringify(updatedGithubSubmission),
      gradeResult.finalScore >= 70 ? 'active' : 'rejected',
      applicantId
    ]);
    
    console.log(`GitHub submission status updated with score: ${gradeResult.finalScore}%, status: ${gradeResult.finalScore >= 70 ? 'completed' : 'failed'}`);
    
    return NextResponse.json({
      success: true,
      data: gradeResult,
    });
  } catch (error) {
    console.error('Error grading assessment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }, { status: 500 });
  }
}

// Function to count completed tasks based on changed files and commit messages
function getTasksCompleted(prData: any): number {
  try {
    const touchedFolders = new Set<string>();
    const files = prData.files || [];
    
    // Extract folders from changed files
    for (const file of files) {
      const pathParts = file.filename.split('/');
      
      // Skip files at the root
      if (pathParts.length > 1) {
        touchedFolders.add(pathParts[0]);
      }
    }
    
    // Count commit messages with task completion indicators
    const commits = prData.commits_data || [];
    let taskMatches = 0;
    
    for (const commit of commits) {
      const message = commit.commit.message.toLowerCase();
      if (
        message.includes('complete task') || 
        message.includes('completed task') || 
        message.includes('finish task') || 
        message.includes('finished task') ||
        message.includes('implement feature') ||
        message.includes('implemented feature') ||
        message.includes('fix bug') ||
        message.includes('fixed bug')
      ) {
        taskMatches++;
      }
    }
    
    // Return the max of folder count and task mentions
    return Math.max(touchedFolders.size, taskMatches);
  } catch (error) {
    console.error('Error counting tasks:', error);
    return 0;
  }
}

// Function to analyze the pull request and generate a grade
async function analyzePullRequest(prData: any, role: string, isRegrade: boolean = false) {
  try {
    // Standardize the role first
    const standardizedRole = standardizeRoleName(role);
    console.log(`Starting PR analysis using Anthropic API for role: ${role} (standardized to ${standardizedRole})${isRegrade ? ' (regrade)' : ''}...`);
    
    // Extract code patches from files for analysis
    const files = prData.files || [];
    console.log(`Processing ${files.length} changed files for analysis...`);
    let codeSubmission = '';
    
    // Collect code patches
    for (const file of files) {
      // Skip binary files or very large changes
      if (!file.patch || file.patch.length > 50000) continue;
      
      codeSubmission += `\n\nFile: ${file.filename}\nStatus: ${file.status}\n`;
      codeSubmission += `Additions: ${file.additions}, Deletions: ${file.deletions}\n`;
      codeSubmission += `\`\`\`\n${file.patch}\n\`\`\`\n`;
    }
    
    // If the code submission is too large, truncate it
    if (codeSubmission.length > 100000) {
      codeSubmission = codeSubmission.substring(0, 100000) + '... [truncated due to size]';
    }
    
    // Add PR metadata
    const prMetadata = `
Pull Request #${prData.number}: ${prData.title}
Repository: ${prData.url.split('/pull/')[0]}
Files Changed: ${prData.changed_files}
Additions: ${prData.additions}, Deletions: ${prData.deletions}
Description: ${prData.body || 'No description provided'}
`;

    // Get commit messages
    const commitMessages = (prData.commits_data || [])
      .map((commit: any) => `- ${commit.commit.message}`)
      .join('\n');

    // Prepare the complete code for analysis
    const completeSubmission = `
# Pull Request Information
${prMetadata}

# Commit Messages:
${commitMessages}

# Code Changes:
${codeSubmission}

${isRegrade ? '# Note: This is a re-evaluation request. Please provide a fresh and thorough analysis of the code.' : ''}
`;
    
    // Use the AssessmentEvaluationService to evaluate the code
    console.log('Submitting code to AssessmentEvaluationService...');
    
    const evaluationResult = await assessmentEvaluationService.evaluateSubmission(
      completeSubmission,
      standardizedRole
    );
    
    console.log('Received evaluation result from Claude AI:', JSON.stringify(evaluationResult, null, 2).substring(0, 200) + '...');
    
    // Map criteria scores based on the role
    const { criteriaScores } = evaluationResult;
    
    // Helper function to get a score with a backup option
    const getScore = (primaryKey: string, backupKeys: string[], defaultScore = 70) => {
      if (criteriaScores[primaryKey]?.score) {
        return criteriaScores[primaryKey].score;
      }
      
      // Try backup keys
      for (const key of backupKeys) {
        if (criteriaScores[key]?.score) {
          return criteriaScores[key].score;
        }
      }
      
      return defaultScore;
    };
    
    // Helper function to get feedback with a backup option
    const getFeedback = (primaryKey: string, backupKeys: string[], defaultFeedback: string) => {
      if (criteriaScores[primaryKey]?.feedback) {
        return criteriaScores[primaryKey].feedback;
      }
      
      // Try backup keys
      for (const key of backupKeys) {
        if (criteriaScores[key]?.feedback) {
          return criteriaScores[key].feedback;
        }
      }
      
      return defaultFeedback;
    };
    
    // Role-specific mappings
    let testingScore, testingFeedback;
    let codeQualityScore, codeQualityFeedback;
    let implementationScore, implementationFeedback;
    let problemSolvingScore, problemSolvingFeedback;
    
    // For frontend roles
    if (standardizedRole === 'frontend_specialist') {
      testingScore = getScore('functionality', ['performance'], 70);
      testingFeedback = getFeedback('functionality', ['performance'], 
        "The implementation meets requirements but could benefit from more comprehensive testing.");
      
      codeQualityScore = getScore('componentArchitecture', ['userInterface'], 70);
      codeQualityFeedback = getFeedback('componentArchitecture', ['userInterface'], 
        "The code structure is well-organized but could benefit from more consistent patterns.");
      
      implementationScore = getScore('userInterface', ['componentArchitecture'], 70);
      implementationFeedback = getFeedback('userInterface', ['componentArchitecture'], 
        "Implementation effectively addresses the requirements with good attention to UI/UX details.");
      
      problemSolvingScore = getScore('performance', ['functionality'], 70);
      problemSolvingFeedback = getFeedback('performance', ['functionality'], 
        "Demonstrates good problem-solving skills with efficient approaches to frontend challenges.");
    } 
    // For backend roles
    else if (standardizedRole === 'backend_specialist') {
      testingScore = getScore('security', ['performance'], 70);
      testingFeedback = getFeedback('security', ['performance'], 
        "The implementation demonstrates good security practices but could use more comprehensive testing.");
      
      codeQualityScore = getScore('apiDesign', ['databaseDesign'], 70);
      codeQualityFeedback = getFeedback('apiDesign', ['databaseDesign'], 
        "The API design shows good practices but could benefit from more consistent patterns.");
      
      implementationScore = getScore('databaseDesign', ['apiDesign'], 70);
      implementationFeedback = getFeedback('databaseDesign', ['apiDesign'], 
        "Database design effectively addresses the requirements with good attention to data integrity.");
      
      problemSolvingScore = getScore('performance', ['security'], 70);
      problemSolvingFeedback = getFeedback('performance', ['security'], 
        "Demonstrates good problem-solving skills with efficient approaches to backend challenges.");
    } 
    // For fullstack roles
    else if (standardizedRole === 'fullstack_developer') {
      testingScore = getScore('frontendImplementation', ['backendImplementation', 'fullStackIntegration'], 70);
      testingFeedback = getFeedback('frontendImplementation', ['backendImplementation'], 
        "The implementation meets requirements but could benefit from more comprehensive testing across the stack.");
      
      codeQualityScore = getScore('backendImplementation', ['frontendImplementation', 'fullStackIntegration'], 70);
      codeQualityFeedback = getFeedback('backendImplementation', ['frontendImplementation'], 
        "The code structure is well-organized but could benefit from more consistent patterns across frontend and backend.");
      
      implementationScore = getScore('fullStackIntegration', ['frontendImplementation', 'backendImplementation'], 70);
      implementationFeedback = getFeedback('fullStackIntegration', ['frontendImplementation'], 
        "Implementation effectively addresses the requirements with good integration between frontend and backend.");
      
      problemSolvingScore = getScore('deployment', ['fullStackIntegration'], 70);
      problemSolvingFeedback = getFeedback('deployment', ['fullStackIntegration'], 
        "Demonstrates good problem-solving skills with efficient approaches to fullstack challenges.");
    }
    // For other roles (integration, devops, etc.)
    else {
      // Default mappings for other roles
      testingScore = getScore('reliability', ['security', 'performance'], 70);
      testingFeedback = getFeedback('reliability', ['security'], 
        "The implementation provides reliable functionality but could benefit from more comprehensive testing.");
      
      codeQualityScore = getScore('systemArchitecture', ['infrastructureAsCode', 'cicdPipelines'], 70);
      codeQualityFeedback = getFeedback('systemArchitecture', ['infrastructureAsCode'], 
        "The code and system structure are well-organized but could benefit from more consistent patterns.");
      
      implementationScore = getScore('security', ['containerization', 'monitoring'], 70);
      implementationFeedback = getFeedback('security', ['containerization'], 
        "Implementation effectively addresses the requirements with good attention to security and deployment details.");
      
      problemSolvingScore = getScore('performance', ['monitoring', 'reliability'], 70);
      problemSolvingFeedback = getFeedback('performance', ['monitoring'], 
        "Demonstrates good problem-solving skills with efficient approaches to system challenges.");
    }
    
    // Convert the evaluation result into the format expected by the frontend
    return {
      finalScore: evaluationResult.score,
      overallFeedback: evaluationResult.feedback,
      recommendedAction: evaluationResult.passed
        ? "Move forward with the candidate to the next stage of the interview process."
        : "Provide feedback to the candidate and suggest resubmission with improvements.",
      technicalAssessment: {
        testing: {
          score: testingScore,
          feedback: testingFeedback
        },
        codeQuality: {
          score: codeQualityScore,
          feedback: codeQualityFeedback
        },
        implementation: {
          score: implementationScore,
          feedback: implementationFeedback
        },
        problemSolving: {
          score: problemSolvingScore,
          feedback: problemSolvingFeedback
        }
      },
      strengths: evaluationResult.strengths,
      improvements: evaluationResult.improvements
    };
  } catch (error) {
    console.error('Error analyzing pull request:', error);
    throw new Error('Failed to analyze pull request code: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Helper function to standardize role name for the AssessmentEvaluationService
function standardizeRoleName(role: string): string {
  if (!role) {
    console.log("No role provided, defaulting to fullstack_developer");
    return 'fullstack_developer';
  }
  
  const roleLower = role.toLowerCase().trim();
  
  // Frontend roles
  if (roleLower.includes('frontend') || 
      roleLower.includes('front end') || 
      roleLower.includes('front-end') ||
      roleLower.includes('ui developer') ||
      roleLower.includes('react developer')) {
    console.log(`Role "${role}" matched to frontend_specialist`);
    return 'frontend_specialist';
  }
  
  // Backend roles
  if (roleLower.includes('backend') || 
      roleLower.includes('back end') || 
      roleLower.includes('back-end') ||
      roleLower.includes('server') ||
      roleLower.includes('api developer') ||
      roleLower.includes('node') ||
      roleLower.includes('java developer')) {
    console.log(`Role "${role}" matched to backend_specialist`);
    return 'backend_specialist';
  }
  
  // Fullstack roles - moved more specific roles to the top
  if (roleLower.includes('fullstack') || 
      roleLower.includes('full stack') || 
      roleLower.includes('full-stack')) {
    console.log(`Role "${role}" matched to fullstack_developer (specific match)`);
    return 'fullstack_developer';
  }
  
  // Integration roles
  if (roleLower.includes('integration') || 
      roleLower.includes('data engineer') ||
      roleLower.includes('middleware') ||
      roleLower.includes('systems engineer')) {
    console.log(`Role "${role}" matched to integration_specialist`);
    return 'integration_specialist';
  }
  
  // DevOps roles
  if (roleLower.includes('devops') || 
      roleLower.includes('dev ops') || 
      roleLower.includes('dev-ops') ||
      roleLower.includes('ops') ||
      roleLower.includes('sre') ||
      roleLower.includes('site reliability') ||
      roleLower.includes('infrastructure') ||
      roleLower.includes('platform engineer') ||
      roleLower.includes('cloud')) {
    console.log(`Role "${role}" matched to devops_engineer`);
    return 'devops_engineer';
  }
  
  // More generic roles - moved to the end to allow more specific matches above
  if (roleLower.includes('web developer') ||
      roleLower.includes('software engineer') ||
      roleLower.includes('software developer') ||
      roleLower.includes('engineer') ||
      roleLower.includes('developer')) {
    console.log(`Role "${role}" matched to fullstack_developer (generic match)`);
    return 'fullstack_developer';
  }
  
  // Default to fullstack if unknown
  console.log(`Role "${role}" not recognized, defaulting to fullstack_developer`);
  return 'fullstack_developer';
} 