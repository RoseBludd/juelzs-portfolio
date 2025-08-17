import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

import { getMainDbPool, getModuleDbPool } from '@/lib/db-pool';
import { Task, TaskStatus, TaskPriority, TaskComplexity, TaskCategory } from "@/types/task";
import { extractAllLoomVideosFromModule, extractLoomVideosFromTask, getLoomVideoStats, extractLoomUrlsFromText } from '@/utils/mediaUtils';

// Use both database pools for comprehensive data
const mainPool = getMainDbPool();
const modulePool = getModuleDbPool();

// Define interfaces for milestone and module data
interface MilestoneUpdate {
  id: string;
  update_type: string;
  content: string;
  created_at: string;
  developer_id: string;
  developer_name: string;
  developer_profile_picture_url?: string;
  status?: string;
  admin_response?: string;
  admin_name?: string;
  admin_response_at?: string;
}

interface FormattedMilestone {
  id: string;
  title: string;
  description: string;
  status: string;
  completion_percentage: number;
  due_date: string;
  order_index: number;
  updates: MilestoneUpdate[];
  test_submission?: any;
}

interface ModuleUpdate {
  id: string;
  update_type: string;
  title?: string;
  content: string;
  created_at: string;
  developer_id: string;
  developer_name: string;
  developer_profile_picture_url?: string;
  admin_response?: string;
  admin_name?: string;
  admin_response_at?: string;
}

interface TaskModule {
  id: string;
  name: string;
  description: string;
  file_path?: string;
  url?: string;
  status: string;
  completion_percentage: number;
  sort_order: number;
  tags: string[];
  metadata: any;
  created_at: string;
  updated_at: string;
  module_type: string;
  module_icon?: string;
  module_color?: string;
  module_type_description?: string;
  dependency_count: number;
  submission_count: number;
  update_count: number;
  updates: ModuleUpdate[];
  loom_video_url?: string;
  developer_id?: string;
  developer_name?: string;
}

interface ActivityItem {
  id: string;
  type: 'milestone_update' | 'module_update';
  content: string;
  created_at: string;
  developer_id: string;
  developer_name: string;
  developer_profile_picture_url?: string;
  milestone_title?: string;
  module_name?: string;
  module_type?: string;
  source: 'milestone' | 'module';
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get task details from main database
    console.log(`[API] Querying task details from main database...`);
    const taskResult = await mainPool.query(`
      SELECT 
        t.*, 
        d.display_name as departments_display_name
      FROM tasks t
      LEFT JOIN departments d ON CAST(t.department AS TEXT) = CAST(d.id AS TEXT)
      WHERE t.id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      console.log(`[API] Task not found with ID: ${taskId}`);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = {
      ...taskResult.rows[0],
      departments: taskResult.rows[0].departments_display_name ? 
        { display_name: taskResult.rows[0].departments_display_name } : null
    };

    console.log(`[API] Task found: ${task.title}`);

    // Get assigned developers
    console.log(`[API] Querying task assignments...`);
    let developers = [];
    try {
      const taskAssignmentsResult = await mainPool.query(`
        SELECT 
          d.id,
          d.name,
          d.email,
          d.profile_picture_url,
          d.role
        FROM task_assignments ta
        JOIN developers d ON ta.developer_id = d.id
        WHERE ta.task_id = $1
      `, [taskId]);

      console.log(`[API] Found ${taskAssignmentsResult.rows.length} task assignments`);
      developers = taskAssignmentsResult.rows;
    } catch (assignmentError: any) {
      console.error('[API] Error fetching task assignments:', assignmentError);
    }

    // Get task modules by calling the SAME API that developers use
    console.log(`[API] Fetching task modules using developer API...`);
    let taskModules: TaskModule[] = [];
    try {
      // Call the same API endpoint that developers use
      const moduleApiUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}/api/tasks/modules?taskId=${taskId}`;
      console.log(`[API] Calling module API: ${moduleApiUrl}`);
      
      const moduleResponse = await fetch(moduleApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Forward any authentication headers if needed
          ...(request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : {}),
        },
      });

      if (!moduleResponse.ok) {
        console.error(`[API] Module API returned ${moduleResponse.status}: ${moduleResponse.statusText}`);
        throw new Error(`Module API failed: ${moduleResponse.status}`);
      }

      const moduleData = await moduleResponse.json();
      const moduleResult = { rows: moduleData.modules || [] };
      console.log(`[API] Found ${moduleResult.rows.length} modules for task`);

      // Get module updates for each module - only if we have modules
      let moduleUpdatesResult = { rows: [] };
      let moduleUpdatesMap: Record<string, ModuleUpdate[]> = {};
      let developerMap: Record<string, any> = {};

      if (moduleResult.rows.length > 0) {
        const moduleUpdatesQuery = `
          SELECT
            mu.id,
            mu.module_id,
            mu.update_type,
            mu.title,
            mu.content,
            mu.created_at,
            mu.developer_id,
            mu.admin_response,
            mu.admin_name,
            mu.admin_response_at,
            d.name as developer_name,
            d.profile_picture_url as developer_profile_picture_url
          FROM module_updates mu
          LEFT JOIN developers d ON mu.developer_id = d.id
          WHERE mu.module_id = ANY($1)
          ORDER BY mu.created_at DESC
        `;

        const moduleIds = moduleResult.rows.map((module: any) => module.id);
        
        if (moduleIds.length > 0) {
          moduleUpdatesResult = await mainPool.query(moduleUpdatesQuery, [moduleIds]);
        }

        // Group updates by module ID
        moduleUpdatesResult.rows.forEach((update: any) => {
          if (!moduleUpdatesMap[update.module_id]) {
            moduleUpdatesMap[update.module_id] = [];
          }
          moduleUpdatesMap[update.module_id].push(update);
        });

        // Get developer names for modules
        const developerIds = moduleResult.rows
          .map((module: any) => module.developer_id)
          .filter((id: any) => id);

        if (developerIds.length > 0) {
          const developerQuery = `
            SELECT id, name, profile_picture_url
            FROM developers
            WHERE id = ANY($1)
          `;
          const developerResult = await mainPool.query(developerQuery, [developerIds]);
          developerMap = developerResult.rows.reduce((acc: any, dev: any) => {
            acc[dev.id] = dev;
            return acc;
          }, {});
        }
      }

      // Format modules with updates (modules from API are already well-formatted)
      taskModules = moduleResult.rows.map((module: any) => {
        const updates = moduleUpdatesMap[module.id] || [];
        const developer = developerMap[module.developer_id];

        // Extract loom video URL from metadata or url field
        let loomVideoUrl = null;
        if (module.url && module.url.includes('loom.com')) {
          loomVideoUrl = module.url;
        } else if (module.metadata && typeof module.metadata === 'object') {
          const metadata = typeof module.metadata === 'string' ? JSON.parse(module.metadata) : module.metadata;
          if (metadata.loom_video_url) {
            loomVideoUrl = metadata.loom_video_url;
          }
        }

        return {
          id: module.id,
          name: module.name,
          description: module.description || '',
          file_path: module.file_path,
          url: module.url,
          status: module.status,
          completion_percentage: module.completion_percentage || 0,
          sort_order: module.sort_order,
          tags: module.tags || [],
          metadata: module.metadata,
          created_at: module.created_at,
          updated_at: module.updated_at,
          module_type: module.module_type,
          module_icon: module.module_icon,
          module_color: module.module_color,
          module_type_description: module.module_type_description,
          dependency_count: module.dependency_count,
          submission_count: module.submission_count,
          update_count: module.update_count,
          updates: updates,
          loom_video_url: loomVideoUrl,
          developer_id: module.developer_id,
          developer_name: developer ? developer.name : null,
        };
      });

      console.log(`[API] Formatted ${taskModules.length} modules with updates`);
    } catch (moduleError: any) {
      console.error('[API] Error fetching task modules:', moduleError);
    }

    // Get milestones with updates
    console.log(`[API] Querying task milestones...`);
    let formattedMilestones: FormattedMilestone[] = [];

    try {
      const milestonesResult = await mainPool.query(`
        SELECT * FROM task_milestones
        WHERE task_id = $1
        ORDER BY order_index ASC
      `, [taskId]);

      console.log(`[API] Found ${milestonesResult.rows.length} milestones`);

      // Get milestone updates for all milestones
      const milestoneIds = milestonesResult.rows.map(m => m.id);
      let milestoneUpdates: any[] = [];
      
      if (milestoneIds.length > 0) {
        const updatesResult = await mainPool.query(`
          SELECT 
            mu.*,
            d.id as developer_id,
            d.name as developer_name,
            d.profile_picture_url as developer_profile_picture_url
          FROM milestone_updates mu
          LEFT JOIN developers d ON mu.developer_id = d.id
          WHERE mu.milestone_id = ANY($1)
          ORDER BY mu.created_at DESC
        `, [milestoneIds]);
        
        milestoneUpdates = updatesResult.rows;
      }

      // Format milestone updates
      formattedMilestones = milestonesResult.rows.map((milestone: any) => {
        const updates = milestoneUpdates
          .filter(update => update.milestone_id === milestone.id)
          .map(update => ({
            id: update.id,
            update_type: update.update_type,
            content: update.content,
            created_at: update.created_at,
            developer_id: update.developer_id,
            developer_name: update.developer_name || 'Unknown',
            developer_profile_picture_url: update.developer_profile_picture_url,
            status: update.status,
            admin_response: update.admin_response,
            admin_name: update.admin_name,
            admin_response_at: update.admin_response_at,
          }));

        return {
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          status: milestone.status,
          completion_percentage: milestone.completion_percentage,
          due_date: milestone.due_date,
          order_index: milestone.order_index,
          updates: updates,
          test_submission: milestone.test_submission,
        };
      });

      console.log(`[API] Formatted ${formattedMilestones.length} milestones with updates`);
    } catch (milestoneError: any) {
      console.error('[API] Error fetching milestones:', milestoneError);
    }

    // Get recent activity using the SAME logic as the working milestone updates API
    console.log(`[API] Fetching recent activity using working milestone updates logic...`);
    
    const halfLimit = 25; // Get 25 from each source
    let client = null;
    let transformedActivity: any[] = [];
    
    try {
      client = await mainPool.connect();
      
      // Use the EXACT same queries as the working milestone updates API
      const [legacyResult, moduleResult] = await Promise.allSettled([
        // Legacy milestone updates - but filter by task if milestone is linked
        client.query(`
          SELECT 
            mu.id AS id,
            mu.update_type,
            mu.content,
            mu.created_at,
            mu.developer_id,
            mu.developer_profile_picture_url AS developer_profile,
            mu.admin_response,
            mu.admin_name,
            mu.admin_response_at,
            mu.milestone_id,
            'Legacy Milestone' AS milestone_title,
            $1 AS task_id,
            'Task Update' AS task_title,
            d.name AS developer_name,
            EXTRACT(EPOCH FROM mu.created_at) * 1000 as timestamp_ms,
            'legacy' as source_type
          FROM milestone_updates mu
          LEFT JOIN developers d ON mu.developer_id = d.id
          LEFT JOIN task_milestones tm ON mu.milestone_id = tm.id
          WHERE tm.task_id = $1 OR mu.milestone_id IS NULL
          ORDER BY mu.created_at DESC
          LIMIT $2
        `, [taskId, halfLimit]),

        // Module updates for this specific task
        client.query(`
          SELECT 
            mu.id AS id,
            mu.update_type,
            COALESCE(mu.title, mu.content) AS content,
            mu.created_at,
            mu.developer_id,
            NULL AS developer_profile,
            mu.admin_response,
            mu.admin_name,
            mu.admin_response_at,
            mu.module_id AS milestone_id,
            tm.name AS milestone_title,
            tm.task_id AS task_id,
            'Module Update' AS task_title,
            d.name AS developer_name,
            EXTRACT(EPOCH FROM mu.created_at) * 1000 as timestamp_ms,
            'module' as source_type,
            tm.name as module_name,
            mt.name as module_type
          FROM module_updates mu
          JOIN task_modules tm ON mu.module_id = tm.id
          JOIN module_types mt ON tm.module_type_id = mt.id
          LEFT JOIN developers d ON mu.developer_id = d.id
          WHERE tm.task_id = $1
          ORDER BY mu.created_at DESC
          LIMIT $2
        `, [taskId, halfLimit])
      ]);

      // Process results with fallbacks (same as working API)
      const legacyUpdates = legacyResult.status === 'fulfilled' ? legacyResult.value.rows : [];
      const moduleUpdates = moduleResult.status === 'fulfilled' ? moduleResult.value.rows : [];

      console.log(`[API] Found ${legacyUpdates.length} legacy milestone updates`);
      console.log(`[API] Found ${moduleUpdates.length} module updates`);

      // Combine and sort all updates by creation time (same as working API)
      const allUpdates = [...legacyUpdates, ...moduleUpdates]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

      // Transform to match expected format
      transformedActivity = allUpdates.map((row: any) => ({
        id: row.id,
        type: row.update_type || 'comment',
        content: row.content || '',
        created_at: row.created_at,
        developer_id: row.developer_id || '',
        developer_name: row.developer_name || 'Unknown',
        developer_email: '', // Not available in this query
        developer_profile_picture: row.developer_profile || '',
        milestone_id: row.milestone_id,
        milestone_title: row.milestone_title || '',
        task_id: row.task_id || taskId,
        source_type: row.source_type,
        module_name: row.module_name,
        module_type: row.module_type,
      }));

      console.log(`[API] Transformed ${transformedActivity.length} total activity items`);
      
    } catch (activityError: any) {
      console.error('[API] Error fetching activity with working logic:', activityError);
      // Continue with empty activity if this fails
    } finally {
      if (client) {
        client.release();
      }
    }

    // Get all loom videos from task, modules, and milestones using enhanced extraction
    console.log(`[API] Aggregating loom videos comprehensively...`);
    const loomVideoStats = getLoomVideoStats(taskModules, task);
    
    // Extract loom videos from milestone updates
    const milestoneUpdateVideos = transformedActivity.flatMap(activity => {
      if (activity.content) {
        return extractLoomUrlsFromText(activity.content).map((url: string) => ({
          id: `milestone-update-${activity.id}`,
          url: url,
          source: 'milestone_update',
          title: `${activity.milestone_title} - Update`,
          created_at: activity.created_at,
          developer_name: activity.developer_name,
          milestone_id: activity.milestone_id,
          milestone_title: activity.milestone_title,
          update_type: activity.type,
          update_content: activity.content
        }));
      }
      return [];
    });

    // Combine all loom videos
    const allLoomVideos = [...loomVideoStats.videos, ...milestoneUpdateVideos];
    const loomVideos = allLoomVideos.map(video => ({
      ...video,
      source_detail: video.source,
      module_type: (video as any).module_id ? taskModules.find(m => m.id === (video as any).module_id)?.module_type || null : null,
    }));

    console.log(`[API] Found ${loomVideos.length} loom videos from ${Object.keys(loomVideoStats.by_source).length + (milestoneUpdateVideos.length > 0 ? 1 : 0)} sources:`, {
      ...loomVideoStats.by_source,
      milestone_updates: milestoneUpdateVideos.length
    });

    // Format requirements and acceptance criteria
    const requirements = task.requirements || [];
    const acceptanceCriteria = task.acceptance_criteria || [];

    // Get completion tracking data
    let completedRequirements = [];
    let completedAcceptanceCriteria = [];

    try {
      // Check if task_progress_tracking table exists first
      const tableExistsResult = await mainPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'task_progress_tracking'
        );
      `);

      if (tableExistsResult.rows[0].exists) {
        const completionQuery = `
          SELECT
            requirements_completion,
            acceptance_criteria_completion
          FROM task_progress_tracking
          WHERE task_id = $1
          ORDER BY updated_at DESC
          LIMIT 1
        `;

        const completionResult = await mainPool.query(completionQuery, [taskId]);
        if (completionResult.rows.length > 0) {
          completedRequirements = completionResult.rows[0].requirements_completion || [];
          completedAcceptanceCriteria = completionResult.rows[0].acceptance_criteria_completion || [];
        }
      } else {
        console.log('[API] task_progress_tracking table does not exist, skipping progress tracking query');
      }
    } catch (progressError: any) {
      console.error('[API] Error fetching progress tracking:', progressError);
    }

    // Calculate statistics
    const stats = {
      total_modules: taskModules.length,
      completed_modules: taskModules.filter(m => m.status === 'completed').length,
      in_progress_modules: taskModules.filter(m => m.status === 'in_progress').length,
      pending_modules: taskModules.filter(m => m.status === 'pending').length,
      total_milestones: formattedMilestones.length,
      completed_milestones: formattedMilestones.filter(m => m.status === 'completed').length,
      total_loom_videos: loomVideos.length,
      total_updates: transformedActivity.length,
      overall_progress: taskModules.length > 0
        ? Math.round((taskModules.reduce((sum, m) => sum + m.completion_percentage, 0) / taskModules.length))
        : 0,
    };

    // Combine all data
    const response = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      complexity: task.complexity,
      category: task.category,
      department: task.department,
      department_display_name: task.departments?.display_name || '',
      due_date: task.due_date,
      created_at: task.created_at,
      compensation: task.compensation,
      estimated_time: task.estimated_time,
      developers,
      modules: taskModules,
      milestones: formattedMilestones,
      requirements,
      acceptance_criteria: acceptanceCriteria,
      completed_requirements: completedRequirements,
      completed_acceptance_criteria: completedAcceptanceCriteria,
      metadata: task.metadata || {},
      loom_video_url: task.loom_video_url,
      transcript: task.transcript,
      environment_variables: task.environment_variables || {},
      loom_videos: loomVideos,
      recent_activity: transformedActivity,
      stats,
    };

    console.log(`[API] Comprehensive response prepared with ${stats.total_modules} modules, ${stats.total_milestones} milestones, ${stats.total_loom_videos} loom videos`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching admin task details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 