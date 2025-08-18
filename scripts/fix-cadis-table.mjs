#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function fixCADISTable() {
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('🔧 Fixing CADIS journal table...');
      
      // Drop and recreate with TEXT columns for JSON
      await client.query('DROP TABLE IF EXISTS cadis_journal_entries');
      
      await client.query(`
        CREATE TABLE cadis_journal_entries (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(50) NOT NULL,
          source VARCHAR(50) NOT NULL,
          source_id VARCHAR(255),
          confidence INTEGER DEFAULT 50,
          impact VARCHAR(20) DEFAULT 'medium',
          tags TEXT DEFAULT '[]',
          related_entities TEXT DEFAULT '{}',
          cadis_metadata TEXT DEFAULT '{}',
          is_private BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ CADIS table fixed with TEXT JSON columns');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Failed to fix table:', error);
  } finally {
    await pool.end();
  }
}

fixCADISTable();
