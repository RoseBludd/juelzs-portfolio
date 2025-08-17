import { NextResponse } from "next/server";
import { getMainDbPool } from "@/lib/db-pool";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const grade = searchParams.get("grade");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const db = getMainDbPool();
    
    // Build WHERE conditions
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Add status filter for developers directly (not test submissions)
    if (status && status !== "all") {
      whereConditions.push(`d.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Add role filter
    if (role && role !== "all") {
      whereConditions.push(`d.role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    // Add search functionality
    if (search) {
      whereConditions.push(`(d.name ILIKE $${paramIndex} OR d.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get all developers with their most recent test submission
    const developersQuery = `
      SELECT 
        d.*,
        ts.status as submission_status,
        ts.score as submission_score,
        ts.created_at as submission_created_at
      FROM developers d
      LEFT JOIN LATERAL (
        SELECT status, score, created_at
        FROM test_submissions 
        WHERE developer_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
      ) ts ON true
      ${whereClause}
      ORDER BY d.created_at DESC
    `;

    const developersResult = await db.query(developersQuery, queryParams);
    const allDevelopers = developersResult.rows;

    // Get developer applications separately
    const developerIds = allDevelopers.map(dev => dev.id);
    const applicationMap = new Map();
    
    if (developerIds.length > 0) {
      const applicationsQuery = `
        SELECT DISTINCT ON (developer_id)
          id, developer_id, meeting_notes, interest_level, 
          last_meeting_date, next_meeting_date, whatsapp_number, 
          github_submission, status
        FROM developer_applications
        WHERE developer_id = ANY($1::uuid[])
        ORDER BY developer_id, created_at DESC
      `;
      
      const applicationsResult = await db.query(applicationsQuery, [developerIds]);
      
      // Create a map of developer_id to most recent application
      applicationsResult.rows.forEach(app => {
        if (!applicationMap.has(app.developer_id)) {
          applicationMap.set(app.developer_id, app);
        }
      });
    }
    
    // Format all developers to get their scores
    let allFormattedApplicants = allDevelopers.map((dev) => {
      const application = applicationMap.get(dev.id);
      
      // Extract GitHub submission data properly including the grade_result
      const githubSubmission = application?.github_submission ? application.github_submission as any : null;
      
      // Format the GitHub data to match the expected structure in the frontend
      const githubData = githubSubmission ? {
        url: githubSubmission.url,
        status: githubSubmission.status || "pending",
        submitted_at: githubSubmission.submitted_at,
        last_updated: githubSubmission.last_updated,
        pr_number: githubSubmission.pr_number,
        tasks_done: githubSubmission.tasks_done || 0,
        total_tasks: githubSubmission.total_tasks || 4,
        // Include grade_result field if available
        ...(githubSubmission.grade_result ? { grade_result: githubSubmission.grade_result } : {})
      } : null;
      
      // Get the appropriate score - prefer github submission grade if available
      const score = githubSubmission?.grade_result?.finalScore !== undefined
        ? githubSubmission.grade_result.finalScore
        : (dev.submission_score || null);
      
      return {
        id: application?.id || dev.id,
        name: dev.name,
        email: dev.email,
        role: dev.role,
        // Use developer status as the primary status value
        status: dev.status || "pending",
        submittedAt: (dev.created_at || new Date()).toISOString(),
        score,
        meetingNotes: application?.meeting_notes || null,
        interestLevel: application?.interest_level || "undecided",
        lastMeetingDate: application?.last_meeting_date
          ? application.last_meeting_date.toISOString()
          : null,
        nextMeetingDate: application?.next_meeting_date
          ? application.next_meeting_date.toISOString()
          : null,
        whatsappNumber: application?.whatsapp_number || null,
        github_submission: githubData,
        // Include application status separately if needed
        applicationStatus: application?.status || "pending",
      };
    });

    // Filter by grade if specified (filtering all results)
    if (grade && grade !== "all") {
      allFormattedApplicants = allFormattedApplicants.filter(applicant => {
        const score = applicant.score;
        
        switch(grade) {
          case "graded":
            return score !== null;
          case "ungraded":
            return score === null;
          default:
            return true;
        }
      });
    }

    // Get total count after filtering
    const totalFilteredCount = allFormattedApplicants.length;
    
    // Apply pagination to the filtered results
    const paginatedApplicants = allFormattedApplicants.slice(skip, skip + limit);
    
    // Calculate total pages based on filtered count
    const totalPages = Math.ceil(totalFilteredCount / limit);

    // Return the formatted response
    return NextResponse.json({ 
      data: paginatedApplicants,
      totalItems: totalFilteredCount,
      totalPages,
      currentPage: page 
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}

// Add PUT endpoint to update meeting notes and interest level
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      applicationId,
      meetingNotes,
      interestLevel,
      lastMeetingDate,
      nextMeetingDate,
    } = body;

    const db = getMainDbPool();
    
    const updateQuery = `
      UPDATE developer_applications
      SET 
        meeting_notes = $1,
        interest_level = $2,
        last_meeting_date = $3,
        next_meeting_date = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      meetingNotes,
      interestLevel,
      lastMeetingDate ? new Date(lastMeetingDate) : null,
      nextMeetingDate ? new Date(nextMeetingDate) : null,
      applicationId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Application not found" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating applicant:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update applicant" 
      },
      { status: 500 }
    );
  }
}
