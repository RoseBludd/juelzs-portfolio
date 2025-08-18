#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function debugCursorMigration() {
  console.log('🔍 Debug Cursor Chat Migration\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Get one cursor chat from Supabase to debug
    console.log('📊 Getting sample cursor chat from Supabase...');
    
    const supabaseClient = new Client({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.fvbaytzkukfqfpwozbtm',
      password: 'S43TjpedayzcuzoT',
      ssl: false
    });
    
    await supabaseClient.connect();
    
    try {
      const sampleChat = await supabaseClient.query('SELECT * FROM cursor_chats LIMIT 1');
      
      if (sampleChat.rows.length > 0) {
        const chat = sampleChat.rows[0];
        console.log('📋 Sample cursor chat structure:');
        console.log(JSON.stringify(chat, null, 2));
        
        // Now try to insert this one chat into VIBEZS_DB
        console.log('\n🔄 Testing insertion into VIBEZS_DB...');
        
        const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
        await vibezClient.connect();
        
        try {
          console.log('✅ Connected to VIBEZS_DB');
          
          // Try the insertion with detailed error reporting
          try {
            await vibezClient.query(`
              INSERT INTO cursor_chats (
                id, developer_id, title, filename, content, 
                file_size, tags, project_context, metadata,
                upload_date, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              chat.id,
              chat.developer_id,
              chat.title,
              chat.filename,
              chat.content,
              chat.file_size,
              chat.tags,
              chat.project_context,
              chat.metadata,
              chat.upload_date,
              chat.created_at,
              chat.updated_at
            ]);
            
            console.log('✅ Successfully inserted sample cursor chat!');
            
            // Verify it's there
            const verify = await vibezClient.query('SELECT COUNT(*) as count FROM cursor_chats');
            console.log(`📊 Cursor chats in VIBEZS_DB: ${verify.rows[0].count}`);
            
          } catch (insertError) {
            console.log('❌ Insertion error details:');
            console.log(`   Error: ${insertError.message}`);
            console.log(`   Code: ${insertError.code}`);
            console.log(`   Detail: ${insertError.detail}`);
            console.log(`   Hint: ${insertError.hint}`);
            
            // Check if it's a foreign key issue
            if (insertError.message.includes('foreign key')) {
              console.log('\n🔍 Checking if developer_id exists:');
              const devCheck = await vibezClient.query(`
                SELECT id, name FROM developers WHERE id = $1
              `, [chat.developer_id]);
              
              if (devCheck.rows.length > 0) {
                console.log(`   ✅ Developer exists: ${devCheck.rows[0].name}`);
              } else {
                console.log(`   ❌ Developer not found: ${chat.developer_id}`);
              }
            }
          }
          
        } finally {
          await vibezClient.end();
        }
        
      } else {
        console.log('❌ No cursor chats found in Supabase');
      }
      
    } finally {
      await supabaseClient.end();
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugCursorMigration();
