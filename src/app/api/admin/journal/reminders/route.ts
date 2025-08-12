import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import JournalService from '@/services/journal.service';

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
    const status = searchParams.get('status') || 'all'; // all, pending, completed, overdue
    const limit = parseInt(searchParams.get('limit') || '50');

    const reminders = await journalService.getReminders(status, limit);

    return NextResponse.json({ success: true, reminders });
  } catch (error) {
    console.error('Reminders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
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
    const { 
      title, 
      description, 
      dueDate, 
      priority = 'medium',
      category = 'general',
      relatedEntryId,
      nextStepIndex 
    } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    const reminder = await journalService.createReminder({
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      category,
      relatedEntryId,
      nextStepIndex
    });

    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (error) {
    console.error('Create reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
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
    const { id, status, completedAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    const updatedReminder = await journalService.updateReminderStatus(id, {
      status,
      completedAt: completedAt ? new Date(completedAt) : undefined
    });

    if (!updatedReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, reminder: updatedReminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}
