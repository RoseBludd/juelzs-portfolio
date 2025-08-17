import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up production database schema...');
    
    // Security check - only allow in development or with admin auth
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('key');
    
    if (process.env.NODE_ENV === 'production' && adminKey !== 'setup-db-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 1. Create bonus management tables
    console.log('📊 Creating bonus management system...');
    const bonusSchema = `
      -- Create admin-manageable bonus system
      CREATE TABLE IF NOT EXISTS admin_bonuses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          target_value INTEGER NOT NULL,
          reward_points INTEGER NOT NULL DEFAULT 0,
          icon VARCHAR(50) DEFAULT 'gift',
          color VARCHAR(50) DEFAULT 'blue',
          is_active BOOLEAN DEFAULT true,
          is_weekly BOOLEAN DEFAULT true,
          calculation_query TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by UUID REFERENCES developers(id) ON DELETE SET NULL
      );

      -- Table to track bonus completions
      CREATE TABLE IF NOT EXISTS developer_bonus_completions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
          bonus_id UUID NOT NULL REFERENCES admin_bonuses(id) ON DELETE CASCADE,
          completed_at TIMESTAMP DEFAULT NOW(),
          points_awarded INTEGER DEFAULT 0,
          week_start DATE,
          UNIQUE(developer_id, bonus_id, week_start)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_admin_bonuses_active ON admin_bonuses(is_active);
      CREATE INDEX IF NOT EXISTS idx_admin_bonuses_weekly ON admin_bonuses(is_weekly);
      CREATE INDEX IF NOT EXISTS idx_bonus_completions_developer ON developer_bonus_completions(developer_id);
      CREATE INDEX IF NOT EXISTS idx_bonus_completions_week ON developer_bonus_completions(week_start);

      -- Function to get current week start (Monday)
      CREATE OR REPLACE FUNCTION get_week_start() RETURNS DATE AS $$
      BEGIN
          RETURN CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await pool.query(bonusSchema);
    console.log('✅ Bonus management tables created');
    
    // 2. Insert default bonuses if they don't exist
    console.log('🎁 Setting up default bonuses...');
    const checkBonuses = 'SELECT COUNT(*) as count FROM admin_bonuses';
    const bonusCount = await pool.query(checkBonuses);
    
    let bonusesInserted = false;
    if (parseInt(bonusCount.rows[0].count) === 0) {
      const defaultBonuses = `
        INSERT INTO admin_bonuses (title, description, category, target_value, reward_points, icon, color, calculation_query) VALUES
        ('Module Master', 'Complete 3 modules this week', 'modules', 3, 50, 'checkbox', 'green', 'modules_this_week'),
        ('Popular Creator', 'Get 5 component checkouts', 'checkouts', 5, 30, 'download', 'purple', 'total_checkouts'),
        ('Video Producer', 'Create 2 Loom videos', 'videos', 2, 25, 'video', 'blue', 'total_loom_videos'),
        ('Quality Architect', 'Add 10 pre/post conditions', 'conditions', 10, 20, 'flag', 'yellow', 'total_conditions');
      `;
      await pool.query(defaultBonuses);
      bonusesInserted = true;
      console.log('✅ Default bonuses inserted');
    } else {
      console.log('✅ Bonuses already exist');
    }
    
    // 3. Verify all critical tables exist
    console.log('📋 Verifying critical tables...');
    const criticalTables = [
      'developers',
      'task_modules', 
      'weekly_goals',
      'weekly_goal_progress',
      'admin_bonuses',
      'developer_bonus_completions'
    ];
    
    const tableStatus: { [key: string]: string } = {};
    for (const table of criticalTables) {
      try {
        const tableCheck = await pool.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        tableStatus[table] = 'exists';
        console.log(`✅ ${table} table exists`);
      } catch (error) {
        tableStatus[table] = 'missing';
        console.log(`❌ ${table} table missing or has issues`);
      }
    }
    
    // 4. Test bonus API functionality
    console.log('🧪 Testing bonus API functionality...');
    const testBonusQuery = `
      SELECT 
        ab.*,
        COALESCE(stats.total_completions, 0) as total_completions,
        COALESCE(stats.this_week_completions, 0) as this_week_completions,
        COALESCE(stats.unique_developers, 0) as unique_developers
      FROM admin_bonuses ab
      LEFT JOIN (
        SELECT 
          bonus_id,
          COUNT(*) as total_completions,
          COUNT(*) FILTER (WHERE week_start = get_week_start()) as this_week_completions,
          COUNT(DISTINCT developer_id) as unique_developers
        FROM developer_bonus_completions
        GROUP BY bonus_id
      ) stats ON ab.id = stats.bonus_id
      WHERE ab.is_active = true
      LIMIT 3
    `;
    
    const testResult = await pool.query(testBonusQuery);
    
    console.log('🎉 Production database setup completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Production database setup completed',
      results: {
        bonusTablesCreated: true,
        defaultBonusesInserted: bonusesInserted,
        existingBonusCount: parseInt(bonusCount.rows[0].count),
        activeBonuses: testResult.rows.length,
        tableStatus,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error setting up production database:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup production database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 