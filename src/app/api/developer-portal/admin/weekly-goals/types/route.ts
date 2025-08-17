import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

const pool = getMainDbPool();

// GET - List all goal types
export async function GET() {
  try {
    const query = `
      SELECT 
        gt.*,
        COUNT(wg.id) as active_goals_count,
        COUNT(wgw.id) as total_winners_count
      FROM goal_types gt
      LEFT JOIN weekly_goals wg ON gt.name = wg.goal_type AND wg.is_active = true
      LEFT JOIN weekly_goal_winners wgw ON wg.id = wgw.goal_id
      WHERE gt.is_active = true
      GROUP BY gt.id, gt.name, gt.display_name, gt.description, gt.icon, gt.color, gt.is_active, gt.created_at
      ORDER BY gt.name
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      goalTypes: result.rows.map(row => ({
        ...row,
        active_goals_count: parseInt(row.active_goals_count) || 0,
        total_winners_count: parseInt(row.total_winners_count) || 0
      }))
    });

  } catch (error) {
    console.error('Error fetching goal types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal types' },
      { status: 500 }
    );
  }
}

// POST - Create a new goal type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      display_name,
      description,
      calculation_query,
      icon,
      color
    } = body;

    // Validate required fields
    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name' },
        { status: 400 }
      );
    }

    // Check if goal type already exists
    const existingType = await pool.query(
      'SELECT id FROM goal_types WHERE name = $1',
      [name]
    );

    if (existingType.rows.length > 0) {
      return NextResponse.json(
        { error: 'Goal type with this name already exists' },
        { status: 409 }
      );
    }

    // Insert new goal type
    const insertQuery = `
      INSERT INTO goal_types (
        name, display_name, description, calculation_query, icon, color
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      name,
      display_name,
      description,
      calculation_query,
      icon || 'star',
      color || 'blue'
    ]);

    return NextResponse.json({
      success: true,
      goalType: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating goal type:', error);
    return NextResponse.json(
      { error: 'Failed to create goal type' },
      { status: 500 }
    );
  }
}

// PUT - Update a goal type
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('id');
    
    if (!typeId) {
      return NextResponse.json(
        { error: 'Goal type ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      display_name,
      description,
      calculation_query,
      icon,
      color,
      is_active
    } = body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updateFields.push(`display_name = $${paramCount}`);
      values.push(display_name);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (calculation_query !== undefined) {
      updateFields.push(`calculation_query = $${paramCount}`);
      values.push(calculation_query);
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

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add goal type ID as the last parameter
    values.push(typeId);

    const updateQuery = `
      UPDATE goal_types 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Goal type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      goalType: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating goal type:', error);
    return NextResponse.json(
      { error: 'Failed to update goal type' },
      { status: 500 }
    );
  }
} 