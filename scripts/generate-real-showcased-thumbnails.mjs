// Generate real showcased thumbnails using headless browser
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

console.log('🚀 === REAL SHOWCASED THUMBNAIL GENERATION ===');
console.log('This will use the existing UI generator in headless mode to create real thumbnails\n');

// Video keys to process
const showcasedVideos = [
  's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
  's3-_Private__Google_Meet_Call_2025_07_15_10_31_CDT', 
  's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT',
  's3-_Private__Google_Meet_Call_2025_07_09_11_38_CDT',
  's3-_Private__Google_Meet_Call_2025_06_18_12_12_CDT',
  's3-_Private__Google_Meet_Call_2025_06_03_12_28_CDT',
  's3-_Private__Google_Meet_Call_2025_06_02_10_49_CDT'
];

async function generateRealThumbnails() {
  console.log('🌐 Launching headless browser...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the admin page with the generator
    console.log('📄 Loading admin thumbnails page...');
    await page.goto(`${BASE_URL}/admin/thumbnails`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the page to fully load
    await page.waitForSelector('[data-testid="showcased-thumbnail-generator"]', {
      timeout: 10000
    });
    
    console.log('✅ Page loaded, starting thumbnail generation...');
    
    // Execute the generation in the browser context
    const result = await page.evaluate(async () => {
      // Wait for the generator component to be available
      const generator = document.querySelector('[data-testid="showcased-thumbnail-generator"]');
      if (!generator) {
        throw new Error('Generator component not found');
      }
      
      // Find and click the generate button
      const generateButton = generator.querySelector('button[disabled="false"]');
      if (!generateButton) {
        throw new Error('Generate button not found or disabled');
      }
      
      // Click the button to start generation
      generateButton.click();
      
      // Wait for generation to complete by monitoring progress
      return new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
          reject(new Error('Generation timeout after 5 minutes'));
        }, 300000); // 5 minute timeout
        
        // Monitor for completion
        const checkProgress = setInterval(() => {
          const progressElement = generator.querySelector('[data-progress]');
          const progressText = progressElement?.textContent || '';
          
          if (progressText.includes('Generation Complete!') || 
              progressText.includes('All thumbnails generated successfully')) {
            clearInterval(checkProgress);
            clearTimeout(timeoutId);
            resolve({
              success: true,
              message: 'Generation completed successfully'
            });
          } else if (progressText.includes('Error') || progressText.includes('Failed')) {
            clearInterval(checkProgress);
            clearTimeout(timeoutId);
            reject(new Error('Generation failed: ' + progressText));
          }
        }, 2000); // Check every 2 seconds
      });
    });
    
    console.log('🎉 Headless generation result:', result);
    
    // Verify the results
    console.log('\n📋 Verifying generated thumbnails...');
    
    const verifyResponse = await fetch(`${BASE_URL}/api/showcased-thumbnails`);
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`✅ Total showcased thumbnails: ${verifyData.showcasedThumbnails?.length || 0}`);
      
      if (verifyData.showcasedThumbnails?.length > 0) {
        verifyData.showcasedThumbnails.forEach((video, index) => {
          console.log(`   ${index + 1}. ${video.videoKey.substring(0, 40)}... (${video.options.length} options)`);
          if (video.options.length > 0) {
            const bestOption = video.options.find(opt => opt.optionNumber === video.selectedOption);
            console.log(`      Selected: Option ${video.selectedOption} (Score: ${bestOption?.combinedScore || 'N/A'})`);
            console.log(`      S3 URL: ${bestOption?.s3Url?.substring(0, 80)}...`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during generation:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Fallback: Direct server-side generation if headless browser fails
async function fallbackGeneration() {
  console.log('\n🔄 Fallback: Attempting direct server-side generation...');
  console.log('⚠️ This will create basic thumbnails without real video frames');
  
  // Use the comprehensive thumbnails API as fallback
  try {
    const response = await fetch(`${BASE_URL}/api/admin/comprehensive-thumbnails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoKeys: showcasedVideos,
        contexts: showcasedVideos.map(() => 'Professional Leadership Meeting')
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Fallback generation result:', result);
    } else {
      console.log('❌ Fallback generation failed');
    }
  } catch (error) {
    console.error('❌ Fallback error:', error);
  }
}

async function main() {
  try {
    await generateRealThumbnails();
  } catch (error) {
    console.error('❌ Headless generation failed:', error);
    console.log('\n🔄 Trying fallback method...');
    await fallbackGeneration();
  }
}

main(); 