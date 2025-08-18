#!/usr/bin/env node

/**
 * Test privacy update functionality
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

async function testPrivacyUpdate() {
  console.log('🧪 Testing Privacy Update Functionality...\n');
  
  if (!process.env.VIBEZS_DB) {
    console.error('❌ VIBEZS_DB environment variable not found');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      // Get a sample entry to test with
      const sampleQuery = 'SELECT id, title, is_private FROM journal_entries LIMIT 1';
      const sampleResult = await client.query(sampleQuery);
      
      if (sampleResult.rows.length === 0) {
        console.log('❌ No journal entries found to test with');
        return;
      }
      
      const testEntry = sampleResult.rows[0];
      console.log(`📝 Testing with entry: "${testEntry.title}"`);
      console.log(`🔒 Current privacy state: ${testEntry.is_private ? 'Private' : 'Public'}`);
      
      // Test updating privacy
      const newPrivacyState = !testEntry.is_private;
      console.log(`🔄 Updating to: ${newPrivacyState ? 'Private' : 'Public'}`);
      
      const updateQuery = `
        UPDATE journal_entries 
        SET is_private = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, title, is_private
      `;
      
      const updateResult = await client.query(updateQuery, [
        newPrivacyState,
        new Date(),
        testEntry.id
      ]);
      
      if (updateResult.rows.length > 0) {
        const updated = updateResult.rows[0];
        console.log(`✅ Update successful!`);
        console.log(`🔒 New privacy state: ${updated.is_private ? 'Private' : 'Public'}`);
        
        // Verify the change persisted
        const verifyQuery = 'SELECT id, title, is_private FROM journal_entries WHERE id = $1';
        const verifyResult = await client.query(verifyQuery, [testEntry.id]);
        
        if (verifyResult.rows.length > 0) {
          const verified = verifyResult.rows[0];
          if (verified.is_private === newPrivacyState) {
            console.log('✅ Privacy update persisted correctly');
          } else {
            console.log('❌ Privacy update did not persist');
          }
        }
        
        // Restore original state
        await client.query(updateQuery, [
          testEntry.is_private,
          new Date(),
          testEntry.id
        ]);
        console.log('🔄 Restored original privacy state');
        
      } else {
        console.log('❌ Update failed - no rows returned');
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testPrivacyUpdate();
