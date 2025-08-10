// Direct test to check thumbnail generation results
console.log('🔍 Testing thumbnail generation directly...');

try {
  // Test the diagnostic endpoint
  console.log('\n📊 Checking current diagnostic status...');
  const diagnosticResponse = await fetch('http://localhost:3000/api/admin/thumbnail-diagnostic');
  const diagnosticData = await diagnosticResponse.json();
  
  console.log('Current diagnostic data:', JSON.stringify(diagnosticData, null, 2));
  
  // Test a simple diagnostic log
  console.log('\n📝 Testing diagnostic logging...');
  const testLogResponse = await fetch('http://localhost:3000/api/admin/thumbnail-diagnostic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoKey: 'test-video-key',
      attempt: 1,
      brightness: 25.5,
      seekTime: 3.0,
      duration: 120.0,
      success: true
    })
  });
  
  if (testLogResponse.ok) {
    console.log('✅ Diagnostic logging test successful');
  } else {
    console.log('❌ Diagnostic logging test failed');
  }
  
  // Check diagnostic data again
  console.log('\n📊 Checking diagnostic status after test...');
  const diagnosticResponse2 = await fetch('http://localhost:3000/api/admin/thumbnail-diagnostic');
  const diagnosticData2 = await diagnosticResponse2.json();
  
  console.log('Updated diagnostic data:', JSON.stringify(diagnosticData2, null, 2));
  
  // Test thumbnail cache status
  console.log('\n💾 Testing thumbnail cache...');
  const cacheResponse = await fetch('http://localhost:3000/api/admin/clear-thumbnail-cache', {
    method: 'POST'
  });
  
  if (cacheResponse.ok) {
    const cacheData = await cacheResponse.json();
    console.log('✅ Cache system working:', cacheData.message);
  } else {
    console.log('❌ Cache system issue');
  }
  
  // Now trigger actual page load and wait
  console.log('\n🎬 Triggering leadership page load...');
  const pageResponse = await fetch('http://localhost:3000/leadership');
  console.log(`Page response: ${pageResponse.status} ${pageResponse.statusText}`);
  
  // Wait for potential generation
  console.log('\n⏳ Waiting 15 seconds for thumbnail generation...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Check final results
  console.log('\n🏁 Final diagnostic check...');
  const finalResponse = await fetch('http://localhost:3000/api/admin/thumbnail-diagnostic');
  const finalData = await finalResponse.json();
  
  console.log('Final results:');
  console.log(`📊 Total videos processed: ${finalData.videoCount}`);
  console.log(`📈 Results summary:`, finalData.results);
  
  if (finalData.videoCount > 0) {
    console.log('\n🎉 SUCCESS! Thumbnail generation is working!');
    let successful = 0;
    let failed = 0;
    let errors = 0;
    
    finalData.results.forEach(result => {
      if (result.result === 'SUCCESS') successful++;
      else if (result.result === 'FAILED') failed++;
      else errors++;
    });
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`📊 Success rate: ${Math.round((successful / finalData.videoCount) * 100)}%`);
  } else {
    console.log('\n⚠️ No thumbnail generation detected yet');
    console.log('This could mean:');
    console.log('1. Videos are loading from cache (instant loading)');
    console.log('2. Thumbnail generation is still in progress');
    console.log('3. No videos are configured to show on leadership page');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n🎯 Test complete!'); 