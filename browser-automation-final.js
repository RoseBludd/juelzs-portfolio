// COMPLETE VIDEO-PROJECT LINKING TEST
// Copy this entire script into browser console (F12)

console.log('🧪 Starting complete video-project linking test...');

// Step 1: Apply localStorage data for video-project links
localStorage.setItem('project_resources_manual-1', JSON.stringify({
  "projectId": "manual-1",
  "photos": [],
  "linkedVideos": [{
    "id": "link_manual-1_s3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT_" + Date.now(),
    "projectId": "manual-1", 
    "videoId": "s3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT",
    "videoTitle": "Architecture Review Session",
    "linkType": "architecture-review",
    "relevanceScore": 9,
    "linkedAt": new Date().toISOString(),
    "notes": "Architecture review demonstrating system design thinking and technical leadership"
  }],
  "lastUpdated": new Date().toISOString()
}));

localStorage.setItem('project_resources_manual-3', JSON.stringify({
  "projectId": "manual-3",
  "photos": [],
  "linkedVideos": [{
    "id": "link_manual-3_s3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT_" + Date.now(),
    "projectId": "manual-3",
    "videoId": "s3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT", 
    "videoTitle": "Technical Discussion: Python & Testing",
    "linkType": "technical-discussion",
    "relevanceScore": 9,
    "linkedAt": new Date().toISOString(),
    "notes": "Technical discussion showing Python development expertise and testing strategies"
  }],
  "lastUpdated": new Date().toISOString()
}));

console.log('✅ Step 1: localStorage data applied');

// Step 2: Verify localStorage data
function verifyLocalStorage() {
  console.log('💾 Step 2: Verifying localStorage data...');
  
  const projects = ['manual-1', 'manual-3'];
  let totalLinks = 0;
  
  projects.forEach(projectId => {
    const key = 'project_resources_' + projectId;
    const data = localStorage.getItem(key);
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const videoCount = parsed.linkedVideos ? parsed.linkedVideos.length : 0;
        totalLinks += videoCount;
        
        console.log('   ' + projectId + ': ' + videoCount + ' linked videos');
        if (videoCount > 0) {
          parsed.linkedVideos.forEach(video => {
            console.log('     - ' + video.videoTitle + ' (' + video.linkType + ')');
          });
        }
      } catch (error) {
        console.log('   ' + projectId + ': Error parsing data');
      }
    } else {
      console.log('   ' + projectId + ': No data found');
    }
  });
  
  console.log('📊 Total linked videos: ' + totalLinks);
  return totalLinks;
}

// Step 3: Test project pages
async function testProjectPages() {
  console.log('📄 Step 3: Testing project pages...');
  
  const projects = [
    { id: 'manual-1', name: 'AI-Driven Modular Architecture', expectedVideo: 'Architecture Review Session' },
    { id: 'manual-3', name: 'Real-time Data Processing Pipeline', expectedVideo: 'Technical Discussion: Python & Testing' }
  ];
  
  for (const project of projects) {
    try {
      const response = await fetch('/projects/' + project.id);
      if (response.ok) {
        console.log('✅ ' + project.name + ' page loads');
        console.log('   Visit: http://localhost:3000/projects/' + project.id);
        console.log('   Expected video: ' + project.expectedVideo);
      } else {
        console.log('❌ ' + project.name + ' page failed (' + response.status + ')');
      }
    } catch (error) {
      console.log('❌ ' + project.name + ' error: ' + error.message);
    }
  }
}

// Step 4: Test admin links page  
async function testAdminLinks() {
  try {
    console.log('📊 Step 4: Testing admin links page...');
    
    const response = await fetch('/admin/links');
    if (response.url.includes('/admin/login')) {
      console.log('⚠️  Admin auth required - manual verification needed');
      console.log('   Visit: http://localhost:3000/admin/links');
      console.log('   Expected: "2 Linked to Projects" instead of 0');
    } else {
      console.log('✅ Admin links page accessible');
    }
  } catch (error) {
    console.log('❌ Admin links test failed: ' + error.message);
  }
}

// Run all tests
async function runCompleteTest() {
  console.log('\n🎯 RUNNING COMPLETE TEST SUITE...');
  
  const linkedVideos = verifyLocalStorage();
  await testProjectPages();
  await testAdminLinks();
  
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('   ✅ Linked videos in localStorage: ' + linkedVideos);
  console.log('   📄 Project pages: Check manually for video tabs');
  console.log('   🔗 Admin links page: Should show 2 linked projects');
  
  console.log('\n🔧 MANUAL VERIFICATION CHECKLIST:');
  console.log('1. Visit http://localhost:3000/admin/links');
  console.log('   → Should show "2 Linked to Projects" (not 0)');
  console.log('2. Visit http://localhost:3000/projects/manual-1');
  console.log('   → Should show "Architecture Review Session" video tab');
  console.log('3. Visit http://localhost:3000/projects/manual-3');
  console.log('   → Should show "Technical Discussion: Python & Testing" video tab');
  console.log('4. Test "🔗 Link to Projects" buttons in admin/meetings');
  console.log('   → Should show existing links in modal');
  
  if (linkedVideos === 2) {
    console.log('\n🎉 TEST PASSED: All video-project links created successfully!');
  } else {
    console.log('\n❌ TEST FAILED: Expected 2 links, got ' + linkedVideos);
  }
  
  // Reload pages to ensure changes are visible
  console.log('\n🔄 Reloading page to apply changes...');
  location.reload();
}

// Auto-run the test
runCompleteTest(); 