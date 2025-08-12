import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import JournalService from '@/services/journal.service';

export async function PUT(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const journalService = JournalService.getInstance();
    await journalService.initialize();

    const body = await request.json();
    const { suggestionId, action } = body;
    
    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      );
    }

    if (action === 'implement') {
      const success = await journalService.markSuggestionImplemented(suggestionId);
      
      if (!success) {
        return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Suggestion marked as implemented' });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "implement"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Journal suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    );
  }
}
