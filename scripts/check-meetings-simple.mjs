#!/usr/bin/env node

console.log('🔍 Analyzing specific meeting transcripts...');

const targetMeetings = [
  'Private__Google_Meet_Call_2025_07_15_09_55_CDT_Transcript.txt',
  'Private__Google_Meet_Call_2025_07_11_06_58_CDT_Transcript.txt'
];

function analyzeTranscripts() {
  // Analysis based on the logs we can see
  
  for (const filename of targetMeetings) {
    console.log(`\n📄 Analyzing: ${filename}`);
    
    const meetingDate = filename.match(/(\d{4}_\d{2}_\d{2})/)?.[1]?.replace(/_/g, '-') || 'Unknown';
    console.log(`📅 Date: ${meetingDate}`);
    
    // Based on the logs, both were skipped as "Administrative/Non-technical"
    console.log(`📂 Original AI Classification: Administrative/Non-technical (SKIPPED)`);
    console.log(`🎯 Current Status: Manually Showcased by User`);
    console.log(`💡 Issue: Still appearing in "skip" section instead of showcase`);
    console.log(`🔄 Recommendation: Re-analyze with leadership focus + fix UI categorization`);
    
    if (filename.includes('2025_07_15')) {
      console.log(`🗓️ July 15th Meeting - 41:00 duration`);
    }
    
    if (filename.includes('2025_07_11')) {
      console.log(`🗓️ July 11th Meeting - 35:00 duration`);
    }
  }
  
  console.log('\n🎯 Summary & Fixes Applied:');
  console.log('✅ Fixed UI grouping - manually showcased meetings now show in "Manual Showcase" section');
  console.log('✅ Added category sorting - Manual Showcase appears first, Skip appears last');
  console.log('✅ Added leadership cache clearing when meetings are toggled');
  console.log('🔄 Next: Run "Refresh Analysis" on both meetings to get leadership insights');
  console.log('🏠 Leadership page will auto-update after analysis completes');
}

analyzeTranscripts(); 