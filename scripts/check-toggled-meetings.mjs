#!/usr/bin/env node

console.log('🔍 Checking toggled meetings analysis...');

const targetMeetings = [
  '_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
  '_Private__Google_Meet_Call_2025_07_11_06_58_CDT'
];

async function checkMeetings() {
  try {
    // Check if the meetings are properly toggled
    console.log('📋 Checking meeting portfolio status...');
    const response = await fetch('http://localhost:3000/api/admin/meetings');
    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ Failed to load meetings:', data.error);
      return;
    }
    
    console.log(`📊 Total meetings: ${data.meetings.length}`);
    console.log(`⭐ Portfolio relevant: ${data.stats.portfolioRelevant}`);
    
    // Find our target meetings
    for (const meetingId of targetMeetings) {
      const meeting = data.meetings.find(m => m.id === meetingId);
      
      if (meeting) {
        console.log(`\n🎯 Meeting: ${meeting.title}`);
        console.log(`📅 Date: ${meeting.dateRecorded}`);
        console.log(`📂 Original Category: ${meeting.category || 'uncategorized'}`);
        console.log(`✅ Portfolio Relevant: ${meeting.isPortfolioRelevant ? 'YES' : 'NO'}`);
        console.log(`🎭 Manually Set: ${meeting.manuallySet ? 'YES' : 'NO'}`);
        
        if (meeting.insights) {
          console.log(`📝 Description: ${meeting.insights.description}`);
          console.log(`👥 Participants: ${meeting.participants.join(', ')}`);
          console.log(`⏱️ Duration: ${meeting.insights.duration}`);
          console.log(`🔍 Key Moments: ${meeting.insights.keyMoments?.length || 0}`);
        }
        
        // Try to get transcript preview
        if (meeting.transcript) {
          try {
            console.log('📄 Getting transcript preview...');
            const transcriptResponse = await fetch(`http://localhost:3000/api/video/s3-${meetingId}/transcript`);
            const transcriptText = await transcriptResponse.text();
            
            if (transcriptText && transcriptText.length > 100) {
              const preview = transcriptText.substring(0, 500);
              console.log(`📖 Transcript Preview:\n${preview}...`);
              
              // Analyze content manually
              const lowerTranscript = transcriptText.toLowerCase();
              const techTerms = ['architecture', 'development', 'coding', 'system', 'database', 'api', 'framework', 'testing', 'deployment', 'security'];
              const foundTerms = techTerms.filter(term => lowerTranscript.includes(term));
              
              console.log(`🔬 Technical terms found: ${foundTerms.join(', ')}`);
              console.log(`📏 Transcript length: ${transcriptText.length} characters`);
            }
          } catch (error) {
            console.log(`⚠️ Could not load transcript: ${error.message}`);
          }
        }
        
        // Check if it should be re-analyzed
        if (meeting.isPortfolioRelevant && meeting.transcript) {
          console.log('🔄 This meeting should be re-analyzed for leadership content!');
        }
      } else {
        console.log(`❌ Meeting ${meetingId} not found`);
      }
    }
    
    console.log('\n🎯 Recommendation: These meetings should be moved to a "Manual Showcase" category');
    console.log('   and should have fresh AI analysis run to get leadership insights.');
    
  } catch (error) {
    console.error('❌ Error checking meetings:', error);
  }
}

// Run the check
checkMeetings(); 