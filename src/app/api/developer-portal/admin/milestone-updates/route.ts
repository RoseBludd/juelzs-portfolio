import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool, API_ROUTE_CONFIG } from '@/lib/db-pool';
import { safeDbOperation } from '@/lib/build-diagnostics';

// Prevent static generation of this route
export const dynamic = API_ROUTE_CONFIG.dynamic;
export const runtime = API_ROUTE_CONFIG.runtime;

// Get the database pool
const pool = getMainDbPool();

// Define the types for our data
interface MilestoneUpdate {
  id: string;
  update_type: string;
  content: string;
  created_at: string;
  developer_id: string;
  developer_name: string;
  developer_profile: string | null;
  admin_response?: string;
  media_url?: string;
  media_type?: string;
  timestamp_ms?: number;
  task_id: string;
  task_title: string;
  milestone_id: string;
  milestone_title: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  completion_percentage: number;
  updates: MilestoneUpdate[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  milestones: Record<string, Milestone>;
}

// Simpler helper for media URLs - no AWS SDK dependency
function getMediaUrl(objectKey: string): string {
  try {
    if (!objectKey) return '';
    
    // Check if it's already a full URL
    if (objectKey.startsWith('http')) {
      return objectKey;
    }
    
    // Simple path construction using environment variables
    const bucketName = process.env.AWS_S3_BUCKET || 'dev-portal-task-attachments';
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Construct a direct S3 URL
    return `https://${bucketName}.s3.${region}.amazonaws.com/${objectKey}`;
  } catch (error) {
    console.error('Error processing media URL:', error);
    return objectKey; // Return original URL if there's an error
  }
}

export async function GET() {
  return safeDbOperation(
    async () => {
      const client = await pool.connect();
      
      try {
        console.log('Fetching active tasks with milestone updates...');
        
        // Get all tasks with milestone updates (not just active ones)
        const tasksResult = await client.query(`
          SELECT DISTINCT
            t.id AS task_id,
            t.title AS task_title,
            t.status AS task_status,
            t.completed AS task_completed,
            t.assigned_to,
            t.due_date,
            t.priority
          FROM milestone_updates mu
          JOIN task_milestones tm ON mu.milestone_id = tm.id
          JOIN tasks t ON tm.task_id = t.id
          ORDER BY t.priority DESC, t.due_date ASC
        `);
        
        const tasks = tasksResult.rows;
        const dashboardData = [];
        
        // Process each task to get its milestones and updates
        for (const task of tasks) {
          const taskData = { ...task };
          
          // Get milestone information for this task
          const milestonesResult = await client.query(`
            SELECT 
              tm.id AS milestone_id,
              tm.title AS milestone_title,
              tm.description AS milestone_description,
              tm.status AS milestone_status,
              tm.completion_percentage,
              tm.due_date AS milestone_due_date
            FROM task_milestones tm
            WHERE tm.task_id = $1
            ORDER BY tm.order_index ASC
          `, [task.task_id]);
          
          taskData.milestones = milestonesResult.rows;
          
          // Get milestone updates for each milestone
          for (const milestone of taskData.milestones) {
            const updatesResult = await client.query(`
              SELECT 
                mu.id AS update_id,
                mu.update_type,
                mu.content,
                mu.created_at,
                mu.developer_id,
                mu.developer_profile_picture_url,
                mu.admin_response,
                mu.admin_name,
                mu.admin_response_at
              FROM milestone_updates mu
              WHERE mu.milestone_id = $1
              ORDER BY mu.created_at DESC
            `, [milestone.milestone_id]);
            
            milestone.updates = updatesResult.rows.map(update => {
              // Process media content if needed
              if (update.content && update.content.startsWith('https://')) {
                update.media_url = update.content;
              }
              
              return update;
            });
          }
          
          dashboardData.push(taskData);
        }
        
        return NextResponse.json({
          milestoneUpdates: dashboardData,
        });
      } catch (error) {
        console.error('Failed to fetch milestone updates:', error);
        return NextResponse.json({ 
          error: 'Error fetching milestone updates',
          message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      } finally {
        client.release();
      }
    },
    NextResponse.json({ milestoneUpdates: [] }), // Fallback response
    'milestone updates fetch'
  );
} 