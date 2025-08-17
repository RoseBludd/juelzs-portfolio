import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, developerIds, data } = body;

    // Validate required fields
    if (!action || !developerIds || !Array.isArray(developerIds) || developerIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and developer IDs are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing bulk action: ${action} for ${developerIds.length} developers`);

    let results = [];
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      switch (action) {
        case 'status':
          if (!data?.status) {
            throw new Error('Status is required for status change action');
          }
          
          // Update developer status
          const statusResult = await client.query(
            `UPDATE developers 
             SET status = $1, updated_at = NOW() 
             WHERE id = ANY($2::uuid[]) 
             RETURNING id, name, status`,
            [data.status, developerIds]
          );

          // Log the status change
          for (const developer of statusResult.rows) {
            await client.query(
              `INSERT INTO developer_activity_log (developer_id, activity_type, description, admin_action, created_at)
               VALUES ($1, 'status_change', $2, true, NOW())`,
              [
                developer.id,
                `Status changed to ${data.status} via bulk action`
              ]
            );
          }

          results = statusResult.rows;
          break;

        case 'task':
          if (!data?.taskTitle || !data?.priority) {
            throw new Error('Task title and priority are required for task assignment');
          }

          // Create a task for each developer
          for (const developerId of developerIds) {
            // First create the task
            const taskResult = await client.query(
              `INSERT INTO tasks (title, description, priority, status, department, created_at, updated_at)
               VALUES ($1, $2, $3, 'available', 'development', NOW(), NOW())
               RETURNING id`,
              [
                data.taskTitle,
                data.description || `Task assigned via bulk action to multiple developers`,
                data.priority
              ]
            );

            const taskId = taskResult.rows[0].id;

            // Create task assignment
            await client.query(
              `INSERT INTO task_assignments (task_id, developer_id, assigned_at, status, created_at, updated_at)
               VALUES ($1, $2, NOW(), 'assigned', NOW(), NOW())`,
              [taskId, developerId]
            );

            // Log the task assignment
            await client.query(
              `INSERT INTO developer_activity_log (developer_id, activity_type, description, admin_action, created_at)
               VALUES ($1, 'task_assigned', $2, true, NOW())`,
              [
                developerId,
                `Assigned task: ${data.taskTitle} (Priority: ${data.priority})`
              ]
            );

            results.push({
              developerId,
              taskId,
              taskTitle: data.taskTitle,
              priority: data.priority
            });
          }
          break;

        case 'message':
          if (!data?.subject || !data?.message) {
            throw new Error('Subject and message are required for messaging action');
          }

          // Create message records for each developer
          for (const developerId of developerIds) {
            await client.query(
              `INSERT INTO developer_messages (developer_id, subject, message, sender_type, sender_name, sent_at, created_at)
               VALUES ($1, $2, $3, 'admin', 'Admin Team', NOW(), NOW())`,
              [developerId, data.subject, data.message]
            );

            // Log the message
            await client.query(
              `INSERT INTO developer_activity_log (developer_id, activity_type, description, admin_action, created_at)
               VALUES ($1, 'message_sent', $2, true, NOW())`,
              [
                developerId,
                `Message sent: ${data.subject}`
              ]
            );

            results.push({
              developerId,
              subject: data.subject,
              message: data.message
            });
          }
          break;

        default:
          throw new Error(`Unknown bulk action: ${action}`);
      }

      await client.query('COMMIT');
      
      console.log(`✅ Bulk action ${action} completed successfully for ${developerIds.length} developers`);

      return NextResponse.json({
        success: true,
        action,
        affectedDevelopers: developerIds.length,
        results
      });

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }

  } catch (error) {
    console.error('Bulk action failed:', error);
    return NextResponse.json(
      { 
        error: 'Bulk action failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 