#!/usr/bin/env node
import fs from 'fs';

/**
 * Strategic Conversation Grading System
 * Applies the same AI analysis framework used for Strategic Architect Masterclass
 * to grade the "Investigate image display issues" conversation
 */

async function gradeImageDisplayConversation() {
  console.log('🎓 Strategic Conversation Grading System');
  console.log('=' .repeat(80));
  console.log('📋 Analyzing: "Investigate image display issues" conversation\n');
  
  try {
    // Read the conversation file
    const conversationPath = 'C:\\Users\\GENIUS\\Desktop\\cursor_investigate_image_display_issues.md';
    const content = fs.readFileSync(conversationPath, 'utf8');
    
    console.log(`📊 Conversation Stats:`);
    console.log(`   Total Characters: ${content.length.toLocaleString()}`);
    console.log(`   Total Lines: ${content.split('\n').length.toLocaleString()}`);
    
    // Parse conversation segments
    const segments = parseConversationSegments(content);
    console.log(`   Total Segments: ${segments.length}`);
    console.log(`   User Messages: ${segments.filter(s => s.speaker === 'User').length}`);
    console.log(`   Cursor Responses: ${segments.filter(s => s.speaker === 'Cursor').length}`);
    console.log(`   Exchange Segments: ${segments.filter(s => s.speaker === 'Exchange').length}\n`);
    
    // Apply strategic grading
    const grade = await generateConversationGrade(segments, content);
    
    // Display comprehensive grade
    displayConversationGrade(grade);
    
  } catch (error) {
    console.error('❌ Error grading conversation:', error.message);
  }
}

function parseConversationSegments(content) {
  const segments = [];
  const parts = content.split(/\n---\n/);
  
  let exchangeNumber = 1;
  let currentUserMessage = null;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    
    const isUser = part.includes('**User**');
    const isCursor = part.includes('**Cursor**');
    
    if (!isUser && !isCursor) continue;
    
    if (isUser) {
      if (currentUserMessage) {
        // Create standalone user segment
        const strategicPatterns = analyzeStrategicPatterns(currentUserMessage.content);
        const philosophicalAlignment = analyzePhilosophicalAlignment(currentUserMessage.content);
        const strategicScore = calculateStrategicScore(strategicPatterns, 'User');
        const alignmentScore = calculateAlignmentScore(philosophicalAlignment, 'User');
        
        segments.push({
          id: `segment-${segments.length + 1}`,
          speaker: 'User',
          content: currentUserMessage.content,
          timestamp: `Exchange ${currentUserMessage.exchangeNumber}`,
          strategicPatterns,
          philosophicalAlignment,
          strategicScore,
          alignmentScore
        });
      }
      
      const userContent = part.replace(/^\*\*User\*\*/, '').trim();
      if (userContent.length < 10) continue;
      
      currentUserMessage = {
        content: userContent,
        exchangeNumber: exchangeNumber
      };
      exchangeNumber++;
      
    } else if (isCursor && currentUserMessage) {
      const cursorContent = part.replace(/^\*\*Cursor\*\*/, '').trim();
      if (cursorContent.length < 20) continue;
      
      // Create complete exchange
      const fullConversation = `**USER REQUEST:**\n${currentUserMessage.content}\n\n**CURSOR RESPONSE:**\n${cursorContent}`;
      const combinedContent = currentUserMessage.content + ' ' + cursorContent;
      
      const strategicPatterns = analyzeStrategicPatterns(currentUserMessage.content);
      const philosophicalAlignment = analyzePhilosophicalAlignment(combinedContent);
      const strategicScore = calculateStrategicScore(strategicPatterns, 'Exchange');
      const alignmentScore = calculateAlignmentScore(philosophicalAlignment, 'Exchange');
      
      segments.push({
        id: `segment-${segments.length + 1}`,
        speaker: 'Exchange',
        content: fullConversation,
        userContent: currentUserMessage.content,
        cursorContent: cursorContent,
        timestamp: `Exchange ${currentUserMessage.exchangeNumber}`,
        strategicPatterns,
        philosophicalAlignment,
        strategicScore,
        alignmentScore
      });
      
      currentUserMessage = null;
    }
  }
  
  return segments;
}

function analyzeStrategicPatterns(content) {
  const lowerContent = content.toLowerCase();
  
  return {
    directionGiving: (lowerContent.match(/\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm|create|build|fix|solve|execute|run|test|check|update|add|remove|delete|modify|change)\b/g) || []).length,
    systemThinking: (lowerContent.match(/\b(ecosystem|integration|overall|comprehensive|end-to-end|system|architecture|cadis|developer|team|database|service|module|component|framework|infrastructure)\b/g) || []).length,
    qualityControl: (lowerContent.match(/\b(verify|confirm|test|validate|check|quality|proper|right|should|correct|working|functional|operational|ready|complete|finished)\b/g) || []).length,
    iterativeRefinement: (lowerContent.match(/\b(but|however|also|additionally|what about|should also|make sure|scope|expand|improve|enhance|better|optimize|refine|adjust)\b/g) || []).length,
    problemDiagnosis: (lowerContent.match(/\b(what do|why|understand|explain|real issue|root cause|gap|missing|optimize|problem|issue|error|bug|wrong|broken|not working)\b/g) || []).length,
    metaAnalysis: (lowerContent.match(/\b(analyze.*conversation|define.*styles|framework|pattern|understand.*difference|meta|think|approach|methodology|strategy|philosophy|principle)\b/g) || []).length
  };
}

function analyzePhilosophicalAlignment(content) {
  const lowerContent = content.toLowerCase();
  
  const patterns = {
    execution: (lowerContent.match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure|ensure|verify|confirm|run|test|check|analyze|optimize|go ahead|start|begin|complete|finish|handle|process|setup|configure|deploy)\b/g) || []).length,
    modularity: (lowerContent.match(/\b(modular|component|service|singleton|module|reusable|separate|individual|independent|isolated|architecture|system|structure|organize|clean|maintainable)\b/g) || []).length,
    reusability: (lowerContent.match(/\b(reusable|framework|pattern|template|systematic|scale|standard|consistent|library|utility|helper|common|shared|generic|flexible|adaptable)\b/g) || []).length,
    teachability: (lowerContent.match(/\b(document|explain|understand|framework|define|teach|learn|analyze|study|review|examine|investigate|explore|discover|insight|knowledge|comprehend|clarify)\b/g) || []).length,
    progressiveEnhancement: (lowerContent.match(/\b(enhance|improve|upgrade|build on|add to|progressive|expand|extend|optimize|refine|evolve|advance|develop|grow|scale|iterate|better|enhancement)\b/g) || []).length
  };
  
  const baseScores = {
    execution: Math.min(100, patterns.execution * 12),
    modularity: Math.min(100, patterns.modularity * 15),
    reusability: Math.min(100, patterns.reusability * 15),
    teachability: Math.min(100, patterns.teachability * 10),
    progressiveEnhancement: Math.min(100, patterns.progressiveEnhancement * 12)
  };
  
  const totalPatterns = Object.values(patterns).reduce((sum, count) => sum + count, 0);
  const hasStrategicContent = totalPatterns > 0;
  
  return {
    execution: Math.max(hasStrategicContent ? 40 : 0, baseScores.execution),
    modularity: Math.max(hasStrategicContent ? 30 : 0, baseScores.modularity),
    reusability: Math.max(hasStrategicContent ? 35 : 0, baseScores.reusability),
    teachability: Math.max(hasStrategicContent ? 45 : 0, baseScores.teachability),
    progressiveEnhancement: Math.max(hasStrategicContent ? 40 : 0, baseScores.progressiveEnhancement)
  };
}

function calculateStrategicScore(patterns, speaker = 'User') {
  const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
  
  if (speaker === 'Exchange' || speaker === 'User') {
    let score = total > 0 ? 50 : 0;
    
    score += Math.min(20, patterns.directionGiving * 4);
    score += Math.min(15, patterns.systemThinking * 3);
    score += Math.min(12, patterns.qualityControl * 3);
    score += Math.min(12, patterns.iterativeRefinement * 3);
    score += Math.min(10, patterns.problemDiagnosis * 2.5);
    score += Math.min(15, patterns.metaAnalysis * 5);
    
    if (total >= 5) score += 10;
    if (patterns.directionGiving >= 3) score += 8;
    if (patterns.directionGiving > 0 || patterns.systemThinking > 0) {
      score = Math.max(65, score);
    }
    
    return Math.min(100, Math.round(score));
  }
  
  return Math.min(35, total * 2.5);
}

function calculateAlignmentScore(alignment, speaker = 'User') {
  const scores = Object.values(alignment);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  if (speaker === 'Exchange') {
    let finalScore = avgScore;
    
    if (alignment.execution >= 60) finalScore += 20;
    
    const highScores = scores.filter(score => score >= 50).length;
    if (highScores >= 3) finalScore += 15;
    
    if (alignment.teachability >= 70) finalScore += 12;
    if (alignment.progressiveEnhancement >= 60) finalScore += 10;
    
    if (avgScore > 0) finalScore = Math.max(65, finalScore);
    
    return Math.min(100, Math.round(finalScore));
  }
  
  if (speaker === 'User') {
    let finalScore = avgScore;
    if (alignment.execution >= 60) finalScore += 15;
    
    const highScores = scores.filter(score => score >= 50).length;
    if (highScores >= 3) finalScore += 10;
    
    if (alignment.teachability >= 70) finalScore += 8;
    if (avgScore > 0) finalScore = Math.max(50, finalScore);
    
    return Math.min(100, Math.round(finalScore));
  }
  
  return Math.min(50, Math.round(avgScore * 0.6));
}

async function generateConversationGrade(segments, content) {
  const userSegments = segments.filter(s => s.speaker === 'User');
  const exchangeSegments = segments.filter(s => s.speaker === 'Exchange');
  const cursorSegments = segments.filter(s => s.speaker === 'Cursor');
  
  // Calculate overall metrics
  const avgStrategicScore = userSegments.length > 0 
    ? Math.round(userSegments.reduce((sum, s) => sum + s.strategicScore, 0) / userSegments.length)
    : 0;
    
  const avgAlignmentScore = exchangeSegments.length > 0
    ? Math.round(exchangeSegments.reduce((sum, s) => sum + s.alignmentScore, 0) / exchangeSegments.length)
    : 0;
  
  // Analyze conversation characteristics
  const conversationLength = content.length;
  const technicalDepth = (content.match(/```[\s\S]*?```/g) || []).length;
  const problemSolvingFocus = (content.toLowerCase().match(/\b(error|issue|problem|fix|debug|troubleshoot)\b/g) || []).length;
  const systemicThinking = (content.toLowerCase().match(/\b(system|architecture|service|singleton|modular|framework)\b/g) || []).length;
  
  // Calculate contextual factors
  const contextFactors = {
    conversationLength: Math.min(100, (conversationLength / 50000) * 100), // Relative to typical conversation
    technicalDepth: Math.min(100, technicalDepth * 10),
    problemSolvingFocus: Math.min(100, problemSolvingFocus * 2),
    systemicThinking: Math.min(100, systemicThinking * 3),
    contextPreservation: Math.round((exchangeSegments.length / segments.length) * 100)
  };
  
  // Generate overall grade
  const overallGrade = Math.round((
    avgStrategicScore * 0.3 +
    avgAlignmentScore * 0.25 +
    contextFactors.technicalDepth * 0.15 +
    contextFactors.problemSolvingFocus * 0.15 +
    contextFactors.systemicThinking * 0.15
  ));
  
  return {
    overallGrade,
    avgStrategicScore,
    avgAlignmentScore,
    contextFactors,
    segments: {
      total: segments.length,
      user: userSegments.length,
      cursor: cursorSegments.length,
      exchange: exchangeSegments.length
    },
    conversationCharacteristics: {
      primaryFocus: 'Technical Problem Solving',
      secondaryFocus: 'System Architecture',
      strategicApproach: avgStrategicScore >= 70 ? 'Strong' : avgStrategicScore >= 50 ? 'Moderate' : 'Developing',
      philosophicalAlignment: avgAlignmentScore >= 80 ? 'Excellent' : avgAlignmentScore >= 60 ? 'Good' : 'Needs Improvement'
    },
    learningValue: {
      strategicLeadership: Math.round(avgStrategicScore * 0.8),
      technicalImplementation: Math.round(contextFactors.technicalDepth * 0.9),
      problemSolving: Math.round(contextFactors.problemSolvingFocus * 0.85),
      systemArchitecture: Math.round(contextFactors.systemicThinking * 0.9)
    }
  };
}

function displayConversationGrade(grade) {
  console.log('🎯 CONVERSATION GRADE ANALYSIS');
  console.log('=' .repeat(60));
  
  // Overall Grade
  const gradeLevel = 
    grade.overallGrade >= 90 ? 'A+' :
    grade.overallGrade >= 85 ? 'A' :
    grade.overallGrade >= 80 ? 'A-' :
    grade.overallGrade >= 75 ? 'B+' :
    grade.overallGrade >= 70 ? 'B' :
    grade.overallGrade >= 65 ? 'B-' :
    grade.overallGrade >= 60 ? 'C+' : 'C';
  
  console.log(`\n🏆 OVERALL GRADE: ${gradeLevel} (${grade.overallGrade}/100)`);
  console.log(`\n📊 CORE METRICS:`);
  console.log(`   Strategic Leadership Score: ${grade.avgStrategicScore}/100`);
  console.log(`   Philosophical Alignment: ${grade.avgAlignmentScore}/100`);
  console.log(`   Technical Depth: ${grade.contextFactors.technicalDepth}/100`);
  console.log(`   Problem-Solving Focus: ${grade.contextFactors.problemSolvingFocus}/100`);
  console.log(`   Systemic Thinking: ${grade.contextFactors.systemicThinking}/100`);
  
  console.log(`\n📈 SEGMENT ANALYSIS:`);
  console.log(`   Total Segments: ${grade.segments.total}`);
  console.log(`   Exchange Segments: ${grade.segments.exchange} (${Math.round((grade.segments.exchange / grade.segments.total) * 100)}% context preservation)`);
  console.log(`   User Messages: ${grade.segments.user}`);
  console.log(`   Cursor Responses: ${grade.segments.cursor}`);
  
  console.log(`\n🎭 CONVERSATION CHARACTERISTICS:`);
  console.log(`   Primary Focus: ${grade.conversationCharacteristics.primaryFocus}`);
  console.log(`   Secondary Focus: ${grade.conversationCharacteristics.secondaryFocus}`);
  console.log(`   Strategic Approach: ${grade.conversationCharacteristics.strategicApproach}`);
  console.log(`   Philosophical Alignment: ${grade.conversationCharacteristics.philosophicalAlignment}`);
  
  console.log(`\n🎓 LEARNING VALUE BY CATEGORY:`);
  console.log(`   👑 Strategic Leadership: ${grade.learningValue.strategicLeadership}/100`);
  console.log(`   ⚡ Technical Implementation: ${grade.learningValue.technicalImplementation}/100`);
  console.log(`   🔧 Problem Solving: ${grade.learningValue.problemSolving}/100`);
  console.log(`   🏗️ System Architecture: ${grade.learningValue.systemArchitecture}/100`);
  
  // Comparison with previous conversation
  console.log(`\n📊 COMPARISON WITH CADIS DEVELOPER CONVERSATION:`);
  console.log(`   Previous Conversation: A- (Strategic focus, 1.85M chars, 90% context)`);
  console.log(`   This Conversation: ${gradeLevel} (Problem-solving focus, 3.36M chars, ${grade.contextFactors.contextPreservation}% context)`);
  
  // Recommendations
  console.log(`\n💡 STRATEGIC RECOMMENDATIONS:`);
  
  if (grade.overallGrade >= 80) {
    console.log(`   ✅ EXCELLENT conversation for Strategic Architect Masterclass`);
    console.log(`   ✅ High learning value across multiple categories`);
    console.log(`   ✅ Strong technical problem-solving demonstration`);
  } else if (grade.overallGrade >= 70) {
    console.log(`   ✅ GOOD conversation with solid learning value`);
    console.log(`   💡 Consider highlighting strongest segments for masterclass`);
  } else {
    console.log(`   ⚠️ MODERATE learning value - may need filtering for best segments`);
  }
  
  if (grade.contextFactors.contextPreservation >= 80) {
    console.log(`   ✅ Excellent context preservation for complete learning`);
  }
  
  if (grade.learningValue.problemSolving >= 80) {
    console.log(`   ✅ Outstanding for Problem-Solving learning category`);
  }
  
  if (grade.learningValue.technicalImplementation >= 80) {
    console.log(`   ✅ Outstanding for Technical Implementation learning`);
  }
  
  console.log(`\n🎯 MASTERCLASS INTEGRATION RECOMMENDATION:`);
  
  if (grade.overallGrade >= 75) {
    console.log(`   🚀 HIGHLY RECOMMENDED for Strategic Architect Masterclass`);
    console.log(`   📚 Would complement existing conversation with different focus area`);
    console.log(`   🎓 Excellent for Problem-Solving and Technical Implementation categories`);
  } else {
    console.log(`   💡 Consider selective integration of highest-value segments`);
  }
}

// Run the grading analysis
gradeImageDisplayConversation()
  .then(() => {
    console.log('\n✅ Conversation Grading Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Grading failed:', error);
    process.exit(1);
  });
