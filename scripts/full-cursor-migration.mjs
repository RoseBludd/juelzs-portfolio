#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function fullCursorMigration() {
  console.log('🔄 Full Cursor Chat Migration - All 134 Chats\n');
  
  let supabaseData = [];
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Step 1: Get ALL cursor chats from Supabase
    console.log('📊 Step 1: Fetching ALL cursor chats from Supabase...');
    
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
      `);
      
      supabaseData = chats.rows;
      console.log(`📦 Fetched ${supabaseData.length} cursor chats for migration`);
      
    } finally {
      await supabaseClient.end();
    }
    
    // Step 2: Batch insert into VIBEZS_DB
    if (supabaseData.length > 0) {
      console.log('\n📊 Step 2: Migrating to VIBEZS_DB...\n');
      
      const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
      await vibezClient.connect();
      
      try {
        let migrated = 0;
        let skipped = 0;
        let failed = 0;
        
        // Process in batches of 10 for better performance and progress tracking
        const batchSize = 10;
        const totalBatches = Math.ceil(supabaseData.length / batchSize);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIndex = batchIndex * batchSize;
          const endIndex = Math.min(startIndex + batchSize, supabaseData.length);
          const batch = supabaseData.slice(startIndex, endIndex);
          
          console.log(`🔄 Processing batch ${batchIndex + 1}/${totalBatches} (chats ${startIndex + 1}-${endIndex})...`);
          
          for (const chat of batch) {
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
                migrated++;
              } else {
                skipped++;
              }
              
            } catch (insertError) {
              failed++;
              console.log(`   ❌ Failed to migrate chat ${chat.id}: ${insertError.message}`);
              
              // If it's a foreign key error, try to create placeholder developer
              if (insertError.message.includes('foreign key')) {
                try {
                  await vibezClient.query(`
                    INSERT INTO developers (id, name, email, status, role, created_at, updated_at)
                    VALUES ($1, 'Unknown Developer', 'unknown@placeholder.com', 'inactive', 'developer', NOW(), NOW())
                    ON CONFLICT (id) DO NOTHING
                  `, [chat.developer_id]);
                  
                  // Retry the chat insertion
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
                    migrated++;
                    failed--;
                    console.log(`   ✅ Successfully migrated after creating placeholder developer`);
                  }
                  
                } catch (retryError) {
                  console.log(`   ❌ Retry also failed: ${retryError.message}`);
                }
              }
            }
          }
          
          // Show progress
          const currentProgress = Math.round(((batchIndex + 1) / totalBatches) * 100);
          console.log(`   📊 Progress: ${currentProgress}% (${migrated} migrated, ${skipped} skipped, ${failed} failed)`);
        }
        
        console.log(`\n✅ Full Migration Summary:`);
        console.log(`   📦 Successfully migrated: ${migrated} cursor chats`);
        console.log(`   ⚠️ Skipped (already exists): ${skipped} cursor chats`);
        console.log(`   ❌ Failed: ${failed} cursor chats`);
        console.log(`   📊 Total processed: ${migrated + skipped + failed}/${supabaseData.length}`);
        
        // Verify final count and analyze by developer
        const finalCount = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
        console.log(`\n📊 Final verification:`);
        console.log(`   Total cursor chats in VIBEZS_DB: ${finalCount.rows[0].count}`);
        
        // Get developer breakdown
        const devBreakdown = await vibezClient.query(`
          SELECT 
            d.name, d.email, d.status,
            COUNT(cc.id) as chat_count,
            COUNT(CASE WHEN cc.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats
          FROM cursor_chats cc
          JOIN developers d ON cc.developer_id = d.id
          GROUP BY d.id, d.name, d.email, d.status
          ORDER BY chat_count DESC
        `);
        
        console.log(`\n👥 Developer breakdown:`);
        devBreakdown.rows.forEach(dev => {
          console.log(`   🧑‍💻 ${dev.name} (${dev.email}) [${dev.status}]:`);
          console.log(`     📊 ${dev.chat_count} total chats (${dev.recent_chats} recent)`);
        });
        
      } finally {
        await vibezClient.end();
      }
    }
    
    console.log('\n🎉 Full Cursor Chat Migration Complete!');
    console.log('🧠 CADIS cursor chat analysis is now fully operational with real data!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

fullCursorMigration();
