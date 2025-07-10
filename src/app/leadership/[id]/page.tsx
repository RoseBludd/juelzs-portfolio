import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { VideoPlayer } from '@/components/ui/VideoComponents';
import PortfolioService from '@/services/portfolio.service';

interface LeadershipDetailPageProps {
  params: { id: string };
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
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            {video.title}
          </h1>
          
          <div className="flex items-center gap-6 text-gray-400 mb-6">
            <span>Duration: {video.duration}</span>
            <span>•</span>
            <span>Recorded: {video.dateRecorded}</span>
            <span>•</span>
            <span>Participants: {video.participants.join(', ')}</span>
          </div>
          
          <p className="text-xl text-gray-400 max-w-3xl">
            {video.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Video Player */}
            <Card>
              <VideoPlayer video={video} />
              
              {/* Video controls */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="primary" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                  </Button>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timestamps
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </Button>
                </div>
              </div>
            </Card>

            {/* Enhanced Key Moments Timeline */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">Session Timeline</h2>
              <div className="space-y-4">
                {video.keyMoments.map((moment, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-200">
                        <span className="text-blue-400 font-mono text-sm font-semibold">
                          {moment.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{moment.description}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          moment.type === 'architecture' ? 'bg-blue-500/20 text-blue-300' :
                          moment.type === 'leadership' ? 'bg-purple-500/20 text-purple-300' :
                          moment.type === 'mentoring' ? 'bg-green-500/20 text-green-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {moment.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm">
                        Jump to this moment in the video to see {moment.type} principles in action.
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Session Insights */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">Session Insights</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">What You&apos;ll Learn</h3>
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
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Leadership Approach</h3>
                  <p className="text-gray-300 leading-relaxed">
                    This session showcases my collaborative leadership style, where I guide developers 
                    through complex architectural decisions while building their confidence and systems thinking. 
                    You&apos;ll see how I balance technical mentoring with strategic guidance.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Technical Topics Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Modular Architecture</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">System Design</span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Code Review</span>
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Best Practices</span>
                  </div>
                </div>
              </div>
            </Card>
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
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Participants</h4>
                  <div className="flex flex-wrap gap-2">
                    {video.participants.map((participant) => (
                      <span key={participant} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Recorded</h4>
                  <p className="text-gray-400">{video.dateRecorded}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Key Moments</h4>
                  <p className="text-gray-400">{video.keyMoments.length} timestamped insights</p>
                </div>
              </div>
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