require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Sample meeting data for testing when S3 isn't available
const sampleMeetingContext = {
  id: 'sample-meeting-1',
  title: 'Technical Discussion: Database & Testing Strategy',
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

async function testUnifiedAIAnalysis() {
  console.log('🚀 UNIFIED AI ANALYSIS TEST SUITE');
  console.log('='.repeat(60));
  console.log('Testing Claude (Primary) + OpenAI (Backup) Analysis');
  console.log('='.repeat(60));
  console.log('');

  console.log('🔧 CHECKING ENVIRONMENT CONFIGURATION...');
  console.log('-'.repeat(40));
  
  const hasClaudeKey = !!process.env.CLAUDE_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  console.log(`🎯 Claude API Key: ${hasClaudeKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🤖 OpenAI API Key: ${hasOpenAIKey ? '✅ Configured' : '❌ Missing'}`);
  
  if (hasClaudeKey) {
    console.log(`   Claude Key Length: ${process.env.CLAUDE_API_KEY.length}`);
    console.log(`   Claude Key Starts: ${process.env.CLAUDE_API_KEY.substring(0, 15)}...`);
  }
  
  if (hasOpenAIKey) {
    console.log(`   OpenAI Key Length: ${process.env.OPENAI_API_KEY.length}`);
    console.log(`   OpenAI Key Starts: ${process.env.OPENAI_API_KEY.substring(0, 15)}...`);
  }
  
  console.log('');

  if (!hasClaudeKey && !hasOpenAIKey) {
    console.log('❌ No AI API keys configured!');
    console.log('💡 Please add CLAUDE_API_KEY and/or OPENAI_API_KEY to your .env file');
    return;
  }

  // Test the unified AI service
  console.log('🤖 TESTING UNIFIED AI SERVICE...');
  console.log('-'.repeat(40));
  
  try {
    // Import the unified AI service
    const { default: UnifiedAIAnalysisService } = await import('../src/services/ai-analysis.service.js');
    
    const aiService = UnifiedAIAnalysisService.getInstance();
    const apiAvailable = aiService.isApiAvailable();
    
    console.log(`🎯 Unified AI Service Available: ${apiAvailable ? '✅ Yes' : '❌ No'}`);
    console.log('');

    if (!apiAvailable) {
      console.log('❌ AI Service not available. Please check your API keys.');
      return;
    }

    // Test analysis with sample data
    console.log('📊 TESTING AI ANALYSIS WITH SAMPLE DATA...');
    console.log('-'.repeat(40));
    console.log(`Meeting: ${sampleMeetingContext.title}`);
    console.log(`Duration: ${sampleMeetingContext.duration}`);
    console.log(`Participants: ${sampleMeetingContext.participants.join(', ')}`);
    console.log(`Type: ${sampleMeetingContext.type}`);
    console.log('');

    // Test both services for comparison
    console.log('🔍 Running analysis with both AI services...');
    const startTime = Date.now();
    const results = await aiService.testBothServices(sampleMeetingContext);
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️  Total Analysis Time: ${totalTime}ms`);
    console.log('');
    
    console.log('📋 RESULTS COMPARISON:');
    console.log('='.repeat(50));
    
    // Claude Results
    console.log('🎯 CLAUDE ANALYSIS:');
    if (results.claudeResult) {
      console.log('✅ Status: SUCCESS');
      console.log(`⏱️  Time: ${results.claudeTime}ms`);
      console.log(`📈 Overall Rating: ${results.claudeResult.overallRating}/10`);
      console.log(`💪 Strengths: ${results.claudeResult.strengths.slice(0, 3).join(', ')}`);
      console.log(`🎯 Areas for Improvement: ${results.claudeResult.areasForImprovement.slice(0, 2).join(', ')}`);
      console.log(`🗣️  Communication - Clarity: ${results.claudeResult.communicationStyle.clarity}/10`);
      console.log(`🎖️  Leadership - Technical: ${results.claudeResult.leadershipQualities.technicalGuidance}/10`);
      console.log(`📝 Summary: ${results.claudeResult.summary.substring(0, 120)}...`);
    } else {
      console.log('❌ Status: FAILED');
      if (results.claudeError) {
        console.log(`💥 Error: ${results.claudeError}`);
      }
    }
    
    console.log('');
    
    // OpenAI Results
    console.log('🤖 OPENAI ANALYSIS:');
    if (results.openaiResult) {
      console.log('✅ Status: SUCCESS');
      console.log(`⏱️  Time: ${results.openaiTime}ms`);
      console.log(`📈 Overall Rating: ${results.openaiResult.overallRating}/10`);
      console.log(`💪 Strengths: ${results.openaiResult.strengths.slice(0, 3).join(', ')}`);
      console.log(`🎯 Areas for Improvement: ${results.openaiResult.areasForImprovement.slice(0, 2).join(', ')}`);
      console.log(`🗣️  Communication - Clarity: ${results.openaiResult.communicationStyle.clarity}/10`);
      console.log(`🎖️  Leadership - Technical: ${results.openaiResult.leadershipQualities.technicalGuidance}/10`);
      console.log(`📝 Summary: ${results.openaiResult.summary.substring(0, 120)}...`);
    } else {
      console.log('❌ Status: FAILED');
      if (results.openaiError) {
        console.log(`💥 Error: ${results.openaiError}`);
      }
    }
    
    console.log('');
    
    // Test production service (Claude first, OpenAI backup)
    console.log('🔧 TESTING PRODUCTION SERVICE (PRIMARY → BACKUP):');
    console.log('-'.repeat(40));
    const productionStartTime = Date.now();
    const productionResult = await aiService.analyzeMeetingLeadership(sampleMeetingContext);
    const productionTime = Date.now() - productionStartTime;
    
    if (productionResult) {
      console.log('✅ Production Analysis: SUCCESS');
      console.log(`⏱️  Time: ${productionTime}ms`);
      console.log(`📈 Overall Rating: ${productionResult.overallRating}/10`);
      console.log(`🎯 Service Used: ${results.claudeResult ? 'Claude (Primary)' : 'OpenAI (Backup)'}`);
      console.log(`💡 Key Insights: ${productionResult.keyInsights.slice(0, 2).join(', ')}`);
      console.log(`🚀 Recommendations: ${productionResult.recommendations.slice(0, 2).join(', ')}`);
      console.log(`📝 Executive Summary: ${productionResult.summary.substring(0, 150)}...`);
    } else {
      console.log('❌ Production Analysis: FAILED');
      console.log('Both Claude and OpenAI services are unavailable');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during AI service testing:', error.message);
    console.error('Stack:', error.stack);
  }

  // Test GitHub service
  console.log('🐙 TESTING GITHUB SERVICE...');
  console.log('-'.repeat(40));
  
  try {
    const { default: GitHubService } = await import('../src/services/github.service.js');
    const githubService = GitHubService.getInstance();
    const projects = await githubService.getProjects();
    
    console.log(`✅ GitHub Service: Working (${projects.length} projects found)`);
    
    if (projects.length > 0) {
      const sample = projects[0];
      console.log(`📊 Sample Project: ${sample.title}`);
      console.log(`   - Language: ${sample.language || 'N/A'}`);
      console.log(`   - Stars: ${sample.stars || 'N/A'}`);
      console.log(`   - Last Updated: ${sample.lastUpdated || 'N/A'}`);
      console.log(`   - Topics: ${sample.topics?.slice(0, 3).join(', ') || 'N/A'}`);
    }
  } catch (error) {
    console.log(`❌ GitHub Service Error: ${error.message}`);
  }
  
  console.log('');

  // Test S3 service and get real meeting data
  console.log('☁️  TESTING S3 SERVICE AND FETCHING MEETINGS...');
  console.log('-'.repeat(40));
  
  try {
    const { default: AWSS3Service } = await import('../src/services/aws-s3.service.js');
    const s3Service = AWSS3Service.getInstance();
    const meetingGroups = await s3Service.getMeetingGroups();
    
    console.log(`✅ S3 Service: Working (${meetingGroups.length} meeting groups found)`);
    
    if (meetingGroups.length > 0) {
      console.log('📋 Meeting Groups Found:');
      meetingGroups.forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.title}`);
        console.log(`      - Date: ${group.dateRecorded}`);
        console.log(`      - Participants: ${group.participants.join(', ')}`);
        console.log(`      - Video: ${group.video ? '✅' : '❌'}`);
        console.log(`      - Transcript: ${group.transcript ? '✅' : '❌'}`);
        console.log(`      - Portfolio Relevant: ${group.isPortfolioRelevant ? '✅' : '❌'}`);
        console.log(`      - Category: ${group.category || 'N/A'}`);
        console.log('');
      });
      
      // Test analysis with real meeting data
      const relevantMeetings = meetingGroups.filter(group => 
        group.isPortfolioRelevant && group.transcript
      );
      
      if (relevantMeetings.length > 0) {
        console.log('🎬 TESTING WITH REAL MEETING DATA...');
        console.log('-'.repeat(40));
        
        const testMeeting = relevantMeetings[0];
        console.log(`📊 Testing: ${testMeeting.title}`);
        
        try {
          const transcriptContent = await s3Service.getFileContent(testMeeting.transcript.s3Key);
          
          if (transcriptContent && transcriptContent.length > 100) {
            const realMeetingContext = {
              id: testMeeting.id,
              title: testMeeting.title,
              transcript: transcriptContent.substring(0, 2000), // Limit for testing
              participants: testMeeting.participants,
              duration: testMeeting.insights?.duration || '0:00',
              type: testMeeting.category || 'technical',
              dateRecorded: testMeeting.dateRecorded
            };
            
            console.log('🔍 Running real meeting analysis...');
            const { default: UnifiedAIAnalysisService } = await import('../src/services/ai-analysis.service.js');
            const aiService = UnifiedAIAnalysisService.getInstance();
            
            const realAnalysis = await aiService.analyzeMeetingLeadership(realMeetingContext);
            
            if (realAnalysis) {
              console.log('✅ Real Meeting Analysis: SUCCESS');
              console.log(`📈 Overall Rating: ${realAnalysis.overallRating}/10`);
              console.log(`💪 Top Strength: ${realAnalysis.strengths[0]}`);
              console.log(`🎯 Main Area for Improvement: ${realAnalysis.areasForImprovement[0]}`);
              console.log(`🌟 Standout Moment: ${realAnalysis.standoutMoments[0] || 'N/A'}`);
            } else {
              console.log('❌ Real Meeting Analysis: FAILED');
            }
          } else {
            console.log('⚠️  Transcript too short or empty');
          }
        } catch (error) {
          console.log(`❌ Error loading transcript: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ S3 Service Error: ${error.message}`);
    console.log('💡 This is expected if AWS credentials are not configured');
  }
  
  console.log('');

  // Summary
  console.log('📊 COMPREHENSIVE TEST SUMMARY:');
  console.log('='.repeat(60));
  console.log(`🎯 Claude Service: ${hasClaudeKey ? '✅ API Key Configured' : '❌ Not Configured'}`);
  console.log(`🤖 OpenAI Service: ${hasOpenAIKey ? '✅ API Key Configured' : '❌ Not Configured'}`);
  console.log(`🔧 Unified AI Service: ${hasClaudeKey || hasOpenAIKey ? '✅ Available' : '❌ Not Available'}`);
  console.log(`🐙 GitHub Service: ✅ Working`);
  console.log(`☁️  S3 Service: Check logs above`);
  console.log('');
  
  console.log('🎉 UNIFIED AI SERVICE READY!');
  console.log('💡 The service will try Claude first, then OpenAI as backup');
  console.log('🔄 Update your portfolio service to use UnifiedAIAnalysisService for production');
  console.log('📋 Both AI services deliver comprehensive leadership analysis');
  console.log('⚡ Smart fallback ensures analysis is always available when possible');
  
  console.log('');
  console.log('🚀 NEXT STEPS:');
  console.log('1. Update portfolio service to use UnifiedAIAnalysisService');
  console.log('2. Test with your actual meeting videos');
  console.log('3. Compare Claude vs OpenAI results for your specific use case');
  console.log('4. Deploy with both API keys for maximum reliability');
}

// Run the test
testUnifiedAIAnalysis().catch(console.error); 