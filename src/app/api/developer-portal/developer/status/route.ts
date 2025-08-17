import { cookies } from "next/headers";
import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from "@/lib/db-pool";
import { verifySessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log('Developer status API called');
  
  try {
    // Get session from cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('user-session');
    
    if (!sessionCookie?.value) {
      console.log('API: No session cookie found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Verify and decode the session
    const userData = verifySessionCookie(sessionCookie.value);
    
    if (!userData || !userData.email) {
      console.log('API: Invalid session data');
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    console.log('Developer status API - Session:', userData.email);
    
    if (!userData.email) {
      console.log('Developer status API - No session or email');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the developer by email
    console.log('Developer status API - Fetching developer:', userData.email);
    
    const db = getMainDbPool();
    const developerQuery = `
      SELECT id, name, email, status, progression_stage, contract_signed, contract_signed_date
      FROM developers
      WHERE LOWER(email) = LOWER($1)
    `;
    
    const result = await db.query(developerQuery, [userData.email]);
    const developer = result.rows[0];

    console.log('Developer status API - Developer found:', developer?.email);

    if (!developer) {
      console.log('Developer status API - Developer not found');
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    // Add cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('Pragma', 'no-cache');

    return NextResponse.json(developer, { headers });
  } catch (error) {
    console.error("Developer status API - Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch developer status" },
      { status: 500 }
    );
  }
} 
