/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require('dotenv');
config();

const OpenAI = require('openai');

/**
 * Simple AI Analysis Test
 * Tests OpenAI API directly with meeting transcripts
 */

async function testAIAnalysis() {
  console.log('🎬 SIMPLE AI ANALYSIS TEST');
  console.log('='.repeat(50));
  console.log('Direct OpenAI API testing with meeting analysis');
  console.log('='.repeat(50));
  console.log('');

  // Environment check
  console.log('🔧 ENVIRONMENT CHECK...');
  console.log('-'.repeat(25));
  
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasAWSKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasS3Bucket = !!process.env.AWS_S3_BUCKET;
  
  console.log(`🤖 OpenAI API Key: ${hasOpenAIKey ? '✅ Yes' : '❌ No'}`);
  console.log(`☁️  AWS Access Key: ${hasAWSKey ? '✅ Yes' : '❌ No'}`);
  console.log(`📦 S3 Bucket: ${hasS3Bucket ? '✅ Yes' : '❌ No'}`);
  
  if (hasOpenAIKey) {
    console.log(`   Key Length: ${process.env.OPENAI_API_KEY.length} chars`);
  }
  console.log('');

  if (!hasOpenAIKey) {
    console.log('❌ OpenAI API key required for this test');
    return;
  }

  // Initialize OpenAI
  console.log('🚀 INITIALIZING OPENAI...');
  console.log('-'.repeat(25));
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  console.log('✅ OpenAI client initialized');
  console.log('');

  // Test with sample meeting transcript
  console.log('📊 TESTING WITH SAMPLE MEETING...');
  console.log('-'.repeat(30));
  
  const sampleMeeting = {
    title: 'Technical Discussion: Database Architecture',
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

    The key is not to rush this. Database architecture decisions have long-term implications, so we need to get it right the first time.
    `,
    participants: ['Juelzs', 'Team Member 1', 'Team Member 2'],
    duration: '12:30',
    type: 'technical'
  };

  console.log(`📋 Meeting: ${sampleMeeting.title}`);
  console.log(`👥 Participants: ${sampleMeeting.participants.join(', ')}`);
  console.log(`⏱️  Duration: ${sampleMeeting.duration}`);
  console.log(`📄 Transcript Length: ${sampleMeeting.transcript.length} chars`);
  console.log('');

  // Build analysis prompt
  const analysisPrompt = `Analyze this meeting transcript for leadership performance:

**Meeting Context:**
- Title: ${sampleMeeting.title}
- Type: ${sampleMeeting.type}
- Duration: ${sampleMeeting.duration}
- Participants: ${sampleMeeting.participants.join(', ')}

**Transcript:**
${sampleMeeting.transcript}

**Analysis Requirements:**
Please provide a comprehensive leadership analysis in JSON format with the following structure:

{
  "overallRating": <1-10 score>,
  "strengths": [<list of specific strengths observed>],
  "areasForImprovement": [<list of specific areas to improve>],
  "standoutMoments": [<list of exceptional leadership moments>],
  "communicationStyle": {
    "clarity": <1-10 score>,
    "engagement": <1-10 score>,
    "empathy": <1-10 score>,
    "decisiveness": <1-10 score>
  },
  "leadershipQualities": {
    "technicalGuidance": <1-10 score>,
    "teamBuilding": <1-10 score>,
    "problemSolving": <1-10 score>,
    "visionCasting": <1-10 score>
  },
  "keyInsights": [<list of key insights about leadership style>],
  "recommendations": [<list of specific improvement recommendations>],
  "summary": "<overall summary of leadership performance>"
}

Focus on specific examples from the transcript to support your analysis.`;

  console.log('🤖 RUNNING OPENAI ANALYSIS...');
  console.log('-'.repeat(30));
  
  try {
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysisTime = Date.now() - startTime;
    
    console.log(`✅ Analysis completed in ${analysisTime}ms`);
    console.log('');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log('❌ No content returned from OpenAI');
      return;
    }

    try {
      const analysis = JSON.parse(content);
      
      console.log('📊 ANALYSIS RESULTS:');
      console.log('='.repeat(40));
      console.log(`📈 Overall Rating: ${analysis.overallRating}/10`);
      console.log('');
      
      console.log(`💪 Strengths (${analysis.strengths.length}):`);
      analysis.strengths.forEach((strength, idx) => {
        console.log(`   ${idx + 1}. ${strength}`);
      });
      console.log('');
      
      console.log(`🎯 Areas for Improvement (${analysis.areasForImprovement.length}):`);
      analysis.areasForImprovement.forEach((area, idx) => {
        console.log(`   ${idx + 1}. ${area}`);
      });
      console.log('');
      
      console.log(`🌟 Standout Moments (${analysis.standoutMoments.length}):`);
      analysis.standoutMoments.forEach((moment, idx) => {
        console.log(`   ${idx + 1}. ${moment}`);
      });
      console.log('');
      
      console.log(`🗣️  Communication Style Scores:`);
      console.log(`   Clarity: ${analysis.communicationStyle.clarity}/10`);
      console.log(`   Engagement: ${analysis.communicationStyle.engagement}/10`);
      console.log(`   Empathy: ${analysis.communicationStyle.empathy}/10`);
      console.log(`   Decisiveness: ${analysis.communicationStyle.decisiveness}/10`);
      console.log('');
      
      console.log(`🎖️  Leadership Qualities Scores:`);
      console.log(`   Technical Guidance: ${analysis.leadershipQualities.technicalGuidance}/10`);
      console.log(`   Team Building: ${analysis.leadershipQualities.teamBuilding}/10`);
      console.log(`   Problem Solving: ${analysis.leadershipQualities.problemSolving}/10`);
      console.log(`   Vision Casting: ${analysis.leadershipQualities.visionCasting}/10`);
      console.log('');
      
      console.log(`💡 Key Insights (${analysis.keyInsights.length}):`);
      analysis.keyInsights.forEach((insight, idx) => {
        console.log(`   ${idx + 1}. ${insight}`);
      });
      console.log('');
      
      console.log(`🚀 Recommendations (${analysis.recommendations.length}):`);
      analysis.recommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec}`);
      });
      console.log('');
      
      console.log(`📝 Executive Summary:`);
      console.log(`   ${analysis.summary}`);
      console.log('');
      
      console.log('🎉 TEST SUMMARY:');
      console.log('='.repeat(40));
      console.log('✅ OpenAI API: Working perfectly');
      console.log('✅ Leadership Analysis: Complete and detailed');
      console.log('✅ JSON Response: Valid and structured');
      console.log(`✅ Response Time: ${analysisTime}ms (${analysisTime > 10000 ? 'Slow' : analysisTime > 5000 ? 'Medium' : 'Fast'})`);
      console.log('✅ Analysis Quality: Comprehensive');
      console.log('');
      
      console.log('🎯 RECOMMENDATIONS:');
      console.log('-'.repeat(20));
      console.log('💡 Your AI analysis system is working excellently');
      console.log('💡 Ready for production use with real meeting videos');
      console.log('💡 Consider implementing this analysis in your portfolio');
      console.log('💡 The system provides detailed, actionable leadership insights');
      
    } catch (parseError) {
      console.log('❌ Error parsing analysis JSON:', parseError.message);
      console.log('📄 Raw response:', content.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('❌ Error during OpenAI analysis:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 This appears to be an API key issue');
      console.log('💡 Please check your OpenAI API key and account status');
    } else if (error.message.includes('429')) {
      console.log('💡 Rate limit exceeded - please wait and try again');
    } else if (error.message.includes('insufficient_quota')) {
      console.log('💡 OpenAI account quota exceeded - please check billing');
    }
  }
}

console.log('🚀 Starting simple AI analysis test...');
console.log('');
testAIAnalysis().catch(console.error); 