#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function verifyCursorChatMigration() {
  console.log('🔍 Verifying Cursor Chat Migration Status\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Check VIBEZS_DB first
    console.log('📊 Checking VIBEZS_DB cursor_chats table:');
    console.log('=' .repeat(50));
    
    const vibezPool = new Pool({ 
      connectionString: process.env.VIBEZS_DB,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    const vibezClient = await vibezPool.connect();
    
    try {
      // Check if table exists and has data
      const vibezCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
      console.log(`📦 Cursor chats in VIBEZS_DB: ${vibezCount.rows[0].count}`);
      
      if (parseInt(vibezCount.rows[0].count) === 0) {
        console.log('❌ NO CURSOR CHATS IN VIBEZS_DB - Migration needed!');
        
        // Try to connect to SUPABASE_DB with different approach
        console.log('\n🔄 Attempting migration from SUPABASE_DB...');
        
        try {
          // Use different connection approach for Supabase
          const supabaseUrl = new URL(process.env.SUPABASE_DB);
          const supabasePool = new Pool({
            host: supabaseUrl.hostname,
            port: parseInt(supabaseUrl.port) || 5432,
            database: supabaseUrl.pathname.substring(1),
            user: supabaseUrl.username,
            password: supabaseUrl.password,
            ssl: { rejectUnauthorized: false },
            max: 1,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 15000
          });
          
          const supabaseClient = await supabasePool.connect();
          
          try {
            console.log('✅ Connected to SUPABASE_DB successfully');
            
            // Get cursor chats from Supabase
            const supabaseChats = await supabaseClient.query(`
              SELECT * FROM cursor_chats 
              ORDER BY created_at DESC
            `);
            
            console.log(`📦 Found ${supabaseChats.rows.length} cursor chats in SUPABASE_DB`);
            
            if (supabaseChats.rows.length > 0) {
              console.log('\n🔄 Migrating cursor chats to VIBEZS_DB...');
              
              let migratedCount = 0;
              let errorCount = 0;
              
              for (const chat of supabaseChats.rows) {
                try {
                  await vibezClient.query(`
                    INSERT INTO cursor_chats (
                      id, developer_id, session_id, chat_title, filename, 
                      content, file_size, tags, project_context, metadata,
                      upload_date, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (id) DO NOTHING
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
                  
                  if (migratedCount % 20 === 0) {
                    console.log(`   📦 Migrated ${migratedCount}/${supabaseChats.rows.length} cursor chats...`);
                  }
                } catch (insertError) {
                  errorCount++;
                  if (errorCount <= 3) {
                    console.log(`   ❌ Error migrating chat ${chat.id}: ${insertError.message}`);
                  }
                }
              }
              
              console.log(`\n✅ Migration Results:`);
              console.log(`   📦 Successfully migrated: ${migratedCount} cursor chats`);
              console.log(`   ❌ Errors: ${errorCount}`);
              
              // Verify migration
              const newCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
              console.log(`   📊 Total in VIBEZS_DB after migration: ${newCount.rows[0].count}`);
              
            } else {
              console.log('❌ No cursor chats found in SUPABASE_DB either');
            }
            
          } finally {
            supabaseClient.release();
            await supabasePool.end();
          }
          
        } catch (supabaseError) {
          console.log(`❌ Could not connect to SUPABASE_DB: ${supabaseError.message}`);
          console.log('⚠️  Cursor chat migration not possible at this time');
        }
        
      } else {
        console.log('✅ Cursor chats already exist in VIBEZS_DB');
        
        // Analyze what we have
        const chatAnalysis = await vibezClient.query(`
          SELECT 
            COUNT(DISTINCT developer_id) as developers_with_chats,
            COUNT(*) as total_chats,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats,
            AVG(LENGTH(content)) as avg_content_length
          FROM cursor_chats
        `);
        
        const analysis = chatAnalysis.rows[0];
        console.log(`📊 Current cursor chat data in VIBEZS_DB:`);
        console.log(`   Developers with chats: ${analysis.developers_with_chats}`);
        console.log(`   Total chats: ${analysis.total_chats}`);
        console.log(`   Recent chats (30 days): ${analysis.recent_chats}`);
        console.log(`   Average content length: ${Math.round(analysis.avg_content_length || 0)} chars`);
      }
      
      // Check for our specific developers
      console.log('\n👥 Checking cursor chats for active developers:');
      console.log('=' .repeat(55));
      
      const activeDevelopers = await vibezClient.query(`
        SELECT id, name, email 
        FROM developers 
        WHERE status = 'active' 
        AND (
          name ILIKE '%alfredo%' 
          OR email = 'estopaceadrian@gmail.com'
          OR name ILIKE '%enrique%'
        )
      `);
      
      for (const dev of activeDevelopers.rows) {
        const devChats = await vibezClient.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent
          FROM cursor_chats 
          WHERE developer_id::text = $1::text
        `, [dev.id]);
        
        const chatData = devChats.rows[0];
        console.log(`   🧑‍💻 ${dev.name}: ${chatData.total} total chats (${chatData.recent} recent)`);
        
        if (parseInt(chatData.total) > 0) {
          console.log(`      ✅ Cursor chat analysis READY for ${dev.name}`);
        } else {
          console.log(`      ⚠️  No cursor chats found for ${dev.name}`);
        }
      }
      
    } finally {
      vibezClient.release();
      await vibezPool.end();
    }
    
    console.log('\n🎯 Migration Status Summary:');
    console.log('=' .repeat(40));
    console.log('✅ VIBEZS_DB cursor_chats table: Ready');
    console.log('🔄 Migration status: Will be confirmed after script run');
    console.log('🧠 CADIS integration: Ready to analyze when data is available');
    
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
  }
}

verifyCursorChatMigration();
