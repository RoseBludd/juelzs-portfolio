import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - only allow with secret key
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('key');
    
    if (adminKey !== 'setup-daily-workflow-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getMainDbPool();
    const client = await pool.connect();
    
    try {
      console.log('🔧 Setting up missing daily workflow tables...');
      
      // Create developer_work_sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS developer_work_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
            start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_time TIMESTAMP WITH TIME ZONE NULL,
            break_start TIMESTAMP WITH TIME ZONE NULL,
            break_end TIMESTAMP WITH TIME ZONE NULL,
            break_type VARCHAR(50) NULL,
            is_active BOOLEAN DEFAULT TRUE,
            total_work_minutes INTEGER DEFAULT 0,
            total_break_minutes INTEGER DEFAULT 0,
            notes TEXT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Create developer_daily_priorities table
      await client.query(`
        CREATE TABLE IF NOT EXISTS developer_daily_priorities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            priority_level VARCHAR(20) DEFAULT 'high',
            note TEXT NULL,
            estimated_hours INTEGER DEFAULT 8,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(developer_id, date)
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_work_sessions_developer 
        ON developer_work_sessions(developer_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_work_sessions_start_time 
        ON developer_work_sessions(start_time);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_work_sessions_active 
        ON developer_work_sessions(is_active);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_daily_priorities_developer_date 
        ON developer_daily_priorities(developer_id, date);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_daily_priorities_task 
        ON developer_daily_priorities(task_id);
      `);

      // Verify tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('developer_work_sessions', 'developer_daily_priorities', 'cursor_chats', 'task_modules', 'module_updates', 'module_submissions')
        ORDER BY table_name
      `);

      return NextResponse.json({
        success: true,
        message: 'Daily workflow tables created successfully',
        tables_found: tablesResult.rows.length,
        tables: tablesResult.rows.map(r => r.table_name),
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup database', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 