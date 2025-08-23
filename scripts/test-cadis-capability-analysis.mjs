#!/usr/bin/env node

/**
 * Test CADIS Capability Analysis
 * 
 * Directly tests CADIS's capability gap analysis by forcing it to encounter
 * requests that definitely require capabilities it doesn't have
 */

console.log('🔍 Testing CADIS Capability Analysis');
console.log('='.repeat(50));

async function testCapabilityAnalysis() {
  console.log('🧠 Testing CADIS capability gap detection...\n');

  // Test with a request that should definitely trigger enhancement
  const testRequest = {
    request: 'I need you to actually create real files in the filesystem, commit them to a git repository, deploy to production with real environment variables, and generate actual test files with working code',
    type: 'evolution',
    enableConsciousness: true,
    context: {
      forceCapabilityCheck: true,
      requiredCapabilities: [
        'real-implementation',
        'file-system-operations', 
        'git-operations',
        'deployment-automation',
        'automated-testing',
        'environment-management'
      ]
    }
  };

  console.log('📋 Sending request that requires multiple missing capabilities...');
  console.log(`🎯 Request: ${testRequest.request}`);
  console.log('⏳ Waiting for CADIS response...\n');

  try {
    const response = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ CADIS Response Analysis:');
      console.log('='.repeat(40));
      
      console.log(`🎯 Request Success: ${result.success ? 'YES' : 'NO'}`);
      console.log(`⏱️ Processing Time: ${result.processingTime || 'Unknown'}ms`);
      
      if (result.capabilityAnalysis) {
        console.log('\n🔍 CAPABILITY ANALYSIS:');
        console.log(`   Gap Detected: ${result.capabilityAnalysis.needsEnhancement ? 'YES' : 'NO'}`);
        console.log(`   Missing Capabilities: ${result.capabilityAnalysis.missingCapabilities?.join(', ') || 'None'}`);
        console.log(`   Request Complexity: ${result.capabilityAnalysis.requestComplexity?.toUpperCase() || 'Unknown'}`);
        console.log(`   Confidence: ${result.capabilityAnalysis.confidence ? (result.capabilityAnalysis.confidence * 100).toFixed(1) + '%' : 'Unknown'}`);
      }
      
      if (result.selfEnhancement) {
        console.log('\n🛠️ SELF-ENHANCEMENT RESULTS:');
        console.log(`   Enhancement Triggered: YES`);
        console.log(`   Capabilities Added: ${result.selfEnhancement.addedCapabilities?.join(', ') || 'None'}`);
        console.log(`   Partial Capabilities: ${result.selfEnhancement.partialCapabilities?.join(', ') || 'None'}`);
        console.log(`   Enhancement Time: ${result.selfEnhancement.enhancementTime || 0}ms`);
        console.log(`   Success Rate: ${result.selfEnhancement.success ? '100%' : 'Partial'}`);
      } else {
        console.log('\n⚠️ NO SELF-ENHANCEMENT TRIGGERED');
        console.log('   This suggests CADIS thinks it already has all required capabilities');
      }
      
      console.log('\n📊 FULL RESPONSE STRUCTURE:');
      console.log(JSON.stringify(result, null, 2));
      
    } else {
      console.log('❌ Request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.log('💥 Test failed:', error.message);
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
  
  await testCapabilityAnalysis();
  
  console.log('\n🎯 Test complete! Check the logs above to see how CADIS analyzed its capabilities.');
}

main();
