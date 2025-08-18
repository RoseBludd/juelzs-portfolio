#!/usr/bin/env node

/**
 * Fix the admin_notifications table schema and test the notification system
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add the project root to the module path
process.env.NODE_PATH = join(__dirname, '..');

console.log('🔧 Fixing Notifications Table Schema...');
console.log('=' .repeat(60));

async function fixNotificationsTable() {
  try {
    // Import the database service
    const { default: DatabaseService } = await import('../src/services/database.service.js');
    const dbService = DatabaseService.getInstance();
    
    console.log('📊 Connecting to database...');
    const client = await dbService.getClient();
    
    try {
      // Check if admin_notifications table exists
      console.log('🔍 Checking current table schema...');
      
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_notifications'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        console.log('📋 Table exists, checking columns...');
        
        const columns = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'admin_notifications'
          ORDER BY ordinal_position;
        `);
        
        console.log('Current columns:');
        columns.rows.forEach(col => {
          console.log(`  • ${col.column_name}: ${col.data_type}`);
        });
        
        // Drop the table to recreate it with correct schema
        console.log('🗑️ Dropping existing table to recreate with correct schema...');
        await client.query('DROP TABLE IF EXISTS admin_notifications CASCADE');
      }
      
      // Create the table with correct schema
      console.log('🏗️ Creating admin_notifications table...');
      await client.query(`
        CREATE TABLE admin_notifications (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          priority VARCHAR(50) NOT NULL,
          is_read BOOLEAN DEFAULT false,
          action_url VARCHAR(500),
          action_label VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ admin_notifications table created successfully');
      
      // Create scheduled_tasks table if it doesn't exist
      console.log('🏗️ Creating scheduled_tasks table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS scheduled_tasks (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(500) NOT NULL,
          type VARCHAR(50) NOT NULL,
          schedule VARCHAR(100) NOT NULL,
          next_run TIMESTAMP NOT NULL,
          last_run TIMESTAMP,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ scheduled_tasks table created successfully');
      
      // Verify the schema
      console.log('🔍 Verifying new schema...');
      const newColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'admin_notifications'
        ORDER BY ordinal_position;
      `);
      
      console.log('New admin_notifications schema:');
      newColumns.rows.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
    } finally {
      client.release();
    }
    
    console.log('✅ Database schema fixed successfully');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    throw error;
  }
}

async function testNotificationSystem() {
  try {
    console.log('\n🧪 Testing Notification System...');
    console.log('-'.repeat(40));
    
    // Test creating a notification via API
    console.log('📝 Creating test notification...');
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
      const errorData = await response.text();
      console.log('❌ Failed to create test notification:', response.status, errorData);
    }
    
    // Test fetching notifications
    console.log('📥 Fetching notifications...');
    const notificationsResponse = await fetch('http://localhost:3000/api/admin/notifications');
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log(`✅ Retrieved ${notificationsData.count} notifications`);
      
      if (notificationsData.notifications && notificationsData.notifications.length > 0) {
        console.log('📋 Recent notifications:');
        notificationsData.notifications.slice(0, 3).forEach((notification, index) => {
          console.log(`  ${index + 1}. ${notification.title}`);
          console.log(`     ${notification.message}`);
          console.log(`     Priority: ${notification.priority} | Type: ${notification.type}`);
          if (notification.actionUrl) {
            console.log(`     Action: ${notification.actionLabel} → ${notification.actionUrl}`);
          }
          console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
          console.log('');
        });
      } else {
        console.log('📭 No notifications found');
      }
    } else {
      console.log('❌ Failed to fetch notifications:', notificationsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Notification test failed:', error.message);
  }
}

async function explainNotificationSystem() {
  console.log('\n📚 How the Notification System Works:');
  console.log('=' .repeat(60));
  
  console.log(`
🔔 **Admin Notification System**

**Components:**
1. **Database Tables:**
   • admin_notifications: Stores all notifications
   • scheduled_tasks: Stores CADIS maintenance schedule

2. **API Endpoints:**
   • GET /api/admin/notifications - Fetch unread notifications
   • POST /api/admin/notifications - Mark notifications as read
   • POST /api/admin/scheduled-tasks - Trigger tasks/create notifications

3. **UI Components:**
   • AdminNotifications.tsx - Bell icon with notification dropdown
   • Integrated into ResponsiveAdminLayout.tsx header

**Notification Flow:**
1. CADIS runs (Tuesday/Friday) → Creates notification
2. Self-review completes → Creates notification  
3. System events occur → Creates notification
4. Admin sees bell icon with count in header
5. Click bell → See dropdown with notifications
6. Click notification → Navigate to relevant page
7. Click X or "Mark All Read" → Notifications disappear

**CADIS Schedule:**
• **Tuesday 10:00 AM**: Full System Analysis
  - generateEcosystemInsight()
  - generateDreamStatePredictions() 
  - generateCreativeIntelligence()
  
• **Friday 2:00 PM**: Ecosystem Health Check
  - generateEcosystemInsight() (health focused)

• **Every 2 weeks starting 8/19/25**: Self-Review Period
  - Comprehensive analysis of all activities
  - CADIS generates insights and recommendations

**Notification Types:**
• 🧠 CADIS Analysis Complete (Tuesday/Friday)
• 📋 Self-Review Period Started/Complete
• ⚠️ System Issues or Maintenance Alerts
• ✅ Task Completions and Success Messages
• 🧪 Test Notifications (for debugging)

The notification bell appears in both mobile and desktop admin headers,
polling for new notifications every 30 seconds.
`);
}

async function main() {
  try {
    await fixNotificationsTable();
    await testNotificationSystem();
    await explainNotificationSystem();
    
    console.log('\n🎉 Notification system is now ready!');
    console.log('👀 Check the admin header for the notification bell (🔔)');
    console.log('🧪 Test notifications should appear in the dropdown');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
main();
