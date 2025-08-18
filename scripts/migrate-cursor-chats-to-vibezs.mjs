#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function migrateCursorChatsToVibezs() {
  console.log('🔄 Migrating Cursor Chats from SUPABASE_DB to VIBEZS_DB\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Connect to both databases
    const supabasePool = new Pool({ 
      connectionString: process.env.SUPABASE_DB,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000
    });
    
    const vibezPool = new Pool({ 
      connectionString: process.env.VIBEZS_DB,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    console.log('📊 Step 1: Connecting to databases...');
    const vibezClient = await vibezPool.connect();
    
    try {
      // First, create the cursor_chats table in VIBEZS_DB if it doesn't exist
      console.log('📋 Step 2: Creating cursor_chats table in VIBEZS_DB...');
      
      await vibezClient.query(`
        CREATE TABLE IF NOT EXISTS cursor_chats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          developer_id UUID REFERENCES developers(id),
          session_id VARCHAR(255),
          chat_title VARCHAR(255),
          filename VARCHAR(255),
          content TEXT,
          file_size INTEGER,
          tags TEXT[],
          project_context VARCHAR(255),
          metadata JSONB,
          upload_date TIMESTAMP WITHOUT TIME ZONE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ Cursor chats table created/verified in VIBEZS_DB');
      
      // Check current count in VIBEZS_DB
      const currentCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
      console.log(`📊 Current cursor chats in VIBEZS_DB: ${currentCount.rows[0].count}`);
      
      // Now try to connect to Supabase and migrate data
      console.log('\n📊 Step 3: Connecting to SUPABASE_DB to get cursor chats...');
      
      let supabaseClient;
      try {
        supabaseClient = await supabasePool.connect();
        
        // Get cursor chats from Supabase
        const supabaseCursorChats = await supabaseClient.query(`
          SELECT * FROM cursor_chats 
          ORDER BY created_at DESC
        `);
        
        console.log(`📦 Found ${supabaseCursorChats.rows.length} cursor chats in SUPABASE_DB`);
        
        if (supabaseCursorChats.rows.length > 0) {
          console.log('\n🔄 Step 4: Migrating cursor chats to VIBEZS_DB...');
          
          let migratedCount = 0;
          let skippedCount = 0;
          
          for (const chat of supabaseCursorChats.rows) {
            try {
              // Check if this chat already exists in VIBEZS_DB
              const existingChat = await vibezClient.query(`
                SELECT id FROM cursor_chats 
                WHERE id = $1 OR (developer_id = $2 AND chat_title = $3 AND created_at = $4)
              `, [chat.id, chat.developer_id, chat.title, chat.created_at]);
              
              if (existingChat.rows.length === 0) {
                // Insert the chat into VIBEZS_DB
                await vibezClient.query(`
                  INSERT INTO cursor_chats (
                    id, developer_id, session_id, chat_title, filename, 
                    content, file_size, tags, project_context, metadata,
                    upload_date, created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                  chat.id,
                  chat.developer_id,
                  chat.session_id,
                  chat.title,
                  chat.filename,
                  chat.content,
                  chat.file_size,
                  chat.tags,
                  chat.project_context,
                  chat.metadata,
                  chat.upload_date,
                  chat.created_at,
                  chat.updated_at
                ]);
                
                migratedCount++;
                
                if (migratedCount % 10 === 0) {
                  console.log(`   📦 Migrated ${migratedCount} cursor chats...`);
                }
              } else {
                skippedCount++;
              }
            } catch (error) {
              console.log(`   ❌ Error migrating chat ${chat.id}: ${error.message}`);
              skippedCount++;
            }
          }
          
          console.log(`\n✅ Migration Complete:`);
          console.log(`   📦 Migrated: ${migratedCount} cursor chats`);
          console.log(`   ⏭️  Skipped: ${skippedCount} (already exist or errors)`);
          
          // Verify migration
          const newCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
          console.log(`   📊 Total in VIBEZS_DB: ${newCount.rows[0].count}`);
          
          // Analyze migrated data
          console.log('\n📊 Step 5: Analyzing migrated cursor chats...');
          
          const developerChatCounts = await vibezClient.query(`
            SELECT 
              d.name,
              d.email,
              COUNT(cc.id) as chat_count,
              COUNT(CASE WHEN cc.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats
            FROM developers d
            LEFT JOIN cursor_chats cc ON cc.developer_id = d.id
            WHERE d.status = 'active'
            GROUP BY d.id, d.name, d.email
            ORDER BY chat_count DESC
          `);
          
          console.log('👥 Cursor Chat Analysis by Developer:');
          developerChatCounts.rows.forEach(dev => {
            console.log(`   🧑‍💻 ${dev.name}: ${dev.chat_count} chats (${dev.recent_chats} recent)`);
          });
          
        } else {
          console.log('❌ No cursor chats found in SUPABASE_DB');
        }
        
      } catch (supabaseError) {
        console.log(`⚠️  Could not connect to SUPABASE_DB: ${supabaseError.message}`);
        console.log('🔄 Creating empty cursor_chats table structure for future use...');
      } finally {
        if (supabaseClient) {
          supabaseClient.release();
        }
      }
      
    } finally {
      vibezClient.release();
      await vibezPool.end();
      await supabasePool.end();
    }
    
    console.log('\n✅ Cursor Chat Migration Process Complete!');
    console.log('🎯 VIBEZS_DB now ready for cursor chat analysis integration');
    
  } catch (error) {
    console.error('❌ Error in migration:', error);
  }
}

migrateCursorChatsToVibezs();
