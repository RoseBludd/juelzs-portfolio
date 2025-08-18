#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function fixCursorTableSchema() {
  console.log('🔧 Fixing cursor_chats Table Schema\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
    await vibezClient.connect();
    
    try {
      console.log('📊 Recreating cursor_chats table with correct schema...');
      
      // Drop existing table
      await vibezClient.query('DROP TABLE IF EXISTS cursor_chats CASCADE');
      console.log('🗑️ Dropped existing cursor_chats table');
      
      // Create with correct schema matching Supabase
      await vibezClient.query(`
        CREATE TABLE cursor_chats (
          id UUID PRIMARY KEY,
          developer_id UUID REFERENCES developers(id),
          title VARCHAR(255),
          filename VARCHAR(255),
          content TEXT,
          file_size INTEGER,
          tags TEXT[],
          project_context VARCHAR(255),
          metadata JSONB,
          upload_date TIMESTAMP WITHOUT TIME ZONE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ cursor_chats table created with correct schema');
      
      // Verify table structure
      const schema = await vibezClient.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'cursor_chats'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📊 Verified table schema:');
      schema.rows.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type})`);
      });
      
    } finally {
      await vibezClient.end();
    }
    
    console.log('\n✅ Table schema fix complete!');
    console.log('🎯 Ready for cursor chat migration');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
  }
}

fixCursorTableSchema();
