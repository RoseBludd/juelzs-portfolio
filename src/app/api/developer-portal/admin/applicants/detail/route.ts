import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from "@/lib/db-pool";

// Ensure route is always dynamically evaluated and not cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Get the applicantId from query parameters
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('id');

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Missing applicant ID parameter' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching applicant details for ID: ${applicantId}`);

    const db = getMainDbPool();

    // Get the developer application with test submissions
    const applicationQuery = `
      SELECT 
        da.*,
        ts.id as test_submission_id,
        ts.score as test_submission_score,
        ts.status as test_submission_status,
        ts.created_at as test_submission_created_at
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
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get the associated developer separately
    let developer = null;
    if (application.developer_id) {
      const developerQuery = `
        SELECT id, name, email, phone, role, profile_picture_url
        FROM developers
        WHERE id = $1
      `;
      
      const developerResult = await db.query(developerQuery, [application.developer_id]);
      developer = developerResult.rows[0];
    }

    // Safely extract properties with type safety
    const formattedApplication = {
      success: true,
      data: {
        id: application.id,
        status: application.status,
        position: application.position,
        applicationDate: application.created_at,
        lastMeetingDate: application.last_meeting_date,
        nextMeetingDate: application.next_meeting_date,
        meetingNotes: application.meeting_notes,
        interestLevel: application.interest_level,
        // Add direct properties that are expected in the frontend
        name: developer?.name || "",
        email: developer?.email || "",
        role: developer?.role || application.position || "",
        whatsappNumber: application.whatsapp_number || null,
        applicationStatus: application.status || "pending",
        submittedAt: application.submitted_at || application.created_at?.toISOString() || null,
        // Developers sub-object
        developers: developer ? {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          phone: developer.phone,
          role: developer.role,
          profile_picture_url: developer.profile_picture_url
        } : null,
        score: application.test_submission_score || null,
        // Additional properties
        portfolioUrl: application.portfolio_url || null,
        timeSpent: application.time_spent || null,
        github_submission: application.github_submission || null,
        testResults: application.test_submission_id ? {
          status: application.test_submission_status || 'unknown',
          details: application.test_results || null,
        } : null,
        codeReview: application.code_review || null
      }
    };

    return NextResponse.json(formattedApplication);
  } catch (error) {
    console.error('Error fetching applicant details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the applicantId from query parameters
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('id');

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Missing applicant ID parameter' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();

    const db = getMainDbPool();
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    if (body.meetingNotes !== undefined) {
      updateFields.push(`meeting_notes = $${paramIndex}`);
      updateValues.push(body.meetingNotes);
      paramIndex++;
    }
    
    if (body.interestLevel !== undefined) {
      updateFields.push(`interest_level = $${paramIndex}`);
      updateValues.push(body.interestLevel);
      paramIndex++;
    }
    
    if (body.lastMeetingDate !== undefined) {
      updateFields.push(`last_meeting_date = $${paramIndex}`);
      updateValues.push(body.lastMeetingDate ? new Date(body.lastMeetingDate) : null);
      paramIndex++;
    }
    
    if (body.nextMeetingDate !== undefined) {
      updateFields.push(`next_meeting_date = $${paramIndex}`);
      updateValues.push(body.nextMeetingDate ? new Date(body.nextMeetingDate) : null);
      paramIndex++;
    }
    
    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(body.status);
      paramIndex++;
    }
    
    // Handle role updates
    if (body.role !== undefined && body.role && body.role.trim() !== '') {
      console.log(`Updating role to: ${body.role}`);
      updateFields.push(`position = $${paramIndex}`);
      updateValues.push(body.role);
      paramIndex++;
    }
    
    // Handle GitHub submission updates
    if (body.github_submission !== undefined) {
      // Get the current application to merge with existing github_submission
      const existingApplicationQuery = `
        SELECT github_submission FROM developer_applications WHERE id = $1
      `;
      
      const existingResult = await db.query(existingApplicationQuery, [applicantId]);
      const existingApplication = existingResult.rows[0];
      
      const existingSubmission = existingApplication?.github_submission || {};
      
      // Create updated github_submission object
      const updatedGithubSubmission = {
        ...existingSubmission,
        ...body.github_submission,
      };
      
      // Validate PR link if it exists
      if (updatedGithubSubmission.pr_link) {
        const prLinkString = String(updatedGithubSubmission.pr_link);
        
        // Simple validation - must be a GitHub URL with PR format
        const isValidGithubPrUrl = /^https:\/\/github\.com\/.*\/pull\/\d+/.test(prLinkString);
        
        if (!isValidGithubPrUrl) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Invalid GitHub PR link format. Expected: https://github.com/owner/repo/pull/number' 
            },
            { status: 400 }
          );
        }
      }
      
      // Update the github_submission field
      updateFields.push(`github_submission = $${paramIndex}`);
      updateValues.push(JSON.stringify(updatedGithubSubmission));
      paramIndex++;
    }

    // Get the application to find the associated developer
    const applicationQuery = `
      SELECT developer_id, status FROM developer_applications WHERE id = $1
    `;
    
    const applicationResult = await db.query(applicationQuery, [applicantId]);
    const application = applicationResult.rows[0];

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application if there are fields to update
    let updatedApplication = null;
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(applicantId);
      
      const updateQuery = `
        UPDATE developer_applications
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const updateResult = await db.query(updateQuery, updateValues);
      updatedApplication = updateResult.rows[0];
    }

    // If status is being changed to "active", also update the developer status
    if (body.status === "active" && application.developer_id) {
      console.log(`Setting developer ${application.developer_id} to active status`);
      
      const updateDeveloperStatusQuery = `
        UPDATE developers 
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      await db.query(updateDeveloperStatusQuery, [application.developer_id]);
    }
    
    // If role is being updated and a developer_id exists, update the developer's role as well
    if (body.role !== undefined && application.developer_id) {
      console.log(`Updating developer ${application.developer_id} role to: ${body.role}`);
      
      const updateDeveloperRoleQuery = `
        UPDATE developers 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await db.query(updateDeveloperRoleQuery, [body.role, application.developer_id]);
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedApplication || application
    });

  } catch (error) {
    console.error('Error updating applicant:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
} 