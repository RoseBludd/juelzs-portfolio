import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/api-utils';
import { getMainDbPool } from '@/lib/db-pool';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Use the centralized main database pool for end-day functionality
const mainPool = getMainDbPool();

// Ensure tables exist in main database
async function ensureEndDayTables() {
  let client = null;
  try {
    client = await mainPool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer_daily_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        developer_id UUID NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        total_work_minutes INTEGER DEFAULT 0,
        total_break_minutes INTEGER DEFAULT 0,
        cursor_chats_count INTEGER DEFAULT 0,
        loom_videos_count INTEGER DEFAULT 0,
        code_submissions_count INTEGER DEFAULT 0,
        scribes_count INTEGER DEFAULT 0,
        modules_created INTEGER DEFAULT 0,
        goals_completed BOOLEAN DEFAULT FALSE,
        summary_text TEXT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(developer_id, date)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_summaries_developer_date 
      ON developer_daily_summaries(developer_id, date)
    `);

  } catch (error) {
    console.error('Error creating end day tables:', error);
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

    const { timestamp } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Ensure tables exist
    await ensureEndDayTables();
    
    client = await mainPool.connect();

    // First, check if the developer has met all daily requirements
    const requirementsCheck = await client.query(`
      SELECT 
        -- Check cursor chats
        (SELECT COUNT(*) FROM cursor_chats WHERE developer_id = $1 AND DATE(upload_date) = $2) as cursor_chats_count,
        
        -- Check work sessions and total time
        COALESCE(SUM(dws.total_work_minutes), 0) as total_work_minutes,
        COALESCE(SUM(dws.total_break_minutes), 0) as total_break_minutes
      FROM developer_work_sessions dws
      WHERE dws.developer_id = $1 AND DATE(dws.start_time) = $2
    `, [userData.id, today]);

    if (requirementsCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Unable to verify daily requirements' 
      }, { status: 400 });
    }

    const requirements = requirementsCheck.rows[0];
    const cursorChatsCount = parseInt(requirements.cursor_chats_count || '0');
    const totalWorkMinutes = parseInt(requirements.total_work_minutes || '0');
    const totalBreakMinutes = parseInt(requirements.total_break_minutes || '0');

    // Check minimum requirements (can be configured)
    const minCursorChats = 1;
    const minWorkHours = 4; // 4 hours minimum

    const requirementsMet = 
      cursorChatsCount >= minCursorChats && 
      totalWorkMinutes >= (minWorkHours * 60);

    if (!requirementsMet) {
      return NextResponse.json({
        error: 'Daily requirements not met',
        details: {
          cursor_chats: { required: minCursorChats, completed: cursorChatsCount },
          work_hours: { required: minWorkHours, completed: Math.round(totalWorkMinutes / 60 * 10) / 10 }
        }
      }, { status: 400 });
    }

    // End any active work sessions
    await client.query(`
      UPDATE developer_work_sessions 
      SET is_active = false, end_time = NOW(),
          total_work_minutes = COALESCE(total_work_minutes, 0) + 
            GREATEST(0, EXTRACT(EPOCH FROM (NOW() - COALESCE(break_end, start_time))) / 60)::INTEGER
      WHERE developer_id = $1 AND is_active = true
    `, [userData.id]);

    // Create or update daily summary
    const summaryResult = await client.query(`
      INSERT INTO developer_daily_summaries (
        developer_id, date, total_work_minutes, total_break_minutes, 
        cursor_chats_count, goals_completed, summary_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (developer_id, date)
      DO UPDATE SET 
        total_work_minutes = EXCLUDED.total_work_minutes,
        total_break_minutes = EXCLUDED.total_break_minutes,
        cursor_chats_count = EXCLUDED.cursor_chats_count,
        goals_completed = EXCLUDED.goals_completed,
        summary_text = EXCLUDED.summary_text,
        updated_at = NOW()
      RETURNING id
    `, [
      userData.id, 
      today, 
      totalWorkMinutes, 
      totalBreakMinutes, 
      cursorChatsCount, 
      true,
      `Day completed at ${new Date().toLocaleTimeString()}`
    ]);

    // Log activity
    await client.query(`
      INSERT INTO developer_activity_log (developer_id, activity_type, activity_description, metadata)
      VALUES ($1, 'day_ended', 'Successfully ended work day', $2)
    `, [userData.id, JSON.stringify({
      date: today,
      total_work_hours: Math.round(totalWorkMinutes / 60 * 10) / 10,
      total_break_hours: Math.round(totalBreakMinutes / 60 * 10) / 10,
      cursor_chats_uploaded: cursorChatsCount,
      summary_id: summaryResult.rows[0].id
    })]);

    return NextResponse.json({
      success: true,
      message: 'Work day ended successfully! Great job!',
      summary: {
        date: today,
        total_work_hours: Math.round(totalWorkMinutes / 60 * 10) / 10,
        total_break_hours: Math.round(totalBreakMinutes / 60 * 10) / 10,
        cursor_chats_uploaded: cursorChatsCount,
        goals_completed: true
      }
    });

  } catch (error) {
    console.error('Error ending work day:', error);
    return NextResponse.json(
      { error: 'Failed to end work day', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    client = await mainPool.connect();

    // Get daily summary if it exists
    const summaryResult = await client.query(`
      SELECT * FROM developer_daily_summaries 
      WHERE developer_id = $1 AND date = $2
    `, [userData.id, date]);

    if (summaryResult.rows.length === 0) {
      // No summary exists, check current requirements
      const requirementsCheck = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM cursor_chats WHERE developer_id = $1 AND DATE(upload_date) = $2) as cursor_chats_count,
          COALESCE(SUM(dws.total_work_minutes), 0) as total_work_minutes,
          COALESCE(SUM(dws.total_break_minutes), 0) as total_break_minutes
        FROM developer_work_sessions dws
        WHERE dws.developer_id = $1 AND DATE(dws.start_time) = $2
      `, [userData.id, date]);

      const requirements = requirementsCheck.rows[0] || { cursor_chats_count: 0, total_work_minutes: 0, total_break_minutes: 0 };
      const cursorChatsCount = parseInt(requirements.cursor_chats_count || '0');
      const totalWorkMinutes = parseInt(requirements.total_work_minutes || '0');

      const minCursorChats = 1;
      const minWorkHours = 4;
      
      const requirementsMet = 
        cursorChatsCount >= minCursorChats && 
        totalWorkMinutes >= (minWorkHours * 60);

      const missingRequirements = [];
      if (cursorChatsCount < minCursorChats) {
        missingRequirements.push(`${minCursorChats - cursorChatsCount} cursor chat(s)`);
      }
      if (totalWorkMinutes < (minWorkHours * 60)) {
        const missingHours = minWorkHours - Math.round(totalWorkMinutes / 60 * 10) / 10;
        missingRequirements.push(`${missingHours} more work hour(s)`);
      }

      return NextResponse.json({
        summary: null,
        can_end_day: requirementsMet,
        missing_requirements: missingRequirements,
        current_progress: {
          cursor_chats: cursorChatsCount,
          work_hours: Math.round(totalWorkMinutes / 60 * 10) / 10,
          break_hours: Math.round(parseInt(requirements.total_break_minutes || '0') / 60 * 10) / 10
        }
      });
    }

    const summary = summaryResult.rows[0];
    return NextResponse.json({
      summary: {
        id: summary.id,
        date: summary.date,
        total_work_hours: Math.round(summary.total_work_minutes / 60 * 10) / 10,
        total_break_hours: Math.round(summary.total_break_minutes / 60 * 10) / 10,
        cursor_chats_uploaded: summary.cursor_chats_count,
        loom_videos_created: summary.loom_videos_count,
        code_submissions: summary.code_submissions_count,
        modules_created: summary.modules_created,
        scribes_completed: summary.scribes_count,
        goals_completed: summary.goals_completed,
        summary_text: summary.summary_text,
        created_at: summary.created_at
      },
      can_end_day: true, // Already ended
      missing_requirements: [],
      current_progress: null
    });

  } catch (error) {
    console.error('Error getting daily summary:', error);
    return NextResponse.json(
      { error: 'Failed to get daily summary', details: error instanceof Error ? error.message : 'Unknown error' },
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