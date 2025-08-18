#!/usr/bin/env node

/**
 * Add is_private column to journal_entries table
 */

import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

async function addPrivacyColumn() {
  console.log('🔧 Adding is_private column to journal_entries table...');
  
  // Check if VIBEZS_DB is available
  if (!process.env.VIBEZS_DB) {
    console.error('❌ VIBEZS_DB environment variable not found');
    console.log('💡 Make sure you have VIBEZS_DB set in your .env file');
    process.exit(1);
  }
  
  console.log('📡 Connecting to database...');
  
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      // Check if column already exists
      const checkQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries' 
        AND column_name = 'is_private'
      `;
      
      const checkResult = await client.query(checkQuery);
      
      if (checkResult.rows.length > 0) {
        console.log('✅ Column is_private already exists');
        return;
      }
      
      // Add the column
      const alterQuery = `
        ALTER TABLE journal_entries 
        ADD COLUMN is_private BOOLEAN DEFAULT FALSE
      `;
      
      await client.query(alterQuery);
      
      console.log('✅ Successfully added is_private column to journal_entries table');
      
      // Update existing entries to be public by default
      const updateQuery = `
        UPDATE journal_entries 
        SET is_private = FALSE 
        WHERE is_private IS NULL
      `;
      
      const updateResult = await client.query(updateQuery);
      console.log(`✅ Updated ${updateResult.rowCount} existing entries to be public by default`);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error adding privacy column:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
addPrivacyColumn().then(() => {
  console.log('🎉 Database migration completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
