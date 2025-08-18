#!/usr/bin/env node

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use direct database connection instead of importing TypeScript services
import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Load environment variables
dotenv.config();

async function analyzeDeveloperData() {
  console.log('🔍 Analyzing Developer Table Data and CADIS Integration...\n');
  
  try {
    // Use VIBEZS_DB connection where the developers are
    const connectionString = process.env.VIBEZS_DB;
    
    if (!connectionString) {
      console.log('❌ VIBEZS_DB environment variable not found');
      return;
    }
    
    // Temporarily disable SSL verification for development
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    const client = await pool.connect();
    
    try {
      // Check if developer table exists and examine its structure
      console.log('📊 Developer Table Structure:');
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'developers'
        ORDER BY ordinal_position
      `);
      
      if (tableInfo.rows.length === 0) {
        console.log('❌ Developer table does not exist yet');
        return;
      }
      
      console.table(tableInfo.rows);
      
      // Check current developer data
      console.log('\n👥 Current Developer Data:');
      // Get total count first
      const totalCount = await client.query(`SELECT COUNT(*) as total_count FROM developers`);
      console.log(`\n👥 Total Developers: ${totalCount.rows[0].total_count}`);
      
      const developers = await client.query(`
        SELECT * FROM developers 
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      if (developers.rows.length === 0) {
        console.log('📝 No developer data found in table');
      } else {
        console.log(`Found ${developers.rows.length} developers:`);
        developers.rows.forEach(dev => {
          console.log(`\n🧑‍💻 Developer: ${dev.name || dev.email || dev.id}`);
          console.log(`   Email: ${dev.email || 'N/A'}`);
          console.log(`   GitHub: ${dev.github_username || 'N/A'}`);
          console.log(`   Skills: ${dev.skills ? JSON.stringify(dev.skills) : 'N/A'}`);
          console.log(`   Projects: ${dev.projects ? JSON.stringify(dev.projects) : 'N/A'}`);
          console.log(`   Performance: ${dev.performance_metrics ? JSON.stringify(dev.performance_metrics) : 'N/A'}`);
          console.log(`   Created: ${dev.created_at}`);
        });
      }
      
      // Check for any tasks table that might be related
      console.log('\n🔍 Checking for related tables (tasks, repositories):');
      const relatedTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('tasks', 'repositories', 'developer_repositories', 'github_repositories')
      `);
      
      console.log('Related tables found:', relatedTables.rows.map(r => r.table_name));
      
      // Test CADIS developer analysis by calling the API
      console.log('\n🧠 Testing CADIS Developer Analysis via API...');
      
      try {
        // Check if we can run the developer analysis query directly
        const developerAnalysisQuery = `
          SELECT 
            d.id,
            d.name,
            d.email,
            d.github_url,
            d.skills,
            d.preferred_technologies,
            d.role,
            d.status,
            d.years_experience,
            d.hourly_rate,

            d.progression_stage,
            d.created_at,
            d.updated_at
          FROM developers d
          ORDER BY d.created_at DESC
          LIMIT 10
        `;
        
        const analysisData = await client.query(developerAnalysisQuery);
        console.log(`📊 Found ${analysisData.rows.length} developers for analysis`);
        
        if (analysisData.rows.length > 0) {
          console.log('\n🔍 Developer Analysis Data:');
          analysisData.rows.forEach((dev, idx) => {
            console.log(`\n👤 Developer ${idx + 1}:`);
            console.log(`   ID: ${dev.id}`);
            console.log(`   Name: ${dev.name || 'N/A'}`);
            console.log(`   Email: ${dev.email || 'N/A'}`);
            console.log(`   GitHub: ${dev.github_url || 'N/A'}`);
            console.log(`   Role: ${dev.role || 'N/A'}`);
            console.log(`   Status: ${dev.status || 'N/A'}`);
            console.log(`   Experience: ${dev.years_experience || 'N/A'} years`);
            console.log(`   Skills: ${dev.skills ? (typeof dev.skills === 'string' ? dev.skills : JSON.stringify(dev.skills)) : 'N/A'}`);
            console.log(`   Technologies: ${dev.preferred_technologies ? (typeof dev.preferred_technologies === 'string' ? dev.preferred_technologies : JSON.stringify(dev.preferred_technologies)) : 'N/A'}`);

            console.log(`   Progression: ${dev.progression_stage || 'N/A'}`);
          });
        }
        
      } catch (error) {
        console.log('⚠️ Developer analysis query failed:', error.message);
      }
      
      // Check for GitHub repository connections
      console.log('\n🔗 Checking GitHub Repository Connections...');
      try {
        const repoConnections = await client.query(`
          SELECT 
            d.name as developer_name,
            d.github_url,
            d.skills,
            d.preferred_technologies,

            d.progression_stage,
            d.status
          FROM developers d
          WHERE d.github_url IS NOT NULL OR d.skills IS NOT NULL
          ORDER BY d.created_at DESC
          LIMIT 20
        `);
        
        if (repoConnections.rows.length > 0) {
          console.log('GitHub connections found:');
          console.table(repoConnections.rows);
        } else {
          console.log('No GitHub repository connections found');
        }
        
      } catch (error) {
        console.log('⚠️ GitHub connection check failed:', error.message);
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
    console.log('\n✅ Developer data analysis complete!');
    
  } catch (error) {
    console.error('❌ Error analyzing developer data:', error);
  }
}

// Run the analysis
analyzeDeveloperData().catch(console.error);
