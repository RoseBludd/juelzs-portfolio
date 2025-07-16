import { config } from 'dotenv';
config();

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Simple test without TypeScript compilation
async function testAdminIssues() {
  console.log('🔍 Debugging Admin Issues...\n');

  try {
    // Test 1: Check environment variables
    console.log('🔧 Environment Variables:');
    console.log(`  AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
    console.log(`  AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'NOT SET'}`);
    console.log(`  AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
    console.log(`  AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}\n`);

    // Test 2: Direct S3 connection
    console.log('🪣 Testing S3 Connection...');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
    const meetingsPath = process.env.AWS_S3_MEETINGS_PATH || 'meetings';

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: meetingsPath + '/',
      MaxKeys: 20 // Limit to first 20 for debugging
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found in S3 meetings folder!');
      console.log(`   Bucket: ${bucketName}`);
      console.log(`   Path: ${meetingsPath}/`);
      console.log('   This explains why meetings page is empty.');
      return;
    }

    console.log(`✅ Found ${response.Contents.length} files in S3:`);
    
    const videoFiles = [];
    const transcriptFiles = [];
    const recentFiles = [];
    
    response.Contents.forEach(object => {
      if (!object.Key) return;
      
      const filename = object.Key.split('/').pop() || '';
      const isVideo = filename.toLowerCase().endsWith('.mp4');
      const isTranscript = filename.toLowerCase().endsWith('.txt') && 
                         filename.toLowerCase().includes('transcript');
      
      if (isVideo) videoFiles.push(filename);
      if (isTranscript) transcriptFiles.push(filename);
      
      // Check for recent files (last 7 days)
      const lastModified = object.LastModified;
      if (lastModified) {
        const daysSinceModified = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified <= 7) {
          recentFiles.push({
            filename,
            type: isVideo ? 'video' : isTranscript ? 'transcript' : 'other',
            daysAgo: Math.round(daysSinceModified)
          });
        }
      }
    });

    console.log(`   📹 Video files: ${videoFiles.length}`);
    console.log(`   📝 Transcript files: ${transcriptFiles.length}`);
    console.log(`   🆕 Recent files (last 7 days): ${recentFiles.length}`);
    
    if (recentFiles.length > 0) {
      console.log('\n🆕 Recent uploads:');
      recentFiles.forEach(file => {
        console.log(`   - ${file.filename} (${file.type}, ${file.daysAgo} days ago)`);
      });
    }

    // Test 3: Check recent uploads specifically
    console.log('\n📊 Analysis Summary:');
    if (videoFiles.length === 0) {
      console.log('❌ No video files found - this could explain missing videos');
    } else if (transcriptFiles.length === 0) {
      console.log('❌ No transcript files found - meetings need transcripts for analysis');
    } else {
      console.log('✅ Both videos and transcripts found - investigating analysis filtering...');
      
      // The issue is likely in the filtering logic
      console.log('\n🔍 Likely Issues:');
      console.log('1. MEETINGS EMPTY: Admin page might have a data loading issue');
      console.log('2. MISSING VIDEOS: New videos might have analysis ratings < 7/10');
      console.log('   - Leadership page filters videos with ratings >= 7/10');
      console.log('   - New videos might be rated lower and filtered out');
      
      console.log('\n💡 Solutions:');
      console.log('1. Fix admin meetings page data loading');
      console.log('2. Check analysis ratings for new videos');
      console.log('3. Consider showing more videos or adjusting rating threshold');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    
    if (error.code === 'CredentialsError' || error.code === 'AccessDenied') {
      console.log('\n🔐 AWS Credentials Issue:');
      console.log('- Check your .env file has correct AWS credentials');
      console.log('- Verify AWS IAM permissions for S3 access');
    } else if (error.code === 'NoSuchBucket') {
      console.log('\n🪣 S3 Bucket Issue:');
      console.log('- Check bucket name in .env file');
      console.log('- Verify bucket exists and is accessible');
    }
  }
}

testAdminIssues().then(() => {
  console.log('\n✅ Debug test completed');
}).catch(error => {
  console.error('❌ Debug test failed:', error);
}); 