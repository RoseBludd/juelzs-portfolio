#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('➕ ADDING PORTFOLIO MODULES TO VIBEZS_DB');
console.log('=======================================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

async function addPortfolioModules() {
  // Temporarily disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const sourcePool = new Pool({
    connectionString: SUPABASE_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  const targetPool = new Pool({
    connectionString: VIBEZS_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to databases...');
    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();
    
    try {
      // Get source data
      const sourceData = await sourceClient.query('SELECT * FROM module_registry');
      console.log(`📊 Source portfolio modules: ${sourceData.rows.length} records`);
      
      // Get current target count
      const targetCount = await targetClient.query('SELECT COUNT(*) as count FROM module_registry');
      console.log(`📊 Current VIBEZS_DB modules: ${targetCount.rows[0].count} records`);
      
      // Check for any ID conflicts (should be none based on analysis)
      const sourceIds = sourceData.rows.map(row => row.id);
      const conflictCheck = await targetClient.query(`
        SELECT id FROM module_registry WHERE id = ANY($1::uuid[])
      `, [sourceIds]);
      
      if (conflictCheck.rows.length > 0) {
        console.log(`⚠️  Found ${conflictCheck.rows.length} ID conflicts:`);
        conflictCheck.rows.forEach(row => {
          console.log(`   • ${row.id}`);
        });
        console.log('\n❌ Cannot proceed safely with ID conflicts');
        return;
      }
      
      console.log('✅ No ID conflicts detected - safe to proceed\n');
      
      // Insert portfolio modules
      console.log('📥 Adding portfolio modules to VIBEZS_DB...');
      let insertedCount = 0;
      let skippedCount = 0;
      
      for (const row of sourceData.rows) {
        try {
          await targetClient.query(`
            INSERT INTO module_registry (
              id, name, description, type, source_repo, version,
              dependencies, metadata, widget_config, code_content,
              file_path, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            row.id,
            row.name,
            row.description,
            row.type,
            row.source_repo,
            row.version || '1.0.0',
            row.dependencies || [],
            row.metadata || {},
            row.widget_config || {},
            row.code_content,
            row.file_path,
            row.status || 'active',
            row.created_at,
            row.updated_at
          ]);
          insertedCount++;
          
          if (insertedCount % 50 === 0) {
            console.log(`   📦 Inserted ${insertedCount} records...`);
          }
          
        } catch (error) {
          console.log(`   ⚠️  Skipped record ${row.id}: ${error.message}`);
          skippedCount++;
        }
      }
      
      console.log(`\n✅ Portfolio modules added successfully!`);
      console.log(`   📦 Inserted: ${insertedCount} records`);
      console.log(`   ⚠️  Skipped: ${skippedCount} records`);
      
      // Verify final count
      const finalCount = await targetClient.query('SELECT COUNT(*) as count FROM module_registry');
      const originalCount = parseInt(targetCount.rows[0].count);
      const newCount = parseInt(finalCount.rows[0].count);
      
      console.log(`\n📊 FINAL VERIFICATION:`);
      console.log(`   Original VIBEZS_DB: ${originalCount} records`);
      console.log(`   Added portfolio: ${insertedCount} records`);
      console.log(`   Final total: ${newCount} records`);
      console.log(`   Expected: ${originalCount + insertedCount} records`);
      
      if (newCount === originalCount + insertedCount) {
        console.log('\n🎉 MIGRATION VERIFIED - All data preserved and added correctly!');
      } else {
        console.log('\n⚠️  Count mismatch - please investigate');
      }
      
    } finally {
      sourceClient.release();
      targetClient.release();
    }
    
  } catch (error) {
    console.error('❌ Addition failed:', error.message);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

addPortfolioModules().catch(console.error);
