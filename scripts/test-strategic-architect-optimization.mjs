#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';

// Load environment variables
dotenv.config();

/**
 * Comprehensive Strategic Architect Masterclass Optimization Script
 * 
 * This script will:
 * 1. Test the current conversation parsing and segment display
 * 2. Verify alignment and strategic score calculations
 * 3. Optimize segment content for best learning experience
 * 4. Validate conversation context preservation
 */

async function testStrategicArchitectOptimization() {
  console.log('🎓 Strategic Architect Masterclass Optimization Test\n');
  console.log('=' .repeat(80));
  
  try {
    // Test the API directly to see what's being generated
    console.log('📡 Testing Strategic Architect API...\n');
    
    const response = await fetch('http://localhost:3000/api/strategic-architect-masterclass');
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ API returned error:', data.error);
      return;
    }
    
    console.log(`✅ API Success: ${data.segments.length} segments loaded`);
    console.log(`📊 Total Characters: ${data.metadata.totalCharacters.toLocaleString()}`);
    console.log(`🔄 Total Exchanges: ${data.analysis.totalExchanges}\n`);
    
    // Analyze segment quality and content
    await analyzeSegmentQuality(data.segments);
    
    // Test alignment calculations
    await testAlignmentCalculations(data.segments);
    
    // Test strategic scoring
    await testStrategicScoring(data.segments);
    
    // Analyze conversation context preservation
    await analyzeConversationContext(data.segments);
    
    // Generate optimization recommendations
    await generateOptimizationRecommendations(data.segments);
    
  } catch (error) {
    console.error('❌ Script Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function analyzeSegmentQuality(segments) {
  console.log('🔍 SEGMENT QUALITY ANALYSIS');
  console.log('=' .repeat(50));
  
  const userSegments = segments.filter(s => s.speaker === 'User');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  
  const exchangeSegments = segments.filter(s => s.speaker === 'Exchange');
  
  console.log(`📊 Segment Distribution:`);
  console.log(`   User Segments: ${userSegments.length}`);
  console.log(`   Cursor Segments: ${cursorSegments.length}`);
  console.log(`   Exchange Segments (Complete Conversations): ${exchangeSegments.length}`);
  console.log(`   Total: ${segments.length}\n`);
  
  // Analyze content quality
  console.log(`📝 Content Quality Analysis:`);
  
  const contentStats = {
    veryShort: segments.filter(s => s.content.length < 100).length,
    short: segments.filter(s => s.content.length >= 100 && s.content.length < 500).length,
    medium: segments.filter(s => s.content.length >= 500 && s.content.length < 2000).length,
    long: segments.filter(s => s.content.length >= 2000 && s.content.length < 5000).length,
    veryLong: segments.filter(s => s.content.length >= 5000).length
  };
  
  console.log(`   Very Short (<100 chars): ${contentStats.veryShort}`);
  console.log(`   Short (100-500 chars): ${contentStats.short}`);
  console.log(`   Medium (500-2K chars): ${contentStats.medium}`);
  console.log(`   Long (2K-5K chars): ${contentStats.long}`);
  console.log(`   Very Long (5K+ chars): ${contentStats.veryLong}\n`);
  
  // Check for conversation context preservation
  const fullContextSegments = segments.filter(s => 
    s.content.includes('**USER REQUEST:**') || s.content.includes('**CURSOR RESPONSE:**')
  );
  
  console.log(`🔗 Conversation Context:`);
  console.log(`   Segments with full context: ${fullContextSegments.length}/${segments.length}`);
  console.log(`   Context preservation rate: ${Math.round((fullContextSegments.length / segments.length) * 100)}%`);
  console.log(`   Exchange segments (ideal): ${exchangeSegments.length}/${segments.length} (${Math.round((exchangeSegments.length / segments.length) * 100)}%)\n`);
  
  // Sample segment analysis
  console.log(`📋 Sample Segment Analysis:`);
  const sampleSegments = segments.slice(0, 3);
  
  sampleSegments.forEach((segment, index) => {
    console.log(`\n   Segment ${index + 1} (${segment.speaker}):`);
    console.log(`     Length: ${segment.content.length} characters`);
    console.log(`     Strategic Score: ${segment.strategicScore}/100`);
    console.log(`     Alignment Score: ${segment.alignmentScore}/100`);
    console.log(`     Key Insights: ${segment.keyInsights.length}`);
    console.log(`     Has Full Context: ${segment.content.includes('**USER REQUEST:**') || segment.content.includes('**CURSOR RESPONSE:**') ? 'Yes' : 'No'}`);
    console.log(`     Preview: "${segment.content.substring(0, 100)}..."`);
  });
  
  console.log('\n');
}

async function testAlignmentCalculations(segments) {
  console.log('🎯 ALIGNMENT CALCULATION TESTING');
  console.log('=' .repeat(50));
  
  const userSegments = segments.filter(s => s.speaker === 'User');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  
  // Analyze alignment score distribution
  const userAlignmentScores = userSegments.map(s => s.alignmentScore);
  const cursorAlignmentScores = cursorSegments.map(s => s.alignmentScore);
  
  const userAvgAlignment = userAlignmentScores.length > 0 
    ? Math.round(userAlignmentScores.reduce((sum, score) => sum + score, 0) / userAlignmentScores.length)
    : 0;
    
  const cursorAvgAlignment = cursorAlignmentScores.length > 0
    ? Math.round(cursorAlignmentScores.reduce((sum, score) => sum + score, 0) / cursorAlignmentScores.length)
    : 0;
  
  console.log(`📊 Alignment Score Analysis:`);
  console.log(`   User Average Alignment: ${userAvgAlignment}/100`);
  console.log(`   Cursor Average Alignment: ${cursorAvgAlignment}/100`);
  console.log(`   User Score Range: ${Math.min(...userAlignmentScores)}-${Math.max(...userAlignmentScores)}`);
  console.log(`   Cursor Score Range: ${Math.min(...cursorAlignmentScores)}-${Math.max(...cursorAlignmentScores)}\n`);
  
  // Test specific alignment patterns
  console.log(`🔍 Alignment Pattern Testing:`);
  
  const highAlignmentUsers = userSegments.filter(s => s.alignmentScore >= 80);
  const lowAlignmentUsers = userSegments.filter(s => s.alignmentScore < 50);
  
  console.log(`   High Alignment Users (≥80): ${highAlignmentUsers.length}/${userSegments.length}`);
  console.log(`   Low Alignment Users (<50): ${lowAlignmentUsers.length}/${userSegments.length}`);
  
  // Sample high alignment analysis
  if (highAlignmentUsers.length > 0) {
    const sample = highAlignmentUsers[0];
    console.log(`\n   Sample High Alignment (${sample.alignmentScore}/100):`);
    console.log(`     Execution: ${sample.philosophicalAlignment.execution}/100`);
    console.log(`     Modularity: ${sample.philosophicalAlignment.modularity}/100`);
    console.log(`     Reusability: ${sample.philosophicalAlignment.reusability}/100`);
    console.log(`     Teachability: ${sample.philosophicalAlignment.teachability}/100`);
    console.log(`     Progressive Enhancement: ${sample.philosophicalAlignment.progressiveEnhancement}/100`);
    console.log(`     Content Preview: "${sample.content.substring(0, 150)}..."`);
  }
  
  // Identify potential alignment calculation issues
  console.log(`\n⚠️  Potential Issues:`);
  
  const zeroAlignmentSegments = segments.filter(s => s.alignmentScore === 0);
  const maxAlignmentSegments = segments.filter(s => s.alignmentScore === 100);
  
  console.log(`   Zero alignment scores: ${zeroAlignmentSegments.length} (may indicate calculation issues)`);
  console.log(`   Perfect alignment scores: ${maxAlignmentSegments.length} (may be too generous)`);
  
  console.log('\n');
}

async function testStrategicScoring(segments) {
  console.log('🧠 STRATEGIC SCORING TESTING');
  console.log('=' .repeat(50));
  
  const userSegments = segments.filter(s => s.speaker === 'User');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  
  // Analyze strategic score distribution
  const userStrategicScores = userSegments.map(s => s.strategicScore);
  const cursorStrategicScores = cursorSegments.map(s => s.strategicScore);
  
  const userAvgStrategic = userStrategicScores.length > 0 
    ? Math.round(userStrategicScores.reduce((sum, score) => sum + score, 0) / userStrategicScores.length)
    : 0;
    
  const cursorAvgStrategic = cursorStrategicScores.length > 0
    ? Math.round(cursorStrategicScores.reduce((sum, score) => sum + score, 0) / cursorStrategicScores.length)
    : 0;
  
  console.log(`📊 Strategic Score Analysis:`);
  console.log(`   User Average Strategic: ${userAvgStrategic}/100`);
  console.log(`   Cursor Average Strategic: ${cursorAvgStrategic}/100`);
  console.log(`   User Score Range: ${Math.min(...userStrategicScores)}-${Math.max(...userStrategicScores)}`);
  console.log(`   Cursor Score Range: ${Math.min(...cursorStrategicScores)}-${Math.max(...cursorStrategicScores)}\n`);
  
  // Analyze strategic patterns
  console.log(`🎯 Strategic Pattern Analysis:`);
  
  const highStrategicUsers = userSegments.filter(s => s.strategicScore >= 80);
  const mediumStrategicUsers = userSegments.filter(s => s.strategicScore >= 60 && s.strategicScore < 80);
  const lowStrategicUsers = userSegments.filter(s => s.strategicScore < 60);
  
  console.log(`   High Strategic (≥80): ${highStrategicUsers.length}/${userSegments.length}`);
  console.log(`   Medium Strategic (60-79): ${mediumStrategicUsers.length}/${userSegments.length}`);
  console.log(`   Low Strategic (<60): ${lowStrategicUsers.length}/${userSegments.length}\n`);
  
  // Sample strategic pattern breakdown
  if (highStrategicUsers.length > 0) {
    const sample = highStrategicUsers[0];
    console.log(`   Sample High Strategic (${sample.strategicScore}/100):`);
    console.log(`     Direction Giving: ${sample.strategicPatterns.directionGiving}`);
    console.log(`     System Thinking: ${sample.strategicPatterns.systemThinking}`);
    console.log(`     Quality Control: ${sample.strategicPatterns.qualityControl}`);
    console.log(`     Iterative Refinement: ${sample.strategicPatterns.iterativeRefinement}`);
    console.log(`     Problem Diagnosis: ${sample.strategicPatterns.problemDiagnosis}`);
    console.log(`     Meta Analysis: ${sample.strategicPatterns.metaAnalysis}`);
    console.log(`     Content Preview: "${sample.content.substring(0, 150)}..."`);
  }
  
  console.log('\n');
}

async function analyzeConversationContext(segments) {
  console.log('💬 CONVERSATION CONTEXT ANALYSIS');
  console.log('=' .repeat(50));
  
  // Check how well conversation context is preserved
  const userSegments = segments.filter(s => s.speaker === 'User');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  
  // Check for proper exchange pairing
  console.log(`🔗 Exchange Pairing Analysis:`);
  
  let properlyPairedExchanges = 0;
  let orphanedUserMessages = 0;
  let orphanedCursorMessages = 0;
  
  // Analyze if cursor segments contain both user request and cursor response
  cursorSegments.forEach(segment => {
    if (segment.content.includes('**USER REQUEST:**') && segment.content.includes('**CURSOR RESPONSE:**')) {
      properlyPairedExchanges++;
    } else {
      orphanedCursorMessages++;
    }
  });
  
  // Count user segments that don't have corresponding cursor responses
  userSegments.forEach(segment => {
    const hasCorrespondingResponse = cursorSegments.some(cs => 
      cs.content.includes(segment.content.substring(0, 100))
    );
    if (!hasCorrespondingResponse) {
      orphanedUserMessages++;
    }
  });
  
  console.log(`   Properly Paired Exchanges: ${properlyPairedExchanges}`);
  console.log(`   Orphaned User Messages: ${orphanedUserMessages}`);
  console.log(`   Orphaned Cursor Messages: ${orphanedCursorMessages}`);
  console.log(`   Pairing Success Rate: ${Math.round((properlyPairedExchanges / cursorSegments.length) * 100)}%\n`);
  
  // Sample conversation context analysis
  console.log(`📋 Sample Context Analysis:`);
  
  const sampleCursorWithContext = cursorSegments.find(s => 
    s.content.includes('**USER REQUEST:**') && s.content.includes('**CURSOR RESPONSE:**')
  );
  
  if (sampleCursorWithContext) {
    console.log(`   Sample Full Context Segment:`);
    console.log(`     Length: ${sampleCursorWithContext.content.length} characters`);
    console.log(`     Has User Request: ${sampleCursorWithContext.content.includes('**USER REQUEST:**') ? 'Yes' : 'No'}`);
    console.log(`     Has Cursor Response: ${sampleCursorWithContext.content.includes('**CURSOR RESPONSE:**') ? 'Yes' : 'No'}`);
    
    // Extract and show structure
    const userRequestMatch = sampleCursorWithContext.content.match(/\*\*USER REQUEST:\*\*(.*?)\*\*CURSOR RESPONSE:\*\*/s);
    const cursorResponseMatch = sampleCursorWithContext.content.match(/\*\*CURSOR RESPONSE:\*\*(.*)/s);
    
    if (userRequestMatch && cursorResponseMatch) {
      console.log(`     User Request Length: ${userRequestMatch[1].trim().length} chars`);
      console.log(`     Cursor Response Length: ${cursorResponseMatch[1].trim().length} chars`);
      console.log(`     User Request Preview: "${userRequestMatch[1].trim().substring(0, 100)}..."`);
      console.log(`     Response Preview: "${cursorResponseMatch[1].trim().substring(0, 100)}..."`);
    }
  }
  
  console.log('\n');
}

async function generateOptimizationRecommendations(segments) {
  console.log('🚀 OPTIMIZATION RECOMMENDATIONS');
  console.log('=' .repeat(50));
  
  const userSegments = segments.filter(s => s.speaker === 'User');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  
  console.log(`📋 Current Status Summary:`);
  console.log(`   Total Segments: ${segments.length}`);
  console.log(`   User Segments: ${userSegments.length}`);
  console.log(`   Cursor Segments: ${cursorSegments.length}`);
  
  const avgUserStrategic = userSegments.length > 0 
    ? Math.round(userSegments.reduce((sum, s) => sum + s.strategicScore, 0) / userSegments.length)
    : 0;
  const avgUserAlignment = userSegments.length > 0 
    ? Math.round(userSegments.reduce((sum, s) => sum + s.alignmentScore, 0) / userSegments.length)
    : 0;
    
  console.log(`   Average User Strategic Score: ${avgUserStrategic}/100`);
  console.log(`   Average User Alignment Score: ${avgUserAlignment}/100\n`);
  
  // Generate specific recommendations
  console.log(`🎯 Specific Recommendations:\n`);
  
  // 1. Alignment Score Issues
  const lowAlignmentSegments = segments.filter(s => s.alignmentScore < 30);
  if (lowAlignmentSegments.length > segments.length * 0.3) {
    console.log(`⚠️  ALIGNMENT SCORING ISSUE DETECTED:`);
    console.log(`   ${lowAlignmentSegments.length}/${segments.length} segments have alignment scores < 30`);
    console.log(`   Recommendation: Review alignment calculation logic`);
    console.log(`   Likely Issue: Pattern matching may be too strict or scoring multiplier too low\n`);
  }
  
  // 2. Context Preservation Issues
  const contextSegments = segments.filter(s => 
    s.content.includes('**USER REQUEST:**') || s.content.includes('**CURSOR RESPONSE:**')
  );
  if (contextSegments.length < segments.length * 0.5) {
    console.log(`⚠️  CONTEXT PRESERVATION ISSUE DETECTED:`);
    console.log(`   Only ${contextSegments.length}/${segments.length} segments have full context`);
    console.log(`   Recommendation: Improve conversation parsing to better pair User-Cursor exchanges`);
    console.log(`   Likely Issue: Exchange pairing logic may not be working correctly\n`);
  }
  
  // 3. Strategic Score Distribution
  const highStrategicUsers = userSegments.filter(s => s.strategicScore >= 80);
  if (highStrategicUsers.length < userSegments.length * 0.3) {
    console.log(`⚠️  STRATEGIC SCORING MAY BE TOO CONSERVATIVE:`);
    console.log(`   Only ${highStrategicUsers.length}/${userSegments.length} user segments score ≥80`);
    console.log(`   Recommendation: Consider adjusting strategic scoring to better reflect leadership patterns`);
    console.log(`   Your messages show strong direction-giving and system thinking\n`);
  }
  
  // 4. Content Quality Issues
  const veryShortSegments = segments.filter(s => s.content.length < 100);
  if (veryShortSegments.length > segments.length * 0.2) {
    console.log(`⚠️  CONTENT QUALITY ISSUE DETECTED:`);
    console.log(`   ${veryShortSegments.length}/${segments.length} segments are very short (<100 chars)`);
    console.log(`   Recommendation: Increase minimum content length threshold in parsing`);
    console.log(`   Short segments may not provide enough learning value\n`);
  }
  
  // 5. Positive Observations
  console.log(`✅ POSITIVE OBSERVATIONS:\n`);
  
  if (avgUserStrategic >= 70) {
    console.log(`   Strong strategic scoring: ${avgUserStrategic}/100 average for user messages`);
  }
  
  const longSegments = segments.filter(s => s.content.length >= 1000);
  if (longSegments.length > segments.length * 0.3) {
    console.log(`   Good content depth: ${longSegments.length}/${segments.length} segments are substantial (≥1000 chars)`);
  }
  
  const insightfulSegments = segments.filter(s => s.keyInsights.length >= 2);
  if (insightfulSegments.length > segments.length * 0.5) {
    console.log(`   Rich insights: ${insightfulSegments.length}/${segments.length} segments have multiple key insights`);
  }
  
  console.log(`\n🔧 NEXT STEPS:`);
  console.log(`   1. Review and adjust alignment calculation multipliers`);
  console.log(`   2. Improve User-Cursor exchange pairing logic`);
  console.log(`   3. Consider strategic score calibration for your leadership style`);
  console.log(`   4. Test with sample conversations to validate improvements`);
  console.log(`   5. Monitor segment quality metrics after changes\n`);
}

// Run the optimization test
testStrategicArchitectOptimization()
  .then(() => {
    console.log('✅ Strategic Architect Optimization Test Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
