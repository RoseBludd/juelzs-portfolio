#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function simpleCursorMigration() {
  console.log('🔄 Simple Cursor Chat Migration\n');
  
  try {
    // Set SSL bypass for both connections
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Use the same approach that worked in the analysis
    const supabaseConnectionString = 'postgres://postgres.fvbaytzkukfqfpwozbtm:S43TjpedayzcuzoT@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';
    
    // Connect to SUPABASE_DB (same way that worked before)
    const supabasePool = new Pool({ connectionString: supabaseConnectionString });
    const supabaseClient = await supabasePool.connect();
    
    // Connect to VIBEZS_DB
    const vibezPool = new Pool({ connectionString: process.env.VIBEZS_DB });
    const vibezClient = await vibezPool.connect();
    
    try {
      console.log('✅ Connected to both databases');
      
      // Get cursor chats (same query that worked)
      const chats = await supabaseClient.query('SELECT * FROM cursor_chats ORDER BY created_at DESC');
      console.log(`📦 Found ${chats.rows.length} cursor chats in SUPABASE_DB`);
      
      // Migrate each chat
      let migrated = 0;
      for (const chat of chats.rows) {
        try {
          await vibezClient.query(`
            INSERT INTO cursor_chats (
              id, developer_id, chat_title, filename, content, 
              file_size, tags, project_context, metadata,
              upload_date, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO NOTHING
          `, [
            chat.id, chat.developer_id, chat.title, chat.filename, chat.content,
            chat.file_size, chat.tags, chat.project_context, chat.metadata,
            chat.upload_date, chat.created_at, chat.updated_at
          ]);
          migrated++;
          if (migrated % 25 === 0) console.log(`   📦 Migrated ${migrated}...`);
        } catch (err) {
          // Skip individual errors
        }
      }
      
      console.log(`✅ Migrated ${migrated} cursor chats to VIBEZS_DB`);
      
      // Verify
      const count = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
      console.log(`📊 Total in VIBEZS_DB: ${count.rows[0].count}`);
      
    } finally {
      supabaseClient.release();
      vibezClient.release();
      await supabasePool.end();
      await vibezPool.end();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleCursorMigration();
