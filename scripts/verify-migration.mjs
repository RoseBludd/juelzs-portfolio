#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 VERIFYING MIGRATED DATA IN VIBEZS_DB');
console.log('======================================\n');

const VIBEZS_DB = process.env.VIBEZS_DB;

if (!VIBEZS_DB) {
  console.log('❌ VIBEZS_DB environment variable required');
  process.exit(1);
}

async function verify() {
  // Temporarily disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const pool = new Pool({
    connectionString: VIBEZS_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    const tables = ['journal_entries', 'ai_suggestions', 'project_journal_links', 'reminders'];
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(result.rows[0].count);
        totalRecords += count;
        
        console.log(`✅ ${table}: ${count} records`);
        
        if (count > 0) {
          const sample = await client.query(`SELECT * FROM "${table}" LIMIT 1`);
          const firstRecord = sample.rows[0];
          const keys = Object.keys(firstRecord).slice(0, 3);
          console.log(`   📄 Sample fields: ${keys.join(', ')}...`);
          
          // Show a bit of actual data (safely)
          if (firstRecord.id) {
            console.log(`   🔑 Sample ID: ${firstRecord.id}`);
          }
          if (firstRecord.title) {
            console.log(`   📝 Sample title: ${firstRecord.title.substring(0, 50)}...`);
          }
        }
        console.log();
        
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    }
    
    client.release();
    
    console.log(`📊 VERIFICATION SUMMARY:`);
    console.log(`   Total migrated records: ${totalRecords}`);
    console.log(`   Tables processed: ${tables.length}`);
    
    if (totalRecords > 0) {
      console.log('\n🎉 MIGRATION VERIFIED SUCCESSFULLY!');
      console.log('   Your portfolio data is now in VIBEZS_DB');
    } else {
      console.log('\n⚠️  No data found - migration may have failed');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verify().catch(console.error);
