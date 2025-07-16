#!/usr/bin/env node

import { config } from 'dotenv';
config();

import { chromium } from 'playwright';

const LOCAL_URL = 'http://localhost:3000';
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://juelzs-portfolio-4iflygbt2-juelzs-projects.vercel.app';

// Step 1: Check basic environment and API access
async function checkEnvironmentStatus() {
  console.log('\n🔍 STEP 1: Environment & API Status Check');
  console.log('==========================================');
  
  console.log('🌍 Local Environment Check:');
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`   - AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'Available' : 'Missing'}`);
  console.log(`   - AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Available' : 'Missing'}`);
  console.log(`   - AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'undefined'}`);
  console.log(`   - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Available' : 'Missing'}`);
  
  // Test basic API endpoints
  try {
    console.log('\n🔗 Testing API Endpoints:');
    const response = await fetch(`${LOCAL_URL}/api/test-analysis`);
    console.log(`   - Analysis API: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   - OpenAI Available: ${data.openaiAvailable ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.log(`   - API Test Failed: ${error.message}`);
  }
}

// Step 2: Compare leadership data between environments
async function compareLeadershipData() {
  const browser = await chromium.launch();
  
  try {
    console.log('\n📊 STEP 2: Leadership Data Comparison');
    console.log('=====================================');
    
    // Test local environment
    console.log('\n🏠 Local Environment:');
    const localData = await getLeadershipPageData(browser, LOCAL_URL);
    
    // Test production environment  
    console.log('\n🌐 Production Environment:');
    const prodData = await getLeadershipPageData(browser, PRODUCTION_URL);
    
    // Compare results
    console.log('\n🔍 COMPARISON RESULTS:');
    console.log('======================');
    console.log(`📊 Local Videos: ${localData.videoCount}`);
    console.log(`📊 Production Videos: ${prodData.videoCount}`);
    console.log(`📊 Difference: ${localData.videoCount - prodData.videoCount}`);
    
    if (localData.videos && prodData.videos) {
      console.log('\n📋 Missing Videos in Production:');
      const localVideoIds = localData.videos.map(v => v.id);
      const prodVideoIds = prodData.videos.map(v => v.id);
      const missing = localVideoIds.filter(id => !prodVideoIds.includes(id));
      
      if (missing.length > 0) {
        missing.forEach(id => {
          const video = localData.videos.find(v => v.id === id);
          console.log(`   - ${id}: ${video?.title || 'Unknown'}`);
        });
      } else {
        console.log('   - None (all local videos present in production)');
      }
      
      console.log('\n📋 Extra Videos in Production:');
      const extra = prodVideoIds.filter(id => !localVideoIds.includes(id));
      if (extra.length > 0) {
        extra.forEach(id => {
          const video = prodData.videos.find(v => v.id === id);
          console.log(`   - ${id}: ${video?.title || 'Unknown'}`);
        });
      } else {
        console.log('   - None');
      }
    }
    
  } finally {
    await browser.close();
  }
}

async function getLeadershipPageData(browser, baseUrl) {
  const page = await browser.newPage();
  
  // Enable console logging to capture backend logs
  page.on('console', msg => {
    if (msg.text().includes('📊') || msg.text().includes('✅') || msg.text().includes('❌')) {
      console.log(`   [Browser Console] ${msg.text()}`);
    }
  });
  
  try {
    console.log(`   🔄 Loading: ${baseUrl}/leadership`);
    await page.goto(`${baseUrl}/leadership`, { 
      waitUntil: 'networkidle',
      timeout: 60000 // Longer timeout for production
    });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);
    
    const data = await page.evaluate(() => {
      // Count video cards
      const videoCards = document.querySelectorAll('[class*="Card"]:has(h3)');
      const videos = Array.from(videoCards).map(card => {
        const titleElement = card.querySelector('h3');
        const durationElement = card.querySelector('[class*="text-gray-400"]:contains("•")');
        
        return {
          id: titleElement?.textContent?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
          title: titleElement?.textContent?.trim() || 'Unknown Title',
          hasAnalysis: card.querySelector('[class*="analysis"]') !== null,
          duration: durationElement?.textContent?.split('•')[1]?.trim() || 'Unknown'
        };
      });
      
      return {
        videoCount: videos.length,
        videos: videos,
        hasError: document.querySelector('[class*="error"]') !== null,
        isLoading: document.querySelector('[class*="loading"]') !== null
      };
    });
    
    console.log(`   ✅ Loaded: ${data.videoCount} videos found`);
    if (data.hasError) console.log(`   ⚠️ Error indicator found on page`);
    if (data.isLoading) console.log(`   ⏳ Loading indicator still present`);
    
    return data;
    
  } catch (error) {
    console.log(`   ❌ Failed to load: ${error.message}`);
    return { videoCount: 0, videos: [], hasError: true };
  } finally {
    await page.close();
  }
}

// Step 3: Check S3 analysis cache status
async function checkAnalysisCache() {
  console.log('\n💾 STEP 3: Analysis Cache Investigation');
  console.log('======================================');
  
  const testVideoIds = [
    '_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    '_Private__Google_Meet_Call_2025_07_11_06_58_CDT', 
    '_Private__Google_Meet_Call_2025_07_09_11_38_CDT',
    '_Private__Google_Meet_Call_2025_07_08_09_45_CDT',
    '_Private__Google_Meet_Call_2025_07_03_09_50_CDT'
  ];
  
  console.log('🔍 Checking for cached analysis files...');
  
  for (const videoId of testVideoIds) {
    try {
      console.log(`\n📊 Testing: ${videoId}`);
      
      // Test if video data is accessible
      const urlResponse = await fetch(`${LOCAL_URL}/api/video/s3-${videoId}/url`);
      console.log(`   📹 Video URL: ${urlResponse.status} ${urlResponse.statusText}`);
      
      if (urlResponse.ok) {
        const urlData = await urlResponse.json();
        console.log(`   📝 Title: ${urlData.title || 'Unknown'}`);
        console.log(`   ⏱️ Duration: ${urlData.duration || 'Unknown'}`);
      }
      
      // Test if transcript exists
      const transcriptResponse = await fetch(`${LOCAL_URL}/api/video/s3-${videoId}/transcript`);
      console.log(`   📄 Transcript: ${transcriptResponse.status} ${transcriptResponse.statusText}`);
      
      // Test if recap exists
      const recapResponse = await fetch(`${LOCAL_URL}/api/video/s3-${videoId}/recap`);
      console.log(`   📝 Recap: ${recapResponse.status} ${recapResponse.statusText}`);
      
      // Note: We can't directly check S3 analysis cache without AWS SDK setup in script
      console.log(`   💾 Analysis Cache: Check manually in S3 at meetings/analysis/${videoId}_analysis.json`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Step 4: Test rating threshold impact
async function testRatingThreshold() {
  console.log('\n🎯 STEP 4: Rating Threshold Impact Analysis');
  console.log('===========================================');
  
  console.log('📊 Current logic: Only show videos with analysis rating ≥ 5/10');
  console.log('🔍 This means videos need:');
  console.log('   1. To have completed AI analysis');
  console.log('   2. To score 5 or higher out of 10');
  console.log('   3. Analysis must be cached in S3 for fast loading');
  
  console.log('\n💡 Potential Issues:');
  console.log('   - Production may have fewer cached analyses');
  console.log('   - OpenAI API timeouts preventing new analysis');
  console.log('   - Vercel function timeouts (30s limit)');
  console.log('   - Different analysis results between environments');
  
  console.log('\n🔧 Recommended Tests:');
  console.log('   1. Temporarily lower threshold to 3/10 in production');
  console.log('   2. Enable fallback to show videos without analysis');
  console.log('   3. Check Vercel function logs for timeout errors');
  console.log('   4. Verify OpenAI API access in production environment');
}

// Step 5: Generate action plan
async function generateActionPlan() {
  console.log('\n🚀 STEP 5: Action Plan to Fix Production');
  console.log('=========================================');
  
  console.log('🎯 IMMEDIATE ACTIONS:');
  console.log('1. 🔧 Enable fallback mode temporarily');
  console.log('   - Show videos without analysis requirement');
  console.log('   - Ensure content is visible while debugging');
  
  console.log('\n2. 🔍 Environment verification');
  console.log('   - Confirm all environment variables in Vercel');
  console.log('   - Test OpenAI API access in production');
  console.log('   - Verify S3 credentials and bucket access');
  
  console.log('\n3. 💾 Cache analysis generation');
  console.log('   - Run analysis for all portfolio-relevant videos');
  console.log('   - Store results in S3 for instant loading');
  console.log('   - Use lower threshold (3/10) to show more content');
  
  console.log('\n🔄 LONG-TERM SOLUTIONS:');
  console.log('1. 📊 Progressive enhancement');
  console.log('   - Load videos immediately without analysis');
  console.log('   - Add analysis data progressively in background');
  
  console.log('\n2. ⚡ Performance optimization');
  console.log('   - Pre-generate all analysis during deployment');
  console.log('   - Implement better caching strategy');
  console.log('   - Add timeout handling for analysis generation');
  
  console.log('\n3. 🛡️ Resilience improvements');
  console.log('   - Graceful degradation when OpenAI is unavailable');
  console.log('   - Backup content when analysis fails');
  console.log('   - Better error handling and user feedback');
}

// Main execution
async function runFullDebugFlow() {
  console.log('🚀 COMPREHENSIVE LEADERSHIP DEBUG FLOW');
  console.log('======================================');
  console.log('This will help identify why production shows different videos than local\n');
  
  await checkEnvironmentStatus();
  await compareLeadershipData();
  await checkAnalysisCache();
  await testRatingThreshold();
  await generateActionPlan();
  
  console.log('\n✅ DEBUG FLOW COMPLETE');
  console.log('📋 Next: Review the output above and execute the action plan');
  console.log('🎯 Priority: Ensure production environment variables match local');
}

// Run the debug flow
runFullDebugFlow().catch(console.error); 