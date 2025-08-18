#!/usr/bin/env node
import dotenv from 'dotenv';

dotenv.config();

async function testFeaturedContent() {
  console.log('🌟 Testing Featured Content in Public Insights\n');
  
  try {
    // Test the public API to see if philosophical alignment is featured
    const response = await fetch('http://localhost:3000/api/journal/public?limit=10');
    
    if (!response.ok) {
      console.log('❌ API not responding - development server may not be running');
      console.log('   Please start with: npm run dev');
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.entries) {
      console.log(`📊 Found ${data.entries.length} public entries`);
      
      console.log('\n📋 Entry Order (should show featured first):');
      data.entries.forEach((entry, index) => {
        const isFeatured = entry.title.includes('Philosophical Alignment Analysis');
        const indicator = isFeatured ? '⭐ FEATURED' : '  ';
        console.log(`${index + 1}. ${indicator} "${entry.title}"`);
        console.log(`      Category: ${entry.category}`);
        console.log(`      Created: ${new Date(entry.createdAt).toLocaleDateString()}`);
        console.log('');
      });
      
      // Check if philosophical alignment is first
      const firstEntry = data.entries[0];
      if (firstEntry.title.includes('Philosophical Alignment Analysis')) {
        console.log('✅ SUCCESS: Philosophical Alignment Analysis is featured first!');
        console.log('   Title:', firstEntry.title);
        console.log('   Category:', firstEntry.category);
        console.log('   Will display with featured indicator and special styling');
      } else {
        console.log('❌ Featured content not first. Current first entry:');
        console.log('   Title:', firstEntry.title);
        console.log('   Category:', firstEntry.category);
      }
      
      // Check strategic categories
      const strategicEntries = data.entries.filter(entry => 
        entry.category === 'Strategic Philosophy' || entry.category === 'Leadership Self-Discovery'
      );
      
      console.log(`\n🧠 Strategic Content Visibility:`);
      console.log(`   Strategic/Leadership entries visible: ${strategicEntries.length}`);
      strategicEntries.forEach(entry => {
        console.log(`   • "${entry.title}" (${entry.category})`);
      });
      
      // Show stats
      if (data.stats) {
        console.log('\n📊 Public Insights Stats:');
        console.log('   Total public entries:', data.stats.totalPublicEntries);
        console.log('   Category breakdown:');
        Object.entries(data.stats.categoryCounts).forEach(([category, count]) => {
          console.log(`     ${category}: ${count}`);
        });
      }
      
    } else {
      console.log('❌ No entries returned from API');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n💡 If connection refused, start development server with: npm run dev');
  }
}

testFeaturedContent();
