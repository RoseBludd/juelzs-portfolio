import { NextResponse } from "next/server";
import { getMainDbPool } from "@/lib/db-pool";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const db = getMainDbPool();
    
    // Build WHERE conditions
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      whereConditions.push(`t.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (department && department !== "all") {
      whereConditions.push(`t.department = $${paramIndex}`);
      queryParams.push(department);
      paramIndex++;
    }

    if (priority && priority !== "all") {
      whereConditions.push(`t.priority = $${paramIndex}`);
      queryParams.push(priority);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get tasks with assignments and developers
    const tasksQuery = `
      SELECT 
        t.*,
        ta.id as assignment_id,
        ta.developer_id,
        ta.status as assignment_status,
        ta.start_date,
        ta.due_date,
        d.name as developer_name,
        d.email as developer_email,
        d.role as developer_role,
        COUNT(*) OVER() as total_count
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id::text = ta.task_id
      LEFT JOIN developers d ON ta.developer_id = d.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const tasksResult = await db.query(tasksQuery, queryParams);

    // Get total count from first row
    const totalItems = tasksResult.rows.length > 0 ? parseInt(tasksResult.rows[0].total_count) : 0;
    
    // Format response
    const tasks = tasksResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      department: row.department,
      department_display_name: row.department,
      compensation: parseFloat(row.compensation || 0),
      estimated_time: row.estimated_time || 0,
      requirements: row.requirements || [],
      acceptance_criteria: row.acceptance_criteria || [],
      complexity: row.complexity || 'medium',
      category: row.category || 'NEW_FEATURE',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      start_date: row.start_date || row.created_at,
      due_date: row.due_date || row.created_at,
      environment_variables: row.environment_variables || {},
      loom_video_url: row.loom_video_url,
      transcript: row.transcript,
      metadata: row.metadata,
      assignedDeveloper: row.developer_name ? {
        id: row.developer_id,
        name: row.developer_name,
        email: row.developer_email,
        position: row.developer_role
      } : null,
      assignmentDate: row.assignment_id ? row.start_date : null,
      lastUpdate: null // Will be populated if needed
    }));
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      priority = "medium",
      department,
      status = "available",
      milestones = []
    } = body;

    const db = getMainDbPool();

    // Insert task
    const taskQuery = `
      INSERT INTO tasks (title, description, priority, department, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const taskResult = await db.query(taskQuery, [
      title,
      description,
      priority,
      department,
      status
    ]);

    const task = taskResult.rows[0];

    // Insert milestones if provided
    if (milestones && milestones.length > 0) {
      const milestoneValues = milestones.map((milestone: any, index: number) => {
        const paramStart = index * 6 + 1;
        return `($${paramStart}, $${paramStart + 1}, $${paramStart + 2}, $${paramStart + 3}, $${paramStart + 4}, $${paramStart + 5})`;
      }).join(', ');

      const milestoneParams = milestones.flatMap((milestone: any) => [
        task.id,
        milestone.title,
        milestone.description || null,
        milestone.order_index || 0,
        milestone.status || 'pending',
        milestone.due_date ? new Date(milestone.due_date) : null
      ]);

      const milestoneQuery = `
        INSERT INTO task_milestones (task_id, title, description, order_index, status, due_date)
        VALUES ${milestoneValues}
      `;

      await db.query(milestoneQuery, milestoneParams);
    }

    // Notify admins
    const adminsQuery = `SELECT id, name, email FROM users WHERE role = 'admin'`;
    const adminsResult = await db.query(adminsQuery);
    
    for (const admin of adminsResult.rows) {
      const notificationQuery = `
        INSERT INTO notifications (user_id, type, title, message, created_at)
        VALUES ($1, 'task_created', $2, $3, CURRENT_TIMESTAMP)
      `;
      
      await db.query(notificationQuery, [
        admin.id,
        'New Task Created',
        `A new task "${title}" has been created and is available for assignment.`
      ]);
    }

    return NextResponse.json(task, { status: 201 });

  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskId, developerId, action } = body;

    const db = getMainDbPool();

    if (action === "assign") {
      // Get task details
      const taskQuery = `SELECT * FROM tasks WHERE id = $1`;
      const taskResult = await db.query(taskQuery, [taskId]);
      
      if (taskResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      // Update task status
      const updateTaskQuery = `
        UPDATE tasks 
        SET status = 'assigned', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      await db.query(updateTaskQuery, [taskId]);

      // Get developer details
      const developerQuery = `SELECT * FROM users WHERE id = $1`;
      const developerResult = await db.query(developerQuery, [developerId]);
      
      if (developerResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Developer not found" },
          { status: 404 }
        );
      }

      // Create assignment
      const assignmentQuery = `
        INSERT INTO task_assignments (task_id, developer_id, status, start_date, created_at, updated_at)
        VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const assignmentResult = await db.query(assignmentQuery, [taskId, developerId]);

      // Notify developer
      const developerNotificationQuery = `
        INSERT INTO notifications (user_id, type, title, message, created_at)
        VALUES ($1, 'task_assigned', $2, $3, CURRENT_TIMESTAMP)
      `;
      
      await db.query(developerNotificationQuery, [
        developerId,
        'Task Assigned',
        `You have been assigned a new task: "${taskResult.rows[0].title}"`
      ]);

      // Notify admins
      const adminsQuery = `SELECT id, name, email FROM users WHERE role = 'admin'`;
      const adminsResult = await db.query(adminsQuery);
      
      for (const admin of adminsResult.rows) {
        const adminNotificationQuery = `
          INSERT INTO notifications (user_id, type, title, message, created_at)
          VALUES ($1, 'task_assigned', $2, $3, CURRENT_TIMESTAMP)
        `;
        
        await db.query(adminNotificationQuery, [
          admin.id,
          'Task Assigned',
          `Task "${taskResult.rows[0].title}" has been assigned to ${developerResult.rows[0].name}.`
        ]);
      }

      return NextResponse.json({
        message: "Task assigned successfully",
        assignment: assignmentResult.rows[0]
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const db = getMainDbPool();

    // Check if task exists
    const existingTaskQuery = `SELECT * FROM tasks WHERE id = $1`;
    const existingTaskResult = await db.query(existingTaskQuery, [taskId]);
    
    if (existingTaskResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Delete task (cascade will handle related records)
    const deleteQuery = `DELETE FROM tasks WHERE id = $1`;
    await db.query(deleteQuery, [taskId]);

    return NextResponse.json({ message: "Task deleted successfully" });

  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
