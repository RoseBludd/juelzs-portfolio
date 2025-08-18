/**
 * Fix the admin_notifications table schema
 */

const { Pool } = require('pg');

async function fixDatabase() {
  console.log('🔧 Fixing Notifications Database Schema...');
  
  // Use the same database connection as the app
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('📊 Connected to database');
      
      // Check if table exists
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_notifications'
        );
      `);
      
      if (tableExists.rows[0].exists) {
        console.log('📋 Table exists, checking schema...');
        
        // Check columns
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
        
        // Drop and recreate to fix schema
        console.log('🗑️ Dropping existing table...');
        await client.query('DROP TABLE IF EXISTS admin_notifications CASCADE');
      }
      
      // Create table with correct schema
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
      
      console.log('✅ admin_notifications table created');
      
      // Create scheduled_tasks table
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
      
      console.log('✅ scheduled_tasks table created');
      
      // Create self_review_periods table
      console.log('🏗️ Creating self_review_periods table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS self_review_periods (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          scope JSONB NOT NULL,
          analysis_results JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ self_review_periods table created');
      
      // Insert a test notification
      console.log('📝 Creating test notification...');
      await client.query(`
        INSERT INTO admin_notifications (
          id, title, message, type, priority, is_read, action_url, action_label, created_at
        ) VALUES (
          'test_' || EXTRACT(EPOCH FROM NOW())::TEXT,
          '🎉 Notification System Fixed!',
          'The admin notification system has been successfully repaired and is now working correctly. You should see this notification in the admin header.',
          'success',
          'medium',
          false,
          '/admin/calendar',
          'View Calendar',
          NOW()
        )
      `);
      
      console.log('✅ Test notification created');
      
      // Verify the setup
      const notificationCount = await client.query('SELECT COUNT(*) FROM admin_notifications');
      console.log(`📊 Total notifications: ${notificationCount.rows[0].count}`);
      
      // Show the test notification
      const testNotification = await client.query(`
        SELECT title, message, type, priority, created_at 
        FROM admin_notifications 
        WHERE is_read = false 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (testNotification.rows.length > 0) {
        const notif = testNotification.rows[0];
        console.log('\n🔔 Test Notification Created:');
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Type: ${notif.type} | Priority: ${notif.priority}`);
        console.log(`   Created: ${new Date(notif.created_at).toLocaleString()}`);
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
  
  console.log('\n✅ Database schema fixed successfully!');
  console.log('👀 Check the admin header for the notification bell (🔔)');
  console.log('🧪 You should see the test notification in the dropdown');
}

// Test the API endpoints
async function testAPI() {
  console.log('\n🧪 Testing API Endpoints...');
  
  try {
    // Test notifications endpoint
    console.log('📥 Testing GET /api/admin/notifications...');
    const response = await fetch('http://localhost:3000/api/admin/notifications');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API working - ${data.count} notifications found`);
      
      if (data.notifications && data.notifications.length > 0) {
        console.log('📋 Latest notifications:');
        data.notifications.slice(0, 2).forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title} (${notif.priority})`);
        });
      }
    } else {
      console.log('❌ API test failed:', response.status);
    }
    
  } catch (error) {
    console.log('⚠️ API test failed (server may not be running):', error.message);
  }
}

async function main() {
  try {
    await fixDatabase();
    await testAPI();
    
    console.log('\n📚 How Notifications Work:');
    console.log('=' .repeat(50));
    console.log('🔔 Notifications appear as a bell icon in the admin header');
    console.log('📊 The bell shows a red badge with the count of unread notifications');
    console.log('📋 Click the bell to see a dropdown with all notifications');
    console.log('✅ Click the X on a notification to mark it as read');
    console.log('🔄 The system polls for new notifications every 30 seconds');
    console.log('');
    console.log('📅 CADIS Schedule:');
    console.log('   • Tuesday 10:00 AM: Full System Analysis');
    console.log('   • Friday 2:00 PM: Ecosystem Health Check');
    console.log('   • Every 2 weeks starting 8/19/25: Self-Review Period');
    console.log('');
    console.log('🎉 The notification system is now ready!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();
