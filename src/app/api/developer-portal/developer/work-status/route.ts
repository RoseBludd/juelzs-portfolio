import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';
import { verifySession } from '@/lib/api-utils';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Use the centralized main database pool for work status
const mainPool = getMainDbPool();

export async function GET(request: NextRequest) {
  let client = null;
  
  try {
    // Get authenticated user
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get developer info from database
    const developerQuery = `
      SELECT id, name, email 
      FROM developers 
      WHERE email = $1
    `;
    const developerResult = await mainPool.query(developerQuery, [userData.email]);
    
    if (developerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const developer = developerResult.rows[0];

    client = await mainPool.connect();

    // Get current work status
    const statusResult = await client.query(`
      SELECT 
        is_active,
        break_start IS NOT NULL AND break_end IS NULL as is_on_break,
        break_type,
        start_time,
        total_work_minutes,
        total_break_minutes
      FROM developer_work_sessions 
      WHERE developer_id = $1 AND is_active = true
      ORDER BY start_time DESC
      LIMIT 1
    `, [developer.id]);

    if (statusResult.rows.length === 0) {
      return NextResponse.json({
        is_working: false,
        is_on_break: false,
        break_type: null,
        session_start: null,
        total_work_minutes: 0,
        total_break_minutes: 0
      });
    }

    const session = statusResult.rows[0];
    return NextResponse.json({
      is_working: session.is_active,
      is_on_break: session.is_on_break,
      break_type: session.break_type,
      session_start: session.start_time,
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