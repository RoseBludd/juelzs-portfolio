import { NextRequest, NextResponse } from 'next/server';
import PortfolioService from '@/services/portfolio.service';

export async function GET() {
  try {
    console.log('📊 API: Fetching leadership videos for thumbnail generation...');
    
    const portfolioService = PortfolioService.getInstance();
    const videos = await portfolioService.getLeadershipVideosWithAnalysis();
    
    console.log(`🎯 API: Found ${videos.length} leadership videos with analysis`);
    
    // Convert to format expected by thumbnail generation script
    const videoData = videos.map(video => ({
      id: video.id,
      title: video.title,
      videoUrl: video.videoUrl, // Include the actual video URL
      context: video.description || 'Professional Leadership Meeting',
      analysis: video.analysis,
      videoAvailable: !!video.videoUrl
    }));
    
    return NextResponse.json({
      success: true,
      videos: videoData,
      count: videoData.length
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching leadership videos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leadership videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 