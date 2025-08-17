#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🛡️  PORTFOLIO MIGRATION');
console.log('======================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

console.log(`Source DB: ${SUPABASE_DB ? 'Connected' : 'Missing'}`);
console.log(`Target DB: ${VIBEZS_DB ? 'Connected' : 'Missing'}\n`);

if (!SUPABASE_DB || !VIBEZS_DB) {
  console.log('❌ Environment variables missing');
  process.exit(1);
}

// Portfolio tables to migrate
const TABLES = [
  'journal_entries',
  'ai_suggestions', 
  'project_journal_links',
  'reminders'
];

async function migrate() {
  // Temporarily disable SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const sourcePool = new Pool({
    connectionString: SUPABASE_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  const targetPool = new Pool({
    connectionString: VIBEZS_DB,
    max: 1,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Testing connections...');
    await sourcePool.query('SELECT 1');
    await targetPool.query('SELECT 1');
    console.log('✅ Both databases connected\n');

    let totalMigrated = 0;

    for (const tableName of TABLES) {
      console.log(`📦 Migrating ${tableName}...`);
      
      const sourceClient = await sourcePool.connect();
      const targetClient = await targetPool.connect();
      
      try {
        // Check if source table exists and has data
        const sourceExists = await sourceClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tableName]);
        
        if (!sourceExists.rows[0].exists) {
          console.log(`   ⚠️  Table not found in source`);
          continue;
        }
        
        const sourceData = await sourceClient.query(`SELECT * FROM "${tableName}"`);
        console.log(`   📊 Source records: ${sourceData.rows.length}`);
        
        if (sourceData.rows.length === 0) {
          console.log(`   ⚠️  No data to migrate`);
          continue;
        }
        
        // Check target table
        const targetExists = await targetClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tableName]);
        
        if (targetExists.rows[0].exists) {
          const targetCount = await targetClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          console.log(`   📊 Target records: ${targetCount.rows[0].count}`);
          
          // Clear existing data
          await targetClient.query(`DELETE FROM "${tableName}"`);
          console.log(`   🗑️  Cleared target table`);
        } else {
          console.log(`   🏗️  Creating table in target...`);
          
          // Get CREATE TABLE statement from source
          const columns = await sourceClient.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName]);
          
          let createSQL = `CREATE TABLE "${tableName}" (\n`;
          const colDefs = columns.rows.map(col => {
            let def = `  "${col.column_name}" `;
            
            // Handle specific data types properly
            if (col.data_type === 'character varying') {
              def += 'VARCHAR(255)';
            } else if (col.data_type === 'timestamp with time zone') {
              def += 'TIMESTAMPTZ';
            } else if (col.data_type === 'timestamp without time zone') {
              def += 'TIMESTAMP';
            } else if (col.data_type === 'jsonb') {
              def += 'JSONB';
            } else if (col.data_type === 'text') {
              def += 'TEXT';
            } else if (col.data_type === 'integer') {
              def += 'INTEGER';
            } else if (col.data_type === 'boolean') {
              def += 'BOOLEAN';
            } else {
              def += col.data_type.toUpperCase();
            }
            
            if (col.is_nullable === 'NO') def += ' NOT NULL';
            if (col.column_default && !col.column_default.includes('nextval') && !col.column_default.includes('gen_random_uuid')) {
              def += ` DEFAULT ${col.column_default}`;
            }
            return def;
          });
          createSQL += colDefs.join(',\n') + '\n);';
          
          await targetClient.query(createSQL);
          console.log(`   ✅ Table created`);
        }
        
        // Insert data
        const firstRow = sourceData.rows[0];
        const columnList = Object.keys(firstRow).map(key => `"${key}"`).join(', ');
        
        for (const row of sourceData.rows) {
          const values = Object.values(row).map(val => {
            // Handle JSON/JSONB columns by stringifying objects/arrays
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
            }
            return val;
          });
          const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
          
          await targetClient.query(
            `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
            values
          );
        }
        
        console.log(`   ✅ Migrated ${sourceData.rows.length} records`);
        totalMigrated += sourceData.rows.length;
        
      } catch (error) {
        console.error(`   ❌ Error migrating ${tableName}:`, error.message);
      } finally {
        sourceClient.release();
        targetClient.release();
      }
    }
    
    console.log(`\n🎉 MIGRATION COMPLETE!`);
    console.log(`📦 Total records migrated: ${totalMigrated}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

migrate().catch(console.error);
