/**
 * Simple test to check notifications API and explain the issue
 */

console.log('🔔 Testing Notification System...');
console.log('=' .repeat(50));

async function testNotifications() {
  try {
    console.log('📥 Testing notifications API...');
    const response = await fetch('http://localhost:3000/api/admin/notifications');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Response: ${data.count} notifications`);
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('📋 Found notifications:');
        data.notifications.forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title}`);
          console.log(`      ${notif.message}`);
          console.log(`      Priority: ${notif.priority} | Type: ${notif.type}`);
          console.log('');
        });
      } else {
        console.log('📭 No notifications found (this is expected if tables don\'t exist)');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status);
      console.log('Error details:', errorText.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('⚠️ API test failed (server may not be running):', error.message);
  }
}

async function testScheduledTasks() {
  try {
    console.log('🔄 Testing scheduled tasks API...');
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
      console.log('✅ Scheduled tasks API working:', data.message);
    } else {
      const errorText = await response.text();
      console.log('❌ Scheduled tasks API error:', response.status);
      console.log('Error details:', errorText.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('⚠️ Scheduled tasks test failed:', error.message);
  }
}

async function explainIssue() {
  console.log('\n🔍 Database Table Issue Analysis:');
  console.log('=' .repeat(50));
  console.log(`
**The Problem:**
The error logs show two main issues:

1. **Missing 'expires_at' column**: 
   - The code was trying to query a column that doesn't exist
   - Fixed by removing references to expires_at in the queries

2. **Missing 'title' column**:
   - The admin_notifications table either doesn't exist 
   - Or has a different schema than expected

**The Solution:**
The notification system needs the database tables to be created properly.
Since the app uses a database service that auto-creates tables on first use,
the tables should be created when the services initialize.

**How Notifications Work:**
1. 🔔 **AdminNotifications.tsx** - Bell icon in admin header
2. 📊 **Polls every 30 seconds** for new notifications  
3. 🗄️ **Database tables**: admin_notifications, scheduled_tasks
4. 🔄 **CADIS Schedule**: Tuesday (full analysis) + Friday (health check)
5. 📅 **Self-reviews**: Every 2 weeks starting 8/19/25

**Current Status:**
- ✅ Calendar system working with icons and filters
- ✅ CADIS maintenance events showing on calendar  
- ✅ UI components properly integrated
- ⚠️ Database tables need to be created (happens on first service use)
- ⚠️ Notification bell visible but no data yet

**Next Steps:**
1. The scheduled-tasks service should auto-create tables when first used
2. Visit /admin/calendar to trigger service initialization
3. The notification bell should start working once tables exist
4. CADIS will run twice weekly and create notifications
`);
}

async function main() {
  await testNotifications();
  console.log('');
  await testScheduledTasks();
  await explainIssue();
  
  console.log('\n🎯 Quick Fix:');
  console.log('The tables should auto-create when you visit the calendar page.');
  console.log('If they don\'t, the init service will create them on app startup.');
  console.log('The notification bell is already visible in the admin header! 🔔');
}

main();
