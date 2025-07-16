// Copy and paste this into browser console (F12)
// This will set up the localStorage data for your video-project links

localStorage.setItem('project_resources_manual-1', '{"projectId":"manual-1","photos":[],"linkedVideos":[{"projectId":"manual-1","videoId":"s3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT","videoTitle":"Architecture Review Session","linkType":"architecture-review","relevanceScore":9,"notes":"Architecture review demonstrating system design thinking and technical leadership","id":"link_manual-1_s3-_Private__Google_Meet_Call_2025_07_15_09_55_CDT_1752626583409","linkedAt":"2025-07-16T00:43:03.409Z"}],"lastUpdated":"2025-07-16T00:43:03.409Z"}');
localStorage.setItem('project_resources_manual-3', '{"projectId":"manual-3","photos":[],"linkedVideos":[{"projectId":"manual-3","videoId":"s3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT","videoTitle":"Technical Discussion: Python & Testing","linkType":"technical-discussion","relevanceScore":9,"notes":"Technical discussion showing Python development expertise and testing strategies","id":"link_manual-3_s3-_Private__Google_Meet_Call_2025_07_11_06_58_CDT_1752626583410","linkedAt":"2025-07-16T00:43:03.410Z"}],"lastUpdated":"2025-07-16T00:43:03.410Z"}');

console.log('✅ Video-project links loaded into localStorage');
console.log('📊 Links created:');
console.log('   Architecture Review Session → Project manual-1 (architecture-review)');
console.log('   Technical Discussion: Python & Testing → Project manual-3 (technical-discussion)');

console.log('\n🔗 Test these URLs:');
console.log('   Admin Links: http://localhost:3000/admin/links (should show 2 linked)');
console.log('   Project manual-1: http://localhost:3000/projects/manual-1 (should show Architecture Review video)');
console.log('   Project manual-3: http://localhost:3000/projects/manual-3 (should show Python Testing video)');
