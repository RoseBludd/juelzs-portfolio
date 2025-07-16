import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import AWSS3Service from '@/services/aws-s3.service';

export async function GET() {
  try {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🎥 Admin requested all meetings data...');

    // Get all meetings from S3 (portfolio settings are now integrated)
    const s3Service = AWSS3Service.getInstance();
    const meetings = await s3Service.getMeetingGroups();

    // Sort meetings by date (most recent first)
    const sortedMeetings = meetings.sort((a, b) => {
      const dateA = new Date(a.dateRecorded);
      const dateB = new Date(b.dateRecorded);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`📊 Found ${meetings.length} total meetings`);
    console.log(`⭐ ${sortedMeetings.filter(m => m.isPortfolioRelevant).length} are portfolio relevant (including manual settings)`);
    console.log(`🎥 ${meetings.filter(m => m.video).length} have videos`);
    console.log(`📝 ${meetings.filter(m => m.transcript).length} have transcripts`);

    return NextResponse.json({
      success: true,
      meetings: sortedMeetings,
      stats: {
        total: meetings.length,
        portfolioRelevant: sortedMeetings.filter(m => m.isPortfolioRelevant).length,
        withVideo: meetings.filter(m => m.video).length,
        withTranscript: meetings.filter(m => m.transcript).length,
        withRecap: meetings.filter(m => m.recap).length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch meetings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 