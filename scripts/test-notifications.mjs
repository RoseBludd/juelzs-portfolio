#!/usr/bin/env node

/**
 * Test the notification system
 */

console.log('🔔 Testing Notification System...');

async function testNotifications() {
  try {
    // Test creating a notification
    console.log('Creating test notification...');
    const response = await fetch('http://localhost:3000/api/admin/scheduled-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create_test_notification'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test notification created:', data.message);
    } else {
      console.log('❌ Failed to create test notification:', response.status);
    }

    // Test getting notifications
    console.log('Fetching notifications...');
    const notificationsResponse = await fetch('http://localhost:3000/api/admin/notifications');
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log(`✅ Retrieved ${notificationsData.count} notifications`);
      
      if (notificationsData.notifications.length > 0) {
        console.log('Recent notifications:');
        notificationsData.notifications.slice(0, 3).forEach(notification => {
          console.log(`  • ${notification.title}: ${notification.message}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch notifications:', notificationsResponse.status);
    }

    console.log('\n📅 CADIS Schedule:');
    console.log('  • Tuesday 10:00 AM: Full System Analysis (Ecosystem + DreamState + Creative Intelligence)');
    console.log('  • Friday 2:00 PM: Ecosystem Health Check');
    console.log('  • Every 2 weeks starting 8/19/25: Self-Review Period');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotifications();
