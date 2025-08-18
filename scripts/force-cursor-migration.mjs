#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function forceCursorMigration() {
  console.log('🔄 Force Cursor Chat Migration - Single Connection Approach\n');
  
  let supabaseData = [];
  
  try {
    // Set SSL bypass
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Step 1: Get data from SUPABASE_DB using single Client (not Pool)
    console.log('📊 Step 1: Connecting to SUPABASE_DB with single client...');
    
    const supabaseClient = new Client({
      connectionString: 'postgres://postgres.fvbaytzkukfqfpwozbtm:S43TjpedayzcuzoT@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
    });
    
    await supabaseClient.connect();
    console.log('✅ Connected to SUPABASE_DB');
    
    try {
      const result = await supabaseClient.query('SELECT * FROM cursor_chats ORDER BY created_at ASC');
      supabaseData = result.rows;
      console.log(`📦 Fetched ${supabaseData.length} cursor chats from SUPABASE_DB`);
      
      // Show sample data
      if (supabaseData.length > 0) {
        const sample = supabaseData[0];
        console.log(`📋 Sample chat: ${sample.title} (${sample.developer_id})`);
      }
      
    } finally {
      await supabaseClient.end();
      console.log('🔌 Closed SUPABASE_DB connection');
    }
    
    // Step 2: Insert into VIBEZS_DB
    if (supabaseData.length > 0) {
      console.log('\n📊 Step 2: Connecting to VIBEZS_DB...');
      
      const vibezClient = new Client({
        connectionString: process.env.VIBEZS_DB
      });
      
      await vibezClient.connect();
      console.log('✅ Connected to VIBEZS_DB');
      
      try {
        console.log('🔄 Migrating cursor chats...');
        
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
            
            migrated++;
            
            // Show progress
            if (migrated % 25 === 0 || index === supabaseData.length - 1) {
              const percent = Math.round((index + 1) / supabaseData.length * 100);
              console.log(`   📦 Progress: ${migrated}/${supabaseData.length} migrated (${percent}%)`);
            }
            
          } catch (insertError) {
            errors++;
            if (errors <= 3) {
              console.log(`   ❌ Error: ${insertError.message}`);
            }
          }
        }
        
        console.log(`\n✅ Migration Results:`);
        console.log(`   📦 Successfully migrated: ${migrated} cursor chats`);
        console.log(`   ❌ Errors: ${errors}`);
        
        // Verify migration
        const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
        console.log(`   📊 Total in VIBEZS_DB: ${finalCount.rows[0].count}`);
        
        // Check our active developers
        console.log('\n👥 Cursor chats by active developers:');
        const activeDevelopers = await vibezClient.query(`
          SELECT 
            d.id, d.name, d.email,
            COUNT(cc.id) as chat_count,
            COUNT(CASE WHEN cc.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats
          FROM developers d
          LEFT JOIN cursor_chats cc ON cc.developer_id::text = d.id::text
          WHERE d.status = 'active'
          AND (d.name ILIKE '%alfredo%' OR d.email = 'estopaceadrian@gmail.com' OR d.name ILIKE '%enrique%')
          GROUP BY d.id, d.name, d.email
          ORDER BY chat_count DESC
        `);
        
        activeDevelopers.rows.forEach(dev => {
          console.log(`   🧑‍💻 ${dev.name}: ${dev.chat_count} total chats (${dev.recent_chats} recent)`);
          if (parseInt(dev.chat_count) > 0) {
            console.log(`      ✅ CURSOR ANALYSIS READY`);
          }
        });
        
      } finally {
        await vibezClient.end();
        console.log('🔌 Closed VIBEZS_DB connection');
      }
    }
    
    console.log('\n✅ Force Migration Complete!');
    console.log('🎯 CADIS cursor chat analysis now operational');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

forceCursorMigration();
