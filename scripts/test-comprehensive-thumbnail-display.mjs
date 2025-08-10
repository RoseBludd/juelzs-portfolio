#!/usr/bin/env node

import { chromium } from 'playwright';
import fetch from 'node-fetch';

console.log('🧪 Testing Comprehensive AI Thumbnail Display...\n');

const BASE_URL = 'http://localhost:3000';

async function testComprehensiveThumbnails() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slow down for visibility
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('COMPREHENSIVE') || msg.text().includes('🎯') || msg.text().includes('🏆')) {
        console.log(`🔍 Browser: ${msg.text()}`);
      }
    });

    // Test 1: Check comprehensive thumbnails API
    console.log('📡 Step 1: Testing comprehensive thumbnails API...');
    try {
      const response = await fetch(`${BASE_URL}/api/admin/comprehensive-thumbnails`);
      const data = await response.json();
      
      if (data.success && data.clickableResults) {
        console.log(`✅ API Success: Found ${data.totalVideos} videos with ${data.totalOptions} thumbnail options`);
        
        // Show first few results
        data.clickableResults.slice(0, 3).forEach((result, idx) => {
          console.log(`   📹 Video ${idx + 1}: ${result.videoKey}`);
          console.log(`       Best Score: ${result.bestScore}`);
          console.log(`       Options: ${result.totalCandidates}`);
          if (result.options && result.options[0]) {
            console.log(`       Best Thumbnail: ${result.options[0].s3Url.substring(0, 60)}...`);
          }
        });
      } else {
        console.log('❌ API Failed or no results found');
        return;
      }
    } catch (error) {
      console.log('❌ API Error:', error.message);
      return;
    }

    // Test 2: Navigate to main leadership page
    console.log('\n📂 Step 2: Testing main leadership page...');
    await page.goto(`${BASE_URL}/leadership`);
    await page.waitForTimeout(3000);
    
    // Check if it loads
    const title = await page.title();
    console.log(`✅ Page loaded: ${title}`);
    
    // Take screenshot of main page
    await page.screenshot({ path: 'leadership-main-page.png', fullPage: true });
    console.log('📸 Screenshot saved: leadership-main-page.png');

    // Test 3: Check Individual Sessions tab
    console.log('\n🎥 Step 3: Testing Individual Sessions tab...');
    const sessionsTab = await page.locator('text=Individual Sessions').first();
    if (await sessionsTab.isVisible()) {
      await sessionsTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked Individual Sessions tab');
    }

    // Test 4: Find and click on a session
    console.log('\n🔍 Step 4: Looking for leadership sessions...');
    await page.waitForTimeout(3000);
    
    // Look for video cards/thumbnails
    const videoCards = await page.locator('[class*="cursor-pointer"], [onclick], a[href*="/leadership/"]').all();
    console.log(`📹 Found ${videoCards.length} potential video cards`);
    
    if (videoCards.length > 0) {
      // Click the first video card
      console.log('🎯 Clicking on first video session...');
      await videoCards[0].click();
      await page.waitForTimeout(3000);
      
      // Check if we're on an individual session page
      const url = page.url();
      console.log(`🔗 Current URL: ${url}`);
      
      if (url.includes('/leadership/') && url !== `${BASE_URL}/leadership`) {
        console.log('✅ Successfully navigated to individual session page');
        
        // Test 5: Check for ModernSessionPage components
        console.log('\n🆕 Step 5: Testing ModernSessionPage components...');
        
        // Look for the new tab structure
        const tabs = await page.locator('[role="tab"], [class*="tab"], button[class*="border-blue"]').all();
        console.log(`🏷️ Found ${tabs.length} tabs`);
        
        // Look for thumbnails
        const thumbnails = await page.locator('img[src*="blob:"], img[src*="s3"], img[src*="amazonaws"]').all();
        console.log(`🖼️ Found ${thumbnails.length} thumbnail images`);
        
        // Check thumbnail sources
        for (let i = 0; i < Math.min(thumbnails.length, 5); i++) {
          const src = await thumbnails[i].getAttribute('src');
          const type = src?.includes('s3') || src?.includes('amazonaws') ? 'S3' : 
                     src?.includes('blob:') ? 'Blob' : 'Other';
          console.log(`   📷 Thumbnail ${i + 1}: ${type} - ${src?.substring(0, 80)}...`);
        }
        
        // Test 6: Check for comprehensive thumbnail debug info
        console.log('\n🔍 Step 6: Checking for comprehensive thumbnail logs...');
        
        // Wait a bit more for any async loading
        await page.waitForTimeout(5000);
        
        // Take screenshot of individual session page
        await page.screenshot({ path: 'individual-session-page.png', fullPage: true });
        console.log('📸 Screenshot saved: individual-session-page.png');
        
        // Test 7: Check browser console for comprehensive thumbnail activity
        console.log('\n💬 Step 7: Monitoring console for comprehensive thumbnail activity...');
        console.log('   (Look for logs above starting with 🔍 Browser:)');
        
        // Force a page refresh to trigger thumbnail loading again
        console.log('\n🔄 Step 8: Refreshing page to trigger thumbnail loading...');
        await page.reload();
        await page.waitForTimeout(10000); // Wait longer to see all logs
        
      } else {
        console.log('❌ Failed to navigate to individual session page');
      }
    } else {
      console.log('❌ No video cards found on the page');
    }

    console.log('\n✅ Test completed! Check the screenshots and console logs above.');
    console.log('🔍 Look for:');
    console.log('   - "🏆 [COMPREHENSIVE SUCCESS]" logs indicating AI thumbnails found');
    console.log('   - S3 URLs in thumbnail sources');
    console.log('   - No "Failed: Image failed to load" errors');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testComprehensiveThumbnails().catch(console.error); 