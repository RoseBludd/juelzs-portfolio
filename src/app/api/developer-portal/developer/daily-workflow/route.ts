import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/api-utils';
import { getMainDbPool, getModuleDbPool } from '@/lib/db-pool';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Use the centralized database pools
const mainPool = getMainDbPool();
const modulePool = getModuleDbPool();

interface DailyGoals {
  cursor_chats: { required: number; completed: number };
  loom_videos: { required: number; completed: number };
  code_submissions: { required: number; completed: number };
  scribes: { required: number; completed: number };
  work_hours: { target: number; completed: number };
}

export async function GET(request: NextRequest) {
  let mainClient = null;
  let moduleClient = null;
  
  try {
    // Get authenticated user
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get developer info from database
    const developerQuery = `
      SELECT id, name, email 
      FROM developers 
      WHERE email = $1
    `;
    const mainPool = getMainDbPool();
    const developerResult = await mainPool.query(developerQuery, [userData.email]);
    
    if (developerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const developer = developerResult.rows[0];
    const developerId = developer.id;

    // Use CST date for business logic - determines "today" based on America/Chicago timezone
    const getCSTDate = (date?: Date): string => {
      const now = date || new Date();
      
      // Use proper timezone conversion for America/Chicago (handles CDT/CST automatically)
      const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      
      // Get the date in Chicago timezone
      const workDate = new Date(now.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }));
      
      return workDate.toISOString().split('T')[0];
    };
    
    const todayCST = getCSTDate();

    // Get database connections with fallback handling
    try {
      mainClient = await mainPool.connect();
    } catch (mainDbError) {
      console.error('Failed to connect to main database:', mainDbError);
      // Continue with moduleClient only if possible
    }

    try {
      moduleClient = await modulePool.connect();
    } catch (moduleDbError) {
      console.error('Failed to connect to module database:', moduleDbError);
      // Continue with mainClient only if possible
    }

    // If both connections failed, return minimal data
    if (!mainClient && !moduleClient) {
      console.error('Both database connections failed, returning minimal data');
      return NextResponse.json({
        current_priority: null,
        todays_submissions: [],
        time_entries: [],
        daily_goals: {
          cursor_chats: { required: 1, completed: 0 },
          loom_videos: { required: 1, completed: 0 },
          code_submissions: { required: 1, completed: 0 },
          scribes: { required: 0, completed: 0 },
          work_hours: { target: 8, completed: 0 }
        },
        can_end_day: false,
        is_working: false,
        total_work_minutes: 0,
        break_minutes: 0,
        debug: {
          error: 'Database connections failed',
          mainQueriesSuccessful: 0,
          moduleQueriesSuccessful: 0,
          databases: {
            main: false,
            module: false
          }
        }
      });
    }

    // Queries for MAIN DATABASE (legacy tables) - only if connection exists
    let mainQueries = [];
    if (mainClient) {
      mainQueries = await Promise.allSettled([
        // Work sessions from main database - use CST timezone-aware date filtering
        mainClient.query(`
          SELECT 
            start_time,
            end_time,
            break_start,
            break_end,
            break_type,
            is_active,
            total_work_minutes,
            total_break_minutes,
            -- Since start_time is already UTC, just ensure it has 'Z' suffix for proper parsing
            start_time as session_start_tz,
            break_start as break_start_tz,
            break_end as break_end_tz,
            end_time as end_time_tz
          FROM developer_work_sessions 
          WHERE developer_id = $1 
          AND DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
          ORDER BY start_time DESC
        `, [developerId, todayCST]),

        // Daily priority from main database
        mainClient.query(`
          SELECT 
            dp.task_id,
            t.title,
            t.description,
            t.priority,
            t.estimated_time as estimated_hours
          FROM developer_daily_priorities dp
          JOIN tasks t ON dp.task_id = t.id
          WHERE dp.developer_id = $1 AND dp.date = $2
          ORDER BY dp.created_at DESC
          LIMIT 1
        `, [developerId, todayCST]),

        // Cursor chats from main database (primary source) - use CST timezone-aware date filtering
        mainClient.query(`
          SELECT COUNT(*) as count
          FROM cursor_chats 
          WHERE developer_id = $1 
          AND DATE(upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
        `, [developerId, todayCST])
      ]);
    } else {
      // Create failed results for missing main database
      mainQueries = [
        { status: 'rejected' as const, reason: 'Main database not available' },
        { status: 'rejected' as const, reason: 'Main database not available' },
        { status: 'rejected' as const, reason: 'Main database not available' }
      ];
    }

    // Queries for MODULE DATABASE (modular tables) - only if connection exists
    let moduleQueries = [];
    if (moduleClient) {
      moduleQueries = await Promise.allSettled([
        // Loom videos from ALL 6 sources (same as admin Smart Analysis)
        moduleClient.query(`
          SELECT COUNT(*) as count
          FROM (
            -- Source 1: tasks table URL field
            SELECT 1 FROM tasks t
            JOIN task_assignments ta ON t.id::text = ta.task_id
            WHERE ta.developer_id = $1
            AND DATE(COALESCE(ta.updated_at, ta.created_at) AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND t.url LIKE '%loom.com%'
            
            UNION ALL
            
            -- Source 2: task_modules URL field  
            SELECT 1 FROM task_modules 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND url LIKE '%loom.com%'
            
            UNION ALL
            
            -- Source 3: task_modules metadata loom_video_url
            SELECT 1 FROM task_modules 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND metadata->>'loom_video_url' IS NOT NULL
            AND metadata->>'loom_video_url' != ''
            
            UNION ALL
            
            -- Source 4: task_modules description field
            SELECT 1 FROM task_modules 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND description LIKE '%loom.com%'
            
            UNION ALL
            
            -- Source 5: module_updates content field
            SELECT 1 FROM module_updates 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND content LIKE '%loom.com%'
            
            UNION ALL
            
            -- Source 6: milestone_updates content field
            SELECT 1 FROM milestone_updates 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND content LIKE '%loom.com%'
          ) as loom_count
        `, [developerId, todayCST]),

        // Code submissions from ALL sources (comprehensive tracking)
        moduleClient.query(`
          SELECT COUNT(*) as count
          FROM (
            -- Source 1: module_submissions with code type
            SELECT 1 FROM module_submissions 
            WHERE developer_id = $1 
            AND submission_type = 'code'
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            
            UNION ALL
            
            -- Source 2: task_modules with code content
            SELECT 1 FROM task_modules 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND (module_type = 'code' OR description LIKE '%code%' OR url LIKE '%github%')
            
            UNION ALL
            
            -- Source 3: module_updates with code submissions  
            SELECT 1 FROM module_updates 
            WHERE developer_id = $1 
            AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
            AND (content LIKE '%submitted code%' OR content LIKE '%github%' OR content LIKE '%pull request%')
          ) as code_count
        `, [developerId, todayCST]),

        // Scribes - ONLY actual scribe links (same as individual task page)
        moduleClient.query(`
          SELECT COUNT(*) as count
          FROM module_scribes ms
          JOIN task_modules tm ON ms.module_id = tm.id
          WHERE tm.developer_id = $1 
          AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2
          AND ms.scribe_url IS NOT NULL
          AND ms.scribe_url != ''
        `, [developerId, todayCST])
      ]);
    } else {
      // Create failed results for missing module database
      moduleQueries = [
        { status: 'rejected' as const, reason: 'Module database not available' },
        { status: 'rejected' as const, reason: 'Module database not available' },
        { status: 'rejected' as const, reason: 'Module database not available' }
      ];
    }

    // Process results with fallbacks
    const [workSessionsResult, priorityResult, cursorChatsResult] = mainQueries.map(result => 
      result.status === 'fulfilled' ? result.value : { rows: [] }
    );
    
    const [loomVideosResult, codeSubmissionsResult, scribesResult] = moduleQueries.map(result => 
      result.status === 'fulfilled' ? result.value : { rows: [] }
    );

    // Calculate work time and break time
    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    let isWorking = false;

    if (workSessionsResult.rows && workSessionsResult.rows.length > 0) {
      const latestSession = workSessionsResult.rows[0];
      isWorking = latestSession.is_active || false;
      
      // Sum up all work sessions for today properly
      workSessionsResult.rows.forEach((session: any) => {
        // For active sessions, calculate real-time work and break time
        if (session.is_active) {
          const now = new Date();
          // Ensure UTC timestamp parsing by adding 'Z' if not present
          const sessionStartStr = session.session_start_tz && typeof session.session_start_tz === 'string' 
            ? (session.session_start_tz.endsWith('Z') ? session.session_start_tz : session.session_start_tz + 'Z')
            : null;
          
          if (sessionStartStr) {
            const sessionStart = new Date(sessionStartStr);
            const sessionElapsedMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / 60000);
            
            let currentBreakMinutes = session.total_break_minutes || 0;
            let currentWorkMinutes = session.total_work_minutes || 0;
            
            // Add current break time if on break
            if (session.break_start && !session.break_end && session.break_start_tz) {
              const breakStartStr = session.break_start_tz && typeof session.break_start_tz === 'string'
                ? (session.break_start_tz.endsWith('Z') ? session.break_start_tz : session.break_start_tz + 'Z')
                : null;
              
              if (breakStartStr) {
                const breakStart = new Date(breakStartStr);
                const currentBreakElapsed = Math.floor((now.getTime() - breakStart.getTime()) / 60000);
                currentBreakMinutes += Math.max(0, currentBreakElapsed);
              }
            }
            
            // Work time = session elapsed - total break time
            currentWorkMinutes = Math.max(0, sessionElapsedMinutes - currentBreakMinutes);
            
            totalWorkMinutes += currentWorkMinutes;
            totalBreakMinutes += currentBreakMinutes;
          }
        } else {
          // For completed sessions, use stored values
          if (session.total_work_minutes) {
            totalWorkMinutes += parseInt(session.total_work_minutes);
          }
          if (session.total_break_minutes) {
            totalBreakMinutes += parseInt(session.total_break_minutes);
          }
        }
      });
    }

    // Build daily goals with fallbacks
    const cursorChatsCount = parseInt(cursorChatsResult.rows?.[0]?.count || '0');
    const loomVideosCount = parseInt(loomVideosResult.rows?.[0]?.count || '0');
    const codeSubmissionsCount = parseInt(codeSubmissionsResult.rows?.[0]?.count || '0');
    const scribesCount = parseInt(scribesResult.rows?.[0]?.count || '0');

    const dailyGoals: DailyGoals = {
      cursor_chats: { required: 1, completed: cursorChatsCount },
      loom_videos: { required: 1, completed: loomVideosCount },
      code_submissions: { required: 1, completed: codeSubmissionsCount },
      scribes: { required: 0, completed: scribesCount },
      work_hours: { target: 8, completed: Math.round(totalWorkMinutes / 60 * 10) / 10 }
    };

    // Check if day can be ended (all required goals met)
    const canEndDay = 
      dailyGoals.cursor_chats.completed >= dailyGoals.cursor_chats.required &&
      dailyGoals.loom_videos.completed >= dailyGoals.loom_videos.required &&
      dailyGoals.code_submissions.completed >= dailyGoals.code_submissions.required &&
      dailyGoals.scribes.completed >= dailyGoals.scribes.required;

    // Get current priority task
    let currentPriority = null;
    if (priorityResult.rows && priorityResult.rows.length > 0) {
      const priority = priorityResult.rows[0];
      currentPriority = {
        id: priority.task_id,
        title: priority.title,
        description: priority.description,
        priority: priority.priority || 'medium',
        estimated_hours: priority.estimated_hours || 8
      };
    }

    // Get current session data for frontend real-time calculations
    let sessionData = {};
    if (workSessionsResult.rows && workSessionsResult.rows.length > 0 && isWorking) {
      const latestSession = workSessionsResult.rows[0];
      // Ensure timestamps have Z suffix for proper UTC parsing
      const sessionStartStr = latestSession.start_time && typeof latestSession.start_time === 'string'
        ? (latestSession.start_time.endsWith('Z') ? latestSession.start_time : latestSession.start_time + 'Z')
        : null;
      const breakStartStr = latestSession.break_start && typeof latestSession.break_start === 'string'
        ? (latestSession.break_start.endsWith('Z') ? latestSession.break_start : latestSession.break_start + 'Z') 
        : null;
      
      sessionData = {
        session_start: sessionStartStr,
        is_on_break: latestSession.break_start && !latestSession.break_end,
        break_start: breakStartStr,
        break_type: latestSession.break_type
      };
    }

    return NextResponse.json({
      current_priority: currentPriority,
      todays_submissions: [], // Could be expanded to show specific submissions
      time_entries: workSessionsResult.rows || [],
      daily_goals: dailyGoals,
      can_end_day: canEndDay,
      is_working: isWorking,
      total_work_minutes: totalWorkMinutes,
      break_minutes: totalBreakMinutes,
      ...sessionData,
      debug: {
        mainQueriesSuccessful: mainQueries.filter(q => q.status === 'fulfilled').length,
        moduleQueriesSuccessful: moduleQueries.filter(q => q.status === 'fulfilled').length,
        databases: {
          main: !!mainClient,
          module: !!moduleClient
        },
        todayCST: todayCST
      }
    });

  } catch (error) {
    console.error('Error loading daily workflow data:', error);
    
    // Return minimal fallback data instead of just error
    return NextResponse.json({
      current_priority: null,
      todays_submissions: [],
      time_entries: [],
      daily_goals: {
        cursor_chats: { required: 1, completed: 0 },
        loom_videos: { required: 1, completed: 0 },
        code_submissions: { required: 1, completed: 0 },
        scribes: { required: 0, completed: 0 },
        work_hours: { target: 8, completed: 0 }
      },
      can_end_day: false,
      is_working: false,
      total_work_minutes: 0,
      break_minutes: 0,
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        mainQueriesSuccessful: 0,
        moduleQueriesSuccessful: 0,
        databases: {
          main: false,
          module: false
        }
      }
    });
  } finally {
    // Always release database connections
    if (mainClient) {
      try {
        mainClient.release();
      } catch (error) {
        console.error('Error releasing main database connection:', error);
      }
    }
    if (moduleClient) {
      try {
        moduleClient.release();
      } catch (error) {
        console.error('Error releasing module database connection:', error);
      }
    }
  }
} 