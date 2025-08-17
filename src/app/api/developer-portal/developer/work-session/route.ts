import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/api-utils';
import { getMainDbPool } from '@/lib/db-pool';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Use the centralized main database pool for work sessions
const mainPool = getMainDbPool();

// Ensure tables exist in main database
async function ensureWorkSessionTables() {
  let client = null;
  try {
    client = await mainPool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer_work_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        developer_id UUID NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE NULL,
        break_start TIMESTAMP WITH TIME ZONE NULL,
        break_end TIMESTAMP WITH TIME ZONE NULL,
        break_type VARCHAR(20) NULL CHECK (break_type IN ('short', 'lunch', 'long')),
        is_active BOOLEAN DEFAULT TRUE,
        total_work_minutes INTEGER DEFAULT 0,
        total_break_minutes INTEGER DEFAULT 0,
        description TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_work_sessions_developer_active 
      ON developer_work_sessions(developer_id, is_active)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_work_sessions_developer_date 
      ON developer_work_sessions(developer_id, DATE(start_time AT TIME ZONE 'UTC'))
    `);

  } catch (error) {
    console.error('Error creating work session tables:', error);
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

    const { action, break_type } = await request.json();
    
    // Ensure tables exist
    await ensureWorkSessionTables();
    
    client = await mainPool.connect();

    switch (action) {
      case 'start':
        // End any existing active sessions first - calculate final work time properly
        await client.query(`
          UPDATE developer_work_sessions 
          SET 
            is_active = false, 
            end_time = NOW(),
            total_work_minutes = COALESCE(total_work_minutes, 0) + 
              GREATEST(0, EXTRACT(EPOCH FROM (
                NOW() - start_time - 
                COALESCE(
                  CASE 
                    WHEN break_start IS NOT NULL AND break_end IS NOT NULL 
                    THEN (break_end - break_start)
                    WHEN break_start IS NOT NULL AND break_end IS NULL 
                    THEN (NOW() - break_start)
                    ELSE INTERVAL '0'
                  END, 
                  INTERVAL '0'
                )
              )) / 60)::INTEGER,
            total_break_minutes = COALESCE(total_break_minutes, 0) + 
              CASE 
                WHEN break_start IS NOT NULL AND break_end IS NULL 
                THEN GREATEST(0, EXTRACT(EPOCH FROM (NOW() - break_start)) / 60)::INTEGER
                ELSE 0
              END,
            break_end = CASE 
              WHEN break_start IS NOT NULL AND break_end IS NULL 
              THEN NOW()
              ELSE break_end
            END
          WHERE developer_id = $1 AND is_active = true
        `, [userData.id]);

        // Start new session with fresh state
        await client.query(`
          INSERT INTO developer_work_sessions (
            developer_id, 
            start_time, 
            is_active,
            total_work_minutes,
            total_break_minutes
          )
          VALUES ($1, NOW(), true, 0, 0)
        `, [userData.id]);

        // Log activity
        await client.query(`
          INSERT INTO developer_activity_log (developer_id, activity_type, activity_description)
          VALUES ($1, 'work_start', 'Started work session')
        `, [userData.id]);

        return NextResponse.json({ success: true, message: 'Work session started' });

      case 'end':
        // End active session with proper time calculation
        const endResult = await client.query(`
          UPDATE developer_work_sessions 
          SET 
            is_active = false, 
            end_time = NOW(),
            total_work_minutes = COALESCE(total_work_minutes, 0) + 
              GREATEST(0, EXTRACT(EPOCH FROM (
                NOW() - start_time - 
                COALESCE(
                  CASE 
                    WHEN break_start IS NOT NULL AND break_end IS NOT NULL 
                    THEN (break_end - break_start)
                    WHEN break_start IS NOT NULL AND break_end IS NULL 
                    THEN (NOW() - break_start)
                    ELSE INTERVAL '0'
                  END, 
                  INTERVAL '0'
                )
              )) / 60)::INTEGER,
            total_break_minutes = COALESCE(total_break_minutes, 0) + 
              CASE 
                WHEN break_start IS NOT NULL AND break_end IS NULL 
                THEN GREATEST(0, EXTRACT(EPOCH FROM (NOW() - break_start)) / 60)::INTEGER
                ELSE 0
              END,
            break_end = CASE 
              WHEN break_start IS NOT NULL AND break_end IS NULL 
              THEN NOW()
              ELSE break_end
            END
          WHERE developer_id = $1 AND is_active = true
          RETURNING id, total_work_minutes
        `, [userData.id]);

        if (endResult.rows.length === 0) {
          return NextResponse.json({ error: 'No active work session found' }, { status: 400 });
        }

        // Log activity
        await client.query(`
          INSERT INTO developer_activity_log (developer_id, activity_type, activity_description, metadata)
          VALUES ($1, 'work_end', 'Ended work session', $2)
        `, [userData.id, JSON.stringify({ total_minutes: endResult.rows[0].total_work_minutes })]);

        return NextResponse.json({ 
          success: true, 
          message: 'Work session ended',
          total_work_minutes: endResult.rows[0].total_work_minutes
        });

      case 'break_start':
        if (!break_type || !['short', 'lunch', 'long'].includes(break_type)) {
          return NextResponse.json({ error: 'Invalid break type' }, { status: 400 });
        }

        // Start break on active session - clear any previous break_end to ensure proper state
        const breakStartResult = await client.query(`
          UPDATE developer_work_sessions 
          SET break_start = NOW(), break_type = $2, break_end = NULL
          WHERE developer_id = $1 AND is_active = true
          RETURNING id, start_time, break_start
        `, [userData.id, break_type]);

        if (breakStartResult.rows.length === 0) {
          return NextResponse.json({ error: 'No active work session found' }, { status: 400 });
        }

        // Log activity
        await client.query(`
          INSERT INTO developer_activity_log (developer_id, activity_type, activity_description, metadata)
          VALUES ($1, 'break_start', $2, $3)
        `, [userData.id, `Started ${break_type} break`, JSON.stringify({ break_type })]);

        return NextResponse.json({ success: true, message: `${break_type} break started` });

      case 'break_end':
        // End break on active session
        const breakEndResult = await client.query(`
          UPDATE developer_work_sessions 
          SET 
            break_end = NOW(),
            total_break_minutes = COALESCE(total_break_minutes, 0) + 
              GREATEST(0, EXTRACT(EPOCH FROM (NOW() - break_start)) / 60)::INTEGER
          WHERE developer_id = $1 AND is_active = true AND break_start IS NOT NULL AND break_end IS NULL
          RETURNING id, break_type, total_break_minutes, start_time, break_start, break_end
        `, [userData.id]);

        if (breakEndResult.rows.length === 0) {
          return NextResponse.json({ error: 'No active break found' }, { status: 400 });
        }

        // Log activity
        await client.query(`
          INSERT INTO developer_activity_log (developer_id, activity_type, activity_description, metadata)
          VALUES ($1, 'break_end', 'Ended break', $2)
        `, [userData.id, JSON.stringify({ 
          break_type: breakEndResult.rows[0].break_type,
          total_break_minutes: breakEndResult.rows[0].total_break_minutes
        })]);

        return NextResponse.json({ 
          success: true, 
          message: 'Break ended',
          total_break_minutes: breakEndResult.rows[0].total_break_minutes
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error handling work session:', error);
    return NextResponse.json(
      { error: 'Failed to handle work session', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Get current work status with proper timezone handling
    const statusResult = await client.query(`
      SELECT 
        is_active,
        break_start IS NOT NULL AND break_end IS NULL as is_on_break,
        break_type,
        start_time,
        break_start,
        break_end,
        total_work_minutes,
        total_break_minutes,
        -- Convert timestamps to ISO 8601 strings with timezone for consistent parsing
        start_time::timestamptz as session_start_tz,
        break_start::timestamptz as break_start_tz
      FROM developer_work_sessions 
      WHERE developer_id = $1 AND is_active = true
      ORDER BY start_time DESC
      LIMIT 1
    `, [userData.id]);

    if (statusResult.rows.length === 0) {
      return NextResponse.json({
        is_working: false,
        is_on_break: false,
        break_type: null,
        session_start: null,
        break_start: null,
        total_work_minutes: 0,
        total_break_minutes: 0
      });
    }

    const session = statusResult.rows[0];
    return NextResponse.json({
      is_working: session.is_active,
      is_on_break: session.is_on_break,
      break_type: session.break_type,
      session_start: session.session_start_tz, // This will be proper ISO 8601 with timezone
      break_start: session.break_start_tz,     // This will be proper ISO 8601 with timezone
      total_work_minutes: session.total_work_minutes || 0,
      total_break_minutes: session.total_break_minutes || 0
    });

  } catch (error) {
    console.error('Error getting work status:', error);
    return NextResponse.json(
      { error: 'Failed to get work status', details: error instanceof Error ? error.message : 'Unknown error' },
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