const { config } = require('dotenv');
config();

async function analyzeActualVideo() {
  console.log('🎬 Starting video analysis script...\n');
  
  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/test-analysis', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    console.log('📊 Analysis Result:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(50));
    
    if (result.success) {
      console.log('\n✅ ANALYSIS SUCCESSFUL!');
      console.log(`📈 Overall Rating: ${result.analysis.overallRating}/10`);
      console.log(`💪 Strengths: ${result.analysis.strengths.slice(0, 2).join(', ')}`);
      console.log(`🎯 Areas for Improvement: ${result.analysis.areasForImprovement.slice(0, 2).join(', ')}`);
      console.log(`📋 Communication Clarity: ${result.analysis.communicationStyle.clarity}/10`);
      console.log(`🎖️  Technical Leadership: ${result.analysis.leadershipQualities.technicalGuidance}/10`);
    } else {
      console.log('\n❌ ANALYSIS FAILED');
      console.log(`Reason: ${result.message}`);
      console.log(`API Available: ${result.apiAvailable}`);
      
      if (result.reason) {
        console.log(`Details: ${result.reason}`);
      }
    }
    
    console.log(`\n⏱️  Analysis Time: ${result.analysisTime}ms`);
    console.log(`🕐 Timestamp: ${result.timestamp}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

console.log('🔍 Analyzing video with current OpenAI setup...');
console.log('📝 This will test the real analysis pipeline\n');

analyzeActualVideo().catch(console.error); 