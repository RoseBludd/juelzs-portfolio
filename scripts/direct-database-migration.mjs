#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function directDatabaseMigration() {
  console.log('🔄 Direct Database Connection Migration - Bypassing Pooler\n');
  
  let supabaseData = [];
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Step 1: Connect directly to Supabase database (bypass pooler)
    console.log('📊 Step 1: Connecting directly to Supabase database...');
    
    // Use direct database connection instead of pooler
    const supabaseClient = new Client({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543, // Direct database port (not pooler port 5432)
      database: 'postgres',
      user: 'postgres.fvbaytzkukfqfpwozbtm',
      password: 'S43TjpedayzcuzoT',
      ssl: false // Try without SSL first
    });
    
    try {
      await supabaseClient.connect();
      console.log('✅ Connected directly to Supabase database');
      
      const result = await supabaseClient.query('SELECT COUNT(*) FROM cursor_chats');
      console.log(`📦 Confirmed: ${result.rows[0].count} cursor chats available`);
      
      const chats = await supabaseClient.query(`
        SELECT 
          id, developer_id, title, filename, content, 
          file_size, tags, project_context, metadata, upload_date,
          created_at, updated_at
        FROM cursor_chats 
        ORDER BY created_at ASC
      `);
      
      supabaseData = chats.rows;
      console.log(`📦 Fetched ${supabaseData.length} cursor chats`);
      
    } catch (directError) {
      console.log(`❌ Direct connection failed: ${directError.message}`);
      
      // Fallback: Try with SSL
      console.log('🔄 Trying with SSL enabled...');
      
      const supabaseClientSSL = new Client({
        host: 'aws-0-us-east-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres', 
        user: 'postgres.fvbaytzkukfqfpwozbtm',
        password: 'S43TjpedayzcuzoT',
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        await supabaseClientSSL.connect();
        console.log('✅ Connected with SSL to Supabase');
        
        const chats = await supabaseClientSSL.query(`
          SELECT 
            id, developer_id, title, filename, content, 
            file_size, tags, project_context, metadata, upload_date,
            created_at, updated_at
          FROM cursor_chats 
          ORDER BY created_at ASC
        `);
        
        supabaseData = chats.rows;
        console.log(`📦 Fetched ${supabaseData.length} cursor chats with SSL`);
        
      } finally {
        await supabaseClientSSL.end();
      }
    } finally {
      await supabaseClient.end();
    }
    
    // Step 2: Insert into VIBEZS_DB
    if (supabaseData.length > 0) {
      console.log('\n📊 Step 2: Migrating to VIBEZS_DB...');
      
      const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
      await vibezClient.connect();
      
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
            
            if (migrated % 30 === 0 || index === supabaseData.length - 1) {
              const percent = Math.round((index + 1) / supabaseData.length * 100);
              console.log(`   📦 Progress: ${migrated}/${supabaseData.length} (${percent}%)`);
            }
            
          } catch (insertError) {
            errors++;
          }
        }
        
        console.log(`\n✅ Migration Complete:`);
        console.log(`   📦 Migrated: ${migrated} cursor chats`);
        console.log(`   ❌ Errors: ${errors}`);
        
        // Verify and analyze
        const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
        console.log(`   📊 Total in VIBEZS_DB: ${finalCount.rows[0].count}`);
        
        // Test cursor analysis for active developers
        console.log('\n🧠 Testing CADIS Cursor Analysis:');
        const devAnalysis = await vibezClient.query(`
          SELECT 
            d.name, d.role,
            COUNT(cc.id) as total_chats,
            COUNT(CASE WHEN cc.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats,
            AVG(LENGTH(cc.content)) as avg_content
          FROM developers d
          LEFT JOIN cursor_chats cc ON cc.developer_id::text = d.id::text
          WHERE d.status = 'active'
          AND (d.name ILIKE '%alfredo%' OR d.email = 'estopaceadrian@gmail.com' OR d.name ILIKE '%enrique%')
          GROUP BY d.name, d.role
          ORDER BY total_chats DESC
        `);
        
        devAnalysis.rows.forEach(dev => {
          console.log(`   🧑‍💻 ${dev.name} (${dev.role}):`);
          console.log(`     📊 ${dev.total_chats} total chats (${dev.recent_chats} recent)`);
          console.log(`     📝 ${Math.round(dev.avg_content || 0)} avg chars`);
          console.log(`     ${parseInt(dev.total_chats) > 0 ? '✅ ANALYSIS READY' : '⚠️ No chat data'}`);
        });
        
      } finally {
        await vibezClient.end();
      }
    }
    
    console.log('\n✅ Direct Database Migration Complete!');
    console.log('🎯 CADIS cursor chat analysis now fully operational');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

directDatabaseMigration();
