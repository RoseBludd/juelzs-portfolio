'use client';

import React, { useRef, useState, useEffect } from 'react';
import { LeadershipVideo } from '@/services/portfolio.service';

interface VideoPlayerProps {
  video: LeadershipVideo;
  autoPlay?: boolean;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}

interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
}

const VideoPlayer = React.forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ video, autoPlay = false, startTime = 0, onTimeUpdate, onLoadedMetadata }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [loadingStep, setLoadingStep] = useState<'url' | 'metadata' | 'ready'>('url');
    const [fileSize, setFileSize] = useState<number>(0);
    const [loadProgress, setLoadProgress] = useState(0);

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
            setLoadingStep('url');
            console.log('🔄 Step 1: Getting signed URL for video...');
            
            // Get fresh signed URL for the video
            const startTime = Date.now();
            const response = await fetch(`/api/video/${video.id}/url`);
            const urlLoadTime = Date.now() - startTime;
            
                          if (response.ok) {
                const { url, fileSize: size, title } = await response.json();
                setVideoUrl(url);
                setFileSize(size || 0);
                console.log('🎬 Step 1 Complete: Loaded video URL for:', title, {
                  loadTimeMs: urlLoadTime,
                  fileSizeMB: Math.round((size || 0) / 1024 / 1024),
                  urlPreview: url.substring(0, 100) + '...'
                });
                setLoadingStep('metadata');
                
                // Force video element to start loading
                setTimeout(() => {
                  if (videoRef.current && url) {
                    console.log('🔄 Forcing video load...');
                    videoRef.current.load();
                  }
                }, 100);
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
          setVideoUrl(video.videoUrl);
          setLoadingStep('ready');
          setIsLoading(false);
        }
      };

      loadVideoUrl();
    }, [video.id, video.videoUrl, video.title]);

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

    // Add loading timeout
    useEffect(() => {
      if (videoUrl && isLoading) {
        const timeout = setTimeout(() => {
          if (isLoading) {
            console.warn('⚠️ Video loading timeout - taking longer than expected');
            console.log('📹 Current video state:', {
              src: videoRef.current?.currentSrc,
              networkState: videoRef.current?.networkState,
              readyState: videoRef.current?.readyState,
              loadingStep
            });
            // Don't set error, just log the warning
          }
        }, 30000); // 30 second timeout

        return () => clearTimeout(timeout);
      }
    }, [videoUrl, isLoading, loadingStep]);

    // Video event handlers
    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        const videoDuration = videoRef.current.duration;
        setDuration(videoDuration);
        setLoadingStep('ready');
        setIsLoading(false);
        onLoadedMetadata?.(videoDuration);
        console.log('📹 Step 2 Complete: Video metadata loaded:', { 
          duration: videoDuration, 
          title: video.title,
          fileSizeMB: Math.round(fileSize / 1024 / 1024)
        });
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
      console.log('▶️ Video playing');
    };

    const handlePause = () => {
      setIsPlaying(false);
      console.log('⏸️ Video paused');
    };

    const handleError = (error: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.error('❌ Video error:', error);
      console.error('❌ Video element details:', {
        currentSrc: videoRef.current?.currentSrc,
        networkState: videoRef.current?.networkState,
        readyState: videoRef.current?.readyState,
        error: videoRef.current?.error
      });
      setHasError(true);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log('🔄 Step 2: Loading video metadata...');
      console.log('📹 Video element state:', {
        src: videoRef.current?.currentSrc,
        networkState: videoRef.current?.networkState,
        readyState: videoRef.current?.readyState
      });
    };

    const handleProgress = () => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        const buffered = videoRef.current.buffered.end(0);
        const duration = videoRef.current.duration || 1;
        const progress = (buffered / duration) * 100;
        setLoadProgress(progress);
        console.log('📊 Buffer progress:', Math.round(progress) + '%');
      }
    };

    // Format time helper
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Toggle play/pause
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

    // Seek to specific time
    const seekTo = (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    // Progress bar click handler
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seekTo(newTime);
    };

    if (isLoading) {
      const fileSizeMB = Math.round(fileSize / 1024 / 1024);
      
      return (
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            
            <h3 className="text-white font-medium mb-2">
              {loadingStep === 'url' && 'Getting video from S3...'}
              {loadingStep === 'metadata' && 'Loading video data...'}
              {loadingStep === 'ready' && 'Preparing playback...'}
            </h3>
            
            <p className="text-gray-400 text-sm mb-4">
              {loadingStep === 'url' && 'Connecting to AWS S3 storage'}
              {loadingStep === 'metadata' && (
                <>
                  Processing {fileSizeMB}MB video file
                  <br />
                  <span className="text-xs">This may take a moment for large files...</span>
                </>
              )}
              {loadingStep === 'ready' && 'Almost ready to play'}
            </p>
            
            {/* Progress indicator */}
            {loadingStep === 'metadata' && loadProgress > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(loadProgress, 100)}%` }}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Buffer: {Math.round(loadProgress)}%
                </p>
              </div>
            )}
            
            {fileSizeMB > 0 && (
              <p className="text-xs text-gray-500 mb-4">
                File size: {fileSizeMB}MB
              </p>
            )}
            
            {loadingStep === 'metadata' && (
              <button 
                onClick={() => {
                  console.log('🔄 Manual retry requested');
                  if (videoRef.current && videoUrl) {
                    videoRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Retry Loading
              </button>
            )}
          </div>
        </div>
      );
    }

    if (hasError || !videoUrl) {
      return (
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
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
      <div className="video-player-container">
        {/* Main Video Element */}
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
          <video
            ref={videoRef}
            src={videoUrl} // Direct src instead of source element
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={handleError}
            onLoadStart={handleLoadStart}
            onProgress={handleProgress}
            onCanPlay={() => console.log('📹 Video can start playing')}
            onWaiting={() => console.log('📹 Video is waiting for more data')}
            onSuspend={() => console.log('📹 Video loading suspended')}
            onStalled={() => console.log('📹 Video loading stalled')}
            preload="metadata"
            playsInline
            crossOrigin="anonymous"
          >
            Your browser does not support the video tag.
          </video>

          {/* Video Overlay Controls */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d={isPlaying ? "M6 4h4v16H6V4zm8 0h4v16h-4V4z" : "M8 5v14l11-7z"}/>
              </svg>
            </button>
          </div>
        </div>

        {/* Custom Video Controls */}
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-150"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg"
                style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d={isPlaying ? "M6 4h4v16H6V4zm8 0h4v16h-4V4z" : "M8 5v14l11-7z"}/>
                </svg>
              </button>

              {/* Time Display */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="font-mono">{formatTime(currentTime)}</span>
                <span>/</span>
                <span className="font-mono">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume and Settings */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 6l-4 4H4v4h4l4 4V6z" />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
export type { VideoPlayerRef }; 