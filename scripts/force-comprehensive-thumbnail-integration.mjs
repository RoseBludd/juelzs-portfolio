// Force comprehensive AI thumbnail integration
import fetch from 'node-fetch';

console.log('🔄 === FORCING COMPREHENSIVE THUMBNAIL INTEGRATION ===');

async function forceIntegration() {
  try {
    console.log('🧹 Step 1: Clearing all existing thumbnail cache...');
    try {
      const clearResponse = await fetch('http://localhost:3000/api/admin/clear-thumbnail-cache', {
        method: 'POST'
      });
      if (clearResponse.ok) {
        console.log('✅ Cache cleared successfully');
      } else {
        console.log('⚠️ Cache clear failed or not needed');
      }
    } catch (_) {
      console.log('⚠️ Cache clear endpoint not available, continuing...');
    }

    console.log('\n📦 Step 2: Fetching comprehensive AI thumbnails...');
    const comprehensiveResponse = await fetch('http://localhost:3000/api/admin/comprehensive-thumbnails');
    const comprehensiveData = await comprehensiveResponse.json();
    
    if (!comprehensiveData.success) {
      throw new Error('Failed to fetch comprehensive thumbnails');
    }
    
    console.log(`✅ Found ${comprehensiveData.totalVideos} videos with ${comprehensiveData.totalOptions} AI thumbnails`);
    
    console.log('\n💾 Step 3: Force-caching best thumbnails...');
    for (const videoResult of comprehensiveData.clickableResults) {
      const videoKey = videoResult.videoKey;
      const bestOption = videoResult.options.find(opt => opt.isRecommended) || videoResult.options[0];
      
      console.log(`📸 Force-caching ${videoKey.substring(0, 30)}...`);
      console.log(`   🏆 Score: ${bestOption.combinedScore.toFixed(1)} (AI: ${bestOption.aiScore}, Pixel: ${bestOption.pixelScore.toFixed(1)})`);
      
      try {
        const cacheResponse = await fetch('http://localhost:3000/api/admin/store-thumbnail-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoKey: videoKey,
            s3Url: bestOption.s3Url,
            s3Key: `thumbnails/ai-analyzed/${Date.now()}-${videoKey}-best.jpg`,
            seekTime: bestOption.seekTime,
            aspectRatio: 'video',
            metadata: {
              aiScore: bestOption.aiScore,
              pixelScore: bestOption.pixelScore,
              combinedScore: bestOption.combinedScore,
              isRecommended: bestOption.isRecommended
            }
          })
        });
        
        if (cacheResponse.ok) {
          console.log(`   ✅ Force-cached successfully`);
        } else {
          console.log(`   ⚠️ Force-cache failed: ${cacheResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Force-cache error: ${error.message}`);
      }
    }
    
    console.log('\n🎉 === FORCE INTEGRATION COMPLETE ===');
    console.log('🔹 All comprehensive AI thumbnails are now force-cached');
    console.log('🔹 VideoThumbnail components should now find them immediately');
    console.log('🔹 Visit http://localhost:3000/leadership to test');
    
  } catch (error) {
    console.error('❌ Force integration failed:', error);
  }
}

forceIntegration(); 