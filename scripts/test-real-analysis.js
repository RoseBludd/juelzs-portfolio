// Test script to run real analysis on actual meeting transcripts
import MeetingAnalysisService from '../src/services/meeting-analysis.service.js';

// Sample real meeting transcript for testing
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

  For the technical implementation, I'm proposing we use database snapshots. Before each test suite, we restore to a known state. This eliminates the flakiness we've been experiencing.

  Team Member 1: What about performance implications?

  Juelzs: Great point. The snapshot approach will add about 2-3 seconds to our test initialization, but it eliminates the 15-20 minutes we currently spend debugging test failures caused by data inconsistency. It's a net positive.

  Team Member 2: How do we handle schema changes during development?

  Juelzs: We'll implement an automated migration system. Every time we make a schema change, it automatically updates all three environments in sequence. We test the migration on our testing environment first, then staging, then production.

  The critical part is documentation. I want every database change to be accompanied by a clear explanation of why the change is necessary and what impact it has on existing data.

  Team Member 1: This sounds like a solid plan. What's our timeline for implementation?

  Juelzs: I'm thinking we roll this out incrementally over the next three weeks. Week one, we set up the testing environment. Week two, we implement the seeding and snapshot system. Week three, we migrate our existing tests and validate everything works.

  The key is not to rush this. Database architecture decisions have long-term implications, so we need to get it right the first time.

  Team Member 2: What if we run into issues during the migration?

  Juelzs: That's exactly why we're doing this incrementally. At each stage, we validate that everything works before moving to the next phase. If we hit any blockers, we can pause, reassess, and adjust our approach.

  I also want to make sure everyone on the team understands the new system. We'll have a knowledge sharing session after each phase to ensure everyone is comfortable with the changes.

  Team Member 1: Sounds good. What do you need from us to get started?

  Juelzs: I need each of you to audit your current test files and identify which ones are most critical. We'll migrate those first to validate our approach. Also, start thinking about edge cases in your respective domains that we should include in our test data.

  The goal is to create a testing environment that gives us confidence in our code while being maintainable long-term.
  `,
  participants: ['Juelzs', 'Team Member 1', 'Team Member 2'],
  duration: '17:30',
  type: 'technical',
  dateRecorded: '2024-12-12'
};

async function testRealAnalysis() {
  console.log('🔍 Starting real leadership analysis test...\n');
  
  try {
    // Initialize the analysis service
    const analysisService = MeetingAnalysisService.getInstance();
    
    console.log('📊 Analyzing meeting transcript with OpenAI...');
    console.log(`Meeting: ${sampleMeetingContext.title}`);
    console.log(`Duration: ${sampleMeetingContext.duration}`);
    console.log(`Participants: ${sampleMeetingContext.participants.join(', ')}\n`);
    
    // Run the real analysis
    const analysis = await analysisService.analyzeMeetingLeadership(sampleMeetingContext);
    
    console.log('✅ Analysis Complete! Results:\n');
    
    // Display results
    console.log(`📈 OVERALL RATING: ${analysis.overallRating}/10\n`);
    
    console.log('💪 STRENGTHS:');
    analysis.strengths.forEach((strength, index) => {
      console.log(`   ${index + 1}. ${strength}`);
    });
    console.log('');
    
    console.log('🎯 AREAS FOR IMPROVEMENT:');
    analysis.areasForImprovement.forEach((area, index) => {
      console.log(`   ${index + 1}. ${area}`);
    });
    console.log('');
    
    console.log('⭐ STANDOUT MOMENTS:');
    analysis.standoutMoments.forEach((moment, index) => {
      console.log(`   ${index + 1}. ${moment}`);
    });
    console.log('');
    
    console.log('📋 COMMUNICATION STYLE SCORES:');
    console.log(`   • Clarity: ${analysis.communicationStyle.clarity}/10`);
    console.log(`   • Engagement: ${analysis.communicationStyle.engagement}/10`);
    console.log(`   • Empathy: ${analysis.communicationStyle.empathy}/10`);
    console.log(`   • Decisiveness: ${analysis.communicationStyle.decisiveness}/10\n`);
    
    console.log('🎖️ LEADERSHIP QUALITIES SCORES:');
    console.log(`   • Technical Guidance: ${analysis.leadershipQualities.technicalGuidance}/10`);
    console.log(`   • Team Building: ${analysis.leadershipQualities.teamBuilding}/10`);
    console.log(`   • Problem Solving: ${analysis.leadershipQualities.problemSolving}/10`);
    console.log(`   • Vision Casting: ${analysis.leadershipQualities.visionCasting}/10\n`);
    
    console.log('💡 KEY INSIGHTS:');
    analysis.keyInsights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });
    console.log('');
    
    console.log('🚀 RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log('');
    
    console.log('📝 EXECUTIVE SUMMARY:');
    console.log(`${analysis.summary}\n`);
    
    console.log('🎉 Real analysis test completed successfully!');
    console.log('💡 This analysis was generated by OpenAI GPT-4 based on the actual meeting transcript.');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Make sure your OpenAI API key is properly set in the .env file');
    }
  }
}

// Run the test
testRealAnalysis(); 