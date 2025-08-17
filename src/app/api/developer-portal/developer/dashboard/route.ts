import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';
import { verifySession } from '@/lib/api-utils';

const pool = getMainDbPool();

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const userData = verifySession(request);
    if (!userData?.id) {
      console.log('🔍 Dashboard API: No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Dashboard API: Loading data for user:', userData.email);

    // Get developer info
    console.log('   📊 Getting developer profile...');
    const developerQuery = `
      SELECT 
        id, 
        email, 
        name, 
        profile_picture_url,
        created_at
      FROM developers 
      WHERE email = $1
    `;
    const client = await pool.connect();
    
    try {
      const developerResult = await client.query(developerQuery, [userData.email]);
      
      if (developerResult.rows.length === 0) {
        return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
      }

      const developer = developerResult.rows[0];
      console.log('   ✅ Developer found:', developer.name);

      // Get comprehensive module stats
      console.log('   📊 Getting module statistics...');
      const moduleStatsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed_modules,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_modules,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_modules,
          AVG(completion_percentage) FILTER (WHERE status = 'completed') as avg_completion_quality,
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
      const moduleStatsResult = await client.query(moduleStatsQuery, [developer.id]);
      const moduleStats = moduleStatsResult.rows[0];

      // Get checkout statistics (how many times this developer's modules have been checked out)
      console.log('   📊 Getting checkout statistics...');
      const checkoutStatsQuery = `
        SELECT COUNT(*) as total_checkouts
        FROM registry_checkouts rc
        JOIN task_modules tm ON rc.module_id = tm.id
        WHERE tm.created_by = $1
      `;
      const checkoutStatsResult = await client.query(checkoutStatsQuery, [developer.id]);
      const checkoutStats = checkoutStatsResult.rows[0];

      // Get ratings statistics
      console.log('   📊 Getting ratings statistics...');
      const ratingsStatsQuery = `
        SELECT COUNT(*) as total_ratings
        FROM registry_ratings rr
        JOIN task_modules tm ON rr.module_id = tm.id
        WHERE tm.created_by = $1
      `;
      const ratingsStatsResult = await client.query(ratingsStatsQuery, [developer.id]);
      const ratingsStats = ratingsStatsResult.rows[0];

      // Calculate current streak (days with module activity)
      console.log('   📊 Calculating activity streak...');
      const streakQuery = `
        WITH daily_activity AS (
          SELECT DATE(created_at) as activity_date
          FROM task_modules 
          WHERE created_by = $1
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) DESC
        ),
        streak_calculation AS (
          SELECT 
            activity_date,
            ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
            activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC) || ' days')::interval as streak_group
          FROM daily_activity
        )
        SELECT COUNT(*) as current_streak
        FROM streak_calculation
        WHERE streak_group = (
          SELECT streak_group 
          FROM streak_calculation 
          WHERE activity_date = CURRENT_DATE 
          OR activity_date = CURRENT_DATE - INTERVAL '1 day'
          LIMIT 1
        )
      `;
      const streakResult = await client.query(streakQuery, [developer.id]);
      const currentStreak = streakResult.rows[0]?.current_streak || 0;

      // Get recent activity
      console.log('   📊 Getting recent activity...');
      const recentActivityQuery = `
        SELECT 
          tm.name,
          tm.status,
          tm.completion_percentage,
          tm.created_at,
          tm.updated_at,
          mt.name as module_type_name,
          mt.icon as module_type_icon,
          mt.color as module_type_color
        FROM task_modules tm
        JOIN module_types mt ON tm.module_type_id = mt.id
        WHERE tm.created_by = $1
        ORDER BY tm.updated_at DESC
        LIMIT 10
      `;
      const recentActivityResult = await client.query(recentActivityQuery, [developer.id]);

      // Determine achievement level based on completed modules
      const completedCount = parseInt(moduleStats.completed_modules) || 0;
      let achievementLevel = 'newcomer';
      if (completedCount >= 50) achievementLevel = 'master_developer';
      else if (completedCount >= 25) achievementLevel = 'senior_developer';
      else if (completedCount >= 10) achievementLevel = 'developer';
      else if (completedCount >= 3) achievementLevel = 'contributor';

      console.log('   ✅ Dashboard data compiled successfully');

      const dashboardData = {
        profile: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          profile_picture_url: developer.profile_picture_url,
          achievement_level: achievementLevel
        },
        stats: {
          completed_modules: parseInt(moduleStats.completed_modules) || 0,
          in_progress_modules: parseInt(moduleStats.in_progress_modules) || 0,
          pending_modules: parseInt(moduleStats.pending_modules) || 0,
          total_checkouts: parseInt(checkoutStats.total_checkouts) || 0,
          total_ratings: parseInt(ratingsStats.total_ratings) || 0,
          total_loom_videos: parseInt(moduleStats.total_loom_videos) || 0,
          total_pre_conditions: parseInt(moduleStats.total_pre_conditions) || 0,
          total_post_conditions: parseInt(moduleStats.total_post_conditions) || 0,
          avg_completion_quality: parseFloat(moduleStats.avg_completion_quality) || 0,
          current_streak: parseInt(currentStreak) || 0,
          modules_this_week: parseInt(moduleStats.modules_this_week) || 0,
          modules_this_month: parseInt(moduleStats.modules_this_month) || 0
        },
        recent_activity: recentActivityResult.rows.map(activity => ({
          ...activity,
          created_at: activity.created_at.toISOString(),
          updated_at: activity.updated_at.toISOString()
        }))
      };

      return NextResponse.json(dashboardData);

    } catch (error) {
      console.error('❌ Dashboard API Error:', error);
      return NextResponse.json(
        { error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Dashboard API Connection Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to database' },
      { status: 500 }
    );
  }
} 
