#!/usr/bin/env node

// Script to create the missing meeting-project links

console.log('🔗 CREATING MEETING-PROJECT LINKS\n');

const baseUrl = 'http://localhost:3000';

// Known showcased meetings from your analysis
const meetings = [
  {
    id: '_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    title: 'JULY 15TH MEETING (Architecture Review)',
    type: 'architecture-discussion'
  },
  {
    id: '_Private__Google_Meet_Call_2025_07_11_06_58_CDT', 
    title: 'JULY 11TH MEETING (Technical Discussion)',
    type: 'technical-review'
  }
];

// Example project linking - you'll need to adjust project IDs
async function createLinks() {
  try {
    console.log('📋 Creating links for showcased meetings...\n');
    
    for (const meeting of meetings) {
      console.log(`🎯 Processing: ${meeting.title}`);
      console.log(`   Meeting ID: ${meeting.id}`);
      
      // Create a link (you'll need to specify actual project IDs)
      const linkData = {
        meetingId: meeting.id,
        projectId: 'project-1', // Replace with actual project ID
        linkType: meeting.type,
        description: `${meeting.title} demonstrates technical leadership and decision-making`,
        keyMoments: ['Architecture decisions', 'Technical guidance', 'Team leadership']
      };
      
      try {
        const response = await fetch(`${baseUrl}/api/admin/meetings/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(linkData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ Successfully linked to project`);
        } else {
          console.log(`   ❌ Failed to link: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`   ❌ Error linking: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Verify the links were created
    console.log('🔍 Verifying links...');
    const response = await fetch(`${baseUrl}/api/admin/meetings/link`);
    const data = await response.json();
    
    console.log(`📊 Total links now: ${data.links?.length || 0}`);
    if (data.links?.length > 0) {
      data.links.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.meetingId} → ${link.projectId} (${link.linkType})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

console.log('⚠️  IMPORTANT: You need to:');
console.log('   1. Update the project IDs in this script');
console.log('   2. Ensure your development server is running');
console.log('   3. Run this script to create the links');
console.log('');

// Uncomment the line below once you've updated the project IDs
// createLinks(); 