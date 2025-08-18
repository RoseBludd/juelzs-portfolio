#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function checkJournalSchema() {
  console.log('🔍 Checking Journal Entries Table Schema\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
    await vibezClient.connect();
    
    try {
      const schema = await vibezClient.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Journal Entries Table Schema:');
      schema.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
      });
      
    } finally {
      await vibezClient.end();
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error.message);
  }
}

checkJournalSchema();
