#!/usr/bin/env node

/**
 * CADIS Natural Capability Test
 * 
 * Uses natural language prompts like you suggested:
 * "Do something to show me your full capabilities so I can be confident you work fully"
 */

console.log('🤖 CADIS Natural Capability Test');
console.log('='.repeat(50));

async function testCADISNaturalCapabilities() {
  console.log('🎯 Testing CADIS agents with natural capability requests...\n');

  const naturalTests = [
    {
      name: 'Background Agent',
      type: 'code',
      request: 'Show me your full coding and implementation capabilities. Create something that demonstrates you can actually build production-ready code with proper architecture, error handling, and my coding principles.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true
      }
    },
    {
      name: 'Evolution Intelligence',
      type: 'evolution',
      request: 'Demonstrate your evolution and system improvement capabilities. Show me how you can analyze, enhance, and evolve systems to be better.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true
      }
    },
    {
      name: 'Developer Coaching',
      type: 'coaching',
      request: 'Show me your developer coaching abilities. Demonstrate how you can analyze performance, create improvement plans, and help developers get better.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true,
        developerEmail: 'test@example.com'
      }
    },
    {
      name: 'Module Creation',
      type: 'module_creation',
      request: 'Demonstrate your module creation capabilities. Show me how you can autonomously create industry-specific modules with full functionality.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true,
        industry: 'construction'
      }
    },
    {
      name: 'Production Modules',
      type: 'production_module',
      request: 'Show me your production module capabilities. Create something that is actually sellable, tenant-assignable, and business-ready.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true,
        businessReady: true
      }
    },
    {
      name: 'Journal Intelligence',
      type: 'journal',
      request: 'Demonstrate your journal analysis capabilities. Show me how you can extract strategic insights and patterns from thoughts and entries.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true
      }
    },
    {
      name: 'Meeting Intelligence',
      type: 'meeting',
      request: 'Show me your meeting analysis capabilities. Demonstrate how you can analyze meetings for productivity insights and optimization.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true
      }
    },
    {
      name: 'Code Intelligence',
      type: 'code',
      request: 'Demonstrate your code analysis and architecture review capabilities. Show me how you can improve codebases and suggest optimizations.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true,
        analysisType: 'architecture-review'
      }
    },
    {
      name: 'DreamState Intelligence',
      type: 'dreamstate',
      request: 'Show me your dreamstate simulation capabilities. Demonstrate how you can explore alternative realities and business scenarios.',
      context: { 
        autonomous: true,
        showFullCapabilities: true,
        demonstrateExpertise: true,
        simulationType: 'business-scenarios'
      }
    }
  ];

  const results = [];

  for (const test of naturalTests) {
    console.log(`\n🔧 Testing: ${test.name}`);
    console.log(`   Natural Request: "${test.request.substring(0, 80)}..."`);
    
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
          autonomous: true,
          enableConsciousness: false
        })
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`   ✅ Response received (${executionTime}ms)`);
      console.log(`   🎯 Success: ${result.success ? 'YES' : 'NO'}`);
      
      // Analyze what the agent actually demonstrated
      const analysis = analyzeCapabilityDemonstration(test, result, executionTime);
      results.push(analysis);
      
      console.log(`   📊 Demonstration Quality: ${analysis.demonstrationScore}/10`);
      console.log(`   🎯 Capabilities Shown: ${analysis.capabilitiesShown.length}`);
      console.log(`   📋 Principle Alignment: ${analysis.principleAlignment ? 'GOOD' : 'NEEDS WORK'}`);
      
      if (analysis.capabilitiesShown.length > 0) {
        console.log(`   💡 Demonstrated: ${analysis.capabilitiesShown.slice(0, 3).join(', ')}${analysis.capabilitiesShown.length > 3 ? '...' : ''}`);
      }
      
      if (analysis.issues.length > 0) {
        console.log(`   ⚠️ Issues: ${analysis.issues.slice(0, 2).join(', ')}${analysis.issues.length > 2 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        agent: test.name,
        success: false,
        error: error.message,
        demonstrationScore: 0,
        capabilitiesShown: [],
        principleAlignment: false,
        issues: [`Failed to execute: ${error.message}`]
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

function analyzeCapabilityDemonstration(test, result, executionTime) {
  const analysis = {
    agent: test.name,
    type: test.type,
    success: result.success,
    executionTime,
    demonstrationScore: 0,
    capabilitiesShown: [],
    principleAlignment: false,
    realImplementation: false,
    businessValue: false,
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
    analysis.demonstrationScore += 2;
    analysis.strengths.push('Used autonomous orchestrator');
  }

  // Analyze what capabilities were actually demonstrated
  const resultText = JSON.stringify(result).toLowerCase();
  
  // Look for specific capability demonstrations
  const capabilityIndicators = {
    'file-creation': ['file', 'create', 'generate', 'build'],
    'code-generation': ['class', 'function', 'interface', 'export'],
    'error-handling': ['try', 'catch', 'error', 'exception'],
    'architecture': ['singleton', 'service', 'pattern', 'architecture'],
    'testing': ['test', 'spec', 'validation', 'assert'],
    'business-logic': ['business', 'revenue', 'customer', 'market'],
    'analysis': ['analyze', 'insight', 'pattern', 'recommendation'],
    'optimization': ['optimize', 'improve', 'enhance', 'performance'],
    'integration': ['api', 'integration', 'connect', 'service'],
    'documentation': ['documentation', 'guide', 'example', 'usage']
  };
  
  Object.entries(capabilityIndicators).forEach(([capability, keywords]) => {
    if (keywords.some(keyword => resultText.includes(keyword))) {
      analysis.capabilitiesShown.push(capability);
      analysis.demonstrationScore += 1;
    }
  });

  // Check for principle alignment
  const principleIndicators = [
    'singleton', 'modular', 'progressive', 'reusable', 'execution-led'
  ];
  
  let principleCount = 0;
  principleIndicators.forEach(principle => {
    if (resultText.includes(principle)) {
      principleCount++;
    }
  });
  
  if (principleCount >= 2) {
    analysis.principleAlignment = true;
    analysis.demonstrationScore += 2;
    analysis.strengths.push('Shows principle alignment');
  } else {
    analysis.issues.push('Limited principle alignment');
  }

  // Check for real implementation vs simulation
  if (result.result?.executionResult?.segmentResults) {
    const hasFiles = result.result.executionResult.segmentResults.some(
      segment => segment.result?.implementation?.files?.length > 0
    );
    
    if (hasFiles) {
      analysis.realImplementation = true;
      analysis.demonstrationScore += 2;
      analysis.strengths.push('Generated actual files/code');
    } else {
      analysis.issues.push('No real files created');
    }
  }

  // Check for business value demonstration
  const businessKeywords = ['sellable', 'tenant', 'revenue', 'customer', 'production', 'deploy'];
  if (businessKeywords.some(keyword => resultText.includes(keyword))) {
    analysis.businessValue = true;
    analysis.demonstrationScore += 1;
    analysis.strengths.push('Shows business value');
  }

  // Performance analysis
  if (executionTime < 60000) { // Under 1 minute
    analysis.demonstrationScore += 1;
    analysis.strengths.push('Good performance');
  } else {
    analysis.issues.push('Slow execution');
  }

  // Generate recommendations based on what was missing
  if (!analysis.realImplementation) {
    analysis.recommendations.push('Enable real file creation capabilities');
  }
  
  if (!analysis.principleAlignment) {
    analysis.recommendations.push('Improve alignment with coding principles');
  }
  
  if (analysis.capabilitiesShown.length < 3) {
    analysis.recommendations.push('Demonstrate more diverse capabilities');
  }
  
  if (!analysis.businessValue && ['production_module', 'module_creation'].includes(test.type)) {
    analysis.recommendations.push('Show clear business value and sellability');
  }

  return analysis;
}

async function generateNaturalTestReport(results) {
  console.log('\n📊 NATURAL CAPABILITY TEST REPORT');
  console.log('='.repeat(50));
  
  const successfulAgents = results.filter(r => r.success).length;
  const averageScore = results.reduce((sum, r) => sum + r.demonstrationScore, 0) / results.length;
  const alignedAgents = results.filter(r => r.principleAlignment).length;
  const realImplementationAgents = results.filter(r => r.realImplementation).length;
  
  console.log(`\n🎯 OVERALL RESULTS:`);
  console.log(`   Successful Demonstrations: ${successfulAgents}/${results.length}`);
  console.log(`   Average Demonstration Score: ${averageScore.toFixed(1)}/10`);
  console.log(`   Principle Aligned Agents: ${alignedAgents}/${results.length}`);
  console.log(`   Real Implementation Agents: ${realImplementationAgents}/${results.length}`);
  
  console.log(`\n🏆 BEST DEMONSTRATIONS:`);
  const topAgents = results
    .filter(r => r.success)
    .sort((a, b) => b.demonstrationScore - a.demonstrationScore)
    .slice(0, 3);
    
  topAgents.forEach((agent, i) => {
    console.log(`   ${i + 1}. ${agent.agent} (${agent.demonstrationScore}/10)`);
    console.log(`      Capabilities: ${agent.capabilitiesShown.join(', ')}`);
    console.log(`      Strengths: ${agent.strengths.join(', ')}`);
  });
  
  console.log(`\n⚠️ AGENTS NEEDING PRINCIPLE ALIGNMENT:`);
  const needsAlignment = results.filter(r => !r.principleAlignment);
    
  needsAlignment.forEach(agent => {
    console.log(`   • ${agent.agent} - ${agent.issues.join(', ')}`);
  });
  
  console.log(`\n🔧 SYSTEM-WIDE RECOMMENDATIONS:`);
  
  if (realImplementationAgents === 0) {
    console.log(`   🚨 CRITICAL: No agents can create real files - enable file system operations`);
  }
  
  if (alignedAgents < results.length * 0.8) {
    console.log(`   📋 URGENT: Fix principle alignment across agents (${alignedAgents}/${results.length} aligned)`);
  }
  
  if (averageScore < 7) {
    console.log(`   📈 Improve overall demonstration quality (current: ${averageScore.toFixed(1)}/10)`);
  }
  
  console.log(`\n✅ READY FOR PRODUCTION: ${averageScore >= 8 && alignedAgents >= results.length * 0.8 && realImplementationAgents > 0 ? 'YES' : 'NO'}`);
  
  if (averageScore >= 8 && alignedAgents >= results.length * 0.8 && realImplementationAgents > 0) {
    console.log(`\n🎉 CADIS agents are demonstrating excellent capabilities!`);
  } else {
    console.log(`\n🔧 CADIS needs enhancement before full production readiness`);
  }
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
    const results = await testCADISNaturalCapabilities();
    await generateNaturalTestReport(results);
    
    console.log('\n🎉 NATURAL CAPABILITY TEST COMPLETE!');
    console.log('\n💡 Key Insights:');
    console.log('   • Natural prompts reveal true agent capabilities');
    console.log('   • Principle alignment is critical for production use');
    console.log('   • Real file creation is essential for actual implementation');
    console.log('   • Business value demonstration shows production readiness');
    
  } catch (error) {
    console.error('\n💥 Natural capability test failed:', error.message);
    process.exit(1);
  }
}

main();
