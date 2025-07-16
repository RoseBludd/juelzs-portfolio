#!/usr/bin/env node

import PortfolioService from '../src/services/portfolio.service.ts';
import AWSS3Service from '../src/services/aws-s3.service.ts';
import MeetingProjectLinksService from '../src/services/meeting-project-links.service.ts';

console.log('🔍 DEBUGGING LINK DISCREPANCY\n');

// Get showcased meetings from portfolio service
const portfolioService = PortfolioService.getInstance();
const s3Service = AWSS3Service.getInstance();
const linksService = MeetingProjectLinksService.getInstance();

try {
  console.log('📊 Getting all meetings...');
  const allMeetings = await portfolioService.getLeadershipVideos(false);
  console.log(`Found ${allMeetings.length} total meetings\n`);

  console.log('🎯 Getting meeting groups from S3...');
  const meetingGroups = await s3Service.getMeetingGroups();
  console.log(`Found ${meetingGroups.length} meeting groups in S3\n`);

  console.log('⭐ Checking portfolio relevance...');
  const showcasedMeetings = allMeetings.filter(meeting => {
    if (meeting.source === 'manual') {
      console.log(`  ✅ Manual meeting: ${meeting.title} (ID: ${meeting.id})`);
      return true;
    }
    
    const meetingId = meeting.id.replace('s3-', '');
    const meetingGroup = meetingGroups.find(group => group.id === meetingId);
    const isRelevant = meetingGroup?.isPortfolioRelevant || false;
    
    if (isRelevant) {
      console.log(`  ✅ S3 meeting: ${meeting.title} (ID: ${meeting.id}, S3 ID: ${meetingId})`);
    }
    
    return isRelevant;
  });

  console.log(`\n📈 SHOWCASED MEETINGS: ${showcasedMeetings.length}`);
  
  console.log('\n🔗 Checking existing links...');
  const allLinks = linksService.getAllLinks();
  console.log(`Found ${allLinks.length} total links in storage`);
  
  if (allLinks.length > 0) {
    console.log('\n📋 Link details:');
    allLinks.forEach((link, index) => {
      console.log(`  ${index + 1}. Meeting ID: ${link.meetingId} → Project ID: ${link.projectId} (${link.linkType})`);
    });
  }
  
  console.log('\n🔍 Checking link matches...');
  showcasedMeetings.forEach(meeting => {
    const meetingIdForLinks = meeting.source === 's3' ? meeting.id.replace('s3-', '') : meeting.id;
    const meetingLinks = allLinks.filter(link => link.meetingId === meetingIdForLinks);
    
    console.log(`  📝 ${meeting.title}:`);
    console.log(`     Meeting ID: ${meeting.id}`);
    console.log(`     Link search ID: ${meetingIdForLinks}`);
    console.log(`     Found links: ${meetingLinks.length}`);
    
    if (meetingLinks.length > 0) {
      meetingLinks.forEach(link => {
        console.log(`       → Linked to project: ${link.projectId} (${link.linkType})`);
      });
    }
  });

  const linkedMeetingsCount = showcasedMeetings.filter(meeting => {
    const meetingIdForLinks = meeting.source === 's3' ? meeting.id.replace('s3-', '') : meeting.id;
    const meetingLinks = allLinks.filter(link => link.meetingId === meetingIdForLinks);
    return meetingLinks.length > 0;
  }).length;

  console.log('\n📊 FINAL COUNTS:');
  console.log(`  Total Showcased: ${showcasedMeetings.length}`);
  console.log(`  Linked to Projects: ${linkedMeetingsCount}`);
  console.log(`  Awaiting Links: ${showcasedMeetings.length - linkedMeetingsCount}`);
  
  console.log('\n✅ Diagnosis complete');

} catch (error) {
  console.error('❌ Error during diagnosis:', error);
} 