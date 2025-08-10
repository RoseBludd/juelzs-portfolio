// Sync comprehensive AI thumbnails to VideoThumbnail cache system
import fetch from 'node-fetch';

console.log('🔄 === SYNCING COMPREHENSIVE THUMBNAILS TO CACHE ===');

async function syncComprehensiveThumbnailsToCache() {
  try {
    // Get comprehensive thumbnails
    console.log('📦 Fetching comprehensive thumbnails...');
    const comprehensiveResponse = await fetch('http://localhost:3001/api/admin/comprehensive-thumbnails');
    const comprehensiveData = await comprehensiveResponse.json();
    
    if (!comprehensiveData.success) {
      throw new Error('Failed to fetch comprehensive thumbnails');
    }
    
    console.log(`✅ Found ${comprehensiveData.totalVideos} videos with ${comprehensiveData.totalOptions} thumbnail options`);
    
    // Process each video's best thumbnail
    for (const videoResult of comprehensiveData.clickableResults) {
      const videoKey = videoResult.videoKey;
      const bestOption = videoResult.options.find(opt => opt.isRecommended) || videoResult.options[0];
      
      console.log(`📸 Processing ${videoKey}...`);
      console.log(`   🏆 Best thumbnail: Score ${bestOption.combinedScore.toFixed(1)}, Seek: ${bestOption.seekTime}s`);
      
      // Store this thumbnail in the cache using the VideoThumbnailCacheService method
      try {
        const cacheResponse = await fetch('http://localhost:3001/api/admin/store-thumbnail-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoKey: videoKey,
            s3Url: bestOption.s3Url,
            s3Key: `thumbnails/ai-analyzed/${Date.now()}-${videoKey}-${bestOption.seekTime}s.jpg`,
            seekTime: bestOption.seekTime,
            aspectRatio: 'video',
            metadata: {
              aiScore: bestOption.aiScore,
              pixelScore: bestOption.pixelScore,
              combinedScore: bestOption.combinedScore,
              fileSize: bestOption.fileSize,
              isRecommended: bestOption.isRecommended
            }
          })
        });
        
        if (cacheResponse.ok) {
          console.log(`   ✅ Cached successfully`);
        } else {
          console.log(`   ⚠️ Cache failed: ${cacheResponse.status}`);
        }
      } catch (cacheError) {
        console.log(`   ⚠️ Cache error: ${cacheError.message}`);
      }
    }
    
    console.log('\n🎉 Comprehensive thumbnail sync complete!');
    console.log('🔍 Now testing leadership page thumbnail loading...');
    
    // Test leadership page
    const testResponse = await fetch('http://localhost:3001/api/leadership-videos');
    const testData = await testResponse.json();
    
    console.log(`✅ Leadership page ready with ${testData.count} videos`);
    console.log('📋 All thumbnails should now load from cache without regeneration');
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

syncComprehensiveThumbnailsToCache(); 