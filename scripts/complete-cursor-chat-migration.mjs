#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function completeCursorChatMigration() {
  console.log('🔄 Complete Cursor Chat Migration - SUPABASE_DB to VIBEZS_DB\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Connect to VIBEZS_DB
    const vibezPool = new Pool({ 
      connectionString: process.env.VIBEZS_DB,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    const vibezClient = await vibezPool.connect();
    
    try {
      console.log('📊 Step 1: Preparing VIBEZS_DB cursor_chats table...');
      
      // Ensure cursor_chats table exists with proper structure
      await vibezClient.query(`
        CREATE TABLE IF NOT EXISTS cursor_chats (
          id UUID PRIMARY KEY,
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
      
      console.log('✅ cursor_chats table ready in VIBEZS_DB');
      
      // Connect to SUPABASE_DB with SSL handling
      console.log('\n📊 Step 2: Connecting to SUPABASE_DB with SSL...');
      
      // Parse the SUPABASE_DB URL to handle SSL properly
      const supabaseUrl = process.env.SUPABASE_DB;
      
      // Create connection with SSL mode required
      const supabasePool = new Pool({
        connectionString: supabaseUrl,
        ssl: {
          rejectUnauthorized: false,
          // Handle SSL mode required
          mode: 'require'
        },
        max: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
        // Additional connection options for Supabase
        application_name: 'cursor-chat-migration',
        statement_timeout: 60000,
        query_timeout: 60000
      });
      
      const supabaseClient = await supabasePool.connect();
      
      try {
        console.log('✅ Connected to SUPABASE_DB successfully');
        
        // Get all cursor chats from Supabase
        const supabaseChats = await supabaseClient.query(`
          SELECT 
            id, developer_id, title as chat_title, filename, content, 
            file_size, tags, project_context, metadata, upload_date,
            created_at, updated_at
          FROM cursor_chats 
          ORDER BY created_at ASC
        `);
        
        console.log(`📦 Found ${supabaseChats.rows.length} cursor chats in SUPABASE_DB`);
        
        if (supabaseChats.rows.length > 0) {
          console.log('\n🔄 Step 3: Migrating all cursor chats...');
          
          let migratedCount = 0;
          let skippedCount = 0;
          let errorCount = 0;
          
          for (const chat of supabaseChats.rows) {
            try {
              // Check if already exists
              const existing = await vibezClient.query(`
                SELECT id FROM cursor_chats WHERE id = $1
              `, [chat.id]);
              
              if (existing.rows.length === 0) {
                await vibezClient.query(`
                  INSERT INTO cursor_chats (
                    id, developer_id, session_id, chat_title, filename, 
                    content, file_size, tags, project_context, metadata,
                    upload_date, created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                  chat.id,
                  chat.developer_id,
                  null, // session_id not in source
                  chat.chat_title,
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
                
                if (migratedCount % 25 === 0) {
                  console.log(`   📦 Migrated ${migratedCount}/${supabaseChats.rows.length}...`);
                }
              } else {
                skippedCount++;
              }
            } catch (insertError) {
              errorCount++;
              if (errorCount <= 5) {
                console.log(`   ❌ Error migrating chat: ${insertError.message}`);
              }
            }
          }
          
          console.log(`\n✅ Migration Complete:`);
          console.log(`   📦 Migrated: ${migratedCount} cursor chats`);
          console.log(`   ⏭️  Skipped: ${skippedCount} (already existed)`);
          console.log(`   ❌ Errors: ${errorCount}`);
          
          // Final verification
          const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
          console.log(`   📊 Total cursor chats in VIBEZS_DB: ${finalCount.rows[0].count}`);
          
          // Analyze by developer
          console.log('\n👥 Cursor chats by active developer:');
          const developerChats = await vibezClient.query(`
            SELECT 
              d.name,
              d.email,
              COUNT(cc.id) as chat_count,
              COUNT(CASE WHEN cc.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats
            FROM developers d
            LEFT JOIN cursor_chats cc ON cc.developer_id::text = d.id::text
            WHERE d.status = 'active'
            AND (
              d.name ILIKE '%alfredo%' 
              OR d.email = 'estopaceadrian@gmail.com'
              OR d.name ILIKE '%enrique%'
            )
            GROUP BY d.id, d.name, d.email
            ORDER BY chat_count DESC
          `);
          
          developerChats.rows.forEach(dev => {
            console.log(`   🧑‍💻 ${dev.name}: ${dev.chat_count} chats (${dev.recent_chats} recent)`);
          });
          
        } else {
          console.log('❌ No cursor chats found in SUPABASE_DB');
        }
        
      } finally {
        supabaseClient.release();
        await supabasePool.end();
      }
      
    } finally {
      vibezClient.release();
      await vibezPool.end();
    }
    
    console.log('\n✅ Cursor Chat Migration Process Complete!');
    console.log('🎯 CADIS cursor chat analysis now ready for integration testing');
    
  } catch (error) {
    console.error('❌ Error in complete migration:', error);
  }
}

completeCursorChatMigration();
