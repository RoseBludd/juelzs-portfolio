// Clear fake showcased thumbnails storage completely
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

console.log('🧹 === CLEARING FAKE SHOWCASED THUMBNAILS ===');
console.log('This will completely clear fake thumbnail data\n');

async function clearFakeData() {
  try {
    console.log('📋 STEP 1: Checking current showcased thumbnails...');
    
    const currentResponse = await fetch(`${BASE_URL}/api/showcased-thumbnails`);
    if (currentResponse.ok) {
      const currentData = await currentResponse.json();
      console.log(`   Found ${currentData.showcasedThumbnails?.length || 0} showcased video sets`);
    }
    
    console.log('\n🧹 STEP 2: Clearing S3 storage file directly...');
    
    // Initialize S3 client directly
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
    const storageKey = 'showcased-video-thumbnails/thumbnails.json';
    
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: storageKey
      });
      
      await s3Client.send(deleteCommand);
      console.log(`✅ Deleted storage file: ${storageKey}`);
    } catch (error) {
      if (error.Code === 'NoSuchKey') {
        console.log('   ✅ Storage file was already empty/deleted');
      } else {
        console.log(`   ⚠️ Error deleting storage file: ${error.message}`);
      }
    }
    
    console.log('\n📋 STEP 3: Verifying cleared data...');
    
    // Wait a moment for cache to clear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verifyResponse = await fetch(`${BASE_URL}/api/showcased-thumbnails`);
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log(`   Current showcased thumbnails: ${verifyData.showcasedThumbnails?.length || 0}`);
      
      if ((verifyData.showcasedThumbnails?.length || 0) === 0) {
        console.log('   ✅ Successfully cleared all fake data!');
        console.log('\n🚀 Ready for real thumbnail generation!');
      } else {
        console.log('   ⚠️ Some data still exists - may be in memory cache');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearFakeData(); 