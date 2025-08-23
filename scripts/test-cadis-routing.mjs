#!/usr/bin/env node

/**
 * Test CADIS routing to background agent
 */

console.log('🔧 Testing CADIS Routing to Background Agent');
console.log('='.repeat(50));

async function testCADISRouting() {
  console.log('🎯 Testing different request types to see routing behavior...\n');

  const testCases = [
    {
      name: 'Simple Implementation Request',
      request: 'Create a simple TypeScript file called hello.ts',
      type: 'code',
      context: { forceRealImplementation: true }
    },
    {
      name: 'Explicit File Creation',
      request: 'Generate code for a new service',
      type: 'evolution',
      context: { realFilesRequired: true }
    },
    {
      name: 'Build Request',
      request: 'Build a new component for the dashboard',
      type: 'evolution',
      context: { implementation: true }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`   Request: "${testCase.request}"`);
    console.log(`   Type: ${testCase.type}`);
    console.log(`   Context: ${JSON.stringify(testCase.context)}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/cadis-tower', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request: testCase.request,
          type: testCase.type,
          context: testCase.context,
          enableConsciousness: false // Disable for faster testing
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log(`   ✅ Response received`);
      console.log(`   🎯 Success: ${result.success ? 'YES' : 'NO'}`);
      console.log(`   🤖 Agent Used: ${result.result?.agent || 'Unknown'}`);
      console.log(`   📊 Result Type: ${result.result?.type || 'Unknown'}`);
      
      if (result.result?.implementation) {
        console.log(`   📁 Files Planned: ${result.result.implementation.files?.length || 0}`);
        if (result.result.implementation.files?.length > 0) {
          console.log(`   📄 First File: ${result.result.implementation.files[0].name}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
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
    await testCADISRouting();
    
    console.log('\n🎉 ROUTING TEST COMPLETE!');
    console.log('\n💡 Analysis:');
    console.log('   If "Agent Used: cadis-background-agent", routing is working');
    console.log('   If "Agent Used: Unknown", requests are going to Tower intelligence layers');
    console.log('   Check the terminal logs for "🤖 Routing to CADIS Background Agent" messages');
    
  } catch (error) {
    console.error('\n💥 Routing test failed:', error.message);
    process.exit(1);
  }
}

main();
