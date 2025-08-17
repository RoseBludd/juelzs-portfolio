import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';
import { verifySession } from '@/lib/api-utils';

const pool = getMainDbPool();

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const userData = verifySession(request);
    if (!userData?.id) {
      console.log('🎁 Bonuses API: No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🎁 Bonuses API: Loading bonuses for:', userData.email);

    // Get developer info
    const developerQuery = `
      SELECT id, name, email 
      FROM developers 
      WHERE email = $1
    `;
    const developerResult = await pool.query(developerQuery, [userData.email]);
    
    if (developerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const developer = developerResult.rows[0];

    // Get current stats for bonus calculations
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '7 days') as modules_this_week,
        COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') as modules_this_month,
        COUNT(*) FILTER (WHERE metadata->>'loom_video_url' IS NOT NULL AND metadata->>'loom_video_url' != '') as total_loom_videos,
        SUM(
          CASE 
            WHEN metadata ? 'pre_conditions' THEN jsonb_array_length(metadata->'pre_conditions')
            ELSE 0
          END
        ) as total_pre_conditions,
        SUM(
          CASE 
            WHEN metadata ? 'post_conditions' THEN jsonb_array_length(metadata->'post_conditions')
            ELSE 0
          END
        ) as total_post_conditions
      FROM task_modules 
      WHERE created_by = $1
    `;
    const statsResult = await pool.query(statsQuery, [developer.id]);
    const stats = statsResult.rows[0];

    // Get checkout count for this developer's modules
    const checkoutQuery = `
      SELECT COUNT(*) as total_checkouts
      FROM registry_checkouts rc
      JOIN task_modules tm ON rc.module_id = tm.id
      WHERE tm.created_by = $1
    `;
    const checkoutResult = await pool.query(checkoutQuery, [developer.id]);
    const checkoutCount = parseInt(checkoutResult.rows[0].total_checkouts) || 0;

    // Get current week start for tracking completions
    const weekStartQuery = 'SELECT get_week_start() as week_start';
    const weekStartResult = await pool.query(weekStartQuery);
    const currentWeekStart = weekStartResult.rows[0].week_start;

    // Get active bonuses from database
    const bonusesQuery = `
      SELECT 
        ab.*,
        CASE 
          WHEN dbc.id IS NOT NULL THEN true 
          ELSE false 
        END as completed_this_week
      FROM admin_bonuses ab
      LEFT JOIN developer_bonus_completions dbc ON ab.id = dbc.bonus_id 
        AND dbc.developer_id = $1 
        AND dbc.week_start = $2
      WHERE ab.is_active = true
      ORDER BY ab.created_at
    `;
    const bonusesResult = await pool.query(bonusesQuery, [developer.id, currentWeekStart]);

    // Calculate current values for each bonus based on category
    const processedBonuses = bonusesResult.rows.map(bonus => {
      let currentValue = 0;

      // Calculate current value based on bonus category and calculation query
      switch (bonus.calculation_query || bonus.category) {
        case 'modules_this_week':
        case 'modules':
          currentValue = parseInt(stats.modules_this_week) || 0;
          break;
        case 'total_checkouts':
        case 'checkouts':
          currentValue = checkoutCount;
          break;
        case 'total_loom_videos':
        case 'videos':
          currentValue = parseInt(stats.total_loom_videos) || 0;
          break;
        case 'total_conditions':
        case 'conditions':
          currentValue = (parseInt(stats.total_pre_conditions) || 0) + (parseInt(stats.total_post_conditions) || 0);
          break;
        case 'modules_this_month':
          currentValue = parseInt(stats.modules_this_month) || 0;
          break;
        default:
          // For custom calculation queries, we'd need to implement specific logic
          currentValue = 0;
      }

      const isCompleted = bonus.completed_this_week || currentValue >= bonus.target_value;

      return {
        id: bonus.id,
        title: bonus.title,
        description: bonus.description,
        category: bonus.category,
        target_value: bonus.target_value,
        current_value: currentValue,
        reward_points: bonus.reward_points,
        icon: bonus.icon,
        color: bonus.color,
        deadline: getWeekEnd(), // Keep the deadline functionality
        completed: isCompleted,
        progress_percentage: Math.min(100, Math.round((currentValue / bonus.target_value) * 100))
      };
    });

    // Filter bonuses
    const completedBonuses = processedBonuses.filter(bonus => bonus.completed);
    const availableBonuses = processedBonuses.filter(bonus => !bonus.completed);
    const progressBonuses = availableBonuses.filter(bonus => bonus.progress_percentage > 0);

    console.log('   ✅ Database bonuses loaded successfully');

    return NextResponse.json({
      available: availableBonuses,
      completed: completedBonuses,
      progress: progressBonuses
    });

  } catch (error) {
    console.error('❌ Bonuses API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load bonuses' },
      { status: 500 }
    );
  }
}

// Helper function to get the end of current week
function getWeekEnd(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + daysUntilSunday);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd.toISOString();
}

// Helper function to get the end of current month
function getMonthEnd(): string {
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd.toISOString();
}

// POST - Mark bonus as completed
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userData = verifySession(request);
    if (!userData?.id) {
      console.log('🎁 Bonuses API: No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bonus_id } = await request.json();

    // Get developer info
    const developerQuery = `
      SELECT id FROM developers WHERE email = $1
    `;
    const developerResult = await pool.query(developerQuery, [userData.email]);
    
    if (developerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    const developer = developerResult.rows[0];

    // Get current week start
    const weekStartQuery = 'SELECT get_week_start() as week_start';
    const weekStartResult = await pool.query(weekStartQuery);
    const currentWeekStart = weekStartResult.rows[0].week_start;

    // Get bonus info
    const bonusQuery = 'SELECT * FROM admin_bonuses WHERE id = $1 AND is_active = true';
    const bonusResult = await pool.query(bonusQuery, [bonus_id]);
    
    if (bonusResult.rows.length === 0) {
      return NextResponse.json({ error: 'Bonus not found or inactive' }, { status: 404 });
    }

    const bonus = bonusResult.rows[0];

    // Mark bonus as completed for this week
    const insertQuery = `
      INSERT INTO developer_bonus_completions (developer_id, bonus_id, points_awarded, week_start)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (developer_id, bonus_id, week_start) DO NOTHING
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [developer.id, bonus_id, bonus.reward_points, currentWeekStart]);

    return NextResponse.json({ 
      message: 'Bonus completed successfully',
      completion: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Bonus Completion Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete bonus' },
      { status: 500 }
    );
  }
} 