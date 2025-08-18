import { NextRequest, NextResponse } from 'next/server';
import CalendarService from '@/services/calendar.service';

const calendarService = CalendarService.getInstance();

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Calendar Stats API: Fetching statistics...');
    
    const stats = await calendarService.getCalendarStats();
    
    console.log('✅ Retrieved calendar statistics');
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Calendar Stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calendar statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
