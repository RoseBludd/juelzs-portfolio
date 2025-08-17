import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

// GET - List all admin-manageable bonuses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active'); // 'true', 'false', or null for all
    const weekly = searchParams.get('weekly'); // 'true', 'false', or null for all

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (active !== null) {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      params.push(active === 'true');
    }

    if (weekly !== null) {
      paramCount++;
      whereClause += ` AND is_weekly = $${paramCount}`;
      params.push(weekly === 'true');
    }

    const query = `
      SELECT 
        ab.*,
        creator.name as created_by_name,
        
        -- Statistics
        COALESCE(stats.total_completions, 0) as total_completions,
        COALESCE(stats.this_week_completions, 0) as this_week_completions,
        COALESCE(stats.unique_developers, 0) as unique_developers,
        
        -- Current week info
        DATE_TRUNC('week', NOW()) as current_week_start
        
      FROM admin_bonuses ab
      LEFT JOIN developers creator ON ab.created_by = creator.id
      
      -- Statistics about completions
      LEFT JOIN (
        SELECT 
          bonus_id,
          COUNT(*) as total_completions,
          COUNT(*) FILTER (WHERE week_start = DATE_TRUNC('week', NOW())) as this_week_completions,
          COUNT(DISTINCT developer_id) as unique_developers
        FROM developer_bonus_completions
        GROUP BY bonus_id
      ) stats ON ab.id = stats.bonus_id
      
      ${whereClause}
      ORDER BY ab.is_active DESC, ab.created_at DESC
    `;

    const result = await pool.query(query, params);

    return NextResponse.json({
      bonuses: result.rows.map(bonus => ({
        ...bonus,
        total_completions: parseInt(bonus.total_completions) || 0,
        this_week_completions: parseInt(bonus.this_week_completions) || 0,
        unique_developers: parseInt(bonus.unique_developers) || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching admin bonuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bonuses' },
      { status: 500 }
    );
  }
}

// POST - Create a new bonus
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      target_value,
      reward_points,
      icon,
      color,
      is_weekly,
      calculation_query,
      created_by
    } = body;

    // Validate required fields
    if (!title || !description || !category || !target_value) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, target_value' },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO admin_bonuses (
        title, description, category, target_value, reward_points,
        icon, color, is_weekly, calculation_query, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      title,
      description,
      category,
      parseInt(target_value),
      parseInt(reward_points) || 0,
      icon || 'gift',
      color || 'blue',
      is_weekly !== false, // Default to true
      calculation_query,
      created_by || null
    ]);

    return NextResponse.json({
      success: true,
      bonus: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bonus:', error);
    return NextResponse.json(
      { error: 'Failed to create bonus' },
      { status: 500 }
    );
  }
}

// PUT - Update a bonus
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bonusId = searchParams.get('id');
    
    if (!bonusId) {
      return NextResponse.json(
        { error: 'Bonus ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      target_value,
      reward_points,
      icon,
      color,
      is_active,
      is_weekly,
      calculation_query
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
    if (category !== undefined) {
      updateFields.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    if (target_value !== undefined) {
      updateFields.push(`target_value = $${paramCount}`);
      values.push(parseInt(target_value));
      paramCount++;
    }
    if (reward_points !== undefined) {
      updateFields.push(`reward_points = $${paramCount}`);
      values.push(parseInt(reward_points));
      paramCount++;
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramCount}`);
      values.push(icon);
      paramCount++;
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramCount}`);
      values.push(color);
      paramCount++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    if (is_weekly !== undefined) {
      updateFields.push(`is_weekly = $${paramCount}`);
      values.push(is_weekly);
      paramCount++;
    }
    if (calculation_query !== undefined) {
      updateFields.push(`calculation_query = $${paramCount}`);
      values.push(calculation_query);
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
    
    // Add bonus ID as the last parameter
    values.push(bonusId);

    const updateQuery = `
      UPDATE admin_bonuses 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bonus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bonus: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating bonus:', error);
    return NextResponse.json(
      { error: 'Failed to update bonus' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a bonus
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bonusId = searchParams.get('id');
    
    if (!bonusId) {
      return NextResponse.json(
        { error: 'Bonus ID is required' },
        { status: 400 }
      );
    }

    // Check if bonus has any completions
    const completionsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM developer_bonus_completions WHERE bonus_id = $1',
      [bonusId]
    );

    const hasCompletions = parseInt(completionsCheck.rows[0].count) > 0;

    if (hasCompletions) {
      // Don't delete if there are completions, just deactivate
      const result = await pool.query(
        'UPDATE admin_bonuses SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
        [bonusId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Bonus not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Bonus deactivated (has completions)',
        bonus: result.rows[0]
      });
    } else {
      // Safe to delete if no completions
      const result = await pool.query(
        'DELETE FROM admin_bonuses WHERE id = $1 RETURNING *',
        [bonusId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Bonus not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Bonus deleted successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting bonus:', error);
    return NextResponse.json(
      { error: 'Failed to delete bonus' },
      { status: 500 }
    );
  }
} 