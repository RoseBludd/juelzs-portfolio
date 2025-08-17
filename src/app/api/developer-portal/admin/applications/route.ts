import { NextResponse } from "next/server";
import { getMainDbPool } from "@/lib/db-pool";

export const dynamic = "force-dynamic";

interface GithubSubmission {
  url: string;
  status: "pending" | "passed" | "failed";
  submitted_at: string;
  last_updated: string;
  pr_number: number;
  tasks_done: number;
  total_tasks: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const db = getMainDbPool();

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      whereConditions.push(`da.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (role && role !== "all") {
      whereConditions.push(`da.position = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(d.name ILIKE $${paramIndex} OR d.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get applications with developer info and test submissions
    const applicationsQuery = `
      SELECT 
        da.*,
        d.id as developer_id,
        d.name as developer_name,
        d.email as developer_email,
        d.role as developer_role,
        ts.status as test_submission_status,
        ts.score as test_submission_score,
        COUNT(*) OVER() as total_count
      FROM developer_applications da
      LEFT JOIN developers d ON da.developer_id = d.id
      LEFT JOIN LATERAL (
        SELECT status, score, created_at
        FROM test_submissions 
        WHERE developer_id = da.developer_id
        ORDER BY created_at DESC
        LIMIT 1
      ) ts ON true
      ${whereClause}
      ORDER BY da.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const applicationsResult = await db.query(applicationsQuery, queryParams);
    const applications = applicationsResult.rows;

    if (!applications || applications.length === 0) {
      return new NextResponse(
        JSON.stringify({ 
          data: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: page
        }), 
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const totalCount = parseInt(applications[0]?.total_count || '0');

    const formattedApplications = applications.map((app) => {
      // Parse GitHub submission data if it exists
      const githubSubmission = app.github_submission;
      const githubData = githubSubmission
        ? {
            submissionUrl: (githubSubmission as GithubSubmission).url,
            status: (githubSubmission as GithubSubmission).status || "pending",
            submittedAt: (githubSubmission as GithubSubmission).submitted_at,
            lastUpdated: (githubSubmission as GithubSubmission).last_updated,
            prNumber: (githubSubmission as GithubSubmission).pr_number,
            tasksDone: (githubSubmission as GithubSubmission).tasks_done || 0,
            totalTasks: (githubSubmission as GithubSubmission).total_tasks || 4,
          }
        : null;

      return {
        id: app.id,
        name: app.developer_name || "",
        email: app.developer_email || "",
        role: app.position,
        status: app.status || "pending",
        submittedAt: app.created_at
          ? app.created_at.toISOString()
          : new Date().toISOString(),
        score: app.test_submission_score || null,
        meetingNotes: app.meeting_notes || null,
        interestLevel: app.interest_level || "undecided",
        lastMeetingDate: app.last_meeting_date?.toISOString() || null,
        nextMeetingDate: app.next_meeting_date?.toISOString() || null,
        whatsappNumber: app.whatsapp_number || null,
        github_submission: githubData,
      };
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    return new NextResponse(
      JSON.stringify({ 
        data: formattedApplications,
        totalItems: totalCount,
        totalPages,
        currentPage: page 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching applications:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch applications" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
