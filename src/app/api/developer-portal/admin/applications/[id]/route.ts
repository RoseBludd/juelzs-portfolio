import { NextResponse } from "next/server";
import { z } from "zod";
import { getMainDbPool } from "@/lib/db-pool";

const updateApplicationSchema = z.object({
  meetingNotes: z.string().optional(),
  interestLevel: z
    .enum(["interested", "not_interested", "undecided"])
    .optional(),
  lastMeetingDate: z.string().datetime().optional(),
  nextMeetingDate: z.string().datetime().optional(),
  status: z.enum(["pending", "active", "inactive", "rejected"]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateApplicationSchema.parse(body);

    const db = getMainDbPool();
    
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    if (validatedData.meetingNotes !== undefined) {
      updateFields.push(`meeting_notes = $${paramIndex}`);
      updateValues.push(validatedData.meetingNotes);
      paramIndex++;
    }
    
    if (validatedData.interestLevel !== undefined) {
      updateFields.push(`interest_level = $${paramIndex}`);
      updateValues.push(validatedData.interestLevel);
      paramIndex++;
    }
    
    if (validatedData.lastMeetingDate !== undefined) {
      updateFields.push(`last_meeting_date = $${paramIndex}`);
      updateValues.push(validatedData.lastMeetingDate ? new Date(validatedData.lastMeetingDate) : null);
      paramIndex++;
    }
    
    if (validatedData.nextMeetingDate !== undefined) {
      updateFields.push(`next_meeting_date = $${paramIndex}`);
      updateValues.push(validatedData.nextMeetingDate ? new Date(validatedData.nextMeetingDate) : null);
      paramIndex++;
    }
    
    if (validatedData.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(validatedData.status);
      paramIndex++;
    }
    
    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(params.id);
    
    // Build and execute the update query
    const updateQuery = `
      UPDATE developer_applications 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const updateResult = await db.query(updateQuery, updateValues);
    const application = updateResult.rows[0];
    
    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }
    
    // Get the associated developer info
    let developer = null;
    if (application.developer_id) {
      const developerQuery = `
        SELECT * FROM developers WHERE id = $1
      `;
      const developerResult = await db.query(developerQuery, [application.developer_id]);
      developer = developerResult.rows[0];
    }
    
    const responseData = {
      ...application,
      developers: developer
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error("Application update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update application. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Fetching application with ID: ${params.id}`);
    
    const db = getMainDbPool();
    
    // Get application with developer info and test submissions
    const applicationQuery = `
      SELECT 
        da.*,
        d.id as developer_id,
        d.name as developer_name,
        d.email as developer_email,
        d.phone as developer_phone,
        d.role as developer_role,
        d.status as developer_status,
        d.profile_picture_url as developer_profile_picture_url,
        ts.id as test_submission_id,
        ts.status as test_submission_status,
        ts.score as test_submission_score,
        ts.started_at as test_submission_started_at,
        ts.completed_at as test_submission_completed_at,
        ts.ai_feedback as test_submission_ai_feedback,
        ts.answers as test_submission_answers,
        ts.created_at as test_submission_created_at,
        ts.updated_at as test_submission_updated_at
      FROM developer_applications da
      LEFT JOIN developers d ON da.developer_id = d.id
      LEFT JOIN LATERAL (
        SELECT id, status, score, started_at, completed_at, ai_feedback, answers, created_at, updated_at
        FROM test_submissions 
        WHERE developer_id = da.developer_id
        ORDER BY created_at DESC
        LIMIT 1
      ) ts ON true
      WHERE da.id = $1
    `;
    
    const applicationResult = await db.query(applicationQuery, [params.id]);
    const application = applicationResult.rows[0];

    if (!application) {
      console.log(`Application not found with ID: ${params.id}`);
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }

    // Format the response to match the expected structure
    const formattedApplication = {
      id: application.id,
      developer_id: application.developer_id,
      position: application.position,
      status: application.status,
      github_submission: application.github_submission,
      meeting_notes: application.meeting_notes,
      interest_level: application.interest_level,
      last_meeting_date: application.last_meeting_date,
      next_meeting_date: application.next_meeting_date,
      whatsapp_number: application.whatsapp_number,
      portfolio_url: application.portfolio_url,
      time_spent: application.time_spent,
      test_results: application.test_results,
      code_review: application.code_review,
      created_at: application.created_at,
      updated_at: application.updated_at,
      developers: application.developer_id ? {
        id: application.developer_id,
        name: application.developer_name,
        email: application.developer_email,
        phone: application.developer_phone,
        role: application.developer_role,
        status: application.developer_status,
        profile_picture_url: application.developer_profile_picture_url,
      } : null,
      test_submissions: application.test_submission_id ? [{
        id: application.test_submission_id,
        status: application.test_submission_status,
        score: application.test_submission_score,
        started_at: application.test_submission_started_at,
        completed_at: application.test_submission_completed_at,
        ai_feedback: application.test_submission_ai_feedback,
        answers: application.test_submission_answers,
        created_at: application.test_submission_created_at,
        updated_at: application.test_submission_updated_at,
      }] : []
    };

    console.log(`Successfully fetched application with ID: ${params.id}`);
    return NextResponse.json({
      success: true,
      data: formattedApplication,
    });
  } catch (error) {
    console.error("Application fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch application. Please try again later.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
