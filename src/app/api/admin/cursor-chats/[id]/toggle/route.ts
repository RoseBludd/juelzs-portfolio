import { NextRequest, NextResponse } from 'next/server';
import { Client, Pool, PoolClient } from 'pg';

declare global {
  var __VIB_PG_POOL_CCT: Pool | undefined;
}

async function getDb(): Promise<{ client: PoolClient; release: () => void }> {
  const connectionString = process.env.VIBEZS_DB as string;
  const ssl = { rejectUnauthorized: false } as const;
  if (!global.__VIB_PG_POOL_CCT) {
    global.__VIB_PG_POOL_CCT = new Pool({ connectionString, ssl, max: 10 });
  }
  const client = await global.__VIB_PG_POOL_CCT.connect();
  return { client, release: () => client.release() };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;
  const { client, release } = await getDb();
  try {
    const row = (await client.query(`SELECT metadata FROM cursor_chats WHERE id = $1`, [id])).rows[0];
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const meta = row.metadata || {};
    const enabled = meta.enabled !== false;
    const updated = { ...meta, enabled: !enabled };
    await client.query(`UPDATE cursor_chats SET metadata = $1, updated_at = NOW() WHERE id = $2`, [updated, id]);
    return NextResponse.json({ success: true, enabled: !enabled });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  } finally {
    release();
  }
}


