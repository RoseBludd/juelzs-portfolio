import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';

declare global {
  var __VIB_PG_POOL_CCD: Pool | undefined;
}

async function getDb(): Promise<{ client: PoolClient; release: () => void }> {
  const connectionString = process.env.VIBEZS_DB as string;
  const ssl = { rejectUnauthorized: false } as const;
  if (!global.__VIB_PG_POOL_CCD) {
    global.__VIB_PG_POOL_CCD = new Pool({ connectionString, ssl, max: 10 });
  }
  const client = await global.__VIB_PG_POOL_CCD.connect();
  return { client, release: () => client.release() };
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;
  const { client, release } = await getDb();
  try {
    await client.query(`DELETE FROM cursor_chats WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  } finally {
    release();
  }
}


