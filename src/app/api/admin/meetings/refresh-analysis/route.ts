import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import PortfolioService from '@/services/portfolio.service';

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

    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Admin requested video analysis refresh for: ${videoId}`);

    // Get the portfolio service and refresh video analysis
    const portfolioService = PortfolioService.getInstance();
    const analysis = await portfolioService.reanalyzeVideo(videoId);

    if (!analysis) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to refresh video analysis. OpenAI service may be unavailable or video not found.' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Fresh video analysis completed for: ${videoId} - Rating: ${analysis.overallRating}/10`);

    return NextResponse.json({
      success: true,
      message: `Video analysis refreshed successfully`,
      analysis: {
        overallRating: analysis.overallRating,
        strengths: analysis.strengths,
        areasForImprovement: analysis.areasForImprovement,
        standoutMoments: analysis.standoutMoments,
        communicationStyle: analysis.communicationStyle,
        leadershipQualities: analysis.leadershipQualities,
        summary: analysis.summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error refreshing video analysis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 