import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

// GET - List winners for a specific goal or all winners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let goalFilter = '';
    const params: any[] = [limit, offset];

    if (goalId) {
      goalFilter = 'AND wgw.goal_id = $3';
      params.push(goalId);
    }

    const query = `
      SELECT 
        wgw.*,
        wg.title as goal_title,
        wg.goal_type,
        wg.start_date,
        wg.end_date,
        gt.display_name as goal_display_name,
        gt.icon as goal_icon,
        gt.color as goal_color,
        d.email as developer_email,
        d.profile_picture_url as developer_profile_picture
      FROM weekly_goal_winners wgw
      JOIN weekly_goals wg ON wgw.goal_id = wg.id
      LEFT JOIN goal_types gt ON wg.goal_type = gt.name
      LEFT JOIN developers d ON wgw.developer_id = d.id
      WHERE 1=1 ${goalFilter}
      ORDER BY wgw.award_date DESC, wgw.achievement_value DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, params);

    // Get total count
    let countParams = [];
    if (goalId) {
      countParams.push(goalId);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM weekly_goal_winners wgw
      WHERE 1=1 ${goalFilter.replace('$3', '$1')}
    `;
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      winners: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching goal winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal winners' },
      { status: 500 }
    );
  }
}

// POST - Add a new winner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      goal_id,
      developer_id,
      developer_name,
      achievement_value,
      achievement_description,
      award_date,
      notes
    } = body;

    // Validate required fields
    if (!goal_id || !developer_id || !developer_name) {
      return NextResponse.json(
        { error: 'Missing required fields: goal_id, developer_id, developer_name' },
        { status: 400 }
      );
    }

    // Check if goal exists and get goal info
    const goalCheck = await pool.query(
      'SELECT id, title, goal_type FROM weekly_goals WHERE id = $1',
      [goal_id]
    );

    if (goalCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Check if winner already exists for this goal
    const existingWinner = await pool.query(
      'SELECT id FROM weekly_goal_winners WHERE goal_id = $1 AND developer_id = $2',
      [goal_id, developer_id]
    );

    if (existingWinner.rows.length > 0) {
      return NextResponse.json(
        { error: 'Winner already exists for this goal' },
        { status: 409 }
      );
    }

    // Get the developer's actual progress for this goal
    const progressQuery = await pool.query(
      'SELECT current_value FROM weekly_goal_progress WHERE goal_id = $1 AND developer_id = $2',
      [goal_id, developer_id]
    );

    const actualValue = progressQuery.rows[0]?.current_value || achievement_value || 0;

    // Insert new winner
    const insertQuery = `
      INSERT INTO weekly_goal_winners (
        goal_id, developer_id, developer_name, achievement_value,
        achievement_description, award_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      goal_id,
      developer_id,
      developer_name,
      actualValue,
      achievement_description || `Winner of ${goalCheck.rows[0].title}`,
      award_date || new Date().toISOString().split('T')[0],
      notes
    ]);

    return NextResponse.json({
      success: true,
      winner: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding goal winner:', error);
    return NextResponse.json(
      { error: 'Failed to add goal winner' },
      { status: 500 }
    );
  }
}

// PUT - Update winner information
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const winnerId = searchParams.get('id');
    
    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      achievement_value,
      achievement_description,
      award_date,
      notes
    } = body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (achievement_value !== undefined) {
      updateFields.push(`achievement_value = $${paramCount}`);
      values.push(achievement_value);
      paramCount++;
    }
    if (achievement_description !== undefined) {
      updateFields.push(`achievement_description = $${paramCount}`);
      values.push(achievement_description);
      paramCount++;
    }
    if (award_date !== undefined) {
      updateFields.push(`award_date = $${paramCount}`);
      values.push(award_date);
      paramCount++;
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`);
      values.push(notes);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add winner ID as the last parameter
    values.push(winnerId);

    const updateQuery = `
      UPDATE weekly_goal_winners 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Winner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      winner: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating goal winner:', error);
    return NextResponse.json(
      { error: 'Failed to update goal winner' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a winner
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const winnerId = searchParams.get('id');
    
    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required' },
        { status: 400 }
      );
    }

    const deleteQuery = 'DELETE FROM weekly_goal_winners WHERE id = $1 RETURNING id';
    const result = await pool.query(deleteQuery, [winnerId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Winner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Winner removed successfully'
    });

  } catch (error) {
    console.error('Error removing goal winner:', error);
    return NextResponse.json(
      { error: 'Failed to remove goal winner' },
      { status: 500 }
    );
  }
} 