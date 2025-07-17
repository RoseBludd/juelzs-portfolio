// Production script to refresh overall leadership analysis
// This script targets the live production environment

import fetch from 'node-fetch';

// Update this to your production URL
const PRODUCTION_URL = 'https://www.juelzs.com'; // Production URL
const ADMIN_PASSWORD = 'TheWorldIsYours';

async function loginAdmin() {
  console.log('🔐 Authenticating with production admin system...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/admin/login`, {
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

    // Extract the auth cookie from the response
    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('No authentication cookie received');
    }

    // Extract the admin-auth cookie value
    const authCookieMatch = setCookieHeader.match(/admin-auth=([^;]+)/);
    if (!authCookieMatch) {
      throw new Error('Could not extract authentication cookie');
    }

    const authCookie = authCookieMatch[1];
    console.log('✅ Production admin authentication successful');
    
    return authCookie;
  } catch (error) {
    console.error('❌ Production admin login failed:', error.message);
    throw error;
  }
}

async function refreshProductionAnalysis(authCookie) {
  console.log('🔄 Triggering production overall leadership analysis refresh...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/admin/leadership/refresh-overall-analysis`, {
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

    console.log('✅ Production overall leadership analysis refreshed successfully!');
    console.log(`📊 Overall Rating: ${data.analysis.overallRating}/10`);
    console.log(`📊 Sessions Analyzed: ${data.analysis.totalSessionsAnalyzed}`);
    console.log(`📊 Average Rating: ${data.analysis.averageRating}/10`);
    console.log(`📊 Last Updated: ${data.analysis.lastUpdated}`);
    
    return data.analysis;
  } catch (error) {
    console.error('❌ Production analysis refresh failed:', error.message);
    throw error;
  }
}

async function verifyProductionUpdate() {
  console.log('🔍 Verifying production analysis is available...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/leadership`);
    
    if (response.ok) {
      console.log('✅ Production leadership page accessible - new analysis should be live');
      console.log(`🌐 Visit: ${PRODUCTION_URL}/leadership to see the updated analysis`);
    } else {
      console.log('⚠️ Production leadership page check failed, but analysis was refreshed');
    }
  } catch (error) {
    console.log('⚠️ Could not verify production leadership page, but analysis was refreshed:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting production overall leadership analysis refresh...\n');
    console.log(`🎯 Target: ${PRODUCTION_URL}`);
    console.log('⚠️  Make sure this is your correct production URL!\n');
    
    // Step 1: Authenticate
    const authCookie = await loginAdmin();
    
    // Step 2: Refresh analysis
    await refreshProductionAnalysis(authCookie);
    
    // Step 3: Verify
    await verifyProductionUpdate();
    
    console.log('\n🎉 Production overall leadership analysis refresh completed successfully!');
    console.log('📝 The production site should now show the updated executive summary with:');
    console.log('   • Specific technical achievements (modular architecture expertise)');
    console.log('   • Quantifiable leadership impact (measurable outcomes)');
    console.log('   • Unique differentiators (AI-driven solutions)');
    console.log('   • Strategic decision-making examples');
    console.log('\n💡 The changes should be visible immediately on the production site');
    
  } catch (error) {
    console.error('\n❌ Production refresh process failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify the PRODUCTION_URL is correct');
    console.log('2. Ensure the production environment has the admin API endpoints deployed');
    console.log('3. Check that the production environment has the same admin password');
    console.log('4. Verify production has AWS credentials configured for S3 access');
    process.exit(1);
  }
}

// Run the script
main(); 