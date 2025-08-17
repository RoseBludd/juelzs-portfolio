import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';
import { verifySession } from '@/lib/api-utils';
import { z } from 'zod';

// Use centralized main database pool
const pool = getMainDbPool();

export const dynamic = "force-dynamic";

// Task creation schema
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  complexity: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.enum(['NEW_FEATURE', 'INTEGRATION', 'AUTOMATION', 'BUG_FIX', 'ENHANCEMENT', 'LOCALIZATION', 'DOCUMENTATION']).default('NEW_FEATURE'),
  department: z.string().optional(),
  estimated_time: z.number().min(1, "Estimated time must be at least 1 hour").default(20),
  requirements: z.array(z.string()).optional(),
  acceptance_criteria: z.array(z.string()).optional(),
  environment_variables: z.record(z.string()).optional(),
  is_monday_related: z.boolean().default(false),
  loom_video_url: z.string().url().optional(),
  transcript: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Get authenticated user - match working stats endpoint pattern exactly
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Task Creation API: Creating task for user:', userData.email);

    // Get developer info from database
    const developerQuery = `
      SELECT id, name, email 
      FROM developers 
      WHERE email = $1
    `;
    const developerResult = await pool.query(developerQuery, [userData.email]);
    
    if (developerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const developer = developerResult.rows[0];

    // Create the task in the tasks table (using UUID, with required fields)
    const taskQuery = `
      INSERT INTO tasks (
        title, description, priority, status, assigned_to,
        created_at, updated_at, due_date, department, compensation,
        requirements, acceptance_criteria, complexity, category,
        estimated_time, environment_variables, is_monday_related,
        loom_video_url, transcript
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const dueDate = new Date(Date.now() + (validatedData.estimated_time * 60 * 60 * 1000)); // Add estimated hours
    
    const taskResult = await pool.query(taskQuery, [
      validatedData.title,
      validatedData.description,
      validatedData.priority,
      'assigned', // status
      developer.id, // assigned_to 
      dueDate,
      validatedData.department || 'integration', // required department field - use valid department
      0.00, // required compensation field (default to 0 for self-created tasks)
      validatedData.requirements || [],
      validatedData.acceptance_criteria || [],
      validatedData.complexity,
      validatedData.category,
      validatedData.estimated_time,
      validatedData.environment_variables || {},
      validatedData.is_monday_related || false,
      validatedData.loom_video_url || null,
      validatedData.transcript || null
    ]);

    const task = taskResult.rows[0];

    // Create task assignment (convert UUID task.id to TEXT for task_assignments.task_id)
    const assignmentQuery = `
      INSERT INTO task_assignments (
        id, task_id, developer_id, status, 
        start_date, due_date, notes
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
      RETURNING *
    `;

    const assignmentId = `ta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const assignmentNotes = JSON.stringify({
      estimated_time: validatedData.estimated_time,
      complexity: validatedData.complexity,
      category: validatedData.category,
      requirements: validatedData.requirements || [],
      acceptance_criteria: validatedData.acceptance_criteria || [],
      environment_variables: validatedData.environment_variables || {},
      is_monday_related: validatedData.is_monday_related,
      loom_video_url: validatedData.loom_video_url,
      transcript: validatedData.transcript,
      created_by: developer.id,
      auto_assigned: true
    });

    const assignmentResult = await pool.query(assignmentQuery, [
      assignmentId,
      task.id.toString(), // Convert UUID to TEXT for task_assignments.task_id 
      developer.id,
      'assigned',
      dueDate,
      assignmentNotes
    ]);

    const assignment = assignmentResult.rows[0];

    // If there's a video URL, create an attachment (convert UUID to TEXT for task_attachments.task_id)
    if (validatedData.loom_video_url) {
      const attachmentQuery = `
        INSERT INTO task_attachments (
          id, task_id, type, url, title, 
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await pool.query(attachmentQuery, [
        attachmentId,
        task.id.toString(), // Convert UUID to TEXT for task_attachments.task_id
        'video',
        validatedData.loom_video_url,
        'Loom Video Explanation'
      ]);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            created_at: task.created_at
          },
          assignment: {
            id: assignment.id,
            status: assignment.status,
            start_date: assignment.start_date,
            due_date: assignment.due_date
          },
          message: 'Task created and assigned successfully'
        }
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Task creation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Keep the other methods as stubs for now
export async function GET() {
  return NextResponse.json({
    error: 'GET method not implemented for this endpoint'
  }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'PUT method not implemented for this endpoint'
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'DELETE method not implemented for this endpoint'
  }, { status: 501 });
}
