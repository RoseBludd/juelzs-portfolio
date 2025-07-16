#!/usr/bin/env node

console.log('🔗 LINKING MEETING VIDEOS TO PROJECTS\n');

// Meeting videos to link to projects (these are your showcased meetings)
const videoLinks = [
  {
    projectId: 'manual-1', // AI-Driven Modular Architecture
    videoId: 's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    videoTitle: 'Architecture Review Session', 
    linkType: 'architecture-review',
    relevanceScore: 9,
    notes: 'Demonstrates architectural thinking and system design decisions'
  },
  {
    projectId: 'manual-2', // Scalable Microservices Platform  
    videoId: 's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    videoTitle: 'Architecture Review Session',
    linkType: 'architecture-review', 
    relevanceScore: 8,
    notes: 'Shows microservices architecture discussion and scalability planning'
  },
  {
    projectId: 'manual-3', // Real-time Data Processing Pipeline
    videoId: 's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT',
    videoTitle: 'Technical Discussion: Python & Testing',
    linkType: 'technical-discussion',
    relevanceScore: 9,
    notes: 'Demonstrates technical leadership in Python development and testing strategies'
  }
];

async function createProjectVideoLinks() {
  console.log('📋 Creating project video links using localStorage...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const link of videoLinks) {
    try {
      console.log(`🎯 Linking: ${link.videoTitle}`);
      console.log(`   Project: ${link.projectId}`);
      console.log(`   Video: ${link.videoId}`);
      console.log(`   Type: ${link.linkType}`);
      
      // Create the project resources structure
      const projectResourcesKey = `project_resources_${link.projectId}`;
      
      // Get existing resources or create new
      let existingResources;
             try {
         const stored = localStorage.getItem(projectResourcesKey);
         existingResources = stored ? JSON.parse(stored) : null;
       } catch {
         existingResources = null;
       }
      
      const resources = existingResources || {
        projectId: link.projectId,
        photos: [],
        linkedVideos: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Check if video is already linked
      const existingLink = resources.linkedVideos.find(v => v.videoId === link.videoId);
      
      if (!existingLink) {
        // Create new video link
        const newVideoLink = {
          id: `link_${link.projectId}_${link.videoId}_${Date.now()}`,
          projectId: link.projectId,
          videoId: link.videoId,
          videoTitle: link.videoTitle,
          linkType: link.linkType,
          relevanceScore: link.relevanceScore,
          linkedAt: new Date().toISOString(),
          notes: link.notes
        };
        
        resources.linkedVideos.push(newVideoLink);
        resources.lastUpdated = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem(projectResourcesKey, JSON.stringify(resources));
        
        console.log(`   ✅ Successfully linked`);
        successCount++;
      } else {
        console.log(`   ⚠️  Already linked`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
    
    console.log('');
  }
  
  console.log(`✅ Results Summary:`);
  console.log(`   Links created: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  
  // Verify the links
  console.log('\n📋 Verifying links in localStorage...');
  
  for (const projectId of ['manual-1', 'manual-2', 'manual-3']) {
    const key = `project_resources_${projectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const resources = JSON.parse(stored);
      console.log(`   Project ${projectId}: ${resources.linkedVideos.length} linked videos`);
      resources.linkedVideos.forEach((video, index) => {
        console.log(`     ${index + 1}. ${video.videoTitle} (${video.linkType})`);
      });
    } else {
      console.log(`   Project ${projectId}: No resources found`);
    }
  }
}

// This is a client-side script that needs to run in the browser
console.log('⚠️  This script needs to run in the browser console where localStorage is available.');
console.log('');
console.log('📋 Instructions:');
console.log('1. Open your browser and go to your project page');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste this function:');
console.log('');
console.log('// Copy from here:');
console.log(createProjectVideoLinks.toString());
console.log('');
console.log('5. Then call: createProjectVideoLinks()');
console.log('');
console.log('This will create the proper video-project links in localStorage.'); 