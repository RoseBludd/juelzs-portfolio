import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMainDbPool } from "@/lib/db-pool";

// Ensure route is always dynamically evaluated and not cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Validation schema for the grade result
const gradeResultSchema = z.object({
  assessmentId: z.string(),
  status: z.string().optional(),
  gradeResult: z.object({
    finalScore: z.number(),
    overallFeedback: z.string(),
    recommendedAction: z.string(),
    technicalAssessment: z.object({
      testing: z.object({
        score: z.number(),
        feedback: z.string(),
      }),
      codeQuality: z.object({
        score: z.number(),
        feedback: z.string(),
      }),
      implementation: z.object({
        score: z.number(),
        feedback: z.string(),
      }),
      problemSolving: z.object({
        score: z.number(),
        feedback: z.string(),
      }),
    }),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
  }),
});

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('id');
    
    if (!applicantId) {
      return NextResponse.json({
        success: false,
        error: 'Missing applicant ID parameter',
      }, { status: 400 });
    }
    
    const body = await request.json();
    const validatedData = gradeResultSchema.parse(body);
    
    const db = getMainDbPool();
    
    // Find the application with test submissions
    const applicationQuery = `
      SELECT da.*, 
             ts.id as test_submission_id,
             ts.score as test_submission_score,
             ts.status as test_submission_status
      FROM developer_applications da
      LEFT JOIN LATERAL (
        SELECT id, score, status, created_at
        FROM test_submissions 
        WHERE developer_id = da.developer_id
        ORDER BY created_at DESC
        LIMIT 1
      ) ts ON true
      WHERE da.id = $1
    `;
    
    const applicationResult = await db.query(applicationQuery, [applicantId]);
    const application = applicationResult.rows[0];
    
    if (!application) {
      return NextResponse.json({
        success: false,
        error: 'Application not found',
      }, { status: 404 });
    }
    
    // Determine the status to use
    const applicationStatus = validatedData.status || 
      (validatedData.gradeResult.finalScore >= 70 ? 'active' : 'rejected');
    
    // Create the github submission data
    const existingGithubSubmission = application.github_submission || {};
    const updatedGithubSubmission = {
      ...existingGithubSubmission,
      graded: true,
      grade_result: validatedData.gradeResult,
      status: validatedData.gradeResult.finalScore >= 70 ? 'completed' : 'failed',
      last_updated: new Date().toISOString(),
    };
    
    // Update the application with the assessment results
    const updateApplicationQuery = `
      UPDATE developer_applications 
      SET 
        status = $1,
        github_submission = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    
    await db.query(updateApplicationQuery, [
      applicationStatus,
      JSON.stringify(updatedGithubSubmission),
      applicantId
    ]);
    
    // Check if there's a related test submission to update
    if (application.test_submission_id) {
      const updateTestSubmissionQuery = `
        UPDATE test_submissions 
        SET 
          ai_feedback = $1,
          score = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `;
      
      const aiFeedback = {
        finalScore: validatedData.gradeResult.finalScore,
        overallFeedback: validatedData.gradeResult.overallFeedback,
        recommendedAction: validatedData.gradeResult.recommendedAction,
        technicalAssessment: validatedData.gradeResult.technicalAssessment,
        strengths: validatedData.gradeResult.strengths,
        improvements: validatedData.gradeResult.improvements,
      };
      
      const testStatus = validatedData.gradeResult.finalScore >= 70 ? 'completed' : 'failed';
      
      await db.query(updateTestSubmissionQuery, [
        JSON.stringify(aiFeedback),
        validatedData.gradeResult.finalScore,
        testStatus,
        application.test_submission_id
      ]);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Assessment results saved successfully',
        applicationId: applicantId,
        status: applicationStatus
      },
    });
  } catch (error) {
    console.error('Error saving assessment results:', error);
    
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