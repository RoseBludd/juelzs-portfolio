import { NextRequest, NextResponse } from 'next/server';
import ScheduledTasksService from '@/services/scheduled-tasks.service';

const scheduledTasksService = ScheduledTasksService.getInstance();

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Notifications API: Fetching unread notifications...');
    
    const notifications = await scheduledTasksService.getUnreadNotifications();
    
    console.log(`✅ Retrieved ${notifications.length} unread notifications`);
    
    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length
    });
    
  } catch (error) {
    console.error('❌ Notifications API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Notifications API: Marking notification as read...');
    
    const body = await request.json();
    const { notificationId } = body;
    
    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification ID is required'
        },
        { status: 400 }
      );
    }
    
    await scheduledTasksService.markNotificationRead(notificationId);
    
    console.log(`✅ Marked notification ${notificationId} as read`);
    
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('❌ Notifications API POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
