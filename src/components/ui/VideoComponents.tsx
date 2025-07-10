'use client';

import React from 'react';
import Button from './Button';
import Card from './Card';
import { LeadershipVideo } from '@/services/portfolio.service';
import LeadershipAnalysisCard from './LeadershipAnalysisCard';
import { useState } from 'react';

interface MomentType {
  type: string;
  label: string;
  color: string;
}

interface VideoThumbnailProps {
  video: LeadershipVideo;
  momentTypes: MomentType[];
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, momentTypes }) => {
  const getPrimaryMomentType = () => {
    if (video.keyMoments.length === 0) return 'technical';
    const typeCounts = video.keyMoments.reduce((acc: Record<string, number>, moment) => {
      acc[moment.type] = (acc[moment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
  };

  const primaryType = getPrimaryMomentType();
  const momentType = momentTypes.find(t => t.type === primaryType);

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'architecture':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'leadership':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'mentoring':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'technical':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        );
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'architecture':
        return 'from-blue-500/20 via-blue-600/30 to-cyan-500/20';
      case 'leadership':
        return 'from-purple-500/20 via-purple-600/30 to-pink-500/20';
      case 'mentoring':
        return 'from-green-500/20 via-green-600/30 to-emerald-500/20';
      case 'technical':
        return 'from-orange-500/20 via-orange-600/30 to-red-500/20';
      default:
        return 'from-gray-500/20 via-gray-600/30 to-gray-500/20';
    }
  };

  const handleWatchClick = () => {
    // Hide all video players first
    const allVideoElements = document.querySelectorAll('[id^="video-"]');
    allVideoElements.forEach(el => el.classList.add('hidden'));
    
    // Show the selected video player
    const videoElement = document.getElementById(`video-${video.id}`);
    if (videoElement) {
      videoElement.classList.remove('hidden');
      videoElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center relative overflow-hidden border border-gray-700">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(primaryType)}`} />
      
      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Category icon */}
        <div className={`w-16 h-16 ${momentType?.color || 'bg-gray-500/20 text-gray-300'} rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm`}>
          {getCategoryIcon(primaryType)}
        </div>
        
        {/* Video info */}
        <div className="px-4">
          <h4 className="text-white font-semibold text-lg mb-2 line-clamp-2">
            {video.title}
          </h4>
          <p className="text-gray-300 text-sm mb-3">
            Duration: {video.duration}
          </p>
          
          {/* Participants preview */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-300">J</span>
              </div>
              <span className="text-gray-400 text-sm">+{video.participants.length - 1}</span>
            </div>
          </div>
          
          {/* Key moments count */}
          <div className="flex justify-center items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {video.keyMoments.length} key moments
          </div>
        </div>
      </div>
      
      {/* Play button overlay */}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleWatchClick}
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Watch Now
        </Button>
      </div>
      
      {/* Category badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${momentType?.color || 'bg-gray-500/20 text-gray-300'} backdrop-blur-sm`}>
          {momentType?.label || 'Technical'}
        </span>
      </div>
    </div>
  );
};



interface VideoPlayerProps {
  video: LeadershipVideo;
  onClose: () => void;
}

const getCategoryStyle = (type: string) => {
  switch (type) {
    case 'architecture':
      return 'bg-blue-500/20 text-blue-300';
    case 'leadership':
      return 'bg-purple-500/20 text-purple-300';
    case 'mentoring':
      return 'bg-green-500/20 text-green-300';
    case 'technical':
      return 'bg-orange-500/20 text-orange-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
};

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-gray-900 rounded-lg">
        {/* Video Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-white">{video.title}</h3>
            <p className="text-gray-400">{video.duration} • {video.participants.join(', ')}</p>
          </div>
          <div className="flex items-center gap-3">
            {video.analysis && (
              <button 
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showAnalysis 
                    ? 'bg-purple-500/30 text-purple-300' 
                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                }`}
              >
                {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Main Content Area */}
          <div className={`grid gap-6 ${showAnalysis && video.analysis ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Video Section */}
            <div>
              {/* Video Player */}
              <div className="bg-black rounded-lg mb-6 aspect-video flex items-center justify-center">
                {video.videoUrl ? (
                  <video 
                    controls 
                    className="w-full h-full rounded-lg"
                    preload="metadata"
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p>Video content coming soon</p>
                  </div>
                )}
              </div>

              {/* Video Description */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                <p className="text-gray-300">{video.description}</p>
              </div>

              {/* Key Moments */}
              {video.keyMoments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Key Moments</h4>
                  <div className="space-y-3">
                    {video.keyMoments.map((moment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                        <span className="text-blue-400 font-mono text-sm mt-1">{moment.timestamp}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(moment.type)}`}>
                              {moment.type}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{moment.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Content */}
              {(video.transcript || video.recap) && (
                <div className="flex gap-3">
                  {video.transcript && (
                    <button className="flex-1 py-2 px-4 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors">
                      View Transcript
                    </button>
                  )}
                  {video.recap && (
                    <button className="flex-1 py-2 px-4 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors">
                      View Recap
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Analysis Section */}
            {showAnalysis && video.analysis && (
              <div>
                <LeadershipAnalysisCard 
                  analysis={video.analysis}
                  onReanalyze={() => {
                    // TODO: Implement re-analysis functionality
                    console.log('Re-analyzing video:', video.id);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VideoPlayerSectionProps {
  videos: LeadershipVideo[];
}

export const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({ videos }) => {
  const handleCloseVideo = (videoId: string) => {
    const videoElement = document.getElementById(`video-${videoId}`);
    if (videoElement) {
      videoElement.classList.add('hidden');
    }
  };

  return (
    <div className="mb-16">
      {videos.map((video) => (
        <div key={video.id} id={`video-${video.id}`} className="hidden">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Now Playing: {video.title}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCloseVideo(video.id)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <div className="aspect-video bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
              {video.videoUrl ? (
                <video
                  controls
                  className="w-full h-full rounded-lg"
                  poster={`/api/video-thumbnail/${video.id}`}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-2">Video integration in progress</p>
                  <p className="text-gray-500 text-sm">S3 video loading will be implemented here</p>
                </div>
              )}
            </div>
            
            {/* Video controls and info */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Duration: {video.duration}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-400">{video.participants.length} participants</span>
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
        </div>
      ))}
    </div>
  );
}; 