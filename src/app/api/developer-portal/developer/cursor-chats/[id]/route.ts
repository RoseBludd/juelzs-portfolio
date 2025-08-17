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

// GET - Get individual cursor chat content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify session and get developer
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    console.log('Fetching cursor chat:', { chatId, developerId: userData.id });

    // Get the cursor chat content using the user's actual ID
    const result = await pool.query(`
      SELECT 
        id,
        title,
        filename,
        content,
        file_size,
        tags,
        project_context,
        metadata,
        upload_date,
        created_at
      FROM cursor_chats 
      WHERE id = $1 AND developer_id = $2
    `, [chatId, userData.id]);

    console.log('Cursor chat query result:', { 
      chatId, 
      developerId: userData.id, 
      found: result.rows.length > 0 
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Cursor chat not found or you do not have permission to access it' 
      }, { status: 404 });
    }

    const chat = result.rows[0];

    return NextResponse.json({
      id: chat.id,
      title: chat.title,
      filename: chat.filename,
      content: chat.content,
      fileSize: chat.file_size,
      tags: chat.tags,
      projectContext: chat.project_context,
      metadata: chat.metadata,
      uploadDate: chat.upload_date,
      createdAt: chat.created_at
    });

  } catch (error) {
    console.error('Error fetching cursor chat:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cursor chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a cursor chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify session and get developer
    const userData = verifySession(request);
    if (!userData?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    // Delete the cursor chat using the user's actual ID
    const result = await pool.query(`
      DELETE FROM cursor_chats 
      WHERE id = $1 AND developer_id = $2
      RETURNING title
    `, [chatId, userData.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Cursor chat not found or you do not have permission to delete it' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Cursor chat deleted successfully',
      deletedChat: result.rows[0].title
    });

  } catch (error) {
    console.error('Error deleting cursor chat:', error);
    return NextResponse.json({ 
      error: 'Failed to delete cursor chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 