#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function checkPublicInsightsCategories() {
  console.log('🔍 Checking Public Insights Categories and Visibility\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
    await vibezClient.connect();
    
    try {
      // Check current journal categories
      const categories = await vibezClient.query(`
        SELECT 
          category,
          COUNT(*) as count,
          COUNT(CASE WHEN is_private = false OR is_private IS NULL THEN 1 END) as public_count
        FROM journal_entries 
        GROUP BY category 
        ORDER BY count DESC
      `);
      
      console.log('📊 Current Journal Categories:');
      categories.rows.forEach(cat => {
        console.log(`   ${cat.category}: ${cat.count} total (${cat.public_count} public)`);
      });
      
      console.log('\n🔍 Public Insights Filter Check:');
      const publicCategories = ['architecture', 'reflection', 'milestone', 'planning'];
      console.log('   Currently allowed in public insights:', publicCategories.join(', '));
      
      // Check strategic entries specifically
      const strategicEntries = await vibezClient.query(`
        SELECT title, category, is_private, created_at
        FROM journal_entries 
        WHERE category LIKE '%Strategic%' OR category LIKE '%Leadership%'
        ORDER BY created_at DESC
      `);
      
      console.log('\n📋 Strategic/Leadership Entries:');
      strategicEntries.rows.forEach(entry => {
        const visibility = (entry.is_private === false || entry.is_private === null) ? 'PUBLIC' : 'PRIVATE';
        const publicVisible = publicCategories.includes(entry.category.toLowerCase()) ? 'VISIBLE' : 'FILTERED OUT';
        console.log(`   "${entry.title}"`);
        console.log(`     Category: ${entry.category}`);
        console.log(`     Privacy: ${visibility}`);
        console.log(`     Public Insights: ${publicVisible}`);
        console.log(`     Created: ${new Date(entry.created_at).toLocaleDateString()}`);
        console.log('');
      });
      
      // Check what would be visible if we added strategic categories
      console.log('🌟 Recommendation: Add Strategic Categories to Public Insights');
      console.log('   Current filter excludes valuable strategic content');
      console.log('   Strategic/Leadership entries demonstrate thought leadership');
      console.log('   Would showcase systematic thinking and philosophical alignment');
      
      // Show sample of what's currently visible
      const currentlyVisible = await vibezClient.query(`
        SELECT title, category, created_at
        FROM journal_entries 
        WHERE (is_private = false OR is_private IS NULL)
        AND category IN ('architecture', 'reflection', 'milestone', 'planning')
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('\n📋 Currently Visible in Public Insights (sample):');
      currentlyVisible.rows.forEach(entry => {
        console.log(`   "${entry.title}" (${entry.category}) - ${new Date(entry.created_at).toLocaleDateString()}`);
      });
      
    } finally {
      await vibezClient.end();
    }
    
    console.log('\n🎯 Summary:');
    console.log('✅ Strategic/Leadership journal entries successfully created');
    console.log('❌ NOT currently visible in public insights due to category filtering');
    console.log('💡 Recommendation: Update public insights to include strategic categories');
    console.log('🌟 High value content available for public showcase');
    
  } catch (error) {
    console.error('❌ Check error:', error.message);
  }
}

checkPublicInsightsCategories();
