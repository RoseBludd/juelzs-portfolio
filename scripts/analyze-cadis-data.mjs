#!/usr/bin/env node

/**
 * Analyze database for CADIS-related data and structure
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

async function analyzeCadisData() {
  console.log('🧠 Analyzing CADIS Data in Database...\n');
  
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
      // Get all tables
      console.log('📊 Database Tables:');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      tablesResult.rows.forEach(row => {
        console.log(`   📋 ${row.table_name}`);
      });
      
      console.log('\n🔍 Module Registry Analysis:');
      try {
        const moduleCount = await client.query('SELECT COUNT(*) FROM module_registry');
        console.log(`   📦 Total modules: ${moduleCount.rows[0].count}`);
        
        const moduleTypes = await client.query(`
          SELECT type, COUNT(*) as count 
          FROM module_registry 
          GROUP BY type 
          ORDER BY count DESC
        `);
        
        console.log('   📊 Module types:');
        moduleTypes.rows.forEach(row => {
          console.log(`      ${row.type}: ${row.count}`);
        });
        
        const recentModules = await client.query(`
          SELECT name, type, created_at 
          FROM module_registry 
          ORDER BY created_at DESC 
          LIMIT 5
        `);
        
        console.log('   🕒 Recent modules:');
        recentModules.rows.forEach(row => {
          console.log(`      ${row.name} (${row.type}) - ${new Date(row.created_at).toLocaleDateString()}`);
        });
        
      } catch (error) {
        console.log('   ❌ Module registry not accessible:', error.message);
      }
      
      console.log('\n🧠 Journal Entries Analysis:');
      try {
        const journalCount = await client.query('SELECT COUNT(*) FROM journal_entries');
        console.log(`   📝 Total journal entries: ${journalCount.rows[0].count}`);
        
        const journalCategories = await client.query(`
          SELECT category, COUNT(*) as count 
          FROM journal_entries 
          GROUP BY category 
          ORDER BY count DESC
        `);
        
        console.log('   📊 Journal categories:');
        journalCategories.rows.forEach(row => {
          console.log(`      ${row.category}: ${row.count}`);
        });
        
        const privateEntries = await client.query('SELECT COUNT(*) FROM journal_entries WHERE is_private = true');
        console.log(`   🔒 Private entries: ${privateEntries.rows[0].count}`);
        
      } catch (error) {
        console.log('   ❌ Journal entries not accessible:', error.message);
      }
      
      console.log('\n🤖 AI Suggestions Analysis:');
      try {
        const aiCount = await client.query('SELECT COUNT(*) FROM ai_suggestions');
        console.log(`   🧠 Total AI suggestions: ${aiCount.rows[0].count}`);
        
        const aiTypes = await client.query(`
          SELECT type, COUNT(*) as count 
          FROM ai_suggestions 
          GROUP BY type 
          ORDER BY count DESC
        `);
        
        console.log('   📊 AI suggestion types:');
        aiTypes.rows.forEach(row => {
          console.log(`      ${row.type}: ${row.count}`);
        });
        
      } catch (error) {
        console.log('   ❌ AI suggestions not accessible:', error.message);
      }
      
      console.log('\n🔗 Project Links Analysis:');
      try {
        const linksCount = await client.query('SELECT COUNT(*) FROM project_journal_links');
        console.log(`   🔗 Project-journal links: ${linksCount.rows[0].count}`);
        
      } catch (error) {
        console.log('   ❌ Project links not accessible:', error.message);
      }
      
      console.log('\n💡 CADIS Journal Concept:');
      console.log('Based on the analysis, CADIS journal could track:');
      console.log('1. 📦 Module Registry Updates - New modules added by developers');
      console.log('2. 🔗 Repository Changes - New commits, branches, releases');
      console.log('3. 🧠 AI Decision Making - When CADIS makes recommendations');
      console.log('4. 🏗️ Architecture Insights - System evolution and patterns');
      console.log('5. 📊 Performance Metrics - System health and optimization');
      console.log('6. 🎯 Goal Achievement - Milestone tracking and progress');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error);
  } finally {
    await pool.end();
  }
}

analyzeCadisData();
