// Direct cache access test
import VideoThumbnailCacheService from '../src/services/video-thumbnail-cache.service.js';

console.log('🧪 === TESTING DIRECT CACHE ACCESS ===');

async function testDirectCacheAccess() {
  try {
    const cacheService = VideoThumbnailCacheService.getInstance();
    
    console.log('📋 Step 1: Get leadership video keys...');
    const videoKeys = [
      's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
      's3-_Private__Google_Meet_Call_2025_07_15_10_31_CDT',
      's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT',
      's3-_Private__Google_Meet_Call_2025_07_09_11_38_CDT',
      's3-_Private__Google_Meet_Call_2025_06_18_12_12_CDT',
      's3-_Private__Google_Meet_Call_2025_06_03_12_28_CDT',
      's3-_Private__Google_Meet_Call_2025_06_02_10_49_CDT'
    ];
    
    console.log(`✅ Testing ${videoKeys.length} video keys directly...`);
    
    console.log('\n💾 Step 2: Direct cache lookup for each video...');
    
    for (const videoKey of videoKeys) {
      console.log(`\n🔍 Testing direct cache lookup: ${videoKey.substring(0, 30)}...`);
      
      try {
        const cachedThumbnail = await cacheService.getCachedThumbnail(videoKey);
        
        if (cachedThumbnail) {
          console.log(`   ✅ FOUND! URL: ${cachedThumbnail.thumbnailUrl.substring(0, 50)}...`);
          console.log(`   📊 Generated: ${cachedThumbnail.generatedAt}`);
          console.log(`   ⏱️ Seek time: ${cachedThumbnail.seekTime}s`);
          console.log(`   📐 Aspect: ${cachedThumbnail.aspectRatio}`);
          
          // Check if expired
          const isExpired = cacheService.isThumbnailExpired(cachedThumbnail);
          console.log(`   🕐 Expired: ${isExpired ? '❌ YES' : '✅ NO'}`);
        } else {
          console.log(`   ❌ NOT FOUND in cache`);
        }
        
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
      }
    }
    
    console.log('\n🎯 === DIRECT CACHE TEST SUMMARY ===');
    
  } catch (error) {
    console.error('❌ Direct cache test failed:', error);
  }
}

testDirectCacheAccess(); 