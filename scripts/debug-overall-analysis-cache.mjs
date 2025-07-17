// Debug script to check and clear overall leadership analysis cache
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch {
  console.log('No .env file found, using system environment variables');
}

import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = 'TheWorldIsYours';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function loginAdmin() {
  console.log('🔐 Authenticating with admin system...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: ADMIN_PASSWORD
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Login failed: ${data.error}`);
    }

    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('No authentication cookie received');
    }

    const authCookieMatch = setCookieHeader.match(/admin-auth=([^;]+)/);
    if (!authCookieMatch) {
      throw new Error('Could not extract authentication cookie');
    }

    const authCookie = authCookieMatch[1];
    console.log('✅ Admin authentication successful');
    
    return authCookie;
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
    throw error;
  }
}

async function checkCachedAnalysis() {
  console.log('🔍 Checking cached overall analysis in S3...');
  
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      console.log('⚠️ No S3 bucket configured');
      return null;
    }

    const analysisKey = 'overall-leadership-analysis/overall_analysis.json';
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: analysisKey,
    });

    const response = await s3Client.send(command);
    const content = await response.Body.transformToString();
    const analysis = JSON.parse(content);
    
    console.log('✅ Found cached overall analysis:');
    console.log(`📊 Overall Rating: ${analysis.overallRating}/10`);
    console.log(`📊 Sessions Analyzed: ${analysis.dataPoints?.totalSessionsAnalyzed || 'N/A'}`);
    console.log(`📊 Last Updated: ${analysis.dataPoints?.lastUpdated || 'N/A'}`);
    console.log(`📄 Executive Summary (first 100 chars): ${analysis.executiveSummary?.substring(0, 100)}...`);
    
    return analysis;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.log('📄 No cached overall analysis found in S3');
    } else {
      console.error('❌ Error checking cached analysis:', error.message);
    }
    return null;
  }
}

async function clearCachedAnalysis() {
  console.log('🗑️ Clearing cached overall analysis from S3...');
  
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      console.log('⚠️ No S3 bucket configured');
      return false;
    }

    const analysisKey = 'overall-leadership-analysis/overall_analysis.json';
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: analysisKey,
    });

    await s3Client.send(command);
    console.log('✅ Cached overall analysis cleared from S3');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cached analysis:', error.message);
    return false;
  }
}

async function refreshOverallAnalysis(authCookie) {
  console.log('🔄 Triggering fresh overall leadership analysis...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/leadership/refresh-overall-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin-auth=${authCookie}`
      }
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Refresh failed: ${data.error}`);
    }

    console.log('✅ Overall leadership analysis refreshed successfully!');
    console.log(`📊 Overall Rating: ${data.analysis.overallRating}/10`);
    console.log(`📊 Sessions Analyzed: ${data.analysis.totalSessionsAnalyzed}`);
    console.log(`📊 Average Rating: ${data.analysis.averageRating}/10`);
    console.log(`📊 Last Updated: ${data.analysis.lastUpdated}`);
    
    return data.analysis;
  } catch (error) {
    console.error('❌ Overall analysis refresh failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting overall leadership analysis debug process...\n');
    
    // Step 1: Check current cached analysis
    console.log('=== STEP 1: Check Current Cache ===');
    const cachedAnalysis = await checkCachedAnalysis();
    
    // Step 2: Clear cache
    console.log('\n=== STEP 2: Clear Cache ===');
    const cleared = await clearCachedAnalysis();
    
    if (!cleared) {
      console.log('⚠️ Could not clear cache, continuing anyway...');
    }
    
    // Step 3: Authenticate
    console.log('\n=== STEP 3: Authenticate ===');
    const authCookie = await loginAdmin();
    
    // Step 4: Force refresh
    console.log('\n=== STEP 4: Force Refresh ===');
    const newAnalysis = await refreshOverallAnalysis(authCookie);
    
    // Step 5: Verify new cache
    console.log('\n=== STEP 5: Verify New Cache ===');
    await checkCachedAnalysis();
    
    console.log('\n🎉 Debug process completed successfully!');
    console.log('🌐 Visit: http://localhost:3000/leadership to see the updated analysis');
    console.log('💡 If the UI still shows old data, try hard refresh (Ctrl+F5) or incognito mode');
    
  } catch (error) {
    console.error('\n❌ Debug process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 