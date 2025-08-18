import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import CADISJournalService from '@/services/cadis-journal.service';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cadisService = CADISJournalService.getInstance();
    await cadisService.initialize();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get CADIS journal entries
    const entries = await cadisService.getCADISEntries(limit, offset);

    return NextResponse.json({ 
      success: true, 
      entries,
      meta: {
        total: entries.length,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('CADIS journal API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CADIS journal entries' },
      { status: 500 }
    );
  }
}
