#!/usr/bin/env node

/**
 * Test Number Fixes - Comprehensive Validation
 * Tests both conversations to ensure all numbers are calculating correctly
 */

async function testNumberFixes() {
  console.log('🧪 TESTING NUMBER FIXES - COMPREHENSIVE VALIDATION');
  console.log('=' .repeat(80));
  
  const conversations = [
    { type: 'cadis-developer', name: 'CADIS Developer Intelligence' },
    { type: 'image-display-issues', name: 'Image Display Issues' }
  ];
  
  for (const conv of conversations) {
    console.log(`\n📋 TESTING: ${conv.name} (${conv.type})`);
    console.log('=' .repeat(60));
    
    try {
      const response = await fetch(`http://localhost:3000/api/strategic-architect-masterclass?conversation=${conv.type}`);
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.log(`❌ API Error: ${data.error}`);
        continue;
      }
      
      const { segments, analysis } = data;
      
      console.log(`✅ API Response: ${segments.length} segments loaded`);
      
      // Test all the key numbers that should appear on the interface
      
      // 1. Basic Stats
      console.log(`\n📊 BASIC STATS:`);
      console.log(`   Total Segments: ${segments.length}`);
      console.log(`   Total Exchanges: ${analysis.totalExchanges} ${analysis.totalExchanges > 0 ? '✅' : '❌'}`);
      console.log(`   Total Characters: ${analysis.totalCharacters?.toLocaleString()}`);
      console.log(`   Strategic Ratio: ${analysis.strategicRatio}%`);
      console.log(`   Philosophy Alignment: ${analysis.philosophicalAlignment}/100`);
      
      // 2. Key Moments
      console.log(`\n🏆 KEY STRATEGIC MOMENTS:`);
      console.log(`   Key Moments Count: ${analysis.keyMoments?.length || 0} ${(analysis.keyMoments?.length || 0) > 0 ? '✅' : '❌'}`);
      if (analysis.keyMoments?.length > 0) {
        analysis.keyMoments.slice(0, 3).forEach((moment, i) => {
          console.log(`     ${i + 1}. "${moment.substring(0, 60)}..."`);
        });
      }
      
      // 3. Segment Type Breakdown
      console.log(`\n👥 SEGMENT TYPES:`);
      const userSegments = segments.filter(s => s.speaker === 'User');
      const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
      const exchangeSegments = segments.filter(s => s.speaker === 'Exchange');
      
      console.log(`   User Segments: ${userSegments.length}`);
      console.log(`   Cursor Segments: ${cursorSegments.length}`);
      console.log(`   Exchange Segments: ${exchangeSegments.length}`);
      
      // 4. Strategic Scores
      console.log(`\n🎯 STRATEGIC SCORES:`);
      const allStrategicSegments = segments.filter(s => (s.speaker === 'User' || s.speaker === 'Exchange') && s.strategicScore > 0);
      const avgStrategic = allStrategicSegments.length > 0 
        ? Math.round(allStrategicSegments.reduce((sum, s) => sum + s.strategicScore, 0) / allStrategicSegments.length)
        : 0;
      
      console.log(`   Strategic Segments: ${allStrategicSegments.length}`);
      console.log(`   Avg Strategic Score: ${avgStrategic}/100 ${avgStrategic > 0 ? '✅' : '❌'}`);
      console.log(`   High Strategic (≥70): ${segments.filter(s => (s.speaker === 'User' || s.speaker === 'Exchange') && s.strategicScore >= 70).length}`);
      
      // 5. Philosophical Alignment Counts
      console.log(`\n⚡ PHILOSOPHICAL ALIGNMENT COUNTS:`);
      
      const executionCount = segments.filter(s => 
        (s.speaker === 'User' || s.speaker === 'Exchange') && 
        s.content.toLowerCase().match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure|ensure|verify|confirm|analyze)\b/g)
      ).length;
      
      const modularityCount = segments.filter(s => 
        (s.speaker === 'User' || s.speaker === 'Exchange') && 
        s.content.toLowerCase().match(/\b(modular|component|service|singleton|module|reusable|separate|individual|architecture|system)\b/g)
      ).length;
      
      const reusabilityCount = segments.filter(s => 
        (s.speaker === 'User' || s.speaker === 'Exchange') && 
        s.content.toLowerCase().match(/\b(reusable|framework|pattern|template|systematic|scale|standard|consistent)\b/g)
      ).length;
      
      const teachabilityCount = segments.filter(s => 
        (s.speaker === 'User' || s.speaker === 'Exchange') && 
        s.content.toLowerCase().match(/\b(document|explain|understand|framework|define|teach|learn|analyze|study|investigate)\b/g)
      ).length;
      
      console.log(`   ⚡ Execution: ${executionCount} ${executionCount > 0 ? '✅' : '❌'}`);
      console.log(`   🧩 Modularity: ${modularityCount} ${modularityCount > 0 ? '✅' : '❌'}`);
      console.log(`   ♻️ Reusability: ${reusabilityCount} ${reusabilityCount > 0 ? '✅' : '❌'}`);
      console.log(`   📚 Teachability: ${teachabilityCount} ${teachabilityCount > 0 ? '✅' : '❌'}`);
      
      // 6. Learning Goal Counts
      console.log(`\n🎓 LEARNING GOAL COUNTS:`);
      
      const strategicLeadershipCount = segments.filter(s => 
        (s.speaker === 'User' || s.speaker === 'Exchange') && 
        (s.strategicPatterns?.directionGiving >= 3 || 
         s.strategicPatterns?.systemThinking >= 3 ||
         s.strategicScore >= 85)
      ).length;
      
      const technicalImplementationCount = segments.filter(s => 
        s.speaker === 'Cursor' && 
        (s.content.includes('```') || 
         s.content.includes('async function') ||
         s.content.includes('class ') ||
         s.content.includes('interface ') ||
         s.content.length > 2000)
      ).length;
      
      const problemSolvingCount = segments.filter(s => 
        s.strategicPatterns?.problemDiagnosis >= 2 ||
        s.content.toLowerCase().includes('error') ||
        s.content.toLowerCase().includes('fix') ||
        s.content.toLowerCase().includes('debug') ||
        s.content.toLowerCase().includes('issue')
      ).length;
      
      console.log(`   👑 Strategic Leadership: ${strategicLeadershipCount}`);
      console.log(`   ⚡ Technical Implementation: ${technicalImplementationCount}`);
      console.log(`   🔧 Problem Solving: ${problemSolvingCount} ${conv.type === 'image-display-issues' && problemSolvingCount > 15 ? '✅' : conv.type === 'image-display-issues' ? '❌' : '✅'}`);
      
      // 7. Overall Assessment
      console.log(`\n📈 OVERALL ASSESSMENT:`);
      
      let issues = 0;
      
      if (analysis.totalExchanges === 0) {
        console.log(`   ❌ ISSUE: totalExchanges is 0`);
        issues++;
      }
      
      if (avgStrategic === 0 && segments.length > 0) {
        console.log(`   ❌ ISSUE: Average strategic score is 0`);
        issues++;
      }
      
      if ((analysis.keyMoments?.length || 0) === 0) {
        console.log(`   ❌ ISSUE: No key moments found`);
        issues++;
      }
      
      if (conv.type === 'image-display-issues') {
        if (executionCount === 0) {
          console.log(`   ❌ ISSUE: Execution count is 0 for Image Display (should have "ensure", "analyze")`);
          issues++;
        }
        if (modularityCount === 0) {
          console.log(`   ❌ ISSUE: Modularity count is 0 for Image Display (should have "singleton", "service")`);
          issues++;
        }
        if (problemSolvingCount < 15) {
          console.log(`   ❌ ISSUE: Problem solving count too low for Image Display (${problemSolvingCount}, should be >15)`);
          issues++;
        }
      }
      
      if (issues === 0) {
        console.log(`   ✅ ALL NUMBERS LOOK CORRECT!`);
      } else {
        console.log(`   ⚠️ ${issues} issues detected`);
      }
      
      // 8. Sample Segment Analysis
      if (segments.length > 0) {
        console.log(`\n🔍 SAMPLE SEGMENT ANALYSIS:`);
        const sample = segments[0];
        console.log(`   Sample Segment (${sample.speaker}):`);
        console.log(`     Strategic Score: ${sample.strategicScore}/100`);
        console.log(`     Alignment Score: ${sample.alignmentScore}/100`);
        console.log(`     Strategic Patterns:`, sample.strategicPatterns);
        console.log(`     Content Preview: "${sample.content.substring(0, 100)}..."`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${conv.type}:`, error.message);
    }
  }
}

// Run the test
testNumberFixes()
  .then(() => {
    console.log('\n✅ Number Fixes Test Complete!');
    console.log('🎯 Ready to push if all numbers are calculating correctly');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
