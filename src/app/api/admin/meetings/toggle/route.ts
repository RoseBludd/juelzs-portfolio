import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import AWSS3Service from '@/services/aws-s3.service';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { meetingId, isRelevant, showcaseDescription } = await request.json();

    if (!meetingId || typeof isRelevant !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Meeting ID and relevance status are required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Toggling portfolio relevance for meeting: ${meetingId} → ${isRelevant}`);

    // Store portfolio settings in S3 (same system as leadership page)
    const s3Service = AWSS3Service.getInstance();
    await s3Service.storeMeetingPortfolioSettings(
      meetingId,
      isRelevant,
      showcaseDescription || (isRelevant ? 'Featured in portfolio showcase' : undefined)
    );

    console.log(`✅ Successfully updated meeting ${meetingId} portfolio relevance to: ${isRelevant}`);

    return NextResponse.json({
      success: true,
      message: `Meeting ${isRelevant ? 'added to' : 'removed from'} portfolio showcase`,
      meetingId,
      isRelevant,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error toggling meeting relevance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update meeting relevance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 