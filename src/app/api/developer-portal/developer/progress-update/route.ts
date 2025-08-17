import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/api-utils';
import { getMainDbPool } from '@/lib/db-pool';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Use the centralized main database pool for progress updates
const mainPool = getMainDbPool();

// Ensure tables exist in main database
async function ensureProgressUpdateTables() {
  let client = null;
  try {
    client = await mainPool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer_progress_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        developer_id UUID NOT NULL,
        content TEXT NOT NULL,
        update_type VARCHAR(50) DEFAULT 'daily_progress',
        task_id UUID NULL,
        percentage_complete INTEGER CHECK (percentage_complete >= 0 AND percentage_complete <= 100),
        blockers TEXT,
        next_steps TEXT,
        time_spent_minutes INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_progress_updates_developer_date 
      ON developer_progress_updates(developer_id, DATE(created_at))
    `);

  } catch (error) {
    console.error('Error creating progress update tables:', error);
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

    const { content, task_id, percentage_complete, blockers, next_steps, time_spent_minutes } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Progress content is required' }, { status: 400 });
    }

    // Ensure tables exist
    await ensureProgressUpdateTables();
    
    client = await mainPool.connect();

    // Insert progress update
    const result = await client.query(`
      INSERT INTO developer_progress_updates (
        developer_id, content, task_id, percentage_complete, blockers, next_steps, time_spent_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `, [userData.id, content.trim(), task_id, percentage_complete, blockers, next_steps, time_spent_minutes]);

    // Log activity
    await client.query(`
      INSERT INTO developer_activity_log (developer_id, activity_type, activity_description, metadata)
      VALUES ($1, 'progress_update_submitted', 'Submitted daily progress update', $2)
    `, [userData.id, JSON.stringify({ 
      progress_id: result.rows[0].id,
      task_id,
      percentage_complete,
      content_length: content.trim().length
    })]);

    return NextResponse.json({
      success: true,
      message: 'Progress update submitted successfully',
      update: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error submitting progress update:', error);
    return NextResponse.json(
      { error: 'Failed to submit progress update', details: error instanceof Error ? error.message : 'Unknown error' },
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
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent progress updates
    const result = await client.query(`
      SELECT 
        id,
        content,
        task_id,
        percentage_complete,
        blockers,
        next_steps,
        time_spent_minutes,
        created_at,
        updated_at
      FROM developer_progress_updates 
      WHERE developer_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userData.id, limit, offset]);

    return NextResponse.json({
      success: true,
      updates: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error getting progress updates:', error);
    return NextResponse.json(
      { error: 'Failed to get progress updates', details: error instanceof Error ? error.message : 'Unknown error' },
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

export async function PUT(request: NextRequest) {
  try {
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      update_id, 
      content, 
      percentage_complete, 
      blockers, 
      next_steps, 
      time_spent_minutes 
    } = await request.json();

    if (!update_id) {
      return NextResponse.json({ 
        error: 'Update ID is required' 
      }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ 
        error: 'Progress update content is required' 
      }, { status: 400 });
    }

    // Update the progress update
    const result = await mainPool.query(`
      UPDATE developer_progress_updates 
      SET 
        content = $1,
        percentage_complete = $2,
        blockers = $3,
        next_steps = $4,
        time_spent_minutes = $5,
        updated_at = NOW()
      WHERE id = $6 AND developer_id = $7
      RETURNING id, updated_at
    `, [
      content.trim(),
      percentage_complete || null,
      blockers?.trim() || null,
      next_steps?.trim() || null,
      time_spent_minutes || null,
      update_id,
      userData.id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Progress update not found or unauthorized' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      update_id: result.rows[0].id,
      updated_at: result.rows[0].updated_at,
      message: 'Progress update updated successfully'
    });

  } catch (error) {
    console.error('Error updating progress update:', error);
    return NextResponse.json(
      { error: 'Failed to update progress update' },
      { status: 500 }
    );
  }
} 