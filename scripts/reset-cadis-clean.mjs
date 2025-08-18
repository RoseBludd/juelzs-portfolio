#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function cleanAndResetCADIS() {
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('🧹 Cleaning CADIS data...');
      await client.query('DELETE FROM cadis_journal_entries');
      await client.query(`DELETE FROM dreamstate_sessions WHERE created_by = 'CADIS_AI'`);
      console.log('✅ CADIS data cleaned');
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Failed to clean:', error);
  } finally {
    await pool.end();
  }
}

cleanAndResetCADIS();
