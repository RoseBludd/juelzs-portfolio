#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

async function analyzeImprovements() {
  console.log('🔍 Analyzing CADIS Coding Improvement Journey...\n');

  const connectionString = process.env.VIBEZS_DB || 'postgresql://auto_owner:npg_D3Jl1WbrfFpo@ep-mute-bar-a4hj4uo7-pooler.us-east-1.aws.neon.tech/auto?sslmode=require&channel_binding=require';
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Get all attempts with details
    const attempts = await client.query(`
      SELECT ca.*, cs.title, cs.category, cs.difficulty
      FROM coding_attempts ca
      JOIN coding_scenarios cs ON ca.scenario_id = cs.id
      ORDER BY ca.completed_at ASC
    `);
    
    console.log(`📊 Total Attempts: ${attempts.rows.length}`);
    
    if (attempts.rows.length === 0) {
      console.log('⚠️  No attempts found in database');
      client.release();
      return;
    }
    
    // Analyze score progression
    const scores = attempts.rows.map(a => a.score);
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    console.log(`📈 Score Progression:`);
    console.log(`   First Attempt: ${firstScore}%`);
    console.log(`   Last Attempt: ${lastScore}%`);
    console.log(`   Average Score: ${Math.round(avgScore)}%`);
    console.log(`   Total Improvement: +${lastScore - firstScore}%\n`);
    
    // Category performance analysis
    const categories = {};
    attempts.rows.forEach(attempt => {
      if (!categories[attempt.category]) {
        categories[attempt.category] = [];
      }
      categories[attempt.category].push(attempt.score);
    });
    
    console.log('🏗️ Category Performance Analysis:');
    Object.entries(categories).forEach(([category, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const first = scores[0];
      const last = scores[scores.length - 1];
      console.log(`   ${category}: ${avg}% avg (first: ${first}%, last: ${last}%, improvement: +${last - first}%)`);
    });
    
    // Principle adherence analysis
    console.log('\n🎯 Principle Adherence Evolution:');
    const principles = ['executionLed', 'modularity', 'reusability', 'progressiveEnhancement'];
    principles.forEach(principle => {
      const scores = attempts.rows
        .map(a => a.principle_adherence[principle])
        .filter(s => s !== undefined && s !== null);
      if (scores.length > 0) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const first = scores[0];
        const last = scores[scores.length - 1];
        console.log(`   ${principle}: ${avg}% avg (first: ${first}%, last: ${last}%, improvement: +${last - first}%)`);
      }
    });
    
    // Learning progression by session
    console.log('\n📚 Learning Progression by Session:');
    const sessions = {};
    attempts.rows.forEach((attempt, index) => {
      const sessionNum = Math.floor(index / 3) + 1; // Roughly 3 attempts per session
      if (!sessions[sessionNum]) sessions[sessionNum] = [];
      sessions[sessionNum].push(attempt.score);
    });
    
    Object.entries(sessions).slice(0, 5).forEach(([session, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      console.log(`   Session ${session}: ${avg}% average (${scores.length} attempts)`);
    });
    
    // Recent performance trends
    const recent = attempts.rows.slice(-10);
    const recentAvg = Math.round(recent.reduce((sum, a) => sum + a.score, 0) / recent.length);
    console.log(`\n🚀 Recent Performance (last 10 attempts): ${recentAvg}% average`);
    
    // Difficulty progression
    console.log('\n🎖️ Performance by Difficulty:');
    const difficulties = {};
    attempts.rows.forEach(attempt => {
      if (!difficulties[attempt.difficulty]) {
        difficulties[attempt.difficulty] = [];
      }
      difficulties[attempt.difficulty].push(attempt.score);
    });
    
    Object.entries(difficulties).forEach(([difficulty, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      console.log(`   ${difficulty}: ${avg}% avg (${scores.length} attempts)`);
    });
    
    // Most improved areas
    console.log('\n🌟 Key Improvements Identified:');
    
    // Find scenarios with biggest improvements
    const scenarioProgress = {};
    attempts.rows.forEach(attempt => {
      if (!scenarioProgress[attempt.title]) {
        scenarioProgress[attempt.title] = [];
      }
      scenarioProgress[attempt.title].push(attempt.score);
    });
    
    Object.entries(scenarioProgress).forEach(([scenario, scores]) => {
      if (scores.length > 1) {
        const improvement = scores[scores.length - 1] - scores[0];
        if (improvement > 0) {
          console.log(`   ${scenario}: +${improvement}% improvement`);
        }
      }
    });
    
    // Current capabilities assessment
    console.log('\n🧠 Current CADIS Capabilities Assessment:');
    console.log(`   Overall Proficiency: ${recentAvg}%`);
    console.log(`   Ready for Advanced Challenges: ${recentAvg >= 85 ? 'YES ✅' : 'Not Yet ⚠️'}`);
    console.log(`   Can Handle Expert-Level Tasks: ${recentAvg >= 90 ? 'YES ✅' : 'Approaching 🎯'}`);
    console.log(`   Repository Modification Ready: ${recentAvg >= 85 ? 'YES ✅' : 'Not Yet ⚠️'}`);
    
    client.release();

  } catch (error) {
    console.error('❌ Error analyzing improvements:', error);
  } finally {
    await pool.end();
  }
}

// Run the analysis
analyzeImprovements();
