'use client';

import React, { useState, useEffect } from 'react';
import SimpleThumbnailService from '@/services/simple-thumbnail.service';
import { PlayIcon } from '@heroicons/react/24/outline';

interface SimpleVideoThumbnailProps {
  videoKey: string;
  videoUrl?: string;
  className?: string;
  showPlayButton?: boolean;
  onClick?: () => void;
  aspectRatio?: 'video' | 'square';
}

const SimpleVideoThumbnail: React.FC<SimpleVideoThumbnailProps> = ({
  videoKey,
  videoUrl,
  className = '',
  showPlayButton = true,
  onClick,
  aspectRatio = 'video'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

  useEffect(() => {
    const loadThumbnail = async () => {
      console.log(`🔍 [${videoKey}] Checking for simple thumbnail...`);
      
      try {
        setIsLoading(true);
        setImageError(false);

        // Try to load existing simple thumbnail from S3
        const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
        const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'genius-untitled';
        const s3Key = `video-thumbnails/${videoKey}/simple-thumbnail.jpg`;
        const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
        
        // Check if image exists by trying to load it
        const img = new Image();
        img.onload = () => {
          console.log(`✅ [${videoKey}] Found existing simple thumbnail: ${s3Url}`);
          setThumbnailUrl(s3Url);
          setIsLoading(false);
        };
        img.onerror = async () => {
          console.log(`⚠️ [${videoKey}] No existing simple thumbnail, generating new one...`);
          
          if (videoUrl) {
            try {
              const thumbnailService = new SimpleThumbnailService();
              const result = await thumbnailService.generateBestThumbnail(videoUrl, videoKey);
              console.log(`✅ [${videoKey}] Generated new simple thumbnail: ${result.s3Url}`);
              setThumbnailUrl(result.s3Url);
            } catch (error) {
              console.error(`❌ [${videoKey}] Failed to generate thumbnail:`, error);
              setImageError(true);
            }
          } else {
            console.log(`❌ [${videoKey}] No video URL provided for generation`);
            setImageError(true);
          }
          setIsLoading(false);
        };
        img.src = s3Url;

      } catch (error) {
        console.error(`❌ [${videoKey}] Error loading thumbnail:`, error);
        setImageError(true);
        setIsLoading(false);
      }
    };

    if (videoKey) {
      loadThumbnail();
    }
  }, [videoKey, videoUrl]);

  const handleImageLoad = () => {
    console.log(`🖼️ [${videoKey}] Thumbnail loaded successfully: ${thumbnailUrl}`);
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log(`❌ [${videoKey}] Thumbnail failed to load: ${thumbnailUrl}`);
    setImageError(true);
    setIsLoading(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative bg-gray-800 rounded-lg ${aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'} ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-300">Loading thumbnail...</span>
        </div>
      </div>
    );
  }

  // Error state - clean placeholder
  if (imageError || !thumbnailUrl) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 ${aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'} ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <div className="w-12 h-12 mb-3 opacity-50">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span className="text-sm text-center px-4">Simple Thumbnail<br/>Not Available</span>
        </div>
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center border-2 border-blue-400 border-opacity-50">
              <PlayIcon className="w-6 h-6 text-blue-400 ml-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Success state - show the simple thumbnail
  return (
    <div className={`relative rounded-lg overflow-hidden ${aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'} ${className} ${onClick ? 'cursor-pointer' : ''}`}
         onClick={onClick}>
      <img
        src={thumbnailUrl}
        alt="Simple generated video thumbnail"
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-black bg-opacity-30 rounded-full flex items-center justify-center border-2 border-white border-opacity-70 hover:bg-opacity-50 transition-all">
            <PlayIcon className="w-6 h-6 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleVideoThumbnail; 