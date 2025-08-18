#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function migrateCursorChatsDirect() {
  console.log('🔄 Direct Cursor Chat Migration with SSL Required\n');
  
  try {
    // Connect to VIBEZS_DB
    const vibezPool = new Pool({ 
      connectionString: process.env.VIBEZS_DB,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    // Connect to SUPABASE_DB with proper SSL handling
    const supabaseConnectionString = 'postgres://postgres.fvbaytzkukfqfpwozbtm:S43TjpedayzcuzoT@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';
    
    const supabasePool = new Pool({
      connectionString: supabaseConnectionString,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000
    });
    
    console.log('📊 Connecting to both databases...');
    const vibezClient = await vibezPool.connect();
    const supabaseClient = await supabasePool.connect();
    
    try {
      console.log('✅ Connected to both databases successfully');
      
      // Get cursor chats from Supabase
      console.log('\n📦 Fetching cursor chats from SUPABASE_DB...');
      const supabaseChats = await supabaseClient.query(`
        SELECT 
          id, developer_id, title, filename, content, 
          file_size, tags, project_context, metadata, upload_date,
          created_at, updated_at
        FROM cursor_chats 
        ORDER BY created_at ASC
      `);
      
      console.log(`📊 Found ${supabaseChats.rows.length} cursor chats in SUPABASE_DB`);
      
      if (supabaseChats.rows.length > 0) {
        console.log('\n🔄 Migrating cursor chats to VIBEZS_DB...');
        
        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const [index, chat] of supabaseChats.rows.entries()) {
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
                null, // session_id
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
              
              if (migratedCount % 20 === 0 || index === supabaseChats.rows.length - 1) {
                console.log(`   📦 Migrated ${migratedCount}/${supabaseChats.rows.length} cursor chats...`);
              }
            } else {
              skippedCount++;
            }
          } catch (insertError) {
            errorCount++;
            if (errorCount <= 3) {
              console.log(`   ❌ Error migrating chat ${chat.id}: ${insertError.message}`);
            }
          }
        }
        
        console.log(`\n✅ Migration Results:`);
        console.log(`   📦 Successfully migrated: ${migratedCount}`);
        console.log(`   ⏭️  Skipped (already existed): ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        
        // Verify final count
        const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
        console.log(`   📊 Total cursor chats in VIBEZS_DB: ${finalCount.rows[0].count}`);
        
        // Analyze by our active developers
        console.log('\n👥 Cursor chat analysis by active developer:');
        console.log('=' .repeat(55));
        
        const activeDevelopers = await vibezClient.query(`
          SELECT id, name, email, role
          FROM developers 
          WHERE status = 'active' 
          AND (
            name ILIKE '%alfredo%' 
            OR email = 'estopaceadrian@gmail.com'
            OR name ILIKE '%enrique%'
          )
          ORDER BY name
        `);
        
        for (const dev of activeDevelopers.rows) {
          const devChats = await vibezClient.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent,
              AVG(LENGTH(content)) as avg_content_length,
              COUNT(CASE WHEN content ILIKE '%error%' OR content ILIKE '%bug%' THEN 1 END) as problem_solving,
              COUNT(CASE WHEN content ILIKE '%how to%' OR content ILIKE '%learn%' THEN 1 END) as learning_questions
            FROM cursor_chats 
            WHERE developer_id::text = $1::text
          `, [dev.id]);
          
          const chatData = devChats.rows[0];
          console.log(`\n🧑‍💻 ${dev.name} (${dev.role}):`);
          console.log(`   📊 Total Chats: ${chatData.total}`);
          console.log(`   📅 Recent (30 days): ${chatData.recent}`);
          console.log(`   📝 Avg Content: ${Math.round(chatData.avg_content_length || 0)} chars`);
          console.log(`   🔧 Problem Solving: ${chatData.problem_solving} chats`);
          console.log(`   📚 Learning Questions: ${chatData.learning_questions} chats`);
          
          if (parseInt(chatData.total) > 0) {
            console.log(`   ✅ CURSOR ANALYSIS READY for ${dev.name}`);
          } else {
            console.log(`   ⚠️  No cursor chats for ${dev.name}`);
          }
        }
        
      } else {
        console.log('❌ No cursor chats found in SUPABASE_DB');
      }
      
    } finally {
      supabaseClient.release();
      vibezClient.release();
      await supabasePool.end();
      await vibezPool.end();
    }
    
    console.log('\n✅ Direct Cursor Chat Migration Complete!');
    console.log('🎯 CADIS cursor chat analysis now fully operational');
    
  } catch (error) {
    console.error('❌ Error in direct migration:', error);
  }
}

migrateCursorChatsDirect();
