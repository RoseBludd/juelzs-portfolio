import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import JournalService, { JournalSearchFilters } from '@/services/journal.service';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const journalService = JournalService.getInstance();
    await journalService.initialize();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Parse filters
    const filters: JournalSearchFilters = {};
    if (searchParams.get('category')) filters.category = searchParams.get('category')!;
    if (searchParams.get('projectId')) filters.projectId = searchParams.get('projectId')!;
    if (searchParams.get('tags')) filters.tags = searchParams.get('tags')!.split(',');
    if (searchParams.get('dateFrom')) filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    if (searchParams.get('dateTo')) filters.dateTo = new Date(searchParams.get('dateTo')!);
    if (searchParams.get('hasAISuggestions')) filters.hasAISuggestions = searchParams.get('hasAISuggestions') === 'true';

    switch (action) {
      case 'stats':
        const stats = await journalService.getStats();
        return NextResponse.json({ success: true, stats });
        
      case 'search':
        if (!search) {
          return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }
        const searchResults = await journalService.searchEntries(search, filters);
        return NextResponse.json({ success: true, entries: searchResults });
        
      case 'entry':
        if (!id) {
          return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
        }
        const entry = await journalService.getEntryById(id);
        if (!entry) {
          return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, entry });
        
      default:
        // Get all entries with filters
        const entries = await journalService.getEntries(filters, limit, offset);
        return NextResponse.json({ success: true, entries });
    }
  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json(
      { error: 'Failed to process journal request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const journalService = JournalService.getInstance();
    await journalService.initialize();

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // Create journal entry
    const entry = await journalService.createEntry({
      title: body.title,
      content: body.content,
      originalContent: body.originalContent,
      category: body.category,
      projectId: body.projectId,
      projectName: body.projectName,
      tags: body.tags || [],
      architectureDiagrams: body.architectureDiagrams || [],
      relatedFiles: body.relatedFiles || [],
      isPrivate: body.isPrivate || false,
      metadata: body.metadata || {}
    } as any);

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('Journal creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}

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
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Update journal entry
    const updatedEntry = await journalService.updateEntry(body.id, {
      title: body.title,
      content: body.content,
      originalContent: body.originalContent,
      category: body.category,
      projectId: body.projectId,
      projectName: body.projectName,
      tags: body.tags,
      architectureDiagrams: body.architectureDiagrams,
      relatedFiles: body.relatedFiles,
      isPrivate: body.isPrivate,
      metadata: body.metadata
    });

    if (!updatedEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry: updatedEntry });
  } catch (error) {
    console.error('Journal update error:', error);
    return NextResponse.json(
      { error: 'Failed to update journal entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const journalService = JournalService.getInstance();
    await journalService.initialize();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const deleted = await journalService.deleteEntry(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Journal deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}
