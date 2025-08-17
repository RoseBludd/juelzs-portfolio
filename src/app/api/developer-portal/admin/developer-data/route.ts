import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool, getModuleDbPool } from "@/lib/db-pool";

// Utility function to get CST date (work day consideration)
function getCSTDate(date?: Date): string {
  const now = date || new Date();
  const cstOffset = -6 * 60; // CST is UTC-6
  const cstTime = new Date(now.getTime() + (cstOffset * 60 * 1000));
  
  // If it's before 5:30 PM CST, use current date
  // If it's after 5:30 PM CST, still use current date (not next day)
  // This ensures we don't jump to next day prematurely
  const hour = cstTime.getHours();
  const minute = cstTime.getMinutes();
  
  // Only advance to next day if it's past midnight CST
  if (hour >= 0 && hour < 5) {
    // Early morning hours (12am-5am) might be previous day work
    cstTime.setDate(cstTime.getDate() - 1);
  }
  
  return cstTime.toISOString().split('T')[0];
}

interface DeveloperBasicData {
  developer: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  rawData: {
    workMinutes: number;
    codeSubmissions: number;
    averageScore: number;
    goalsMetToday: number;
    loomVideos: number;
    scribes: number;
    modulesCreated: number;
    modulesEdited?: number;
    totalHoursWorked: number;
    loomVideoSources?: any;
    scribeSources?: any;
  };
}

interface TeamBasicData {
  success: boolean;
  date: string;
  developers: DeveloperBasicData[];
}

async function gatherBasicDeveloperData(developerId: string, startDate: string, endDate?: string): Promise<DeveloperBasicData> {
  const mainDb = getMainDbPool();
  const moduleDb = getModuleDbPool();

  // Handle both single date and date range
  const actualEndDate = endDate || startDate;
  
  console.log(`🔍 Gathering basic data for developer ${developerId} from ${startDate} to ${actualEndDate}`);

  try {
    // Get developer basic info
    const developerQuery = `SELECT id, name, email, role FROM developers WHERE id = $1::uuid`;
    const developerResult = await mainDb.query(developerQuery, [developerId]);
    const developer = developerResult.rows[0];

    if (!developer) {
      throw new Error('Developer not found');
    }

    console.log(`✅ Found developer: ${developer.name}`);

    // Initialize default data structure
    const defaultData = {
      developer: developer,
      rawData: {
        workMinutes: 0,
        codeSubmissions: 0,
        averageScore: 0,
        goalsMetToday: 0,
        loomVideos: 0,
        scribes: 0,
        cursorChats: 0,
        modulesCreated: 0,
        modulesEdited: 0,
        totalHoursWorked: 0,
        loomVideoSources: {},
        scribeSources: {},
        cursorChatSources: {}
      }
    };

    // 1. Get work sessions from the analysis date (CST adjusted) with REAL-TIME calculation
    try {
      const workSessionsQuery = `
        SELECT 
          start_time,
          end_time,
          total_work_minutes,
          total_break_minutes,
          is_active,
          break_type,
          break_start,
          break_end,
          -- Calculate current session duration in real-time
          CASE 
            WHEN is_active = true THEN
              GREATEST(0, EXTRACT(EPOCH FROM (NOW() - COALESCE(break_end, start_time))) / 60)::INTEGER
            ELSE 0
          END as current_session_minutes
        FROM developer_work_sessions 
        WHERE developer_id = $1::uuid 
        AND DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        ORDER BY start_time DESC
      `;
      const workSessionsResult = await mainDb.query(workSessionsQuery, [developerId, startDate, actualEndDate]);
      const workSessions = workSessionsResult.rows;
      
      // Calculate total work time for today INCLUDING active session time
      let totalWorkMinutes = 0;
      let isCurrentlyWorking = false;
      
      for (const session of workSessions) {
        totalWorkMinutes += (session.total_work_minutes || 0);
        
        // Add current session time if active
        if (session.is_active && session.current_session_minutes > 0) {
          totalWorkMinutes += session.current_session_minutes;
          isCurrentlyWorking = true;
        }
      }

      defaultData.rawData.workMinutes = totalWorkMinutes;
      defaultData.rawData.totalHoursWorked = Number((totalWorkMinutes / 60).toFixed(1));
      
      console.log(`✅ Work time: ${totalWorkMinutes} minutes (${defaultData.rawData.totalHoursWorked}h) - Currently working: ${isCurrentlyWorking}`);
    } catch (error) {
      console.error('❌ Error fetching work sessions:', error);
    }

    // 2. Get code submissions
    try {
      const submissionsQuery = `
        SELECT 
          ms.*,
          tm.name as module_name
        FROM module_submissions ms
        LEFT JOIN task_modules tm ON ms.module_id = tm.id
        WHERE ms.developer_id = $1::uuid 
        AND ms.submission_type = 'code'
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        ORDER BY ms.created_at DESC
      `;
      const submissionsResult = await mainDb.query(submissionsQuery, [developerId, startDate, actualEndDate]);
      const submissions = submissionsResult.rows;

      defaultData.rawData.codeSubmissions = submissions.length;
      
      // Calculate average score
      if (submissions.length > 0) {
        const totalScore = submissions.reduce((sum, sub) => {
          return sum + (sub.contextual_score || sub.overall_score || sub.score || 0);
        }, 0);
        defaultData.rawData.averageScore = Math.round(totalScore / submissions.length);
      }
      
      console.log(`✅ Code submissions: ${submissions.length}, avg score: ${defaultData.rawData.averageScore}`);
    } catch (error) {
      console.error('❌ Error fetching code submissions:', error);
    }

    // 3. Get Loom videos from all 6 sources
    try {
      const loomVideosFromSources = [];
      const loomVideoSources = {
        task: 0,
        module_url: 0,
        module_metadata: 0,
        module_description: 0,
        module_updates: 0,
        milestone_updates: 0
      };
      
      // Source 1: Task-level loom videos
      const taskLoomQuery = `
        SELECT COUNT(*) as count
        FROM tasks t
        JOIN task_assignments ta ON t.id::text = ta.task_id
        WHERE ta.developer_id = $1::uuid 
        AND t.loom_video_url LIKE '%loom.com%'
        AND DATE(ta.start_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(ta.start_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
      `;
      const taskLoomResult = await mainDb.query(taskLoomQuery, [developerId, startDate, actualEndDate]);
      loomVideoSources.task = parseInt(taskLoomResult.rows[0]?.count || '0');
      
      // Source 2: Module URL field
      const moduleUrlQuery = `
        SELECT COUNT(*) as count
        FROM task_modules 
        WHERE created_by = $1::uuid
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        AND url LIKE '%loom.com%'
      `;
      const moduleUrlResult = await mainDb.query(moduleUrlQuery, [developerId, startDate, actualEndDate]);
      loomVideoSources.module_url = parseInt(moduleUrlResult.rows[0]?.count || '0');
      
      // Source 3: Module metadata loom_video_url
      const moduleMetadataQuery = `
        SELECT COUNT(*) as count
        FROM task_modules 
        WHERE created_by = $1::uuid
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        AND metadata->>'loom_video_url' IS NOT NULL
        AND metadata->>'loom_video_url' != ''
      `;
      const moduleMetadataResult = await mainDb.query(moduleMetadataQuery, [developerId, startDate, actualEndDate]);
      loomVideoSources.module_metadata = parseInt(moduleMetadataResult.rows[0]?.count || '0');
      
      // Source 4: Module description field
      const moduleDescQuery = `
        SELECT COUNT(*) as count
        FROM task_modules 
        WHERE created_by = $1::uuid
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        AND description LIKE '%loom.com%'
      `;
      const moduleDescResult = await mainDb.query(moduleDescQuery, [developerId, startDate, actualEndDate]);
      loomVideoSources.module_description = parseInt(moduleDescResult.rows[0]?.count || '0');
      
      // Source 5: Module updates content field
      const moduleUpdatesQuery = `
        SELECT COUNT(*) as count
        FROM module_updates 
        WHERE developer_id = $1::uuid
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        AND content LIKE '%loom.com%'
      `;
      const moduleUpdatesResult = await mainDb.query(moduleUpdatesQuery, [developerId, startDate, actualEndDate]);
      loomVideoSources.module_updates = parseInt(moduleUpdatesResult.rows[0]?.count || '0');
      
      // Source 6: Milestone updates content field
      const milestoneUpdatesQuery = `
        SELECT COUNT(*) as count
        FROM milestone_updates 
        WHERE developer_id = $1::uuid
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        AND content LIKE '%loom.com%'
      `;
      const milestoneUpdatesResult = await mainDb.query(milestoneUpdatesQuery, [developerId, startDate, actualEndDate]);
      loomVideoSources.milestone_updates = parseInt(milestoneUpdatesResult.rows[0]?.count || '0');

      const totalLoomVideos = Object.values(loomVideoSources).reduce((sum, count) => sum + count, 0);
      defaultData.rawData.loomVideos = totalLoomVideos;
      defaultData.rawData.loomVideoSources = loomVideoSources;
      
      console.log(`✅ Loom videos: ${totalLoomVideos} from sources:`, loomVideoSources);
    } catch (error) {
      console.error('❌ Error fetching loom videos:', error);
    }

    // 4. Get scribes (ScribeHow documentation)
    try {
      const scribeSources = {
        module_scribes: 0,
        development_notes: 0
      };
      
      // Actual scribes from module_scribes table
      const moduleScribesQuery = `
        SELECT COUNT(*) as count
        FROM module_scribes ms
        LEFT JOIN task_modules tm ON ms.module_id = tm.id
        WHERE tm.created_by = $1::uuid
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
      `;
      const moduleScribesResult = await mainDb.query(moduleScribesQuery, [developerId, startDate, actualEndDate]);
      scribeSources.module_scribes = parseInt(moduleScribesResult.rows[0]?.count || '0');
      
      // Module updates as scribes (for documentation)
      const moduleUpdateScribesQuery = `
        SELECT COUNT(*) as count
        FROM module_updates 
        WHERE developer_id = $1::uuid
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        AND (content LIKE '%scribe%' OR content LIKE '%documentation%')
      `;
      const moduleUpdateScribesResult = await mainDb.query(moduleUpdateScribesQuery, [developerId, startDate, actualEndDate]);
      scribeSources.development_notes = parseInt(moduleUpdateScribesResult.rows[0]?.count || '0');

      const totalScribes = Object.values(scribeSources).reduce((sum, count) => sum + count, 0);
      defaultData.rawData.scribes = totalScribes;
      defaultData.rawData.scribeSources = scribeSources;
      
      console.log(`✅ Scribes: ${totalScribes} from sources:`, scribeSources);
    } catch (error) {
      console.error('❌ Error fetching scribes:', error);
    }

    // 5. Get cursor chats (separate from scribes)
    try {
      const cursorChatSources = {
        cursor_chats: 0,
        module_submissions: 0
      };
      
      // Direct cursor chats
      const cursorChatsQuery = `
        SELECT COUNT(*) as count
        FROM cursor_chats
        WHERE developer_id = $1::uuid
        AND DATE(upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
      `;
      const cursorChatsResult = await mainDb.query(cursorChatsQuery, [developerId, startDate, actualEndDate]);
      cursorChatSources.cursor_chats = parseInt(cursorChatsResult.rows[0]?.count || '0');
      
      // Module submissions with cursor chats
      const moduleSubmissionChatsQuery = `
        SELECT COUNT(*) as count
        FROM module_submissions ms
        WHERE ms.developer_id = $1::uuid 
        AND ms.submission_type = 'cursor_chat'
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
      `;
      const moduleSubmissionChatsResult = await mainDb.query(moduleSubmissionChatsQuery, [developerId, startDate, actualEndDate]);
      cursorChatSources.module_submissions = parseInt(moduleSubmissionChatsResult.rows[0]?.count || '0');

      const totalCursorChats = Object.values(cursorChatSources).reduce((sum, count) => sum + count, 0);
      defaultData.rawData.cursorChats = totalCursorChats;
      defaultData.rawData.cursorChatSources = cursorChatSources;
      
      console.log(`✅ Cursor Chats: ${totalCursorChats} from sources:`, cursorChatSources);
    } catch (error) {
      console.error('❌ Error fetching cursor chats:', error);
    }

    // 6. Get module work
    try {
      const moduleWorkQuery = `
        SELECT 
          COUNT(CASE WHEN DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date 
                      AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date THEN 1 END) as modules_created_today
        FROM task_modules tm
        WHERE tm.created_by = $1::uuid
      `;
      const moduleWorkResult = await mainDb.query(moduleWorkQuery, [developerId, startDate, actualEndDate]);
      const moduleWork = moduleWorkResult.rows[0] || { modules_created_today: 0 };

      // Get modules edited today (via updates/submissions)
      const modulesEditedQuery = `
        SELECT COUNT(DISTINCT tm.id) as count
        FROM task_modules tm
        WHERE tm.created_by = $1::uuid
        AND tm.id IN (
          SELECT DISTINCT module_id FROM module_submissions 
          WHERE developer_id = $1::uuid 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
          UNION
          SELECT DISTINCT module_id FROM module_updates 
          WHERE developer_id = $1::uuid 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date
        )
        AND NOT (DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') >= $2::date
                AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') <= $3::date)
      `;
      const modulesEditedResult = await mainDb.query(modulesEditedQuery, [developerId, startDate, actualEndDate]);
      const modulesEdited = parseInt(modulesEditedResult.rows[0]?.count || '0');

      defaultData.rawData.modulesCreated = parseInt(String(moduleWork.modules_created_today)) || 0;
      defaultData.rawData.modulesEdited = modulesEdited;
      
      console.log(`✅ Module work: ${moduleWork.modules_created_today} created today, ${modulesEdited} edited`);
    } catch (error) {
      console.error('❌ Error fetching module work:', error);
    }

    // 6. Calculate goals met (simple scoring)
    const goalsMetToday = [
      defaultData.rawData.workMinutes >= 240, // 4+ hours
      defaultData.rawData.codeSubmissions >= 1, // 1+ code submission
      defaultData.rawData.loomVideos >= 1, // 1+ loom video
      defaultData.rawData.scribes >= 1 // 1+ scribe/cursor chat
    ].filter(Boolean).length;
    
    defaultData.rawData.goalsMetToday = goalsMetToday;

    console.log(`✅ Daily goals met: ${goalsMetToday}/4`);

    return defaultData;

  } catch (error) {
    console.error('❌ Error gathering developer data:', error);
    throw error;
  }
}

// Get individual developer basic data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get('developerId');
    const date = searchParams.get('date') || getCSTDate();

    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 });
    }

    console.log(`🔍 Getting basic data for developer ${developerId} for date ${date}`);

    // Gather basic developer data without AI analysis
    const developerData = await gatherBasicDeveloperData(developerId, date);

    console.log(`✅ Basic data retrieved for ${developerData.developer.name}`);

    return NextResponse.json({
      success: true,
      date,
      developer: developerData.developer,
      rawData: developerData.rawData
    });

  } catch (error: any) {
    console.error('Error getting developer basic data:', error);
    return NextResponse.json(
      { error: 'Failed to get developer data', details: error.message },
      { status: 500 }
    );
  }
}

// Get all developers basic data for the team overview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both single date and date range requests
    let startDate: string;
    let endDate: string;
    
    if (body.date) {
      // Single date mode (legacy support)
      startDate = body.date;
      endDate = body.date;
    } else if (body.startDate && body.endDate) {
      // Date range mode
      startDate = body.startDate;
      endDate = body.endDate;
    } else {
      // Default to current date
      const currentDate = getCSTDate();
      startDate = currentDate;
      endDate = currentDate;
    }
    
    console.log(`🗓️ Processing request for date range: ${startDate} to ${endDate}`);

    const mainDb = getMainDbPool();

    // Get specific developers only
    const targetDevelopers = ['junniel', 'adrian', 'alfredo', 'enrique', 'francis'];
    const developersQuery = `
      SELECT id, name, email, role 
      FROM developers 
      WHERE (status = 'active' OR status IS NULL)
      AND (
        LOWER(name) LIKE ANY($1) OR 
        LOWER(email) LIKE ANY($1)
      )
      ORDER BY name
    `;
    const searchPatterns = targetDevelopers.map(name => `%${name.toLowerCase()}%`);
    const developersResult = await mainDb.query(developersQuery, [searchPatterns]);
    const developers = developersResult.rows;

    console.log(`🔍 Getting basic data for ${developers.length} developers for ${startDate} to ${endDate}`);

    // Get basic data for each developer
    const basicData = [];
    
    for (const developer of developers) {
      try {
        const developerData = await gatherBasicDeveloperData(developer.id, startDate, endDate);
        basicData.push(developerData);
        console.log(`✅ Retrieved basic data for ${developer.name}`);
      } catch (error) {
        console.log(`⏭️  Skipping ${developer.name} due to error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Retrieved basic data for ${basicData.length}/${developers.length} developers`);

    return NextResponse.json({
      success: true,
      startDate: startDate,
      endDate: endDate,
      developers: basicData,
      metadata: {
        totalDevelopers: developers.length,
        successfulRetrievals: basicData.length
      }
    });

  } catch (error: any) {
    console.error('Error getting team basic data:', error);
    return NextResponse.json(
      { error: 'Failed to get team data', details: error.message },
      { status: 500 }
    );
  }
} 