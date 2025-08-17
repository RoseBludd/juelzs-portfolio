import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from "@/lib/db-pool";

export async function POST(request: NextRequest) {
  try {
    const { email, agreed_at } = await request.json();

    if (!email || !agreed_at) {
      return NextResponse.json({ error: 'Email and agreement timestamp are required' }, { status: 400 });
    }

    const db = getMainDbPool();

    // Find the developer by email
    const developerQuery = `SELECT * FROM developers WHERE email = $1`;
    const developerResult = await db.query(developerQuery, [email]);
    const developer = developerResult.rows[0];

    if (!developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Update the developer record with contract signed status
    const updateQuery = `
      UPDATE developers 
      SET 
        contract_signed = true,
        contract_signed_date = $1,
        status = 'active',
        progression_stage = 'contract_signed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    await db.query(updateQuery, [new Date(agreed_at), developer.id]);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Agreement recorded successfully',
    });
  } catch (error) {
    console.error('Error recording agreement:', error);
    return NextResponse.json(
      { error: 'Failed to record agreement' },
      { status: 500 }
    );
  }
} 
