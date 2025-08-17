import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifySession } from '@/lib/api-utils';

// Temporary connection to main database until VIBEZS_DATABASE write access is fixed
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});

// Function to ensure cursor_chats table exists in main database
async function ensureCursorChatsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cursor_chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        developer_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        tags TEXT[] DEFAULT '{}',
        project_context VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Cursor chats table ensured in main database');
  } catch (error) {
    console.error('Error creating cursor_chats table:', error);
  }
}

// GET - Get all cursor chats for the authenticated developer
export async function GET(request: NextRequest) {
  try {
    // Verify session and get developer
    const userData = verifySession(request);
    if (!userData?.id) {
      console.log('Cursor chats GET: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cursor chats GET: User authenticated:', userData.email);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Ensure table exists
    await ensureCursorChatsTable();

    // Get developer ID from main database (use email to find user)
    let developerId = userData.id;
    try {
      const devResult = await pool.query('SELECT id FROM users WHERE email = $1', [userData.email]);
      if (devResult.rows.length > 0) {
        developerId = devResult.rows[0].id;
      }
    } catch (devError) {
      console.log('Developer not found in main database, using session ID');
    }

    let query = `
      SELECT 
        id,
        title,
        filename,
        file_size,
        tags,
        project_context,
        metadata,
        upload_date,
        created_at
      FROM cursor_chats 
      WHERE developer_id = $1
    `;

    const params: any[] = [developerId];
    let paramCount = 1;

    // Add search filter if provided
    if (search) {
      paramCount++;
      query += ` AND (
        title ILIKE $${paramCount} OR 
        filename ILIKE $${paramCount} OR
        project_context ILIKE $${paramCount} OR
        EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE $${paramCount})
      )`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY upload_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM cursor_chats WHERE developer_id = $1`;
    const countParams = [developerId];

    if (search) {
      countQuery += ` AND (
        title ILIKE $2 OR 
        filename ILIKE $2 OR
        project_context ILIKE $2 OR
        EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE $2)
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      chats: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching cursor chats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cursor chats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Upload a new cursor chat
export async function POST(request: NextRequest) {
  try {
    console.log('Cursor chat POST: Starting upload');
    
    // Verify session and get developer
    const userData = verifySession(request);
    if (!userData?.id) {
      console.log('Cursor chat POST: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cursor chat POST: User authenticated:', userData.email);

    const body = await request.json();
    const { title, filename, content, tags = [], projectContext } = body;

    console.log('Cursor chat POST: Request data:', { 
      title, 
      filename, 
      contentLength: content?.length,
      tagsCount: tags?.length 
    });

    // Validate required fields
    if (!title || !filename || !content) {
      console.log('Cursor chat POST: Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: title, filename, and content are required' 
      }, { status: 400 });
    }

    // Ensure table exists
    await ensureCursorChatsTable();

    // Get developer ID from main database (use email to find user)
    let developerId = userData.id;
    try {
      const devResult = await pool.query('SELECT id FROM users WHERE email = $1', [userData.email]);
      if (devResult.rows.length > 0) {
        developerId = devResult.rows[0].id;
      } else {
        console.log('Developer not found in main database, using session ID:', userData.id);
        developerId = userData.id;
      }
    } catch (devError) {
      console.log('Error checking developer, using session ID:', devError);
      developerId = userData.id;
    }

    // Calculate file size and metadata
    const fileSize = Buffer.byteLength(content, 'utf8');
    const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
    const lineCount = content.split('\n').length;
    
    const metadata = {
      wordCount,
      lineCount,
      uploadedAt: new Date().toISOString()
    };

    console.log('Cursor chat POST: Metadata calculated:', metadata);

    // Insert cursor chat into database
    const insertQuery = `
      INSERT INTO cursor_chats (
        developer_id, title, filename, content, file_size, 
        tags, project_context, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `;

    console.log('Cursor chat POST: Inserting with developer_id:', developerId);

    const result = await pool.query(insertQuery, [
      developerId,
      title,
      filename,
      content,
      fileSize,
      tags,
      projectContext || null,
      metadata
    ]);

    console.log('Cursor chat POST: Successfully inserted:', result.rows[0]);

    return NextResponse.json({
      success: true,
      chatId: result.rows[0].id,
      message: 'Cursor chat uploaded successfully',
      metadata: {
        fileSize,
        wordCount,
        lineCount,
        uploadedAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error uploading cursor chat:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to upload cursor chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 