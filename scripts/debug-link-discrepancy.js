#!/usr/bin/env node

console.log('🔍 DEBUGGING LINK DISCREPANCY\n');

// Check what meetings should be showcased
async function checkMeetingStatus() {
  console.log('📊 Checking meeting status from final meeting summary...');
  
  // From your previous script output, we know there are 2 showcased meetings:
  const knownShowcasedMeetings = [
    {
      id: '_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
      title: 'JULY 15TH MEETING',
      duration: '41:00'
    },
    {
      id: '_Private__Google_Meet_Call_2025_07_11_06_58_CDT', 
      title: 'JULY 11TH MEETING',
      duration: '35:00'
    }
  ];
  
  console.log(`📈 EXPECTED SHOWCASED MEETINGS: ${knownShowcasedMeetings.length}`);
  knownShowcasedMeetings.forEach((meeting, index) => {
    console.log(`  ${index + 1}. ${meeting.title} (ID: ${meeting.id})`);
  });
  
  // Check what links exist in localStorage
  console.log('\n🔗 Checking localStorage for existing links...');
  console.log('  Note: This script cannot access browser localStorage directly');
  console.log('  You need to check in the browser console:');
  console.log('  localStorage.getItem("meeting-project-links")');
  
  // Based on the admin interface showing "0 Linked to Projects"
  console.log('\n📊 EXPECTED VS ACTUAL:');
  console.log('  Expected Showcased: 2');
  console.log('  Admin UI showing: 1 Total Showcased, 0 Linked to Projects');
  console.log('  Projects: 3 Available Projects');
  
  console.log('\n🔍 LIKELY ISSUES:');
  console.log('  1. Meeting ID format mismatch between systems');
  console.log('  2. Admin UI counting logic incorrect');
  console.log('  3. localStorage links not properly persisted');
  console.log('  4. ID transformation logic in admin links page');
  
  console.log('\n✅ Diagnosis complete - check browser localStorage manually');
}

checkMeetingStatus().catch(console.error); 