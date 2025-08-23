#!/usr/bin/env node

/**
 * Simple Database Structure Check
 * 
 * Uses direct database connection to check what tables exist
 */

import { Pool } from 'pg';

console.log('🗄️ Database Structure Check');
console.log('='.repeat(50));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkDatabase() {
  console.log('\n📊 CHECKING DATABASE STRUCTURE');
  console.log('-'.repeat(40));

  try {
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const allTables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`\n📋 Found ${allTables.length} total tables`);
    
    // Filter CADIS and trace related tables
    const cadisRelated = allTables.filter(table => table.includes('cadis'));
    const traceRelated = allTables.filter(table => table.includes('trace') || table.includes('tbl_trace'));
    
    console.log(`\n🧠 CADIS-related tables (${cadisRelated.length}):`);
    if (cadisRelated.length > 0) {
      for (const table of cadisRelated) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const count = countResult.rows[0].count;
          console.log(`   ✅ ${table}: ${count} rows`);
        } catch (error) {
          console.log(`   ❌ ${table}: Error reading`);
        }
      }
    } else {
      console.log('   ❌ No CADIS tables found');
    }
    
    console.log(`\n📊 Trace-related tables (${traceRelated.length}):`);
    if (traceRelated.length > 0) {
      for (const table of traceRelated) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const count = countResult.rows[0].count;
          console.log(`   ✅ ${table}: ${count} rows`);
        } catch (error) {
          console.log(`   ❌ ${table}: Error reading`);
        }
      }
    } else {
      console.log('   ❌ No trace tables found');
    }
    
    // Check for essential CADIS tables
    const essentialTables = [
      'cadis_memory',
      'cadis_decisions', 
      'cadis_trace_archive',
      'tbl_trace_archive'
    ];
    
    console.log(`\n🔍 ESSENTIAL TABLES CHECK:`);
    const missingTables = [];
    
    for (const table of essentialTables) {
      const exists = allTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (!exists) {
        missingTables.push(table);
      }
    }
    
    // Show some other important tables
    const otherImportant = allTables.filter(table => 
      !table.includes('cadis') && 
      !table.includes('trace') && 
      (table.includes('journal') || table.includes('meeting') || table.includes('project'))
    );
    
    if (otherImportant.length > 0) {
      console.log(`\n📦 Other important tables (${otherImportant.length}):`);
      otherImportant.slice(0, 5).forEach(table => {
        console.log(`   • ${table}`);
      });
    }
    
    // Generate recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    if (missingTables.length > 0) {
      console.log(`   🚨 CRITICAL: Missing ${missingTables.length} essential tables`);
      console.log(`   📋 Missing: ${missingTables.join(', ')}`);
      console.log(`   🔧 Action: Initialize CADIS database tables`);
    } else {
      console.log(`   ✅ All essential tables present`);
      console.log(`   🚀 Ready for CADIS scenario execution`);
    }
    
    // Check if we can create tables (test permissions)
    console.log(`\n🔐 TESTING DATABASE PERMISSIONS:`);
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_permissions_check (
          id SERIAL PRIMARY KEY,
          test_column TEXT
        )
      `);
      await pool.query(`DROP TABLE IF EXISTS test_permissions_check`);
      console.log(`   ✅ Database write permissions: OK`);
    } catch (error) {
      console.log(`   ❌ Database write permissions: FAILED`);
      console.log(`   Error: ${error.message}`);
    }
    
    return {
      totalTables: allTables.length,
      cadisRelated,
      traceRelated,
      missingTables,
      canProceed: missingTables.length === 0
    };
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the check
checkDatabase()
  .then(result => {
    console.log('\n🎯 SUMMARY:');
    console.log(`   📊 Total Tables: ${result.totalTables}`);
    console.log(`   🧠 CADIS Tables: ${result.cadisRelated.length}`);
    console.log(`   📊 Trace Tables: ${result.traceRelated.length}`);
    console.log(`   ❌ Missing Tables: ${result.missingTables.length}`);
    console.log(`   🚀 Can Proceed: ${result.canProceed ? 'YES' : 'NO'}`);
    
    if (result.canProceed) {
      console.log('\n✅ Database is ready for CADIS operations!');
    } else {
      console.log('\n⚠️ Database needs initialization before proceeding.');
    }
  })
  .catch(error => {
    console.error('💥 Analysis failed:', error.message);
    process.exit(1);
  });
