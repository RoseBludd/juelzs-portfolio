// Admin script to refresh overall leadership analysis via API
// This script authenticates with the admin system and triggers a fresh analysis

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = 'TheWorldIsYours';

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
    console.log('✅ Admin authentication successful');
    
    return authCookie;
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
    throw error;
  }
}

async function refreshOverallAnalysis(authCookie) {
  console.log('🔄 Triggering overall leadership analysis refresh...');
  
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

async function verifyAnalysisUpdate() {
  console.log('🔍 Verifying updated analysis is available...');
  
  try {
    const response = await fetch(`${BASE_URL}/leadership`);
    
    if (response.ok) {
      console.log('✅ Leadership page accessible - new analysis should be live');
      console.log('🌐 Visit: http://localhost:3000/leadership to see the updated analysis');
    } else {
      console.log('⚠️ Leadership page check failed, but analysis was refreshed');
    }
  } catch (error) {
    console.log('⚠️ Could not verify leadership page, but analysis was refreshed:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting overall leadership analysis refresh process...\n');
    
    // Step 1: Authenticate
    const authCookie = await loginAdmin();
    
    // Step 2: Refresh analysis
    await refreshOverallAnalysis(authCookie);
    
    // Step 3: Verify
    await verifyAnalysisUpdate();
    
    console.log('\n🎉 Overall leadership analysis refresh completed successfully!');
    console.log('📝 The new executive summary should now include:');
    console.log('   • Specific technical achievements (modular architecture expertise)');
    console.log('   • Quantifiable leadership impact (measurable outcomes)');
    console.log('   • Unique differentiators (AI-driven solutions)');
    console.log('   • Strategic decision-making examples');
    console.log('\n💡 Refresh your browser on /leadership to see the updated analysis');
    
  } catch (error) {
    console.error('\n❌ Overall process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 