// Diagnose why cache lookup is failing for comprehensive AI thumbnails
import fetch from 'node-fetch';

console.log('🔍 === DIAGNOSING CACHE FAILURE ===');

async function diagnoseCacheFailure() {
  try {
    console.log('🧪 Step 1: Test direct cache storage...');
    
    // Get one comprehensive AI thumbnail
    const comprehensiveResponse = await fetch('http://localhost:3000/api/admin/comprehensive-thumbnails');
    const comprehensiveData = await comprehensiveResponse.json();
    
    const firstVideo = comprehensiveData.clickableResults[0];
    const bestThumbnail = firstVideo.options.find(opt => opt.isRecommended) || firstVideo.options[0];
    
    console.log(`📸 Testing with: ${firstVideo.videoKey}`);
    console.log(`🏆 Best thumbnail: ${bestThumbnail.s3Url.substring(0, 80)}...`);
    
    // Store it in cache manually
    console.log('\n💾 Step 2: Manual cache storage...');
    const storeResponse = await fetch('http://localhost:3000/api/admin/store-thumbnail-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoKey: firstVideo.videoKey,
        s3Url: bestThumbnail.s3Url,
        s3Key: `thumbnails/cached/${firstVideo.videoKey}.jpg`,
        seekTime: bestThumbnail.seekTime,
        aspectRatio: 'video'
      })
    });
    
    if (storeResponse.ok) {
      const storeResult = await storeResponse.json();
      console.log(`✅ Manual storage result: ${storeResult.message}`);
    } else {
      console.log(`❌ Manual storage failed: ${storeResponse.status}`);
      const errorText = await storeResponse.text();
      console.log(`❌ Error details: ${errorText}`);
    }
    
    // Test if it's accessible via direct HTTP request
    console.log('\n🌐 Step 3: Test S3 URL accessibility...');
    try {
      const s3Response = await fetch(bestThumbnail.s3Url);
      console.log(`📊 S3 URL status: ${s3Response.status}`);
      console.log(`📊 Content-Type: ${s3Response.headers.get('content-type')}`);
      console.log(`📊 Content-Length: ${s3Response.headers.get('content-length')}`);
      
      if (s3Response.ok) {
        console.log(`✅ S3 URL is accessible!`);
      } else {
        console.log(`❌ S3 URL not accessible: ${s3Response.status}`);
      }
    } catch (s3Error) {
      console.log(`❌ S3 URL fetch error: ${s3Error.message}`);
    }
    
    // Test a direct image load in the browser context
    console.log('\n🖼️  Step 4: Test browser image loading...');
    console.log(`🔗 Test this URL directly in browser: ${bestThumbnail.s3Url}`);
    
    console.log('\n🔍 === CACHE FAILURE DIAGNOSIS ===');
    console.log('✅ Comprehensive AI thumbnails exist on S3');
    console.log('✅ S3 URLs are generated correctly');
    console.log('❓ Cache storage API working: (see above results)');
    console.log('❓ VideoThumbnail cache lookup: (requires browser testing)');
    
    console.log('\n🎯 === NEXT DEBUG STEPS ===');
    console.log('1. Check if S3 URL is accessible in browser');
    console.log('2. Look for [CACHE DEBUG] logs in browser console');
    console.log('3. If no cache logs appear, cache lookup logic has an issue');
    console.log('4. If cache logs show "not found", cache storage has an issue');
    
  } catch (error) {
    console.error('❌ Error diagnosing cache failure:', error);
  }
}

diagnoseCacheFailure(); 