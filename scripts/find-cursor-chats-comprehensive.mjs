#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function findCursorChatsComprehensive() {
  console.log('💬 Comprehensive Cursor Chat Search\n');
  console.log('Searching both VIBEZS_DB and SUPABASE_DB for cursor chat data\n');
  
  try {
    // 1. Check VIBEZS_DB first
    console.log('🔍 Checking VIBEZS_DB for cursor chats:');
    console.log('=' .repeat(50));
    
    if (process.env.VIBEZS_DB) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const vibezPool = new Pool({ connectionString: process.env.VIBEZS_DB });
      const vibezClient = await vibezPool.connect();
      
      try {
        // Check for any tables that might contain cursor/chat data
        const chatTables = await vibezClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND (
            table_name ILIKE '%cursor%' 
            OR table_name ILIKE '%chat%'
            OR table_name ILIKE '%message%'
            OR table_name ILIKE '%conversation%'
            OR table_name ILIKE '%session%'
            OR table_name ILIKE '%log%'
          )
          ORDER BY table_name
        `);
        
        console.log(`📋 Found ${chatTables.rows.length} potential chat-related tables:`);
        
        for (const table of chatTables.rows) {
          console.log(`\n📋 Table: ${table.table_name}`);
          
          try {
            const count = await vibezClient.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            console.log(`   📊 Records: ${count.rows[0].count}`);
            
            if (parseInt(count.rows[0].count) > 0) {
              // Get schema
              const schema = await vibezClient.query(`
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
              `, [table.table_name]);
              
              console.log('   📊 Columns:');
              schema.rows.forEach(col => {
                console.log(`     ${col.column_name} (${col.data_type})`);
              });
              
              // Get sample data
              const sample = await vibezClient.query(`SELECT * FROM ${table.table_name} ORDER BY created_at DESC LIMIT 2`);
              if (sample.rows.length > 0) {
                console.log('   📋 Sample data:');
                sample.rows.forEach((row, i) => {
                  console.log(`     ${i + 1}. ${JSON.stringify(row, null, 2).substring(0, 200)}...`);
                });
              }
            }
          } catch (error) {
            console.log(`   ❌ Error accessing table: ${error.message}`);
          }
        }
        
      } finally {
        vibezClient.release();
        await vibezPool.end();
      }
    } else {
      console.log('❌ VIBEZS_DB not configured');
    }
    
    // 2. Check SUPABASE_DB
    console.log('\n🔍 Checking SUPABASE_DB for cursor chats:');
    console.log('=' .repeat(50));
    
    if (process.env.SUPABASE_DB) {
      const supabasePool = new Pool({ connectionString: process.env.SUPABASE_DB });
      const supabaseClient = await supabasePool.connect();
      
      try {
        // Check for chat-related tables in Supabase
        const supabaseChatTables = await supabaseClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND (
            table_name ILIKE '%cursor%' 
            OR table_name ILIKE '%chat%'
            OR table_name ILIKE '%message%'
            OR table_name ILIKE '%conversation%'
            OR table_name ILIKE '%ai%'
            OR table_name ILIKE '%prompt%'
            OR table_name ILIKE '%interaction%'
          )
          ORDER BY table_name
        `);
        
        console.log(`📋 Found ${supabaseChatTables.rows.length} potential chat-related tables in Supabase:`);
        
        for (const table of supabaseChatTables.rows) {
          console.log(`\n📋 Supabase Table: ${table.table_name}`);
          
          try {
            const count = await supabaseClient.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
            console.log(`   📊 Records: ${count.rows[0].count}`);
            
            if (parseInt(count.rows[0].count) > 0) {
              // Get schema
              const schema = await supabaseClient.query(`
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
              `, [table.table_name]);
              
              console.log('   📊 Columns:');
              schema.rows.forEach(col => {
                console.log(`     ${col.column_name} (${col.data_type})`);
              });
              
              // Get sample data
              const sample = await supabaseClient.query(`SELECT * FROM ${table.table_name} ORDER BY created_at DESC LIMIT 2`);
              if (sample.rows.length > 0) {
                console.log('   📋 Sample data:');
                sample.rows.forEach((row, i) => {
                  console.log(`     ${i + 1}. ${JSON.stringify(row, null, 2).substring(0, 200)}...`);
                });
              }
            }
          } catch (error) {
            console.log(`   ❌ Error accessing Supabase table: ${error.message}`);
          }
        }
        
      } finally {
        supabaseClient.release();
        await supabasePool.end();
      }
    } else {
      console.log('❌ SUPABASE_DB not configured');
    }
    
    // 3. Check for alternative cursor data sources
    console.log('\n🔍 Checking for alternative cursor data sources:');
    console.log('=' .repeat(55));
    
    // Check environment variables for cursor-related configs
    const cursorEnvVars = Object.keys(process.env).filter(key => 
      key.toLowerCase().includes('cursor') ||
      key.toLowerCase().includes('chat') ||
      key.toLowerCase().includes('ai') ||
      key.toLowerCase().includes('openai')
    );
    
    console.log('🔑 Cursor/AI-related environment variables:');
    cursorEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
      }
    });
    
    // Check for cursor workspace files
    console.log('\n📁 Checking for cursor workspace data:');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const workspacePath = 'C:\\Users\\GENIUS\\developer-workspace';
    const cursorPaths = [
      path.join(workspacePath, '.cursor'),
      path.join(workspacePath, '.vscode'),
      'C:\\Users\\GENIUS\\.cursor',
      'C:\\Users\\GENIUS\\AppData\\Roaming\\Cursor',
      'C:\\Users\\GENIUS\\AppData\\Local\\Cursor'
    ];
    
    for (const cursorPath of cursorPaths) {
      if (fs.existsSync(cursorPath)) {
        console.log(`   ✅ Found cursor data at: ${cursorPath}`);
        
        try {
          const items = fs.readdirSync(cursorPath);
          console.log(`     📁 Contains: ${items.slice(0, 5).join(', ')}${items.length > 5 ? '...' : ''}`);
          
          // Look for chat/log files
          const chatFiles = items.filter(item => 
            item.includes('chat') || 
            item.includes('log') || 
            item.includes('session') ||
            item.includes('history')
          );
          
          if (chatFiles.length > 0) {
            console.log(`     💬 Chat-related files: ${chatFiles.join(', ')}`);
          }
        } catch (err) {
          console.log(`     ❌ Cannot read directory: ${err.message}`);
        }
      }
    }
    
    console.log('\n✅ Comprehensive Cursor Chat Search Complete!');
    console.log('🎯 This reveals where cursor chat data might be stored');
    
  } catch (error) {
    console.error('❌ Error in comprehensive search:', error);
  }
}

findCursorChatsComprehensive();
