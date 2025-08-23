#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

async function debugKnowledgeBaseSync() {
  console.log('🔍 Debugging Knowledge Base Sync Issue...\n');

  const connectionString = process.env.VIBEZS_DB || 'postgresql://auto_owner:npg_D3Jl1WbrfFpo@ep-mute-bar-a4hj4uo7-pooler.us-east-1.aws.neon.tech/auto?sslmode=require&channel_binding=require';
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Check all records in coding_progress table
    console.log('📊 All Coding Progress Records:');
    const allProgressResult = await client.query(`
      SELECT * FROM coding_progress ORDER BY last_updated DESC
    `);
    
    allProgressResult.rows.forEach((row, index) => {
      console.log(`\n   ${index + 1}. Record ID: ${row.id || 'N/A'}`);
      console.log(`      Overall Score: ${row.overall_score}%`);
      console.log(`      Total Attempts: ${row.total_attempts}`);
      console.log(`      Recent Improvement: ${row.recent_improvement}%`);
      console.log(`      Last Updated: ${row.last_updated}`);
      console.log(`      Principle Scores: ${JSON.stringify(row.principle_scores)}`);
      console.log(`      Category Scores Keys: ${Object.keys(row.category_scores || {}).length} categories`);
    });
    
    // Test the exact query used by the Knowledge Base
    console.log('\n🔍 Testing Knowledge Base Query:');
    const kbQueryResult = await client.query(`
      SELECT * FROM coding_progress 
      ORDER BY last_updated DESC 
      LIMIT 1
    `);
    
    if (kbQueryResult.rows.length > 0) {
      const row = kbQueryResult.rows[0];
      console.log('\n✅ Knowledge Base Query Result:');
      console.log(`   Overall Score: ${row.overall_score}%`);
      console.log(`   Total Attempts: ${row.total_attempts}`);
      console.log(`   Recent Improvement: ${row.recent_improvement}%`);
      console.log(`   Last Updated: ${row.last_updated}`);
      
      const result = {
        overallScore: parseFloat(row.overall_score),
        principleScores: row.principle_scores,
        categoryScores: row.category_scores,
        totalAttempts: row.total_attempts,
        recentImprovement: parseFloat(row.recent_improvement)
      };
      
      console.log('\n📋 Processed Result for Knowledge Base:');
      console.log(JSON.stringify(result, null, 2));
    }

    client.release();

  } catch (error) {
    console.error('❌ Error debugging knowledge base sync:', error);
  } finally {
    await pool.end();
  }
}

debugKnowledgeBaseSync();
