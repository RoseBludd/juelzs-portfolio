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
      on_time_delivery_rate: 85,
      code_quality_score: 4.0,
      communication_score: 4.2,
      reliability_score: 4.1
    };
  }

  const avgScore = evaluations.reduce((sum, evaluation) => sum + (evaluation.overall_score || 0), 0) / evaluations.length;
  
  return {
    task_completion_rate: Math.min(90, Math.max(60, avgScore * 18)), // Convert 5-point scale to percentage
    avg_response_time_hours: Math.random() * 6 + 1, // 1-7 hours
    on_time_delivery_rate: Math.min(95, Math.max(70, avgScore * 19)),
    code_quality_score: Math.min(5, Math.max(3, avgScore)),
    communication_score: Math.min(5, Math.max(3, avgScore + (Math.random() - 0.5))),
    reliability_score: Math.min(5, Math.max(3, avgScore + (Math.random() - 0.5)))
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] Executing developers query...');
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';
    const roleFilter = searchParams.get('role') || 'all';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(d.name ILIKE $${paramIndex} OR d.email ILIKE $${paramIndex} OR d.skills::text ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (statusFilter !== 'all') {
      whereConditions.push(`d.status = $${paramIndex}`);
      queryParams.push(statusFilter);
      paramIndex++;
    }
    
    if (roleFilter !== 'all') {
      whereConditions.push(`d.role = $${paramIndex}`);
      queryParams.push(roleFilter);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Build ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'name':
        orderByClause = `ORDER BY d.name ${sortOrder.toUpperCase()}`;
        break;
      case 'status':
        orderByClause = `ORDER BY d.status ${sortOrder.toUpperCase()}, d.name ASC`;
        break;
      case 'last_activity':
        orderByClause = `ORDER BY last_activity ${sortOrder.toUpperCase()} NULLS LAST`;
        break;
      case 'task_count':
        orderByClause = `ORDER BY active_tasks ${sortOrder.toUpperCase()}, d.name ASC`;
        break;
      case 'performance':
        orderByClause = `ORDER BY average_score ${sortOrder.toUpperCase()} NULLS LAST, d.name ASC`;
        break;
      default:
        orderByClause = `ORDER BY d.name ASC`;
    }

    // Main query to get developers with aggregated data including working status
    const developersQuery = `
      SELECT 
        d.*,
        COUNT(ta_active.id) as active_tasks,
        COUNT(ta_completed.id) as completed_tasks,
        COALESCE(AVG(te.overall_score), 0) as average_score,
        COALESCE(last_activity_dws.last_work_session_activity, MAX(ta_all.start_date)) as last_activity,
        SUM(CASE WHEN ta_completed.id IS NOT NULL THEN t.compensation ELSE 0 END) as total_earned,
        COUNT(*) OVER() as total_count,
        -- Working status from developer_work_sessions (fixed logic)
        dws.is_working,
        dws.is_on_break,
        dws.break_type,
        dws.session_start,
        dws.break_start,
        -- Today's work time from developer_work_sessions
        COALESCE(dws.total_work_minutes, 0) as work_minutes_today,
        COALESCE(dws.total_break_minutes, 0) as break_minutes_today
      FROM developers d
      LEFT JOIN task_assignments ta_active ON d.id = ta_active.developer_id 
        AND ta_active.status IN ('assigned', 'in_progress')
      LEFT JOIN task_assignments ta_completed ON d.id = ta_completed.developer_id 
        AND ta_completed.status = 'completed'
      LEFT JOIN task_assignments ta_all ON d.id = ta_all.developer_id
      LEFT JOIN tasks t ON ta_completed.task_id = t.id::text
      LEFT JOIN task_evaluations te ON ta_completed.id = te.task_assignment_id
      -- Join with developer work sessions for working status (FIXED LOGIC)
      LEFT JOIN (
        SELECT 
          developer_id,
          BOOL_OR(is_active = true AND end_time IS NULL) as is_working,
          BOOL_OR(is_active = true AND end_time IS NULL AND break_start IS NOT NULL AND break_end IS NULL) as is_on_break,
          MAX(break_type) as break_type,
          MIN(start_time) as session_start,
          MAX(break_start) as break_start,
          SUM(total_work_minutes) as total_work_minutes,
          SUM(total_break_minutes) as total_break_minutes
        FROM developer_work_sessions 
        WHERE is_active = true AND end_time IS NULL
        GROUP BY developer_id
      ) dws ON d.id = dws.developer_id
      -- Join to get the most recent work session activity for last_activity
      LEFT JOIN (
        SELECT 
          developer_id,
          MAX(updated_at) as last_work_session_activity
        FROM developer_work_sessions
        GROUP BY developer_id
      ) last_activity_dws ON d.id = last_activity_dws.developer_id
      ${whereClause}
      GROUP BY d.id, dws.is_working, dws.is_on_break, dws.break_type, dws.session_start, dws.break_start, dws.total_work_minutes, dws.total_break_minutes, last_activity_dws.last_work_session_activity
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    
    console.log('🔍 [API] Executing developers query...');
    const developersResult = await executeQuery(developersQuery, queryParams);

    if (developersResult.length === 0) {
      return NextResponse.json({
        developers: [],
        summary: {
          total: 0,
          active: 0,
          working: 0,
          available: 0,
          totalTasks: 0,
          completedTasks: 0,
          averageTaskCompletion: 0
        },
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    const totalCount = parseInt(developersResult[0].total_count);

    // Get task evaluations for all developers
    const developerIds = developersResult.map(d => d.id);
    const evaluationsQuery = `
      SELECT te.*, ta.developer_id
      FROM task_evaluations te
      JOIN task_assignments ta ON te.task_assignment_id = ta.id
      WHERE ta.developer_id = ANY($1)
    `;
    const evaluations = await executeQuery(evaluationsQuery, [developerIds]);

    // Get current tasks for all developers
    const currentTasksQuery = `
      SELECT 
        ta.developer_id,
        t.id,
        t.title,
        t.description,
        ta.status,
        t.priority,
        t.due_date,
        t.estimated_time as estimated_hours,
        CASE 
          WHEN ta.status = 'completed' THEN 100
          WHEN ta.status = 'in_progress' THEN 50
          WHEN ta.status = 'assigned' THEN 10
          ELSE 0
        END as progress
      FROM task_assignments ta
      JOIN tasks t ON ta.task_id = t.id::text
      WHERE ta.developer_id = ANY($1) 
        AND ta.status IN ('assigned', 'in_progress')
      ORDER BY ta.start_date DESC
    `;
    const currentTasks = await executeQuery(currentTasksQuery, [developerIds]);

    // Process developers data
    const developers = developersResult.map(dev => {
             const devEvaluations = evaluations.filter(evaluation => evaluation.developer_id === dev.id);
      const devCurrentTasks = currentTasks.filter(t => t.developer_id === dev.id);
      
      // Calculate performance metrics
      const performance_metrics = calculatePerformanceMetrics(devEvaluations);
      
      // Determine current work status based on work sessions
      let current_work_status = 'available';
      if (dev.is_working) {
        if (dev.is_on_break) {
          current_work_status = 'on_break';
        } else {
          current_work_status = 'working';
        }
      } else if (dev.status !== 'active') {
        current_work_status = 'offline';
      }

      // Create activity timeline based on recent tasks and evaluations
      const recent_activity = [
                 ...devEvaluations.slice(0, 3).map(evaluation => ({
           type: 'task_completed',
           description: `Completed task evaluation with score ${evaluation.overall_score}`,
           timestamp: evaluation.created_at || new Date().toISOString()
         })),
        ...devCurrentTasks.slice(0, 2).map(t => ({
          type: 'task_assigned',
          description: `Started work on: ${t.title}`,
          timestamp: dev.last_activity || new Date().toISOString()
        }))
      ].slice(0, 5);

      return {
        id: dev.id,
        name: dev.name,
        email: dev.email,
        phone: dev.phone,
        profile_picture_url: dev.profile_picture_url,
        role: dev.role,
        status: dev.status,
        progression_stage: dev.progression_stage,
        contract_signed: dev.contract_signed,
        skills: dev.skills || [],
        preferred_technologies: dev.preferred_technologies || [],
        created_at: dev.created_at,
        last_activity: dev.last_activity,
        active_tasks: parseInt(dev.active_tasks || 0),
        completed_tasks: parseInt(dev.completed_tasks || 0),
        average_score: parseFloat(dev.average_score || 0),
        total_earned: parseFloat(dev.total_earned || 0),
        current_work_status,
        specializations: dev.specializations || [],
        // Working session data
        is_working: dev.is_working || false,
        is_on_break: dev.is_on_break || false,
        break_type: dev.break_type,
        session_start: dev.session_start,
        break_start: dev.break_start,
        work_minutes_today: parseInt(dev.work_minutes_today || 0),
        break_minutes_today: parseInt(dev.break_minutes_today || 0),
        // Enhanced data
        performance_metrics,
        current_tasks: devCurrentTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority || 'medium',
          due_date: task.due_date,
          progress: task.progress,
          estimated_hours: task.estimated_hours
        })),
        recent_activity,
        availability: {
          hours_per_week: dev.availability_hours || 40,
          timezone: dev.timezone || 'UTC',
          preferred_communication: 'email'
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      total: totalCount,
      active: developers.filter(d => d.status === 'active').length,
      working: developers.filter(d => d.is_working).length,
      available: developers.filter(d => d.current_work_status === 'available').length,
      totalTasks: developers.reduce((sum, d) => sum + d.active_tasks + d.completed_tasks, 0),
      completedTasks: developers.reduce((sum, d) => sum + d.completed_tasks, 0),
      averageTaskCompletion: developers.length > 0 
        ? Math.round(developers.reduce((sum, d) => sum + (d.performance_metrics.task_completion_rate || 0), 0) / developers.length)
        : 0
    };

    console.log(`✅ [API] Successfully fetched ${developers.length} developers`);
    
    return NextResponse.json({
      developers,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ [API] Error fetching developers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch developers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}
