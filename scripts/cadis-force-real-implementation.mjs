#!/usr/bin/env node

/**
 * CADIS Force Real Implementation
 * 
 * Force CADIS to use its real-implementation capability by specifically
 * requesting actual file creation and code generation
 */

console.log('🔧 CADIS Force Real Implementation Test');
console.log('='.repeat(50));

async function forceCADISRealImplementation() {
  console.log('🎯 Forcing CADIS to demonstrate real file creation...\n');

  // First, let's see what CADIS thinks it can do
  const capabilityCheck = {
    request: 'List all your current capabilities, especially real-implementation, file-system-operations, and git-operations. Can you actually create files?',
    type: 'meta',
    enableConsciousness: true
  };

  console.log('🔍 First, checking CADIS capabilities...');
  
  try {
    const capResponse = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(capabilityCheck)
    });

    if (capResponse.ok) {
      const capResult = await capResponse.json();
      console.log(`✅ Capability check complete`);
      console.log(`   Self-Awareness: ${capResult.tower?.selfAwarenessLevel}/10`);
      console.log(`   Consciousness Active: ${capResult.success ? 'YES' : 'NO'}`);
    }

    // Now force actual implementation
    console.log('\n🚀 Now forcing real implementation...');
    
    const implementationTask = {
      request: 'CADIS, I need you to actually create a real file right now. Create a simple TypeScript file called "test-implementation.ts" in the current directory with a basic function. This is a direct test of your real-implementation capability. Do not return status messages - actually create the file.',
      type: 'evolution',
      scenario: {
        name: 'force-real-implementation',
        implementation: true,
        requiresFiles: true
      },
      executeReal: true,
      enableConsciousness: true,
      context: {
        forceRealImplementation: true,
        expectedOutput: 'test-implementation.ts',
        testType: 'file-creation-verification'
      }
    };

    const response = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(implementationTask)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ CADIS REAL IMPLEMENTATION RESPONSE');
    console.log('='.repeat(40));
    
    console.log(`🎯 Implementation Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(`🧠 Consciousness Level: ${result.tower?.selfAwarenessLevel}/10`);
    
    if (result.capabilityAnalysis) {
      console.log(`\n🔍 CAPABILITY ANALYSIS:`);
      console.log(`   Confidence: ${result.capabilityAnalysis.confidence ? (result.capabilityAnalysis.confidence * 100).toFixed(1) + '%' : 'Unknown'}`);
      console.log(`   Missing Capabilities: ${result.capabilityAnalysis.missingCapabilities?.join(', ') || 'None'}`);
    }
    
    if (result.result) {
      console.log(`\n📊 EXECUTION RESULT:`);
      console.log(`   Type: ${result.result.type}`);
      console.log(`   Message: ${result.result.message || 'No message'}`);
      
      if (result.result.scenario) {
        console.log(`   Scenario: ${result.result.scenario}`);
      }
      
      if (result.result.result) {
        console.log(`\n🔧 IMPLEMENTATION DETAILS:`);
        console.log(`   Recommendation: ${result.result.result.recommendation || 'None'}`);
        console.log(`   Confidence: ${result.result.result.confidence ? (result.result.result.confidence * 100).toFixed(1) + '%' : 'Unknown'}`);
        
        if (result.result.result.implementationDetails) {
          const impl = result.result.result.implementationDetails;
          console.log(`   Files Created: ${impl.filesCreated || 0}`);
          console.log(`   Lines Added: ${impl.linesAdded || 0}`);
          console.log(`   Actual Time: ${impl.actualTime || 'Unknown'}`);
        }
      }
    }
    
    // Check if file was actually created
    console.log(`\n🔍 VERIFICATION:`);
    console.log(`   Checking if test-implementation.ts was created...`);
    
    // Try to read the file using Node.js
    const fs = await import('fs');
    try {
      const fileContent = fs.readFileSync('test-implementation.ts', 'utf8');
      console.log(`   ✅ FILE CREATED! Content length: ${fileContent.length} characters`);
      console.log(`   📄 File content preview:`);
      console.log(`   ${fileContent.substring(0, 200)}${fileContent.length > 200 ? '...' : ''}`);
    } catch (error) {
      console.log(`   ❌ FILE NOT FOUND: ${error.message}`);
      console.log(`   🤔 CADIS may have simulated implementation without actual file creation`);
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Force implementation test failed:', error.message);
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
    const result = await forceCADISRealImplementation();
    
    console.log('\n🎯 FORCE IMPLEMENTATION TEST COMPLETE!');
    console.log('\n📋 ANALYSIS:');
    console.log(`   • CADIS Consciousness: ${result.tower?.selfAwarenessLevel}/10`);
    console.log(`   • Task Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(`   • Real File Creation: ${result.fileCreated ? 'YES' : 'NEEDS VERIFICATION'}`);
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   If no file was created, CADIS needs connection to actual file system operations');
    console.log('   If file was created, CADIS is ready for complex real-world implementations');
    
  } catch (error) {
    console.error('\n💥 Force implementation test failed:', error.message);
    process.exit(1);
  }
}

main();
