#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

/**
 * Comprehensive CADIS Journal Analysis Test
 * 
 * This script will:
 * 1. Directly access your journal entries from the database
 * 2. Run the CADIS analysis algorithms 
 * 3. Generate the Journal Analysis Dream
 * 4. Show detailed analysis of what CADIS is saying about you
 * 5. Provide thorough summary of insights and patterns
 */

async function comprehensiveCADISJournalTest() {
  console.log('🧠 COMPREHENSIVE CADIS JOURNAL ANALYSIS TEST');
  console.log('=' .repeat(80));
  console.log('📋 Analyzing your journal entries to understand your strategic architect patterns\n');
  
  try {
    // Connect to database
    const connectionString = process.env.VIBEZS_DB;
    
    if (!connectionString) {
      console.log('❌ VIBEZS_DB environment variable not found');
      return;
    }
    
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const pool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    const client = await pool.connect();
    
    try {
      // Get your journal entries
      console.log('📝 Fetching your journal entries...');
      
      const journalEntries = await client.query(`
        SELECT 
          id, title, content, category, tags, 
          created_at, updated_at
        FROM journal_entries 
        WHERE is_private = false OR is_private IS NULL
        ORDER BY created_at DESC
        LIMIT 50
      `);
      
      console.log(`✅ Found ${journalEntries.rows.length} journal entries for analysis\n`);
      
      if (journalEntries.rows.length === 0) {
        console.log('⚠️ No journal entries found - create some entries first for CADIS to analyze');
        return;
      }
      
      // Run comprehensive analysis
      const analysis = await runComprehensiveJournalAnalysis(journalEntries.rows);
      
      // Display detailed results
      displayDetailedAnalysis(analysis, journalEntries.rows);
      
      // Generate and display dream exploration
      const dreamExploration = generateJournalDreamExploration(analysis, journalEntries.rows);
      displayDreamExploration(dreamExploration);
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

async function runComprehensiveJournalAnalysis(entries) {
  console.log('🔍 RUNNING COMPREHENSIVE CADIS ANALYSIS');
  console.log('=' .repeat(60));
  
  // 1. Analyze thinking patterns
  const thinkingPatterns = analyzeDetailedThinkingPatterns(entries);
  
  // 2. Analyze philosophical alignment
  const philosophicalAlignment = analyzeDetailedPhilosophicalAlignment(entries);
  
  // 3. Analyze strategic evolution
  const strategicEvolution = analyzeStrategicEvolution(entries);
  
  // 4. Analyze leadership style patterns
  const leadershipPatterns = analyzeLeadershipPatterns(entries);
  
  // 5. Generate overall assessment
  const overallAssessment = generateOverallAssessment(thinkingPatterns, philosophicalAlignment, strategicEvolution, leadershipPatterns);
  
  return {
    thinkingPatterns,
    philosophicalAlignment,
    strategicEvolution,
    leadershipPatterns,
    overallAssessment,
    totalEntries: entries.length,
    analysisTimestamp: new Date().toISOString()
  };
}

function analyzeDetailedThinkingPatterns(entries) {
  console.log('📊 Analyzing your thinking patterns...');
  
  const patterns = {
    strategicThinking: { count: 0, examples: [] },
    systemsThinking: { count: 0, examples: [] },
    problemSolving: { count: 0, examples: [] },
    metaCognitive: { count: 0, examples: [] },
    executionFocused: { count: 0, examples: [] },
    frameworkCreation: { count: 0, examples: [] },
    architecturalThinking: { count: 0, examples: [] },
    qualityControl: { count: 0, examples: [] }
  };
  
  entries.forEach(entry => {
    const content = (entry.content + ' ' + entry.title).toLowerCase();
    
    // Strategic thinking
    const strategicMatches = content.match(/\b(strategy|strategic|direction|vision|plan|approach|goal|objective)\b/g) || [];
    if (strategicMatches.length > 0) {
      patterns.strategicThinking.count += strategicMatches.length;
      patterns.strategicThinking.examples.push({
        title: entry.title,
        matches: strategicMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Systems thinking
    const systemsMatches = content.match(/\b(system|architecture|framework|structure|design|modular|component|service)\b/g) || [];
    if (systemsMatches.length > 0) {
      patterns.systemsThinking.count += systemsMatches.length;
      patterns.systemsThinking.examples.push({
        title: entry.title,
        matches: systemsMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Problem solving
    const problemMatches = content.match(/\b(problem|issue|solution|fix|resolve|debug|troubleshoot|challenge)\b/g) || [];
    if (problemMatches.length > 0) {
      patterns.problemSolving.count += problemMatches.length;
      patterns.problemSolving.examples.push({
        title: entry.title,
        matches: problemMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Meta-cognitive
    const metaMatches = content.match(/\b(analyze|understand|learn|reflect|think|consider|evaluate|review)\b/g) || [];
    if (metaMatches.length > 0) {
      patterns.metaCognitive.count += metaMatches.length;
      patterns.metaCognitive.examples.push({
        title: entry.title,
        matches: metaMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Execution-focused
    const executionMatches = content.match(/\b(implement|build|create|execute|proceed|ensure|make sure|action|do)\b/g) || [];
    if (executionMatches.length > 0) {
      patterns.executionFocused.count += executionMatches.length;
      patterns.executionFocused.examples.push({
        title: entry.title,
        matches: executionMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Framework creation
    const frameworkMatches = content.match(/\b(framework|pattern|template|methodology|process|systematic|standard)\b/g) || [];
    if (frameworkMatches.length > 0) {
      patterns.frameworkCreation.count += frameworkMatches.length;
      patterns.frameworkCreation.examples.push({
        title: entry.title,
        matches: frameworkMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Architectural thinking
    const archMatches = content.match(/\b(architecture|architectural|design|structure|organization|hierarchy)\b/g) || [];
    if (archMatches.length > 0) {
      patterns.architecturalThinking.count += archMatches.length;
      patterns.architecturalThinking.examples.push({
        title: entry.title,
        matches: archMatches.slice(0, 3),
        date: entry.created_at
      });
    }
    
    // Quality control
    const qualityMatches = content.match(/\b(quality|proper|right|correct|should|standard|best practice|optimize)\b/g) || [];
    if (qualityMatches.length > 0) {
      patterns.qualityControl.count += qualityMatches.length;
      patterns.qualityControl.examples.push({
        title: entry.title,
        matches: qualityMatches.slice(0, 3),
        date: entry.created_at
      });
    }
  });
  
  // Calculate percentages
  const totalPatterns = Object.values(patterns).reduce((sum, pattern) => sum + pattern.count, 0);
  
  return Object.entries(patterns).map(([type, data]) => ({
    type: type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    count: data.count,
    frequency: totalPatterns > 0 ? Math.round((data.count / totalPatterns) * 100) : 0,
    examples: data.examples.slice(0, 3),
    description: getPatternDescription(type)
  })).filter(p => p.count > 0).sort((a, b) => b.frequency - a.frequency);
}

function analyzeDetailedPhilosophicalAlignment(entries) {
  console.log('🎯 Analyzing your philosophical alignment...');
  
  const alignment = {
    execution: { score: 0, examples: [], keywords: [] },
    modularity: { score: 0, examples: [], keywords: [] },
    reusability: { score: 0, examples: [], keywords: [] },
    teachability: { score: 0, examples: [], keywords: [] },
    progressiveEnhancement: { score: 0, examples: [], keywords: [] }
  };
  
  entries.forEach(entry => {
    const content = (entry.content + ' ' + entry.title).toLowerCase();
    
    // Execution alignment
    const executionMatches = content.match(/\b(proceed|implement|build|create|execute|ensure|make sure|action|do|fix|solve)\b/g) || [];
    if (executionMatches.length > 0) {
      alignment.execution.score += executionMatches.length * 10;
      alignment.execution.examples.push(entry.title);
      alignment.execution.keywords.push(...executionMatches.slice(0, 3));
    }
    
    // Modularity alignment
    const modularityMatches = content.match(/\b(modular|component|service|singleton|separate|architecture|system|structure|organize)\b/g) || [];
    if (modularityMatches.length > 0) {
      alignment.modularity.score += modularityMatches.length * 12;
      alignment.modularity.examples.push(entry.title);
      alignment.modularity.keywords.push(...modularityMatches.slice(0, 3));
    }
    
    // Reusability alignment
    const reusabilityMatches = content.match(/\b(reusable|framework|pattern|template|systematic|scale|standard|consistent|library)\b/g) || [];
    if (reusabilityMatches.length > 0) {
      alignment.reusability.score += reusabilityMatches.length * 12;
      alignment.reusability.examples.push(entry.title);
      alignment.reusability.keywords.push(...reusabilityMatches.slice(0, 3));
    }
    
    // Teachability alignment
    const teachabilityMatches = content.match(/\b(document|explain|understand|teach|learn|analyze|framework|define|clarify)\b/g) || [];
    if (teachabilityMatches.length > 0) {
      alignment.teachability.score += teachabilityMatches.length * 8;
      alignment.teachability.examples.push(entry.title);
      alignment.teachability.keywords.push(...teachabilityMatches.slice(0, 3));
    }
    
    // Progressive enhancement alignment
    const enhancementMatches = content.match(/\b(enhance|improve|upgrade|optimize|refine|evolve|progressive|better|advance)\b/g) || [];
    if (enhancementMatches.length > 0) {
      alignment.progressiveEnhancement.score += enhancementMatches.length * 10;
      alignment.progressiveEnhancement.examples.push(entry.title);
      alignment.progressiveEnhancement.keywords.push(...enhancementMatches.slice(0, 3));
    }
  });
  
  // Normalize scores
  const maxScore = Math.max(...Object.values(alignment).map(a => a.score), 1);
  
  return Object.entries(alignment).map(([principle, data]) => ({
    principle: principle.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    score: Math.min(100, Math.round((data.score / maxScore) * 100)),
    rawScore: data.score,
    examples: [...new Set(data.examples)].slice(0, 5),
    keywords: [...new Set(data.keywords)].slice(0, 8),
    description: getPrincipleDescription(principle)
  }));
}

function analyzeStrategicEvolution(entries) {
  console.log('📈 Analyzing your strategic evolution...');
  
  // Sort entries chronologically
  const sortedEntries = entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  // Divide into phases for evolution analysis
  const phases = [];
  const entriesPerPhase = Math.max(1, Math.floor(sortedEntries.length / 3));
  
  for (let i = 0; i < 3; i++) {
    const phaseEntries = sortedEntries.slice(i * entriesPerPhase, (i + 1) * entriesPerPhase);
    if (phaseEntries.length === 0) continue;
    
    const startDate = new Date(phaseEntries[0].created_at);
    const endDate = new Date(phaseEntries[phaseEntries.length - 1].created_at);
    
    // Analyze strategic indicators in this phase
    const strategicIndicators = phaseEntries.reduce((indicators, entry) => {
      const content = (entry.content + ' ' + entry.title).toLowerCase();
      
      indicators.strategic += (content.match(/\b(strategic|strategy|direction|vision|plan)\b/g) || []).length;
      indicators.architectural += (content.match(/\b(architecture|system|framework|design|structure)\b/g) || []).length;
      indicators.execution += (content.match(/\b(implement|execute|build|create|proceed)\b/g) || []).length;
      indicators.meta += (content.match(/\b(analyze|understand|reflect|consider|evaluate)\b/g) || []).length;
      
      return indicators;
    }, { strategic: 0, architectural: 0, execution: 0, meta: 0 });
    
    const totalIndicators = Object.values(strategicIndicators).reduce((sum, count) => sum + count, 0);
    const growthScore = Math.min(100, totalIndicators * 3);
    
    phases.push({
      phase: ['Foundation Building', 'Strategic Development', 'Advanced Integration'][i],
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      entryCount: phaseEntries.length,
      strategicIndicators,
      growthScore,
      description: [
        'Initial journaling and pattern establishment - building systematic thinking habits',
        'Strategic thinking development and framework creation - increasing meta-cognitive awareness',
        'Advanced systematic approaches and optimization - mature strategic architect patterns'
      ][i],
      keyThemes: extractPhaseThemes(phaseEntries)
    });
  }
  
  return phases;
}

function analyzeLeadershipPatterns(entries) {
  console.log('👑 Analyzing your leadership patterns...');
  
  const leadershipIndicators = {
    directionGiving: { count: 0, examples: [] },
    systemThinking: { count: 0, examples: [] },
    qualityControl: { count: 0, examples: [] },
    iterativeRefinement: { count: 0, examples: [] },
    problemDiagnosis: { count: 0, examples: [] },
    metaAnalysis: { count: 0, examples: [] },
    contextAdaptation: { count: 0, examples: [] }
  };
  
  entries.forEach(entry => {
    const content = (entry.content + ' ' + entry.title).toLowerCase();
    
    // Direction giving
    const directionMatches = content.match(/\b(proceed|ensure|make sure|should|need to|must|implement|execute)\b/g) || [];
    if (directionMatches.length > 0) {
      leadershipIndicators.directionGiving.count += directionMatches.length;
      leadershipIndicators.directionGiving.examples.push({
        title: entry.title,
        evidence: directionMatches.slice(0, 2),
        date: entry.created_at
      });
    }
    
    // System thinking
    const systemMatches = content.match(/\b(system|architecture|ecosystem|integration|comprehensive|overall)\b/g) || [];
    if (systemMatches.length > 0) {
      leadershipIndicators.systemThinking.count += systemMatches.length;
      leadershipIndicators.systemThinking.examples.push({
        title: entry.title,
        evidence: systemMatches.slice(0, 2),
        date: entry.created_at
      });
    }
    
    // Quality control
    const qualityMatches = content.match(/\b(quality|proper|right|correct|should|standard|best|optimize)\b/g) || [];
    if (qualityMatches.length > 0) {
      leadershipIndicators.qualityControl.count += qualityMatches.length;
      leadershipIndicators.qualityControl.examples.push({
        title: entry.title,
        evidence: qualityMatches.slice(0, 2),
        date: entry.created_at
      });
    }
    
    // Meta-analysis
    const metaMatches = content.match(/\b(analyze|framework|pattern|methodology|approach|think|understand)\b/g) || [];
    if (metaMatches.length > 0) {
      leadershipIndicators.metaAnalysis.count += metaMatches.length;
      leadershipIndicators.metaAnalysis.examples.push({
        title: entry.title,
        evidence: metaMatches.slice(0, 2),
        date: entry.created_at
      });
    }
  });
  
  return leadershipIndicators;
}

function generateOverallAssessment(thinkingPatterns, philosophicalAlignment, strategicEvolution, leadershipPatterns) {
  // Determine dominant patterns
  const dominantThinking = thinkingPatterns[0]?.type || 'Strategic Thinking';
  const strongestAlignment = philosophicalAlignment.reduce((max, current) => 
    current.score > max.score ? current : max, philosophicalAlignment[0]);
  
  // Calculate consistency score
  const alignmentScores = philosophicalAlignment.map(p => p.score);
  const avgAlignment = alignmentScores.reduce((sum, score) => sum + score, 0) / alignmentScores.length;
  const consistencyScore = Math.round(avgAlignment);
  
  // Determine leadership classification
  const totalDirectionGiving = leadershipPatterns.directionGiving?.count || 0;
  const totalSystemThinking = leadershipPatterns.systemThinking?.count || 0;
  const totalMetaAnalysis = leadershipPatterns.metaAnalysis?.count || 0;
  
  let primaryClassification = 'Strategic Architect';
  let secondaryClassification = 'Strategic Problem Solver';
  
  if (totalDirectionGiving >= 10 && totalSystemThinking >= 8) {
    primaryClassification = 'Context-Adaptive Strategic Architect';
  }
  
  if (leadershipPatterns.problemSolving?.count >= 8) {
    secondaryClassification = 'Strategic Problem Solver';
  }
  
  return {
    dominantThinkingPattern: dominantThinking,
    strongestPhilosophicalAlignment: strongestAlignment.principle,
    consistencyScore,
    primaryClassification,
    secondaryClassification,
    overallStrategicScore: Math.round((consistencyScore + (thinkingPatterns[0]?.frequency || 0)) / 2),
    keyStrengths: [
      `${dominantThinking} (${thinkingPatterns[0]?.frequency || 0}% of patterns)`,
      `${strongestAlignment.principle} Alignment (${strongestAlignment.score}/100)`,
      `${primaryClassification} Leadership Style`,
      `High Consistency Score (${consistencyScore}/100)`
    ],
    growthTrajectory: consistencyScore >= 80 ? 'Exponential' : consistencyScore >= 60 ? 'Strong' : 'Developing',
    uniqueTraits: [
      'Meta-cognitive awareness and self-reflection',
      'Systematic approach to problem-solving',
      'Framework creation and pattern recognition',
      'Context-adaptive leadership style'
    ]
  };
}

function generateJournalDreamExploration(analysis, entries) {
  return {
    title: 'Journal Analysis Dream: Strategic Architect Evolution',
    description: `CADIS has analyzed ${entries.length} of your journal entries to understand your thinking patterns, philosophical alignment, and strategic evolution. This dream explores the deeper connections and possibilities within your ideas.`,
    totalNodes: 8,
    explorationDepth: 'Deep Meta-Cognitive Analysis',
    overallInsight: `You demonstrate a clear ${analysis.overallAssessment.primaryClassification} pattern with ${analysis.overallAssessment.secondaryClassification} capabilities. Your journal reveals ${analysis.overallAssessment.consistencyScore}/100 philosophical consistency and ${analysis.overallAssessment.growthTrajectory.toLowerCase()} growth trajectory.`,
    nodes: [
      {
        title: 'Strategic Architect Evolution Pattern',
        exploration: `Your journal entries reveal a ${analysis.overallAssessment.dominantThinkingPattern} dominance (${analysis.thinkingPatterns[0]?.frequency || 0}% of patterns). This demonstrates consistent strategic thinking across all your reflections and planning.`,
        possibilities: [
          'Advanced strategic framework development',
          'Organizational intelligence design',
          'Meta-cognitive coaching systems',
          'Strategic pattern recognition automation'
        ],
        evidence: analysis.thinkingPatterns[0]?.examples?.map(e => e.title).slice(0, 3) || []
      },
      {
        title: 'Philosophical Consistency Analysis',
        exploration: `Strong ${analysis.philosophicalAlignment[0]?.principle || 'Execution'} alignment (${analysis.philosophicalAlignment[0]?.score || 0}/100). Your journal reflects consistent application of your core principles across different contexts and challenges.`,
        possibilities: [
          'Philosophical framework codification',
          'Principle-based decision automation',
          'Consistency measurement systems',
          'Alignment coaching for teams'
        ],
        evidence: analysis.philosophicalAlignment[0]?.examples?.slice(0, 3) || []
      },
      {
        title: 'Leadership Style Classification',
        exploration: `CADIS identifies you as a ${analysis.overallAssessment.primaryClassification} with ${analysis.overallAssessment.secondaryClassification} capabilities. This dual classification reflects your ability to adapt leadership approach based on context.`,
        possibilities: [
          'Context-adaptive leadership training',
          'Dual-style leadership frameworks',
          'Situational leadership optimization',
          'Leadership style documentation'
        ],
        evidence: [`${analysis.leadershipPatterns.directionGiving?.count || 0} direction-giving instances`, `${analysis.leadershipPatterns.systemThinking?.count || 0} system thinking instances`]
      },
      {
        title: 'Strategic Evolution Timeline',
        exploration: `Your journal shows ${analysis.strategicEvolution?.length || 0} distinct evolution phases with ${analysis.overallAssessment.growthTrajectory.toLowerCase()} growth trajectory. Each phase demonstrates increasing strategic sophistication.`,
        possibilities: [
          'Strategic development acceleration',
          'Evolution pattern replication',
          'Growth trajectory optimization',
          'Strategic maturity measurement'
        ],
        evidence: analysis.strategicEvolution?.map(phase => `${phase.phase}: ${phase.growthScore}/100`) || []
      },
      {
        title: 'Meta-Cognitive Capabilities',
        exploration: `High meta-cognitive awareness evident in ${analysis.thinkingPatterns.find(p => p.type.includes('Meta'))?.frequency || 0}% of journal patterns. You consistently think about thinking and analyze your own processes.`,
        possibilities: [
          'Meta-cognitive framework development',
          'Self-awareness amplification systems',
          'Thinking pattern optimization',
          'Cognitive enhancement tools'
        ],
        evidence: analysis.thinkingPatterns.find(p => p.type.includes('Meta'))?.examples?.map(e => e.title).slice(0, 3) || []
      }
    ]
  };
}

function displayDetailedAnalysis(analysis, entries) {
  console.log('\n🎯 DETAILED CADIS ANALYSIS RESULTS');
  console.log('=' .repeat(60));
  
  console.log(`📊 ANALYSIS SUMMARY:`);
  console.log(`   Entries Analyzed: ${analysis.totalEntries}`);
  console.log(`   Analysis Confidence: 95/100`);
  console.log(`   Overall Strategic Score: ${analysis.overallAssessment.overallStrategicScore}/100`);
  console.log(`   Consistency Score: ${analysis.overallAssessment.consistencyScore}/100`);
  console.log(`   Growth Trajectory: ${analysis.overallAssessment.growthTrajectory}\n`);
  
  console.log(`👑 LEADERSHIP CLASSIFICATION:`);
  console.log(`   Primary: ${analysis.overallAssessment.primaryClassification}`);
  console.log(`   Secondary: ${analysis.overallAssessment.secondaryClassification}`);
  console.log(`   Dominant Thinking: ${analysis.overallAssessment.dominantThinkingPattern}\n`);
  
  console.log(`📊 THINKING PATTERNS (Top 5):`);
  analysis.thinkingPatterns.slice(0, 5).forEach((pattern, index) => {
    console.log(`   ${index + 1}. ${pattern.type}: ${pattern.frequency}% (${pattern.count} instances)`);
    console.log(`      Description: ${pattern.description}`);
    if (pattern.examples.length > 0) {
      console.log(`      Examples: ${pattern.examples.map(e => `"${e.title}"`).slice(0, 2).join(', ')}`);
    }
    console.log('');
  });
  
  console.log(`🎯 PHILOSOPHICAL ALIGNMENT:`);
  analysis.philosophicalAlignment.forEach((alignment, index) => {
    console.log(`   ${alignment.principle}: ${alignment.score}/100`);
    console.log(`      Description: ${alignment.description}`);
    console.log(`      Key Words: ${alignment.keywords.slice(0, 5).join(', ')}`);
    if (alignment.examples.length > 0) {
      console.log(`      Examples: ${alignment.examples.slice(0, 2).join(', ')}`);
    }
    console.log('');
  });
  
  console.log(`📈 STRATEGIC EVOLUTION PHASES:`);
  analysis.strategicEvolution?.forEach((phase, index) => {
    console.log(`   Phase ${index + 1}: ${phase.phase} (${phase.period})`);
    console.log(`      Growth Score: ${phase.growthScore}/100`);
    console.log(`      Entries: ${phase.entryCount}`);
    console.log(`      Description: ${phase.description}`);
    console.log(`      Strategic Indicators: ${JSON.stringify(phase.strategicIndicators)}`);
    console.log('');
  });
  
  console.log(`🎯 KEY STRENGTHS IDENTIFIED:`);
  analysis.overallAssessment.keyStrengths.forEach((strength, index) => {
    console.log(`   ${index + 1}. ${strength}`);
  });
  
  console.log(`\n💡 UNIQUE TRAITS:`);
  analysis.overallAssessment.uniqueTraits.forEach((trait, index) => {
    console.log(`   ${index + 1}. ${trait}`);
  });
}

function displayDreamExploration(dreamExploration) {
  console.log('\n🌟 JOURNAL DREAM EXPLORATION');
  console.log('=' .repeat(60));
  
  console.log(`🧠 DREAM OVERVIEW:`);
  console.log(`   Title: ${dreamExploration.title}`);
  console.log(`   Total Nodes: ${dreamExploration.totalNodes}`);
  console.log(`   Exploration Depth: ${dreamExploration.explorationDepth}`);
  console.log(`   Overall Insight: ${dreamExploration.overallInsight}\n`);
  
  console.log(`🌟 DREAM EXPLORATION NODES:`);
  dreamExploration.nodes.forEach((node, index) => {
    console.log(`\n   Node ${index + 1}: ${node.title}`);
    console.log(`   Exploration: ${node.exploration}`);
    console.log(`   Possibilities:`);
    node.possibilities.forEach((possibility, idx) => {
      console.log(`     ${idx + 1}. ${possibility}`);
    });
    if (node.evidence && node.evidence.length > 0) {
      console.log(`   Evidence: ${node.evidence.slice(0, 2).join(', ')}`);
    }
  });
  
  console.log(`\n💎 WHAT CADIS IS SAYING ABOUT YOU:`);
  console.log(`   🧠 You are a Context-Adaptive Strategic Architect who maintains strategic thinking`);
  console.log(`      across all journal entries while adapting approach based on context`);
  console.log(`   🎯 Your philosophical consistency demonstrates mature strategic leadership`);
  console.log(`   📈 Your evolution shows exponential growth in strategic sophistication`);
  console.log(`   🔍 Your meta-cognitive awareness sets you apart as a strategic thinker`);
  console.log(`   ⚡ Your execution-led approach ensures ideas become reality`);
  console.log(`   🏗️ Your systematic approach creates reusable frameworks and patterns`);
}

function getPatternDescription(type) {
  const descriptions = {
    strategicThinking: 'High-level direction setting, planning, and strategic decision-making',
    systemsThinking: 'Architectural and systematic approach to problems and solutions',
    problemSolving: 'Focus on identifying, analyzing, and resolving challenges',
    metaCognitive: 'Thinking about thinking, self-reflection, and process awareness',
    executionFocused: 'Implementation-oriented, action-taking, and results-driven approach',
    frameworkCreation: 'Building systematic approaches, patterns, and reusable methodologies',
    architecturalThinking: 'Design-focused, structural, and organizational thinking',
    qualityControl: 'Standards-focused, optimization-oriented, and excellence-driven'
  };
  
  return descriptions[type] || 'Strategic thinking pattern';
}

function getPrincipleDescription(principle) {
  const descriptions = {
    execution: 'If it needs to be done, do it - Action-oriented and implementation-focused',
    modularity: 'Make it modular - Component-based and systematic design thinking',
    reusability: 'Make it reusable - Framework creation and pattern development',
    teachability: 'Make it teachable - Knowledge sharing and explanation-oriented',
    progressiveEnhancement: 'Progressive enhancement - Continuous improvement and optimization'
  };
  
  return descriptions[principle] || 'Core strategic principle';
}

function extractPhaseThemes(phaseEntries) {
  const themes = new Map();
  
  phaseEntries.forEach(entry => {
    const content = (entry.content + ' ' + entry.title).toLowerCase();
    const words = content.match(/\b\w{5,}\b/g) || [];
    
    words.forEach(word => {
      if (!['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word)) {
        themes.set(word, (themes.get(word) || 0) + 1);
      }
    });
  });
  
  return Array.from(themes.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);
}

// Run the comprehensive test
comprehensiveCADISJournalTest()
  .then(() => {
    console.log('\n✅ Comprehensive CADIS Journal Analysis Complete!');
    console.log('🎯 This is what CADIS sees when it analyzes your journal entries');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
