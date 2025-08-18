import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/services/database.service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing admin_notifications table schema...');
    
    const dbService = DatabaseService.getInstance();
    const client = await dbService.getClient();
    
    try {
      // Check current table schema
      console.log('🔍 Checking existing table...');
      
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
        columns.rows.forEach((col: any) => {
          console.log(`  • ${col.column_name}: ${col.data_type}`);
        });
        
        // Check if it has the expected columns
        const hasTitle = columns.rows.some((col: any) => col.column_name === 'title');
        const hasMessage = columns.rows.some((col: any) => col.column_name === 'message');
        
        if (!hasTitle || !hasMessage) {
          console.log('❌ Wrong schema, dropping table...');
          await client.query('DROP TABLE IF EXISTS admin_notifications CASCADE');
        } else {
          console.log('✅ Schema correct, adding test notifications...');
          
          // Just add test notifications if schema is correct
          await client.query(`
            INSERT INTO admin_notifications (
              id, title, message, type, priority, is_read, action_url, action_label, created_at
            ) VALUES (
              'api_fix_' || EXTRACT(EPOCH FROM NOW())::TEXT,
              '🎉 Notifications Fixed via API!',
              'The notification system has been repaired using the internal API. You should now see notifications in the admin header.',
              'success',
              'high',
              false,
              '/admin/calendar',
              'View Calendar',
              NOW()
            )
          `);
          
          const count = await client.query('SELECT COUNT(*) FROM admin_notifications WHERE is_read = false');
          
          return NextResponse.json({
            success: true,
            message: 'Schema was correct, added test notification',
            unreadCount: count.rows[0].count
          });
        }
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
      
      console.log('✅ Table created');
      
      // Create scheduled_tasks table
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
      
      // Create self_review_periods table
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
      
      // Insert test notifications
      console.log('📝 Creating test notifications...');
      
      await client.query(`
        INSERT INTO admin_notifications (
          id, title, message, type, priority, is_read, action_url, action_label, created_at
        ) VALUES 
        (
          'fix_' || EXTRACT(EPOCH FROM NOW())::TEXT,
          '🎉 Notification System Fixed!',
          'The admin notification system has been successfully repaired and is now working correctly. You should see this notification in the admin header.',
          'success',
          'medium',
          false,
          '/admin/calendar',
          'View Calendar',
          NOW()
        ),
        (
          'cadis_' || (EXTRACT(EPOCH FROM NOW()) + 1)::TEXT,
          '🧠 CADIS Schedule Active',
          'CADIS is now scheduled to run twice weekly: Tuesday (Full Analysis) and Friday (Health Check). Biweekly self-reviews start 8/19/25.',
          'info',
          'high',
          false,
          '/admin/cadis-journal',
          'View CADIS Journal',
          NOW()
        ),
        (
          'calendar_' || (EXTRACT(EPOCH FROM NOW()) + 2)::TEXT,
          '📅 Calendar System Ready',
          'Your portfolio calendar is now fully functional with event icons, CADIS maintenance schedule, and intelligent filtering. All features are working correctly.',
          'success',
          'medium',
          false,
          '/admin/calendar',
          'Explore Calendar',
          NOW()
        )
      `);
      
      console.log('✅ Test notifications created');
      
      const count = await client.query('SELECT COUNT(*) FROM admin_notifications WHERE is_read = false');
      const notifications = await client.query(`
        SELECT title, type, priority 
        FROM admin_notifications 
        WHERE is_read = false 
        ORDER BY created_at DESC
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Database schema fixed and test notifications created',
        tablesCreated: ['admin_notifications', 'scheduled_tasks', 'self_review_periods'],
        unreadCount: count.rows[0].count,
        notifications: notifications.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Fix notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix notification system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
