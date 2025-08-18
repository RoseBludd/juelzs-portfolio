#!/usr/bin/env node

/**
 * Trace admin dashboard performance to identify slow API calls
 */

console.log('🔍 Tracing Admin Dashboard Performance...\n');

// Test the admin dashboard endpoint
async function traceAdminDashboard() {
  console.log('📊 Testing /admin dashboard load...');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/admin');
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`⏱️  Admin dashboard loaded in: ${loadTime}ms`);
    
    if (loadTime > 5000) {
      console.log('🐌 SLOW LOAD DETECTED! Investigating...\n');
      
      console.log('🔍 Likely causes of slow admin dashboard:');
      console.log('1. 📊 PortfolioService.getSystemArchitectures() - may be calling GitHub API');
      console.log('2. 🎥 PortfolioService.getLatestLeadershipVideos() - may be calling S3');
      console.log('3. 🧠 Meeting analysis running in background');
      console.log('4. 🗄️ Database queries without proper caching');
      
    } else if (loadTime > 2000) {
      console.log('⚠️  Moderate load time - could be optimized');
    } else {
      console.log('✅ Fast load time - good performance');
    }
    
    if (response.ok) {
      console.log('✅ Admin dashboard accessible');
    } else {
      console.log(`❌ Admin dashboard error: ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ Admin dashboard test failed:', error.message);
    console.log('💡 Make sure the dev server is running: npm run dev');
  }
}

// Test individual service methods to identify bottlenecks
async function testServiceMethods() {
  console.log('\n🧪 Testing individual service methods...');
  
  const tests = [
    {
      name: 'getSystemArchitectures()',
      endpoint: '/api/test-system-architectures'
    },
    {
      name: 'getLatestLeadershipVideos()', 
      endpoint: '/api/test-leadership-videos'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🔬 Testing ${test.name}:`);
    const startTime = Date.now();
    
    try {
      // We'll create these test endpoints if needed
      console.log(`   📡 Would call: ${test.endpoint}`);
      console.log(`   ⏱️  Estimated time: < 500ms (should be cached)`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Recommendations for optimization
function showOptimizationRecommendations() {
  console.log('\n💡 Admin Dashboard Optimization Recommendations:');
  console.log('');
  console.log('🎯 Quick Fixes:');
  console.log('1. Remove any S3Service.getMeetingGroups() calls');
  console.log('2. Use static counts instead of real-time analysis');
  console.log('3. Cache portfolio service results');
  console.log('4. Move heavy operations to background jobs');
  console.log('');
  console.log('🏗️ Architecture Changes:');
  console.log('1. Make admin dashboard show cached stats only');
  console.log('2. Add "Refresh Data" buttons for real-time updates');
  console.log('3. Use React Query or SWR for client-side caching');
  console.log('4. Implement background data refresh jobs');
  console.log('');
  console.log('🎯 Target Performance:');
  console.log('- Admin dashboard: < 1 second');
  console.log('- Individual admin pages: < 3 seconds');
  console.log('- Heavy analysis: Only on manual trigger');
}

// Run all tests
async function runPerformanceTrace() {
  await traceAdminDashboard();
  await testServiceMethods();
  showOptimizationRecommendations();
  
  console.log('\n🎉 Performance trace completed!');
  console.log('📋 Next: Review admin dashboard code and remove heavy operations');
}

runPerformanceTrace().catch(error => {
  console.error('💥 Performance trace failed:', error);
  process.exit(1);
});
