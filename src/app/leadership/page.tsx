import { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { VideoThumbnail, VideoPlayerSection } from '@/components/ui/VideoComponents';
import AnalysisToggle from '@/components/ui/AnalysisToggle';
import PortfolioService from '@/services/portfolio.service';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Leadership Library',
  description: 'Watch how I coach teams, review architecture, and guide technical decisions in real-time.',
};

export default async function LeadershipPage() {
  const portfolioService = PortfolioService.getInstance();
  
  // Request videos WITH analysis for the leadership page
  console.log('📊 Loading leadership videos with full analysis...');
  const videos = await portfolioService.getLeadershipVideosWithAnalysis();

  const momentTypes = [
    { type: 'architecture', label: 'Architecture Reviews', color: 'bg-blue-500/20 text-blue-300' },
    { type: 'leadership', label: 'Leadership Moments', color: 'bg-purple-500/20 text-purple-300' },
    { type: 'mentoring', label: 'Mentoring Sessions', color: 'bg-green-500/20 text-green-300' },
    { type: 'technical', label: 'Technical Discussions', color: 'bg-orange-500/20 text-orange-300' }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Profile Image */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-2xl ring-4 ring-purple-500/20">
                <Image
                  src="/profile-logo.png"
                  alt="Juelzs - Leadership & Team Coaching"
                  width={144}
                  height={144}
                  className="w-full h-full object-cover object-center scale-125"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-600/20 blur-xl -z-10"></div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Leadership in <span className="gradient-text">Action</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Watch how I coach teams, review architecture, and guide technical decisions in real-time. 
            These recordings showcase my approach to building both systems and the people who build them.
          </p>
          
          {/* Moment Types Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button variant="primary" size="sm">All Videos</Button>
            {momentTypes.map((moment) => (
              <Button key={moment.type} variant="outline" size="sm">
                {moment.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
          {videos.map((video) => (
            <Card key={video.id} className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="flex flex-col h-full">
                {/* Enhanced Video Thumbnail */}
                <VideoThumbnail video={video} momentTypes={momentTypes} />

                {/* Video Info */}
                <div className="flex-grow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-white mb-2 leading-tight">{video.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{video.dateRecorded}</span>
                        <span>•</span>
                        <span>{video.duration}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{video.description}</p>

                  {/* AI Leadership Analysis Preview */}
                  {video.analysis && (
                    <AnalysisToggle analysis={video.analysis} />
                  )}

                  {/* Key Moments Summary */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Key Moments</h4>
                      <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                        {video.keyMoments.length} moments
                      </span>
                    </div>
                    
                    {/* Moment Type Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.from(new Set(video.keyMoments.map(m => m.type))).map((type) => (
                        <span key={type} className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          momentTypes.find(t => t.type === type)?.color || 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0">
                  <div className="flex gap-3">
                    <Button href={`/leadership/${video.id}`} variant="primary" size="sm" className="flex-1">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Watch Video
                    </Button>
                    <Button href="/contact?topic=coaching" variant="outline" size="sm">
                      Book Session
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Video Player Section - Enhanced */}
        <VideoPlayerSection videos={videos} />

        {/* Coaching Approach */}
        <div className="bg-gray-800/50 rounded-xl p-8 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">
              My <span className="gradient-text">Coaching Approach</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Context First</h3>
                <p className="text-sm text-gray-400">
                  Before diving into code, I help developers understand the bigger picture and the problem we&apos;re solving.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Design Before Code</h3>
                <p className="text-sm text-gray-400">
                  We spend time on architecture diagrams and system design before writing any implementation code.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Iterative Growth</h3>
                <p className="text-sm text-gray-400">
                  Regular feedback sessions that focus on architectural decisions and building systems thinking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/20">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Level Up Your <span className="gradient-text">Team</span>?
          </h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            I work with teams to build not just better code, but better architectural thinking. 
            Let&apos;s discuss how I can help your developers think in systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/contact?service=coaching" size="lg">
              Book a Coaching Session
            </Button>
            <Button href="/philosophy" variant="outline" size="lg">
              Learn My Philosophy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 