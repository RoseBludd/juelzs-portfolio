#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function debugCADISEntries() {
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('🔍 Checking CADIS journal entries...');
      
      const entries = await client.query('SELECT * FROM cadis_journal_entries ORDER BY created_at DESC');
      
      console.log(`📝 Found ${entries.rows.length} CADIS entries`);
      
      for (const entry of entries.rows) {
        console.log(`\n📋 Entry: ${entry.title}`);
        console.log(`   🏷️  Tags: ${entry.tags} (type: ${typeof entry.tags})`);
        console.log(`   🔗 Related: ${entry.related_entities} (type: ${typeof entry.related_entities})`);
        console.log(`   🧠 Metadata: ${entry.cadis_metadata} (type: ${typeof entry.cadis_metadata})`);
        
        // Try to parse each JSON field
        try {
          if (entry.tags) JSON.parse(entry.tags);
          console.log('   ✅ Tags JSON valid');
        } catch (error) {
          console.log(`   ❌ Tags JSON invalid: ${error.message}`);
        }
        
        try {
          if (entry.related_entities) JSON.parse(entry.related_entities);
          console.log('   ✅ Related entities JSON valid');
        } catch (error) {
          console.log(`   ❌ Related entities JSON invalid: ${error.message}`);
        }
        
        try {
          if (entry.cadis_metadata) JSON.parse(entry.cadis_metadata);
          console.log('   ✅ CADIS metadata JSON valid');
        } catch (error) {
          console.log(`   ❌ CADIS metadata JSON invalid: ${error.message}`);
        }
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await pool.end();
  }
}

debugCADISEntries();
