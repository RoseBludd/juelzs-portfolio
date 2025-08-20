#!/usr/bin/env node
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Comprehensive Number Validation Script for Strategic Architect Masterclass
 * 
 * This script validates ALL numbers displayed on the page for both conversations:
 * 1. Key Strategic Moments count and scoring
 * 2. Philosophical Alignment button counts
 * 3. Learning Goal category counts
 * 4. Summary statistics
 * 5. Strategic and alignment scores
 */

async function validateStrategicArchitectNumbers() {
  console.log('🔍 STRATEGIC ARCHITECT MASTERCLASS - NUMBER VALIDATION');
  console.log('=' .repeat(80));
  
  try {
    // Test both conversations
    const conversations = [
      { 
        type: 'cadis-developer', 
        name: 'CADIS Developer Intelligence',
        expectedGrade: 'A-',
        expectedFocus: 'Strategic Leadership'
      },
      { 
        type: 'image-display-issues', 
        name: 'Image Display Issues',
        expectedGrade: 'B-',
        expectedFocus: 'Technical Problem-Solving'
      }
    ];
    
    for (const conversation of conversations) {
      console.log(`\n📋 VALIDATING: ${conversation.name} (${conversation.type})`);
      console.log('=' .repeat(60));
      
      // Fetch conversation data
      const response = await fetch(`http://localhost:3000/api/strategic-architect-masterclass?conversation=${conversation.type}`);
      
      if (!response.ok) {
        console.log(`❌ API Error for ${conversation.type}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.success) {
        console.log(`❌ API returned error for ${conversation.type}:`, data.error);
        continue;
      }
      
      console.log(`✅ API Success: ${data.segments.length} segments loaded`);
      
      // Validate all numbers
      await validateConversationNumbers(data, conversation);
    }
    
  } catch (error) {
    console.error('❌ Validation Error:', error.message);
  }
}

async function validateConversationNumbers(data, conversationInfo) {
  const { segments, analysis, metadata } = data;
  
  console.log(`\n📊 RAW DATA VALIDATION:`);
  console.log(`   Total Segments: ${segments.length}`);
  console.log(`   Total Characters: ${metadata.totalCharacters?.toLocaleString() || 'N/A'}`);
  console.log(`   Conversation Type: ${metadata.conversationType || 'N/A'}`);
  
  // 1. VALIDATE KEY STRATEGIC MOMENTS
  console.log(`\n🏆 KEY STRATEGIC MOMENTS VALIDATION:`);
  console.log(`   Key Moments from API: ${analysis?.keyMoments?.length || 0}`);
  
  if (analysis?.keyMoments) {
    analysis.keyMoments.forEach((moment, index) => {
      console.log(`     ${index + 1}. "${moment.substring(0, 80)}..."`);
    });
  } else {
    console.log(`   ⚠️ NO KEY MOMENTS FOUND - This should not be 0!`);
  }
  
  // 2. VALIDATE SEGMENT COUNTS BY TYPE
  console.log(`\n📈 SEGMENT TYPE VALIDATION:`);
  const userSegments = segments.filter(s => s.speaker === 'User');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  const exchangeSegments = segments.filter(s => s.speaker === 'Exchange');
  
  console.log(`   User Segments: ${userSegments.length}`);
  console.log(`   Cursor Segments: ${cursorSegments.length}`);
  console.log(`   Exchange Segments: ${exchangeSegments.length}`);
  console.log(`   Total: ${segments.length} (should equal sum above)`);
  
  // 3. VALIDATE STRATEGIC SCORES
  console.log(`\n🎯 STRATEGIC SCORE VALIDATION:`);
  const userStrategicScores = userSegments.map(s => s.strategicScore);
  const avgUserStrategic = userSegments.length > 0 
    ? Math.round(userStrategicScores.reduce((sum, score) => sum + score, 0) / userSegments.length)
    : 0;
  
  console.log(`   User Strategic Scores: [${userStrategicScores.slice(0, 5).join(', ')}${userStrategicScores.length > 5 ? '...' : ''}]`);
  console.log(`   Average User Strategic: ${avgUserStrategic}/100`);
  console.log(`   API Analysis Strategic: ${analysis?.strategicRatio || 'N/A'}% strategic focus`);
  
  if (avgUserStrategic === 0 && userSegments.length > 0) {
    console.log(`   ⚠️ ISSUE: Average strategic score is 0 but we have ${userSegments.length} user segments!`);
  }
  
  // 4. VALIDATE ALIGNMENT SCORES
  console.log(`\n🎭 ALIGNMENT SCORE VALIDATION:`);
  const userAlignmentScores = userSegments.map(s => s.alignmentScore);
  const avgUserAlignment = userSegments.length > 0 
    ? Math.round(userAlignmentScores.reduce((sum, score) => sum + score, 0) / userSegments.length)
    : 0;
  
  console.log(`   User Alignment Scores: [${userAlignmentScores.slice(0, 5).join(', ')}${userAlignmentScores.length > 5 ? '...' : ''}]`);
  console.log(`   Average User Alignment: ${avgUserAlignment}/100`);
  console.log(`   API Analysis Alignment: ${analysis?.philosophicalAlignment || 'N/A'}/100`);
  
  // 5. VALIDATE PHILOSOPHICAL PRINCIPLE COUNTS
  console.log(`\n⚡ PHILOSOPHICAL PRINCIPLE VALIDATION:`);
  
  const executionCount = segments.filter(s => 
    s.speaker === 'User' && 
    s.content.toLowerCase().match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure|ensure|verify|confirm|analyze)\b/g)
  ).length;
  
  const modularityCount = segments.filter(s => 
    s.speaker === 'User' && 
    s.content.toLowerCase().match(/\b(modular|component|service|singleton|module|reusable|separate|individual|architecture|system|structure)\b/g)
  ).length;
  
  const reusabilityCount = segments.filter(s => 
    s.speaker === 'User' && 
    s.content.toLowerCase().match(/\b(reusable|framework|pattern|template|systematic|scale|standard|consistent)\b/g)
  ).length;
  
  const teachabilityCount = segments.filter(s => 
    s.speaker === 'User' && 
    s.content.toLowerCase().match(/\b(document|explain|understand|framework|define|teach|learn|analyze|study|investigate)\b/g)
  ).length;
  
  const strategicPatternsCount = segments.filter(s => s.speaker === 'User' && s.strategicScore >= 70).length;
  
  console.log(`   ⚡ Execution ("If it needs to be done, do it"): ${executionCount}`);
  console.log(`   🧩 Modularity ("Make it modular"): ${modularityCount}`);
  console.log(`   ♻️ Reusability ("Make it reusable"): ${reusabilityCount}`);
  console.log(`   📚 Teachability ("Make it teachable"): ${teachabilityCount}`);
  console.log(`   🧠 Strategic Patterns (≥70 strategic score): ${strategicPatternsCount}`);
  
  // 6. VALIDATE LEARNING GOAL CATEGORY COUNTS
  console.log(`\n🎓 LEARNING GOAL CATEGORY VALIDATION:`);
  
  const allSegmentsCount = segments.length;
  const strategicLeadershipCount = segments.filter(s => 
    s.speaker === 'User' && 
    (s.strategicPatterns.directionGiving >= 3 || 
     s.strategicPatterns.systemThinking >= 3 ||
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
    s.strategicPatterns.problemDiagnosis >= 2 ||
    s.content.toLowerCase().includes('error') ||
    s.content.toLowerCase().includes('fix') ||
    s.content.toLowerCase().includes('debug') ||
    s.content.toLowerCase().includes('issue')
  ).length;
  
  const iterativeRefinementCount = segments.filter(s => 
    s.strategicPatterns.iterativeRefinement >= 2 ||
    s.content.toLowerCase().includes('proceed') ||
    s.content.toLowerCase().includes('also') ||
    s.content.toLowerCase().includes('refine') ||
    s.content.toLowerCase().includes('improve')
  ).length;
  
  const metaAnalysisCount = segments.filter(s => 
    s.strategicPatterns.metaAnalysis >= 2 ||
    s.content.toLowerCase().includes('analyze') ||
    s.content.toLowerCase().includes('framework') ||
    s.content.toLowerCase().includes('pattern') ||
    s.content.toLowerCase().includes('architecture')
  ).length;
  
  const coachingInsightsCount = segments.filter(s => 
    s.content.toLowerCase().includes('developer') ||
    s.content.toLowerCase().includes('performance') ||
    s.content.toLowerCase().includes('analysis') ||
    s.content.toLowerCase().includes('recommendation') ||
    s.content.toLowerCase().includes('insight')
  ).length;
  
  console.log(`   🔍 All Segments: ${allSegmentsCount}`);
  console.log(`   👑 Strategic Leadership: ${strategicLeadershipCount}`);
  console.log(`   ⚡ Technical Implementation: ${technicalImplementationCount}`);
  console.log(`   🔧 Problem Solving: ${problemSolvingCount}`);
  console.log(`   🔄 Iterative Refinement: ${iterativeRefinementCount}`);
  console.log(`   🧠 Meta-Analysis: ${metaAnalysisCount}`);
  console.log(`   📈 Coaching & Insights: ${coachingInsightsCount}`);
  
  // 7. VALIDATE SUMMARY STATISTICS
  console.log(`\n📊 SUMMARY STATISTICS VALIDATION:`);
  console.log(`   Key Moments Count: ${analysis?.keyMoments?.length || 0} (should match Key Strategic Moments)`);
  console.log(`   Avg Strategic Score: ${avgUserStrategic}/100 (calculated from user segments)`);
  console.log(`   Strategic Patterns: ${strategicPatternsCount} (≥70 strategic score)`);
  console.log(`   Philosophy Alignment: ${analysis?.philosophicalAlignment || 'N/A'}/100`);
  
  // 8. IDENTIFY ISSUES
  console.log(`\n⚠️ POTENTIAL ISSUES DETECTED:`);
  
  let issueCount = 0;
  
  if ((analysis?.keyMoments?.length || 0) === 0) {
    console.log(`   ❌ ISSUE ${++issueCount}: Key Moments count is 0 - should have strategic moments`);
  }
  
  if (avgUserStrategic === 0 && userSegments.length > 0) {
    console.log(`   ❌ ISSUE ${++issueCount}: Average strategic score is 0 with ${userSegments.length} user segments`);
  }
  
  if (executionCount === 0 && conversationInfo.type === 'image-display-issues') {
    console.log(`   ❌ ISSUE ${++issueCount}: Execution count is 0 for Image Display (should have "ensure", "make sure" patterns)`);
  }
  
  if (modularityCount === 0 && conversationInfo.type === 'image-display-issues') {
    console.log(`   ❌ ISSUE ${++issueCount}: Modularity count is 0 for Image Display (should have "singleton", "service" patterns)`);
  }
  
  if (problemSolvingCount === 0 && conversationInfo.type === 'image-display-issues') {
    console.log(`   ❌ ISSUE ${++issueCount}: Problem Solving count is 0 for Image Display (should be high for technical conversation)`);
  }
  
  if (issueCount === 0) {
    console.log(`   ✅ NO ISSUES DETECTED - All numbers appear to be calculating correctly!`);
  }
  
  // 9. SAMPLE SEGMENT ANALYSIS
  console.log(`\n🔍 SAMPLE SEGMENT ANALYSIS:`);
  
  if (segments.length > 0) {
    const sampleSegment = segments[0];
    console.log(`   Sample Segment (${sampleSegment.speaker}):`);
    console.log(`     ID: ${sampleSegment.id}`);
    console.log(`     Strategic Score: ${sampleSegment.strategicScore}/100`);
    console.log(`     Alignment Score: ${sampleSegment.alignmentScore}/100`);
    console.log(`     Content Length: ${sampleSegment.content.length} chars`);
    console.log(`     Strategic Patterns:`, sampleSegment.strategicPatterns);
    console.log(`     Philosophical Alignment:`, sampleSegment.philosophicalAlignment);
    console.log(`     Key Insights: ${sampleSegment.keyInsights?.length || 0}`);
    console.log(`     Content Preview: "${sampleSegment.content.substring(0, 100)}..."`);
  }
  
  // 10. RECOMMENDATIONS
  console.log(`\n💡 VALIDATION RECOMMENDATIONS:`);
  
  if (issueCount > 0) {
    console.log(`   🔧 ${issueCount} issues detected - need to fix calculation logic`);
    
    if ((analysis?.keyMoments?.length || 0) === 0) {
      console.log(`   🔧 Fix: Ensure keyMoments array is properly populated in API response`);
    }
    
    if (avgUserStrategic === 0) {
      console.log(`   🔧 Fix: Check strategic score calculation in parseConversationSegments`);
    }
    
    if (executionCount === 0 && conversationInfo.type === 'image-display-issues') {
      console.log(`   🔧 Fix: Expand execution keywords to include "ensure", "analyze", "make sure"`);
    }
    
  } else {
    console.log(`   ✅ All numbers are calculating correctly!`);
    console.log(`   ✅ Dynamic updates should work properly when switching conversations`);
  }
  
  return issueCount;
}

// Run validation for both conversations
validateStrategicArchitectNumbers()
  .then(() => {
    console.log('\n✅ Strategic Architect Number Validation Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
