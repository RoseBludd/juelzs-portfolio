import { NextRequest, NextResponse } from 'next/server';
import { Client, Pool, PoolClient } from 'pg';

declare global {
  var __VIB_PG_CLIENT_CC: Client | undefined;
  var __VIB_PG_POOL_CC: Pool | undefined;
}

async function getDb(): Promise<{ client: Client | PoolClient; release: () => Promise<void> }> {
  const connectionString = process.env.VIBEZS_DB as string;
  const ssl = { rejectUnauthorized: false } as const;
  if (process.env.NODE_ENV !== 'production') {
    if (!global.__VIB_PG_CLIENT_CC) {
      global.__VIB_PG_CLIENT_CC = new Client({ connectionString, ssl });
      await global.__VIB_PG_CLIENT_CC.connect();
    }
    return { client: global.__VIB_PG_CLIENT_CC, release: async () => {} };
  }
  if (!global.__VIB_PG_POOL_CC) {
    global.__VIB_PG_POOL_CC = new Pool({ connectionString, ssl, max: 10 });
  }
  const pooledClient = await global.__VIB_PG_POOL_CC.connect();
  return { client: pooledClient, release: async () => { pooledClient.release(); } };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');
  const includeDisabled = searchParams.get('all') === '1';

  const { client, release } = await getDb();
  try {
    const rows = (await client.query(`
      SELECT cc.id, cc.title, cc.filename, cc.file_size, cc.metadata, cc.upload_date, cc.created_at, cc.updated_at,
             d.name as developer_name, d.role
      FROM cursor_chats cc
      JOIN developers d ON cc.developer_id = d.id
      WHERE d.role = 'strategic_architect'
      ORDER BY cc.updated_at DESC
    `)).rows;

    const mapped = rows.map((r: any) => {
      const metadata = r.metadata || {};
      const enabled = metadata.enabled !== false; // default true
      return {
        id: r.id,
        title: r.title,
        filename: r.filename,
        fileSize: r.file_size,
        uploadDate: r.upload_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        enabled,
      };
    });

    const filtered = includeDisabled ? mapped : mapped.filter(m => m.enabled);

    if (format === 'dropdown') {
      // Built-in conversations + enabled DB chats
      const builtins = [
        { value: 'cadis-developer', label: '🧠 CADIS Developer Intelligence' },
        { value: 'image-display-issues', label: '🔧 Image Display Issues' },
        { value: 'genius-game-development', label: '🎮 Genius Game Development' },
        { value: 'overall-analysis-insights', label: '🧭 Combined Strategic Intelligence' },
        { value: 'advanced-strategic-patterns', label: '🌟 Advanced Strategic Patterns' },
        { value: 'reonomy-integration', label: '🏢 Reonomy + Property Integration' }
      ];
      const dbOptions = filtered.map(c => ({ value: `db-${c.id}`, label: `📄 ${c.title}` }));
      return NextResponse.json({ success: true, options: [...builtins, ...dbOptions] });
    }

    return NextResponse.json({ success: true, chats: filtered });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  } finally {
    await release();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, filename, content, tags = [], project_context = null, metadata = {} } = body || {};
    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'title and content are required' }, { status: 400 });
    }

    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    const fileSize = content.length;
    const uploadDate = new Date();

    // Ensure enabled flag defaults to true in metadata
    const meta = { ...metadata, enabled: metadata.enabled !== false };

    const { client, release } = await getDb();
    try {
      // Pick an owner developer id if available
      const owner = await client.query(`SELECT id FROM developers WHERE role = 'strategic_architect' OR role = 'owner' ORDER BY created_at ASC LIMIT 1`);
      const developerId = owner.rows[0]?.id || id; // fallback

      await client.query(`
        INSERT INTO cursor_chats (
          id, developer_id, title, filename, content,
          file_size, tags, project_context, metadata, upload_date, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
      `, [
        id,
        developerId,
        title,
        filename || `${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.md`,
        content,
        fileSize,
        tags,
        project_context,
        meta,
        uploadDate,
      ]);

      return NextResponse.json({ success: true, id });
    } finally {
      await release();
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


