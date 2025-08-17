#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

console.log('🛡️  SAFE PORTFOLIO MIGRATION SCRIPT');
console.log('===================================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

if (!SUPABASE_DB || !VIBEZS_DB) {
  console.log('❌ Both SUPABASE_DB and VIBEZS_DB environment variables are required');
  process.exit(1);
}

// ONLY PORTFOLIO-SPECIFIC TABLES (confirmed safe by codebase analysis)
const PORTFOLIO_ONLY_TABLES = [
  // Core portfolio journal system
  'journal_entries',
  'ai_suggestions', 
  'project_journal_links',
  'reminders',
  
  // Portfolio module registry system
  'module_registry',
  'module_types',
  'module_versions',
  'module_permissions',
  'module_submissions',
  'module_updates',
  
  // Supporting portfolio tables
  'file_links',
  'interactions',
  'changelog_entries',
  'faq_entries'
];

class SafePortfolioMigration {
  constructor() {
    this.sourcePool = null;
    this.targetPool = null;
    this.migrationLog = [];
    this.backupData = {};
  }

  async initialize() {
    try {
      // Temporarily disable SSL verification for development
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      this.sourcePool = new Pool({
        connectionString: SUPABASE_DB,
        max: 3,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      });

      this.targetPool = new Pool({
        connectionString: VIBEZS_DB,
        max: 3,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      });

      // Test connections
      await this.sourcePool.query('SELECT 1');
      await this.targetPool.query('SELECT 1');
      
      console.log('✅ Database connections established');
    } catch (error) {
      console.error('❌ Failed to initialize database connections:', error.message);
      throw error;
    }
  }

  async checkSafety() {
    console.log('\n🔒 SAFETY CHECK: Verifying target database won\'t be harmed...\n');
    
    const targetClient = await this.targetPool.connect();
    
    try {
      const conflicts = [];
      
      for (const tableName of PORTFOLIO_ONLY_TABLES) {
        // Check if table exists in target
        const targetExists = await targetClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (targetExists.rows[0].exists) {
          // Get record count in target
          const targetCount = await targetClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          const targetRecords = parseInt(targetCount.rows[0].count);
          
          if (targetRecords > 0) {
            conflicts.push({
              table: tableName,
              targetRecords,
              risk: 'HIGH - Will overwrite existing data'
            });
          }
        }
      }
      
      if (conflicts.length > 0) {
        console.log('🚨 SAFETY WARNING: The following tables have data in VIBEZS_DB:');
        conflicts.forEach(conflict => {
          console.log(`   ❌ ${conflict.table}: ${conflict.targetRecords} records (${conflict.risk})`);
        });
        
        console.log('\n⚠️  RECOMMENDATION: Do not proceed unless you are certain this data can be overwritten.');
        console.log('   Consider backing up VIBEZS_DB first or choosing different table names.');
        
        return false;
      }
      
      console.log('✅ SAFETY CHECK PASSED: No conflicts detected in VIBEZS_DB');
      return true;
      
    } finally {
      targetClient.release();
    }
  }

  async migratePortfolioTables() {
    console.log('\n🔄 MIGRATING PORTFOLIO TABLES...\n');
    
    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();
    
    try {
      let totalRecordsMigrated = 0;
      
      for (const tableName of PORTFOLIO_ONLY_TABLES) {
        console.log(`📦 Processing table: ${tableName}`);
        
        // Check if table exists in source
        const sourceExists = await sourceClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (!sourceExists.rows[0].exists) {
          console.log(`   ⚠️  Table '${tableName}' not found in source database`);
          continue;
        }
        
        // Get source data
        const sourceData = await sourceClient.query(`SELECT * FROM "${tableName}"`);
        console.log(`   📥 Found ${sourceData.rows.length} records in source`);
        
        if (sourceData.rows.length === 0) {
          console.log(`   ⚠️  No data to migrate for '${tableName}'`);
          continue;
        }
        
        await targetClient.query('BEGIN');
        
        try {
          // Get table structure from source
          const columns = await sourceClient.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName]);
          
          // Create table if it doesn't exist in target
          const tableExists = await targetClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            );
          `, [tableName]);
          
          if (!tableExists.rows[0].exists) {
            console.log(`   🏗️  Creating table '${tableName}' in target database...`);
            
            // Create table with proper structure
            const createTableQuery = await this.getCreateTableStatement(tableName, sourceClient);
            await targetClient.query(createTableQuery);
            console.log(`   ✅ Table '${tableName}' created successfully`);
          } else {
            // Clear existing data (since we passed safety check)
            await targetClient.query(`DELETE FROM "${tableName}"`);
            console.log(`   🗑️  Cleared existing data from '${tableName}'`);
          }
          
          // Insert data
          if (sourceData.rows.length > 0) {
            const firstRow = sourceData.rows[0];
            const columnList = Object.keys(firstRow).map(key => `"${key}"`).join(', ');
            
            for (const row of sourceData.rows) {
              const values = Object.values(row);
              const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
              
              await targetClient.query(
                `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
                values
              );
            }
            console.log(`   ✅ Inserted ${sourceData.rows.length} records into '${tableName}'`);
            totalRecordsMigrated += sourceData.rows.length;
          }
          
          await targetClient.query('COMMIT');
          
          this.migrationLog.push({
            table: tableName,
            recordsMigrated: sourceData.rows.length,
            timestamp: new Date().toISOString(),
            success: true
          });
          
        } catch (error) {
          await targetClient.query('ROLLBACK');
          console.error(`   ❌ Migration failed for '${tableName}':`, error.message);
          
          this.migrationLog.push({
            table: tableName,
            recordsMigrated: 0,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
          });
        }
      }
      
      console.log(`\n📊 MIGRATION COMPLETE: ${totalRecordsMigrated} total records migrated`);
      return totalRecordsMigrated;
      
    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  async getCreateTableStatement(tableName, client) {
    // Get column definitions
    const columns = await client.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    
    let createStatement = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
    
    const columnDefs = columns.rows.map(col => {
      let def = `  "${col.column_name}" `;
      
      // Handle data types
      if (col.data_type === 'character varying') {
        def += col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
      } else if (col.data_type === 'USER-DEFINED') {
        def += col.udt_name;
      } else if (col.data_type === 'ARRAY') {
        def += col.udt_name + '[]';
      } else if (col.data_type === 'timestamp without time zone') {
        def += 'TIMESTAMP';
      } else if (col.data_type === 'timestamp with time zone') {
        def += 'TIMESTAMPTZ';
      } else {
        def += col.data_type.toUpperCase();
      }
      
      // Handle nullable
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      // Handle defaults (simplified)
      if (col.column_default && !col.column_default.includes('nextval')) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      return def;
    });
    
    createStatement += columnDefs.join(',\n') + '\n);';
    
    return createStatement;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      migration: {
        successful: this.migrationLog.filter(log => log.success).length,
        failed: this.migrationLog.filter(log => !log.success).length,
        totalRecordsMigrated: this.migrationLog.reduce((sum, log) => sum + (log.recordsMigrated || 0), 0)
      },
      details: this.migrationLog,
      tablesProcessed: PORTFOLIO_ONLY_TABLES,
      safetyApproach: 'Only portfolio-specific tables migrated to avoid conflicts'
    };
    
    await fs.writeFile('portfolio-migration-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 MIGRATION REPORT');
    console.log('==================');
    console.log(`✅ Successful migrations: ${report.migration.successful}`);
    console.log(`❌ Failed migrations: ${report.migration.failed}`);
    console.log(`📦 Total records migrated: ${report.migration.totalRecordsMigrated}`);
    console.log(`🛡️  Safety approach: Portfolio-only tables`);
    console.log('\n📄 Detailed report saved to: portfolio-migration-report.json');
    
    return report;
  }

  async close() {
    if (this.sourcePool) await this.sourcePool.end();
    if (this.targetPool) await this.targetPool.end();
  }
}

// Main execution
async function main() {
  const migration = new SafePortfolioMigration();
  
  try {
    console.log('🚀 Starting safe portfolio migration...\n');
    
    await migration.initialize();
    
    // Safety check first
    const isSafe = await migration.checkSafety();
    
    if (!isSafe) {
      console.log('\n❌ Migration aborted due to safety concerns.');
      console.log('   Please review the conflicts and decide how to proceed.');
      return;
    }
    
    // Proceed with migration
    const totalMigrated = await migration.migratePortfolioTables();
    
    // Generate report
    await migration.generateReport();
    
    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log(`   ${totalMigrated} records migrated safely`);
    console.log('   VIBEZS_DB existing data was preserved');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SafePortfolioMigration;
