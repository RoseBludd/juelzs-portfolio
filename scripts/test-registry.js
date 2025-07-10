#!/usr/bin/env node

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

console.log('🔍 Starting Registry Database Analysis...\n');

async function testDatabaseConnection() {
  try {
    // Import after env is loaded
    const { Pool } = require('pg');
    
    const connectionString = process.env.SUPABASE_DB;
    
    if (!connectionString) {
      console.log('❌ SUPABASE_DB connection string not found in environment variables');
      console.log('   Make sure to add SUPABASE_DB to your .env file');
      return false;
    }
    
    console.log('📊 Testing database connection...');
    console.log(`   Connection: ${connectionString.substring(0, 30)}...`);
    
    const pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });

    // Test basic connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();

    console.log('✅ Database connection successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    
    return { pool, connected: true };
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(`   Error: ${error.message}`);
    return { pool: null, connected: false };
  }
}

async function analyzeRegistry(pool) {
  if (!pool) {
    console.log('\n📋 Using fallback data for analysis...');
    return analyzeFallbackData();
  }

  try {
    console.log('\n📋 Analyzing module registry...');
    
    const client = await pool.connect();
    
    try {
      // Check if registry table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'module_registry'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('⚠️  module_registry table not found, using fallback data');
        client.release();
        return analyzeFallbackData();
      }

      // Get total count
      const countResult = await client.query('SELECT COUNT(*) as total FROM module_registry');
      const totalModules = parseInt(countResult.rows[0].total);

      // Get modules by type
      const typeResult = await client.query(`
        SELECT type, COUNT(*) as count 
        FROM module_registry 
        GROUP BY type 
        ORDER BY count DESC
      `);

      // Get recent modules
      const recentResult = await client.query(`
        SELECT name, type, module_count, updated_at 
        FROM module_registry 
        ORDER BY updated_at DESC 
        LIMIT 5
      `);

      client.release();

      console.log(`   Total modules: ${totalModules}`);
      console.log(`   Module types: ${typeResult.rows.length}`);
      
      console.log('\n📊 Modules by type:');
      typeResult.rows.forEach(row => {
        console.log(`   ${row.type}: ${row.count} modules`);
      });

      console.log('\n🔄 Recent modules:');
      recentResult.rows.forEach(row => {
        console.log(`   ${row.name} (${row.type}): ${row.module_count} items - ${new Date(row.updated_at).toLocaleDateString()}`);
      });

      return {
        source: 'database',
        totalModules,
        moduleTypes: typeResult.rows,
        recentModules: recentResult.rows
      };

    } finally {
      // Ensure client is released even if error occurs
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    console.log(`❌ Registry analysis failed: ${error.message}`);
    console.log('   Falling back to local data...');
    return analyzeFallbackData();
  }
}

function analyzeFallbackData() {
  const fallbackModules = [
    { type: 'ui_components', count: 60 },
    { type: 'api_endpoints', count: 51 },
    { type: 'functions', count: 85 },
    { type: 'database', count: 57 },
    { type: 'tests', count: 2 },
    { type: 'pages', count: 7 },
    { type: 'styles', count: 1 },
    { type: 'config', count: 4 },
    { type: 'tools', count: 3 },
    { type: 'documentation', count: 0 }
  ];

  const totalModules = fallbackModules.reduce((sum, m) => sum + m.count, 0);

  console.log(`   Total modules: ${totalModules}`);
  console.log(`   Module types: ${fallbackModules.length}`);
  
  console.log('\n📊 Modules by type (fallback data):');
  fallbackModules.forEach(module => {
    console.log(`   ${module.type}: ${module.count} modules`);
  });

  return {
    source: 'fallback',
    totalModules,
    moduleTypes: fallbackModules,
    recentModules: []
  };
}

async function testRegistryService() {
  try {
    console.log('\n🔧 Testing Registry Service...');
    
    // Dynamic import to avoid issues with ES modules
    const DatabaseService = require('../src/services/database.service.ts').default;
    
    const service = DatabaseService.getInstance();
    
    console.log('   Service instantiated successfully');
    
    // Test connection status
    const status = service.getConnectionStatus();
    console.log(`   Environment: ${status.environment}`);
    console.log(`   Pool size: ${status.poolSize}`);
    console.log(`   Connected: ${status.connected}`);

    // Try to initialize
    await service.initialize();
    console.log('   Service initialized successfully');

    // Test data retrieval
    const modules = await service.getModules();
    console.log(`   Retrieved ${modules.length} modules`);

    const stats = await service.getRegistryStats();
    console.log(`   Total modules in stats: ${stats.totalModules}`);

    return true;
  } catch (error) {
    console.log(`❌ Registry service test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Environment variables:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   SUPABASE_DB: ${process.env.SUPABASE_DB ? 'configured' : 'not set'}`);
  
  // Test database connection
  const { pool, connected } = await testDatabaseConnection();
  
  // Analyze registry data
  const analysis = await analyzeRegistry(pool);
  
  // Test registry service
  const serviceWorking = await testRegistryService();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎯 REGISTRY ANALYSIS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Database Connection: ${connected ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`Data Source: ${analysis.source}`);
  console.log(`Registry Service: ${serviceWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`Total Modules: ${analysis.totalModules}`);
  console.log(`Module Types: ${analysis.moduleTypes.length}`);
  
  if (connected) {
    console.log('\n💡 Registry is ready for production use!');
  } else {
    console.log('\n⚠️  Registry running on fallback data');
    console.log('   Check database connection and credentials');
  }
  
  // Cleanup
  if (pool) {
    await pool.end();
  }
  
  console.log('\n✅ Analysis complete!');
}

// Run the analysis
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 