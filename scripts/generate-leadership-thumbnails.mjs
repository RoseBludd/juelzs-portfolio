#!/usr/bin/env node

/**
 * Generate comprehensive AI thumbnails for the 7 leadership videos displayed on the leadership page
 * This targets the specific videos from getLeadershipVideosWithAnalysis() instead of all meetings
 */

import fetch from 'node-fetch';

console.log('🚀 === LEADERSHIP VIDEO THUMBNAIL GENERATION ===');
console.log('🎯 Targeting the 7 specific videos displayed on the leadership page');

async function getLeadershipVideos() {
  try {
    console.log('📊 Fetching leadership videos from portfolio service...');
    
    // Use the new dedicated leadership videos API
    const response = await fetch('http://localhost:3000/api/leadership-videos');
    if (!response.ok) {
      throw new Error(`Leadership videos API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API error: ${data.error}`);
    }
    
    console.log(`📊 API returned ${data.count} leadership videos`);
    
    // Filter to only include videos that have video URLs available
    const availableVideos = data.videos.filter(video => video.videoAvailable);
    
    console.log(`🎯 Found ${availableVideos.length} videos with video URLs available:`);
    availableVideos.forEach((video, i) => {
      const rating = video.analysis?.overallRating || 'N/A';
      console.log(`  ${i + 1}. ${video.title} (${video.id}) - Rating: ${rating}/10`);
    });
    
    return availableVideos;
    
  } catch (error) {
    console.error('❌ Error fetching leadership videos:', error);
    throw error;
  }
}

async function generateThumbnails(videos) {
  try {
    console.log('\n🤖 === STARTING COMPREHENSIVE AI GENERATION ===');
    console.log(`📹 Processing ${videos.length} leadership videos...`);
    
    const videoKeys = videos.map(v => v.id);
    const contexts = videos.map(v => v.context);
    
    console.log('📡 Calling comprehensive thumbnails API...');
    const response = await fetch('http://localhost:3000/api/admin/comprehensive-thumbnails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoKeys, contexts })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    console.log('\n✅ === GENERATION COMPLETE ===');
    console.log(`🎬 Videos Processed: ${result.totalVideos}`);
    console.log(`🖼️ Total Options Generated: ${result.totalOptions}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error generating thumbnails:', error);
    throw error;
  }
}

async function displayResults() {
  try {
    console.log('\n📋 === FETCHING CLICKABLE RESULTS ===');
    
    const response = await fetch('http://localhost:3000/api/admin/comprehensive-thumbnails');
    if (!response.ok) {
      throw new Error(`Results API failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n🎛️ === ADMIN SELECTION INTERFACE ===');
    console.log('📋 SELECTION COMMANDS:');
    console.log('   Use these exact commands to select your preferred thumbnails:');
    
    data.clickableResults.forEach((video, i) => {
      const marker = video.options.some(opt => opt.isRecommended) ? '⭐' : '  ';
      console.log(`   🎬 VIDEO ${i + 1}: ${video.videoKey.substring(0, 40)}...`);
      
      video.options.forEach((option, j) => {
        const isRec = option.isRecommended ? '⭐' : '  ';
        console.log(`   ${isRec} setThumbnail(${i + 1}, ${j + 1}) (Score: ${option.combinedScore.toFixed(1)})`);
      });
    });
    
    console.log('\n🔗 === CLICKABLE THUMBNAIL URLS ===');
    data.clickableResults.forEach((video, i) => {
      console.log(`\n🎬 VIDEO ${i + 1}: ${video.videoKey}`);
      console.log(`🏆 Best Score: ${video.bestScore.toFixed(1)}/100`);
      console.log(`📊 Total Options: ${video.totalCandidates}`);
      
      video.options.forEach((option, j) => {
        const marker = option.isRecommended ? '⭐ RECOMMENDED' : '';
        console.log(`\n${j + 1}. OPTION ${j + 1} ${marker}`);
        console.log(`   🔗 PREVIEW: ${option.s3Url}`);
        console.log(`   📊 Scores: Combined:${option.combinedScore.toFixed(1)} (AI:${option.aiScore || 'N/A'} + Pixel:${option.pixelScore.toFixed(1)})`);
        console.log(`   ⏱️  Seek: ${option.seekTime}s | 📁 Size: ${option.fileSize}KB`);
        if (option.aiInsight) {
          console.log(`   💡 AI: "${option.aiInsight}"`);
        }
        if (option.aiImprovements) {
          console.log(`   📝 Improve: "${option.aiImprovements}"`);
        }
        console.log(`   🎯 SELECT: ${option.selectionCommand}`);
      });
    });
    
    console.log('\n🎉 === COMPREHENSIVE AI GENERATION COMPLETE ===');
    console.log('📊 FINAL SUMMARY:');
    console.log(`   ✅ Videos Processed: ${data.totalVideos}`);
    console.log(`   ✅ Options Generated: ${data.totalOptions}`);
    console.log('   ✅ AI Analysis: Complete for all options');
    console.log('   ✅ Clickable URLs: Ready for preview');
    console.log('   ✅ Selection Interface: Active and ready');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. 🔍 Click through the URLs above to preview each option');
    console.log('   2. 📊 Review AI insights and scores for each thumbnail');
    console.log('   3. ⭐ Note which options are AI-recommended');
    console.log('   4. 🎯 Use selection commands to choose your favorites');
    console.log('   5. 💾 Selected thumbnails will be set as primary for each video');
    
  } catch (error) {
    console.error('❌ Error displaying results:', error);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Get the specific leadership videos
    const videos = await getLeadershipVideos();
    
    if (videos.length === 0) {
      console.log('❌ No leadership videos found with video URLs!');
      console.log('💡 This means either:');
      console.log('   - No videos are displayed on the leadership page');
      console.log('   - Videos exist but have no video URLs available');
      console.log('   - There was an issue loading the videos from the portfolio service');
      return;
    }
    
    // Step 2: Generate thumbnails for these specific videos
    await generateThumbnails(videos);
    
    // Step 3: Display clickable results
    await displayResults();
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main(); 