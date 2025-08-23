#!/usr/bin/env node

/**
 * Test CADIS Self-Enhancement
 * 
 * Tests CADIS's ability to analyze capability gaps and enhance itself
 * when given requests it can't initially handle
 */

console.log('🧠 Testing CADIS Self-Enhancement');
console.log('='.repeat(50));

async function testSelfEnhancement() {
  console.log('🚀 Testing CADIS self-enhancement capabilities...\n');

  // Test scenarios that require capabilities CADIS doesn't initially have
  const testScenarios = [
    {
      name: 'Real File Creation',
      request: 'Create a real TypeScript service file for weather API integration with actual code',
      expectedCapabilities: ['real-implementation', 'file-system-operations', 'api-integration']
    },
    {
      name: 'Git Repository Management',
      request: 'Create a new branch, implement changes, and commit to repository',
      expectedCapabilities: ['git-operations', 'real-implementation', 'file-system-operations']
    },
    {
      name: 'Deployment Automation',
      request: 'Deploy the application to Vercel with environment variables and preview URL',
      expectedCapabilities: ['deployment-automation', 'environment-management']
    },
    {
      name: 'Testing Suite Generation',
      request: 'Generate comprehensive test suite with unit tests and validation',
      expectedCapabilities: ['automated-testing', 'file-system-operations']
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`\n🎯 Testing Scenario: ${scenario.name}`);
    console.log(`📋 Request: ${scenario.request}`);
    console.log(`🔧 Expected Capabilities: ${scenario.expectedCapabilities.join(', ')}`);
    console.log('-'.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/cadis-tower', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: scenario.request,
          type: 'evolution',
          enableConsciousness: true,
          context: {
            testScenario: scenario.name,
            expectedCapabilities: scenario.expectedCapabilities
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ CADIS Response Received');
        
        if (result.selfEnhancement) {
          console.log(`🛠️ Self-Enhancement Triggered: ${result.selfEnhancement.addedCapabilities?.length || 0} capabilities added`);
          console.log(`⏱️ Enhancement Time: ${result.selfEnhancement.enhancementTime}ms`);
          console.log(`📈 Success Rate: ${result.selfEnhancement.success ? '100%' : 'Partial'}`);
        } else {
          console.log('ℹ️ No self-enhancement required (capabilities already present)');
        }
        
        console.log(`🎯 Request Handled: ${result.success ? 'YES' : 'NO'}`);
        
      } else {
        console.log('❌ Request failed:', response.status, response.statusText);
      }

    } catch (error) {
      console.log('💥 Test failed:', error.message);
    }

    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function waitForServer() {
  console.log('⏳ Checking if development server is ready...');
  
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/cadis-tower?action=status');
      if (response.ok) {
        console.log('✅ Server is ready!\n');
        return true;
      }
    } catch (error) {
      // Server not ready
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  
  console.log('\n❌ Server not ready. Make sure to run: npm run dev');
  return false;
}

async function main() {
  const serverReady = await waitForServer();
  
  if (!serverReady) {
    process.exit(1);
  }
  
  try {
    await testSelfEnhancement();
    
    console.log('\n\n📋 SELF-ENHANCEMENT TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ CADIS self-enhancement capabilities tested');
    console.log('🔍 Check the terminal logs above to see:');
    console.log('   • Capability gap analysis');
    console.log('   • Self-enhancement processes');
    console.log('   • New capabilities added');
    console.log('   • Decision history records');
    console.log('\n🎯 CADIS should now be more capable than when it started!');
    
  } catch (error) {
    console.error('\n💥 Self-enhancement test failed:', error.message);
    process.exit(1);
  }
}

main();
