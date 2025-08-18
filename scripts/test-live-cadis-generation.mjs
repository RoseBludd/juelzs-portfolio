#!/usr/bin/env node

/**
 * Test the actual CADIS Generate Insights API
 * Shows what the real system produces
 */

import fetch from 'node-fetch';

async function testLiveCADISGeneration() {
  console.log('🧠 Testing LIVE CADIS Generate Insights API\n');
  
  try {
    console.log('🚀 Calling /api/admin/cadis-journal/generate...');
    
    const response = await fetch('http://localhost:3000/api/admin/cadis-journal/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, this would include admin auth
      }
    });
    
    if (!response.ok) {
      console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Generated: ${data.generated} insights`);
    
    if (data.insights) {
      console.log('\n🧠 Generated Insights:');
      data.insights.forEach((insight, index) => {
        console.log(`   ${index + 1}. ${insight.title}`);
        console.log(`      Category: ${insight.category}`);
        console.log(`      Confidence: ${insight.confidence}%`);
        console.log(`      Impact: ${insight.impact}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Live API test failed:', error);
    return false;
  }
}

testLiveCADISGeneration().then(success => {
  console.log(`\n${success ? '✅ LIVE CADIS API TEST PASSED' : '❌ LIVE CADIS API TEST FAILED'}`);
}).catch(error => {
  console.error('Live test crashed:', error);
});
