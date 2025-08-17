import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

// GET - List all weekly goals with progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'active', 'completed', 'all'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let statusFilter = '';
    if (status === 'active') {
      statusFilter = `AND wg.is_active = true AND wg.start_date <= CURRENT_DATE AND wg.end_date >= CURRENT_DATE`;
    } else if (status === 'completed') {
      statusFilter = `AND wg.end_date < CURRENT_DATE`;
    } else if (status === 'upcoming') {
      statusFilter = `AND wg.start_date > CURRENT_DATE`;
    }

    const query = `
      SELECT 
        wg.*,
        gt.display_name as goal_display_name,
        gt.icon as goal_icon,
        gt.color as goal_color,
        gt.description as goal_type_description,
        creator.name as created_by_name,
        
        -- Progress statistics
        COALESCE(progress_stats.participant_count, 0) as participant_count,
        COALESCE(progress_stats.max_value, 0) as current_max_value,
        COALESCE(progress_stats.avg_value, 0) as avg_value,
        
        -- Winner information
        COALESCE(winner_stats.winner_count, 0) as winner_count,
        winner_stats.winners as current_winners,
        
        -- Top performers (top 3)
        top_performers.top_performers,
        
        -- Status
        CASE 
          WHEN wg.start_date > CURRENT_DATE THEN 'upcoming'
          WHEN wg.end_date < CURRENT_DATE THEN 'completed'
          WHEN wg.is_active = true THEN 'active'
          ELSE 'inactive'
        END as status
        
      FROM weekly_goals wg
      LEFT JOIN goal_types gt ON wg.goal_type = gt.name
      LEFT JOIN developers creator ON wg.created_by = creator.id
      
      -- Progress statistics
      LEFT JOIN (
        SELECT 
          goal_id,
          COUNT(*) as participant_count,
          MAX(current_value) as max_value,
          AVG(current_value::numeric) as avg_value
        FROM weekly_goal_progress
        WHERE current_value > 0
        GROUP BY goal_id
      ) progress_stats ON wg.id = progress_stats.goal_id
      
      -- Winner statistics
      LEFT JOIN (
        SELECT 
          goal_id,
          COUNT(*) as winner_count,
          json_agg(json_build_object(
            'id', id,
            'developer_name', developer_name,
            'achievement_value', achievement_value,
            'achievement_description', achievement_description,
            'award_date', award_date,
            'notes', notes
          )) as winners
        FROM weekly_goal_winners
        GROUP BY goal_id
      ) winner_stats ON wg.id = winner_stats.goal_id
      
      -- Top 3 performers
      LEFT JOIN (
        SELECT 
          goal_id,
          json_agg(
            json_build_object(
              'developer_id', developer_id,
              'developer_name', developer_name,
              'current_value', current_value,
              'rank', rank,
              'profile_picture_url', profile_picture_url
            ) 
            ORDER BY rank
          ) as top_performers
        FROM (
          SELECT 
            wgp.goal_id,
            wgp.developer_id,
            d.name as developer_name,
            d.profile_picture_url,
            wgp.current_value,
            ROW_NUMBER() OVER (PARTITION BY wgp.goal_id ORDER BY wgp.current_value DESC) as rank
          FROM weekly_goal_progress wgp
          JOIN developers d ON wgp.developer_id = d.id
          WHERE wgp.current_value > 0
        ) ranked
        WHERE rank <= 3
        GROUP BY goal_id
      ) top_performers ON wg.id = top_performers.goal_id
      
      WHERE 1=1 ${statusFilter}
      ORDER BY wg.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM weekly_goals wg
      WHERE 1=1 ${statusFilter}
    `;
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      goals: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching weekly goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly goals' },
      { status: 500 }
    );
  }
}

// POST - Create a new weekly goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      goal_type,
      target_value,
      start_date,
      end_date,
      prize_description,
      prize_amount,
      created_by
    } = body;

    // Validate required fields
    if (!title || !goal_type || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, goal_type, start_date, end_date' },
        { status: 400 }
      );
    }

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Handle admin created goals - if created_by is "admin" or invalid, set to null
    let actualCreatedBy = created_by;
    if (created_by === 'admin' || !created_by) {
      actualCreatedBy = null;
    }

    // Insert new goal
    const insertQuery = `
      INSERT INTO weekly_goals (
        title, description, goal_type, target_value, 
        start_date, end_date, prize_description, prize_amount, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      title,
      description,
      goal_type,
      target_value,
      start_date,
      end_date,
      prize_description,
      prize_amount,
      actualCreatedBy
    ]);

    // Trigger initial progress calculation for the new goal
    await pool.query('SELECT update_goal_progress()');

    return NextResponse.json({
      success: true,
      goal: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating weekly goal:', error);
    return NextResponse.json(
      { error: 'Failed to create weekly goal' },
      { status: 500 }
    );
  }
}

// PUT - Update a weekly goal
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');
    
    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      goal_type,
      target_value,
      start_date,
      end_date,
      prize_description,
      prize_amount,
      is_active
    } = body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (goal_type !== undefined) {
      updateFields.push(`goal_type = $${paramCount}`);
      values.push(goal_type);
      paramCount++;
    }
    if (target_value !== undefined) {
      updateFields.push(`target_value = $${paramCount}`);
      values.push(target_value);
      paramCount++;
    }
    if (start_date !== undefined) {
      updateFields.push(`start_date = $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }
    if (end_date !== undefined) {
      updateFields.push(`end_date = $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }
    if (prize_description !== undefined) {
      updateFields.push(`prize_description = $${paramCount}`);
      values.push(prize_description);
      paramCount++;
    }
    if (prize_amount !== undefined) {
      updateFields.push(`prize_amount = $${paramCount}`);
      values.push(prize_amount);
      paramCount++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add goal ID as the last parameter
    values.push(goalId);

    const updateQuery = `
      UPDATE weekly_goals 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      goal: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating weekly goal:', error);
    return NextResponse.json(
      { error: 'Failed to update weekly goal' },
      { status: 500 }
    );
  }
} 