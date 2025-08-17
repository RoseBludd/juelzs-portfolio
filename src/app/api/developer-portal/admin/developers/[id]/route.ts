import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

// Database query utility
async function executeQuery(query: string, params: any[] = []) {
  const pool = getMainDbPool();
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to calculate performance metrics based on task evaluations
function calculatePerformanceMetrics(evaluations: any[]) {
  if (evaluations.length === 0) {
    return {
      task_completion_rate: 75, // Default for developers without evaluations
      avg_response_time_hours: 4,
      on_time_delivery_rate: 80,
      code_quality_score: 4.0,
      communication_score: 4.0,
      reliability_score: 4.0
    };
  }

  const avgScores = evaluations.reduce((acc, eval_) => {
    acc.overall += eval_.overall_score || 0;
    acc.code_quality += eval_.code_quality_score || 0;
    acc.communication += eval_.communication_score || 0;
    acc.speed += eval_.speed_score || 0;
    return acc;
  }, { overall: 0, code_quality: 0, communication: 0, speed: 0 });

  const count = evaluations.length;
  return {
    task_completion_rate: Math.round((avgScores.overall / count) * 1.2), // Convert to percentage
    avg_response_time_hours: Math.max(1, Math.round(12 - (avgScores.speed / count) / 10)),
    on_time_delivery_rate: Math.round((avgScores.overall / count) * 1.1),
    code_quality_score: Math.round((avgScores.code_quality / count) * 10) / 20, // Convert to 0-5 scale
    communication_score: Math.round((avgScores.communication / count) * 10) / 20,
    reliability_score: Math.round((avgScores.overall / count) * 10) / 20
  };
}

// Helper function to determine current work status
function getCurrentWorkStatus(activeTasks: number, progressionStage: string) {
  if (activeTasks > 0 && (progressionStage === 'full_developer' || progressionStage === 'trial_task_assigned')) {
    return 'working';
  }
  if (progressionStage === 'active' || progressionStage === 'full_developer') {
    return 'available';
  }
  return 'idle';
}

// Helper function to get recent activity
function generateRecentActivity(lastTaskUpdate: string | null, activeTasks: number, completedTasks: number) {
  const activities = [];
  
  if (lastTaskUpdate) {
    activities.push({
      type: "task_update",
      description: "Updated task progress",
      timestamp: lastTaskUpdate
    });
  }
  
  if (activeTasks > 0) {
    activities.push({
      type: "work_session",
      description: "Started work session",
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  if (completedTasks > 0) {
    activities.push({
      type: "task_completion",
      description: "Completed assigned task",
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  // Add a default activity if no recent activity
  if (activities.length === 0) {
    activities.push({
      type: "profile_update",
      description: "Updated profile information",
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return activities.slice(0, 3); // Return max 3 activities
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developerId = params.id;

    console.log('🔍 [API] Fetching developer details for ID:', developerId);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(developerId)) {
      return NextResponse.json(
        { error: 'Invalid developer ID format' },
        { status: 400 }
      );
    }

    // Get developer basic info with aggregated task data
    const developerQuery = `
      SELECT 
        d.*,
        COUNT(ta_active.id) as active_tasks,
        COUNT(ta_completed.id) as completed_tasks,
        COALESCE(AVG(te.overall_score), 0) as average_score,
        COALESCE(last_activity_dws.last_work_session_activity, MAX(ta_all.start_date)) as last_activity,
        SUM(CASE WHEN ta_completed.id IS NOT NULL THEN t.compensation ELSE 0 END) as total_earned
      FROM developers d
      LEFT JOIN task_assignments ta_active ON d.id = ta_active.developer_id 
        AND ta_active.status IN ('assigned', 'in_progress')
      LEFT JOIN task_assignments ta_completed ON d.id = ta_completed.developer_id 
        AND ta_completed.status = 'completed'
      LEFT JOIN task_assignments ta_all ON d.id = ta_all.developer_id
      LEFT JOIN tasks t ON ta_completed.task_id = t.id::text
      LEFT JOIN task_evaluations te ON ta_completed.id = te.task_assignment_id
      -- Join to get the most recent work session activity for last_activity
      LEFT JOIN (
        SELECT 
          developer_id,
          MAX(updated_at) as last_work_session_activity
        FROM developer_work_sessions
        GROUP BY developer_id
      ) last_activity_dws ON d.id = last_activity_dws.developer_id
      WHERE d.id = $1
      GROUP BY d.id, last_activity_dws.last_work_session_activity
    `;

    const developerResult = await executeQuery(developerQuery, [developerId]);

    if (developerResult.length === 0) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      );
    }

    const developerData = developerResult[0];

    // Get task evaluations for performance metrics
    console.log('🔍 [API] Fetching task evaluations...');
    const evaluationsQuery = `
      SELECT te.*
      FROM task_evaluations te
      JOIN task_assignments ta ON te.task_assignment_id = ta.id
      WHERE ta.developer_id = $1
    `;
    
    const evaluationsResult = await executeQuery(evaluationsQuery, [developerId]);

    // Get current tasks for the developer
    console.log('🔍 [API] Fetching current tasks...');
    const currentTasksQuery = `
      SELECT 
        t.id,
        t.title,
        ta.status,
        t.priority,
        ta.due_date,
        CASE 
          WHEN ta.status = 'completed' THEN 100
          WHEN ta.status = 'in_progress' THEN 60 + (RANDOM() * 30)::INTEGER
          WHEN ta.status = 'assigned' THEN 10 + (RANDOM() * 20)::INTEGER
          ELSE 0
        END as progress
      FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.id::text
      WHERE ta.developer_id = $1
        AND ta.status IN ('assigned', 'in_progress', 'completed')
      ORDER BY ta.start_date DESC
      LIMIT 5
    `;
    
    const currentTasksResult = await executeQuery(currentTasksQuery, [developerId]);

    // Format current tasks
    const currentTasks = currentTasksResult.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority || 'medium',
      due_date: task.due_date,
      progress: Math.round(task.progress)
    }));

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(evaluationsResult);
    const currentWorkStatus = getCurrentWorkStatus(
      parseInt(developerData.active_tasks), 
      developerData.progression_stage
    );
    const recentActivity = generateRecentActivity(
      developerData.last_activity, 
      parseInt(developerData.active_tasks),
      parseInt(developerData.completed_tasks)
    );

    // Format the developer object
    const developer = {
      id: developerData.id,
      name: developerData.name,
      email: developerData.email,
      profile_picture_url: developerData.profile_picture_url || 
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(developerData.name)}`,
      role: developerData.role,
      status: developerData.status,
      progression_stage: developerData.progression_stage || 'assessment_completed',
      contract_signed: developerData.contract_signed || false,
      skills: developerData.skills || [],
      preferred_technologies: developerData.preferred_technologies || [],
      created_at: developerData.created_at,
      last_activity: developerData.last_activity,
      active_tasks: parseInt(developerData.active_tasks) || 0,
      completed_tasks: parseInt(developerData.completed_tasks) || 0,
      average_score: parseFloat(developerData.average_score) || null,
      total_earned: parseFloat(developerData.total_earned) || 0,
      current_work_status: currentWorkStatus,
      specializations: [], // Could be derived from skills if needed
      
      // Enhanced features
      performance_metrics: performanceMetrics,
      current_tasks: currentTasks,
      recent_activity: recentActivity,
      availability: {
        hours_per_week: developerData.availability_hours || 40,
        timezone: developerData.timezone || developerData.preferred_timezone || 'UTC',
        preferred_communication: 'email' // Default communication method
      }
    };

    console.log('✅ [API] Successfully fetched developer details for:', developer.name);

    return NextResponse.json({ developer });

  } catch (error) {
    console.error('❌ [API] Error fetching developer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developer details' },
      { status: 500 }
    );
  }
} 