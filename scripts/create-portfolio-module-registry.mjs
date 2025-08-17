#!/usr/bin/env node

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('📦 CREATING PORTFOLIO MODULE REGISTRY');
console.log('====================================\n');

const SUPABASE_DB = process.env.SUPABASE_DB;
const VIBEZS_DB = process.env.VIBEZS_DB;

async function createPortfolioRegistry() {
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
    console.log('🔌 Connecting to databases...');
    const sourceClient = await sourcePool.connect();
    const targetClient = await targetPool.connect();
    
    try {
      // Get source data
      const sourceData = await sourceClient.query('SELECT * FROM module_registry');
      console.log(`📊 Source module_registry: ${sourceData.rows.length} records`);
      
      // Create portfolio-specific table name to avoid conflicts
      const portfolioTableName = 'portfolio_module_registry';
      
      console.log(`🏗️  Creating ${portfolioTableName} table...`);
      
      // Drop table if exists (safe since it's portfolio-specific)
      await targetClient.query(`DROP TABLE IF EXISTS ${portfolioTableName}`);
      
      // Create table with your application's expected structure
      await targetClient.query(`
        CREATE TABLE ${portfolioTableName} (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          module_count INTEGER DEFAULT 0,
          technologies JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'
        )
      `);
      console.log('✅ Portfolio table created');
      
      // Insert data from source
      console.log('📥 Inserting portfolio module data...');
      let insertedCount = 0;
      
      for (const row of sourceData.rows) {
        try {
          await targetClient.query(`
            INSERT INTO ${portfolioTableName} (
              id, name, type, description, category, module_count, 
              technologies, created_at, updated_at, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            row.id,
            row.name,
            row.type,
            row.description,
            row.category,
            row.module_count || 0,
            JSON.stringify(row.technologies || []),
            row.created_at,
            row.updated_at,
            JSON.stringify(row.metadata || {})
          ]);
          insertedCount++;
        } catch (error) {
          console.log(`   ⚠️  Failed to insert record ${row.id}: ${error.message}`);
        }
      }
      
      console.log(`✅ Inserted ${insertedCount} records into ${portfolioTableName}`);
      
      // Verify
      const finalCount = await targetClient.query(`SELECT COUNT(*) as count FROM ${portfolioTableName}`);
      console.log(`📊 Final count: ${finalCount.rows[0].count} records`);
      
      console.log('\n🎉 PORTFOLIO MODULE REGISTRY CREATED!');
      console.log(`   Table name: ${portfolioTableName}`);
      console.log('   This avoids conflicts with existing VIBEZS_DB module_registry');
      
    } finally {
      sourceClient.release();
      targetClient.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

createPortfolioRegistry().catch(console.error);
