// Debug video key mismatch between leadership videos and comprehensive AI cache
import fetch from 'node-fetch';

console.log('🔍 === DEBUGGING VIDEO KEY MISMATCH ===');

async function debugVideoKeyMismatch() {
  try {
    console.log('📋 Step 1: Get leadership video IDs...');
    const videosResponse = await fetch('http://localhost:3000/api/leadership-videos');
    const videosData = await videosResponse.json();
    
    if (!videosData.success) {
      throw new Error('Failed to get leadership videos');
    }
    
    console.log(`✅ Found ${videosData.count} leadership videos`);
    const videoIds = videosData.videos.map(v => ({ id: v.id, title: v.title }));
    
    console.log('\n📋 Leadership Video IDs:');
    videoIds.forEach((v, i) => {
      console.log(`  ${i + 1}. ID: ${v.id}`);
      console.log(`     Title: ${v.title}`);
    });
    
    console.log('\n🤖 Step 2: Get comprehensive AI thumbnail keys...');
    const thumbnailsResponse = await fetch('http://localhost:3000/api/admin/comprehensive-thumbnails');
    const thumbnailsData = await thumbnailsResponse.json();
    
    if (!thumbnailsData.success) {
      throw new Error('Failed to get comprehensive thumbnails');
    }
    
    console.log(`✅ Found thumbnails for ${thumbnailsData.totalVideos} videos`);
    const thumbnailKeys = thumbnailsData.clickableResults.map(v => ({ 
      videoKey: v.videoKey, 
      optionsCount: v.options.length,
      bestScore: Math.max(...v.options.map(opt => opt.combinedScore || 0)).toFixed(1)
    }));
    
    console.log('\n🤖 Comprehensive AI Thumbnail Keys:');
    thumbnailKeys.forEach((t, i) => {
      console.log(`  ${i + 1}. Key: ${t.videoKey}`);
      console.log(`     Options: ${t.optionsCount}, Best Score: ${t.bestScore}`);
    });
    
    console.log('\n🔍 Step 3: Compare Keys...');
    const matches = [];
    const mismatches = [];
    
    videoIds.forEach(video => {
      const match = thumbnailKeys.find(thumb => thumb.videoKey === video.id);
      if (match) {
        matches.push({ video, thumbnail: match });
      } else {
        mismatches.push(video);
      }
    });
    
    console.log(`\n✅ MATCHES (${matches.length}):`);
    matches.forEach((match, i) => {
      console.log(`  ${i + 1}. ✅ ${match.video.id}`);
      console.log(`     Video: ${match.video.title}`);
      console.log(`     Cache: ${match.thumbnail.optionsCount} options, score ${match.thumbnail.bestScore}`);
    });
    
    console.log(`\n❌ MISMATCHES (${mismatches.length}):`);
    mismatches.forEach((mismatch, i) => {
      console.log(`  ${i + 1}. ❌ ${mismatch.id}`);
      console.log(`     Video: ${mismatch.title}`);
      console.log(`     Status: NO CACHE FOUND`);
    });
    
    // Check for cache keys that don't match videos
    const orphanedCache = thumbnailKeys.filter(thumb => 
      !videoIds.some(video => video.id === thumb.videoKey)
    );
    
    console.log(`\n🗑️  ORPHANED CACHE (${orphanedCache.length}):`);
    orphanedCache.forEach((orphan, i) => {
      console.log(`  ${i + 1}. 🗑️  ${orphan.videoKey}`);
      console.log(`     Cache: ${orphan.optionsCount} options, score ${orphan.bestScore}`);
      console.log(`     Status: NO MATCHING VIDEO`);
    });
    
    console.log('\n📊 === SUMMARY ===');
    console.log(`Total Leadership Videos: ${videoIds.length}`);
    console.log(`Total Cached Thumbnails: ${thumbnailKeys.length}`);
    console.log(`✅ Perfect Matches: ${matches.length}`);
    console.log(`❌ Missing Cache: ${mismatches.length}`);
    console.log(`🗑️  Orphaned Cache: ${orphanedCache.length}`);
    
    if (mismatches.length === 0) {
      console.log('\n🎉 ALL VIDEO IDs MATCH CACHE KEYS!');
      console.log('🔍 The issue is likely in the cache lookup logic, not key mismatch.');
    } else {
      console.log('\n⚠️  CACHE KEY MISMATCHES DETECTED!');
      console.log('🔄 Need to fix cache keys or video IDs to match.');
    }
    
  } catch (error) {
    console.error('❌ Error debugging video key mismatch:', error);
  }
}

debugVideoKeyMismatch(); 