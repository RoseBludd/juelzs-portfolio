#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

console.log('🔄 SELECTIVE DATABASE MIGRATION SCRIPT');
console.log('=====================================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

if (!SUPABASE_DB || !VIBEZS_DB) {
  console.log('❌ Both SUPABASE_DB and VIBEZS_DB environment variables are required');
  process.exit(1);
}

// PORTFOLIO-SPECIFIC TABLES TO MIGRATE
// These appear to be specific to your portfolio system and safe to migrate
const PORTFOLIO_TABLES = [
  // Journal System - Core portfolio functionality
  'journal_entries',
  'ai_suggestions', 
  'project_journal_links',
  'reminders',
  
  // Module Registry - Your component system
  'module_registry',
  'module_types',
  'module_versions',
  'module_permissions',
  'module_submissions',
  'module_updates',
  
  // Portfolio-specific projects (if they don't conflict)
  // 'projects' - SKIP: Potential conflict, needs manual review
  
  // File management for portfolio
  'file_links',
  
  // Portfolio-specific interactions
  'interactions',
  
  // Changelog for your system
  'changelog_entries',
  
  // FAQ entries for your portfolio
  'faq_entries'
];

// TABLES TO REVIEW MANUALLY (potential conflicts)
const REVIEW_TABLES = [
  'projects',      // Both DBs have this - need to check if they're the same system
  'users',         // Both DBs have users - need to avoid conflicts
  'tasks',         // Both DBs have tasks - need to check relationship
  'notifications', // Both DBs have notifications - need to check ownership
  'customers',     // Both DBs have customers - likely different systems
  'documents',     // Both DBs have documents - need to check ownership
  'emails',        // Email system - need to check if portfolio-specific
  'media'          // Media files - need to check if portfolio-specific
];

// TABLES TO SKIP (clearly not portfolio-specific)
const SKIP_TABLES = [
  'monday_jobs',           // Monday.com integration
  'monday_jobs_sync',      // Monday.com sync
  'monday_users',          // Monday.com users
  'lead_activities',       // CRM/Sales system
  'lead_files',           // CRM/Sales system
  'lead_lists',           // CRM/Sales system
  'lead_notes',           // CRM/Sales system
  'lead_shares',          // CRM/Sales system
  'damage_assessment_requests', // Business-specific
  'certificate_requests', // Business-specific
  'agreement_requests',   // Business-specific
  'pay_requests',         // Business-specific
  'developer_applications', // HR system
  'developer_contracts',  // HR system
  'developer_work_sessions', // HR system
  'developers',           // HR system
  'admin_bonuses',        // HR system
  'storms',              // Weather/business specific
  'renommy_properties',  // Real estate specific
  'renommy_lists',       // Real estate specific
  'temp_jobs'            // Temporary business data
];

class SelectiveMigration {
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
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      });

      this.targetPool = new Pool({
        connectionString: VIBEZS_DB,
        max: 5,
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

  async analyzeTableConflicts() {
    console.log('\n🔍 ANALYZING TABLE CONFLICTS...\n');
    
    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();
    
    try {
      const conflicts = [];
      const safeToMigrate = [];
      
      for (const tableName of PORTFOLIO_TABLES) {
        // Check if table exists in source
        const sourceExists = await sourceClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (!sourceExists.rows[0].exists) {
          console.log(`⚠️  Table '${tableName}' not found in source database`);
          continue;
        }
        
        // Check if table exists in target
        const targetExists = await targetClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        // Get record counts
        const sourceCount = await sourceClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const sourceRecords = parseInt(sourceCount.rows[0].count);
        
        let targetRecords = 0;
        if (targetExists.rows[0].exists) {
          const targetCount = await targetClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          targetRecords = parseInt(targetCount.rows[0].count);
        }
        
        if (targetExists.rows[0].exists && targetRecords > 0) {
          conflicts.push({
            table: tableName,
            sourceRecords,
            targetRecords,
            action: 'NEEDS_REVIEW'
          });
          console.log(`⚠️  CONFLICT: '${tableName}' - Source: ${sourceRecords}, Target: ${targetRecords} records`);
        } else {
          safeToMigrate.push({
            table: tableName,
            sourceRecords,
            targetRecords: 0,
            action: 'SAFE_TO_MIGRATE'
          });
          console.log(`✅ SAFE: '${tableName}' - ${sourceRecords} records to migrate`);
        }
      }
      
      return { conflicts, safeToMigrate };
      
    } finally {
      sourceClient.release();
      targetClient.release();
    }
  }

  async createBackup(tableName) {
    console.log(`💾 Creating backup for table '${tableName}'...`);
    
    const targetClient = await this.targetPool.connect();
    try {
      // Check if table exists and has data
      const exists = await targetClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (exists.rows[0].exists) {
        const result = await targetClient.query(`SELECT * FROM "${tableName}"`);
        this.backupData[tableName] = result.rows;
        console.log(`   📦 Backed up ${result.rows.length} records from '${tableName}'`);
      }
    } finally {
      targetClient.release();
    }
  }

  async migrateTable(tableName, strategy = 'REPLACE') {
    console.log(`\n🔄 Migrating table '${tableName}' (${strategy})...`);
    
    const sourceClient = await this.sourcePool.connect();
    const targetClient = await this.targetPool.connect();
    
    try {
      await targetClient.query('BEGIN');
      
      // Get source data
      const sourceData = await sourceClient.query(`SELECT * FROM "${tableName}"`);
      console.log(`   📥 Retrieved ${sourceData.rows.length} records from source`);
      
      if (sourceData.rows.length === 0) {
        console.log(`   ⚠️  No data to migrate for '${tableName}'`);
        await targetClient.query('ROLLBACK');
        return { success: true, recordsMigrated: 0 };
      }
      
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
        
        // Get CREATE TABLE statement from source
        const createTableQuery = await this.getCreateTableStatement(tableName, sourceClient);
        await targetClient.query(createTableQuery);
        console.log(`   ✅ Table '${tableName}' created successfully`);
      }
      
      // Clear existing data if REPLACE strategy
      if (strategy === 'REPLACE') {
        await targetClient.query(`DELETE FROM "${tableName}"`);
        console.log(`   🗑️  Cleared existing data from '${tableName}'`);
      }
      
      // Insert data
      if (sourceData.rows.length > 0) {
        const columnNames = columns.rows.map(col => `"${col.column_name}"`).join(', ');
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
      }
      
      await targetClient.query('COMMIT');
      
      this.migrationLog.push({
        table: tableName,
        strategy,
        recordsMigrated: sourceData.rows.length,
        timestamp: new Date().toISOString(),
        success: true
      });
      
      return { success: true, recordsMigrated: sourceData.rows.length };
      
    } catch (error) {
      await targetClient.query('ROLLBACK');
      console.error(`   ❌ Migration failed for '${tableName}':`, error.message);
      
      this.migrationLog.push({
        table: tableName,
        strategy,
        recordsMigrated: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      });
      
      return { success: false, error: error.message };
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
      } else {
        def += col.data_type.toUpperCase();
      }
      
      // Handle nullable
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      // Handle defaults
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      return def;
    });
    
    createStatement += columnDefs.join(',\n') + '\n);';
    
    return createStatement;
  }

  async generateMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      migration: {
        successful: this.migrationLog.filter(log => log.success).length,
        failed: this.migrationLog.filter(log => !log.success).length,
        totalRecordsMigrated: this.migrationLog.reduce((sum, log) => sum + (log.recordsMigrated || 0), 0)
      },
      details: this.migrationLog,
      backupCreated: Object.keys(this.backupData).length > 0,
      backupTables: Object.keys(this.backupData)
    };
    
    await fs.writeFile('migration-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 MIGRATION REPORT');
    console.log('==================');
    console.log(`✅ Successful migrations: ${report.migration.successful}`);
    console.log(`❌ Failed migrations: ${report.migration.failed}`);
    console.log(`📦 Total records migrated: ${report.migration.totalRecordsMigrated}`);
    console.log(`💾 Backup created for ${report.backupTables.length} tables`);
    console.log('\n📄 Detailed report saved to: migration-report.json');
    
    return report;
  }

  async close() {
    if (this.sourcePool) await this.sourcePool.end();
    if (this.targetPool) await this.targetPool.end();
  }
}

// Main execution
async function main() {
  const migration = new SelectiveMigration();
  
  try {
    console.log('🚀 Starting selective migration analysis...\n');
    
    await migration.initialize();
    
    // Analyze conflicts first
    const { conflicts, safeToMigrate } = await migration.analyzeTableConflicts();
    
    console.log('\n📋 MIGRATION PLAN SUMMARY:');
    console.log(`✅ Safe to migrate: ${safeToMigrate.length} tables`);
    console.log(`⚠️  Need manual review: ${conflicts.length} tables`);
    
    if (conflicts.length > 0) {
      console.log('\n⚠️  TABLES REQUIRING MANUAL REVIEW:');
      conflicts.forEach(conflict => {
        console.log(`   • ${conflict.table}: ${conflict.sourceRecords} → ${conflict.targetRecords} (existing)`);
      });
      console.log('\n❗ Please review these conflicts before proceeding with migration.');
      console.log('   Run with --force flag to proceed anyway (NOT RECOMMENDED).');
    }
    
    // Check if user wants to proceed
    const proceedWithSafe = process.argv.includes('--migrate-safe');
    const forceAll = process.argv.includes('--force');
    
    if (proceedWithSafe || forceAll) {
      console.log('\n🔄 PROCEEDING WITH MIGRATION...\n');
      
      const tablesToMigrate = forceAll ? 
        [...safeToMigrate, ...conflicts] : 
        safeToMigrate;
      
      for (const tableInfo of tablesToMigrate) {
        // Create backup if target has data
        if (tableInfo.targetRecords > 0) {
          await migration.createBackup(tableInfo.table);
        }
        
        // Migrate table
        await migration.migrateTable(tableInfo.table, 'REPLACE');
      }
      
      await migration.generateMigrationReport();
    } else {
      console.log('\n💡 TO PROCEED:');
      console.log('   • For safe migration only: node scripts/create-selective-migration.mjs --migrate-safe');
      console.log('   • For all tables (risky): node scripts/create-selective-migration.mjs --force');
    }
    
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

export default SelectiveMigration;
