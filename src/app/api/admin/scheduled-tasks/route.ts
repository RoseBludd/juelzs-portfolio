import { NextRequest, NextResponse } from 'next/server';
import ScheduledTasksService from '@/services/scheduled-tasks.service';

const scheduledTasksService = ScheduledTasksService.getInstance();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Scheduled Tasks API: Processing due tasks...');
    
    const body = await request.json();
    const { action } = body;

    if (action === 'process_due_tasks') {
      // Process any due tasks
      await scheduledTasksService.processDueTasks();
      
      console.log('✅ Due tasks processed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Due tasks processed successfully'
      });
    }

    if (action === 'create_test_notification') {
      // Create a test notification
      await scheduledTasksService.createNotification({
        title: '🧪 Test Notification',
        message: 'This is a test notification to verify the notification system is working.',
        type: 'info',
        priority: 'low',
        actionUrl: '/admin/calendar',
        actionLabel: 'View Calendar'
      });

      return NextResponse.json({
        success: true,
        message: 'Test notification created'
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
    console.error('❌ Scheduled Tasks API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Scheduled Tasks API: Getting task status...');
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled tasks service is running',
      schedule: {
        'CADIS Full Analysis': 'Tuesdays at 10:00 AM',
        'CADIS Health Check': 'Fridays at 2:00 PM',
        'Biweekly Self Reviews': 'Every 2 weeks starting 8/19/25'
      }
    });
    
  } catch (error) {
    console.error('❌ Scheduled Tasks API GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduled tasks status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
