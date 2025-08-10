'use client';

import React, { useRef, useState, useEffect } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

interface VideoThumbnailProps {
  videoKey: string;
  videoUrl?: string;
  className?: string;
  showPlayButton?: boolean;
  onClick?: () => void;
  seekTime?: number;
  aspectRatio?: 'video' | 'square';
}

const VideoThumbnailTest: React.FC<VideoThumbnailProps> = ({
  videoKey,
  videoUrl,
  className = '',
  showPlayButton = true,
  onClick,
  seekTime = 3,
  aspectRatio = 'video'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(`🔍 [${videoKey.substring(0, 20)}...] ${info}`);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('Component mounted, starting generation...');
    generateThumbnail();
  }, []);

  const generateThumbnail = async () => {
    try {
      addDebugInfo('🎬 Starting thumbnail generation');
      setIsLoading(true);
      setError('');
      
      // Step 1: Get video URL if not provided
      let sourceUrl = videoUrl;
      if (!sourceUrl) {
        addDebugInfo('📡 Fetching video URL from API...');
        const response = await fetch(`/api/video/${videoKey}/url`);
        addDebugInfo(`📊 API response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        sourceUrl = data.url;
        addDebugInfo(`✅ Got video URL: ${sourceUrl.substring(0, 50)}...`);
      }

      if (!sourceUrl) {
        throw new Error('No video URL available');
      }

      // Step 2: Setup video element
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element ref not available');
      }

      addDebugInfo('🎥 Setting up video element...');
      
      // Create a promise for video loading
      const videoLoadPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video load timeout (30s)'));
        }, 30000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          addDebugInfo(`📹 Video loaded: ${video.duration}s, ${video.videoWidth}x${video.videoHeight}`);
          resolve(video);
        };

        video.onerror = (e) => {
          clearTimeout(timeout);
          addDebugInfo(`❌ Video error: ${video.error?.message || 'Unknown video error'}`);
          reject(new Error(`Video load error: ${video.error?.message || 'Unknown'}`));
        };

        // Configure video
        video.src = sourceUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        
        addDebugInfo('🚀 Video load started...');
        video.load();
      });

      // Wait for video to load
      await videoLoadPromise;

      // Step 3: Seek to desired time
      addDebugInfo(`🎯 Seeking to ${seekTime}s...`);
      
      const seekPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Seek timeout (10s)'));
        }, 10000);

        video.onseeked = () => {
          clearTimeout(timeout);
          addDebugInfo(`✅ Seeked to ${video.currentTime}s`);
          resolve(video);
        };

        video.currentTime = Math.min(seekTime, video.duration * 0.1);
      });

      await seekPromise;

      // Step 4: Create canvas and draw frame
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas ref not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      addDebugInfo('🎨 Drawing to canvas...');

      // Set canvas size
      canvas.width = 400;
      canvas.height = aspectRatio === 'square' ? 400 : 225;

      // Clear and draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Check frame quality
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let totalBrightness = 0;
      let sampleCount = 0;

      for (let i = 0; i < pixels.length; i += 40) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        totalBrightness += (r + g + b) / 3;
        sampleCount++;
      }

      const avgBrightness = totalBrightness / sampleCount;
      addDebugInfo(`🔍 Frame brightness: ${avgBrightness.toFixed(1)}`);

      // Step 5: Convert to blob
      addDebugInfo('🔄 Converting to blob...');
      
      const blobPromise = new Promise<string>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            addDebugInfo(`✅ Blob created: ${blob.size} bytes`);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.8);
      });

      const finalUrl = await blobPromise;
      setThumbnailUrl(finalUrl);
      setIsLoading(false);
      addDebugInfo('🎉 Thumbnail generation complete!');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addDebugInfo(`❌ Generation failed: ${errorMsg}`);
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const aspectRatioClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden rounded-lg ${aspectRatioClass} ${className} ${onClick ? 'cursor-pointer' : ''} bg-gray-900`}
      onClick={onClick}
    >
      {/* Hidden video and canvas */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-gray-900 text-xs">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-gray-400 text-center">Generating...</span>
          <div className="text-gray-500 text-center max-w-full overflow-hidden">
            {debugInfo.slice(-2).map((info, idx) => (
              <div key={idx} className="truncate">{info}</div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-red-400 bg-gray-900 p-2">
          <VideoCameraIcon className="w-6 h-6" />
          <span className="text-xs text-center">Failed: {error}</span>
          <div className="text-xs text-gray-500 text-center max-h-16 overflow-y-auto">
            {debugInfo.map((info, idx) => (
              <div key={idx} className="text-xs">{info}</div>
            ))}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              generateThumbnail();
            }}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      {thumbnailUrl && (
        <>
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={() => setError('Image failed to load')}
          />
          
          {showPlayButton && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoThumbnailTest; 