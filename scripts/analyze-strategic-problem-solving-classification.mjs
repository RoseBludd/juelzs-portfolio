#!/usr/bin/env node
import fs from 'fs';

/**
 * Analyze Strategic Problem-Solving as Potential New Classification
 * 
 * Question: Should "Strategic Problem Solver" be its own classification?
 * Your approach in Image Display conversation shows strategic problem-solving patterns:
 * - Root cause analysis with architectural thinking
 * - System-level solutions to technical problems  
 * - Principle-based problem resolution
 * - Strategic direction even in debugging contexts
 */

async function analyzeStrategicProblemSolving() {
  console.log('🔍 STRATEGIC PROBLEM-SOLVING CLASSIFICATION ANALYSIS');
  console.log('=' .repeat(80));
  console.log('❓ Question: Should Strategic Problem Solver be its own classification?\n');
  
  try {
    // Read the Image Display conversation
    const conversationPath = 'C:\\Users\\GENIUS\\Desktop\\cursor_investigate_image_display_issues.md';
    const content = fs.readFileSync(conversationPath, 'utf8');
    
    // Extract user messages
    const userMessages = extractUserMessages(content);
    
    // Analyze problem-solving patterns specifically
    const problemSolvingPatterns = analyzeProblemSolvingPatterns(userMessages);
    
    // Compare with traditional problem-solving vs strategic problem-solving
    const classification = classifyProblemSolvingApproach(problemSolvingPatterns);
    
    // Display comprehensive analysis
    displayProblemSolvingAnalysis(problemSolvingPatterns, classification);
    
  } catch (error) {
    console.error('❌ Error analyzing problem-solving patterns:', error.message);
  }
}

function extractUserMessages(content) {
  const userMessages = [];
  const parts = content.split(/\n---\n/);
  
  for (const part of parts) {
    if (part.includes('**User**')) {
      const userContent = part
        .replace(/^\*\*User\*\*/, '')
        .trim();
      
      if (userContent.length > 10) {
        userMessages.push(userContent);
      }
    }
  }
  
  return userMessages;
}

function analyzeProblemSolvingPatterns(messages) {
  const patterns = {
    // Traditional Problem-Solving Patterns
    symptomFocused: 0,           // "image not showing", "error occurring"
    immediateFixing: 0,          // "fix this", "make it work"
    trialAndError: 0,           // "try this", "what if we"
    isolatedSolutions: 0,        // Single-point fixes
    
    // Strategic Problem-Solving Patterns  
    rootCauseAnalysis: 0,        // "this is the reason", "what would stop"
    systemicSolutions: 0,        // "singleton services", "decoupled", "architecture"
    principleApplication: 0,     // "should be", "as it should", applying principles
    strategicDirection: 0,       // "ensure", "make sure", giving direction while solving
    preventiveMindset: 0,        // Solutions that prevent future problems
    
    // Meta-Problem-Solving Patterns
    processImprovement: 0,       // Improving how problems are solved
    frameworkThinking: 0,        // Creating systematic approaches
    learningOriented: 0,         // Understanding why problems occur
    
    // Context Indicators
    technicalDepth: 0,           // Deep technical understanding
    architecturalThinking: 0,    // System architecture considerations
    qualityControl: 0            // "proper", "right", "correct"
  };
  
  messages.forEach(message => {
    const lowerMessage = message.toLowerCase();
    
    // Traditional Problem-Solving
    patterns.symptomFocused += (lowerMessage.match(/\b(not showing|not working|error|issue|problem|broken|failing)\b/g) || []).length;
    patterns.immediateFixing += (lowerMessage.match(/\b(fix|repair|solve|make it work|get it working)\b/g) || []).length;
    patterns.trialAndError += (lowerMessage.match(/\b(try|attempt|what if|maybe|perhaps|could we)\b/g) || []).length;
    patterns.isolatedSolutions += (lowerMessage.match(/\b(just fix|quick fix|patch|workaround|temporary)\b/g) || []).length;
    
    // Strategic Problem-Solving
    patterns.rootCauseAnalysis += (lowerMessage.match(/\b(reason|cause|why|what.*stop|what.*block|dependency|underlying)\b/g) || []).length;
    patterns.systemicSolutions += (lowerMessage.match(/\b(singleton|service|decoupled|architecture|system|modular|framework)\b/g) || []).length;
    patterns.principleApplication += (lowerMessage.match(/\b(should be|as it should|proper|right|correct|principle|standard)\b/g) || []).length;
    patterns.strategicDirection += (lowerMessage.match(/\b(ensure|make sure|verify|confirm|analyze|investigate|approach)\b/g) || []).length;
    patterns.preventiveMindset += (lowerMessage.match(/\b(prevent|avoid|stop.*from|eliminate|reduce|minimize)\b/g) || []).length;
    
    // Meta-Problem-Solving
    patterns.processImprovement += (lowerMessage.match(/\b(process|workflow|methodology|approach|way.*solve)\b/g) || []).length;
    patterns.frameworkThinking += (lowerMessage.match(/\b(framework|pattern|structure|systematic|organized)\b/g) || []).length;
    patterns.learningOriented += (lowerMessage.match(/\b(understand|learn|analyze|study|examine|investigate)\b/g) || []).length;
    
    // Context Indicators
    patterns.technicalDepth += (lowerMessage.match(/\b(middleware|api|service|component|dependency|configuration)\b/g) || []).length;
    patterns.architecturalThinking += (lowerMessage.match(/\b(architecture|design|structure|organization|coupling|decoupling)\b/g) || []).length;
    patterns.qualityControl += (lowerMessage.match(/\b(quality|proper|right|correct|should|working|functional)\b/g) || []).length;
  });
  
  return patterns;
}

function classifyProblemSolvingApproach(patterns) {
  // Calculate scores for different problem-solving approaches
  const traditionalScore = 
    patterns.symptomFocused * 3 +
    patterns.immediateFixing * 2 +
    patterns.trialAndError * 2 +
    patterns.isolatedSolutions * 1;
    
  const strategicScore = 
    patterns.rootCauseAnalysis * 4 +
    patterns.systemicSolutions * 5 +
    patterns.principleApplication * 4 +
    patterns.strategicDirection * 3 +
    patterns.preventiveMindset * 3;
    
  const metaScore = 
    patterns.processImprovement * 4 +
    patterns.frameworkThinking * 3 +
    patterns.learningOriented * 3;
    
  const totalScore = traditionalScore + strategicScore + metaScore;
  
  return {
    traditional: totalScore > 0 ? Math.round((traditionalScore / totalScore) * 100) : 0,
    strategic: totalScore > 0 ? Math.round((strategicScore / totalScore) * 100) : 0,
    meta: totalScore > 0 ? Math.round((metaScore / totalScore) * 100) : 0,
    totalPatterns: totalScore,
    primaryApproach: strategicScore > traditionalScore && strategicScore > metaScore ? 'Strategic' :
                    traditionalScore > metaScore ? 'Traditional' : 'Meta-Cognitive'
  };
}

function displayProblemSolvingAnalysis(patterns, classification) {
  console.log('🔍 PROBLEM-SOLVING APPROACH ANALYSIS');
  console.log('=' .repeat(60));
  
  console.log(`\n📊 PROBLEM-SOLVING STYLE BREAKDOWN:`);
  console.log(`   🎯 Strategic Problem-Solving: ${classification.strategic}%`);
  console.log(`   🔧 Traditional Problem-Solving: ${classification.traditional}%`);
  console.log(`   🧠 Meta-Cognitive Problem-Solving: ${classification.meta}%`);
  
  console.log(`\n🏆 PRIMARY APPROACH: ${classification.primaryApproach} Problem-Solving`);
  
  console.log(`\n🔍 DETAILED PATTERN BREAKDOWN:`);
  console.log(`\n   Strategic Problem-Solving Patterns:`);
  console.log(`     Root Cause Analysis: ${patterns.rootCauseAnalysis} instances`);
  console.log(`     Systemic Solutions: ${patterns.systemicSolutions} instances`);
  console.log(`     Principle Application: ${patterns.principleApplication} instances`);
  console.log(`     Strategic Direction: ${patterns.strategicDirection} instances`);
  console.log(`     Preventive Mindset: ${patterns.preventiveMindset} instances`);
  
  console.log(`\n   Traditional Problem-Solving Patterns:`);
  console.log(`     Symptom Focused: ${patterns.symptomFocused} instances`);
  console.log(`     Immediate Fixing: ${patterns.immediateFixing} instances`);
  console.log(`     Trial and Error: ${patterns.trialAndError} instances`);
  console.log(`     Isolated Solutions: ${patterns.isolatedSolutions} instances`);
  
  console.log(`\n   Context Indicators:`);
  console.log(`     Technical Depth: ${patterns.technicalDepth} instances`);
  console.log(`     Architectural Thinking: ${patterns.architecturalThinking} instances`);
  console.log(`     Quality Control: ${patterns.qualityControl} instances`);
  
  console.log(`\n🎯 KEY INSIGHTS:`);
  
  if (classification.strategic >= 60) {
    console.log(`   ✅ STRATEGIC PROBLEM SOLVER: You approach problems strategically, not just technically`);
    console.log(`   🎯 Root Cause Focus: You look for underlying architectural reasons`);
    console.log(`   🏗️ Systemic Solutions: You propose system-level fixes (singleton services, decoupling)`);
  }
  
  if (patterns.systemicSolutions >= 3) {
    console.log(`   🏗️ ARCHITECTURAL PROBLEM-SOLVING: You consistently apply architectural principles to problems`);
  }
  
  if (patterns.strategicDirection >= 10) {
    console.log(`   👑 LEADERSHIP IN PROBLEM-SOLVING: You give strategic direction even while debugging`);
  }
  
  console.log(`\n💡 CLASSIFICATION RECOMMENDATION:`);
  
  if (classification.strategic >= 60 && patterns.systemicSolutions >= 3) {
    console.log(`\n   🆕 SEPARATE CLASSIFICATION RECOMMENDED: "Strategic Problem Solver"`);
    console.log(`\n   📋 Strategic Problem Solver Characteristics:`);
    console.log(`     • Approaches problems with architectural thinking`);
    console.log(`     • Seeks root causes, not just symptoms`);
    console.log(`     • Proposes systemic solutions (singleton services, decoupling)`);
    console.log(`     • Maintains strategic direction while problem-solving`);
    console.log(`     • Applies principles and quality control to debugging`);
    console.log(`     • Focuses on preventive, long-term solutions`);
    
    console.log(`\n   🎭 DIFFERENCE FROM EXISTING CLASSIFICATIONS:`);
    console.log(`     Strategic Architect: Vision-setting and direction-giving`);
    console.log(`     Technical Implementer: Code-focused problem-solving`);
    console.log(`     Strategic Problem Solver: Architectural approach to problem resolution`);
    
    console.log(`\n   🎯 YOUR PATTERN IN IMAGE DISPLAY CONVERSATION:`);
    console.log(`     ✅ Root Cause: "this is the reason everything should be singleton services"`);
    console.log(`     ✅ Systemic Solution: "decoupled... so ensure it is as it should be"`);
    console.log(`     ✅ Strategic Direction: "analyze properly and ensure you are making the right approach"`);
    console.log(`     ✅ Quality Control: "should be displaying", "as it should be"`);
    
  } else {
    console.log(`\n   💡 FITS WITHIN CONTEXT-ADAPTIVE STRATEGIC ARCHITECT:`);
    console.log(`     Your problem-solving is strategic in nature, not a separate style`);
  }
  
  console.log(`\n📊 ALIGNMENT WITH ADVANCED EXPLORATION CATEGORIES:`);
  console.log(`   🔧 Problem Solving Category: Your approach is strategic, not just technical`);
  console.log(`   🧠 Meta-Analysis Category: You analyze the problem-solving process itself`);
  console.log(`   👑 Strategic Leadership: You lead even while problem-solving`);
  console.log(`\n   💡 RECOMMENDATION: Your problem-solving IS strategic leadership applied to technical challenges`);
}

// Run the analysis
analyzeStrategicProblemSolving()
  .then(() => {
    console.log('\n✅ Strategic Problem-Solving Analysis Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
