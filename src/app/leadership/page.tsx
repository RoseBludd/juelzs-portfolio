import { Metadata } from 'next';
import LeadershipPageClient from '@/components/ui/LeadershipPageClient';
import PortfolioService, { LeadershipVideo } from '@/services/portfolio.service';
import { OverallLeadershipAnalysis } from '@/services/overall-leadership-analysis.service';

export const metadata: Metadata = {
  title: 'Leadership Library',
  description: 'Watch how I coach teams, review architecture, and guide technical decisions in real-time.',
};

export default async function LeadershipPage() {
  const portfolioService = PortfolioService.getInstance();
  
  // Request videos WITH analysis for the leadership page
  console.log('🚀 LeadershipPage: Starting video fetch...');
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔑 AWS credentials available:', !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY);
  console.log('🔑 AWS S3 bucket:', process.env.AWS_S3_BUCKET);
  console.log('🔑 OpenAI key available:', !!process.env.OPENAI_API_KEY);
  
  let videos: LeadershipVideo[] = [];
  let overallAnalysis: OverallLeadershipAnalysis | null = null;
  
  try {
    const [rawVideos, analysis] = await Promise.all([
      portfolioService.getLeadershipVideosWithAnalysis(),
      portfolioService.getOverallLeadershipAnalysis()
    ]);
    
    console.log(`📊 Leadership Page: Raw videos loaded: ${rawVideos.length}`);
    overallAnalysis = analysis;
    
    if (rawVideos.length === 0) {
      console.error('❌ No videos returned from getLeadershipVideosWithAnalysis');
      console.log('🔍 Debugging: Check AWS S3 connection and video analysis');
      
      // Try to get videos without analysis as fallback
      console.log('🔄 Attempting fallback: getting videos without analysis...');
      const fallbackVideos = await portfolioService.getLeadershipVideos(false);
      console.log(`📊 Fallback videos: ${fallbackVideos.length}`);
      
      if (fallbackVideos.length > 0) {
        console.log('✅ Fallback successful - using videos without analysis filtering');
        videos = fallbackVideos;
      }
    } else {
      console.log('✅ Videos with analysis loaded successfully');
      videos = rawVideos;
    }
    
    console.log(`🎬 Final video count for rendering: ${videos.length}`);
    if (videos.length > 0) {
      console.log(`📊 Video sources: ${videos.map(v => `${v.title} (${v.source})`).join(', ')}`);
      console.log(`📊 Videos with analysis: ${videos.filter(v => v.analysis).length}`);
    }

    if (overallAnalysis) {
      console.log(`📊 Overall analysis loaded - Rating: ${overallAnalysis.overallRating}/10`);
    } else {
      console.log('📊 No overall analysis available');
    }
    
  } catch (error) {
    console.error('❌ Error loading leadership videos:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Emergency fallback - try getting videos without analysis
    console.log('🚨 Emergency fallback: trying videos without analysis...');
    try {
      const emergencyVideos = await portfolioService.getLeadershipVideos(false);
      videos = emergencyVideos || [];
      console.log(`🚨 Emergency fallback result: ${videos.length} videos`);
    } catch (fallbackError) {
      console.error('❌ Emergency fallback also failed:', fallbackError);
      videos = [];
    }
  }

  return <LeadershipPageClient videos={videos} overallAnalysis={overallAnalysis} />;
} 