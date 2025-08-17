import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool, getModuleDbPool } from '@/lib/db-pool';
import { verifySession } from '@/lib/api-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use centralized database pools instead of creating new ones
const vibezPool = getModuleDbPool();
const mainPool = getMainDbPool();

// GET - Get comprehensive developer statistics
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Stats API: Fetching stats for user:', userData.email);

    // Get developer info from database
    const developerQuery = `
      SELECT id, name, email 
      FROM developers 
      WHERE email = $1
    `;
    const developerResult = await mainPool.query(developerQuery, [userData.email]);
    
    if (developerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const developer = developerResult.rows[0];
    const developerId = developer.id;

    // Calculate week boundaries
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get general statistics for all developers

    // Parallel queries for performance with individual error handling
    const [
      modulesStats,
      cursorChatStats,
      recentModules,
      weeklyActivity
    ] = await Promise.allSettled([
      // Total modules created by this developer
      vibezPool.query(`
        SELECT 
          COUNT(*) as total_modules,
          COUNT(*) FILTER (WHERE created_at >= $2) as modules_this_week,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_modules,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_modules
        FROM task_modules 
        WHERE created_by = $1 OR task_id = ANY(
          SELECT DISTINCT task_id FROM task_modules WHERE created_by = $1
        )
      `, [developerId, weekStart]).catch(err => {
        console.error('Stats API: Error fetching modules stats:', err);
        return { rows: [{ total_modules: 0, modules_this_week: 0, completed_modules: 0, in_progress_modules: 0 }] };
      }),

      // Cursor chat statistics from main database
      mainPool.query(`
        SELECT 
          COUNT(*) as total_chats,
          COUNT(*) FILTER (WHERE upload_date >= $2) as chats_this_week,
          COALESCE(SUM(file_size), 0) as total_file_size,
          COALESCE(AVG((metadata->>'wordCount')::int), 0) as avg_word_count
        FROM cursor_chats 
        WHERE developer_id = $1
      `, [userData.id, weekStart]).catch(err => {
        console.error('Stats API: Error fetching cursor chat stats:', err);
        return { rows: [{ total_chats: 0, chats_this_week: 0, total_file_size: 0, avg_word_count: 0 }] };
      }),

      // Recent modules (prioritize user's own modules, then show relevant ones)
      vibezPool.query(`
        SELECT 
          tm.id,
          tm.name,
          tm.description,
          tm.status,
          tm.completion_percentage,
          tm.created_at,
          tm.updated_at,
          mt.name as module_type,
          mt.icon as module_icon,
          mt.color as module_color,
          CASE 
            WHEN tm.created_by = $1 THEN 1
            ELSE 2
          END as priority
        FROM task_modules tm
        LEFT JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE tm.created_by = $1 
           OR (tm.status IN ('completed', 'in_progress') 
               AND tm.completion_percentage > 50)
        ORDER BY priority ASC, tm.updated_at DESC
        LIMIT 8
      `, [developerId]).catch(err => {
        console.error('Stats API: Error fetching recent modules:', err);
        return { rows: [] };
      }),

      // Weekly activity summary (modules from VIBEZS, cursor chats from main DB)
      vibezPool.query(`
        SELECT 
          DATE(created_at) as activity_date,
          COUNT(*) as modules_created
        FROM task_modules tm
        WHERE (tm.created_by = $1 OR tm.task_id = ANY(
          SELECT DISTINCT task_id FROM task_modules WHERE created_by = $1
        ))
          AND tm.created_at >= $2 
          AND tm.created_at <= $3
        GROUP BY DATE(created_at)
        ORDER BY activity_date DESC
      `, [developerId, weekStart, weekEnd]).catch(err => {
        console.error('Stats API: Error fetching weekly activity:', err);
        return { rows: [] };
      })
    ]);

    // Extract results from settled promises
    const modulesResult = modulesStats.status === 'fulfilled' ? modulesStats.value : { rows: [{ total_modules: 0, modules_this_week: 0, completed_modules: 0, in_progress_modules: 0 }] };
    const cursorChatsResult = cursorChatStats.status === 'fulfilled' ? cursorChatStats.value : { rows: [{ total_chats: 0, chats_this_week: 0, total_file_size: 0, avg_word_count: 0 }] };
    const recentModulesResult = recentModules.status === 'fulfilled' ? recentModules.value : { rows: [] };
    const weeklyActivityResult = weeklyActivity.status === 'fulfilled' ? weeklyActivity.value : { rows: [] };

    // Get cursor chat weekly activity from main database separately
    let cursorChatWeeklyActivity = { rows: [] };
    try {
      cursorChatWeeklyActivity = await mainPool.query(`
        SELECT 
          DATE(upload_date) as activity_date,
          COUNT(*) as chats_uploaded
        FROM cursor_chats 
        WHERE developer_id = $1 
          AND upload_date >= $2 
          AND upload_date <= $3
        GROUP BY DATE(upload_date)
        ORDER BY activity_date DESC
      `, [userData.id, weekStart, weekEnd]);
    } catch (chatActivityError) {
      console.error('Stats API: Error fetching cursor chat weekly activity:', chatActivityError);
    }

    // Merge weekly activity data
    interface WeeklyActivityItem {
      activity_date: Date;
      modules_created: number;
      chats_uploaded: number;
    }

    const mergedWeeklyActivity: WeeklyActivityItem[] = [];
    const moduleActivityMap = new Map<string, number>();
    const chatActivityMap = new Map<string, number>();

    // Index module activity by date
    weeklyActivityResult.rows.forEach((row: any) => {
      moduleActivityMap.set(row.activity_date.toDateString(), row.modules_created);
    });

    // Index chat activity by date
    cursorChatWeeklyActivity.rows.forEach((row: any) => {
      chatActivityMap.set(row.activity_date.toDateString(), row.chats_uploaded);
    });

    // Combine both activities
    const allDates = new Set([
      ...weeklyActivityResult.rows.map((row: any) => row.activity_date.toDateString()),
      ...cursorChatWeeklyActivity.rows.map((row: any) => row.activity_date.toDateString())
    ]);

    allDates.forEach(dateString => {
      const date = new Date(dateString);
      mergedWeeklyActivity.push({
        activity_date: date,
        modules_created: moduleActivityMap.get(dateString) || 0,
        chats_uploaded: chatActivityMap.get(dateString) || 0
      });
    });

    // Sort by date descending
    mergedWeeklyActivity.sort((a, b) => b.activity_date.getTime() - a.activity_date.getTime());

    // Get task statistics from main database
    let taskStats = { rows: [{ total_tasks_assigned: 0, completed_tasks: 0, in_progress_tasks: 0, tasks_this_week: 0 }] };
    try {
      taskStats = await mainPool.query(`
        SELECT 
          COUNT(*) as total_tasks_assigned,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
          COUNT(*) FILTER (WHERE created_at >= $2) as tasks_this_week
        FROM tasks 
        WHERE assigned_to = $1
      `, [userData.id, weekStart]);
    } catch (taskError) {
      console.error('Stats API: Error fetching task stats:', taskError);
      // Use default values
    }

    // Calculate additional metrics
    const totalModules = Number(modulesResult.rows[0]?.total_modules) || 0;
    const totalChats = Number(cursorChatsResult.rows[0]?.total_chats) || 0;
    const modulesThisWeek = Number(modulesResult.rows[0]?.modules_this_week) || 0;
    const chatsThisWeek = Number(cursorChatsResult.rows[0]?.chats_this_week) || 0;
    const totalTasks = Number(taskStats.rows[0]?.total_tasks_assigned) || 0;
    const completedTasks = Number(taskStats.rows[0]?.completed_tasks) || 0;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0';

    // Format file size for display
    const totalFileSize = Number(cursorChatsResult.rows[0]?.total_file_size) || 0;
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Prepare response
    const stats = {
      overview: {
        totalModules,
        totalChats,
        totalTasks,
        completionRate: parseFloat(completionRate)
      },
      thisWeek: {
        modulesCreated: modulesThisWeek,
        chatsUploaded: chatsThisWeek,
        tasksAssigned: Number(taskStats.rows[0]?.tasks_this_week) || 0
      },
      modules: {
        total: totalModules,
        completed: Number(modulesResult.rows[0]?.completed_modules) || 0,
        inProgress: Number(modulesResult.rows[0]?.in_progress_modules) || 0,
        thisWeek: modulesThisWeek
      },
      cursorChats: {
        total: totalChats,
        thisWeek: chatsThisWeek,
        totalSize: formatFileSize(totalFileSize),
        avgWordCount: Number(cursorChatsResult.rows[0]?.avg_word_count) || 0
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: Number(taskStats.rows[0]?.in_progress_tasks) || 0,
        thisWeek: Number(taskStats.rows[0]?.tasks_this_week) || 0
      },
      recentModules: recentModulesResult.rows || [],
      weeklyActivity: mergedWeeklyActivity
    };

    console.log('Stats API: Successfully returning stats for:', userData.email);
    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching developer statistics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch developer statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 