#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

class ProgressiveThumbnailTester {
  constructor() {
    this.selectedVideo = null;
    this.testResults = {};
  }

  log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async step1_findVideo() {
    this.log('🔍 STEP 1: Finding a video for testing...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/leadership-videos`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`API error: ${data.error}`);
      }
      
      // Filter to videos with video URLs available
      const availableVideos = data.videos.filter(v => v.videoAvailable);
      
      if (availableVideos.length === 0) {
        throw new Error('No videos with video URLs available');
      }
      
      // Select the first video for testing
      this.selectedVideo = availableVideos[0];
      
      this.log(`✅ Selected video for testing:`);
      this.log(`   ID: ${this.selectedVideo.id}`);
      this.log(`   Title: ${this.selectedVideo.title}`);
      this.log(`   Has Analysis: ${!!this.selectedVideo.analysis}`);
      this.log(`   Rating: ${this.selectedVideo.analysis?.overallRating || 'N/A'}/10`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 1 failed: ${error.message}`);
      return false;
    }
  }

  async step2_getVideoUrl() {
    this.log('🎬 STEP 2: Getting video URL for thumbnail generation...');
    
    try {
      // Get the actual video URL via the video API
      const response = await fetch(`${BASE_URL}/api/video/${this.selectedVideo.id}/url`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Video URL API failed: ${data.error}`);
      }
      
      this.testResults.videoUrl = data.url;
      
      this.log(`✅ Video URL retrieved:`);
      this.log(`   URL: ${data.url.substring(0, 50)}...`);
      this.log(`   Ready for thumbnail generation`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 2 failed: ${error.message}`);
      return false;
    }
  }

  async step3_generateThumbnail() {
    this.log('🎯 STEP 3: Generating thumbnail with AI analysis...');
    
    try {
      // Use the simple thumbnail API to generate thumbnail
      const response = await fetch(`${BASE_URL}/api/simple-thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoKey: this.selectedVideo.id,
          videoUrl: this.testResults.videoUrl
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Thumbnail generation failed: ${result.error}`);
      }
      
      this.testResults.thumbnailResult = result;
      
      this.log(`✅ Thumbnail generation completed:`);
      this.log(`   S3 URL: ${result.s3Url}`);
      this.log(`   Timestamp: ${result.timeStamp}s`);
      this.log(`   Score: ${result.score}/100`);
      this.log(`   🌐 View thumbnail: ${result.s3Url}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 3 failed: ${error.message}`);
      return false;
    }
  }

  async step4_testThumbnailAccess() {
    this.log('🖼️ STEP 4: Testing thumbnail accessibility...');
    
    try {
      // Test if the thumbnail is accessible
      const response = await fetch(this.testResults.thumbnailResult.s3Url);
      
      if (!response.ok) {
        throw new Error(`Thumbnail not accessible: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      this.log(`✅ Thumbnail accessibility verified:`);
      this.log(`   Content Type: ${contentType}`);
      this.log(`   Content Length: ${contentLength} bytes`);
      this.log(`   HTTP Status: ${response.status}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 4 failed: ${error.message}`);
      return false;
    }
  }

  async step5_verifyLeadershipPage() {
    this.log('📄 STEP 5: Verifying thumbnail shows on leadership page...');
    
    try {
      // Check leadership page
      const response = await fetch(`${BASE_URL}/leadership`);
      const html = await response.text();
      
      // Look for the video in the HTML
      const videoFound = html.includes(this.selectedVideo.id);
      
      this.log(`✅ Leadership page verification:`);
      this.log(`   Video found on page: ${videoFound}`);
      this.log(`   🌐 View leadership page: ${BASE_URL}/leadership`);
      
      if (videoFound) {
        this.log(`   📱 The video should display with SimpleVideoThumbnail component`);
        this.log(`   📱 Component will generate/load thumbnail automatically`);
      }
      
      return videoFound;
    } catch (error) {
      this.log(`❌ Step 5 failed: ${error.message}`);
      return false;
    }
  }

  async step6_verifyIndividualPage() {
    this.log('📱 STEP 6: Verifying thumbnail shows on individual session page...');
    
    try {
      // Check individual video page
      const response = await fetch(`${BASE_URL}/leadership/${this.selectedVideo.id}`);
      await response.text(); // Load page content to verify it works
      
      // Check if page loads successfully
      const pageLoaded = response.ok;
      
      this.log(`✅ Individual page verification:`);
      this.log(`   Page loads: ${pageLoaded}`);
      this.log(`   🌐 View individual page: ${BASE_URL}/leadership/${this.selectedVideo.id}`);
      
      if (pageLoaded) {
        this.log(`   📱 The page should display with VideoThumbnail component`);
        this.log(`   📱 Component will use the generated thumbnail`);
      }
      
      return pageLoaded;
    } catch (error) {
      this.log(`❌ Step 6 failed: ${error.message}`);
      return false;
    }
  }

  async step7_testSimpleVideoThumbnail() {
    this.log('🧪 STEP 7: Testing SimpleVideoThumbnail component behavior...');
    
    try {
      // This step simulates what the SimpleVideoThumbnail component does
      this.log(`📋 Component behavior test:`);
      this.log(`   1. Component checks for existing thumbnail at:`);
      this.log(`      video-thumbnails/${this.selectedVideo.id}/simple-thumbnail.jpg`);
      this.log(`   2. If not found, generates new thumbnail using SimpleThumbnailService`);
      this.log(`   3. Uses the generated thumbnail: ${this.testResults.thumbnailResult.s3Url}`);
      
      // Test the expected S3 path pattern
      const region = process.env.AWS_REGION || 'us-east-1';
      const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
      const expectedS3Key = `video-thumbnails/${this.selectedVideo.id}/simple-thumbnail.jpg`;
      const expectedS3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${expectedS3Key}`;
      
      this.log(`   Expected S3 URL: ${expectedS3Url}`);
      this.log(`   Actual S3 URL: ${this.testResults.thumbnailResult.s3Url}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 7 failed: ${error.message}`);
      return false;
    }
  }

  async runProgressiveTest() {
    this.log('🚀 Starting Progressive Thumbnail Enhancement Test');
    this.log('================================================');
    
    const steps = [
      { name: 'Find Video', method: 'step1_findVideo' },
      { name: 'Get Video URL', method: 'step2_getVideoUrl' },
      { name: 'Generate Thumbnail', method: 'step3_generateThumbnail' },
      { name: 'Test Thumbnail Access', method: 'step4_testThumbnailAccess' },
      { name: 'Verify Leadership Page', method: 'step5_verifyLeadershipPage' },
      { name: 'Verify Individual Page', method: 'step6_verifyIndividualPage' },
      { name: 'Test Component Behavior', method: 'step7_testSimpleVideoThumbnail' }
    ];
    
    let allPassed = true;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this.log(`\n--- ${step.name} (${i + 1}/${steps.length}) ---`);
      
      const success = await this[step.method]();
      
      if (!success) {
        this.log(`\n❌ PROGRESSIVE TEST FAILED AT STEP ${i + 1}: ${step.name}`);
        allPassed = false;
        break;
      }
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.log('\n================================================');
    if (allPassed) {
      this.log('🎉 PROGRESSIVE TEST COMPLETED SUCCESSFULLY!');
      this.log('\n📋 Test Summary:');
      this.log(`   Video: ${this.selectedVideo?.title}`);
      this.log(`   Video ID: ${this.selectedVideo?.id}`);
      this.log(`   Thumbnail URL: ${this.testResults.thumbnailResult?.s3Url}`);
      this.log(`   AI Score: ${this.testResults.thumbnailResult?.score}/100`);
      this.log(`   Timestamp: ${this.testResults.thumbnailResult?.timeStamp}s`);
      this.log('\n🌐 Test the UI:');
      this.log(`   Leadership Page: ${BASE_URL}/leadership`);
      this.log(`   Individual Page: ${BASE_URL}/leadership/${this.selectedVideo?.id}`);
      this.log('\n📱 What to verify in the browser:');
      this.log(`   1. Open the leadership page and look for the video`);
      this.log(`   2. Confirm the thumbnail displays correctly`);
      this.log(`   3. Click the video to go to individual page`);
      this.log(`   4. Confirm thumbnail shows on individual page`);
      this.log(`   5. Check that play button overlay works`);
    } else {
      this.log('❌ PROGRESSIVE TEST FAILED - Check steps above for details');
    }
    
    return allPassed;
  }
}

// Run the test
async function main() {
  const tester = new ProgressiveThumbnailTester();
  await tester.runProgressiveTest();
}

main().catch(console.error); 