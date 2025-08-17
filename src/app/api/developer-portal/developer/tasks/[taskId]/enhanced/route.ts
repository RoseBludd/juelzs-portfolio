import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/api-utils';
import { getMainDbPool } from '@/lib/db-pool';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

const mainPool = getMainDbPool();

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get basic task information
    const taskQuery = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.estimated_time,
        t.requirements,
        t.acceptance_criteria,
        t.completed_requirements,
        t.completed_acceptance_criteria,
        ta.status as assignment_status,
        ta.start_date,
        ta.due_date
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id::text = ta.task_id AND ta.developer_id = $1
      WHERE t.id = $2
    `;

    // Get task modules with accountability data
    const modulesQuery = `
      SELECT 
        tm.id,
        tm.name,
        tm.description,
        tm.status,
        tm.completion_percentage,
        tm.module_type,
        tm.url,
        tm.metadata,
        tm.created_at,
        -- Check if module has scribe (adequate description)
        CASE WHEN LENGTH(tm.description) > 50 THEN true ELSE false END as has_scribe,
        -- Check if module has loom video
        CASE WHEN 
          tm.url LIKE '%loom.com%' OR 
          tm.metadata->>'loom_video_url' IS NOT NULL 
        THEN true ELSE false END as has_loom_video,
        -- Check if module has code submission
        CASE WHEN EXISTS(
          SELECT 1 FROM module_submissions ms 
          WHERE ms.module_id = tm.id 
          AND ms.submission_type = 'code'
          AND ms.status = 'approved'
        ) THEN true ELSE false END as has_code_submission
      FROM task_modules tm
      WHERE tm.task_id = $1
      ORDER BY tm.created_at DESC
    `;

    // Get progress updates for this task
    const progressQuery = `
      SELECT 
        id,
        content,
        percentage_complete,
        created_at
      FROM developer_progress_updates
      WHERE developer_id = $1 AND task_id = $2
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Check if this is today's priority task
    const priorityQuery = `
      SELECT 1 FROM developer_daily_priorities
      WHERE developer_id = $1 AND date = $2 AND task_id = $3
    `;

    // Get today's submissions for this developer
    const submissionsQuery = `
      SELECT 
        -- Cursor chats today
        (SELECT COUNT(*) FROM cursor_chats 
         WHERE developer_id = $1 AND DATE(upload_date) = $2) as cursor_chats_today,
        
        -- Loom videos today (from modules and tasks)
        (SELECT COUNT(*) FROM (
          SELECT 1 FROM task_modules 
          WHERE developer_id = $1 
          AND DATE(created_at) = $2
          AND (url LIKE '%loom.com%' OR metadata->>'loom_video_url' IS NOT NULL)
          
          UNION ALL
          
          SELECT 1 FROM module_updates 
          WHERE developer_id = $1 
          AND DATE(created_at) = $2
          AND content LIKE '%loom.com%'
        ) as loom_count) as loom_videos_today,
        
        -- Code submissions today
        (SELECT COUNT(*) FROM module_submissions 
         WHERE developer_id = $1 
         AND submission_type = 'code'
         AND DATE(created_at) = $2) as code_submissions_today,
        
        -- Module scribes (modules with adequate descriptions)
        (SELECT COUNT(*) FROM task_modules 
         WHERE developer_id = $1 
         AND DATE(created_at) = $2
         AND LENGTH(description) > 50) as module_scribes_today
    `;

    // Get work time spent on this task today
    const workTimeQuery = `
      SELECT 
        COALESCE(SUM(total_work_minutes), 0) as total_minutes
      FROM developer_work_sessions
      WHERE developer_id = $1 
      AND DATE(start_time) = $2
    `;

    const [
      taskResult,
      modulesResult,
      progressResult,
      priorityResult,
      submissionsResult,
      workTimeResult
    ] = await Promise.all([
      mainPool.query(taskQuery, [userData.id, taskId]),
      mainPool.query(modulesQuery, [taskId]),
      mainPool.query(progressQuery, [userData.id, taskId]),
      mainPool.query(priorityQuery, [userData.id, today, taskId]),
      mainPool.query(submissionsQuery, [userData.id, today]),
      mainPool.query(workTimeQuery, [userData.id, today])
    ]);

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];
    const modules = modulesResult.rows;
    const progressUpdates = progressResult.rows;
    const isDailyPriority = priorityResult.rows.length > 0;
    const submissions = submissionsResult.rows[0] || {};
    const workTime = workTimeResult.rows[0] || {};

    // Calculate overall task completion percentage based on modules
    let taskCompletionPercentage = 0;
    if (modules.length > 0) {
      const totalCompletion = modules.reduce((sum: number, module: any) => 
        sum + (module.completion_percentage || 0), 0
      );
      taskCompletionPercentage = Math.round(totalCompletion / modules.length);
    }

    // Parse requirements and acceptance criteria
    const requirements = Array.isArray(task.requirements) 
      ? task.requirements.map((req: string, index: number) => ({
          id: `req-${index}`,
          requirement: req,
          completed: task.completed_requirements?.[index] || false
        }))
      : [];

    const acceptanceCriteria = Array.isArray(task.acceptance_criteria)
      ? task.acceptance_criteria.map((criteria: string, index: number) => ({
          id: `criteria-${index}`,
          criteria: criteria,
          completed: task.completed_acceptance_criteria?.[index] || false
        }))
      : [];

    // Calculate required submissions based on modules created
    const moduleCount = modules.length;
    const requiredSubmissions = {
      cursor_chats: 1, // At least 1 cursor chat per day
      loom_videos: Math.max(1, moduleCount), // 1 per module minimum, or at least 1
      code_submissions: Math.max(1, moduleCount), // 1 per module minimum, or at least 1
      module_scribes: moduleCount // 1 scribe per module created
    };

    const completedSubmissions = {
      cursor_chats: parseInt(submissions.cursor_chats_today || '0'),
      loom_videos: parseInt(submissions.loom_videos_today || '0'),
      code_submissions: parseInt(submissions.code_submissions_today || '0'),
      module_scribes: parseInt(submissions.module_scribes_today || '0')
    };

    const enhancedTaskData = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'assigned',
      priority: task.priority || 'medium',
      completion_percentage: taskCompletionPercentage,
      estimated_hours: task.estimated_time || 8,
      time_spent_hours: Math.round((parseInt(workTime.total_minutes || '0') / 60) * 100) / 100,
      requirements: requirements,
      acceptance_criteria: acceptanceCriteria,
      modules: modules.map((module: any) => ({
        id: module.id,
        name: module.name,
        description: module.description || '',
        status: module.status || 'pending',
        completion_percentage: module.completion_percentage || 0,
        module_type: module.module_type || 'component',
        url: module.url,
        metadata: module.metadata,
        created_at: module.created_at,
        has_scribe: module.has_scribe,
        has_loom_video: module.has_loom_video,
        has_code_submission: module.has_code_submission
      })),
      progress_updates: progressUpdates.map((update: any) => ({
        id: update.id,
        content: update.content,
        percentage_complete: update.percentage_complete,
        created_at: update.created_at
      })),
      daily_priority: isDailyPriority,
      required_submissions: requiredSubmissions,
      completed_submissions: completedSubmissions
    };

    return NextResponse.json(enhancedTaskData);

  } catch (error) {
    console.error('Error loading enhanced task data:', error);
    return NextResponse.json(
      { error: 'Failed to load enhanced task data' },
      { status: 500 }
    );
  }
} 