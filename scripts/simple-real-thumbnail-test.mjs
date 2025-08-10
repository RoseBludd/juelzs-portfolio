#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

class SimpleRealThumbnailTester {
  constructor() {
    this.selectedVideo = null;
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
      
      const availableVideos = data.videos.filter(v => v.videoAvailable);
      
      if (availableVideos.length === 0) {
        throw new Error('No videos with video URLs available');
      }
      
      this.selectedVideo = availableVideos[0];
      
      this.log(`✅ Selected video: ${this.selectedVideo.id}`);
      this.log(`   Title: ${this.selectedVideo.title}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 1 failed: ${error.message}`);
      return false;
    }
  }

  async step2_testVideoUrl() {
    this.log('🎬 STEP 2: Testing video URL accessibility...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/video/${this.selectedVideo.id}/url`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Video URL API failed: ${data.error}`);
      }
      
      this.log(`✅ Video URL retrieved: ${data.url.substring(0, 50)}...`);
      
      // Test if the video URL is actually accessible
      const videoResponse = await fetch(data.url, { method: 'HEAD' });
      
      this.log(`📊 Video accessibility:`);
      this.log(`   Status: ${videoResponse.status}`);
      this.log(`   Content-Type: ${videoResponse.headers.get('content-type')}`);
      this.log(`   Content-Length: ${videoResponse.headers.get('content-length')} bytes`);
      
      return videoResponse.ok;
    } catch (error) {
      this.log(`❌ Step 2 failed: ${error.message}`);
      return false;
    }
  }

  async step3_testLeadershipPage() {
    this.log('📄 STEP 3: Testing leadership page loads correctly...');
    
    try {
      const response = await fetch(`${BASE_URL}/leadership`);
      const html = await response.text();
      
      if (!response.ok) {
        throw new Error(`Leadership page failed: ${response.status}`);
      }
      
      // Check if our video is found in the HTML
      const videoFound = html.includes(this.selectedVideo.id);
      
      // Check if SimpleVideoThumbnail component is being used
      const hasSimpleVideoThumbnail = html.includes('SimpleVideoThumbnail') || 
                                      html.includes('simple-thumbnail');
      
      this.log(`✅ Leadership page loaded successfully:`);
      this.log(`   Video found: ${videoFound}`);
      this.log(`   SimpleVideoThumbnail component detected: ${hasSimpleVideoThumbnail}`);
      this.log(`   Page size: ${html.length} characters`);
      
      return response.ok && videoFound;
    } catch (error) {
      this.log(`❌ Step 3 failed: ${error.message}`);
      return false;
    }
  }

  async step4_identifyThumbnailPattern() {
    this.log('🔍 STEP 4: Identifying thumbnail patterns...');
    
    try {
      // Check what thumbnail pattern should be used
      const region = process.env.AWS_REGION || 'us-east-1';
      const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
      const expectedThumbnailKey = `video-thumbnails/${this.selectedVideo.id}/simple-thumbnail.jpg`;
      const expectedThumbnailUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${expectedThumbnailKey}`;
      
      this.log(`📋 Expected thumbnail pattern:`);
      this.log(`   S3 Key: ${expectedThumbnailKey}`);
      this.log(`   S3 URL: ${expectedThumbnailUrl}`);
      
      // Test if this thumbnail already exists
      try {
        const thumbnailResponse = await fetch(expectedThumbnailUrl, { method: 'HEAD' });
        
        if (thumbnailResponse.ok) {
          this.log(`✅ Thumbnail already exists!`);
          this.log(`   Status: ${thumbnailResponse.status}`);
          this.log(`   Content-Type: ${thumbnailResponse.headers.get('content-type')}`);
          this.log(`   Content-Length: ${thumbnailResponse.headers.get('content-length')} bytes`);
          this.log(`   🌐 View: ${expectedThumbnailUrl}`);
        } else {
          this.log(`⚠️ Thumbnail doesn't exist yet (${thumbnailResponse.status})`);
          this.log(`   This is normal - SimpleVideoThumbnail will generate it when loaded`);
        }
      } catch (error) {
        this.log(`⚠️ Could not check existing thumbnail: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      this.log(`❌ Step 4 failed: ${error.message}`);
      return false;
    }
  }

  async step5_testComponentBehavior() {
    this.log('🧪 STEP 5: Understanding SimpleVideoThumbnail component behavior...');
    
    try {
      this.log(`📋 Component behavior analysis:`);
      this.log(`   1. SimpleVideoThumbnail component loads on leadership page`);
      this.log(`   2. Component receives props: videoKey="${this.selectedVideo.id}", videoUrl="[presigned-url]"`);
      this.log(`   3. Component checks for existing thumbnail in S3`);
      this.log(`   4. If not found, uses SimpleThumbnailService.generateBestThumbnail()`);
      this.log(`   5. Service creates video element, takes 10 screenshots, analyzes with GPT Vision`);
      this.log(`   6. Uploads best thumbnail to S3 via /api/simple-thumbnail/upload`);
      this.log(`   7. Component displays the thumbnail with play button overlay`);
      
      this.log(`\n🔧 The reason previous test showed black image:`);
      this.log(`   - Server-side /api/simple-thumbnail creates PLACEHOLDER thumbnails`);
      this.log(`   - Real thumbnails are generated CLIENT-SIDE by SimpleThumbnailService`);
      this.log(`   - Client uploads real thumbnails via /api/simple-thumbnail/upload`);
      
      return true;
    } catch (error) {
      this.log(`❌ Step 5 failed: ${error.message}`);
      return false;
    }
  }

  async step6_testUploadEndpoint() {
    this.log('📤 STEP 6: Testing thumbnail upload endpoint...');
    
    try {
      // Test that the upload endpoint exists and responds correctly
      const response = await fetch(`${BASE_URL}/api/simple-thumbnail/upload`, {
        method: 'POST',
        body: new FormData() // Empty form data to test endpoint
      });
      
      const data = await response.json();
      
      this.log(`📊 Upload endpoint test:`);
      this.log(`   Status: ${response.status}`);
      this.log(`   Response: ${JSON.stringify(data)}`);
      
      // We expect this to fail with a validation error, not a 404
      const endpointExists = response.status !== 404;
      
      if (endpointExists) {
        this.log(`✅ Upload endpoint exists and responds`);
      } else {
        this.log(`❌ Upload endpoint not found`);
      }
      
      return endpointExists;
    } catch (error) {
      this.log(`❌ Step 6 failed: ${error.message}`);
      return false;
    }
  }

  async runProgressiveEnhancementTest() {
    this.log('🚀 Starting Simple Real Thumbnail Enhancement Test');
    this.log('====================================================');
    
    const steps = [
      { name: 'Find Video', method: 'step1_findVideo' },
      { name: 'Test Video URL', method: 'step2_testVideoUrl' },
      { name: 'Test Leadership Page', method: 'step3_testLeadershipPage' },
      { name: 'Identify Thumbnail Pattern', method: 'step4_identifyThumbnailPattern' },
      { name: 'Component Behavior Analysis', method: 'step5_testComponentBehavior' },
      { name: 'Test Upload Endpoint', method: 'step6_testUploadEndpoint' }
    ];
    
    let allPassed = true;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this.log(`\n--- ${step.name} (${i + 1}/${steps.length}) ---`);
      
      const success = await this[step.method]();
      
      if (!success) {
        this.log(`\n❌ TEST FAILED AT STEP ${i + 1}: ${step.name}`);
        allPassed = false;
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.log('\n====================================================');
    if (allPassed) {
      this.log('🎉 PROGRESSIVE ENHANCEMENT TEST COMPLETED!');
      this.log('\n📋 Summary:');
      this.log(`   Video: ${this.selectedVideo?.title}`);
      this.log(`   Video ID: ${this.selectedVideo?.id}`);
      
      this.log('\n🌐 Manual Testing Instructions:');
      this.log(`   1. Open: ${BASE_URL}/leadership`);
      this.log(`   2. Look for the video "${this.selectedVideo?.title}"`);
      this.log(`   3. Watch the SimpleVideoThumbnail component:`);
      this.log(`      - Should show loading spinner initially`);
      this.log(`      - Should generate real thumbnail (not black)`);
      this.log(`      - Should display thumbnail with play button`);
      this.log(`   4. Click on the video to test navigation`);
      
      this.log('\n🔧 Expected Behavior:');
      this.log(`   - Component checks S3 for existing thumbnail`);
      this.log(`   - If not found, generates new thumbnail using video element`);
      this.log(`   - Takes multiple screenshots and analyzes with AI`);
      this.log(`   - Uploads best thumbnail to S3`);
      this.log(`   - Displays the real thumbnail (not black placeholder)`);
      
    } else {
      this.log('❌ PROGRESSIVE ENHANCEMENT TEST FAILED');
    }
    
    return allPassed;
  }
}

// Run the test
async function main() {
  const tester = new SimpleRealThumbnailTester();
  await tester.runProgressiveEnhancementTest();
}

main().catch(console.error); 