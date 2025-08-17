import { cookies } from "next/headers";
import { NextResponse } from 'next/server';
import { getMainDbPool } from "@/lib/db-pool";
import { verifySessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define types for milestone and task
interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  task_id: string;
  completion_percentage: number | null;
  order_index: number;
  status: string | null;
  updates?: {
    id: string;
    update_type: string;
    content: string;
    created_at: string;
    developer_id: string;
    developer_name: string;
    developer_profile_picture_url: string | null;
    status: string | null;
    message: string;
    admin_response?: string | null;
    admin_name?: string | null;
    admin_response_at?: string | null;
  }[];
  test_submission?: any;
}

interface TaskWithMetadata {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  task_milestones: Milestone[];
  departments: any;
  metadata?: {
    total_milestones: number;
    completed_milestones: number;
    overall_progress: number;
  };
  requirements?: any[];
  acceptance_criteria?: any[];
}

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  console.log(`[API] Route called: /api/developer/tasks/${params.taskId}/details`);
  
  try {
    // Get the authenticated user
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('user-session');
    
    if (!sessionCookie?.value) {
      console.log('[API] No session cookie found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Verify and decode the session
    const userData = verifySessionCookie(sessionCookie.value);
    
    if (!userData || !userData.email) {
      console.log('[API] Invalid session data');
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const taskId = params.taskId;
    console.log(`[API] Fetching details for task ID: ${taskId} for developer: ${userData.email}`);
    
    const db = getMainDbPool();

    // Get the developer ID from the email
    const developerQuery = `SELECT * FROM developers WHERE email = $1`;
    const developerResult = await db.query(developerQuery, [userData.email]);
    const developer = developerResult.rows[0];

    if (!developer) {
      console.log(`[API] Developer not found for email: ${userData.email}`);
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      );
    }

    // Check if the task is assigned to this developer
    const taskAssignmentQuery = `
      SELECT * FROM task_assignments 
      WHERE task_id = $1 AND developer_id = $2
    `;
    const taskAssignmentResult = await db.query(taskAssignmentQuery, [taskId, developer.id]);
    const taskAssignment = taskAssignmentResult.rows[0];

    if (!taskAssignment) {
      console.log(`[API] Task ${taskId} not assigned to developer ${developer.id}`);
      return NextResponse.json(
        { error: 'Task not assigned to this developer' },
        { status: 403 }
      );
    }
    
    // Get task details with department information
    const taskQuery = `
      SELECT 
        t.*,
        d.display_name as department_display_name
      FROM tasks t
      LEFT JOIN departments d ON t.department = d.name
      WHERE t.id = $1
    `;
    const taskResult = await db.query(taskQuery, [taskId]);
    const task = taskResult.rows[0];
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Get assigned developers
    let developers = [];
    try {
      const taskAssignmentsQuery = `
        SELECT 
          d.id, d.name, d.email, d.profile_picture_url, d.role
        FROM task_assignments ta
        JOIN developers d ON ta.developer_id = d.id
        WHERE ta.task_id = $1
      `;
      const taskAssignmentsResult = await db.query(taskAssignmentsQuery, [taskId]);
      developers = taskAssignmentsResult.rows;
      
      // If no developers were found, add the current developer as a fallback
      if (developers.length === 0) {
        developers = [{
          id: developer.id,
          name: developer.name,
          email: developer.email,
          profile_picture_url: developer.profile_picture_url,
          role: developer.role
        }];
      }
    } catch (assignmentError: any) {
      console.error('[API] Error fetching task assignments:', assignmentError);
      // Use current developer as fallback
      developers = [{
        id: developer.id,
        name: developer.name,
        email: developer.email,
        profile_picture_url: developer.profile_picture_url,
        role: developer.role
      }];
    }
    
    // Get milestones for this task
    const milestonesQuery = `
      SELECT * FROM task_milestones 
      WHERE task_id = $1 
      ORDER BY order_index ASC, created_at ASC
    `;
    const milestonesResult = await db.query(milestonesQuery, [taskId]);
    const milestones = milestonesResult.rows;
    
    // Get milestone updates with developer information
    let formattedMilestones: Milestone[] = [];
    
    try {
      if (milestones.length > 0) {
        const milestoneIds = milestones.map((milestone: any) => milestone.id);
        
        // Get all milestone updates for these milestones
        const milestoneUpdatesQuery = `
          SELECT 
            mu.*,
            d.name as developer_name,
            d.profile_picture_url as developer_profile_picture_url
          FROM milestone_updates mu
          LEFT JOIN developers d ON mu.developer_id = d.id
          WHERE mu.milestone_id = ANY($1::uuid[])
          ORDER BY mu.created_at DESC
        `;
        const milestoneUpdatesResult = await db.query(milestoneUpdatesQuery, [milestoneIds]);
        const milestoneUpdates = milestoneUpdatesResult.rows;
        
        // Create a map of milestone ID to updates
        const milestoneUpdatesMap: Record<string, any[]> = {};
        milestoneUpdates.forEach((update: any) => {
          if (!milestoneUpdatesMap[update.milestone_id]) {
            milestoneUpdatesMap[update.milestone_id] = [];
          }
          milestoneUpdatesMap[update.milestone_id].push(update);
        });
        
        // Format milestones with their updates
        formattedMilestones = milestones.map((milestone: any) => {
          const updates = milestoneUpdatesMap[milestone.id] || [];
          
          // Format updates with developer information
          const formattedUpdates = updates.map((update: any) => {
            let developerName = update.developer_name || 'Unknown';
            let profilePictureUrl = update.developer_profile_picture_url;
            
            // Special case for admin (Juelzs)
            if (developerName === 'Juelzs' || 
                developerName.toLowerCase() === 'admin' || 
                developerName.toLowerCase() === 'administrator' ||
                developerName.toLowerCase().includes('admin')) {
              profilePictureUrl = 'https://randomuser.me/api/portraits/men/10.jpg'; // Admin profile picture
            }
            
            return {
              id: update.id,
              update_type: update.update_type,
              content: update.content,
              created_at: update.created_at,
              developer_id: update.developer_id,
              developer_name: developerName,
              developer_profile_picture_url: profilePictureUrl,
              status: update.status || null,
              message: update.content, // Use content as message for backward compatibility
              admin_response: update.admin_response || null,
              admin_name: update.admin_name || null,
              admin_response_at: update.admin_response_at || null,
            };
          });
          
          return {
            id: milestone.id,
            title: milestone.title,
            description: milestone.description,
            status: milestone.status,
            completion_percentage: milestone.completion_percentage,
            due_date: milestone.due_date,
            order_index: milestone.order_index,
            created_at: milestone.created_at,
            updated_at: milestone.updated_at,
            task_id: milestone.task_id,
            updates: formattedUpdates,
            test_submission: milestone.test_submission,
          };
        });
      }
    } catch (milestoneError: any) {
      console.error('[API] Error fetching milestones:', milestoneError);
      // Continue with empty milestones list
    }
    
    // Format requirements and acceptance criteria
    const requirements = task.requirements || [];
    const acceptanceCriteria = task.acceptance_criteria || [];

    // Get GitHub metadata if available
    let metadata = {};
    if (task.metadata && typeof task.metadata === 'object') {
      metadata = task.metadata;
    }
    
    // Add calculated metadata
    const taskMetadata = {
      total_milestones: milestones.length,
      completed_milestones: milestones.filter((m: any) => m.status === 'completed').length,
      overall_progress: milestones.length > 0 ? 
        Math.round((milestones.filter((m: any) => m.status === 'completed').length / milestones.length) * 100) : 0,
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
      department_display_name: task.department_display_name || '',
      due_date: task.due_date,
      created_at: task.created_at,
      compensation: task.compensation,
      estimated_time: task.estimated_time,
      developers,
      milestones: formattedMilestones,
      requirements,
      acceptance_criteria: acceptanceCriteria,
      metadata: { ...metadata, ...taskMetadata },
      assignment: {
        status: taskAssignment.status,
        start_date: taskAssignment.start_date,
        due_date: taskAssignment.due_date,
        completed_at: taskAssignment.completed_at,
        notes: taskAssignment.notes,
      },
      loom_video_url: task.loom_video_url,
      transcript: task.transcript
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error in task details route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 