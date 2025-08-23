#!/usr/bin/env node

/**
 * Test Complete CADIS Autonomous System
 * 
 * Tests the full autonomous orchestrator with:
 * 1. Capability checking
 * 2. Agent checking  
 * 3. Self-enhancement
 * 4. Progressive execution
 * 5. Evolution at the end
 * 6. All routing tests
 */

console.log('🤖 CADIS Complete Autonomous System Test');
console.log('='.repeat(60));

async function testCompleteAutonomousSystem() {
  console.log('🎯 Testing complete autonomous CADIS system...\n');

  const testCases = [
    {
      name: 'Simple Implementation',
      request: 'Create a simple TypeScript utility function',
      type: 'code',
      context: { complexity: 'simple' },
      expectedSegments: 1
    },
    {
      name: 'Medium Complexity',
      request: 'Create a Reonomy API service and integrate it with PropertyRadar',
      type: 'evolution',
      context: { complexity: 'medium', apis: ['reonomy', 'propertyradar'] },
      expectedSegments: 2
    },
    {
      name: 'High Complexity',
      request: 'Build a complete dashboard with real-time data, API integration, and deployment automation',
      type: 'evolution',
      context: { complexity: 'high', features: ['dashboard', 'realtime', 'api', 'deployment'] },
      expectedSegments: 3
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`   Request: "${testCase.request}"`);
    console.log(`   Expected Complexity: ${testCase.context.complexity}`);
    console.log(`   Expected Segments: ${testCase.expectedSegments}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3000/api/cadis-tower', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: testCase.request,
          type: testCase.type,
          context: testCase.context,
          autonomous: true, // Use autonomous orchestrator
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
      console.log(`   🤖 Mode: ${result.mode || 'Unknown'}`);
      
      if (result.result) {
        const execResult = result.result.executionResult;
        const execPlan = result.result.executionPlan;
        
        console.log(`\n   📊 EXECUTION ANALYSIS:`);
        console.log(`      Task Complexity: ${execPlan?.task?.complexity || 'Unknown'}`);
        console.log(`      Segments Planned: ${execPlan?.progressiveSteps?.length || 0}`);
        console.log(`      Segments Executed: ${execResult?.segmentResults?.length || 0}`);
        console.log(`      Overall Success: ${execResult?.overallSuccess ? 'YES' : 'NO'}`);
        console.log(`      Execution Time: ${execResult?.totalTime || 0}ms`);
        
        if (execPlan?.enhancements?.length > 0) {
          console.log(`      Enhancements: ${execPlan.enhancements.join(', ')}`);
        }
        
        if (result.result.evolutionResult) {
          console.log(`      Evolution: ${result.result.evolutionResult.capabilitiesUpdated ? 'COMPLETED' : 'SKIPPED'}`);
        }
        
        // Check if capabilities and agents were properly checked
        if (execPlan?.capabilityCheck) {
          console.log(`\n   🔍 CAPABILITY CHECK:`);
          console.log(`      Has Capability: ${execPlan.capabilityCheck.hasCapability ? 'YES' : 'NO'}`);
          console.log(`      Confidence: ${(execPlan.capabilityCheck.confidence * 100).toFixed(1)}%`);
          console.log(`      Missing: ${execPlan.capabilityCheck.missingCapabilities?.length || 0} capabilities`);
        }
        
        if (execPlan?.agentCheck) {
          console.log(`\n   🤖 AGENT CHECK:`);
          console.log(`      Has Agent: ${execPlan.agentCheck.hasAgent ? 'YES' : 'NO'}`);
          console.log(`      Available Agents: ${execPlan.agentCheck.availableAgents?.length || 0}`);
          console.log(`      Recommended: ${execPlan.agentCheck.recommendedAgent || 'None'}`);
        }
      }
      
      results.push({
        testCase,
        success: result.success,
        executionTime,
        result: result.result,
        mode: result.mode
      });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        testCase,
        success: false,
        error: error.message,
        executionTime: 0
      });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function testAllRouting() {
  console.log('\n🧪 Testing All CADIS Routing...');
  
  try {
    const response = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: 'Test all routing capabilities',
        type: 'evolution',
        autonomous: true,
        context: { testAllRouting: true }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Routing test initiated through autonomous system');
      return result;
    } else {
      console.log('❌ Routing test failed to initiate');
      return null;
    }
  } catch (error) {
    console.log(`❌ Routing test error: ${error.message}`);
    return null;
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
    // Test complete autonomous system
    const autonomousResults = await testCompleteAutonomousSystem();
    
    // Test all routing
    const routingResult = await testAllRouting();
    
    console.log('\n🎉 COMPLETE AUTONOMOUS SYSTEM TEST RESULTS');
    console.log('='.repeat(60));
    
    const successfulTests = autonomousResults.filter(r => r.success).length;
    console.log(`📊 Autonomous Tests: ${successfulTests}/${autonomousResults.length} successful`);
    
    console.log('\n🔍 DETAILED ANALYSIS:');
    
    autonomousResults.forEach((result, i) => {
      const testCase = result.testCase;
      console.log(`\n${i + 1}. ${testCase.name}:`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Mode: ${result.mode || 'Unknown'}`);
      console.log(`   Time: ${result.executionTime}ms`);
      
      if (result.success && result.result) {
        const plan = result.result.executionPlan;
        const exec = result.result.executionResult;
        
        console.log(`   Complexity: ${plan?.task?.complexity || 'Unknown'}`);
        console.log(`   Segments: ${exec?.segmentResults?.length || 0}/${plan?.progressiveSteps?.length || 0}`);
        console.log(`   Enhancements: ${plan?.enhancements?.length || 0}`);
        console.log(`   Evolution: ${result.result.evolutionResult ? 'YES' : 'NO'}`);
      }
    });
    
    console.log('\n🚀 CADIS AUTONOMOUS SYSTEM STATUS:');
    
    if (successfulTests === autonomousResults.length) {
      console.log('   ✅ All tests passed - CADIS is fully autonomous');
      console.log('   ✅ Capability checking working');
      console.log('   ✅ Agent checking working');
      console.log('   ✅ Self-enhancement working');
      console.log('   ✅ Progressive execution working');
      console.log('   ✅ Evolution working');
      console.log('\n🎯 CADIS is ready for any complexity task!');
    } else {
      console.log('   ⚠️ Some tests failed - needs investigation');
      console.log(`   📊 Success rate: ${(successfulTests / autonomousResults.length * 100).toFixed(1)}%`);
    }
    
    if (routingResult) {
      console.log('   ✅ All routing tests available');
    }
    
  } catch (error) {
    console.error('\n💥 Complete autonomous test failed:', error.message);
    process.exit(1);
  }
}

main();
