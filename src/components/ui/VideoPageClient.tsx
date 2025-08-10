'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import LeadershipAnalysisCard from './LeadershipAnalysisCard';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import { LeadershipVideo } from '@/services/portfolio.service';

interface VideoPageClientProps {
  video: LeadershipVideo;
}

export default function VideoPageClient({ video }: VideoPageClientProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'timeline' | 'analysis'>('video');
  
  useEffect(() => {
    console.log('🎬 VideoPageClient component mounted with tabs:', {
      videoTitle: video.title,
      keyMomentsCount: video.keyMoments.length,
      hasAnalysis: !!video.analysis,
      analysisRating: video.analysis?.overallRating,
      activeTab: activeTab
    });
  }, [video, activeTab]);

  console.log('🎭 VideoPageClient rendering with activeTab:', activeTab);
  
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg p-2 flex items-center gap-2 border-2 border-blue-500">
        <button
          onClick={() => {
            console.log('🔄 Switching to video tab');
            setActiveTab('video');
          }}
          className={`px-6 py-4 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border-2 ${
            activeTab === 'video'
              ? 'bg-blue-600 text-white border-blue-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Video Player
        </button>
        
        <button
          onClick={() => {
            console.log('🔄 Switching to timeline tab');
            setActiveTab('timeline');
          }}
          className={`px-6 py-4 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border-2 ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white border-blue-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Session Timeline
          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">
            {video.keyMoments.length}
          </span>
        </button>
        
        {video.analysis && (
          <button
            onClick={() => {
              console.log('🔄 Switching to analysis tab');
              setActiveTab('analysis');
            }}
            className={`px-6 py-4 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border-2 ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-gray-700 border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            AI Analysis
            <span className={`ml-2 text-xs px-2 py-1 rounded-full font-bold ${
              video.analysis.overallRating >= 8 ? 'bg-green-500 text-white' :
              video.analysis.overallRating >= 6 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {video.analysis.overallRating}/10
            </span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <Card>
        <div className="min-h-[500px] p-4">
          {activeTab === 'video' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">Video Player</h2>
              
              {/* Enhanced Video Player */}
              <div className="mb-6">
                <EnhancedVideoPlayer
                  video={video}
                  autoPlay={false}
                  className="w-full"
                  onTimeUpdate={(time) => console.log('Video time:', time)}
                  onLoadedMetadata={(duration) => console.log('Video loaded, duration:', duration)}
                  onMomentClick={(timestamp) => {
                    console.log('Jumped to moment:', timestamp);
                    // Switch to timeline tab when moment is clicked
                    setActiveTab('timeline');
                  }}
                />
              </div>

              {/* Video Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </Button>
                  <Button size="sm" variant="outline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timestamps
                  </Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button size="sm" variant="outline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </Button>
                  <Button size="sm" variant="outline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
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
                
                {video.keyMoments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No key moments identified for this session</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && video.analysis && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white">AI Leadership Analysis</h2>
              <LeadershipAnalysisCard analysis={video.analysis} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 