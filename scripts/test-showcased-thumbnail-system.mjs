// Comprehensive test script for the showcased thumbnail system
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

console.log('🧪 === SHOWCASED THUMBNAIL SYSTEM TEST ===');
console.log('This will test the complete flow from generation to display\n');

async function runTest() {
  try {
    // STEP 1: Check initial state
    console.log('📋 STEP 1: Checking initial system state...');
    
    const initialCheck = await fetch(`${BASE_URL}/api/showcased-thumbnails`);
    const initialData = await initialCheck.json();
    
    console.log(`   Initial showcased thumbnails: ${initialData.showcasedThumbnails?.length || 0}`);
    
    // STEP 2: Check if comprehensive thumbnails exist (fallback system)
    console.log('\n📋 STEP 2: Checking comprehensive thumbnail fallback...');
    
    const comprehensiveCheck = await fetch(`${BASE_URL}/api/admin/comprehensive-thumbnails`);
    const comprehensiveData = await comprehensiveCheck.json();
    
    console.log(`   Comprehensive thumbnails available: ${comprehensiveData.clickableResults?.length || 0}`);
    
    if (comprehensiveData.clickableResults?.length > 0) {
      console.log('   📊 Comprehensive thumbnails found - fallback system working');
      comprehensiveData.clickableResults.forEach((video, index) => {
        console.log(`      Video ${index + 1}: ${video.videoKey.substring(0, 40)}... (${video.options?.length || 0} options)`);
      });
    }
    
    // STEP 3: Test video URL availability
    console.log('\n📋 STEP 3: Testing video URL availability...');
    
    const showcasedVideos = [
      's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
      's3-_Private__Google_Meet_Call_2025_07_15_10_31_CDT',
      's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT'
    ];
    
    const videoAvailability = {};
    
    for (const videoKey of showcasedVideos) {
      try {
        const urlResponse = await fetch(`${BASE_URL}/api/video/${videoKey}/url`);
        if (urlResponse.ok) {
          const urlData = await urlResponse.json();
          videoAvailability[videoKey] = {
            available: true,
            url: urlData.url?.substring(0, 50) + '...'
          };
          console.log(`   ✅ ${videoKey.substring(0, 40)}... - URL available`);
        } else {
          videoAvailability[videoKey] = { available: false, error: urlResponse.status };
          console.log(`   ❌ ${videoKey.substring(0, 40)}... - URL failed (${urlResponse.status})`);
        }
      } catch (error) {
        videoAvailability[videoKey] = { available: false, error: error.message };
        console.log(`   ❌ ${videoKey.substring(0, 40)}... - Error: ${error.message}`);
      }
    }
    
    // STEP 4: Test the thumbnail display endpoint
    console.log('\n📋 STEP 4: Testing individual thumbnail lookup...');
    
    for (const videoKey of showcasedVideos) {
      // Test the specific video thumbnail lookup that the components use
      const thumbnailCheck = await fetch(`${BASE_URL}/api/showcased-thumbnails?videoKey=${videoKey}`);
      
      if (thumbnailCheck.ok) {
        const thumbnailData = await thumbnailCheck.json();
        if (thumbnailData.success && thumbnailData.thumbnails) {
          console.log(`   🏆 ${videoKey.substring(0, 40)}... - Has showcased thumbnails (${thumbnailData.thumbnails.options?.length || 0} options)`);
        } else {
          console.log(`   ⚠️ ${videoKey.substring(0, 40)}... - No showcased thumbnails found`);
        }
      } else {
        console.log(`   ❌ ${videoKey.substring(0, 40)}... - API error (${thumbnailCheck.status})`);
      }
    }
    
    // STEP 5: Check what the actual leadership page would see
    console.log('\n📋 STEP 5: Testing leadership video API...');
    
    const leadershipResponse = await fetch(`${BASE_URL}/api/leadership-videos`);
    if (leadershipResponse.ok) {
      const leadershipData = await leadershipResponse.json();
      const availableVideos = leadershipData.videos?.filter(v => v.videoAvailable) || [];
      
      console.log(`   📊 Leadership videos available: ${availableVideos.length}`);
      
      showcasedVideos.forEach(videoKey => {
        const foundInLeadership = availableVideos.find(v => v.id === videoKey);
        if (foundInLeadership) {
          console.log(`   ✅ ${videoKey.substring(0, 40)}... - Found in leadership videos`);
        } else {
          console.log(`   ⚠️ ${videoKey.substring(0, 40)}... - NOT found in leadership videos`);
        }
      });
    }
    
    // STEP 6: Summary and recommendations
    console.log('\n🎯 === TEST SUMMARY ===');
    
    const allVideosHaveUrls = showcasedVideos.every(key => videoAvailability[key]?.available);
    const hasShowcasedThumbnails = initialData.showcasedThumbnails?.length > 0;
    const hasComprehensiveFallback = comprehensiveData.clickableResults?.length > 0;
    
    console.log(`   Video URLs available: ${allVideosHaveUrls ? '✅ YES' : '❌ NO'}`);
    console.log(`   Showcased thumbnails generated: ${hasShowcasedThumbnails ? '✅ YES' : '❌ NO'}`);
    console.log(`   Comprehensive fallback working: ${hasComprehensiveFallback ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📋 === RECOMMENDATIONS ===');
    
    if (!hasShowcasedThumbnails) {
      console.log('🚨 ISSUE: No showcased thumbnails found!');
      console.log('   💡 SOLUTION: Go to /admin/thumbnails and click "Generate All Thumbnails"');
      console.log('   💡 This will create 10 AI-analyzed options per video');
      console.log('   💡 The system will auto-select the highest scoring option');
    } else {
      console.log('✅ Showcased thumbnails are properly generated and stored');
    }
    
    if (!allVideosHaveUrls) {
      console.log('🚨 ISSUE: Some videos don\'t have accessible URLs');
      console.log('   💡 SOLUTION: Check AWS S3 credentials and video file existence');
    }
    
    if (!hasComprehensiveFallback && !hasShowcasedThumbnails) {
      console.log('🚨 CRITICAL: No thumbnails available in any system!');
      console.log('   💡 SOLUTION: Generate thumbnails using the admin interface');
    }
    
    console.log('\n🎬 === NEXT STEPS ===');
    if (!hasShowcasedThumbnails) {
      console.log('1. 🌐 Open: http://localhost:3001/admin/thumbnails');
      console.log('2. 🎨 Click: "Generate All Thumbnails" in the Showcased Video Thumbnails section');
      console.log('3. ⏱️ Wait: ~2-3 minutes for AI analysis of all options');
      console.log('4. 🎯 Select: Choose your preferred thumbnails if needed');
      console.log('5. 🔄 Refresh: http://localhost:3001/leadership to see the new thumbnails');
    } else {
      console.log('1. 🔄 Refresh: http://localhost:3001/leadership');
      console.log('2. 🎉 Enjoy: Your AI-generated showcased thumbnails should be visible!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest(); 