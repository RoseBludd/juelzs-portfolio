#!/usr/bin/env node

console.log('🔧 FIXING MEETING-PROJECT LINKS\n');

const baseUrl = 'http://localhost:3000';

// Known showcased meetings from analysis
const meetings = [
  {
    id: '_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    title: 'Architecture Review Session',
    type: 'architecture-discussion',
    suggestedProjects: ['manual-1', 'manual-2'] // AI-Driven Architecture, Microservices Platform
  },
  {
    id: '_Private__Google_Meet_Call_2025_07_11_06_58_CDT', 
    title: 'Technical Discussion: Python & Testing',
    type: 'technical-review',
    suggestedProjects: ['manual-3'] // Real-time Data Processing Pipeline
  }
];

async function fixLinks() {
  try {
    console.log('📋 Step 1: Checking current link status...');
    
    // Check current links
    const currentLinksResponse = await fetch(`${baseUrl}/api/admin/meetings/link`);
    const currentLinksData = await currentLinksResponse.json();
    console.log(`   Current links: ${currentLinksData.links?.length || 0}`);
    
    if (currentLinksData.links?.length > 0) {
      console.log('   Existing links:');
      currentLinksData.links.forEach((link, index) => {
        console.log(`     ${index + 1}. ${link.meetingId} → ${link.projectId} (${link.linkType})`);
      });
    }

    console.log('\n🎯 Step 2: Creating missing links...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const meeting of meetings) {
      console.log(`📝 Processing: ${meeting.title}`);
      
      // Create links to suggested projects
      for (const projectId of meeting.suggestedProjects) {
        console.log(`   🔗 Linking to project: ${projectId}`);
        
        const linkData = {
          meetingId: meeting.id,
          projectId: projectId,
          linkType: meeting.type,
          description: `${meeting.title} demonstrates architectural thinking and technical leadership`,
          keyMoments: [
            'Technical decision-making',
            'Architecture discussion', 
            'Team collaboration',
            'Problem-solving approach'
          ]
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
            console.log(`      ✅ Successfully linked`);
            successCount++;
          } else {
            console.log(`      ❌ Failed: ${result.error || 'Unknown error'}`);
            errorCount++;
          }
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
          errorCount++;
        }
      }
      console.log('');
    }
    
    console.log('📊 Step 3: Verifying final state...\n');
    
    // Check final links state
    const finalLinksResponse = await fetch(`${baseUrl}/api/admin/meetings/link`);
    const finalLinksData = await finalLinksResponse.json();
    
    console.log(`✅ Results Summary:`);
    console.log(`   Total links created: ${successCount}`);
    console.log(`   Errors encountered: ${errorCount}`);
    console.log(`   Final link count: ${finalLinksData.links?.length || 0}`);
    
    if (finalLinksData.links?.length > 0) {
      console.log('\n📋 Final Links:');
      finalLinksData.links.forEach((link, index) => {
        console.log(`   ${index + 1}. ${link.meetingId} → ${link.projectId} (${link.linkType})`);
      });
    }
    
    console.log('\n🎉 Fix complete! Now refresh your admin interface to see:');
    console.log('   • 2 Total Showcased meetings');
    console.log(`   • ${finalLinksData.links?.length || 0} Linked to Projects`);
    console.log('   • Updated counts in the admin dashboard');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixLinks(); 