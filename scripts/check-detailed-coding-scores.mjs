#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

async function checkDetailedScores() {
  console.log('🔍 Checking Detailed CADIS Coding Improvement Scores...\n');

  const connectionString = process.env.VIBEZS_DB || 'postgresql://auto_owner:npg_D3Jl1WbrfFpo@ep-mute-bar-a4hj4uo7-pooler.us-east-1.aws.neon.tech/auto?sslmode=require&channel_binding=require';
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Get the latest progress
    const progressResult = await client.query(`
      SELECT * FROM coding_progress ORDER BY last_updated DESC LIMIT 1
    `);
    
    if (progressResult.rows.length > 0) {
      const progress = progressResult.rows[0];
      
      console.log('📊 CADIS Coding Progress (Latest):');
      console.log(`   🏆 Overall Score: ${progress.overall_score}%`);
      console.log(`   📈 Total Attempts: ${progress.total_attempts}`);
      console.log(`   🚀 Recent Improvement: +${progress.recent_improvement}%`);
      console.log(`   📅 Last Updated: ${progress.last_updated}`);
      
      console.log('\n🎯 Principle Scores:');
      if (progress.principle_scores) {
        const principles = progress.principle_scores;
        console.log(`   - Execution-Led: ${principles.executionLed || 'N/A'}%`);
        console.log(`   - Modularity: ${principles.modularity || 'N/A'}%`);
        console.log(`   - Reusability: ${principles.reusability || 'N/A'}%`);
        console.log(`   - Progressive Enhancement: ${principles.progressiveEnhancement || 'N/A'}%`);
      } else {
        console.log('   ❌ No principle scores found');
      }
      
      console.log('\n🏗️ Category Scores:');
      if (progress.category_scores) {
        const categories = progress.category_scores;
        Object.entries(categories).forEach(([category, score]) => {
          console.log(`   - ${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${score}%`);
        });
      } else {
        console.log('   ❌ No category scores found');
      }
      
    } else {
      console.log('❌ No coding progress found in database');
    }
    
    // Get recent attempts to see the data structure
    console.log('\n🔍 Recent Coding Attempts (Last 5):');
    const attemptsResult = await client.query(`
      SELECT ca.*, cs.title, cs.category 
      FROM coding_attempts ca
      JOIN coding_scenarios cs ON ca.scenario_id = cs.id
      ORDER BY ca.completed_at DESC 
      LIMIT 5
    `);
    
    attemptsResult.rows.forEach((attempt, index) => {
      console.log(`\n   ${index + 1}. ${attempt.title} (${attempt.category})`);
      console.log(`      Score: ${attempt.score}%`);
      console.log(`      Agent: ${attempt.agent_version}`);
      console.log(`      Completed: ${attempt.completed_at}`);
      
      if (attempt.principle_adherence) {
        console.log(`      Principles: ${JSON.stringify(attempt.principle_adherence)}`);
      }
    });

    client.release();

  } catch (error) {
    console.error('❌ Error checking detailed scores:', error);
  } finally {
    await pool.end();
  }
}

checkDetailedScores();
