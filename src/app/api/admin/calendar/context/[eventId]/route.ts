import { NextRequest, NextResponse } from 'next/server';
import CalendarService, { CalendarEvent } from '@/services/calendar.service';

const calendarService = CalendarService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log(`🔍 Calendar Context API: Fetching context for event ${resolvedParams.eventId}...`);
    
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type') as CalendarEvent['type'];
    
    if (!eventType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event type is required'
        },
        { status: 400 }
      );
    }
    
    const context = await calendarService.getEventContext(resolvedParams.eventId, eventType);
    
    if (!context) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event context not found'
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ Retrieved context for ${eventType} event: ${resolvedParams.eventId}`);
    
    return NextResponse.json({
      success: true,
      context
    });
    
  } catch (error) {
    console.error('❌ Calendar Context API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch event context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
