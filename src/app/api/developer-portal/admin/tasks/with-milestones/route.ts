import { NextResponse } from 'next/server';
import { getMainDbPool, API_ROUTE_CONFIG } from '@/lib/db-pool';
import { safeDbOperation } from '@/lib/build-diagnostics';

// Prevent static generation of this route
export const dynamic = API_ROUTE_CONFIG.dynamic;
export const runtime = API_ROUTE_CONFIG.runtime;

// Get the database pool
const pool = getMainDbPool();

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// Define types for task data
interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: string;
  department_display_name?: string;
  due_date: string;
  created_at: string;
  assigned_developers?: string;
  total_milestones?: number;
  milestones_completed?: number;
  milestone_progress?: number;
  milestones?: any[];
}

export async function GET() {
  return safeDbOperation(
    async () => {
      let client;
      
      try {
        // Log database URL (with password masked)
        const dbUrlForLogging = process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
          : 'No DATABASE_URL found';
        console.log('[API] Using database connection:', dbUrlForLogging);
        
        // Get a client from the pool
        console.log('[API] Acquiring database client...');
        client = await pool.connect();
        console.log('[API] Database client acquired successfully');
        
        // Test the connection with a simple query
        console.log('[API] Testing database connection...');
        const testResult = await client.query('SELECT NOW()');
        console.log('[API] Database connection test successful:', testResult.rows[0]);
        
        console.log('[API] Fetching all tasks with milestone information using direct SQL');
        
        // First, let's check for any assigned tasks with a simpler query
        const assignedTasksResult = await client.query(`
          SELECT COUNT(*) FROM tasks 
          WHERE status IN ('assigned', 'in_progress')
          OR EXISTS (
            SELECT 1 FROM task_assignments ta WHERE ta.task_id = tasks.id::text
          )
        `);
        const assignedTasksCount = parseInt(assignedTasksResult.rows[0].count);
        console.log(`[API] Found ${assignedTasksCount} potential assigned tasks in database`);
        
        // Check for any task assignments directly
        console.log('[API] Checking for any task assignments directly...');
        const assignmentsResult = await client.query(`
          SELECT COUNT(*) FROM task_assignments
        `);
        const assignmentsCount = parseInt(assignmentsResult.rows[0].count);
        console.log(`[API] Found ${assignmentsCount} task assignments in database`);
        
        if (assignmentsCount > 0) {
          // Show some sample assignments for debugging
          const sampleAssignments = await client.query(`
            SELECT ta.task_id, d.name as developer_name, t.title as task_title, t.status as task_status
            FROM task_assignments ta
            JOIN developers d ON ta.developer_id = d.id
            JOIN tasks t ON ta.task_id = t.id::text
            LIMIT 3
          `);
          console.log('[API] Sample assignments:', JSON.stringify(sampleAssignments.rows, null, 2));
        }
        
        // Execute our SQL query - start from task_assignments instead of tasks
        console.log('[API] Using simplified query to directly get assigned tasks...');
        const result = await client.query(`
          SELECT 
            t.id, 
            t.title, 
            t.description,
            t.status, 
            t.priority,
            t.department,
            d.display_name as department_display_name,
            t.due_date,
            t.created_at,
            (
              SELECT string_agg(dev.name, ', ')
              FROM task_assignments ta
              JOIN developers dev ON ta.developer_id = dev.id
              WHERE ta.task_id = t.id::text
            ) as assigned_developers,
            (
              SELECT COUNT(*) 
              FROM task_milestones 
              WHERE task_id = t.id
            ) as total_milestones,
            (
              SELECT COUNT(*) 
              FROM task_milestones 
              WHERE task_id = t.id AND status = 'completed'
            ) as milestones_completed,
            (
              SELECT ROUND(AVG(completion_percentage)) 
              FROM task_milestones 
              WHERE task_id = t.id
            ) as milestone_progress,
            (
              SELECT json_agg(milestone_row ORDER BY milestone_order)
              FROM (
                SELECT json_build_object(
                  'id', tm.id,
                  'title', tm.title,
                  'description', tm.description,
                  'status', tm.status,
                  'completion_percentage', tm.completion_percentage,
                  'due_date', tm.due_date,
                  'order_index', tm.order_index,
                  'updates', (
                    SELECT json_agg(update_row ORDER BY update_created DESC)
                    FROM (
                      SELECT json_build_object(
                        'id', mu.id,
                        'update_type', mu.update_type,
                        'content', mu.content,
                        'created_at', mu.created_at,
                        'developer_id', mu.developer_id,
                        'developer_name', devs.name,
                        'media_url', NULL,
                        'media_type', NULL
                      ) as update_row,
                      mu.created_at as update_created
                      FROM milestone_updates mu
                      LEFT JOIN developers devs ON mu.developer_id = devs.id
                      WHERE mu.milestone_id = tm.id
                    ) update_subquery
                  )
                ) as milestone_row,
                tm.order_index as milestone_order
                FROM task_milestones tm
                WHERE tm.task_id = t.id
              ) milestone_subquery
            ) as milestones
          FROM tasks t
          LEFT JOIN departments d ON t.department = d.name
          WHERE EXISTS (
            SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id::text
          )
          ORDER BY t.created_at DESC
        `);
        
        const tasks = result.rows;
        console.log(`[API] Found ${tasks.length} assigned tasks total with all details`);
        
        if (tasks.length === 0) {
          if (assignedTasksCount > 0) {
            console.warn(`[API] Query returned 0 tasks but simple count found ${assignedTasksCount} tasks - possible JOIN issue`);
          } else {
            console.log(`[API] No tasks found matching the criteria`);
          }
        }
        
        // Log a sample task for debugging
        if (tasks.length > 0) {
          const sampleTask = {...tasks[0]};
          if (sampleTask.milestones && Array.isArray(sampleTask.milestones)) {
            sampleTask.milestones = `[Array with ${sampleTask.milestones.length} items]`;
          }
          console.log('[API] Sample task:', JSON.stringify(sampleTask, null, 2));
        }
        
        // Format null milestones as empty arrays
        const formattedTasks = tasks.map(task => {
          if (!task.milestones) {
            task.milestones = [];
          }
          
          // Force status to be 'assigned' if it has assigned developers
          if (task.assigned_developers && task.assigned_developers.length > 0) {
            task.status = 'assigned';
          }
          
          return task;
        });
        
        console.log(`[API] Successfully formatted ${formattedTasks.length} tasks with milestone information`);
        return NextResponse.json(formattedTasks);
        
      } catch (error: any) {
        console.error('[API] Error fetching tasks with milestones:', error);
        // More detailed error information
        const errorDetails = {
          error: 'Failed to fetch tasks with milestones',
          message: error.message,
          code: error.code, // PostgreSQL error code
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          // For connection issues
          connectionError: error.code === 'ECONNREFUSED' || error.code === '28P01' || error.code === '3D000',
          connectionDetails: {
            host: error.address,
            port: error.port,
            dbName: error.database
          }
        };
        return NextResponse.json(errorDetails, { status: 500 });
      } finally {
        if (client) {
          console.log('[API] Releasing database client');
          client.release();
        }
      }
    },
    NextResponse.json([]), // Fallback response
    'tasks with milestones fetch'
  );
} 