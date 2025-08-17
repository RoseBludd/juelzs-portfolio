import { NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

// Use singleton database connection
const pool = getMainDbPool();

interface RecentActivity {
  id: string;
  type: 'milestone_update' | 'module_update' | 'module_created' | 'task_assigned';
  developer_name: string;
  developer_profile_picture_url?: string;
  content: string;
  task_title?: string;
  module_name?: string;
  created_at: string;
  timestamp: number;
}

export async function GET() {
  try {
    console.log('🔍 [DEBUG] Fetching recent activity for admin dashboard...');

    // Get recent activity from multiple sources
    const [legacyUpdatesResult, moduleUpdatesResult, moduleCreationsResult, taskAssignmentsResult] = await Promise.allSettled([
      // Legacy milestone updates
      pool.query(`
        SELECT 
          mu.id,
          'milestone_update' as type,
          mu.content,
          mu.created_at,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          tm.title as task_title
        FROM milestone_updates mu
        LEFT JOIN developers d ON mu.developer_id = d.id
        LEFT JOIN task_milestones tms ON mu.milestone_id = tms.id
        LEFT JOIN tasks tm ON tms.task_id = tm.id
        WHERE mu.created_at >= NOW() - INTERVAL '7 days'
          AND mu.content IS NOT NULL 
          AND mu.content != ''
        ORDER BY mu.created_at DESC
        LIMIT 10
      `),

      // Module updates
      pool.query(`
        SELECT 
          mu.id,
          'module_update' as type,
          COALESCE(mu.title, mu.content, 'Module update') as content,
          mu.created_at,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          tm.name as module_name
        FROM module_updates mu
        LEFT JOIN developers d ON mu.developer_id = d.id
        LEFT JOIN task_modules tm ON mu.module_id = tm.id
        WHERE mu.created_at >= NOW() - INTERVAL '7 days'
          AND (mu.title IS NOT NULL OR mu.content IS NOT NULL)
        ORDER BY mu.created_at DESC
        LIMIT 10
      `),

      // Module creations
      pool.query(`
        SELECT 
          tm.id,
          'module_created' as type,
          CONCAT('Created module: ', tm.name) as content,
          tm.created_at,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          tm.name as module_name
        FROM task_modules tm
        LEFT JOIN developers d ON tm.created_by = d.id
        WHERE tm.created_at >= NOW() - INTERVAL '7 days'
          AND tm.name IS NOT NULL
        ORDER BY tm.created_at DESC
        LIMIT 5
      `),

      // Recent task assignments
      pool.query(`
        SELECT 
          ta.id,
          'task_assigned' as type,
          CONCAT('Assigned to task: ', t.title) as content,
          ta.created_at,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          t.title as task_title
        FROM task_assignments ta
        LEFT JOIN developers d ON ta.developer_id = d.id
        LEFT JOIN tasks t ON ta.task_id = t.id::text
        WHERE ta.created_at >= NOW() - INTERVAL '7 days'
        ORDER BY ta.created_at DESC
        LIMIT 5
      `)
    ]);

    // Process results with fallbacks
    const legacyUpdates = legacyUpdatesResult.status === 'fulfilled' ? legacyUpdatesResult.value.rows : [];
    const moduleUpdates = moduleUpdatesResult.status === 'fulfilled' ? moduleUpdatesResult.value.rows : [];
    const moduleCreations = moduleCreationsResult.status === 'fulfilled' ? moduleCreationsResult.value.rows : [];
    const taskAssignments = taskAssignmentsResult.status === 'fulfilled' ? taskAssignmentsResult.value.rows : [];

    console.log(`📊 [DEBUG] Activity sources:`);
    console.log(`  - Legacy updates: ${legacyUpdates.length}`);
    console.log(`  - Module updates: ${moduleUpdates.length}`);
    console.log(`  - Module creations: ${moduleCreations.length}`);
    console.log(`  - Task assignments: ${taskAssignments.length}`);

    // Combine all activities
    const allActivities: RecentActivity[] = [
      ...legacyUpdates,
      ...moduleUpdates,
      ...moduleCreations,
      ...taskAssignments
    ].map(activity => ({
      ...activity,
      timestamp: new Date(activity.created_at).getTime()
    }));

    // Sort by timestamp (most recent first) and limit to 10
    const sortedActivities = allActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    console.log(`✅ [DEBUG] Returning ${sortedActivities.length} recent activities`);

    return NextResponse.json({
      success: true,
      activities: sortedActivities
    });

  } catch (error) {
    console.error('❌ [ERROR] Recent activity API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
} 