// Generate real showcased thumbnails using existing comprehensive API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

console.log('🚀 === SIMPLE REAL SHOWCASED THUMBNAIL GENERATION ===');
console.log('This will use the existing comprehensive thumbnails API to generate real thumbnails\n');

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

async function generateRealShowcasedThumbnails() {
  try {
    console.log('📋 STEP 1: Generating comprehensive thumbnails for all videos...');
    
    // Generate comprehensive thumbnails first
    const comprehensiveResponse = await fetch(`${BASE_URL}/api/admin/comprehensive-thumbnails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoKeys: showcasedVideos,
        contexts: showcasedVideos.map(() => 'Professional Leadership Meeting')
      })
    });
    
    if (!comprehensiveResponse.ok) {
      throw new Error('Failed to generate comprehensive thumbnails');
    }
    
    const comprehensiveResult = await comprehensiveResponse.json();
    console.log(`✅ Generated comprehensive thumbnails for ${comprehensiveResult.processedVideos || 0} videos`);
    
    console.log('\n📋 STEP 2: Retrieving generated comprehensive thumbnails...');
    
    // Get the generated comprehensive thumbnails
    const getComprehensiveResponse = await fetch(`${BASE_URL}/api/admin/comprehensive-thumbnails`);
    if (!getComprehensiveResponse.ok) {
      throw new Error('Failed to retrieve comprehensive thumbnails');
    }
    
    const comprehensiveData = await getComprehensiveResponse.json();
    console.log(`📊 Found ${comprehensiveData.clickableResults?.length || 0} comprehensive thumbnail sets`);
    
    if (!comprehensiveData.clickableResults?.length) {
      throw new Error('No comprehensive thumbnails found');
    }
    
    console.log('\n📋 STEP 3: Converting to showcased thumbnail format...');
    
    let convertedCount = 0;
    
    for (const videoData of comprehensiveData.clickableResults) {
      if (!showcasedVideos.includes(videoData.videoKey)) {
        console.log(`   ⏭️ Skipping ${videoData.videoKey} (not in showcased list)`);
        continue;
      }
      
      if (!videoData.options?.length) {
        console.log(`   ⚠️ Skipping ${videoData.videoKey} (no options available)`);
        continue;
      }
      
      console.log(`   🔄 Converting ${videoData.videoKey.substring(0, 40)}... (${videoData.options.length} options)`);
      
      // Convert comprehensive thumbnail options to showcased format
      const showcasedOptions = videoData.options.map((option, index) => ({
        optionNumber: index + 1,
        s3Url: option.thumbnailUrl, // Use the existing thumbnail URL
        s3Key: `showcased-thumbnails/${videoData.videoKey}/converted-option-${index + 1}.jpg`,
        seekTime: option.seekTime || (index * 20 + 5), // Use actual seek time or estimate
        aiScore: option.aiScore || 70, // Use actual AI score or default
        pixelScore: option.pixelScore || 60, // Use actual pixel score or default
        combinedScore: option.comprehensiveScore || ((option.aiScore || 70) * 0.6 + (option.pixelScore || 60) * 0.4),
        isRecommended: index === 0, // First one is recommended
        aiInsight: option.aiInsight || 'Professional leadership content with good visual composition',
        aiImprovements: option.aiImprovements || 'Continue maintaining professional presentation style',
        fileSize: 25000, // Estimate 25KB
        generatedAt: new Date()
      }));
      
      // Store in showcased thumbnail system
      const storeResponse = await fetch(`${BASE_URL}/api/showcased-thumbnails/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoKey: videoData.videoKey,
          videoContext: 'Professional Leadership Meeting',
          options: showcasedOptions
        })
      });
      
      if (storeResponse.ok) {
        const storeResult = await storeResponse.json();
        console.log(`      ✅ Stored ${storeResult.thumbnails?.options?.length || 0} options, selected: ${storeResult.thumbnails?.selectedOption || 1}`);
        convertedCount++;
      } else {
        console.log(`      ❌ Failed to store showcased thumbnails for ${videoData.videoKey}`);
      }
    }
    
    console.log(`\n🎉 Successfully converted ${convertedCount} video sets to showcased thumbnails!`);
    
    console.log('\n📋 STEP 4: Verifying final results...');
    
    // Verify the final results
    const verifyResponse = await fetch(`${BASE_URL}/api/showcased-thumbnails`);
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`✅ Total showcased thumbnails: ${verifyData.showcasedThumbnails?.length || 0}`);
      
      if (verifyData.showcasedThumbnails?.length > 0) {
        console.log('\n📊 Final Results:');
        verifyData.showcasedThumbnails.forEach((video, index) => {
          console.log(`   ${index + 1}. ${video.videoKey.substring(0, 50)}...`);
          console.log(`      ├─ ${video.options.length} options available`);
          
          if (video.options.length > 0) {
            const bestOption = video.options.find(opt => opt.optionNumber === video.selectedOption);
            if (bestOption) {
              console.log(`      ├─ Selected: Option ${video.selectedOption} (Score: ${bestOption.combinedScore.toFixed(1)})`);
              console.log(`      ├─ S3 URL: ${bestOption.s3Url}`);
              console.log(`      └─ Seek Time: ${bestOption.seekTime}s`);
            }
          }
        });
        
        console.log('\n🎯 SUCCESS: Showcased thumbnails are now ready!');
        console.log('✅ You can now check the leadership page to see the thumbnails displaying properly.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure the development server is running on localhost:3001');
    console.log('2. Ensure comprehensive thumbnails API is working');
    console.log('3. Check AWS S3 credentials are properly configured');
  }
}

generateRealShowcasedThumbnails(); 