'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import VideoThumbnail from './VideoThumbnail';
import EnhancedVideoPlayer, { EnhancedVideoPlayerRef } from './EnhancedVideoPlayer';
import LeadershipAnalysisCard from './LeadershipAnalysisCard';
import { LeadershipVideo } from '@/services/portfolio.service';

interface ModernSessionPageProps {
  video: LeadershipVideo;
}

type TabType = 'overview' | 'player' | 'moments' | 'analysis' | 'insights';

export default function ModernSessionPage({ video }: ModernSessionPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedMoment, setSelectedMoment] = useState<number | null>(null);
  const playerRef = useRef<EnhancedVideoPlayerRef>(null);

  useEffect(() => {
    console.log('🆕 ModernSessionPage mounted:', {
      videoId: video.id,
      title: video.title,
      keyMoments: video.keyMoments.length,
      hasAnalysis: !!video.analysis
    });
  }, [video]);

  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMomentClick = (momentIndex: number) => {
    const moment = video.keyMoments[momentIndex];
    const seconds = parseTimestamp(moment.timestamp);
    
    setSelectedMoment(momentIndex);
    
    if (activeTab !== 'player') {
      setActiveTab('player');
    }
    
    // Give time for tab switch before seeking
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(seconds);
        playerRef.current.play();
      }
    }, 100);
  };

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      count: null
    },
    {
      id: 'player' as TabType,
      label: 'Video',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      ),
      count: null
    },
    {
      id: 'moments' as TabType,
      label: 'Key Moments',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: video.keyMoments.length
    },
    {
      id: 'analysis' as TabType,
      label: 'AI Analysis',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      count: video.analysis ? Math.round(video.analysis.overallRating) : null,
      disabled: !video.analysis
    },
    {
      id: 'insights' as TabType,
      label: 'Learning Insights',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      count: null
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero Section with Enhanced Thumbnail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
                  <p className="text-gray-300 text-lg leading-relaxed">{video.description}</p>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {video.duration}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {video.dateRecorded}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {video.keyMoments.length} key moments
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => setActiveTab('player')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Watch Session
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('moments')}
                    variant="outline"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View Moments
                  </Button>
                </div>
              </div>

              {/* Enhanced AI Thumbnail */}
              <div className="space-y-4">
                <VideoThumbnail
                  videoKey={video.id}
                  videoUrl={video.videoUrl}
                  className="w-full rounded-xl shadow-2xl"
                  showPlayButton={true}
                  onClick={() => setActiveTab('player')}
                  aspectRatio="video"
                  seekTime={5}
                />
                
                {video.analysis && (
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-green-400">AI Leadership Score</h3>
                        <p className="text-gray-300 text-xs">Based on communication, decision-making, and technical guidance</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {video.analysis.overallRating}/10
                        </div>
                        <div className="text-xs text-gray-400">Excellent</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Moments Preview */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Featured Moments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {video.keyMoments.slice(0, 4).map((moment, index) => (
                  <div
                    key={index}
                    onClick={() => handleMomentClick(index)}
                    className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">
                        {moment.timestamp}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            moment.type === 'architecture' ? 'bg-blue-500/20 text-blue-300' :
                            moment.type === 'leadership' ? 'bg-purple-500/20 text-purple-300' :
                            moment.type === 'mentoring' ? 'bg-green-500/20 text-green-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {moment.type}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm group-hover:text-white transition-colors">
                          {moment.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {video.keyMoments.length > 4 && (
                <Button 
                  onClick={() => setActiveTab('moments')}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  View All {video.keyMoments.length} Moments
                </Button>
              )}
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Video Player</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {formatTime(currentTime)} / {video.duration}
                </span>
                <Button 
                  onClick={() => setActiveTab('moments')}
                  variant="outline" 
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Jump to Moments
                </Button>
              </div>
            </div>
            
            <EnhancedVideoPlayer
              ref={playerRef}
              video={video}
              autoPlay={false}
              className="w-full"
              onTimeUpdate={setCurrentTime}
              onLoadedMetadata={(duration) => console.log('Video loaded:', duration)}
              onMomentClick={(timestamp) => {
                console.log('Moment clicked:', timestamp);
                setActiveTab('moments');
              }}
            />
            
            {selectedMoment !== null && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">
                    {video.keyMoments[selectedMoment].timestamp}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Current Moment</h3>
                    <p className="text-gray-300 text-sm">{video.keyMoments[selectedMoment].description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'moments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Key Moments Timeline</h2>
              <Button 
                onClick={() => setActiveTab('player')}
                variant="outline" 
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Video
              </Button>
            </div>
            
            <div className="space-y-4">
              {video.keyMoments.map((moment, index) => (
                <div
                  key={index}
                  onClick={() => handleMomentClick(index)}
                  className="bg-gray-800/50 rounded-lg p-6 hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-blue-500/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-200">
                        <span className="text-blue-400 font-mono text-sm font-semibold">
                          {moment.timestamp}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-grow space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {moment.description}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          moment.type === 'architecture' ? 'bg-blue-500/20 text-blue-300' :
                          moment.type === 'leadership' ? 'bg-purple-500/20 text-purple-300' :
                          moment.type === 'mentoring' ? 'bg-green-500/20 text-green-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {moment.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm leading-relaxed">
                        See how I approach {moment.type} decisions in real-time. This moment showcases practical application of leadership principles.
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Click to jump to this moment in the video
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {video.keyMoments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">No Key Moments</h3>
                  <p>This session hasn&apos;t been analyzed for key moments yet.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">AI Leadership Analysis</h2>
            {video.analysis ? (
              <LeadershipAnalysisCard analysis={video.analysis} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Analysis Coming Soon</h3>
                <p>AI analysis for this session is being generated.</p>
              </div>
            )}
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Learning Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">What You&apos;ll Learn</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>How I approach architectural decision-making in real-time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>My coaching methodology for building systems thinking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Techniques for leading technical discussions effectively</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Balancing technical depth with strategic thinking</span>
                  </li>
                </ul>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Session Focus Areas</h3>
                <div className="space-y-3">
                  {Array.from(new Set(video.keyMoments.map(m => m.type))).map((type: string) => {
                    const count = video.keyMoments.filter(m => m.type === type).length;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          type === 'architecture' ? 'bg-blue-500/20 text-blue-300' :
                          type === 'leadership' ? 'bg-purple-500/20 text-purple-300' :
                          type === 'mentoring' ? 'bg-green-500/20 text-green-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          {type}
                        </span>
                        <span className="text-gray-400 text-sm">{count} moment{count !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Apply This to Your Team</h3>
              <p className="text-gray-300 mb-6">
                Ready to bring this level of leadership and technical guidance to your development team? 
                I offer personalized coaching sessions that help teams build stronger architectural thinking and collaborative practices.
              </p>
              <div className="flex gap-4">
                <Button href="/contact?topic=coaching" className="bg-gradient-to-r from-green-500 to-blue-500">
                  Book Team Coaching
                </Button>
                <Button href="/philosophy" variant="outline">
                  Learn My Approach
                </Button>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Tab Navigation */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-gray-700/50">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : tab.disabled
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <Card className="min-h-[600px]">
        <div className="p-8">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  );
} 