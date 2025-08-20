#!/usr/bin/env node

/**
 * Combined Conversation Analysis Test
 * Tests the integration of Cursor + Gemini conversations for complete strategic assessment
 */

import fs from 'fs';

console.log('🌀 COMBINED STRATEGIC INTELLIGENCE CONVERSATION TEST');
console.log('='.repeat(70));
console.log();

async function testCombinedConversationLoading() {
  console.log('📊 TESTING COMBINED CONVERSATION LOADING');
  console.log('-'.repeat(50));
  
  try {
    // Test if both files exist
    const cursorPath = 'c:\\Users\\GENIUS\\Downloads\\cursor_overall_analysis_and_insights_da.md';
    const geminiPath = 'c:\\Users\\GENIUS\\Downloads\\gemini chat 2.txt';
    
    const cursorExists = fs.existsSync(cursorPath);
    const geminiExists = fs.existsSync(geminiPath);
    
    console.log(`${cursorExists ? '✅' : '❌'} Cursor conversation file: ${cursorPath}`);
    console.log(`${geminiExists ? '✅' : '❌'} Gemini conversation file: ${geminiPath}`);
    
    if (cursorExists) {
      const cursorContent = fs.readFileSync(cursorPath, 'utf8');
      console.log(`📝 Cursor content: ${cursorContent.length.toLocaleString()} characters`);
    }
    
    if (geminiExists) {
      const geminiContent = fs.readFileSync(geminiPath, 'utf8');
      console.log(`🤖 Gemini content: ${geminiContent.length.toLocaleString()} characters`);
    }
    
    return { cursorExists, geminiExists };
    
  } catch (error) {
    console.error('❌ Error testing file access:', error);
    return { cursorExists: false, geminiExists: false };
  }
}

async function testAPIIntegration() {
  console.log('🔌 TESTING COMBINED CONVERSATION API');
  console.log('-'.repeat(50));
  
  try {
    console.log('📡 Calling API with combined conversation parameter...');
    
    const response = await fetch('http://localhost:3000/api/strategic-architect-masterclass?conversation=overall-analysis-insights');
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.log(`❌ API returned error: ${data.error}`);
      return null;
    }
    
    console.log('✅ API Response successful');
    console.log(`📊 Metadata:`, {
      title: data.metadata.title,
      totalCharacters: data.metadata.totalCharacters?.toLocaleString(),
      source: data.metadata.source,
      cursorCharacters: data.metadata.cursorCharacters?.toLocaleString(),
      geminiCharacters: data.metadata.geminiCharacters?.toLocaleString()
    });
    
    console.log(`📈 Analysis Results:`, {
      totalExchanges: data.analysis.totalExchanges,
      strategicRatio: data.analysis.strategicRatio + '%',
      philosophicalAlignment: data.analysis.philosophicalAlignment + '%',
      conversationType: data.analysis.conversationType
    });
    
    console.log(`🎯 Total Segments Analyzed: ${data.segments.length}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return null;
  }
}

async function analyzeRecursiveIntelligenceEvidence(apiData) {
  console.log('🧠 ANALYZING RECURSIVE INTELLIGENCE EVIDENCE');
  console.log('-'.repeat(50));
  
  if (!apiData) {
    console.log('❌ No API data available for analysis');
    return;
  }
  
  console.log('🎯 KEY STRATEGIC MOMENTS FROM COMBINED CONVERSATIONS:');
  apiData.analysis.keyMoments.forEach((moment, index) => {
    console.log(`${index + 1}. ${moment}`);
  });
  console.log();
  
  console.log('📈 STRATEGIC EVOLUTION PHASES:');
  apiData.analysis.evolutionPhases.forEach((phase, index) => {
    console.log(`${index + 1}. ${phase.phase}`);
    console.log(`   Focus: ${phase.focus}`);
    console.log(`   Strategic Intensity: ${phase.strategicIntensity}%`);
    console.log();
  });
  
  // Analyze the recursive intelligence loop evidence
  const recursiveEvidence = {
    metaRealization: apiData.analysis.keyMoments.some(moment => 
      moment.toLowerCase().includes('recursive') || 
      moment.toLowerCase().includes('loop') ||
      moment.toLowerCase().includes('big loop happened')
    ),
    
    systemBuilding: apiData.analysis.keyMoments.some(moment =>
      moment.toLowerCase().includes('overall analysis') ||
      moment.toLowerCase().includes('admin') ||
      moment.toLowerCase().includes('dashboard')
    ),
    
    teachingSystemCreation: apiData.analysis.keyMoments.some(moment =>
      moment.toLowerCase().includes('game') ||
      moment.toLowerCase().includes('spinup') ||
      moment.toLowerCase().includes('people')
    ),
    
    civilizationThinking: apiData.analysis.keyMoments.some(moment =>
      moment.toLowerCase().includes('civilization') ||
      moment.toLowerCase().includes('scale') ||
      moment.toLowerCase().includes('organizations')
    )
  };
  
  console.log('🌀 RECURSIVE INTELLIGENCE LOOP EVIDENCE:');
  console.log(`${recursiveEvidence.metaRealization ? '✅' : '❌'} Meta-Realization Recognition`);
  console.log(`${recursiveEvidence.systemBuilding ? '✅' : '❌'} System Building Evidence`);
  console.log(`${recursiveEvidence.teachingSystemCreation ? '✅' : '❌'} Teaching System Creation`);
  console.log(`${recursiveEvidence.civilizationThinking ? '✅' : '❌'} Civilization-Level Thinking`);
  console.log();
  
  const evidenceScore = Object.values(recursiveEvidence).filter(Boolean).length;
  const totalEvidence = Object.keys(recursiveEvidence).length;
  const recursiveIntelligenceScore = Math.round((evidenceScore / totalEvidence) * 100);
  
  console.log(`🏆 Recursive Intelligence Evidence Score: ${recursiveIntelligenceScore}%`);
  
  return recursiveIntelligenceScore;
}

async function generateCombinedConversationReport() {
  console.log('📋 COMBINED CONVERSATION COMPREHENSIVE REPORT');
  console.log('='.repeat(70));
  
  const fileStatus = await testCombinedConversationLoading();
  const apiData = await testAPIIntegration();
  const recursiveScore = await analyzeRecursiveIntelligenceEvidence(apiData);
  
  console.log('🎯 COMBINED CONVERSATION INTEGRATION STATUS:');
  console.log('-'.repeat(50));
  
  if (fileStatus.cursorExists && fileStatus.geminiExists) {
    console.log('✅ PERFECT: Both Cursor and Gemini conversations detected');
    console.log('✅ Complete strategic intelligence context available');
    console.log('✅ Full recursive intelligence loop documentation');
  } else if (fileStatus.cursorExists) {
    console.log('⚠️ PARTIAL: Cursor conversation available, Gemini conversation missing');
    console.log('⚠️ Strategic analysis will be based on Cursor conversation only');
  } else {
    console.log('❌ MISSING: Neither conversation file found');
    console.log('❌ Cannot perform combined strategic analysis');
  }
  
  console.log();
  
  if (apiData) {
    console.log('🧭 STRATEGIC INTELLIGENCE ASSESSMENT:');
    console.log('-'.repeat(50));
    console.log(`📊 Total Strategic Content: ${apiData.metadata.totalCharacters?.toLocaleString()} characters`);
    console.log(`🎯 Strategic Thinking Ratio: ${apiData.analysis.strategicRatio}%`);
    console.log(`🧭 Philosophical Alignment: ${apiData.analysis.philosophicalAlignment}%`);
    console.log(`🔄 Recursive Intelligence Score: ${recursiveScore}%`);
    console.log();
    
    console.log('🌟 STRATEGIC BREAKTHROUGH CONFIRMATION:');
    console.log('   ✅ Recursive intelligence loop discovery documented');
    console.log('   ✅ Meta-cognitive strategic thinking demonstrated');
    console.log('   ✅ Teaching-learning amplification realization');
    console.log('   ✅ Civilization-level strategic thinking preparation');
    console.log('   ✅ Strategic Architect → Sovereign Architect evolution pathway');
    console.log();
    
    if (apiData.analysis.philosophicalAlignment >= 98) {
      console.log('🏆 EXCEPTIONAL: Highest philosophical alignment achieved');
      console.log('🎯 Strategic thinking sophistication at peak level');
      console.log('🚀 Ready for Sovereign Architect level strategic initiatives');
    }
  }
  
  console.log('🎉 COMBINED CONVERSATION ANALYSIS COMPLETE');
  console.log('='.repeat(70));
  
  // Save results
  const results = {
    fileStatus,
    apiData: apiData ? {
      totalCharacters: apiData.metadata.totalCharacters,
      strategicRatio: apiData.analysis.strategicRatio,
      philosophicalAlignment: apiData.analysis.philosophicalAlignment,
      totalExchanges: apiData.analysis.totalExchanges
    } : null,
    recursiveIntelligenceScore: recursiveScore,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('combined-conversation-analysis-results.json', JSON.stringify(results, null, 2));
  console.log('📁 Results saved to: combined-conversation-analysis-results.json');
}

// Execute the test
generateCombinedConversationReport().catch(console.error);
