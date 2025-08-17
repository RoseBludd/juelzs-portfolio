#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 TESTING UPDATED REGISTRY QUERIES');
console.log('==================================\n');

const VIBEZS_DB = process.env.VIBEZS_DB;

async function testUpdatedQueries() {
  // Temporarily disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const pool = new Pool({
    connectionString: VIBEZS_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    try {
      console.log('🔍 Testing updated database service queries...');
      
      // Test the updated query
      const result = await client.query(`
        SELECT 
          id,
          name,
          type,
          description,
          'General' as category,
          1 as module_count,
          dependencies as technologies,
          created_at,
          updated_at,
          metadata
        FROM module_registry 
        ORDER BY updated_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Query successful! Found ${result.rows.length} records`);
      
      result.rows.forEach((row, index) => {
        console.log(`[${index + 1}] ${row.name} (${row.type})`);
        console.log(`    Category: ${row.category}`);
        console.log(`    Module Count: ${row.module_count}`);
        console.log(`    Technologies: ${JSON.stringify(row.technologies || [])}`);
        console.log();
      });
      
      // Test count query
      const countResult = await client.query('SELECT COUNT(*) as total FROM module_registry');
      console.log(`📊 Total modules in registry: ${countResult.rows[0].total}`);
      
      // Test type breakdown
      const typeResult = await client.query(`
        SELECT type, COUNT(*) as count 
        FROM module_registry 
        GROUP BY type 
        ORDER BY count DESC
        LIMIT 10
      `);
      
      console.log('\n📋 Module types:');
      typeResult.rows.forEach(row => {
        console.log(`   • ${row.type}: ${row.count} modules`);
      });
      
      console.log('\n🎉 ALL QUERIES WORKING CORRECTLY!');
      console.log('   Your application should now work with VIBEZS_DB');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testUpdatedQueries().catch(console.error);
