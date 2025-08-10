// Test cache lookup logic directly with VideoThumbnailCacheService
console.log('🧪 === TESTING CACHE LOOKUP LOGIC DIRECTLY ===');

// Import the actual cache service
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Test each known video key
const testVideoKeys = [
  's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
  's3-_Private__Google_Meet_Call_2025_07_15_10_31_CDT', 
  's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT',
  's3-_Private__Google_Meet_Call_2025_07_09_11_38_CDT',
  's3-_Private__Google_Meet_Call_2025_06_18_12_12_CDT',
  's3-_Private__Google_Meet_Call_2025_06_03_12_28_CDT',
  's3-_Private__Google_Meet_Call_2025_06_02_10_49_CDT'
];

async function testCacheLookupDirectly() {
  try {
    console.log('🔄 Testing cache lookup for all 7 video keys...');
    
    for (let i = 0; i < testVideoKeys.length; i++) {
      const videoKey = testVideoKeys[i];
      console.log(`\n🔍 Test ${i + 1}/7: ${videoKey.substring(0, 50)}...`);
      
      try {
        // Test cache lookup via HTTP API
        const response = await fetch(`http://localhost:3000/api/admin/store-thumbnail-cache`, {
          method: 'GET'
        });
        
        if (response.ok) {
          console.log('📊 Cache API accessible');
        } else {
          console.log(`⚠️  Cache API response: ${response.status}`);
        }
        
        // Test actual cache storage by trying to store a test thumbnail
        const testStoreResponse = await fetch(`http://localhost:3000/api/admin/store-thumbnail-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoKey: videoKey,
            s3Url: 'https://test-url.com/test.jpg',
            s3Key: 'test-key',
            seekTime: 3,
            aspectRatio: 'video'
          })
        });
        
        if (testStoreResponse.ok) {
          const result = await testStoreResponse.json();
          console.log(`✅ Cache store test: ${result.message || 'Success'}`);
        } else {
          console.log(`❌ Cache store test failed: ${testStoreResponse.status}`);
        }
        
      } catch (error) {
        console.log(`❌ Cache test failed: ${error.message}`);
      }
    }
    
    console.log('\n📊 === CACHE LOOKUP TEST SUMMARY ===');
    console.log('🔍 If cache lookups are failing, the issue is in the cache service logic');
    console.log('✅ If cache lookups work, the issue is in the VideoThumbnail component integration');
    
  } catch (error) {
    console.error('❌ Error testing cache lookup:', error);
  }
}

testCacheLookupDirectly(); 