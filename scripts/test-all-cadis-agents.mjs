#!/usr/bin/env node

/**
 * Test All CADIS Agents Comprehensively
 * 
 * Tests each of the 9 specialized agents to see what they can actually do
 * and whether they align with your principles and standards
 */

console.log('🤖 Testing All CADIS Agents Comprehensively');
console.log('='.repeat(60));

async function testAllCADISAgents() {
  console.log('🎯 Testing all 9 CADIS specialized agents...\n');

  const agentTests = [
    {
      name: 'Background Agent',
      type: 'code',
      request: 'Create a production-ready ReonomyService with singleton pattern, error handling, and TypeScript interfaces',
      context: { 
        forceRealImplementation: true,
        production: true,
        apis: ['reonomy'],
        credentials: { accessKey: 'restoremasters', secretKey: 'yk5o6wsz1dlsge9z' }
      },
      expectedCapabilities: ['file-creation', 'singleton-pattern', 'error-handling', 'typescript']
    },
    {
      name: 'Evolution Intelligence',
      type: 'evolution',
      request: 'Analyze current system capabilities and suggest 3 specific improvements for better efficiency',
      context: { 
        analysisType: 'system-improvement',
        targetEfficiency: 105
      },
      expectedCapabilities: ['system-analysis', 'improvement-suggestions', 'efficiency-optimization']
    },
    {
      name: 'Developer Coaching',
      type: 'coaching',
      request: 'Analyze developer performance patterns and create personalized improvement recommendations',
      context: { 
        developerEmail: 'test@example.com',
        action: 'performance-analysis',
        includeEmailCampaign: true
      },
      expectedCapabilities: ['performance-analysis', 'coaching-recommendations', 'email-campaigns']
    },
    {
      name: 'Module Creation',
      type: 'module_creation',
      request: 'Create a complete e-commerce analytics module for the construction industry with dashboards and reporting',
      context: { 
        industry: 'construction',
        moduleType: 'analytics',
        features: ['dashboard', 'reporting', 'real-time-data'],
        vibezsPlatformCompatible: true
      },
      expectedCapabilities: ['module-generation', 'industry-analysis', 'dashboard-creation', 'vibezs-integration']
    },
    {
      name: 'Production Modules',
      type: 'production_module',
      request: 'Generate a sellable tenant-assignable CRM module with complete business intelligence and marketing plan',
      context: { 
        moduleName: 'Construction CRM Pro',
        industry: 'construction',
        requirements: ['lead-management', 'project-tracking', 'client-communication'],
        includeMarketingPlan: true,
        tenantReady: true
      },
      expectedCapabilities: ['production-modules', 'business-intelligence', 'marketing-plans', 'tenant-assignment']
    },
    {
      name: 'Journal Intelligence',
      type: 'journal',
      request: 'Analyze journal entries for strategic insights and leadership development patterns',
      context: { 
        analysisType: 'leadership-development',
        timeframe: '30-days',
        includeActionItems: true
      },
      expectedCapabilities: ['journal-analysis', 'leadership-insights', 'pattern-recognition']
    },
    {
      name: 'Meeting Intelligence',
      type: 'meeting',
      request: 'Analyze meeting patterns and suggest optimization strategies for better team productivity',
      context: { 
        analysisType: 'productivity-optimization',
        includeMetrics: true,
        teamSize: 'small'
      },
      expectedCapabilities: ['meeting-analysis', 'productivity-insights', 'team-optimization']
    },
    {
      name: 'Code Intelligence',
      type: 'code',
      request: 'Analyze codebase architecture and suggest refactoring opportunities for better maintainability',
      context: { 
        analysisType: 'architecture-review',
        focusAreas: ['maintainability', 'performance', 'scalability'],
        includeRefactoringPlan: true
      },
      expectedCapabilities: ['code-analysis', 'architecture-review', 'refactoring-suggestions']
    },
    {
      name: 'DreamState Intelligence',
      type: 'dreamstate',
      request: 'Simulate alternative business scenarios for expanding into AI-powered construction management',
      context: { 
        simulationType: 'business-expansion',
        industry: 'construction',
        timeHorizon: '2-years',
        includeRiskAnalysis: true
      },
      expectedCapabilities: ['scenario-simulation', 'business-modeling', 'risk-analysis', 'alternative-realities']
    }
  ];

  const results = [];

  for (const test of agentTests) {
    console.log(`\n🔧 Testing: ${test.name}`);
    console.log(`   Type: ${test.type}`);
    console.log(`   Request: ${test.request.substring(0, 80)}...`);
    console.log(`   Expected: ${test.expectedCapabilities.join(', ')}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/cadis-tower', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: test.request,
          type: test.type,
          context: test.context,
          autonomous: true, // Use autonomous system
          enableConsciousness: false // Faster testing
        })
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`   ✅ Response received (${executionTime}ms)`);
      console.log(`   🎯 Success: ${result.success ? 'YES' : 'NO'}`);
      
      // Analyze the result
      const analysis = analyzeAgentResult(test, result, executionTime);
      results.push(analysis);
      
      console.log(`   📊 Quality: ${analysis.qualityScore}/10`);
      console.log(`   🔧 Capabilities: ${analysis.capabilitiesFound}/${analysis.capabilitiesExpected}`);
      console.log(`   📋 Alignment: ${analysis.principleAlignment ? 'GOOD' : 'NEEDS WORK'}`);
      
      if (analysis.filesCreated > 0) {
        console.log(`   📄 Files: ${analysis.filesCreated} created`);
      }
      
      if (analysis.issues.length > 0) {
        console.log(`   ⚠️ Issues: ${analysis.issues.length} found`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        agent: test.name,
        success: false,
        error: error.message,
        qualityScore: 0,
        capabilitiesFound: 0,
        capabilitiesExpected: test.expectedCapabilities.length,
        principleAlignment: false,
        filesCreated: 0,
        issues: [`Failed to execute: ${error.message}`]
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

function analyzeAgentResult(test, result, executionTime) {
  const analysis = {
    agent: test.name,
    type: test.type,
    success: result.success,
    executionTime,
    qualityScore: 0,
    capabilitiesFound: 0,
    capabilitiesExpected: test.expectedCapabilities.length,
    principleAlignment: false,
    filesCreated: 0,
    issues: [],
    strengths: [],
    recommendations: []
  };

  if (!result.success) {
    analysis.issues.push('Agent execution failed');
    return analysis;
  }

  // Check if autonomous mode was used
  if (result.mode === 'autonomous') {
    analysis.strengths.push('Used autonomous orchestrator');
    analysis.qualityScore += 2;
  }

  // Analyze execution result
  if (result.result?.executionResult) {
    const execResult = result.result.executionResult;
    
    // Check success rate
    if (execResult.overallSuccess) {
      analysis.qualityScore += 3;
      analysis.strengths.push('All segments executed successfully');
    } else {
      analysis.issues.push('Some segments failed');
    }
    
    // Check files created
    if (execResult.segmentResults) {
      execResult.segmentResults.forEach(segResult => {
        if (segResult.result?.implementation?.files) {
          analysis.filesCreated += segResult.result.implementation.files.length;
        }
      });
    }
    
    if (analysis.filesCreated > 0) {
      analysis.qualityScore += 2;
      analysis.strengths.push(`Generated ${analysis.filesCreated} files`);
    } else {
      analysis.issues.push('No files created');
    }
  }

  // Check for principle alignment
  const principleIndicators = [
    'singleton', 'modular', 'progressive', 'error handling', 
    'typescript', 'testing', 'documentation'
  ];
  
  const resultText = JSON.stringify(result).toLowerCase();
  let principleCount = 0;
  
  principleIndicators.forEach(indicator => {
    if (resultText.includes(indicator.toLowerCase())) {
      principleCount++;
    }
  });
  
  if (principleCount >= 3) {
    analysis.principleAlignment = true;
    analysis.qualityScore += 2;
    analysis.strengths.push('Follows coding principles');
  } else {
    analysis.issues.push('Limited principle alignment detected');
  }

  // Check capabilities
  test.expectedCapabilities.forEach(capability => {
    if (resultText.includes(capability.toLowerCase().replace('-', ''))) {
      analysis.capabilitiesFound++;
    }
  });
  
  if (analysis.capabilitiesFound >= analysis.capabilitiesExpected * 0.7) {
    analysis.qualityScore += 1;
    analysis.strengths.push('Most expected capabilities present');
  } else {
    analysis.issues.push('Missing expected capabilities');
  }

  // Performance analysis
  if (executionTime < 30000) { // Under 30 seconds
    analysis.qualityScore += 1;
    analysis.strengths.push('Good performance');
  } else {
    analysis.issues.push('Slow execution time');
  }

  // Generate recommendations
  if (analysis.filesCreated === 0) {
    analysis.recommendations.push('Enable real file creation');
  }
  
  if (analysis.capabilitiesFound < analysis.capabilitiesExpected) {
    analysis.recommendations.push('Enhance agent-specific capabilities');
  }
  
  if (!analysis.principleAlignment) {
    analysis.recommendations.push('Improve alignment with coding principles');
  }

  return analysis;
}

async function generateComprehensiveReport(results) {
  console.log('\n📊 COMPREHENSIVE AGENT ANALYSIS REPORT');
  console.log('='.repeat(60));
  
  const successfulAgents = results.filter(r => r.success).length;
  const averageQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
  const totalFilesCreated = results.reduce((sum, r) => sum + r.filesCreated, 0);
  
  console.log(`\n🎯 OVERALL RESULTS:`);
  console.log(`   Successful Agents: ${successfulAgents}/${results.length}`);
  console.log(`   Average Quality Score: ${averageQuality.toFixed(1)}/10`);
  console.log(`   Total Files Created: ${totalFilesCreated}`);
  console.log(`   Principle Alignment: ${results.filter(r => r.principleAlignment).length}/${results.length} agents`);
  
  console.log(`\n🏆 TOP PERFORMING AGENTS:`);
  const topAgents = results
    .filter(r => r.success)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 3);
    
  topAgents.forEach((agent, i) => {
    console.log(`   ${i + 1}. ${agent.agent} (${agent.qualityScore}/10)`);
    console.log(`      Strengths: ${agent.strengths.join(', ')}`);
  });
  
  console.log(`\n⚠️ AGENTS NEEDING IMPROVEMENT:`);
  const needsImprovement = results
    .filter(r => r.qualityScore < 6 || !r.success)
    .sort((a, b) => a.qualityScore - b.qualityScore);
    
  needsImprovement.forEach(agent => {
    console.log(`   • ${agent.agent} (${agent.qualityScore}/10)`);
    console.log(`     Issues: ${agent.issues.join(', ')}`);
    console.log(`     Recommendations: ${agent.recommendations.join(', ')}`);
  });
  
  console.log(`\n🔧 SYSTEM-WIDE RECOMMENDATIONS:`);
  
  if (totalFilesCreated === 0) {
    console.log(`   🚨 CRITICAL: Enable real file system operations`);
  }
  
  if (averageQuality < 7) {
    console.log(`   📈 Improve overall agent quality and capabilities`);
  }
  
  if (successfulAgents < results.length) {
    console.log(`   🔧 Fix failing agents and error handling`);
  }
  
  const principleAlignmentRate = results.filter(r => r.principleAlignment).length / results.length;
  if (principleAlignmentRate < 0.8) {
    console.log(`   📋 Enhance principle alignment across all agents`);
  }
  
  console.log(`\n✅ READY FOR PRODUCTION: ${averageQuality >= 8 && totalFilesCreated > 0 && successfulAgents === results.length ? 'YES' : 'NO'}`);
}

async function main() {
  console.log('⏳ Checking server status...');
  
  try {
    const statusResponse = await fetch('http://localhost:3000/api/cadis-tower?action=status');
    if (!statusResponse.ok) {
      console.log('❌ Server not ready. Make sure to run: npm run dev');
      process.exit(1);
    }
    console.log('✅ Server is ready!\n');
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    process.exit(1);
  }
  
  try {
    const results = await testAllCADISAgents();
    await generateComprehensiveReport(results);
    
    console.log('\n🎉 ALL AGENT TESTING COMPLETE!');
    console.log('\nNext steps based on results:');
    console.log('1. Review individual agent performance');
    console.log('2. Address critical issues (especially file creation)');
    console.log('3. Enhance principle alignment where needed');
    console.log('4. Re-test after improvements');
    
  } catch (error) {
    console.error('\n💥 Agent testing failed:', error.message);
    process.exit(1);
  }
}

main();
