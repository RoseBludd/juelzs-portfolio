'use client';

import React from 'react';
import Button from './Button';
import Card from './Card';
import { LeadershipVideo } from '@/services/portfolio.service';
import LeadershipAnalysisCard from './LeadershipAnalysisCard';
import SimpleVideoThumbnail from './SimpleVideoThumbnail';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import { useState } from 'react';



interface VideoThumbnailProps {
  video: LeadershipVideo;
  onClick?: () => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, onClick }) => {
  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg mb-6 overflow-hidden border border-gray-700">
      {/* Simple S3-based Video Thumbnail with GPT Vision Analysis */}
      <SimpleVideoThumbnail
        videoKey={video.id}
        videoUrl={video.videoUrl}
        className="w-full h-full"
        showPlayButton={true}
        aspectRatio="video"
        onClick={onClick}
      />
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
  const [showTranscript, setShowTranscript] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [recapContent, setRecapContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleViewTranscript = async () => {
    if (!video.transcript) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/video/${video.id}/transcript`);
      if (response.ok) {
        const content = await response.text();
        setTranscriptContent(content);
        setShowTranscript(true);
      } else {
        console.error('Failed to load transcript');
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecap = async () => {
    if (!video.recap) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/video/${video.id}/recap`);
      if (response.ok) {
        const content = await response.text();
        setRecapContent(content);
        setShowRecap(true);
      } else {
        console.error('Failed to load recap');
      }
    } catch (error) {
      console.error('Error loading recap:', error);
    } finally {
      setLoading(false);
    }
  };

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
              {/* Enhanced Video Player */}
              <div className="mb-6">
                <EnhancedVideoPlayer
                  video={video}
                  autoPlay={false}
                  className="w-full"
                  onTimeUpdate={(time) => console.log('Current time:', time)}
                  onLoadedMetadata={(duration) => console.log('Video duration:', duration)}
                  onMomentClick={(timestamp) => console.log('Jumped to moment:', timestamp)}
                />
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
                    <button 
                      onClick={handleViewTranscript}
                      disabled={loading}
                      className="flex-1 py-2 px-4 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'View Transcript'}
                    </button>
                  )}
                  {video.recap && (
                    <button 
                      onClick={handleViewRecap}
                      disabled={loading}
                      className="flex-1 py-2 px-4 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'View Recap'}
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

      {/* Transcript Modal */}
      {showTranscript && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Transcript - {video.title}</h3>
              <button 
                onClick={() => setShowTranscript(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {transcriptContent}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Recap Modal */}
      {showRecap && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Recap - {video.title}</h3>
              <button 
                onClick={() => setShowRecap(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {recapContent}
              </div>
            </div>
          </div>
        </div>
      )}
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
                >
                  <source src={video.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{video.title}</h4>
                  <p className="text-gray-400 mb-3">Leadership Analysis Complete</p>
                  {video.analysis && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400">{video.analysis.overallRating}/10</div>
                          <div className="text-gray-400">Overall Rating</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400">{video.analysis.strengths.length}</div>
                          <div className="text-gray-400">Strengths</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-400">{video.analysis.areasForImprovement.length}</div>
                          <div className="text-gray-400">Growth Areas</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-gray-500 text-sm">
                    {video.analysis ? 'AI Analysis Available' : 'Transcript & Analysis in Progress'}
                  </p>
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