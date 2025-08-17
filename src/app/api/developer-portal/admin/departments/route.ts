import { NextResponse } from "next/server";

import { getMainDbPool } from "@/lib/db-pool";

export async function GET() {
  try {
    const db = getMainDbPool();
    const result = await db.query(`
      SELECT id, name, display_name
      FROM departments
      ORDER BY display_name ASC
    `);

    const departments = result.rows;

    if (!departments) {
      return NextResponse.json([]);
    }

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return NextResponse.json([], { status: 200 });
  }
} 
