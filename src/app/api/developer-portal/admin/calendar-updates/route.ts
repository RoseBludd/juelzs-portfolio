import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

// Use singleton database connection
const pool = getMainDbPool();

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface CalendarUpdate {
  id: string;
  type: 'milestone_update' | 'module_update' | 'module_created' | 'task_assigned';
  developer_name: string;
  developer_profile_picture_url?: string;
  content: string;
  task_title?: string;
  task_id?: string;
  task_priority?: string;
  task_status?: string;
  task_department?: string;
  module_name?: string;
  created_at: string;
  date: string; // YYYY-MM-DD format
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get date range parameters (default to current month)
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    console.log(`🔍 [DEBUG] Fetching calendar updates for date range: ${startDate} to ${endDate}`);

    // Query all update sources with date filtering
    const [legacyUpdatesResult, moduleUpdatesResult, moduleCreationsResult, taskAssignmentsResult] = await Promise.allSettled([
      // Legacy milestone updates
      pool.query(`
        SELECT 
          mu.id,
          'milestone_update' as type,
          mu.content,
          mu.created_at,
          DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as date,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          COALESCE(t.title, 'Legacy Task') as task_title,
          t.id as task_id,
          t.priority as task_priority,
          t.status as task_status,
          t.department as task_department
        FROM milestone_updates mu
        LEFT JOIN developers d ON mu.developer_id = d.id
        LEFT JOIN task_milestones tms ON mu.milestone_id = tms.id
        LEFT JOIN tasks t ON tms.task_id = t.id
        WHERE DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $1
          AND DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $2
          AND mu.content IS NOT NULL 
          AND mu.content != ''
        ORDER BY mu.created_at DESC
      `, [startDate, endDate]),

      // Module updates
      pool.query(`
        SELECT 
          mu.id,
          'module_update' as type,
          COALESCE(mu.title, mu.content, 'Module update') as content,
          mu.created_at,
          DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as date,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          tm.name as module_name,
          t.title as task_title,
          t.id as task_id,
          t.priority as task_priority,
          t.status as task_status,
          t.department as task_department
        FROM module_updates mu
        LEFT JOIN developers d ON mu.developer_id = d.id
        LEFT JOIN task_modules tm ON mu.module_id = tm.id
        LEFT JOIN tasks t ON tm.task_id = t.id
        WHERE DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $1
          AND DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $2
          AND (mu.title IS NOT NULL OR mu.content IS NOT NULL)
        ORDER BY mu.created_at DESC
      `, [startDate, endDate]),

      // Module creations
      pool.query(`
        SELECT 
          tm.id,
          'module_created' as type,
          CONCAT('Created module: ', tm.name) as content,
          tm.created_at,
          DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as date,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          tm.name as module_name,
          t.title as task_title,
          t.id as task_id,
          t.priority as task_priority,
          t.status as task_status,
          t.department as task_department
        FROM task_modules tm
        LEFT JOIN developers d ON tm.created_by = d.id
        LEFT JOIN tasks t ON tm.task_id = t.id
        WHERE DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $1
          AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $2
          AND tm.name IS NOT NULL
        ORDER BY tm.created_at DESC
      `, [startDate, endDate]),

      // Task assignments
      pool.query(`
        SELECT 
          ta.id,
          'task_assigned' as type,
          CONCAT('Assigned to task: ', t.title) as content,
          ta.start_date as created_at,
          DATE(ta.start_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as date,
          d.name as developer_name,
          d.profile_picture_url as developer_profile_picture_url,
          t.title as task_title,
          t.id as task_id,
          t.priority as task_priority,
          t.status as task_status,
          t.department as task_department
        FROM task_assignments ta
        LEFT JOIN developers d ON ta.developer_id = d.id
        LEFT JOIN tasks t ON ta.task_id::uuid = t.id
        WHERE DATE(ta.start_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $1
          AND DATE(ta.start_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $2
          AND t.title IS NOT NULL
        ORDER BY ta.start_date DESC
      `, [startDate, endDate])
    ]);

    // Process results with fallbacks
    const legacyUpdates = legacyUpdatesResult.status === 'fulfilled' ? legacyUpdatesResult.value.rows : [];
    const moduleUpdates = moduleUpdatesResult.status === 'fulfilled' ? moduleUpdatesResult.value.rows : [];
    const moduleCreations = moduleCreationsResult.status === 'fulfilled' ? moduleCreationsResult.value.rows : [];
    const taskAssignments = taskAssignmentsResult.status === 'fulfilled' ? taskAssignmentsResult.value.rows : [];

    console.log(`📊 [DEBUG] Calendar update sources for ${startDate} to ${endDate}:`);
    console.log(`  - Legacy updates: ${legacyUpdates.length}`);
    console.log(`  - Module updates: ${moduleUpdates.length}`);
    console.log(`  - Module creations: ${moduleCreations.length}`);
    console.log(`  - Task assignments: ${taskAssignments.length}`);

    // Log any errors for debugging
    if (legacyUpdatesResult.status === 'rejected') {
      console.error('Legacy updates query failed:', legacyUpdatesResult.reason);
    }
    if (moduleUpdatesResult.status === 'rejected') {
      console.error('Module updates query failed:', moduleUpdatesResult.reason);
    }
    if (moduleCreationsResult.status === 'rejected') {
      console.error('Module creations query failed:', moduleCreationsResult.reason);
    }
    if (taskAssignmentsResult.status === 'rejected') {
      console.error('Task assignments query failed:', taskAssignmentsResult.reason);
    }

    // Combine all updates
    const allUpdates: CalendarUpdate[] = [
      ...legacyUpdates,
      ...moduleUpdates,
      ...moduleCreations,
      ...taskAssignments
    ].map(update => ({
      id: update.id,
      type: update.type,
      developer_name: update.developer_name || 'Unknown Developer',
      developer_profile_picture_url: update.developer_profile_picture_url,
      content: update.content || '',
      task_title: update.task_title,
      task_id: update.task_id,
      task_priority: update.task_priority,
      task_status: update.task_status,
      task_department: update.task_department,
      module_name: update.module_name,
      created_at: update.created_at.toISOString(),
      date: update.date instanceof Date ? update.date.toISOString().split('T')[0] : update.date
    }));

    // Sort by timestamp (most recent first)
    const sortedUpdates = allUpdates.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Group updates by date for easier calendar consumption
    const updatesByDate: Record<string, CalendarUpdate[]> = {};
    sortedUpdates.forEach(update => {
      if (!updatesByDate[update.date]) {
        updatesByDate[update.date] = [];
      }
      updatesByDate[update.date].push(update);
    });

    console.log(`✅ [DEBUG] Returning ${sortedUpdates.length} calendar updates grouped by ${Object.keys(updatesByDate).length} dates`);

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      totalUpdates: sortedUpdates.length,
      updatesByDate,
      updates: sortedUpdates // Also return flat array for compatibility
    });

  } catch (error) {
    console.error('❌ [ERROR] Calendar updates API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar updates',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 