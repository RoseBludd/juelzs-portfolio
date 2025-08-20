#!/usr/bin/env node

/**
 * Test CADIS Journal Analysis Feature
 * Tests the new admin/journal CADIS Analysis tab and dream generation
 */

async function testCADISJournalAnalysis() {
  console.log('🧠 Testing CADIS Journal Analysis Feature');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: Check if CADIS Analysis API endpoint works
    console.log('📋 Testing CADIS Analysis API endpoint...');
    
    const analysisResponse = await fetch('http://localhost:3000/api/admin/journal/cadis-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!analysisResponse.ok) {
      console.log(`❌ CADIS Analysis API Error: ${analysisResponse.status}`);
    } else {
      const analysisData = await analysisResponse.json();
      console.log(`✅ CADIS Analysis API Success`);
      console.log(`   Entries Analyzed: ${analysisData.entriesAnalyzed || 0}`);
      
      if (analysisData.analysis) {
        console.log(`   Thinking Patterns: ${analysisData.analysis.thinkingPatterns?.length || 0}`);
        console.log(`   Philosophical Alignment: Available`);
        console.log(`   Evolution Timeline: ${analysisData.analysis.evolutionTimeline ? 'Available' : 'Not Available'}`);
        console.log(`   Dream Exploration: ${analysisData.analysis.dreamExploration ? 'Available' : 'Not Available'}`);
        
        // Show sample thinking patterns
        if (analysisData.analysis.thinkingPatterns?.length > 0) {
          console.log(`\n📊 Sample Thinking Patterns:`);
          analysisData.analysis.thinkingPatterns.slice(0, 3).forEach((pattern, index) => {
            console.log(`     ${index + 1}. ${pattern.type}: ${pattern.frequency}% - ${pattern.description}`);
          });
        }
        
        // Show philosophical alignment
        if (analysisData.analysis.philosophicalAlignment) {
          console.log(`\n🎯 Philosophical Alignment Scores:`);
          Object.entries(analysisData.analysis.philosophicalAlignment).forEach(([principle, score]) => {
            console.log(`     ${principle}: ${score}/100`);
          });
        }
      }
    }
    
    // Test 2: Check if Journal Analysis Dream is generated in CADIS journal
    console.log(`\n🌟 Testing Journal Analysis Dream generation...`);
    
    const dreamResponse = await fetch('http://localhost:3000/api/admin/cadis-journal/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!dreamResponse.ok) {
      console.log(`❌ CADIS Dream Generation Error: ${dreamResponse.status}`);
    } else {
      const dreamData = await dreamResponse.json();
      console.log(`✅ CADIS Dream Generation Success`);
      console.log(`   Generated Insights: ${dreamData.generated || 0}`);
      
      // Check if Journal Analysis Dream was generated
      const hasJournalDream = dreamData.insights?.some((insight) => 
        insight.title?.includes('Journal Analysis Dream') || 
        insight.category === 'journal-analysis'
      );
      
      console.log(`   Journal Analysis Dream Generated: ${hasJournalDream ? '✅ Yes' : '❌ No'}`);
      
      if (hasJournalDream) {
        const journalDream = dreamData.insights.find(insight => 
          insight.title?.includes('Journal Analysis Dream')
        );
        
        if (journalDream) {
          console.log(`   Dream Title: "${journalDream.title}"`);
          console.log(`   Dream Category: ${journalDream.category}`);
          console.log(`   Confidence: ${journalDream.confidence}/100`);
        }
      }
    }
    
    // Test 3: Check current journal entries for analysis
    console.log(`\n📝 Testing Current Journal Entries...`);
    
    const journalResponse = await fetch('http://localhost:3000/api/admin/journal');
    
    if (!journalResponse.ok) {
      console.log(`❌ Journal API Error: ${journalResponse.status}`);
    } else {
      const journalData = await journalResponse.json();
      console.log(`✅ Journal API Success`);
      console.log(`   Total Entries: ${journalData.entries?.length || 0}`);
      
      if (journalData.entries?.length > 0) {
        console.log(`   Sample Entry Categories:`);
        const categories = [...new Set(journalData.entries.slice(0, 5).map(e => e.category))];
        categories.forEach(cat => {
          const count = journalData.entries.filter(e => e.category === cat).length;
          console.log(`     ${cat}: ${count} entries`);
        });
        
        // Show sample entry for analysis preview
        const sampleEntry = journalData.entries[0];
        console.log(`\n📋 Sample Entry for Analysis:`);
        console.log(`   Title: "${sampleEntry.title}"`);
        console.log(`   Category: ${sampleEntry.category}`);
        console.log(`   Content Length: ${sampleEntry.content?.length || 0} characters`);
        console.log(`   Content Preview: "${(sampleEntry.content || '').substring(0, 100)}..."`);
      } else {
        console.log(`   ⚠️ No journal entries found - CADIS analysis will show empty state`);
      }
    }
    
    console.log(`\n🎯 TESTING SUMMARY:`);
    console.log(`   CADIS Analysis API: ${analysisResponse.ok ? '✅ Working' : '❌ Error'}`);
    console.log(`   Dream Generation: ${dreamResponse.ok ? '✅ Working' : '❌ Error'}`);
    console.log(`   Journal Entries: ${journalResponse.ok ? '✅ Available' : '❌ Error'}`);
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testCADISJournalAnalysis()
  .then(() => {
    console.log('\n✅ CADIS Journal Analysis Test Complete!');
    console.log('🎯 Check admin/journal page for new CADIS Analysis tab');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
