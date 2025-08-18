#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function sequentialCursorMigration() {
  console.log('🔄 Sequential Cursor Chat Migration\n');
  
  let supabaseData = [];
  
  try {
    // Set SSL bypass
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Step 1: Get data from SUPABASE_DB
    console.log('📊 Step 1: Fetching data from SUPABASE_DB...');
    const supabaseConnectionString = 'postgres://postgres.fvbaytzkukfqfpwozbtm:S43TjpedayzcuzoT@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';
    
    const supabasePool = new Pool({ 
      connectionString: supabaseConnectionString,
      max: 1
    });
    
    const supabaseClient = await supabasePool.connect();
    
    try {
      const chats = await supabaseClient.query('SELECT * FROM cursor_chats ORDER BY created_at ASC');
      supabaseData = chats.rows;
      console.log(`✅ Fetched ${supabaseData.length} cursor chats from SUPABASE_DB`);
    } finally {
      supabaseClient.release();
      await supabasePool.end();
    }
    
    // Step 2: Insert into VIBEZS_DB
    if (supabaseData.length > 0) {
      console.log('\n📊 Step 2: Inserting into VIBEZS_DB...');
      
      const vibezPool = new Pool({ 
        connectionString: process.env.VIBEZS_DB,
        max: 1
      });
      
      const vibezClient = await vibezPool.connect();
      
      try {
        let migrated = 0;
        let errors = 0;
        
        for (const [index, chat] of supabaseData.entries()) {
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
            
            // Show progress every 20 items
            if (migrated % 20 === 0 || index === supabaseData.length - 1) {
              const percent = Math.round((index + 1) / supabaseData.length * 100);
              console.log(`   📦 Progress: ${migrated} migrated (${percent}%)`);
            }
            
          } catch (err) {
            errors++;
          }
        }
        
        console.log(`\n✅ Migration Complete:`);
        console.log(`   📦 Migrated: ${migrated} cursor chats`);
        console.log(`   ❌ Errors: ${errors}`);
        
        // Verify final count
        const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
        console.log(`   📊 Total in VIBEZS_DB: ${finalCount.rows[0].count}`);
        
        // Check our active developers
        console.log('\n👥 Cursor chats for active developers:');
        const devChats = await vibezClient.query(`
          SELECT 
            d.name,
            COUNT(cc.id) as chat_count
          FROM developers d
          LEFT JOIN cursor_chats cc ON cc.developer_id::text = d.id::text
          WHERE d.status = 'active'
          AND (d.name ILIKE '%alfredo%' OR d.email = 'estopaceadrian@gmail.com' OR d.name ILIKE '%enrique%')
          GROUP BY d.name
          ORDER BY chat_count DESC
        `);
        
        devChats.rows.forEach(dev => {
          console.log(`   🧑‍💻 ${dev.name}: ${dev.chat_count} chats`);
        });
        
      } finally {
        vibezClient.release();
        await vibezPool.end();
      }
    }
    
    console.log('\n✅ Sequential Migration Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sequentialCursorMigration();
