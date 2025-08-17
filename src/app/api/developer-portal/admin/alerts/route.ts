import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from "@/lib/db-pool";

const mainDb = getMainDbPool();

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  developerId?: string;
  developerName?: string;
  actionRequired: boolean;
  timestamp: Date;
  data?: any;
}

async function generateAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Focus on the 5 main developers we track
  const targetDevelopers = ['junniel', 'adrian', 'alfredo', 'enrique', 'francis'];

  try {
    // 1. Check for developers with very low work hours today
    const lowWorkHours = await mainDb.query(`
      SELECT 
        d.id,
        d.name,
        COALESCE(SUM(dws.total_work_minutes), 0) as total_minutes
      FROM developers d
      LEFT JOIN developer_work_sessions dws ON d.id = dws.developer_id 
        AND DATE(dws.start_time) = CURRENT_DATE
      WHERE LOWER(d.name) = ANY($1::text[])
      GROUP BY d.id, d.name
      HAVING COALESCE(SUM(dws.total_work_minutes), 0) < 240  -- Less than 4 hours
      ORDER BY total_minutes ASC;
    `, [targetDevelopers]);

    lowWorkHours.rows.forEach(dev => {
      const hours = (dev.total_minutes / 60).toFixed(1);
      alerts.push({
        id: `low-hours-${dev.id}`,
        type: dev.total_minutes === 0 ? 'critical' : 'warning',
        title: `Low Work Hours: ${dev.name}`,
        message: `Only ${hours} hours logged today. Expected: 6-8 hours.`,
        developerId: dev.id,
        developerName: dev.name,
        actionRequired: true,
        timestamp: new Date(),
        data: { hours: parseFloat(hours), expected: 8 }
      });
    });

    // 2. Check for developers with no code submissions in last 24 hours
    const noSubmissions = await mainDb.query(`
      SELECT 
        d.id,
        d.name,
        COALESCE(COUNT(ms.id), 0) as submission_count
      FROM developers d
      LEFT JOIN module_submissions ms ON d.id = ms.developer_id 
        AND ms.submission_type = 'code'
        AND DATE(ms.created_at) >= CURRENT_DATE - INTERVAL '1 day'
      WHERE LOWER(d.name) = ANY($1::text[])
      GROUP BY d.id, d.name
      HAVING COALESCE(COUNT(ms.id), 0) = 0;
    `, [targetDevelopers]);

    noSubmissions.rows.forEach(dev => {
      alerts.push({
        id: `no-submissions-${dev.id}`,
        type: 'warning',
        title: `No Code Submissions: ${dev.name}`,
        message: `No code submissions in the last 24 hours. Check progress.`,
        developerId: dev.id,
        developerName: dev.name,
        actionRequired: true,
        timestamp: new Date(),
        data: { days: 1 }
      });
    });

    // 3. Check for developers with very low submission scores
    const lowScores = await mainDb.query(`
      SELECT 
        d.id,
        d.name,
        AVG(ms.score) as avg_score,
        COUNT(ms.id) as submission_count
      FROM developers d
      JOIN module_submissions ms ON d.id = ms.developer_id
      WHERE LOWER(d.name) = ANY($1::text[])
        AND ms.submission_type = 'code'
        AND ms.score IS NOT NULL
        AND DATE(ms.created_at) >= CURRENT_DATE - INTERVAL '3 days'
      GROUP BY d.id, d.name
      HAVING AVG(ms.score) < 60 AND COUNT(ms.id) >= 2;
    `, [targetDevelopers]);

    lowScores.rows.forEach(dev => {
      alerts.push({
        id: `low-scores-${dev.id}`,
        type: 'warning',
        title: `Low Submission Scores: ${dev.name}`,
        message: `Average score ${Math.round(dev.avg_score)}/100 over last 3 days. May need support.`,
        developerId: dev.id,
        developerName: dev.name,
        actionRequired: true,
        timestamp: new Date(),
        data: { score: Math.round(dev.avg_score), submissions: dev.submission_count }
      });
    });

    // 4. Check for developers with missing daily goals
    const missingGoals = await mainDb.query(`
      SELECT 
        d.id,
        d.name,
        COALESCE(COUNT(cc.id), 0) as cursor_chats,
        COALESCE(COUNT(ms.id), 0) as submissions
      FROM developers d
      LEFT JOIN cursor_chats cc ON d.id = cc.developer_id 
        AND DATE(cc.upload_date) = CURRENT_DATE
      LEFT JOIN module_submissions ms ON d.id = ms.developer_id 
        AND ms.submission_type = 'code'
        AND DATE(ms.created_at) = CURRENT_DATE
      WHERE LOWER(d.name) = ANY($1::text[])
      GROUP BY d.id, d.name
      HAVING COALESCE(COUNT(cc.id), 0) = 0 OR COALESCE(COUNT(ms.id), 0) = 0;
    `, [targetDevelopers]);

    missingGoals.rows.forEach(dev => {
      const missing = [];
      if (dev.cursor_chats === 0) missing.push('cursor chats');
      if (dev.submissions === 0) missing.push('code submissions');
      
      alerts.push({
        id: `missing-goals-${dev.id}`,
        type: 'info',
        title: `Missing Daily Goals: ${dev.name}`,
        message: `Missing: ${missing.join(', ')} for today.`,
        developerId: dev.id,
        developerName: dev.name,
        actionRequired: false,
        timestamp: new Date(),
        data: { missing, cursor_chats: dev.cursor_chats, submissions: dev.submissions }
      });
    });

    // 5. Check for high-performing developers (positive alerts)
    const highPerformers = await mainDb.query(`
      SELECT 
        d.id,
        d.name,
        COALESCE(SUM(dws.total_work_minutes), 0) as work_minutes,
        AVG(ms.score) as avg_score,
        COUNT(ms.id) as submission_count
      FROM developers d
      LEFT JOIN developer_work_sessions dws ON d.id = dws.developer_id 
        AND DATE(dws.start_time) = CURRENT_DATE
      LEFT JOIN module_submissions ms ON d.id = ms.developer_id
        AND ms.submission_type = 'code'
        AND DATE(ms.created_at) = CURRENT_DATE
        AND ms.score IS NOT NULL
      WHERE LOWER(d.name) = ANY($1::text[])
      GROUP BY d.id, d.name
      HAVING COALESCE(SUM(dws.total_work_minutes), 0) >= 480  -- 8+ hours
        AND AVG(ms.score) >= 85  -- High scores
        AND COUNT(ms.id) >= 2;   -- Multiple submissions
    `, [targetDevelopers]);

    highPerformers.rows.forEach(dev => {
      alerts.push({
        id: `high-performer-${dev.id}`,
        type: 'success',
        title: `High Performance: ${dev.name}`,
        message: `Excellent work today! ${(dev.work_minutes/60).toFixed(1)}h worked, ${Math.round(dev.avg_score)}/100 avg score.`,
        developerId: dev.id,
        developerName: dev.name,
        actionRequired: false,
        timestamp: new Date(),
        data: { hours: (dev.work_minutes/60).toFixed(1), score: Math.round(dev.avg_score) }
      });
    });

    // 6. System-level alerts for our 5 main developers
    const totalActiveDevs = await mainDb.query(`
      SELECT COUNT(*) as count 
      FROM developers 
      WHERE LOWER(name) = ANY($1::text[]);
    `, [targetDevelopers]);

    const workingToday = await mainDb.query(`
      SELECT COUNT(DISTINCT d.id) as count
      FROM developers d
      JOIN developer_work_sessions dws ON d.id = dws.developer_id
      WHERE LOWER(d.name) = ANY($1::text[])
        AND DATE(dws.start_time) = CURRENT_DATE;
    `, [targetDevelopers]);

    const activeCount = parseInt(totalActiveDevs.rows[0].count);
    const workingCount = parseInt(workingToday.rows[0].count);
    const workingPercentage = activeCount > 0 ? ((workingCount / activeCount) * 100) : 0;

    if (workingPercentage < 60) {  // Adjusted threshold for 5 developers
      alerts.push({
        id: 'low-team-activity',
        type: 'warning',
        title: 'Low Main Developer Activity',
        message: `Only ${workingCount}/${activeCount} main developers (${workingPercentage.toFixed(0)}%) worked today.`,
        actionRequired: true,
        timestamp: new Date(),
        data: { working: workingCount, total: activeCount, percentage: workingPercentage }
      });
    }

    return alerts;

  } catch (error) {
    console.error('Error generating alerts:', error);
    return [{
      id: 'system-error',
      type: 'critical',
      title: 'Alert System Error',
      message: 'Failed to generate alerts. Please check system logs.',
      actionRequired: true,
      timestamp: new Date()
    }];
  }
}

export async function GET(request: NextRequest) {
  try {
    const alerts = await generateAlerts();
    
    return NextResponse.json({
      success: true,
      alerts,
      timestamp: new Date().toISOString(),
      count: alerts.length
    });

  } catch (error: any) {
    console.error('Error in alerts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error.message },
      { status: 500 }
    );
  }
} 