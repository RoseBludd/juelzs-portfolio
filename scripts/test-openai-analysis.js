const { config } = require('dotenv');
config();

// Import our actual analysis service
const path = require('path');
const { default: MeetingAnalysisService } = require('../src/services/meeting-analysis.service.ts');

async function testOpenAIAnalysis() {
  console.log('🔍 Testing OpenAI Analysis Service...\n');
  
  const sampleMeetingContext = {
    id: 'test-meeting-1',
    title: 'Technical Discussion: Database & Testing',
    transcript: `
    Juelzs: Alright everyone, let's dive into the database architecture discussion. I've been reviewing our current setup and I think we need to make some strategic decisions about our testing approach.

    Team Member 1: What specific issues are you seeing with the current database structure?

    Juelzs: Good question. The main issue I'm seeing is that we're not properly isolating our test data from our development data. This is causing inconsistencies in our test results. Let me walk you through what I'm thinking.

    First, we need to implement a proper database seeding strategy. Instead of using mock data, we should create a controlled dataset that mirrors our production scenarios but is completely separate.

    Team Member 2: That makes sense. How do you suggest we handle the migration process?

    Juelzs: Here's my approach - we'll create a three-tier system. Production, staging, and a dedicated testing environment. Each will have its own isolated database instance. The key is ensuring our testing data is realistic but controllable.
    `,
    participants: ['Juelzs', 'Team Member 1', 'Team Member 2'],
    duration: '17:30',
    type: 'technical',
    dateRecorded: '2024-12-12'
  };

  try {
    // Initialize the analysis service
    const analysisService = MeetingAnalysisService.getInstance();
    
    console.log('📊 Testing OpenAI API through our service...');
    console.log(`Meeting: ${sampleMeetingContext.title}`);
    console.log(`Type: ${sampleMeetingContext.type}`);
    console.log(`Duration: ${sampleMeetingContext.duration}\n`);
    
    // Check if API is available
    console.log(`🔑 API Available: ${analysisService.isApiAvailable()}`);
    
    // Run the analysis
    const startTime = Date.now();
    const analysis = await analysisService.analyzeMeetingLeadership(sampleMeetingContext);
    const endTime = Date.now();
    
    if (analysis) {
      console.log('✅ OpenAI Analysis Successful!');
      console.log(`⏱️  Analysis took: ${endTime - startTime}ms`);
      console.log(`📈 Overall Rating: ${analysis.overallRating}/10`);
      console.log(`💪 Strengths: ${analysis.strengths.slice(0, 2).join(', ')}`);
      console.log(`🎯 Areas for Improvement: ${analysis.areasForImprovement.slice(0, 2).join(', ')}`);
      console.log(`📋 Communication - Clarity: ${analysis.communicationStyle.clarity}/10`);
      console.log(`🎖️  Leadership - Technical: ${analysis.leadershipQualities.technicalGuidance}/10`);
      console.log(`📝 Summary: ${analysis.summary.substring(0, 100)}...`);
      
      console.log('\n🎉 Test PASSED - OpenAI analysis is working correctly!');
    } else {
      console.log('❌ Analysis returned null - API may not be configured properly');
      console.log('This means the service is correctly returning null instead of fallback data');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testOpenAIAnalysis().catch(console.error); 