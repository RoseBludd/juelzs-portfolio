'use client';

import React, { useRef, useState, useEffect } from 'react';
import { LeadershipVideo } from '@/services/portfolio.service';

interface EnhancedVideoPlayerProps {
  video: LeadershipVideo;
  autoPlay?: boolean;
  startTime?: number;
  className?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onMomentClick?: (timestamp: string) => void;
}

interface EnhancedVideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
}

const EnhancedVideoPlayer = React.forwardRef<EnhancedVideoPlayerRef, EnhancedVideoPlayerProps>(
  ({ video, autoPlay = false, startTime = 0, className = '', onTimeUpdate, onLoadedMetadata, onMomentClick }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [showMoments, setShowMoments] = useState(false);

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      play: async () => {
        if (videoRef.current) {
          try {
            await videoRef.current.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Error playing video:', error);
          }
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      getIsPlaying: () => isPlaying
    }));

    // Load video URL when component mounts
    useEffect(() => {
      const loadVideoUrl = async () => {
        if (video.id.startsWith('s3-')) {
          try {
            setIsLoading(true);
            console.log('🔄 Loading video URL for player...');
            
            const response = await fetch(`/api/video/${video.id}/url`);
            if (response.ok) {
              const { url } = await response.json();
              setVideoUrl(url);
              console.log('✅ Video URL loaded for player');
            } else {
              console.warn('❌ Failed to get video URL:', response.statusText);
              setHasError(true);
              setIsLoading(false);
            }
          } catch (error) {
            console.error('❌ Error loading video URL:', error);
            setHasError(true);
            setIsLoading(false);
          }
        } else {
          // For manual videos, use the provided URL
          setVideoUrl(video.videoUrl || '');
          setIsLoading(false);
        }
      };

      loadVideoUrl();
    }, [video.id, video.videoUrl]);

    // Set start time when video loads
    useEffect(() => {
      if (videoRef.current && startTime > 0 && duration > 0) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
    }, [startTime, duration]);

    // Auto play if requested
    useEffect(() => {
      if (autoPlay && videoRef.current && videoUrl && !isLoading) {
        videoRef.current.play().catch(console.error);
      }
    }, [autoPlay, videoUrl, isLoading]);

    // Auto-hide controls
    useEffect(() => {
      let hideTimeout: NodeJS.Timeout;
      
      if (isPlaying && showControls) {
        hideTimeout = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
      
      return () => {
        if (hideTimeout) clearTimeout(hideTimeout);
      };
    }, [isPlaying, showControls]);

    // Video event handlers
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        const videoDuration = videoRef.current.duration;
        setDuration(videoDuration);
        setIsLoading(false);
        onLoadedMetadata?.(videoDuration);
        console.log('📹 Video metadata loaded:', { duration: videoDuration, title: video.title });
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      console.error('❌ Video error');
      setHasError(true);
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        const buffered = videoRef.current.buffered.end(0);
        const duration = videoRef.current.duration || 1;
        const progress = (buffered / duration) * 100;
        setLoadProgress(progress);
      }
    };

    // Control handlers
    const togglePlayPause = async () => {
      if (!videoRef.current) return;

      try {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    };

    const seekTo = (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seekTo(newTime);
    };

    const toggleMute = () => {
      if (videoRef.current) {
        const newMuted = !isMuted;
        videoRef.current.muted = newMuted;
        setIsMuted(newMuted);
      }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
      }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        videoRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const parseTimestamp = (timestamp: string): number => {
      const parts = timestamp.split(':');
      if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return 0;
    };

    const jumpToMoment = (timestamp: string) => {
      const seconds = parseTimestamp(timestamp);
      seekTo(seconds);
      if (onMomentClick) {
        onMomentClick(timestamp);
      }
    };

    if (isLoading) {
      return (
        <div className={`aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">Loading video...</h3>
            <p className="text-gray-400 text-sm">Preparing {video.title}</p>
          </div>
        </div>
      );
    }

    if (hasError || !videoUrl) {
      return (
        <div className={`aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-white mb-2">Video unavailable</p>
            <p className="text-gray-400 text-sm">The video file could not be loaded.</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`video-player-container relative ${className}`}>
        {/* Main Video Container */}
        <div 
          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group cursor-pointer"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => !isPlaying || setShowControls(false)}
          onClick={togglePlayPause}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={handleError}
            onProgress={handleProgress}
            preload="metadata"
            playsInline
            crossOrigin="anonymous"
          >
            Your browser does not support the video tag.
          </video>

          {/* Loading Progress Overlay */}
          {loadProgress < 100 && (
            <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              Buffer: {Math.round(loadProgress)}%
            </div>
          )}

          {/* Center Play Button (when paused) */}
          {!isPlaying && showControls && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Video Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative group"
                onClick={handleProgressClick}
              >
                {/* Buffer Progress */}
                <div 
                  className="absolute h-full bg-white/30 rounded-full"
                  style={{ width: `${loadProgress}%` }}
                />
                {/* Play Progress */}
                <div 
                  className="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
                {/* Scrubber */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d={isPlaying ? "M6 4h4v16H6V4zm8 0h4v16h-4V4z" : "M8 5v14l11-7z"}/>
                  </svg>
                </button>

                {/* Time Display */}
                <div className="flex items-center gap-2 text-sm text-white font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Key Moments Toggle */}
                {video.keyMoments.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoments(!showMoments);
                    }}
                    className={`text-sm px-2 py-1 rounded transition-colors ${showMoments ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    {video.keyMoments.length} Moments
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMuted || volume === 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 6l-4 4H4v4h4l4 4V6z" />
                      )}
                    </svg>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Fullscreen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Moments Panel */}
        {showMoments && video.keyMoments.length > 0 && (
          <div className="mt-4 bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Key Moments</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {video.keyMoments.map((moment, index) => (
                <button
                  key={index}
                  onClick={() => jumpToMoment(moment.timestamp)}
                  className="w-full text-left p-2 rounded hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-mono text-sm font-medium min-w-[60px]">
                      {moment.timestamp}
                    </span>
                    <div className="flex-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                        moment.type === 'architecture' ? 'bg-blue-500/20 text-blue-300' :
                        moment.type === 'leadership' ? 'bg-purple-500/20 text-purple-300' :
                        moment.type === 'mentoring' ? 'bg-green-500/20 text-green-300' :
                        'bg-orange-500/20 text-orange-300'
                      }`}>
                        {moment.type}
                      </span>
                      <span className="text-gray-300 text-sm">{moment.description}</span>
                    </div>
                    <svg className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

EnhancedVideoPlayer.displayName = 'EnhancedVideoPlayer';

export default EnhancedVideoPlayer;
export type { EnhancedVideoPlayerRef }; 