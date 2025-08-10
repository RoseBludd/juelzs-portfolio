// Test cache integration
import fetch from 'node-fetch';

console.log('🧪 === TESTING CACHE INTEGRATION ===');

async function testCacheIntegration() {
  try {
    console.log('📋 Step 1: Get leadership videos...');
    const videosResponse = await fetch('http://localhost:3000/api/leadership-videos');
    const videosData = await videosResponse.json();
    
    if (!videosData.success) {
      throw new Error('Failed to get leadership videos');
    }
    
    console.log(`✅ Found ${videosData.count} leadership videos`);
    const videoKeys = videosData.videos.map(v => v.id);
    
    console.log('\n💾 Step 2: Test each video cache directly...');
    
    for (const videoKey of videoKeys) {
      console.log(`\n🔍 Testing cache for: ${videoKey.substring(0, 30)}...`);
      
      // Test the cache by creating a fake VideoThumbnail request
      try {
        const testResponse = await fetch('http://localhost:3000/api/admin/store-thumbnail-cache', {
          method: 'GET'
        });
        
        if (testResponse.status === 405) {
          console.log('   ℹ️ Store endpoint exists (405 Method Not Allowed for GET)');
        }
        
        // Check if we can retrieve this video from diagnostic
        const diagnosticResponse = await fetch('http://localhost:3000/api/admin/thumbnail-diagnostic');
        const diagnosticData = await diagnosticResponse.json();
        
        const foundInDiagnostic = diagnosticData.results?.some(r => r.videoKey === videoKey);
        console.log(`   📊 Found in diagnostic: ${foundInDiagnostic ? '✅ YES' : '❌ NO'}`);
        
      } catch (error) {
        console.log(`   ❌ Cache test failed: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Step 3: Verify diagnostic endpoint shows cached items...');
    const finalDiagnosticResponse = await fetch('http://localhost:3000/api/admin/thumbnail-diagnostic');
    const finalDiagnosticData = await finalDiagnosticResponse.json();
    
    console.log(`📊 Total cached items: ${finalDiagnosticData.videoCount || 0}`);
    console.log(`📊 Results count: ${finalDiagnosticData.results?.length || 0}`);
    
    if (finalDiagnosticData.results?.length > 0) {
      console.log('\n✅ CACHE INTEGRATION SUCCESS!');
      finalDiagnosticData.results.forEach((result, idx) => {
        console.log(`   ${idx + 1}. ${result.videoKey?.substring(0, 30)}... - Status: ${result.status}`);
      });
    } else {
      console.log('\n❌ CACHE INTEGRATION FAILED!');
      console.log('   No cached items found in diagnostic');
    }
    
  } catch (error) {
    console.error('❌ Cache integration test failed:', error);
  }
}

testCacheIntegration(); 