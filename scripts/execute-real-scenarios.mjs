#!/usr/bin/env node

/**
 * Execute Real CADIS Scenarios
 * 
 * Actually executes the storm-tracker and ai-callers scenarios
 * using the enhanced CADIS Tower with full traceability
 */

console.log('🎯 CADIS Real Scenario Execution');
console.log('='.repeat(50));

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  console.log('⏳ Waiting for development server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/cadis-tower?action=status');
      if (response.ok) {
        console.log('✅ Development server is ready!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
      if (i === 0) console.log(`   Attempt ${i + 1}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    process.stdout.write('.');
  }
  
  console.log('\n❌ Server did not become ready in time');
  return false;
}

// Define the real scenarios
const scenarios = [
  {
    name: 'storm-tracker-reonomy',
    context: 'Storm tracking application enhancement',
    requirement: 'Add Reonomy API parallel to PropertyRadar API for consolidated company info',
    credentials: {
      accessKey: 'restoremasters',
      secretKey: 'yk5o6wsz1dlsge9z'
    },
    constraints: [
      'Must maintain singleton service pattern',
      'Should be modular architecture',
      'Parallel processing with PropertyRadar',
      'Consolidated company information display'
    ],
    priority: 'high',
    expectedOutcome: 'Enhanced storm-tracker with dual API integration'
  },
  {
    name: 'ai-callers-bland-integration',
    context: 'AI calling system duplication and enhancement',
    requirement: 'Duplicate repo, replace ElevenLabs with Bland.ai, remove restoremasters branding',
    credentials: {
      blandApiOrg: 'org_713a4213d5a17e2309ea67d97def2f1679c4244c21abc9876839187a4cf3d216f0a4432e86b907f73e6769d8aefdd5-6c66-4922-a7ba-7c415e321ce0',
      twilioApiKey: '8e5137e8ebbbeb5c3cebb6642708200f'
    },
    twilioNumbers: [
      '+1 218 319 6158 (Wadena, MN)',
      '+1 251 312 8845 (Repton, AL)',
      '+1 585 440 6885 (Churchville, NY)',
      '+1 972 573 9917 (Irving, TX)',
      '+1 417 567 6137 (Fair Grove, MO)',
      '+1 217 286 6463 (Henning, IL)',
      '+1 850 749 3198 (Destin, FL)',
      '+1 229 210 0714 (Arlington, GA)',
      '+1 984 253 3209 (Hillsborough, NC)',
      '+1 405 461 5593 (Asher, OK)'
    ],
    requirements: [
      'Create new repository (not fork)',
      'Replace ElevenLabs with Bland.ai integration',
      'Remove all restoremasters branding/logos',
      'Update Twilio configuration with new API key',
      'Support multiple roofing restoration workflows',
      'Enable multiple agents per campaign',
      'Maintain cold calling functionality'
    ],
    priority: 'high',
    expectedOutcome: 'New ai-callers-bland repository with complete integration'
  }
];

async function executeScenario(scenario) {
  console.log(`\n🎯 EXECUTING SCENARIO: ${scenario.name.toUpperCase()}`);
  console.log('-'.repeat(60));
  
  console.log(`📋 Context: ${scenario.context}`);
  console.log(`🎯 Requirement: ${scenario.requirement}`);
  console.log(`⚡ Priority: ${scenario.priority.toUpperCase()}`);
  
  const startTime = Date.now();
  
  try {
    // Execute the scenario via CADIS Tower API
    const response = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: `Execute real scenario: ${scenario.requirement}`,
        type: 'evolution',
        scenario: scenario,
        executeReal: true,
        context: {
          scenario: scenario.name,
          credentials: scenario.credentials,
          constraints: scenario.constraints || scenario.requirements,
          priority: scenario.priority
        },
        enableConsciousness: true,
        layers: 5
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const executionTime = Date.now() - startTime;
    
    console.log(`\n✅ SCENARIO EXECUTION COMPLETE`);
    console.log(`   ⏱️ Execution Time: ${executionTime}ms`);
    console.log(`   🎯 Success: ${result.success ? 'YES' : 'NO'}`);
    
    if (result.success) {
      console.log(`   📊 Decision ID: ${result.result?.decision?.id || 'N/A'}`);
      console.log(`   📋 Trace ID: ${result.result?.trace?.traceId || 'N/A'}`);
      console.log(`   🎯 Confidence: ${result.result?.result?.confidence ? (result.result.result.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
      
      if (result.result?.result?.recommendation) {
        console.log(`\n💡 RECOMMENDATION:`);
        console.log(`   ${result.result.result.recommendation}`);
      }
      
      if (result.result?.result?.branchStrategy) {
        console.log(`\n🌿 BRANCH STRATEGY:`);
        console.log(`   ${result.result.result.branchStrategy}`);
      }
      
      if (result.result?.result?.deploymentPlan) {
        console.log(`\n🚀 DEPLOYMENT PLAN:`);
        console.log(`   ${result.result.result.deploymentPlan}`);
      }
      
      if (result.result?.result?.approvalRequired) {
        console.log(`\n🔐 APPROVAL REQUIRED: YES`);
        console.log(`   Risk Level: ${result.result.result.riskAssessment?.toUpperCase() || 'UNKNOWN'}`);
      }
    } else {
      console.log(`   ❌ Error: ${result.error || 'Unknown error'}`);
    }
    
    return {
      scenario: scenario.name,
      success: result.success,
      executionTime,
      result: result.result || null,
      error: result.error || null
    };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.log(`\n❌ SCENARIO EXECUTION FAILED`);
    console.log(`   ⏱️ Execution Time: ${executionTime}ms`);
    console.log(`   💥 Error: ${error.message}`);
    
    return {
      scenario: scenario.name,
      success: false,
      executionTime,
      result: null,
      error: error.message
    };
  }
}

async function generateExecutionReport(results) {
  console.log('\n\n📋 EXECUTION REPORT');
  console.log('='.repeat(50));
  
  const totalScenarios = results.length;
  const successfulScenarios = results.filter(r => r.success).length;
  const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   🎯 Total Scenarios: ${totalScenarios}`);
  console.log(`   ✅ Successful: ${successfulScenarios}`);
  console.log(`   ❌ Failed: ${totalScenarios - successfulScenarios}`);
  console.log(`   ⏱️ Total Time: ${totalExecutionTime}ms`);
  console.log(`   📈 Success Rate: ${((successfulScenarios / totalScenarios) * 100).toFixed(1)}%`);
  
  console.log(`\n📋 DETAILED RESULTS:`);
  results.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    console.log(`\n${i + 1}. ${status} ${result.scenario.toUpperCase()}`);
    console.log(`   Time: ${result.executionTime}ms`);
    
    if (result.success && result.result) {
      console.log(`   Decision: ${result.result.decision?.id || 'N/A'}`);
      console.log(`   Confidence: ${result.result.result?.confidence ? (result.result.result.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`   Approval: ${result.result.result?.approvalRequired ? 'Required' : 'Not Required'}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  if (successfulScenarios > 0) {
    console.log(`\n🎉 SUCCESS! ${successfulScenarios} scenario(s) executed successfully`);
    console.log(`\n🔍 Check the following for results:`);
    console.log(`   • Admin Dashboard: http://localhost:3000/admin/cadis-evolution`);
    console.log(`   • Decision History: Check CADIS decisions table`);
    console.log(`   • Trace Logs: Check CADIS trace archive`);
  }
  
  return {
    totalScenarios,
    successfulScenarios,
    successRate: (successfulScenarios / totalScenarios) * 100,
    totalExecutionTime
  };
}

async function runRealScenarios() {
  console.log('🚀 Starting Real CADIS Scenario Execution...\n');
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('❌ Cannot proceed - development server is not ready');
    console.log('💡 Make sure to run: npm run dev');
    return;
  }
  
  // Execute all scenarios
  const results = [];
  
  for (const scenario of scenarios) {
    const result = await executeScenario(scenario);
    results.push(result);
    
    // Brief pause between scenarios
    if (scenarios.indexOf(scenario) < scenarios.length - 1) {
      console.log('\n⏳ Pausing before next scenario...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Generate final report
  const report = await generateExecutionReport(results);
  
  console.log('\n🎯 NEXT STEPS:');
  if (report.successfulScenarios > 0) {
    console.log('   1. Review execution results in admin dashboard');
    console.log('   2. Check decision history and trace logs');
    console.log('   3. Approve any pending high-risk changes');
    console.log('   4. Monitor deployment progress');
  } else {
    console.log('   1. Check error logs for failure details');
    console.log('   2. Verify CADIS Tower configuration');
    console.log('   3. Retry scenario execution');
  }
  
  return report;
}

// Execute the scenarios
runRealScenarios()
  .then(report => {
    console.log(`\n🎉 Real scenario execution complete!`);
    console.log(`📊 Success Rate: ${report.successRate.toFixed(1)}%`);
  })
  .catch(error => {
    console.error('💥 Execution failed:', error.message);
    process.exit(1);
  });
