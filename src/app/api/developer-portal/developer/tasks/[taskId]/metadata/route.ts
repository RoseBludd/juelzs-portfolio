import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';
import { verifySession } from '@/lib/api-utils';

const mainPool = getMainDbPool();

// PUT - Update task metadata (repository URL)
export async function PUT(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    // Verify user session
    const currentUser = verifySession(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'You must be logged in to update task metadata'
      }, { status: 401 });
    }

    const { taskId } = params;
    const body = await request.json();
    const { repository_url } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (!repository_url || typeof repository_url !== 'string') {
      return NextResponse.json({ error: 'Repository URL is required and must be a string' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(repository_url);
    } catch (urlError) {
      return NextResponse.json({ 
        error: 'Invalid URL format',
        details: 'Please provide a valid repository URL'
      }, { status: 400 });
    }

    console.log(`🔄 Updating task ${taskId} repository URL to "${repository_url}" by user ${currentUser.id}`);

    // Check if task exists
    const taskResult = await mainPool.query(
      'SELECT id, metadata FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found',
        details: `Task with ID ${taskId} does not exist`
      }, { status: 404 });
    }

    const existingTask = taskResult.rows[0];

    // Check if user is assigned to this task (for developers)
    if (currentUser.role === 'developer') {
      const assignmentResult = await mainPool.query(
        'SELECT * FROM task_assignments WHERE task_id = $1::text AND developer_id = $2',
        [taskId, currentUser.id]
      );

      if (assignmentResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied',
          details: 'You can only update metadata for tasks assigned to you'
        }, { status: 403 });
      }
    }

    // Get current metadata or initialize empty object
    const currentMetadata = (existingTask.metadata as any) || {};

    // Update metadata with repository URL
    const updatedMetadata = {
      ...currentMetadata,
      repository_url: repository_url,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id
    };

    // Update the task metadata
    const updateResult = await mainPool.query(
      'UPDATE tasks SET metadata = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(updatedMetadata), taskId]
    );
    
    const updatedTask = updateResult.rows[0];

    console.log(`✅ Task ${taskId} repository URL updated successfully`);

    return NextResponse.json({ 
      message: 'Repository URL updated successfully',
      metadata: updatedMetadata,
      repository_url: repository_url
    });

  } catch (error) {
    console.error('Error updating task metadata:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update task metadata',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 