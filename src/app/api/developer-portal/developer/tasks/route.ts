import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from "@/lib/db-pool";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const db = getMainDbPool();

    // Find the developer by email
    const developerQuery = `
      SELECT id, progression_stage, status, contract_signed
      FROM developers
      WHERE email = $1
    `;
    
    const developerResult = await db.query(developerQuery, [email]);
    const developer = developerResult.rows[0];

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Check if developer is active and has signed the contract
    if (developer.status !== 'active' || !developer.contract_signed) {
      return NextResponse.json({ error: 'Developer is not active or has not signed the contract' }, { status: 403 });
    }

    // Define query conditions based on progression stage
    let compensationLimit = 0;
    let taskFilterDescription = '';
    let whereClause = '';
    const queryParams = [];
    
    if (developer.progression_stage === 'trial_task_completed' || developer.progression_stage === 'full_developer') {
      // Full developers and those who completed trial tasks can see all tasks
      compensationLimit = 500;
      whereClause = 'WHERE status = $1 AND compensation <= $2';
      queryParams.push('available', compensationLimit);
      taskFilterDescription = `Showing all tasks (up to $${compensationLimit})`;
    } else if (developer.progression_stage === 'trial_task_assigned') {
      // Developers assigned a trial task can ONLY see tasks with compensation between $50-$100
      compensationLimit = 100;
      whereClause = 'WHERE status = $1 AND compensation >= $2 AND compensation <= $3';
      queryParams.push('available', 50, 100);
      taskFilterDescription = 'Showing trial tasks only ($50-$100)';
    } else if (developer.progression_stage === 'contract_signed') {
      // Developers who just signed the contract can see ALL tasks up to $100
      compensationLimit = 100;
      whereClause = 'WHERE status = $1 AND compensation <= $2';
      queryParams.push('available', compensationLimit);
      taskFilterDescription = `Showing all tasks up to $${compensationLimit}`;
    } else {
      // Default case for other stages (should not normally happen)
      compensationLimit = 50;
      whereClause = 'WHERE status = $1 AND compensation <= $2';
      queryParams.push('available', compensationLimit);
      taskFilterDescription = `Showing limited tasks (up to $${compensationLimit})`;
    }

    // Fetch available tasks based on the conditions
    const tasksQuery = `
      SELECT 
        id, title, description, compensation, due_date, priority, 
        department, requirements, acceptance_criteria, created_at, 
        complexity, category
      FROM tasks
      ${whereClause}
      ORDER BY priority DESC, created_at DESC
    `;
    
    const tasksResult = await db.query(tasksQuery, queryParams);
    const tasks = tasksResult.rows;

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        compensationLimit,
        progressionStage: developer.progression_stage,
        taskFilterDescription,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 
