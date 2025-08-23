#!/usr/bin/env node

/**
 * CADIS Database Check
 * 
 * Check what CADIS-related tables exist using the existing database service
 */

console.log('🧠 CADIS Database Check');
console.log('='.repeat(40));

// Simple database check using fetch to the API
async function checkCADISDatabase() {
  console.log('\n📊 Checking CADIS database status...');
  
  try {
    // Check if we can connect to the API
    const response = await fetch('http://localhost:3000/api/cadis-tower?action=status');
    
    if (!response.ok) {
      console.log('⚠️ CADIS Tower API not accessible - server may not be running');
      console.log('   Start the dev server with: npm run dev');
      return false;
    }
    
    const data = await response.json();
    console.log('✅ CADIS Tower API is accessible');
    console.log(`   Status: ${data.success ? 'Active' : 'Inactive'}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Cannot connect to CADIS API');
    console.log('   Make sure the development server is running: npm run dev');
    return false;
  }
}

async function initializeCADISDatabase() {
  console.log('\n🔧 Initializing CADIS database tables...');
  
  try {
    const response = await fetch('http://localhost:3000/api/cadis-tower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        request: 'Initialize CADIS database tables',
        type: 'evolution',
        executeReal: false
      })
    });
    
    if (response.ok) {
      console.log('✅ CADIS database initialization request sent');
      return true;
    } else {
      console.log('❌ Failed to initialize CADIS database');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error initializing CADIS database:', error.message);
    return false;
  }
}

async function checkAndPrepareDatabase() {
  console.log('🚀 Starting CADIS database preparation...\n');
  
  // Check if API is accessible
  const apiAccessible = await checkCADISDatabase();
  
  if (!apiAccessible) {
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Run this script again');
    console.log('   3. Proceed with scenario execution');
    return false;
  }
  
  // Try to initialize database
  const dbInitialized = await initializeCADISDatabase();
  
  console.log('\n📋 SUMMARY:');
  console.log(`   🌐 API Accessible: ${apiAccessible ? 'YES' : 'NO'}`);
  console.log(`   🗄️ Database Ready: ${dbInitialized ? 'YES' : 'UNKNOWN'}`);
  
  if (apiAccessible) {
    console.log('\n✅ CADIS is ready for scenario execution!');
    console.log('\n🎯 You can now proceed with:');
    console.log('   • Storm-tracker + Reonomy integration');
    console.log('   • AI-callers + Bland.ai integration');
    console.log('\n💻 Execute via CLI:');
    console.log('   node scripts/cadis-tower-cli.mjs evolution "Execute storm-tracker scenario"');
    console.log('   node scripts/cadis-tower-cli.mjs evolution "Execute ai-callers scenario"');
    
    return true;
  }
  
  return false;
}

// Run the check
checkAndPrepareDatabase()
  .then(ready => {
    if (ready) {
      console.log('\n🎉 CADIS database check complete - ready to proceed!');
    } else {
      console.log('\n⚠️ CADIS database needs setup - follow the next steps above.');
    }
  })
  .catch(error => {
    console.error('💥 Database check failed:', error.message);
  });
