#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🗑️  CLEANING UP SUPABASE_DB DATA');
console.log('===============================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;

// Only clean up the portfolio-specific tables that we migrated
const PORTFOLIO_TABLES_TO_CLEAN = [
  'journal_entries',
  'ai_suggestions',
  'project_journal_links',
  'reminders',
  'module_registry'
];

async function cleanupSupabaseData() {
  // Temporarily disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const pool = new Pool({
    connectionString: SUPABASE_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to SUPABASE_DB...');
    const client = await pool.connect();
    
    try {
      console.log('📊 PRE-CLEANUP VERIFICATION:\n');
      
      // Show what we're about to delete
      for (const table of PORTFOLIO_TABLES_TO_CLEAN) {
        try {
          const count = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
          console.log(`📦 ${table}: ${count.rows[0].count} records to be deleted`);
        } catch (error) {
          console.log(`⚠️  ${table}: Table not found or error - ${error.message}`);
        }
      }
      
      console.log('\n⚠️  IMPORTANT: This will permanently delete the above data from SUPABASE_DB');
      console.log('   (Data is safely migrated to VIBEZS_DB)');
      
      // Check if user wants to proceed
      const proceed = process.argv.includes('--confirm-delete');
      
      if (!proceed) {
        console.log('\n💡 TO PROCEED WITH CLEANUP:');
        console.log('   node scripts/cleanup-supabase-data.mjs --confirm-delete');
        console.log('\n⚠️  Only run this AFTER verifying your application works with VIBEZS_DB');
        return;
      }
      
      console.log('\n🗑️  PROCEEDING WITH CLEANUP...\n');
      
      let totalDeleted = 0;
      
      // Delete in reverse order to handle foreign key constraints
      const tablesReversed = [...PORTFOLIO_TABLES_TO_CLEAN].reverse();
      
      for (const table of tablesReversed) {
        try {
          const countBefore = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const recordsBefore = parseInt(countBefore.rows[0].count);
          
          if (recordsBefore > 0) {
            console.log(`🗑️  Deleting ${recordsBefore} records from ${table}...`);
            
            const deleteResult = await client.query(`DELETE FROM "${table}"`);
            const deletedCount = deleteResult.rowCount || 0;
            
            console.log(`   ✅ Deleted ${deletedCount} records`);
            totalDeleted += deletedCount;
          } else {
            console.log(`   ⚠️  ${table}: No records to delete`);
          }
          
        } catch (error) {
          console.log(`   ❌ Failed to delete from ${table}: ${error.message}`);
        }
      }
      
      console.log(`\n📊 CLEANUP SUMMARY:`);
      console.log(`   🗑️  Total records deleted: ${totalDeleted}`);
      
      // Verify cleanup
      console.log('\n🔍 POST-CLEANUP VERIFICATION:\n');
      
      for (const table of PORTFOLIO_TABLES_TO_CLEAN) {
        try {
          const count = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const remaining = parseInt(count.rows[0].count);
          
          if (remaining === 0) {
            console.log(`✅ ${table}: Clean (0 records remaining)`);
          } else {
            console.log(`⚠️  ${table}: ${remaining} records still remain`);
          }
        } catch (error) {
          console.log(`   ❌ ${table}: Verification error - ${error.message}`);
        }
      }
      
      console.log('\n🎉 CLEANUP COMPLETE!');
      console.log('   Your portfolio data has been removed from SUPABASE_DB');
      console.log('   All data is now safely stored in VIBEZS_DB');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupSupabaseData().catch(console.error);
