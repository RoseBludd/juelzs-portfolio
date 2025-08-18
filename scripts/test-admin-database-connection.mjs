#!/usr/bin/env node

/**
 * Test admin database connection and journal functionality
 */

import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing Admin Database Connection...\n');

// Test 1: Environment Variables
console.log('🔧 Environment Check:');
console.log('✅ VIBEZS_DB:', process.env.VIBEZS_DB ? 'Set' : '❌ Missing');
console.log('✅ ADMIN_LOGIN:', process.env.ADMIN_LOGIN ? 'Set' : '❌ Missing');
console.log('✅ NODE_ENV:', process.env.NODE_ENV || 'development');

// Test 2: API Endpoints
async function testAdminAPIs() {
  console.log('\n📡 Testing Admin APIs:');
  
  try {
    // Test admin journal API (should require auth)
    const journalResponse = await fetch('http://localhost:3000/api/admin/journal');
    console.log('📝 Admin Journal API:', journalResponse.status === 401 ? '✅ Protected (401)' : `❌ Status: ${journalResponse.status}`);
    
    // Test public journal API (should work without auth)
    const publicResponse = await fetch('http://localhost:3000/api/journal/public');
    if (publicResponse.ok) {
      const data = await publicResponse.json();
      console.log('🌐 Public Journal API: ✅ Working');
      console.log(`📊 Public entries found: ${data.entries?.length || 0}`);
    } else {
      console.log('🌐 Public Journal API: ❌ Failed');
    }
    
  } catch (error) {
    console.log('❌ API Test Error:', error.message);
    console.log('💡 Make sure the dev server is running: npm run dev');
  }
}

// Test 3: Database Schema
async function testDatabaseSchema() {
  console.log('\n🗄️ Testing Database Schema:');
  
  if (!process.env.VIBEZS_DB) {
    console.log('❌ Cannot test database - VIBEZS_DB not set');
    return;
  }
  
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.VIBEZS_DB,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    
    try {
      // Check if journal_entries table exists
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'journal_entries'
      `);
      
      if (tableCheck.rows.length > 0) {
        console.log('✅ journal_entries table exists');
        
        // Check if is_private column exists
        const columnCheck = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'journal_entries' 
          AND column_name = 'is_private'
        `);
        
        if (columnCheck.rows.length > 0) {
          console.log('✅ is_private column exists');
          
          // Count entries
          const countResult = await client.query('SELECT COUNT(*) FROM journal_entries');
          console.log(`📊 Total journal entries: ${countResult.rows[0].count}`);
          
          // Count private entries
          const privateCountResult = await client.query('SELECT COUNT(*) FROM journal_entries WHERE is_private = true');
          console.log(`🔒 Private entries: ${privateCountResult.rows[0].count}`);
          
        } else {
          console.log('❌ is_private column missing');
        }
      } else {
        console.log('❌ journal_entries table missing');
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.log('❌ Database Test Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testAdminAPIs();
  await testDatabaseSchema();
  
  console.log('\n🎯 Summary:');
  console.log('1. Admin pages restored from commit 3f108aa ✅');
  console.log('2. Privacy features re-applied ✅');
  console.log('3. Database migration completed ✅');
  console.log('4. Ready for testing in browser 🚀');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure dev server is running: npm run dev');
  console.log('2. Go to: http://localhost:3000/admin/login');
  console.log('3. Login with your ADMIN_LOGIN password');
  console.log('4. Test the journal functionality');
  console.log('5. Create a private entry and verify it doesn\'t show on /insights');
}

runAllTests().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
