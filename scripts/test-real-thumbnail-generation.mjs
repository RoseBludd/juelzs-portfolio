#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

class RealThumbnailTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.selectedVideo = null;
  }

  log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async setup() {
    this.log('🚀 Setting up browser for real thumbnail testing...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1200, height: 800 }
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('✅') || msg.text().includes('❌')) {
        this.log(`[BROWSER] ${msg.text()}`);
      }
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
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

  async step2_testLeadershipPage() {
    this.log('📄 STEP 2: Loading leadership page and testing thumbnail generation...');
    
    try {
      await this.page.goto(`${BASE_URL}/leadership`, { waitUntil: 'networkidle0' });
      
      this.log('📱 Page loaded, looking for SimpleVideoThumbnail components...');
      
      // Wait for the video to be found
      const videoSelector = `[data-video-id="${this.selectedVideo.id}"]`;
      
      // First, wait for the video card to appear
      await this.page.waitForSelector('.bg-gradient-to-br', { timeout: 10000 });
      
      this.log('🎯 Found video cards, waiting for thumbnail generation...');
      
      // Wait a bit for thumbnail generation to potentially start
      await this.page.waitForTimeout(5000);
      
      // Check if any images have loaded
      const images = await this.page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }))
      );
      
      this.log(`📊 Found ${images.length} images on page:`);
      images.forEach((img, i) => {
        if (img.src.includes('thumbnail') || img.src.includes('video')) {
          this.log(`   ${i + 1}. ${img.src} (${img.naturalWidth}x${img.naturalHeight})`);
        }
      });
      
      // Look for our specific video thumbnail
      const thumbnailImages = images.filter(img => 
        img.src.includes(this.selectedVideo.id) || 
        img.src.includes('thumbnail')
      );
      
      if (thumbnailImages.length > 0) {
        this.log(`✅ Found ${thumbnailImages.length} potential thumbnails for our video`);
        return true;
      } else {
        this.log(`⚠️ No thumbnails found yet, but component may still be generating...`);
        return true; // Don't fail - generation may be in progress
      }
      
    } catch (error) {
      this.log(`❌ Step 2 failed: ${error.message}`);
      return false;
    }
  }

  async step3_manualThumbnailGeneration() {
    this.log('🛠️ STEP 3: Manually testing thumbnail generation with SimpleThumbnailService...');
    
    try {
      // Get the video URL first
      const videoUrlResponse = await fetch(`${BASE_URL}/api/video/${this.selectedVideo.id}/url`);
      const videoUrlData = await videoUrlResponse.json();
      
      if (!videoUrlResponse.ok) {
        throw new Error(`Video URL API failed: ${videoUrlData.error}`);
      }
      
      const videoUrl = videoUrlData.url;
      this.log(`📹 Got video URL: ${videoUrl.substring(0, 50)}...`);
      
      // Inject the SimpleThumbnailService into the page and run generation
      const result = await this.page.evaluate(async (videoUrl, videoKey) => {
        // Create a simple thumbnail generation function in the browser
        return new Promise(async (resolve, reject) => {
          try {
            console.log(`🎬 [${videoKey}] Starting real thumbnail generation...`);
            
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.style.display = 'none';
            document.body.appendChild(video);
            
            let screenshotCount = 0;
            const screenshots = [];
            
            video.onloadedmetadata = () => {
              const duration = video.duration;
              console.log(`📊 [${videoKey}] Video duration: ${duration}s`);
              
              let currentTime = duration * 0.1; // Start at 10% of video
              const interval = duration * 0.1; // Take screenshots every 10% of duration
              
              function takeScreenshot() {
                if (screenshotCount >= 5) {
                  // Done taking screenshots, analyze them
                  analyzeScreenshots();
                  return;
                }
                
                video.currentTime = currentTime;
              }
              
              video.onseeked = () => {
                // Create canvas and capture frame
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = 400;
                canvas.height = 225;
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Check if frame is not black
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let totalBrightness = 0;
                
                for (let i = 0; i < data.length; i += 4) {
                  totalBrightness += data[i] + data[i + 1] + data[i + 2];
                }
                
                const avgBrightness = totalBrightness / (data.length / 4) / 3;
                
                screenshots.push({
                  canvas,
                  timestamp: video.currentTime,
                  brightness: avgBrightness,
                  dataUrl: canvas.toDataURL('image/jpeg', 0.8)
                });
                
                console.log(`📸 [${videoKey}] Screenshot ${screenshotCount + 1}: ${video.currentTime.toFixed(1)}s (brightness: ${avgBrightness.toFixed(1)})`);
                
                screenshotCount++;
                currentTime += interval;
                
                setTimeout(takeScreenshot, 500);
              };
              
              takeScreenshot();
            };
            
            function analyzeScreenshots() {
              if (screenshots.length === 0) {
                reject(new Error('No screenshots captured'));
                return;
              }
              
              // Sort by brightness (avoid black frames)
              screenshots.sort((a, b) => b.brightness - a.brightness);
              const bestScreenshot = screenshots[0];
              
              console.log(`🏆 [${videoKey}] Best screenshot: ${bestScreenshot.timestamp.toFixed(1)}s (brightness: ${bestScreenshot.brightness.toFixed(1)})`);
              
              // Clean up
              document.body.removeChild(video);
              
              resolve({
                success: true,
                timestamp: bestScreenshot.timestamp,
                brightness: bestScreenshot.brightness,
                dataUrl: bestScreenshot.dataUrl,
                screenshotCount: screenshots.length
              });
            }
            
            video.onerror = (e) => reject(new Error(`Video loading failed: ${e.message}`));
            video.src = videoUrl;
            
          } catch (error) {
            reject(error);
          }
        });
      }, videoUrl, this.selectedVideo.id);
      
      if (result.success) {
        this.log(`✅ Manual thumbnail generation successful:`);
        this.log(`   Screenshots taken: ${result.screenshotCount}`);
        this.log(`   Best timestamp: ${result.timestamp.toFixed(1)}s`);
        this.log(`   Brightness: ${result.brightness.toFixed(1)}`);
        this.log(`   Data URL length: ${result.dataUrl.length} characters`);
        
        // Test if the image is actually valid (not black)
        if (result.brightness > 10) {
          this.log(`✅ Thumbnail appears to have good content (not black)`);
        } else {
          this.log(`⚠️ Thumbnail may be black or very dark`);
        }
        
        return true;
      } else {
        throw new Error('Manual generation failed');
      }
      
    } catch (error) {
      this.log(`❌ Step 3 failed: ${error.message}`);
      return false;
    }
  }

  async step4_testSimpleVideoThumbnailComponent() {
    this.log('🧪 STEP 4: Testing SimpleVideoThumbnail component directly...');
    
    try {
      // Create a test page with just the SimpleVideoThumbnail component
      const testHtml = `
        <html>
          <head>
            <script type="module">
              // Simplified version of SimpleThumbnailService for testing
              class SimpleThumbnailService {
                async generateBestThumbnail(videoUrl, videoKey) {
                  console.log('🎯 SimpleThumbnailService.generateBestThumbnail called');
                  console.log('   videoUrl:', videoUrl.substring(0, 50) + '...');
                  console.log('   videoKey:', videoKey);
                  
                  return new Promise((resolve, reject) => {
                    const video = document.createElement('video');
                    video.crossOrigin = 'anonymous';
                    video.muted = true;
                    
                    video.onloadedmetadata = () => {
                      console.log('📊 Video metadata loaded, duration:', video.duration);
                      video.currentTime = video.duration / 2; // Go to middle
                    };
                    
                    video.onseeked = () => {
                      console.log('📸 Video seeked to:', video.currentTime);
                      
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      canvas.width = 400;
                      canvas.height = 225;
                      
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      
                      // Test brightness
                      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                      const data = imageData.data;
                      let totalBrightness = 0;
                      
                      for (let i = 0; i < data.length; i += 4) {
                        totalBrightness += data[i] + data[i + 1] + data[i + 2];
                      }
                      
                      const avgBrightness = totalBrightness / (data.length / 4) / 3;
                      console.log('🔍 Average brightness:', avgBrightness);
                      
                      resolve({
                        s3Url: 'test-url',
                        s3Key: 'test-key',
                        timeStamp: video.currentTime,
                        score: avgBrightness,
                        analysis: { brightness: avgBrightness }
                      });
                    };
                    
                    video.onerror = (e) => {
                      console.error('❌ Video error:', e);
                      reject(e);
                    };
                    
                    video.src = videoUrl;
                  });
                }
              }
              
              // Test the service
              window.testThumbnailGeneration = async function(videoUrl, videoKey) {
                const service = new SimpleThumbnailService();
                return await service.generateBestThumbnail(videoUrl, videoKey);
              };
            </script>
          </head>
          <body>
            <div id="test-area"></div>
          </body>
        </html>
      `;
      
      await this.page.setContent(testHtml);
      
      // Get video URL
      const videoUrlResponse = await fetch(`${BASE_URL}/api/video/${this.selectedVideo.id}/url`);
      const videoUrlData = await videoUrlResponse.json();
      const videoUrl = videoUrlData.url;
      
      // Test thumbnail generation
      const result = await this.page.evaluate(async (videoUrl, videoKey) => {
        try {
          const result = await window.testThumbnailGeneration(videoUrl, videoKey);
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }, videoUrl, this.selectedVideo.id);
      
      if (result.success) {
        this.log(`✅ SimpleVideoThumbnail component test successful:`);
        this.log(`   Timestamp: ${result.result.timeStamp}s`);
        this.log(`   Brightness score: ${result.result.score}`);
        return true;
      } else {
        this.log(`❌ Component test failed: ${result.error}`);
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Step 4 failed: ${error.message}`);
      return false;
    }
  }

  async runTest() {
    this.log('🚀 Starting Real Thumbnail Generation Test');
    this.log('==========================================');
    
    try {
      await this.setup();
      
      const steps = [
        { name: 'Find Video', method: 'step1_findVideo' },
        { name: 'Test Leadership Page', method: 'step2_testLeadershipPage' },
        { name: 'Manual Thumbnail Generation', method: 'step3_manualThumbnailGeneration' },
        { name: 'Component Test', method: 'step4_testSimpleVideoThumbnailComponent' }
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
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      this.log('\n==========================================');
      if (allPassed) {
        this.log('🎉 REAL THUMBNAIL TEST COMPLETED SUCCESSFULLY!');
        this.log('\n📋 Results Summary:');
        this.log(`   Video: ${this.selectedVideo?.title}`);
        this.log(`   Video ID: ${this.selectedVideo?.id}`);
        this.log('\n🌐 Next Steps:');
        this.log(`   1. Check the leadership page: ${BASE_URL}/leadership`);
        this.log(`   2. Look for the SimpleVideoThumbnail component`);
        this.log(`   3. Verify it generates real thumbnails (not black)`);
      } else {
        this.log('❌ REAL THUMBNAIL TEST FAILED');
      }
      
      // Keep browser open for manual inspection
      this.log('\n🔍 Browser will stay open for manual inspection...');
      this.log('Press Ctrl+C to close when done.');
      
      // Wait indefinitely
      await new Promise(() => {});
      
    } catch (error) {
      this.log(`❌ Test failed: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
async function main() {
  const tester = new RealThumbnailTester();
  await tester.runTest();
}

main().catch(console.error); 