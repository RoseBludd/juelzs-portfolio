#!/usr/bin/env node

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  highlight: (msg) => console.log(`${colors.bright}🎯 ${msg}${colors.reset}`),
  divider: () => console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`)
};

/**
 * Get all leadership videos from the API
 */
async function getLeadershipVideos() {
  try {
    log.info('Fetching leadership videos...');
    const response = await fetch(`${BASE_URL}/api/leadership-videos`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.videos)) {
      throw new Error('Invalid response format');
    }
    
    return data.videos;
  } catch (error) {
    log.error(`Failed to fetch leadership videos: ${error.message}`);
    return [];
  }
}

/**
 * Generate thumbnail for a specific video
 */
async function generateThumbnailForVideo(video) {
  try {
    log.highlight(`Generating thumbnail for: ${video.title || video.id}`);
    log.info(`Video URL: ${video.videoUrl}`);
    log.info(`Video Key: ${video.id}`);
    
    const response = await fetch(`${BASE_URL}/api/simple-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: video.videoUrl,
        videoKey: video.id
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Thumbnail generation failed');
    }
    
    log.success('Thumbnail generated successfully!');
    log.info(`S3 URL: ${result.s3Url}`);
    log.info(`Time Stamp: ${result.timeStamp}s`);
    log.info(`Combined Score: ${result.score.toFixed(1)}`);
    log.info(`Analysis: ${result.analysis.method} (Vision Score: ${result.analysis.visionScore.toFixed(1)})`);
    
    return result;
    
  } catch (error) {
    log.error(`Failed to generate thumbnail for ${video.id}: ${error.message}`);
    return null;
  }
}

/**
 * Verify thumbnail is accessible
 */
async function verifyThumbnail(thumbnailUrl) {
  try {
    log.info('Verifying thumbnail accessibility...');
    const response = await fetch(thumbnailUrl, { method: 'HEAD' });
    
    if (response.ok) {
      log.success(`Thumbnail is accessible: ${response.status}`);
      log.info(`Content-Type: ${response.headers.get('content-type')}`);
      log.info(`Content-Length: ${response.headers.get('content-length')} bytes`);
      return true;
    } else {
      log.error(`Thumbnail not accessible: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to verify thumbnail: ${error.message}`);
    return false;
  }
}

/**
 * Test a single video
 */
async function testSingleVideo(videoIndex) {
  log.divider();
  log.highlight(`TESTING SINGLE VIDEO THUMBNAIL GENERATION`);
  log.divider();
  
  // Get all videos
  const videos = await getLeadershipVideos();
  
  if (videos.length === 0) {
    log.error('No videos found');
    return false;
  }
  
  log.info(`Found ${videos.length} leadership videos`);
  
  // Show available videos if no index provided
  if (videoIndex === undefined || videoIndex === null) {
    log.info('Available videos:');
    videos.forEach((video, index) => {
      console.log(`  ${colors.cyan}${index + 1}.${colors.reset} ${video.title || video.id} (${video.id})`);
    });
    log.warning('Please specify a video index (1-based) as an argument');
    log.info('Example: node scripts/test-single-showcase-thumbnail.mjs 1');
    return false;
  }
  
  // Validate index
  const arrayIndex = videoIndex - 1;
  if (arrayIndex < 0 || arrayIndex >= videos.length) {
    log.error(`Invalid video index: ${videoIndex}. Must be between 1 and ${videos.length}`);
    return false;
  }
  
  const video = videos[arrayIndex];
  
  log.divider();
  log.highlight(`Testing Video ${videoIndex}: ${video.title || video.id}`);
  log.divider();
  
  // Generate thumbnail
  const result = await generateThumbnailForVideo(video);
  
  if (!result) {
    log.error('Thumbnail generation failed');
    return false;
  }
  
  // Verify thumbnail
  const isAccessible = await verifyThumbnail(result.s3Url);
  
  if (!isAccessible) {
    log.error('Thumbnail verification failed');
    return false;
  }
  
  log.divider();
  log.success('SINGLE VIDEO TEST COMPLETED SUCCESSFULLY!');
  log.info(`Video: ${video.title || video.id}`);
  log.info(`Thumbnail: ${result.s3Url}`);
  log.info(`Score: ${result.score.toFixed(1)}`);
  log.divider();
  
  return true;
}

/**
 * Test all videos systematically
 */
async function testAllVideosSystematically() {
  log.divider();
  log.highlight(`SYSTEMATIC TESTING OF ALL SHOWCASE VIDEOS`);
  log.divider();
  
  const videos = await getLeadershipVideos();
  
  if (videos.length === 0) {
    log.error('No videos found');
    return false;
  }
  
  log.info(`Found ${videos.length} leadership videos to test`);
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const videoNum = i + 1;
    
    log.divider();
    log.highlight(`Processing Video ${videoNum}/${videos.length}: ${video.title || video.id}`);
    
    const result = await generateThumbnailForVideo(video);
    
    if (result) {
      const isAccessible = await verifyThumbnail(result.s3Url);
      
      if (isAccessible) {
        successCount++;
        results.push({
          video: video,
          result: result,
          status: 'success'
        });
        log.success(`✅ Video ${videoNum} completed successfully`);
      } else {
        failureCount++;
        results.push({
          video: video,
          result: result,
          status: 'verification_failed'
        });
        log.error(`❌ Video ${videoNum} thumbnail generation succeeded but verification failed`);
      }
    } else {
      failureCount++;
      results.push({
        video: video,
        result: null,
        status: 'generation_failed'
      });
      log.error(`❌ Video ${videoNum} thumbnail generation failed`);
    }
    
    // Small delay between videos to avoid overwhelming the system
    if (i < videos.length - 1) {
      log.info('Waiting 2 seconds before next video...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  log.divider();
  log.highlight('SYSTEMATIC TEST SUMMARY');
  log.divider();
  
  log.info(`Total Videos: ${videos.length}`);
  log.success(`Successful: ${successCount}`);
  log.error(`Failed: ${failureCount}`);
  log.info(`Success Rate: ${((successCount / videos.length) * 100).toFixed(1)}%`);
  
  // Show failed videos
  const failed = results.filter(r => r.status !== 'success');
  if (failed.length > 0) {
    log.warning(`Failed videos:`);
    failed.forEach((item, index) => {
      console.log(`  ${colors.red}${index + 1}.${colors.reset} ${item.video.title || item.video.id} (${item.status})`);
    });
  }
  
  // Show successful videos
  const successful = results.filter(r => r.status === 'success');
  if (successful.length > 0) {
    log.success(`Successful videos:`);
    successful.forEach((item, index) => {
      console.log(`  ${colors.green}${index + 1}.${colors.reset} ${item.video.title || item.video.id} (Score: ${item.result.score.toFixed(1)})`);
    });
  }
  
  log.divider();
  
  return successCount === videos.length;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log.info('Usage:');
    log.info('  Test single video: node scripts/test-single-showcase-thumbnail.mjs <video_index>');
    log.info('  Test all videos:   node scripts/test-single-showcase-thumbnail.mjs all');
    log.info('');
    await testSingleVideo(); // Show available videos
    return;
  }
  
  if (args[0].toLowerCase() === 'all') {
    await testAllVideosSystematically();
  } else {
    const videoIndex = parseInt(args[0]);
    if (isNaN(videoIndex)) {
      log.error('Video index must be a number');
      return;
    }
    await testSingleVideo(videoIndex);
  }
}

// Run the script
main().catch(error => {
  log.error(`Script error: ${error.message}`);
  process.exit(1);
}); 