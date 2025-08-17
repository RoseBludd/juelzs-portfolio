import { NextResponse } from "next/server";

import { getMainDbPool } from "@/lib/db-pool";

export async function GET() {
  try {
    // Fallback data for test submissions
    const recentSubmissionsCount = 0;
    const pendingReviewsCount = 0;
    const mockScores: any[] = [];
    const mockRecentActivity: any[] = [];

    /* Commented out for deployment
    const recentSubmissions = await prisma.test_submissions.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const pendingReviews = await prisma.test_submissions.count({
      where: {
        status: "pending",
      },
    });

    const scores = await prisma.test_submissions.findMany({
      where: {
        status: "completed",
      },
      orderBy: {
        score: "desc",
      },
      take: 5,
      include: {
        developer: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const recentActivity = await prisma.test_submissions.findMany({
      take: 10,
      orderBy: {
        created_at: "desc",
      },
      include: {
        developer: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });
    */

    // Get active developers count
    const db = getMainDbPool();
    const activeDevelopersResult = await db.query(`
      SELECT COUNT(DISTINCT id) as count
      FROM developers
      WHERE status = 'active'
    `);
    
    const activeDevelopers = Number(activeDevelopersResult.rows[0]?.count || 0);

    return NextResponse.json({
      recentSubmissions: recentSubmissionsCount,
      pendingReviews: pendingReviewsCount,
      topScores: mockScores,
      recentActivity: mockRecentActivity,
      activeDevelopers,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
