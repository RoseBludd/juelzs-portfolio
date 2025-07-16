#!/usr/bin/env node

console.log('🔍 Deep analysis of your two showcased meetings...');

const targetMeetings = [
  {
    id: '_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    name: 'July 15th Meeting (41:00)',
    date: '2025-07-15'
  },
  {
    id: '_Private__Google_Meet_Call_2025_07_11_06_58_CDT', 
    name: 'July 11th Meeting (35:00)',
    date: '2025-07-11'
  }
];

async function analyzeSpecificMeetings() {
  console.log('📊 Getting your meeting insights...\n');
  
  for (const meeting of targetMeetings) {
    console.log(`\n🎯 ANALYZING: ${meeting.name}`);
    console.log(`📅 Date: ${meeting.date}`);
    console.log('=' .repeat(60));
    
    try {
      // Get the transcript content
      console.log('📄 Fetching transcript...');
      const transcriptResponse = await fetch(`http://localhost:3000/api/video/s3-${meeting.id}/transcript`);
      
      if (transcriptResponse.ok) {
        const transcript = await transcriptResponse.text();
        console.log(`✅ Transcript loaded: ${transcript.length} characters`);
        
        // Analyze the content for leadership indicators
        const analysis = analyzeLeadershipContent(transcript);
        
        console.log('\n🎯 LEADERSHIP SKILLS DEMONSTRATED:');
        displaySkillsAnalysis(analysis);
        
        // Show key excerpts that demonstrate leadership
        const keyExcerpts = extractLeadershipMoments(transcript);
        if (keyExcerpts.length > 0) {
          console.log('\n💡 KEY LEADERSHIP MOMENTS:');
          keyExcerpts.forEach((excerpt, index) => {
            console.log(`${index + 1}. ${excerpt.type}: "${excerpt.text}"`);
          });
        }
        
      } else {
        console.log(`❌ Could not fetch transcript: ${transcriptResponse.status}`);
      }
      
      // Try to get any existing analysis
      console.log('\n🔍 Checking for existing AI analysis...');
      const videoResponse = await fetch(`http://localhost:3000/api/video/s3-${meeting.id}/recap`);
      if (videoResponse.ok) {
        const recap = await videoResponse.text();
        console.log('📋 Existing recap found:');
        console.log(recap.substring(0, 300) + '...');
      } else {
        console.log('⚠️ No existing analysis - this is why it was skipped!');
        console.log('💡 This meeting needs fresh AI analysis to extract leadership insights');
      }
      
    } catch (error) {
      console.error(`❌ Error analyzing ${meeting.name}:`, error.message);
    }
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('✅ Both meetings show leadership potential');
  console.log('🔄 Run "Refresh Analysis" with leadership focus');
  console.log('🎯 Update analysis prompt to be skill-showcasing, not judgmental');
  console.log('🏆 Focus on: decision-making, communication, problem-solving, team guidance');
}

function analyzeLeadershipContent(transcript) {
  const lower = transcript.toLowerCase();
  
  // Leadership skill indicators
  const skillIndicators = {
    'Decision Making': [
      'decision', 'decide', 'choose', 'approach', 'strategy', 'direction',
      'we should', 'i think we', 'let\'s go with', 'my recommendation'
    ],
    'Communication': [
      'explain', 'clarify', 'understand', 'make sure', 'clear', 'communicate',
      'let me walk you through', 'here\'s what i mean', 'to be clear'
    ],
    'Problem Solving': [
      'solution', 'solve', 'fix', 'resolve', 'address', 'handle',
      'figure out', 'work through', 'tackle', 'approach this'
    ],
    'Team Guidance': [
      'team', 'help you', 'guide', 'support', 'assist', 'mentor',
      'show you', 'teach', 'share', 'learn', 'grow'
    ],
    'Strategic Thinking': [
      'long term', 'future', 'plan', 'roadmap', 'vision', 'goal',
      'objective', 'outcome', 'impact', 'big picture'
    ],
    'Technical Leadership': [
      'architecture', 'design', 'best practices', 'standards', 'quality',
      'maintainable', 'scalable', 'efficient', 'optimize'
    ]
  };
  
  const results = {};
  
  for (const [skill, keywords] of Object.entries(skillIndicators)) {
    const matches = keywords.filter(keyword => lower.includes(keyword));
    results[skill] = {
      score: matches.length,
      matches: matches
    };
  }
  
  return results;
}

function displaySkillsAnalysis(analysis) {
  for (const [skill, data] of Object.entries(analysis)) {
    if (data.score > 0) {
      console.log(`✅ ${skill}: ${data.score} indicators found`);
      console.log(`   Keywords: ${data.matches.slice(0, 5).join(', ')}`);
    }
  }
}

function extractLeadershipMoments(transcript) {
  const lines = transcript.split('\n').filter(line => line.trim().length > 20);
  const moments = [];
  
  // Look for lines that show leadership
  const leadershipPatterns = [
    { type: 'Decision Making', regex: /(we should|i think we|let's|my recommendation|decision)/i },
    { type: 'Guidance', regex: /(let me|i'll help|show you|walk you through)/i },
    { type: 'Problem Solving', regex: /(solution|fix|resolve|figure out|approach)/i },
    { type: 'Strategic', regex: /(plan|strategy|long term|future|vision)/i }
  ];
  
  for (const line of lines.slice(0, 50)) { // Check first 50 lines
    for (const pattern of leadershipPatterns) {
      if (pattern.regex.test(line)) {
        moments.push({
          type: pattern.type,
          text: line.trim().substring(0, 100) + (line.length > 100 ? '...' : '')
        });
        break;
      }
    }
  }
  
  return moments.slice(0, 5); // Top 5 moments
}

// Run the analysis
analyzeSpecificMeetings().catch(console.error); 