import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool, getModuleDbPool } from "@/lib/db-pool";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Rate limiting for Anthropic API calls
const API_RATE_LIMIT = {
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 minute
  requests: new Map<string, number[]>()
};

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - API_RATE_LIMIT.windowMs;
  
  if (!API_RATE_LIMIT.requests.has(key)) {
    API_RATE_LIMIT.requests.set(key, []);
  }
  
  const requests = API_RATE_LIMIT.requests.get(key)!;
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  API_RATE_LIMIT.requests.set(key, validRequests);
  
  if (validRequests.length >= API_RATE_LIMIT.maxRequests) {
    return true;
  }
  
  // Add current request
  validRequests.push(now);
  API_RATE_LIMIT.requests.set(key, validRequests);
  
  return false;
}

interface DeveloperAnalysisData {
  developer: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  dailyWorkflow: {
    workMinutes: number;
    breakMinutes: number;
    isWorking: boolean;
    currentPriority?: any;
    dailyGoals: any;
  };
  codeSubmissions: {
    count: number;
    averageScore: number;
    submissions: any[];
  };
  loomVideos: {
    count: number;
    totalDuration: number;
    videos: any[];
    sources?: {
      task: number;
      module_url: number;
      module_metadata: number;
      module_description: number;
      module_updates: number;
      milestone_updates: number;
    };
  };
  scribes: {
    count: number;
    scribes: any[];
    sources?: {
      module_submission: number;
      cursor_chat: number;
      module_update: number;
    };
  };
  moduleWork: {
    modulesCreated: number;
    modulesWorkedOn: number;
    modulesEdited?: number;
    recentModules: any[];
    moduleSubmissions: any[];
    moduleTypes?: number;
    editedModules?: any[];
    submissionCount?: number;
  };
  taskProgress: {
    completed: number;
    inProgress: number;
    totalAssigned: number;
    completionRate: number;
    recentTasks: any[];
  };
  productivity: {
    submissionsToday: number;
    goalsMetToday: number;
    weeklyTrend: any;
  };
  timeTracking: {
    totalHoursWorked: number;
    averageSessionLength: number;
    workSessions: any[];
  };
}

// Utility function to get CST date (dashboard view consideration)
function getCSTDate(date?: Date): string {
  const now = date || new Date();
  
  // Use proper timezone conversion for America/Chicago (handles CDT/CST automatically)
  const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  
  const hour = chicagoTime.getHours();
  const minute = chicagoTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const dashboardCutoffMinutes = 21 * 60; // 9:00 PM = 21:00 (extended for admin dashboard viewing)
  
  // Get the date in Chicago timezone
  let workDate = new Date(now.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }));
  
  // If it's after 9 PM Chicago time, this counts for the NEXT day (admin can check until 9 PM)
  if (totalMinutes > dashboardCutoffMinutes) {
    workDate.setDate(workDate.getDate() + 1);
  }
  
  return workDate.toISOString().split('T')[0];
}

async function gatherDeveloperData(developerId: string, date: string): Promise<DeveloperAnalysisData> {
  const mainDb = getMainDbPool();
  const moduleDb = getModuleDbPool();

  // Fix date handling - ensure we're using CST timezone
  const currentCSTDate = getCSTDate();
  const analysisDate = date || currentCSTDate;
  
  console.log(`🔍 Gathering data for developer ${developerId} on ${analysisDate} (CST current: ${currentCSTDate})`);
  console.log(`🕒 Using CST timezone adjustment for database queries: America/Chicago`);

  try {
    // Get developer basic info
    const developerQuery = `SELECT id, name, email, role FROM developers WHERE id = $1::uuid`;
    const developerResult = await mainDb.query(developerQuery, [developerId]);
    const developer = developerResult.rows[0];

    if (!developer) {
      throw new Error('Developer not found');
    }

    console.log(`✅ Found developer: ${developer.name}`);

    // Initialize default data structures
    const defaultData: DeveloperAnalysisData = {
      developer,
      dailyWorkflow: {
        workMinutes: 0,
        breakMinutes: 0,
        isWorking: false,
        currentPriority: null,
        dailyGoals: {
          cursorChats: 0,
          loomVideos: 0,
          codeSubmissions: 0
        }
      },
      codeSubmissions: {
        count: 0,
        averageScore: 0,
        submissions: []
      },
      loomVideos: {
        count: 0,
        totalDuration: 0,
        videos: []
      },
      scribes: {
        count: 0,
        scribes: []
      },
      moduleWork: {
        modulesCreated: 0,
        modulesWorkedOn: 0,
        recentModules: [],
        moduleSubmissions: []
      },
      taskProgress: {
        completed: 0,
        inProgress: 0,
        totalAssigned: 0,
        completionRate: 0,
        recentTasks: []
      },
      productivity: {
        submissionsToday: 0,
        goalsMetToday: 0,
        weeklyTrend: {}
      },
      timeTracking: {
        totalHoursWorked: 0,
        averageSessionLength: 0,
        workSessions: []
      }
    };

    // Try to get ALL real developer data - comprehensive approach
    
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
          -- Calculate current session duration in real-time (same as work-session API)
          CASE 
            WHEN is_active = true THEN
              GREATEST(0, EXTRACT(EPOCH FROM (NOW() - COALESCE(break_end, start_time))) / 60)::INTEGER
            ELSE 0
          END as current_session_minutes,
          -- Calculate current break duration if on break
          CASE 
            WHEN is_active = true AND break_start IS NOT NULL AND break_end IS NULL THEN
              GREATEST(0, EXTRACT(EPOCH FROM (NOW() - break_start)) / 60)::INTEGER
            ELSE 0
          END as current_break_minutes
        FROM developer_work_sessions 
        WHERE developer_id = $1::uuid 
        AND DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY start_time DESC
      `;
      const workSessionsResult = await mainDb.query(workSessionsQuery, [developerId, analysisDate]);
      const workSessions = workSessionsResult.rows;
      
      // Calculate total work time for today INCLUDING active session time
      let totalWorkMinutes = 0;
      let totalBreakMinutes = 0;
      let isCurrentlyWorking = false;
      
      workSessions.forEach(session => {
        // Add completed work minutes
        totalWorkMinutes += parseInt(String(session.total_work_minutes)) || 0;
        totalBreakMinutes += parseInt(String(session.total_break_minutes)) || 0;
        
        // Add current session work time if active and not on break
        if (session.is_active) {
          isCurrentlyWorking = true;
          const isOnBreak = session.break_start && !session.break_end;
          if (!isOnBreak) {
            totalWorkMinutes += parseInt(String(session.current_session_minutes)) || 0;
          }
          // Add current break time if on break
          if (isOnBreak) {
            totalBreakMinutes += parseInt(String(session.current_break_minutes)) || 0;
          }
        }
      });

      defaultData.timeTracking = {
        totalHoursWorked: Math.round((totalWorkMinutes / 60) * 100) / 100,
        averageSessionLength: workSessions.length > 0 ? Math.round(totalWorkMinutes / workSessions.length) : 0,
        workSessions
      };
      
      defaultData.dailyWorkflow.workMinutes = totalWorkMinutes;
      defaultData.dailyWorkflow.breakMinutes = totalBreakMinutes;
      defaultData.dailyWorkflow.isWorking = isCurrentlyWorking;
      
      console.log(`✅ Work sessions: ${workSessions.length} sessions, ${totalWorkMinutes} minutes (${(totalWorkMinutes/60).toFixed(1)}h) - includes real-time active session`);
    } catch (error: any) {
      console.log(`⚠️  Work sessions query failed:`, error.message);
    }

    // 2. Get code submissions with enhanced module/task context for better grading
    try {
      const submissionsQuery = `
        SELECT 
          ms.*,
          tm.name as module_name,
          tm.description as module_description,
          tm.module_type_id,
          tm.metadata as module_metadata,
          tm.estimated_hours,
          tm.completion_percentage,
          t.title as task_title,
          t.description as task_description,
          t.requirements,
          t.acceptance_criteria,
          t.priority,
          mt.name as module_type_name,
          mt.description as module_type_description
        FROM module_submissions ms
        LEFT JOIN task_modules tm ON ms.module_id = tm.id
        LEFT JOIN tasks t ON tm.task_id = t.id
        LEFT JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE ms.developer_id = $1::uuid 
        AND ms.submission_type = 'code'
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY ms.created_at DESC
        LIMIT 15
      `;
      const submissionsResult = await mainDb.query(submissionsQuery, [developerId, analysisDate]);
      const submissions = submissionsResult.rows;

      // Enhanced scoring that considers module complexity and task requirements
      const enhancedScoring = submissions.map(submission => {
        let baseScore = submission.score || 0;
        let contextualScore = baseScore;
        
        // Contextual scoring adjustments based on module and task context
        const taskDifficulty = submission.priority || 'medium';
        const moduleComplexity = submission.estimated_hours || 1;
        
        // Safely parse JSON fields with error handling
        let taskRequirements = 0;
        let acceptanceCriteria = 0;
        
        try {
          if (submission.requirements && typeof submission.requirements === 'string') {
            const parsed = JSON.parse(submission.requirements);
            taskRequirements = Array.isArray(parsed) ? parsed.length : (parsed ? 1 : 0);
          }
        } catch (e) {
          // If JSON parsing fails, treat as a single requirement if content exists
          taskRequirements = submission.requirements ? 1 : 0;
        }
        
        try {
          if (submission.acceptance_criteria && typeof submission.acceptance_criteria === 'string') {
            const parsed = JSON.parse(submission.acceptance_criteria);
            acceptanceCriteria = Array.isArray(parsed) ? parsed.length : (parsed ? 1 : 0);
          }
        } catch (e) {
          // If JSON parsing fails, treat as a single criterion if content exists
          acceptanceCriteria = submission.acceptance_criteria ? 1 : 0;
        }
        
        // Adjust score based on contextual factors
        const priorityMultipliers: { [key: string]: number } = {
          'low': 1.0,
          'medium': 1.1,
          'high': 1.2,
          'urgent': 1.3
        };
        const priorityMultiplier = priorityMultipliers[taskDifficulty] || 1.0;
        
        const complexityBonus = Math.min(10, moduleComplexity * 2);
        const requirementsBonus = Math.min(10, taskRequirements * 3);
        const criteriaBonus = Math.min(10, acceptanceCriteria * 2);
        
        contextualScore = Math.min(100, (baseScore * priorityMultiplier) + complexityBonus + requirementsBonus + criteriaBonus);
        
        return {
          ...submission,
          contextualScore: Math.round(contextualScore),
          scoringFactors: {
            baseScore,
            priorityMultiplier,
            complexityBonus,
            requirementsBonus,
            criteriaBonus,
            taskDifficulty,
            moduleComplexity,
            taskRequirements,
            acceptanceCriteria
          }
        };
      });

      const averageScore = enhancedScoring.length > 0 
        ? enhancedScoring.reduce((sum, sub) => sum + (sub.contextualScore || sub.score || 0), 0) / enhancedScoring.length 
        : 0;

      defaultData.codeSubmissions = {
        count: submissions.length,
        averageScore: Math.round(averageScore),
        submissions: enhancedScoring
      };
      
      console.log(`✅ Code submissions: ${submissions.length} found, avg score: ${Math.round(averageScore)} (enhanced contextual scoring)`);
    } catch (error: any) {
      console.log(`⚠️  Code submissions query failed:`, error.message);
    }

    // 3. Get Loom videos from 6 sources (same as admin individual task view)
    try {
      const loomVideosFromSources = [];
      
      // Source 1: Task-level loom videos
      const taskLoomQuery = `
        SELECT 
          t.id,
          t.loom_video_url,
          t.title,
          t.created_at
        FROM tasks t
        JOIN task_assignments ta ON t.id::text = ta.task_id
        WHERE ta.developer_id = $1::uuid 
        AND t.loom_video_url IS NOT NULL 
        AND t.loom_video_url LIKE '%loom.com%'
        AND DATE(t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY t.created_at DESC
      `;
      const taskLoomResult = await mainDb.query(taskLoomQuery, [developerId, analysisDate]);
      const taskLoomVideos = taskLoomResult.rows.map(row => ({
        id: `task-${row.id}`,
        url: row.loom_video_url,
        source: 'task',
        title: `Task: ${row.title}`,
        created_at: row.created_at
      }));
      loomVideosFromSources.push(...taskLoomVideos);
      
      // Source 2-6: Module-related loom videos
      const moduleQuery = `
        SELECT 
          tm.id,
          tm.name,
          tm.url,
          tm.description,
          tm.metadata,
          tm.created_at,
          tm.task_id,
          t.title as task_title
        FROM task_modules tm
        LEFT JOIN tasks t ON tm.task_id = t.id
        WHERE tm.created_by = $1::uuid
        AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY tm.created_at DESC
      `;
      const moduleResult = await mainDb.query(moduleQuery, [developerId, analysisDate]);
      const modules = moduleResult.rows;
      
             // Helper function to extract loom URLs from text
       const extractLoomUrls = (text: string | null | undefined): string[] => {
         if (!text) return [];
         const loomRegex = /https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/[a-zA-Z0-9]+/g;
         return text.match(loomRegex) || [];
       };
      
      for (const module of modules) {
        // Source 2: Module URL field
        if (module.url && module.url.includes('loom.com')) {
          loomVideosFromSources.push({
            id: `module-url-${module.id}`,
            url: module.url,
            source: 'module_url',
            title: `${module.name} - Main Demo`,
            module_name: module.name,
            module_id: module.id,
            created_at: module.created_at
          });
        }
        
        // Source 3: Module metadata field
        if (module.metadata) {
          try {
            const metadata = typeof module.metadata === 'string' ? JSON.parse(module.metadata) : module.metadata;
            if (metadata.loom_video_url && metadata.loom_video_url.includes('loom.com')) {
              loomVideosFromSources.push({
                id: `module-metadata-${module.id}`,
                url: metadata.loom_video_url,
                source: 'module_metadata',
                title: `${module.name} - Metadata Video`,
                module_name: module.name,
                module_id: module.id,
                created_at: module.created_at
              });
            }
                     } catch (e: any) {
             console.warn(`Failed to parse module metadata for ${module.id}:`, e.message);
           }
        }
        
        // Source 4: Module description embedded URLs
        if (module.description) {
          const descLoomUrls = extractLoomUrls(module.description);
          descLoomUrls.forEach((url, index) => {
            loomVideosFromSources.push({
              id: `module-desc-${module.id}-${index}`,
              url: url,
              source: 'module_description',
              title: `${module.name} - Description Video ${index + 1}`,
              module_name: module.name,
              module_id: module.id,
              created_at: module.created_at
            });
          });
        }
      }
      
      // Source 5: Module updates content
      const moduleUpdatesQuery = `
        SELECT 
          mu.*,
          tm.name as module_name
        FROM module_updates mu
        LEFT JOIN task_modules tm ON mu.module_id = tm.id
        WHERE mu.developer_id = $1::uuid
        AND (mu.content LIKE '%loom.com%' OR COALESCE(mu.media_urls::text, '') LIKE '%loom.com%')
        AND DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY mu.created_at DESC
      `;
      const moduleUpdatesResult = await mainDb.query(moduleUpdatesQuery, [developerId, analysisDate]);
      const moduleUpdates = moduleUpdatesResult.rows;
      
      for (const update of moduleUpdates) {
        const updateLoomUrls = extractLoomUrls(update.content || '');
        updateLoomUrls.forEach((url, index) => {
          loomVideosFromSources.push({
            id: `module-update-${update.id}-${index}`,
            url: url,
            source: 'module_updates',
            title: `${update.module_name} - Update Video`,
            module_name: update.module_name,
            module_id: update.module_id,
            created_at: update.created_at
          });
        });
      }
      
      // Source 6: Milestone updates content (with error handling and proper UUID casting)
      let milestoneUpdates = [];
      try {
        const milestoneUpdatesQuery = `
          SELECT 
            mu.*,
            m.title as milestone_title
          FROM milestone_updates mu
          LEFT JOIN milestones m ON mu.milestone_id = m.id
          WHERE mu.developer_id = $1::uuid
          AND mu.content LIKE '%loom.com%'
          AND DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          ORDER BY mu.created_at DESC
        `;
        const milestoneUpdatesResult = await mainDb.query(milestoneUpdatesQuery, [developerId, analysisDate]);
        milestoneUpdates = milestoneUpdatesResult.rows;
      } catch (milestoneError: any) {
        console.warn(`Milestone updates query failed: ${milestoneError.message}`);
        // Table might not exist or have different schema, continue without milestone updates
        milestoneUpdates = [];
      }
      
      for (const update of milestoneUpdates) {
        const milestoneUpdateLoomUrls = extractLoomUrls(update.content || '');
        milestoneUpdateLoomUrls.forEach((url, index) => {
          loomVideosFromSources.push({
            id: `milestone-update-${update.id}-${index}`,
            url: url,
            source: 'milestone_updates',
            title: `${update.milestone_title} - Update Video`,
            milestone_title: update.milestone_title,
            milestone_id: update.milestone_id,
            created_at: update.created_at
          });
        });
      }
      
      defaultData.loomVideos = {
        count: loomVideosFromSources.length,
        totalDuration: 0, // Could calculate if duration data available
        videos: loomVideosFromSources,
        sources: {
          task: taskLoomVideos.length,
          module_url: loomVideosFromSources.filter(v => v.source === 'module_url').length,
          module_metadata: loomVideosFromSources.filter(v => v.source === 'module_metadata').length,
          module_description: loomVideosFromSources.filter(v => v.source === 'module_description').length,
          module_updates: loomVideosFromSources.filter(v => v.source === 'module_updates').length,
          milestone_updates: loomVideosFromSources.filter(v => v.source === 'milestone_updates').length
        }
      };
      
      console.log(`✅ Loom videos: ${loomVideosFromSources.length} found from 6 sources`, defaultData.loomVideos.sources);
    } catch (error: any) {
      console.log(`⚠️  Loom videos query failed:`, error.message);
    }

    // 4. Get scribes/cursor chats from multiple sources (enhanced)
    try {
      const scribesFromSources = [];
      
      // Module submissions with cursor chats
      const moduleScribesQuery = `
        SELECT 
          ms.*,
          tm.name as module_name,
          t.title as task_title,
          tm.task_id
        FROM module_submissions ms
        LEFT JOIN task_modules tm ON ms.module_id = tm.id
        LEFT JOIN tasks t ON tm.task_id = t.id
        WHERE ms.developer_id = $1::uuid 
        AND ms.submission_type = 'cursor_chat'
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY ms.created_at DESC
      `;
      const moduleScribesResult = await mainDb.query(moduleScribesQuery, [developerId, analysisDate]);
      const moduleScribes = moduleScribesResult.rows.map(row => ({
        ...row,
        source: 'module_submission',
        type: 'cursor_chat'
      }));
      scribesFromSources.push(...moduleScribes);
      
      // Direct cursor chats
      const cursorChatsQuery = `
        SELECT *
        FROM cursor_chats
        WHERE developer_id = $1::uuid
        AND DATE(upload_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY upload_date DESC
      `;
      const cursorChatsResult = await mainDb.query(cursorChatsQuery, [developerId, analysisDate]);
      const cursorChats = cursorChatsResult.rows.map(row => ({
        ...row,
        source: 'cursor_chat',
        type: 'cursor_chat'
      }));
      scribesFromSources.push(...cursorChats);
      
      // Check for scribes in module updates
      const moduleUpdateScribesQuery = `
        SELECT 
          mu.*,
          tm.name as module_name,
          'module_update' as source_type
        FROM module_updates mu
        LEFT JOIN task_modules tm ON mu.module_id = tm.id
        WHERE mu.developer_id = $1::uuid
        AND mu.update_type = 'cursor_chat'
        AND DATE(mu.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY mu.created_at DESC
      `;
      const moduleUpdateScribesResult = await mainDb.query(moduleUpdateScribesQuery, [developerId, analysisDate]);
      const moduleUpdateScribes = moduleUpdateScribesResult.rows.map(row => ({
        ...row,
        source: 'module_update',
        type: 'cursor_chat'
      }));
      scribesFromSources.push(...moduleUpdateScribes);
      
      defaultData.scribes = {
        count: scribesFromSources.length,
        scribes: scribesFromSources,
        sources: {
          module_submission: moduleScribes.length,
          cursor_chat: cursorChats.length,
          module_update: moduleUpdateScribes.length
        }
      };
      
      console.log(`✅ Scribes: ${scribesFromSources.length} found from 3 sources (${moduleScribes.length} module submissions + ${cursorChats.length} cursor chats + ${moduleUpdateScribes.length} module updates)`);
    } catch (error: any) {
      console.log(`⚠️  Scribes query failed:`, error.message);
    }

    // 5. Get enhanced module work with created/edited differentiation
    try {
      const moduleWorkQuery = `
        SELECT 
          COUNT(CASE WHEN DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date THEN 1 END) as modules_created_today,
          COUNT(DISTINCT tm.id) as total_modules_worked_on,
          COUNT(DISTINCT tm.module_type_id) as module_types_worked_on
        FROM task_modules tm
        WHERE tm.created_by = $1::uuid
      `;
      const moduleWorkResult = await mainDb.query(moduleWorkQuery, [developerId, analysisDate]);
      const moduleWork = moduleWorkResult.rows[0] || { modules_created_today: 0, total_modules_worked_on: 0, module_types_worked_on: 0 };

      // Get modules edited today (via updates/submissions)
      const modulesEditedQuery = `
        SELECT DISTINCT tm.id, tm.name, tm.module_type_id, mt.name as module_type_name
        FROM task_modules tm
        LEFT JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE tm.created_by = $1::uuid
        AND tm.id IN (
          SELECT DISTINCT module_id FROM module_submissions 
          WHERE developer_id = $1::uuid 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
          UNION
          SELECT DISTINCT module_id FROM module_updates 
          WHERE developer_id = $1::uuid 
          AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        )
        AND DATE(tm.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') != $2::date
      `;
      const modulesEditedResult = await mainDb.query(modulesEditedQuery, [developerId, analysisDate]);
      const modulesEdited = modulesEditedResult.rows;

      // Get recent modules with type info
      const recentModulesQuery = `
        SELECT tm.*, t.title as task_title, mt.name as module_type_name
        FROM task_modules tm
        LEFT JOIN tasks t ON tm.task_id = t.id
        LEFT JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE tm.created_by = $1::uuid
        ORDER BY tm.created_at DESC
        LIMIT 5
      `;
      const recentModulesResult = await mainDb.query(recentModulesQuery, [developerId]);
      const recentModules = recentModulesResult.rows;

      // Get module submissions for today
      const moduleSubmissionsQuery = `
        SELECT ms.*, tm.name as module_name, tm.module_type_id, mt.name as module_type_name
        FROM module_submissions ms
        LEFT JOIN task_modules tm ON ms.module_id = tm.id
        LEFT JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE ms.developer_id = $1::uuid
        AND DATE(ms.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') = $2::date
        ORDER BY ms.created_at DESC
      `;
      const moduleSubmissionsResult = await mainDb.query(moduleSubmissionsQuery, [developerId, analysisDate]);
      const moduleSubmissions = moduleSubmissionsResult.rows;

      defaultData.moduleWork = {
        modulesCreated: parseInt(String(moduleWork.modules_created_today)) || 0,
        modulesWorkedOn: parseInt(String(moduleWork.total_modules_worked_on)) || 0,
        modulesEdited: modulesEdited.length,
        recentModules,
        moduleSubmissions,
        moduleTypes: parseInt(String(moduleWork.module_types_worked_on)) || 0,
        editedModules: modulesEdited,
        submissionCount: moduleSubmissions.length
      };
      
      console.log(`✅ Module work: ${moduleWork.modules_created_today} created today, ${modulesEdited.length} edited, ${moduleWork.total_modules_worked_on} total, ${moduleWork.module_types_worked_on} types`);
    } catch (error: any) {
      console.log(`⚠️  Module work query failed:`, error.message);
    }

    // Try to get task progress from main DB (handle type mismatches)
    try {
      const taskProgressQuery = `
        SELECT 
          COUNT(CASE WHEN ta.status = 'completed' OR ta.completed_at IS NOT NULL THEN 1 END) as completed,
          COUNT(CASE WHEN ta.status = 'assigned' AND ta.completed_at IS NULL THEN 1 END) as in_progress,
          COUNT(*) as total_assigned
        FROM task_assignments ta
        WHERE ta.developer_id = $1::uuid
      `;
      const taskProgressResult = await mainDb.query(taskProgressQuery, [developerId]);
      const taskProgress = taskProgressResult.rows[0];

      if (taskProgress) {
        const completed = parseInt(String(taskProgress.completed)) || 0;
        const inProgress = parseInt(String(taskProgress.in_progress)) || 0;
        const totalAssigned = parseInt(String(taskProgress.total_assigned)) || 0;
        const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

        defaultData.taskProgress = {
          completed,
          inProgress,
          totalAssigned,
          completionRate: Math.round(completionRate),
          recentTasks: []
        };
        
        console.log(`✅ Task progress: ${completed}/${totalAssigned} completed, ${inProgress} in progress`);
      }
    } catch (error: any) {
      console.log(`⚠️  Task progress query failed:`, error.message);
    }

    console.log(`✅ Data gathering completed for ${developer.name}`);
    return defaultData;

  } catch (error) {
    console.error('Error gathering developer data:', error);
    throw error;
  }
}

// Enhanced JSON parsing with better error handling
function parseAIResponse(responseText: string): any {
  let cleanedText = responseText.trim();
  
  // Handle various markdown formats
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Handle markdown headers or text before JSON
  if (cleanedText.includes('{')) {
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }
  }
  
  // Try to parse JSON with multiple attempts
  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    // Try to fix common JSON issues
    try {
      // Fix unescaped quotes and newlines
      let fixedText = cleanedText
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/([^\\])"/g, '$1\\"');
      
      return JSON.parse(fixedText);
    } catch (secondError) {
      // Final attempt: extract key-value pairs manually
      console.warn('Failed to parse AI response, attempting manual extraction');
      return extractJSONFromText(cleanedText);
    }
  }
}

// Manual JSON extraction as fallback
function extractJSONFromText(text: string): any {
  const fallbackAnalysis = {
    overallRating: "average",
    overallScore: 75,
    keyInsights: ["Analysis parsing failed - manual review needed"],
    strengths: ["Data collected successfully"],
    concerns: ["AI response parsing failed"],
    recommendations: ["Manual review recommended"],
    productivityAnalysis: {
      timeManagement: { score: 75, feedback: "Data available for manual review" },
      codeQuality: { score: 75, feedback: "Based on submission scores" },
      taskExecution: { score: 75, feedback: "Based on completion rate" },
      goalAchievement: { score: 75, feedback: "Based on daily goals" }
    },
    trendAnalysis: {
      trajectory: "stable",
      explanation: "AI analysis unavailable"
    },
    nextDayFocus: ["Continue current work", "Review priorities"]
  };
  
  // Try to extract some meaningful data from the text
  try {
    const scoreMatch = text.match(/score.*?(\d+)/i);
    if (scoreMatch) {
      fallbackAnalysis.overallScore = parseInt(scoreMatch[1]);
    }
    
    const ratingMatch = text.match(/rating.*?(excellent|good|average|needs_improvement|concerning)/i);
    if (ratingMatch) {
      fallbackAnalysis.overallRating = ratingMatch[1].toLowerCase();
    }
  } catch (error) {
    console.error('Error in manual extraction:', error);
  }
  
  return fallbackAnalysis;
}

async function analyzeWithAI(data: DeveloperAnalysisData, date: string): Promise<any> {
  const rateLimitKey = `ai_analysis_${data.developer.id}`;
  
  // Check rate limit
  if (isRateLimited(rateLimitKey)) {
    console.warn(`Rate limit exceeded for developer ${data.developer.id}`);
    throw new Error('Rate limit exceeded - please wait before retrying');
  }

  // Create concise summary to avoid token limits
  const summary = {
    developer: data.developer.name,
    date: date,
    workTime: {
      totalHours: data.timeTracking.totalHoursWorked,
      sessions: data.timeTracking.workSessions.length,
      averageSession: data.timeTracking.averageSessionLength,
      isActive: data.dailyWorkflow.isWorking
    },
    codeWork: {
      submissions: data.codeSubmissions.count,
      averageScore: data.codeSubmissions.averageScore,
      bestScore: data.codeSubmissions.submissions.length > 0 ? 
        Math.max(...data.codeSubmissions.submissions.map(s => s.contextualScore || s.score || 0)) : 0,
      moduleTypes: data.moduleWork.moduleTypes || 0
    },
    modules: {
      created: data.moduleWork.modulesCreated,
      edited: data.moduleWork.modulesEdited || 0,
      totalWorkedOn: data.moduleWork.modulesWorkedOn,
      submissions: data.moduleWork.submissionCount || 0
    },
    communication: {
      loomVideos: data.loomVideos.count,
      scribes: data.scribes.count,
      videoSources: data.loomVideos.sources || {},
      scribeSources: data.scribes.sources || {}
    },
    tasks: {
      completed: data.taskProgress.completed,
      inProgress: data.taskProgress.inProgress,
      total: data.taskProgress.totalAssigned,
      completionRate: data.taskProgress.completionRate
    },
    goals: {
      metToday: data.productivity.goalsMetToday,
      submissionsToday: data.productivity.submissionsToday
    }
  };

  const prompt = `Analyze developer's DAILY accomplishments for ${summary.developer} on ${summary.date}.

FOCUS ON TODAY'S WORK ONLY:
- Daily Work Time: ${summary.workTime.totalHours}h logged in ${summary.workTime.sessions} work sessions
- Daily Module Creation: ${summary.modules.created} modules created today (with code submissions)
- Task Alignment: How today's ${summary.modules.created} modules align with ${summary.tasks.inProgress} active tasks
- Daily Documentation: ${summary.communication.loomVideos} loom videos + ${summary.communication.scribes} scribes/cursor chats
- Daily Code Quality: ${summary.codeWork.submissions} code submissions today, avg score: ${summary.codeWork.averageScore}
- Active Status: ${summary.workTime.isActive ? 'Currently working' : 'Not active'}

Analyze ONLY what was accomplished TODAY - ignore historical data. Focus on:
1. Today's productivity (work hours vs output)
2. Today's module creation and quality
3. Today's documentation/communication efforts
4. How today's work aligns with assigned tasks

Respond with ONLY valid JSON:
{
  "overallRating": "excellent|good|average|needs_improvement|concerning",
  "overallScore": number(0-100),
  "keyInsights": ["Brief insight"],
  "strengths": ["What they do well"],
  "concerns": ["Areas needing attention"],
  "recommendations": ["Actionable suggestions"],
  "productivityAnalysis": {
    "timeManagement": {"score": number(0-100), "feedback": "brief analysis"},
    "codeQuality": {"score": number(0-100), "feedback": "brief analysis"},
    "taskExecution": {"score": number(0-100), "feedback": "brief analysis"}, 
    "goalAchievement": {"score": number(0-100), "feedback": "brief analysis"}
  },
  "trendAnalysis": {
    "trajectory": "improving|stable|declining",
    "explanation": "brief explanation"
  },
  "nextDayFocus": ["Priority for tomorrow"]
}`;

  try {
    console.log('🤖 Sending developer analysis to Claude AI...');
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic API");
    }

    console.log('✅ Received AI analysis response');
    console.log('🧹 Raw response preview:', content.text.substring(0, 200) + '...');
    
    // Use enhanced parsing
    const analysis = parseAIResponse(content.text);
    
    console.log('✅ Successfully parsed AI analysis');
    return analysis;

  } catch (error: any) {
    console.error('Error in AI analysis:', error);
    
    // Check if it's a rate limit error and get reset time
    if (error.status === 429) {
      const resetTime = error.headers?.['anthropic-ratelimit-input-tokens-reset'];
      if (resetTime) {
        const resetDate = new Date(resetTime);
        const waitTime = Math.max(0, resetDate.getTime() - Date.now());
        console.log(`⏱️  Rate limit reset at: ${resetDate.toISOString()}`);
        console.log(`⏱️  Wait time: ${Math.ceil(waitTime / 1000)} seconds`);
      }
      throw new Error(`Rate limit exceeded. Please wait before retrying. Reset time: ${resetTime || 'unknown'}`);
    }
    
    // Re-throw other errors without fake data
    throw error;
  }
}

// Enhanced rate limit checking with dynamic delays
async function waitForRateLimit(): Promise<void> {
  // Wait for rate limit reset if we know about it
  const now = Date.now();
  
  // Get the earliest reset time from our stored rate limit info
  let earliestReset = now;
  for (const [key, requests] of API_RATE_LIMIT.requests.entries()) {
    if (requests.length >= API_RATE_LIMIT.maxRequests) {
      // This key is rate limited, wait for the oldest request to expire
      const oldestRequest = Math.min(...requests);
      const resetTime = oldestRequest + API_RATE_LIMIT.windowMs;
      if (resetTime > earliestReset) {
        earliestReset = resetTime;
      }
    }
  }
  
  if (earliestReset > now) {
    const waitTime = earliestReset - now;
    console.log(`⏱️  Waiting ${Math.ceil(waitTime / 1000)} seconds for rate limit reset...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get('developerId');
    const date = searchParams.get('date') || getCSTDate();

    if (!developerId) {
      return NextResponse.json({ error: 'Developer ID is required' }, { status: 400 });
    }

    console.log(`🔍 Analyzing developer ${developerId} for date ${date}`);

    // Gather comprehensive developer data
    const developerData = await gatherDeveloperData(developerId, date);
    
    // Analyze with AI
    const aiAnalysis = await analyzeWithAI(developerData, date);

    console.log(`✅ Analysis completed for ${developerData.developer.name}`);

    return NextResponse.json({
      success: true,
      date,
      developer: developerData.developer,
      rawData: {
        // Basic metrics
        workMinutes: developerData.dailyWorkflow.workMinutes,
        codeSubmissions: developerData.codeSubmissions.count,
        averageScore: developerData.codeSubmissions.averageScore,
        goalsMetToday: developerData.productivity.goalsMetToday,
        loomVideos: developerData.loomVideos.count,
        scribes: developerData.scribes.count,
        modulesCreated: developerData.moduleWork.modulesCreated,
        modulesEdited: developerData.moduleWork.modulesEdited || 0,
        totalHoursWorked: developerData.timeTracking.totalHoursWorked,
        
        // Enhanced structured data for component
        dailyWorkflow: developerData.dailyWorkflow,
        timeTracking: developerData.timeTracking,
        taskProgress: developerData.taskProgress,
        moduleWork: developerData.moduleWork,
        
        // Detailed data arrays
        loomVideoDetails: developerData.loomVideos.videos || [],
        scribeDetails: developerData.scribes.scribes || [],
        loomVideoSources: developerData.loomVideos.sources,
        scribeSources: developerData.scribes.sources
      },
      analysis: aiAnalysis
    });

  } catch (error: any) {
    console.error('Error in developer analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze developer', details: error.message },
      { status: 500 }
    );
  }
}

// Get all developers for the analysis overview
export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();
    const analysisDate = date || getCSTDate();

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

    console.log(`🔍 Analyzing ${developers.length} developers for ${analysisDate}`);

    // Analyze each developer with proper rate limit handling
    const analyses = [];
    let successfulAnalyses = 0;
    let rateLimitErrors = 0;
    
    for (let i = 0; i < developers.length; i++) {
      const developer = developers[i];
      
      try {
        // Wait for rate limit if needed
        await waitForRateLimit();
        
        const developerData = await gatherDeveloperData(developer.id, analysisDate);
        
        // Add progressive delay between AI calls to prevent rate limiting
        // Delay increases if we've had rate limit errors
        const baseDelay = 5000; // 5 seconds base delay
        const additionalDelay = rateLimitErrors * 2000; // Additional 2 seconds per rate limit error
        const totalDelay = baseDelay + additionalDelay;
        
        if (i > 0) {
          console.log(`⏱️  Waiting ${totalDelay / 1000} seconds before next AI analysis...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
        
        const aiAnalysis = await analyzeWithAI(developerData, analysisDate);
        
        analyses.push({
          developer: developer,
          analysis: aiAnalysis,
          rawData: {
            // Basic metrics
            workMinutes: developerData.dailyWorkflow.workMinutes,
            codeSubmissions: developerData.codeSubmissions.count,
            averageScore: developerData.codeSubmissions.averageScore,
            goalsMetToday: developerData.productivity.goalsMetToday,
            loomVideos: developerData.loomVideos.count,
            scribes: developerData.scribes.count,
            modulesCreated: developerData.moduleWork.modulesCreated,
            modulesEdited: developerData.moduleWork.modulesEdited || 0,
            totalHoursWorked: developerData.timeTracking.totalHoursWorked,
            
            // Enhanced structured data for component
            dailyWorkflow: developerData.dailyWorkflow,
            timeTracking: developerData.timeTracking,
            taskProgress: developerData.taskProgress,
            moduleWork: developerData.moduleWork,
            
            // Detailed data arrays
            loomVideoDetails: developerData.loomVideos.videos || [],
            scribeDetails: developerData.scribes.scribes || [],
            loomVideoSources: developerData.loomVideos.sources,
            scribeSources: developerData.scribes.sources
          }
        });
        
        successfulAnalyses++;
        console.log(`✅ Successfully analyzed ${developer.name} (${successfulAnalyses}/${developers.length})`);
        
      } catch (error: any) {
        console.error(`❌ Error analyzing developer ${developer.name}:`, error.message);
        
        // Track rate limit errors to adjust delays
        if (error.message.includes('Rate limit exceeded') || error.status === 429) {
          rateLimitErrors++;
          console.log(`⚠️  Rate limit error count: ${rateLimitErrors}`);
          
          // Check if we have reset time information
          if (error.message.includes('Reset time:')) {
            const resetTimeMatch = error.message.match(/Reset time: ([\d-T:.Z]+)/);
            if (resetTimeMatch) {
              const resetTime = new Date(resetTimeMatch[1]);
              const waitTime = Math.max(0, resetTime.getTime() - Date.now());
              if (waitTime > 0) {
                console.log(`⏱️  Waiting for rate limit reset: ${Math.ceil(waitTime / 1000)} seconds`);
                await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Add 1 second buffer
                
                // Retry this developer
                try {
                  console.log(`🔄 Retrying analysis for ${developer.name}...`);
                  const developerData = await gatherDeveloperData(developer.id, analysisDate);
                  const aiAnalysis = await analyzeWithAI(developerData, analysisDate);
                  
                  analyses.push({
                    developer: developer,
                    analysis: aiAnalysis,
                    rawData: {
                      workMinutes: developerData.dailyWorkflow.workMinutes,
                      codeSubmissions: developerData.codeSubmissions.count,
                      averageScore: developerData.codeSubmissions.averageScore,
                      goalsMetToday: developerData.productivity.goalsMetToday,
                      loomVideos: developerData.loomVideos.count,
                      scribes: developerData.scribes.count,
                      modulesCreated: developerData.moduleWork.modulesCreated,
                      modulesEdited: developerData.moduleWork.modulesEdited || 0,
                      totalHoursWorked: developerData.timeTracking.totalHoursWorked,
                      loomVideoSources: developerData.loomVideos.sources,
                      scribeSources: developerData.scribes.sources
                    }
                  });
                  
                  successfulAnalyses++;
                  console.log(`✅ Successfully analyzed ${developer.name} on retry (${successfulAnalyses}/${developers.length})`);
                  
                } catch (retryError: any) {
                  console.error(`❌ Retry failed for ${developer.name}:`, retryError.message);
                  // Skip this developer - no fake data
                }
              }
            }
          }
        } else {
          // For non-rate-limit errors, skip this developer without fake data
          console.log(`⏭️  Skipping ${developer.name} due to error: ${error.message}`);
        }
      }
    }

    console.log(`✅ Completed analysis for ${successfulAnalyses}/${developers.length} developers`);
    
    if (analyses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No developers could be analyzed due to rate limiting or other errors',
        date: analysisDate,
        analyses: []
      }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      date: analysisDate,
      analyses,
      metadata: {
        totalDevelopers: developers.length,
        successfulAnalyses: successfulAnalyses,
        rateLimitErrors: rateLimitErrors
      }
    });

  } catch (error: any) {
    console.error('Error in bulk developer analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze developers', details: error.message },
      { status: 500 }
    );
  }
} 