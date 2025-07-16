import { NextResponse } from 'next/server';
import PortfolioService from '@/services/portfolio.service';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking leadership video data in production...');
    
    const portfolioService = PortfolioService.getInstance();
    
    // Get raw videos without analysis first
    console.log('📊 Step 1: Getting videos without analysis...');
    const rawVideos = await portfolioService.getLeadershipVideos(false);
    
    // Get videos with analysis (filtered)
    console.log('📊 Step 2: Getting videos with analysis (filtered)...');
    const filteredVideos = await portfolioService.getLeadershipVideosWithAnalysis();
    
    // Get environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsBucket: process.env.AWS_S3_BUCKET,
      hasOpenAiKey: !!process.env.OPENAI_API_KEY,
      platform: process.platform,
      isVercel: !!process.env.VERCEL
    };
    
    // Summary info
    const summary = {
      totalRawVideos: rawVideos.length,
      filteredVideos: filteredVideos.length,
      videosWithAnalysis: rawVideos.filter(v => v.analysis).length,
      manualVideos: rawVideos.filter(v => v.source === 'manual').length,
      s3Videos: rawVideos.filter(v => v.source === 's3').length
    };
    
    // Sample video info (first 3)
    const videoSamples = filteredVideos.slice(0, 3).map(video => ({
      id: video.id,
      title: video.title,
      source: video.source,
      hasAnalysis: !!video.analysis,
      rating: video.analysis?.overallRating,
      duration: video.duration
    }));
    
    return NextResponse.json({
      success: true,
      environment: envInfo,
      summary,
      videoSamples,
      timestamp: new Date().toISOString(),
      message: `Found ${filteredVideos.length} videos ready for display`
    });
    
  } catch (error) {
    console.error('❌ Debug leadership error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 