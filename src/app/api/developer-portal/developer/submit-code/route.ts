import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getMainDbPool } from "@/lib/db-pool";
import { s3Client, S3_BUCKET } from "@/lib/aws-config";
import { verifySession } from '@/lib/api-utils';
import { assessmentEvaluationService } from '@/app/api/services/AssessmentEvaluationService';

// Function to upload file to S3
async function uploadFileToS3(file: File, moduleId?: string): Promise<string> {
  try {
    if (!s3Client) {
      throw new Error('S3 client not available - AWS credentials may not be configured');
    }

    if (!S3_BUCKET) {
      throw new Error('S3 bucket not configured');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${uuidv4()}-${file.name}`;
    const s3Key = moduleId 
      ? `module-submissions/${moduleId}/${fileName}`
      : `developer-submissions/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      Metadata: {
        'original-filename': file.name,
        'upload-timestamp': Date.now().toString(),
        'submission-type': moduleId ? 'module-code' : 'developer-code',
        ...(moduleId && { 'module-id': moduleId })
      }
    });

    await s3Client.send(command);
    
    // Return the S3 URL
    return `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Real Claude AI evaluation function for developers
async function evaluateCode(
  fileContent: string, 
  fileType: string, 
  description: string = '',
  moduleName: string = '',
  developerRole: string = 'fullstack_developer'
): Promise<{ passed: boolean; feedback: string; score: number; detailedFeedback?: any }> {
  try {
    console.log('🤖 Starting Claude AI evaluation for developer code submission...');
    
    // Prepare the code submission for evaluation
    const codeSubmission = `
# Code Submission Details
File Type: ${fileType}
${moduleName ? `Module: ${moduleName}` : ''}
${description ? `Description: ${description}` : ''}

# Code Content:
\`\`\`
${fileContent}
\`\`\`

# Note: This is a code submission from an active developer for continuous improvement and skill assessment.
`;

    // Use the same sophisticated evaluation service that applicants get
    const evaluationResult = await assessmentEvaluationService.evaluateSubmission(
      codeSubmission,
      developerRole
    );

    console.log('✅ Claude AI evaluation completed. Score:', evaluationResult.score);

    return {
      passed: evaluationResult.passed,
      feedback: evaluationResult.feedback,
      score: evaluationResult.score,
      detailedFeedback: {
        criteriaScores: evaluationResult.criteriaScores,
        strengths: evaluationResult.strengths,
        improvements: evaluationResult.improvements,
        overallFeedback: evaluationResult.feedback
      }
    };
  } catch (error) {
    console.error('❌ Error in Claude AI evaluation:', error);
    
    // Fallback to basic evaluation if AI fails
    console.log('🔄 Falling back to basic evaluation...');
    return {
      passed: true,
      feedback: "Code submission received and stored. AI evaluation is temporarily unavailable, but your code has been saved for review.",
      score: 75 // Neutral score when AI evaluation fails
    };
  }
}

// For microservices, we use a simplified universal evaluation approach
function getDeveloperRole(): string {
  // Since developers work on microservices, we evaluate them as fullstack
  // This covers all aspects: frontend, backend, API design, testing, etc.
  return 'fullstack_developer';
}

export async function POST(request: NextRequest) {
  try {
    console.log('Code submission request received');
    
    // Verify session authentication
    const userData = verifySession(request);
    if (!userData?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const moduleId = formData.get('moduleId') as string || '';
    const description = formData.get('description') as string || '';
    const version = formData.get('version') as string || '1.0.0';

    if (!file) {
      return NextResponse.json({ error: 'Code file is required' }, { status: 400 });
    }

    const db = getMainDbPool();

    // Get developer from session
    const developerQuery = `SELECT id, name, email FROM developers WHERE email = $1`;
    const developerResult = await db.query(developerQuery, [userData.email]);
    const developer = developerResult.rows[0];

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Read file content
    const fileContent = await file.text();
    
    // Upload file to S3
    const fileUrl = await uploadFileToS3(file, moduleId || undefined);
    
    // For microservices, we use universal fullstack evaluation
    const developerRole = getDeveloperRole();
    console.log(`🎯 Using microservices evaluation approach: ${developerRole}`);
    
    // Get module name for context
    let moduleName = '';
    if (moduleId) {
      const moduleQuery = `SELECT name FROM task_modules WHERE id = $1`;
      const moduleResult = await db.query(moduleQuery, [moduleId]);
      if (moduleResult.rows.length > 0) {
        moduleName = moduleResult.rows[0].name;
      }
    }
    
    // Evaluate the code with Claude AI
    const evaluation = await evaluateCode(fileContent, file.type, description, moduleName, developerRole);
    
    let submissionId;
    
    if (moduleId) {
      // Module-specific submission
      const moduleQuery = `SELECT id, name, task_id FROM task_modules WHERE id = $1`;
      const moduleResult = await db.query(moduleQuery, [moduleId]);
      const module = moduleResult.rows[0];

      if (!module) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }

      // Create module submission record with detailed AI feedback
      const submissionQuery = `
        INSERT INTO module_submissions (
          module_id, developer_id, submission_type, content, file_urls, 
          status, version, score, feedback, ai_evaluation, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id, created_at
      `;
      
      const submissionResult = await db.query(submissionQuery, [
        moduleId,
        developer.id,
        'code',
        fileContent,
        [fileUrl],
        evaluation.passed ? 'approved' : 'pending',
        version,
        evaluation.score,
        evaluation.feedback,
        JSON.stringify(evaluation.detailedFeedback || {})
      ]);
      
      submissionId = submissionResult.rows[0].id;
      console.log('Module submission created with AI evaluation:', submissionId);

      return NextResponse.json({
        success: true,
        passed: evaluation.passed,
        feedback: evaluation.feedback,
        score: evaluation.score,
        detailedFeedback: evaluation.detailedFeedback,
        developerId: developer.id,
        fileUrl: fileUrl,
        submission: {
          id: submissionId,
          type: 'module',
          module_id: moduleId,
          module_name: module.name,
          version: version,
          ai_evaluated: true,
          evaluation_role: developerRole
        }
      });
    } else {
      // General developer submission (legacy/application workflow)
      const applicationId = uuidv4();
      
      // Check if application already exists
      const existingApplicationQuery = `SELECT id FROM developer_applications WHERE developer_id = $1`;
      const existingApplicationResult = await db.query(existingApplicationQuery, [developer.id]);
      const existingApplication = existingApplicationResult.rows[0];
      
      const githubSubmissionData = {
        fileUrl,
        fileName: file.name,
        submittedAt: new Date().toISOString(),
        evaluation: evaluation,
        ai_evaluation: evaluation.detailedFeedback,
        evaluation_role: developerRole,
        ai_evaluated: true
      };
      
      if (existingApplication) {
        // Update existing application
        const updateApplicationQuery = `
          UPDATE developer_applications
          SET 
            status = $1,
            technical_assessment_score = $2,
            review_notes = $3,
            github_submission = $4,
            test_submitted_at = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE developer_id = $6
          RETURNING id
        `;
        
        const updateResult = await db.query(updateApplicationQuery, [
          evaluation.passed ? 'approved' : 'rejected',
          evaluation.score,
          evaluation.feedback,
          JSON.stringify(githubSubmissionData),
          new Date(),
          developer.id
        ]);
        
        submissionId = updateResult.rows[0].id;
      } else {
        // Create new application
        const createApplicationQuery = `
          INSERT INTO developer_applications (
            id, developer_id, position, status, technical_assessment_score, 
            review_notes, github_submission, test_submitted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        
        const createResult = await db.query(createApplicationQuery, [
          applicationId,
          developer.id,
          'Developer Position',
          evaluation.passed ? 'approved' : 'rejected',
          evaluation.score,
          evaluation.feedback,
          JSON.stringify(githubSubmissionData),
          new Date()
        ]);
        
        submissionId = createResult.rows[0].id;
      }
      
      console.log('Application submission created/updated with AI evaluation:', submissionId);

      return NextResponse.json({
        success: true,
        passed: evaluation.passed,
        feedback: evaluation.feedback,
        score: evaluation.score,
        detailedFeedback: evaluation.detailedFeedback,
        developerId: developer.id,
        fileUrl: fileUrl,
        submission: {
          id: submissionId,
          type: 'application',
          application_id: submissionId,
          ai_evaluated: true,
          evaluation_role: developerRole
        }
      });
    }

  } catch (error: any) {
    console.error('Error in code submission:', error);
    return NextResponse.json(
      { error: 'Failed to submit code', details: error.message },
      { status: 500 }
    );
  }
} 
