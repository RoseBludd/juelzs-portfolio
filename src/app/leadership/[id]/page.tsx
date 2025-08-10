import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ModernSessionPage from '@/components/ui/ModernSessionPage';
import PortfolioService from '@/services/portfolio.service';

interface LeadershipDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeadershipDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const video = await portfolioService.getLeadershipVideoById(id);
  
  if (!video) {
    return {
      title: 'Video Not Found',
    };
  }

  return {
    title: `${video.title} - Leadership Video`,
    description: video.description,
  };
}

export default async function LeadershipDetailPage({ params }: LeadershipDetailPageProps) {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const video = await portfolioService.getLeadershipVideoById(id);

  if (!video) {
    notFound();
  }

  console.log('🎥 Individual video page loaded:', {
    videoId: id,
    videoTitle: video.title,
    keyMomentsCount: video.keyMoments.length,
    hasAnalysis: !!video.analysis,
    analysisRating: video.analysis?.overallRating
  });

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Button href="/leadership" variant="ghost" size="sm" className="mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Leadership Library
          </Button>
          
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-gray-700/50">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
              {video.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{video.duration}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{video.dateRecorded}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{video.keyMoments.length} key moments</span>
              </div>
            </div>
            
            <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
              {video.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Modern Session Interface */}
            <ModernSessionPage video={video} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Session Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Duration</h4>
                  <p className="text-gray-400">{video.duration}</p>
                </div>



                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Recorded</h4>
                  <p className="text-gray-400">{video.dateRecorded}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Key Moments</h4>
                  <p className="text-gray-400">{video.keyMoments.length} timestamped insights</p>
                </div>

                {video.analysis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">AI Analysis Rating</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        video.analysis.overallRating >= 8 ? 'bg-green-500/20' :
                        video.analysis.overallRating >= 6 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                      }`}>
                        <span className={`text-sm font-bold ${
                          video.analysis.overallRating >= 8 ? 'text-green-400' :
                          video.analysis.overallRating >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {video.analysis.overallRating}
                        </span>
                      </div>
                      <span className="text-gray-400">out of 10</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Session Insights */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">What You&apos;ll Learn</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">•</span>
                  <span>How I approach architectural decision-making in real-time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">•</span>
                  <span>My coaching methodology for building systems thinking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">•</span>
                  <span>Techniques for leading technical discussions effectively</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 mt-1">•</span>
                  <span>How to balance technical depth with strategic thinking</span>
                </li>
              </ul>
            </Card>

            {/* Related Videos */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Related Sessions</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-1">System Design Workshop</h4>
                  <p className="text-gray-400 text-xs">Deep dive into modular architecture</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-1">Code Review Best Practices</h4>
                  <p className="text-gray-400 text-xs">How to review for architecture</p>
                </div>
                <Button href="/leadership" variant="outline" size="sm" className="w-full">
                  View All Videos
                </Button>
              </div>
            </Card>

            {/* Call to Action */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Want This for Your Team?</h3>
              <p className="text-gray-400 text-sm mb-4">
                I offer similar coaching sessions for development teams looking to build stronger architectural thinking.
              </p>
              <div className="space-y-2">
                <Button href="/contact?topic=coaching" className="w-full">
                  Book Team Coaching
                </Button>
                <Button href="/philosophy" variant="outline" size="sm" className="w-full">
                  Learn My Approach
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 