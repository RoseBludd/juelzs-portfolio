#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 SYSTEMATIC VIDEO-PROJECT LINKING TEST\n');

// Simulate ProjectLinkingService localStorage operations
class TestProjectLinkingService {
  constructor() {
    this.storageFile = join(process.cwd(), 'test-project-links.json');
    this.storage = this.loadStorage();
  }

  loadStorage() {
    try {
      const data = readFileSync(this.storageFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  saveStorage() {
    writeFileSync(this.storageFile, JSON.stringify(this.storage, null, 2));
  }

  getProjectResources(projectId) {
    const key = `project_resources_${projectId}`;
    return this.storage[key] || {
      projectId,
      photos: [],
      linkedVideos: [],
      lastUpdated: new Date().toISOString()
    };
  }

  linkVideoToProject(projectId, videoLink) {
    const resources = this.getProjectResources(projectId);
    
    // Check if already linked
    const existingIndex = resources.linkedVideos.findIndex(
      v => v.videoId === videoLink.videoId
    );

    if (existingIndex >= 0) {
      // Update existing
      resources.linkedVideos[existingIndex] = {
        ...videoLink,
        id: `link_${projectId}_${videoLink.videoId}_${Date.now()}`,
        linkedAt: new Date().toISOString()
      };
    } else {
      // Add new
      resources.linkedVideos.push({
        ...videoLink,
        id: `link_${projectId}_${videoLink.videoId}_${Date.now()}`,
        linkedAt: new Date().toISOString()
      });
    }

    resources.lastUpdated = new Date().toISOString();
    
    const key = `project_resources_${projectId}`;
    this.storage[key] = resources;
    this.saveStorage();
    
    return resources.linkedVideos[resources.linkedVideos.length - 1];
  }

  getAllLinkedVideos() {
    const allLinks = [];
    Object.keys(this.storage).forEach(key => {
      if (key.startsWith('project_resources_')) {
        const resources = this.storage[key];
        allLinks.push(...(resources.linkedVideos || []));
      }
    });
    return allLinks;
  }
}

// Test data - the 2 showcased meetings and projects to link them to
const testLinks = [
  {
    meetingId: 's3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT',
    meetingTitle: 'Architecture Review Session',
    projectId: 'manual-1', // AI-Driven Modular Architecture
    linkType: 'architecture-review',
    description: 'Architecture review demonstrating system design thinking and technical leadership'
  },
  {
    meetingId: 's3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT', 
    meetingTitle: 'Technical Discussion: Python & Testing',
    projectId: 'manual-3', // Real-time Data Processing Pipeline  
    linkType: 'technical-discussion',
    description: 'Technical discussion showing Python development expertise and testing strategies'
  }
];

async function runSystematicTest() {
  console.log('📋 Starting systematic test...\n');
  
  const linkingService = new TestProjectLinkingService();
  
  // Step 1: Create the video-project links
  console.log('🔗 Step 1: Creating video-project links...');
  const createdLinks = [];
  
  for (const testLink of testLinks) {
    try {
      const link = linkingService.linkVideoToProject(testLink.projectId, {
        projectId: testLink.projectId,
        videoId: testLink.meetingId,
        videoTitle: testLink.meetingTitle,
        linkType: testLink.linkType,
        relevanceScore: 9,
        notes: testLink.description
      });
      
      createdLinks.push(link);
      console.log(`   ✅ Linked: ${testLink.meetingTitle} → ${testLink.projectId}`);
    } catch (error) {
      console.log(`   ❌ Error linking ${testLink.meetingTitle}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Created ${createdLinks.length} links\n`);
  
  // Step 2: Verify the links exist
  console.log('🔍 Step 2: Verifying links...');
  const allLinks = linkingService.getAllLinkedVideos();
  console.log(`   📊 Total links in storage: ${allLinks.length}`);
  
  for (const testLink of testLinks) {
    const matchingLinks = allLinks.filter(link => 
      link.videoId === testLink.meetingId && link.projectId === testLink.projectId
    );
    
    if (matchingLinks.length > 0) {
      const link = matchingLinks[0];
      console.log(`   ✅ ${testLink.meetingTitle}: ${link.linkType} (score: ${link.relevanceScore})`);
    } else {
      console.log(`   ❌ ${testLink.meetingTitle}: Not found`);
    }
  }
  
  console.log('');
  
  // Step 3: Generate localStorage data for browser
  console.log('💾 Step 3: Generating localStorage data for browser...');
  const localStorageData = {};
  
  Object.keys(linkingService.storage).forEach(key => {
    if (key.startsWith('project_resources_')) {
      localStorageData[key] = linkingService.storage[key];
    }
  });
  
  // Write browser-ready script
  const browserScript = `// Copy and paste this into browser console (F12)
// This will set up the localStorage data for your video-project links

${Object.entries(localStorageData).map(([key, value]) => 
  `localStorage.setItem('${key}', '${JSON.stringify(value)}');`
).join('\n')}

console.log('✅ Video-project links loaded into localStorage');
console.log('📊 Links created:');
${allLinks.map(link => 
  `console.log('   ${link.videoTitle} → Project ${link.projectId} (${link.linkType})');`
).join('\n')}

console.log('\\n🔗 Test these URLs:');
console.log('   Admin Links: http://localhost:3000/admin/links (should show ${allLinks.length} linked)');
console.log('   Project manual-1: http://localhost:3000/projects/manual-1 (should show Architecture Review video)');
console.log('   Project manual-3: http://localhost:3000/projects/manual-3 (should show Python Testing video)');
`;

  writeFileSync('test-browser-setup.js', browserScript);
  console.log('   📄 Created test-browser-setup.js');
  console.log('   📋 Run this in browser console to set up localStorage\n');
  
  // Step 4: Results summary
  console.log('📊 SYSTEMATIC TEST RESULTS:');
  console.log(`   ✅ Links Created: ${createdLinks.length}/${testLinks.length}`);
  console.log(`   ✅ Links Verified: ${allLinks.length} total in storage`);
  console.log(`   ✅ Browser Script: Generated test-browser-setup.js`);
  
  // Step 5: Expected counts for verification
  console.log('\n🎯 EXPECTED RESULTS:');
  console.log('   Admin Links Page:');
  console.log(`     • Total Showcased: 2 (manually toggled meetings)`);
  console.log(`     • Linked to Projects: ${allLinks.length}`);
  console.log(`     • Awaiting Links: ${2 - allLinks.length}`);
  console.log('');
  console.log('   Project Pages:');
  console.log('     • manual-1: Should show "Architecture Review Session" video');
  console.log('     • manual-3: Should show "Technical Discussion: Python & Testing" video');
  
  // Step 6: Manual verification steps
  console.log('\n🔧 MANUAL VERIFICATION STEPS:');
  console.log('1. Copy content of test-browser-setup.js into browser console');
  console.log('2. Visit http://localhost:3000/admin/links');
  console.log('3. Verify counts match expected results above');
  console.log('4. Visit project pages and verify videos appear');
  console.log('5. Test "🔗 Link to Projects" buttons in admin/meetings');
  
  return {
    success: createdLinks.length === testLinks.length,
    linksCreated: createdLinks.length,
    totalLinksInStorage: allLinks.length,
    testData: localStorageData
  };
}

// Run the systematic test
runSystematicTest()
  .then(results => {
    if (results.success) {
      console.log('\n🎉 SYSTEMATIC TEST PASSED!');
      console.log('   All video-project links created successfully');
      console.log('   Ready for browser verification');
    } else {
      console.log('\n❌ SYSTEMATIC TEST FAILED!');
      console.log('   Some links were not created properly');
    }
  })
  .catch(error => {
    console.error('\n💥 TEST ERROR:', error);
  }); 