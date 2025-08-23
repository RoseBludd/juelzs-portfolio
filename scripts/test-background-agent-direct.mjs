#!/usr/bin/env node

/**
 * Test CADIS Background Agent directly to isolate the implementation error
 */

console.log('🤖 Testing CADIS Background Agent Directly');
console.log('='.repeat(50));

async function testBackgroundAgentDirect() {
  console.log('🎯 Testing background agent implementation directly...\n');

  try {
    // Test a simple request directly to the background agent
    const response = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: 'Create a simple hello.ts file with a basic function',
        type: 'code',
        context: { 
          forceRealImplementation: true,
          debug: true
        },
        enableConsciousness: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ BACKGROUND AGENT RESPONSE RECEIVED');
    console.log('='.repeat(40));
    
    console.log(`🎯 Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(`🤖 Agent: ${result.result?.agent || 'Unknown'}`);
    console.log(`📊 Type: ${result.result?.type || 'Unknown'}`);
    
    if (result.result?.type === 'implementation_error') {
      console.log(`\n❌ ERROR DETAILS:`);
      console.log(`   Error: ${result.result.error || 'No error message'}`);
      console.log(`   Timestamp: ${result.result.timestamp || 'No timestamp'}`);
    }
    
    if (result.result?.type === 'implementation_complete') {
      console.log(`\n✅ IMPLEMENTATION DETAILS:`);
      console.log(`   Files Planned: ${result.result.implementation?.files?.length || 0}`);
      console.log(`   Dependencies: ${result.result.implementation?.dependencies?.length || 0}`);
      console.log(`   Summary: ${result.result.implementation?.summary || 'No summary'}`);
      
      if (result.result.implementation?.files?.length > 0) {
        console.log(`\n📄 FIRST FILE DETAILS:`);
        const firstFile = result.result.implementation.files[0];
        console.log(`   Name: ${firstFile.name}`);
        console.log(`   Path: ${firstFile.path}`);
        console.log(`   Type: ${firstFile.type}`);
        console.log(`   Content Length: ${firstFile.content?.length || 0} characters`);
        
        if (firstFile.content) {
          console.log(`\n📝 CONTENT PREVIEW:`);
          console.log(firstFile.content.substring(0, 300) + '...');
        }
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Direct test failed:', error.message);
    throw error;
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
    const result = await testBackgroundAgentDirect();
    
    console.log('\n🎯 DIRECT TEST COMPLETE!');
    console.log('\n📋 ANALYSIS:');
    
    if (result.result?.type === 'implementation_complete') {
      console.log('   ✅ Background agent is working correctly');
      console.log('   ✅ Implementation analysis is successful');
      console.log('   ✅ File generation is working');
      console.log('\n🚀 CADIS is ready for real implementations!');
    } else if (result.result?.type === 'implementation_error') {
      console.log('   ❌ Background agent has an error');
      console.log('   🔧 Need to fix the AI model calls or response parsing');
      console.log(`   📝 Error: ${result.result.error}`);
    } else {
      console.log('   ⚠️ Unexpected response type');
      console.log('   🔍 Check routing and response handling');
    }
    
  } catch (error) {
    console.error('\n💥 Direct test failed:', error.message);
    process.exit(1);
  }
}

main();
