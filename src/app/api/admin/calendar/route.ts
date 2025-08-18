import { NextRequest, NextResponse } from 'next/server';
import CalendarService, { CalendarFilters } from '@/services/calendar.service';

const calendarService = CalendarService.getInstance();

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Calendar API: Fetching calendar events...');
    
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: CalendarFilters = {};
    
    // Event types filter
    const types = searchParams.get('types');
    if (types) {
      filters.types = types.split(',') as CalendarFilters['types'];
    }
    
    // Categories filter
    const categories = searchParams.get('categories');
    if (categories) {
      filters.categories = categories.split(',');
    }
    
    // Priorities filter  
    const priorities = searchParams.get('priorities');
    if (priorities) {
      filters.priorities = priorities.split(',') as CalendarFilters['priorities'];
    }
    
    // Date range filter
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }
    
    // Project IDs filter
    const projectIds = searchParams.get('projectIds');
    if (projectIds) {
      filters.projectIds = projectIds.split(',');
    }
    
    // Tags filter
    const tags = searchParams.get('tags');
    if (tags) {
      filters.tags = tags.split(',');
    }
    
    // Boolean filters
    const showCompleted = searchParams.get('showCompleted');
    if (showCompleted !== null) {
      filters.showCompleted = showCompleted === 'true';
    }
    
    const showPrivate = searchParams.get('showPrivate');
    if (showPrivate !== null) {
      filters.showPrivate = showPrivate === 'true';
    }
    
    // Fetch events
    const events = await calendarService.getCalendarEvents(filters);
    
    console.log(`✅ Retrieved ${events.length} calendar events`);
    
    return NextResponse.json({
      success: true,
      events,
      count: events.length
    });
    
  } catch (error) {
    console.error('❌ Calendar API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calendar events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📅 Calendar API: Creating calendar event...');
    
    const body = await request.json();
    const { action } = body;
    
    if (action === 'create_self_review') {
      const { title, startDate, endDate, type, scope } = body;
      
      const review = await calendarService.createSelfReviewPeriod(
        title,
        new Date(startDate),
        new Date(endDate),
        type,
        scope
      );
      
      console.log(`✅ Created self-review period: ${review.id}`);
      
      return NextResponse.json({
        success: true,
        review
      });
    }
    
    if (action === 'generate_review_analysis') {
      const { reviewId } = body;
      
      // Start analysis in background
      calendarService.generateSelfReviewAnalysis(reviewId).catch(error => {
        console.error('Background analysis failed:', error);
      });
      
      console.log(`🔄 Started analysis generation for review: ${reviewId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Analysis generation started'
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action'
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('❌ Calendar API POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process calendar request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
