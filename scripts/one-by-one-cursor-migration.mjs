#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function oneByOneCursorMigration() {
  console.log('🔄 One-by-One Cursor Chat Migration\n');
  
  let supabaseData = [];
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Step 1: Get all cursor chats from Supabase
    console.log('📊 Step 1: Fetching cursor chats from Supabase...');
    
    const supabaseClient = new Client({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.fvbaytzkukfqfpwozbtm',
      password: 'S43TjpedayzcuzoT',
      ssl: false
    });
    
    await supabaseClient.connect();
    
    try {
      const chats = await supabaseClient.query(`
        SELECT 
          id, developer_id, title, filename, content, 
          file_size, tags, project_context, metadata, upload_date,
          created_at, updated_at
        FROM cursor_chats 
        ORDER BY created_at ASC
        LIMIT 5
      `);
      
      supabaseData = chats.rows;
      console.log(`📦 Fetched ${supabaseData.length} cursor chats for testing`);
      
    } finally {
      await supabaseClient.end();
    }
    
    // Step 2: Insert one by one into VIBEZS_DB
    if (supabaseData.length > 0) {
      console.log('\n📊 Step 2: Migrating one by one to VIBEZS_DB...\n');
      
      const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
      await vibezClient.connect();
      
      try {
        let migrated = 0;
        
        for (const [index, chat] of supabaseData.entries()) {
          console.log(`\n🔄 Processing chat ${index + 1}/${supabaseData.length}:`);
          console.log(`   ID: ${chat.id}`);
          console.log(`   Developer ID: ${chat.developer_id}`);
          console.log(`   Title: ${chat.title}`);
          console.log(`   Filename: ${chat.filename}`);
          console.log(`   Content length: ${chat.content ? chat.content.length : 0}`);
          console.log(`   File size: ${chat.file_size}`);
          console.log(`   Tags: ${chat.tags}`);
          console.log(`   Project context: ${chat.project_context}`);
          console.log(`   Upload date: ${chat.upload_date}`);
          console.log(`   Created at: ${chat.created_at}`);
          console.log(`   Updated at: ${chat.updated_at}`);
          
          try {
            const result = await vibezClient.query(`
              INSERT INTO cursor_chats (
                id, developer_id, title, filename, content, 
                file_size, tags, project_context, metadata,
                upload_date, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (id) DO NOTHING
              RETURNING id
            `, [
              chat.id,
              chat.developer_id,
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
            
            if (result.rows.length > 0) {
              console.log(`   ✅ Successfully migrated chat ${chat.id}`);
              migrated++;
            } else {
              console.log(`   ⚠️ Chat ${chat.id} already exists, skipped`);
            }
            
          } catch (insertError) {
            console.log(`   ❌ Failed to migrate chat ${chat.id}:`);
            console.log(`      Error: ${insertError.message}`);
            console.log(`      Code: ${insertError.code}`);
            console.log(`      Detail: ${insertError.detail}`);
            console.log(`      Hint: ${insertError.hint}`);
            
            // Check specific issues
            if (insertError.message.includes('foreign key')) {
              console.log(`      🔍 Checking if developer_id exists...`);
              const devCheck = await vibezClient.query(`
                SELECT id, name FROM developers WHERE id = $1
              `, [chat.developer_id]);
              
              if (devCheck.rows.length > 0) {
                console.log(`         ✅ Developer exists: ${devCheck.rows[0].name}`);
              } else {
                console.log(`         ❌ Developer not found: ${chat.developer_id}`);
                console.log(`         💡 This is likely the issue - creating placeholder developer...`);
                
                try {
                  await vibezClient.query(`
                    INSERT INTO developers (id, name, email, status, role, created_at, updated_at)
                    VALUES ($1, 'Unknown Developer', 'unknown@placeholder.com', 'inactive', 'developer', NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                  `, [chat.developer_id]);
                  
                  console.log(`         ✅ Created placeholder developer`);
                  
                  // Try inserting the chat again
                  const retryResult = await vibezClient.query(`
                    INSERT INTO cursor_chats (
                      id, developer_id, title, filename, content, 
                      file_size, tags, project_context, metadata,
                      upload_date, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (id) DO NOTHING
                    RETURNING id
                  `, [
                    chat.id,
                    chat.developer_id,
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
                  
                  if (retryResult.rows.length > 0) {
                    console.log(`         ✅ Successfully migrated chat after creating developer`);
                    migrated++;
                  }
                  
                } catch (devCreateError) {
                  console.log(`         ❌ Failed to create placeholder developer: ${devCreateError.message}`);
                }
              }
            }
          }
        }
        
        console.log(`\n✅ Migration Summary:`);
        console.log(`   📦 Successfully migrated: ${migrated} cursor chats`);
        console.log(`   ❌ Failed: ${supabaseData.length - migrated}`);
        
        // Verify final count
        const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
        console.log(`   📊 Total cursor chats in VIBEZS_DB: ${finalCount.rows[0].count}`);
        
      } finally {
        await vibezClient.end();
      }
    }
    
    console.log('\n✅ One-by-One Migration Complete!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

oneByOneCursorMigration();
