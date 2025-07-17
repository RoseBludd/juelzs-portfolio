import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import PortfolioService from '@/services/portfolio.service';

export async function POST() {
  try {
    // Check admin authentication
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Admin requested overall leadership analysis refresh');
    
    const portfolioService = PortfolioService.getInstance();
    
    // Refresh overall analysis
    const analysis = await portfolioService.refreshOverallLeadershipAnalysis();
    
    if (!analysis) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to refresh overall analysis. Check if there are showcased videos with analysis.' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Overall leadership analysis refreshed successfully - Rating: ${analysis.overallRating}/10`);
    
    return NextResponse.json({
      success: true,
      message: 'Overall leadership analysis refreshed successfully',
      analysis: {
        overallRating: analysis.overallRating,
        totalSessionsAnalyzed: analysis.dataPoints.totalSessionsAnalyzed,
        averageRating: analysis.dataPoints.averageRating,
        lastUpdated: analysis.dataPoints.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Error refreshing overall leadership analysis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh overall analysis' 
      },
      { status: 500 }
    );
  }
} 