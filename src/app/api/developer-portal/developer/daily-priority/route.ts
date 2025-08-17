import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/api-utils';
import { getMainDbPool } from '@/lib/db-pool';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Use the centralized main database pool for daily priorities
const mainPool = getMainDbPool();

// Ensure tables exist in main database
async function ensureDailyPriorityTables() {
  let client = null;
  try {
    client = await mainPool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer_daily_priorities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        developer_id UUID NOT NULL,
        task_id UUID NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(developer_id, date)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_priorities_developer_date 
      ON developer_daily_priorities(developer_id, date)
    `);

  } catch (error) {
    console.error('Error creating daily priority tables:', error);
  } finally {
    if (client) client.release();
  }
}

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id } = await request.json();
    if (!task_id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Ensure tables exist
    await ensureDailyPriorityTables();
    
    client = await mainPool.connect();
    const today = new Date().toISOString().split('T')[0];

    // Upsert the daily priority (insert or update if exists for today)
    const result = await client.query(`
      INSERT INTO developer_daily_priorities (developer_id, task_id, date)
      VALUES ($1, $2, $3)
      ON CONFLICT (developer_id, date)
      DO UPDATE SET 
        task_id = EXCLUDED.task_id,
        updated_at = NOW()
      RETURNING id, task_id
    `, [userData.id, task_id, today]);

    // Log activity
    await client.query(`
      INSERT INTO developer_activity_log (developer_id, activity_type, activity_description, metadata)
      VALUES ($1, 'daily_priority_set', 'Set daily priority task', $2)
    `, [userData.id, JSON.stringify({ task_id, date: today })]);

    return NextResponse.json({
      success: true,
      message: 'Daily priority set successfully',
      priority: {
        id: result.rows[0].id,
        task_id: result.rows[0].task_id,
        date: today
      }
    });

  } catch (error) {
    console.error('Error setting daily priority:', error);
    return NextResponse.json(
      { error: 'Failed to set daily priority', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (error) {
        console.error('Error releasing database connection:', error);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  let client = null;
  
  try {
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    client = await mainPool.connect();
    const today = new Date().toISOString().split('T')[0];

    // Get today's priority
    const result = await client.query(`
      SELECT 
        dp.id,
        dp.task_id,
        dp.date,
        dp.created_at,
        t.title as task_title,
        t.description as task_description,
        t.priority as task_priority
      FROM developer_daily_priorities dp
      LEFT JOIN tasks t ON dp.task_id = t.id
      WHERE dp.developer_id = $1 AND dp.date = $2
      ORDER BY dp.created_at DESC
      LIMIT 1
    `, [userData.id, today]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        priority: null,
        message: 'No daily priority set for today'
      });
    }

    return NextResponse.json({
      success: true,
      priority: result.rows[0]
    });

  } catch (error) {
    console.error('Error getting daily priority:', error);
    return NextResponse.json(
      { error: 'Failed to get daily priority', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (error) {
        console.error('Error releasing database connection:', error);
      }
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Delete the priority for the specified date
    const result = await mainPool.query(`
      DELETE FROM developer_daily_priorities 
      WHERE developer_id = $1 AND date = $2
      RETURNING id
    `, [userData.id, date]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'No priority found for this date' 
      }, { status: 404 });
    }

    // Log the priority removal
    await mainPool.query(`
      INSERT INTO developer_activity_log (
        developer_id, activity_type, description, metadata, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      userData.id,
      'priority_removed',
      `Removed daily priority for ${date}`,
      JSON.stringify({ date: date })
    ]);

    return NextResponse.json({ 
      success: true,
      message: 'Daily priority removed successfully'
    });

  } catch (error) {
    console.error('Error removing daily priority:', error);
    return NextResponse.json(
      { error: 'Failed to remove daily priority' },
      { status: 500 }
    );
  }
} 