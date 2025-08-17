#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 TESTING DATABASE CONNECTIONS');
console.log('===============================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

console.log('📊 Environment Variables:');
console.log(`   SUPABASE_DB: ${SUPABASE_DB ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   VIBEZS_DB: ${VIBEZS_DB ? '✅ SET' : '❌ NOT SET'}`);

if (!SUPABASE_DB) {
  console.log('\n❌ SUPABASE_DB not found');
  process.exit(1);
}

if (!VIBEZS_DB) {
  console.log('\n❌ VIBEZS_DB not found');
  process.exit(1);
}

async function testConnection(connectionString, name) {
  console.log(`\n🔌 Testing ${name} connection...`);
  
  let pool;
  try {
    // Temporarily disable SSL verification for development
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log(`   ✅ ${name} connection successful`);
      console.log(`   ⏰ Server time: ${result.rows[0].current_time}`);
      console.log(`   📊 PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
      
      // Test basic query
      const tableCount = await client.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(`   📋 Tables found: ${tableCount.rows[0].table_count}`);
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(`   ❌ ${name} connection failed: ${error.message}`);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

async function main() {
  try {
    const supabaseOk = await testConnection(SUPABASE_DB, 'SUPABASE_DB');
    const vibezOk = await testConnection(VIBEZS_DB, 'VIBEZS_DB');
    
    console.log('\n📊 CONNECTION SUMMARY:');
    console.log(`   SUPABASE_DB: ${supabaseOk ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   VIBEZS_DB: ${vibezOk ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (supabaseOk && vibezOk) {
      console.log('\n🎉 Both databases are accessible! Ready for migration.');
    } else {
      console.log('\n⚠️  Fix connection issues before proceeding with migration.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
