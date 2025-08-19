#!/usr/bin/env node
import fs from 'fs';

/**
 * Analyze Juelz's Interaction Style in Image Display Issues Conversation
 * Uses the same CADIS interaction style framework to classify interaction patterns
 */

async function analyzeJuelzInteractionStyle() {
  console.log('🎭 JUELZ INTERACTION STYLE ANALYSIS');
  console.log('📋 Conversation: Image Display Issues');
  console.log('=' .repeat(80));
  
  try {
    // Read the conversation file
    const conversationPath = 'C:\\Users\\GENIUS\\Desktop\\cursor_investigate_image_display_issues.md';
    const content = fs.readFileSync(conversationPath, 'utf8');
    
    // Extract all User messages
    const userMessages = extractUserMessages(content);
    
    console.log(`📊 Found ${userMessages.length} user messages to analyze\n`);
    
    // Analyze interaction patterns
    const interactionPatterns = analyzeInteractionPatterns(userMessages);
    
    // Calculate style scores
    const styleScores = calculateStyleScores(interactionPatterns);
    
    // Determine primary and secondary styles
    const styleRanking = rankInteractionStyles(styleScores);
    
    // Display comprehensive analysis
    displayInteractionAnalysis(userMessages, interactionPatterns, styleScores, styleRanking);
    
  } catch (error) {
    console.error('❌ Error analyzing interaction style:', error.message);
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

function analyzeInteractionPatterns(messages) {
  const patterns = {
    // Strategic Architect Patterns
    directionGiving: 0,
    systemThinking: 0,
    qualityControl: 0,
    visionCasting: 0,
    
    // Technical Implementer Patterns  
    problemFocused: 0,
    solutionOriented: 0,
    detailOriented: 0,
    debuggingMindset: 0,
    
    // Creative Collaborator Patterns
    ideaGeneration: 0,
    brainstorming: 0,
    alternativeApproaches: 0,
    innovativeThinking: 0,
    
    // Analytical Processor Patterns
    dataFocused: 0,
    systematicApproach: 0,
    thoroughAnalysis: 0,
    evidenceBased: 0,
    
    // Meta-Cognitive Patterns
    processAwareness: 0,
    frameworkThinking: 0,
    patternRecognition: 0,
    principleApplication: 0
  };
  
  messages.forEach(message => {
    const lowerMessage = message.toLowerCase();
    
    // Strategic Architect Patterns
    patterns.directionGiving += (lowerMessage.match(/\b(ensure|make sure|should|need to|must|analyze|verify|confirm|check|proceed|implement)\b/g) || []).length;
    patterns.systemThinking += (lowerMessage.match(/\b(system|architecture|overall|comprehensive|ecosystem|integration|dependency|service|modular)\b/g) || []).length;
    patterns.qualityControl += (lowerMessage.match(/\b(proper|right|correct|quality|working|functional|should be|as it should)\b/g) || []).length;
    patterns.visionCasting += (lowerMessage.match(/\b(approach|strategy|methodology|framework|pattern|principle|philosophy)\b/g) || []).length;
    
    // Technical Implementer Patterns
    patterns.problemFocused += (lowerMessage.match(/\b(problem|issue|error|bug|not working|broken|failing|wrong)\b/g) || []).length;
    patterns.solutionOriented += (lowerMessage.match(/\b(fix|solve|resolve|handle|address|implement|build|create)\b/g) || []).length;
    patterns.detailOriented += (lowerMessage.match(/\b(specific|exactly|precisely|detail|particular|individual|component)\b/g) || []).length;
    patterns.debuggingMindset += (lowerMessage.match(/\b(debug|investigate|analyze|examine|look at|check|test|trace)\b/g) || []).length;
    
    // Creative Collaborator Patterns
    patterns.ideaGeneration += (lowerMessage.match(/\b(idea|concept|approach|alternative|option|possibility|way|method)\b/g) || []).length;
    patterns.brainstorming += (lowerMessage.match(/\b(what if|maybe|perhaps|could|might|consider|explore|try)\b/g) || []).length;
    patterns.alternativeApproaches += (lowerMessage.match(/\b(different|another|alternative|other|better|improved|enhanced)\b/g) || []).length;
    patterns.innovativeThinking += (lowerMessage.match(/\b(innovative|creative|novel|unique|original|breakthrough)\b/g) || []).length;
    
    // Analytical Processor Patterns
    patterns.dataFocused += (lowerMessage.match(/\b(data|evidence|facts|information|metrics|results|analysis|report)\b/g) || []).length;
    patterns.systematicApproach += (lowerMessage.match(/\b(systematic|methodical|structured|organized|step by step|process)\b/g) || []).length;
    patterns.thoroughAnalysis += (lowerMessage.match(/\b(thorough|comprehensive|complete|detailed|in-depth|extensive)\b/g) || []).length;
    patterns.evidenceBased += (lowerMessage.match(/\b(evidence|proof|demonstrate|verify|validate|confirm|show)\b/g) || []).length;
    
    // Meta-Cognitive Patterns
    patterns.processAwareness += (lowerMessage.match(/\b(process|workflow|methodology|approach|way we|how we)\b/g) || []).length;
    patterns.frameworkThinking += (lowerMessage.match(/\b(framework|pattern|structure|model|template|standard)\b/g) || []).length;
    patterns.patternRecognition += (lowerMessage.match(/\b(pattern|trend|recurring|consistent|similar|common)\b/g) || []).length;
    patterns.principleApplication += (lowerMessage.match(/\b(principle|rule|guideline|best practice|standard|convention)\b/g) || []).length;
  });
  
  return patterns;
}

function calculateStyleScores(patterns) {
  // Calculate scores for each interaction style
  const strategicArchitect = 
    patterns.directionGiving * 4 +
    patterns.systemThinking * 3 +
    patterns.qualityControl * 3 +
    patterns.visionCasting * 2;
    
  const technicalImplementer = 
    patterns.problemFocused * 3 +
    patterns.solutionOriented * 4 +
    patterns.detailOriented * 2 +
    patterns.debuggingMindset * 3;
    
  const creativeCollaborator = 
    patterns.ideaGeneration * 3 +
    patterns.brainstorming * 4 +
    patterns.alternativeApproaches * 3 +
    patterns.innovativeThinking * 2;
    
  const analyticalProcessor = 
    patterns.dataFocused * 3 +
    patterns.systematicApproach * 4 +
    patterns.thoroughAnalysis * 3 +
    patterns.evidenceBased * 2;
    
  const metaCognitive = 
    patterns.processAwareness * 4 +
    patterns.frameworkThinking * 3 +
    patterns.patternRecognition * 3 +
    patterns.principleApplication * 4;
  
  const totalScore = strategicArchitect + technicalImplementer + creativeCollaborator + analyticalProcessor + metaCognitive;
  
  return {
    strategicArchitect: totalScore > 0 ? Math.round((strategicArchitect / totalScore) * 100) : 0,
    technicalImplementer: totalScore > 0 ? Math.round((technicalImplementer / totalScore) * 100) : 0,
    creativeCollaborator: totalScore > 0 ? Math.round((creativeCollaborator / totalScore) * 100) : 0,
    analyticalProcessor: totalScore > 0 ? Math.round((analyticalProcessor / totalScore) * 100) : 0,
    metaCognitive: totalScore > 0 ? Math.round((metaCognitive / totalScore) * 100) : 0,
    totalPatterns: totalScore
  };
}

function rankInteractionStyles(scores) {
  const styles = [
    { name: 'Strategic Architect', score: scores.strategicArchitect, description: 'Direction-giving, system thinking, quality control' },
    { name: 'Technical Implementer', score: scores.technicalImplementer, description: 'Problem-focused, solution-oriented, debugging mindset' },
    { name: 'Creative Collaborator', score: scores.creativeCollaborator, description: 'Idea generation, brainstorming, alternative approaches' },
    { name: 'Analytical Processor', score: scores.analyticalProcessor, description: 'Data-focused, systematic, evidence-based' },
    { name: 'Meta-Cognitive Analyst', score: scores.metaCognitive, description: 'Process awareness, framework thinking, principle application' }
  ];
  
  return styles.sort((a, b) => b.score - a.score);
}

function displayInteractionAnalysis(messages, patterns, scores, ranking) {
  console.log('🎯 INTERACTION STYLE ANALYSIS RESULTS');
  console.log('=' .repeat(60));
  
  // Primary and secondary styles
  const primary = ranking[0];
  const secondary = ranking[1];
  
  console.log(`\n🏆 PRIMARY STYLE: ${primary.name} (${primary.score}%)`);
  console.log(`🥈 SECONDARY STYLE: ${secondary.name} (${secondary.score}%)`);
  
  console.log(`\n📊 COMPLETE STYLE BREAKDOWN:`);
  ranking.forEach((style, index) => {
    const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
    console.log(`   ${emoji} ${style.name}: ${style.score}% - ${style.description}`);
  });
  
  console.log(`\n🔍 DETAILED PATTERN ANALYSIS:`);
  console.log(`   Direction Giving: ${patterns.directionGiving} instances`);
  console.log(`   System Thinking: ${patterns.systemThinking} instances`);
  console.log(`   Quality Control: ${patterns.qualityControl} instances`);
  console.log(`   Problem Focused: ${patterns.problemFocused} instances`);
  console.log(`   Solution Oriented: ${patterns.solutionOriented} instances`);
  console.log(`   Debugging Mindset: ${patterns.debuggingMindset} instances`);
  console.log(`   Framework Thinking: ${patterns.frameworkThinking} instances`);
  console.log(`   Principle Application: ${patterns.principleApplication} instances`);
  
  console.log(`\n📋 SAMPLE USER MESSAGES ANALYSIS:`);
  
  // Analyze specific messages for style demonstration
  const sampleMessages = messages.slice(0, 5);
  sampleMessages.forEach((message, index) => {
    console.log(`\n   Message ${index + 1}: "${message.substring(0, 100)}..."`);
    
    const msgLower = message.toLowerCase();
    const styleIndicators = [];
    
    if (msgLower.includes('ensure') || msgLower.includes('make sure') || msgLower.includes('should')) {
      styleIndicators.push('Strategic Direction');
    }
    if (msgLower.includes('singleton') || msgLower.includes('service') || msgLower.includes('architecture')) {
      styleIndicators.push('System Thinking');
    }
    if (msgLower.includes('problem') || msgLower.includes('issue') || msgLower.includes('error')) {
      styleIndicators.push('Problem-Focused');
    }
    if (msgLower.includes('analyze') || msgLower.includes('investigate') || msgLower.includes('check')) {
      styleIndicators.push('Analytical');
    }
    
    console.log(`     Style Indicators: ${styleIndicators.join(', ') || 'General Communication'}`);
  });
  
  console.log(`\n🎓 COMPARISON WITH CADIS DEVELOPER CONVERSATION:`);
  console.log(`   CADIS Conversation: Strategic Architect (95%) + Meta-Cognitive (85%)`);
  console.log(`   Image Display: ${primary.name} (${primary.score}%) + ${secondary.name} (${secondary.score}%)`);
  
  console.log(`\n💡 INTERACTION STYLE INSIGHTS:`);
  
  if (primary.name === 'Strategic Architect' && primary.score >= 40) {
    console.log(`   ✅ CONSISTENT STRATEGIC ARCHITECT: Your leadership style is consistent across conversations`);
    console.log(`   🎯 Even in technical problem-solving, you maintain strategic direction-giving patterns`);
  } else if (primary.name === 'Technical Implementer' && primary.score >= 40) {
    console.log(`   🔧 TECHNICAL IMPLEMENTER MODE: You adapt your style based on conversation context`);
    console.log(`   💡 Shows flexibility - strategic when needed, technical when focused on implementation`);
  } else if (primary.name === 'Analytical Processor' && primary.score >= 40) {
    console.log(`   📊 ANALYTICAL PROCESSOR MODE: You focus on systematic analysis and evidence`);
    console.log(`   🔍 Shows methodical approach to complex technical problems`);
  }
  
  if (scores.strategicArchitect + scores.metaCognitive >= 50) {
    console.log(`   🧠 META-STRATEGIC HYBRID: You combine strategic thinking with meta-cognitive awareness`);
  }
  
  if (scores.technicalImplementer >= 30 && scores.strategicArchitect >= 30) {
    console.log(`   ⚡ STRATEGIC-TECHNICAL HYBRID: You balance leadership with technical execution`);
  }
  
  console.log(`\n🎯 FINAL CLASSIFICATION:`);
  
  if (primary.score >= 40) {
    console.log(`   PRIMARY TYPE: ${primary.name} (${primary.score}%)`);
    if (secondary.score >= 25) {
      console.log(`   SECONDARY TYPE: ${secondary.name} (${secondary.score}%)`);
      console.log(`   HYBRID CLASSIFICATION: ${primary.name} + ${secondary.name}`);
    } else {
      console.log(`   PURE TYPE: ${primary.name} (Strong dominance)`);
    }
  } else {
    console.log(`   BALANCED HYBRID: No dominant style (adaptive leadership)`);
  }
  
  console.log(`\n📈 CONTEXT ADAPTATION ANALYSIS:`);
  console.log(`   Strategic Context (CADIS): Strategic Architect (95%) - Vision and direction`);
  console.log(`   Technical Context (Images): ${primary.name} (${primary.score}%) - ${primary.description}`);
  console.log(`   Adaptation Score: ${Math.abs(95 - primary.score)}% style shift based on context`);
  
  if (Math.abs(95 - primary.score) > 30) {
    console.log(`   🎭 HIGH ADAPTABILITY: You significantly adjust style based on conversation context`);
  } else {
    console.log(`   🎯 CONSISTENT STYLE: You maintain similar patterns across different contexts`);
  }
}

// Run the analysis
analyzeJuelzInteractionStyle()
  .then(() => {
    console.log('\n✅ Interaction Style Analysis Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
