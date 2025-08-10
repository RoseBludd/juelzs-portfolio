// Comprehensive diagnostic script for thumbnail generation pipeline
// This will test every step to identify where the failure is occurring

import fetch from 'node-fetch';

console.log('🔍 === SYSTEMATIC THUMBNAIL PIPELINE DEBUGGING ===');
console.log('📊 Testing each step of the thumbnail generation process...\n');

const testVideoKeys = [
  's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT',
  's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
  's3-_Private__Google_Meet_Call_2025_07_15_10_31_CDT'
];

async function testVideoUrlAccess(videoKey) {
  console.log(`🎥 Testing video URL access for: ${videoKey}`);
  
  try {
    const apiUrl = `http://localhost:3000/api/video/${videoKey}/url`;
    console.log(`📡 Fetching: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Got video URL: ${data.url.substring(0, 80)}...`);
      console.log(`📁 File size: ${data.fileSize || 'unknown'}`);
      console.log(`📝 Title: ${data.title || 'unknown'}`);
      
      // Test if the video URL is actually accessible
      try {
        console.log(`🧪 Testing video URL accessibility...`);
        const videoResponse = await fetch(data.url, { method: 'HEAD' });
        console.log(`📊 Video URL status: ${videoResponse.status} ${videoResponse.statusText}`);
        console.log(`📊 Content-Type: ${videoResponse.headers.get('content-type')}`);
        console.log(`📊 Content-Length: ${videoResponse.headers.get('content-length')}`);
        
        return {
          success: true,
          videoUrl: data.url,
          accessible: videoResponse.ok,
          contentType: videoResponse.headers.get('content-type'),
          contentLength: videoResponse.headers.get('content-length')
        };
      } catch (videoError) {
        console.log(`❌ Video URL not accessible: ${videoError.message}`);
        return { success: false, error: 'Video URL not accessible', details: videoError.message };
      }
    } else {
      console.log(`❌ Failed to get video URL: ${response.status}`);
      const errorText = await response.text();
      console.log(`❌ Error details: ${errorText.substring(0, 200)}`);
      return { success: false, error: 'API request failed', details: errorText };
    }
  } catch (error) {
    console.log(`❌ Error testing video URL: ${error.message}`);
    return { success: false, error: 'Request failed', details: error.message };
  }
}

async function testThumbnailCacheStatus() {
  console.log(`💾 Testing thumbnail cache status...`);
  
  try {
    // Clear cache first
    const clearResponse = await fetch('http://localhost:3000/api/admin/clear-thumbnail-cache', {
      method: 'POST'
    });
    
    if (clearResponse.ok) {
      const result = await clearResponse.json();
      console.log(`✅ Cache cleared: ${result.message}`);
      return { success: true, cleared: true };
    } else {
      console.log(`❌ Failed to clear cache: ${clearResponse.status}`);
      return { success: false, error: 'Failed to clear cache' };
    }
  } catch (error) {
    console.log(`❌ Error testing cache: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLeadershipPageLoad() {
  console.log(`📱 Testing leadership page load...`);
  
  try {
    const response = await fetch('http://localhost:3000/leadership');
    console.log(`📊 Leadership page status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`📄 Page length: ${html.length} characters`);
      
      // Check if VideoThumbnail components are present
      const thumbnailMatches = html.match(/VideoThumbnail/g);
      console.log(`🎬 VideoThumbnail components found: ${thumbnailMatches ? thumbnailMatches.length : 0}`);
      
      // Check for video keys in the HTML
      const videoKeyMatches = html.match(/s3-_Private__Google_Meet_Call/g);
      console.log(`🔑 Video keys found: ${videoKeyMatches ? videoKeyMatches.length : 0}`);
      
      return { 
        success: true, 
        pageLength: html.length,
        thumbnailComponents: thumbnailMatches ? thumbnailMatches.length : 0,
        videoKeys: videoKeyMatches ? videoKeyMatches.length : 0
      };
    } else {
      console.log(`❌ Leadership page failed to load: ${response.status}`);
      return { success: false, error: `Page load failed: ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Error loading leadership page: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runCompleteDiagnostic() {
  console.log('🏁 Starting complete diagnostic...\n');
  
  const results = {
    cacheTest: null,
    pageTest: null,
    videoTests: []
  };
  
  // Test 1: Cache status
  console.log('=== STEP 1: CACHE TESTING ===');
  results.cacheTest = await testThumbnailCacheStatus();
  console.log('');
  
  // Test 2: Leadership page
  console.log('=== STEP 2: PAGE LOADING ===');
  results.pageTest = await testLeadershipPageLoad();
  console.log('');
  
  // Test 3: Video URL access
  console.log('=== STEP 3: VIDEO URL TESTING ===');
  for (const videoKey of testVideoKeys) {
    const videoTest = await testVideoUrlAccess(videoKey);
    results.videoTests.push({ videoKey, ...videoTest });
    console.log('');
  }
  
  // Summary
  console.log('📋 === DIAGNOSTIC SUMMARY ===');
  console.log(`💾 Cache clearing: ${results.cacheTest?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`📱 Page loading: ${results.pageTest?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (results.pageTest?.success) {
    console.log(`   - Page length: ${results.pageTest.pageLength} chars`);
    console.log(`   - Thumbnail components: ${results.pageTest.thumbnailComponents}`);
    console.log(`   - Video keys found: ${results.pageTest.videoKeys}`);
  }
  
  console.log(`🎥 Video URL tests:`);
  results.videoTests.forEach(test => {
    console.log(`   - ${test.videoKey}: ${test.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (test.success) {
      console.log(`     • Accessible: ${test.accessible ? '✅' : '❌'}`);
      console.log(`     • Content-Type: ${test.contentType}`);
      console.log(`     • Size: ${test.contentLength} bytes`);
    } else {
      console.log(`     • Error: ${test.error}`);
    }
  });
  
  // Recommendations
  console.log('\n🎯 === RECOMMENDATIONS ===');
  
  const failedVideoTests = results.videoTests.filter(t => !t.success || !t.accessible);
  if (failedVideoTests.length > 0) {
    console.log('❌ VIDEO ACCESS ISSUES DETECTED:');
    console.log('   1. Some video URLs are not accessible');
    console.log('   2. This will cause thumbnail generation to fail');
    console.log('   3. Check AWS S3 permissions and URL generation');
    console.log('   4. Verify video files exist in S3 bucket');
  }
  
  if (!results.pageTest?.success) {
    console.log('❌ PAGE LOADING ISSUES DETECTED:');
    console.log('   1. Leadership page is not loading properly');
    console.log('   2. Check Next.js server status');
    console.log('   3. Check for compilation errors');
  }
  
  if (results.pageTest?.success && results.pageTest.thumbnailComponents === 0) {
    console.log('⚠️  NO THUMBNAIL COMPONENTS DETECTED:');
    console.log('   1. VideoThumbnail components are not rendering');
    console.log('   2. Check React component mounting');
    console.log('   3. Check for JavaScript errors in browser console');
  }
  
  const successfulVideoTests = results.videoTests.filter(t => t.success && t.accessible);
  if (successfulVideoTests.length > 0) {
    console.log('✅ SOME VIDEOS ARE ACCESSIBLE:');
    console.log('   1. Video URLs are working for some videos');
    console.log('   2. Thumbnail generation should work for these');
    console.log('   3. Issue may be in the browser thumbnail component');
    console.log('   4. Check browser console for detailed errors');
  }
  
  console.log('\n📱 NEXT STEPS:');
  console.log('1. Open browser to http://localhost:3000/leadership');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Check Console tab for detailed thumbnail generation logs');
  console.log('4. Look for specific error messages about video loading or canvas operations');
  console.log('5. Check Network tab to see if video requests are being made');
  
  return results;
}

// Run the diagnostic
runCompleteDiagnostic()
  .then(results => {
    console.log('\n🎉 Diagnostic complete! Check the summary above for issues.');
  })
  .catch(error => {
    console.error('❌ Diagnostic failed:', error);
  }); 