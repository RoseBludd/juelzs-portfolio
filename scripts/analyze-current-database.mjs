#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 DATABASE ANALYSIS SCRIPT');
console.log('============================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

console.log('📊 Environment Configuration:');
console.log(`   SUPABASE_DB: ${SUPABASE_DB ? 'configured' : '❌ NOT SET'}`);
console.log(`   VIBEZS_DB: ${VIBEZS_DB ? 'configured' : '❌ NOT SET'}`);
console.log();

if (!SUPABASE_DB) {
  console.log('❌ SUPABASE_DB environment variable is required');
  console.log('   Please set your current database connection string in .env file');
  process.exit(1);
}

if (!VIBEZS_DB) {
  console.log('❌ VIBEZS_DB environment variable is required');
  console.log('   Please set your target database connection string in .env file');
  process.exit(1);
}

// Database Analysis Functions
async function analyzeDatabase(connectionString, dbName) {
  console.log(`\n🔍 ANALYZING ${dbName.toUpperCase()}`);
  console.log('=' + '='.repeat(dbName.length + 10));
  
  let pool;
  try {
    // Temporarily disable SSL verification for development
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      // Test connection
      await client.query('SELECT NOW()');
      console.log('✅ Database connection successful');
      
      // Get all tables
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      console.log(`\n📋 Tables found: ${tablesResult.rows.length}`);
      
      const analysis = {
        database: dbName,
        connectionString: connectionString.replace(/:[^:@]*@/, ':***@'), // Hide password
        tables: [],
        totalRecords: 0
      };
      
      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.tablename;
        console.log(`\n   🗂️  Table: ${tableName}`);
        
        try {
          // Get table structure
          const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName]);
          
          // Get record count
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          const recordCount = parseInt(countResult.rows[0].count);
          
          console.log(`      📊 Records: ${recordCount}`);
          console.log(`      🏗️  Columns: ${structureResult.rows.length}`);
          
          const tableInfo = {
            name: tableName,
            recordCount,
            columns: structureResult.rows.map(col => ({
              name: col.column_name,
              type: col.data_type,
              nullable: col.is_nullable === 'YES',
              default: col.column_default
            }))
          };
          
          analysis.tables.push(tableInfo);
          analysis.totalRecords += recordCount;
          
          // Show column details
          structureResult.rows.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`         • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
          });
          
          // Show sample data for tables with records
          if (recordCount > 0 && recordCount <= 10) {
            console.log(`      📝 Sample data:`);
            const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
            sampleResult.rows.forEach((row, index) => {
              console.log(`         [${index + 1}] ${JSON.stringify(row, null, 2).replace(/\n/g, ' ')}`);
            });
          } else if (recordCount > 0) {
            console.log(`      📝 First 3 records:`);
            const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
            sampleResult.rows.forEach((row, index) => {
              const summary = Object.keys(row).slice(0, 3).map(key => `${key}: ${JSON.stringify(row[key])}`).join(', ');
              console.log(`         [${index + 1}] ${summary}...`);
            });
          }
          
        } catch (error) {
          console.log(`      ❌ Error analyzing table: ${error.message}`);
          analysis.tables.push({
            name: tableName,
            recordCount: 0,
            columns: [],
            error: error.message
          });
        }
      }
      
      console.log(`\n📊 SUMMARY FOR ${dbName.toUpperCase()}:`);
      console.log(`   Total Tables: ${analysis.tables.length}`);
      console.log(`   Total Records: ${analysis.totalRecords}`);
      
      return analysis;
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.log(`❌ Failed to connect to ${dbName}: ${error.message}`);
    return {
      database: dbName,
      error: error.message,
      tables: [],
      totalRecords: 0
    };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Main analysis
async function main() {
  try {
    console.log('🚀 Starting comprehensive database analysis...\n');
    
    // Analyze current database (SUPABASE_DB)
    const currentAnalysis = await analyzeDatabase(SUPABASE_DB, 'SUPABASE_DB (Current)');
    
    // Analyze target database (VIBEZS_DB)
    const targetAnalysis = await analyzeDatabase(VIBEZS_DB, 'VIBEZS_DB (Target)');
    
    // Generate migration report
    console.log('\n\n📋 MIGRATION ANALYSIS REPORT');
    console.log('=============================\n');
    
    console.log('🎯 MIGRATION PLAN:');
    
    if (currentAnalysis.error) {
      console.log('❌ Cannot proceed with migration - source database unavailable');
      console.log(`   Error: ${currentAnalysis.error}`);
      return;
    }
    
    if (targetAnalysis.error) {
      console.log('❌ Cannot proceed with migration - target database unavailable');
      console.log(`   Error: ${targetAnalysis.error}`);
      return;
    }
    
    if (currentAnalysis.totalRecords === 0) {
      console.log('ℹ️  No data found in source database - nothing to migrate');
      return;
    }
    
    console.log(`\n✅ Migration feasibility: READY`);
    console.log(`   Source: ${currentAnalysis.totalRecords} records across ${currentAnalysis.tables.length} tables`);
    console.log(`   Target: ${targetAnalysis.totalRecords} records across ${targetAnalysis.tables.length} tables`);
    
    console.log('\n📊 TABLES TO MIGRATE:');
    currentAnalysis.tables.forEach(table => {
      if (table.recordCount > 0) {
        console.log(`   • ${table.name}: ${table.recordCount} records`);
      }
    });
    
    console.log('\n⚠️  IMPORTANT CONSIDERATIONS:');
    console.log('   • Backup both databases before migration');
    console.log('   • Test migration with a small dataset first');
    console.log('   • Verify data integrity after migration');
    console.log('   • Update application configuration');
    console.log('   • Only remove source data after confirmation');
    
    // Save analysis to file
    const report = {
      timestamp: new Date().toISOString(),
      source: currentAnalysis,
      target: targetAnalysis,
      migrationReady: !currentAnalysis.error && !targetAnalysis.error && currentAnalysis.totalRecords > 0
    };
    
    const fs = await import('fs/promises');
    await fs.writeFile('database-analysis-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Analysis report saved to: database-analysis-report.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run analysis
main().catch(console.error);
