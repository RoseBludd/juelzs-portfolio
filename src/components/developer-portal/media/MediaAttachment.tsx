"use client";

import React, { useState } from 'react';

import S3Media from '../S3Media';
import { getSafeFileName } from '@/utils/fileUtils';
import { extractLoomVideoId, isLoomVideoUrl } from '@/utils/mediaUtils';

import { MediaPreviewModal } from './MediaPreviewModal';

interface MediaAttachmentProps {
  mediaUrl?: string;
  mediaType?: string;
  className?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  fileName?: string;
  size?: number;
}

export default function MediaAttachment({
  mediaUrl,
  mediaType,
  className = '',
  thumbnailWidth = 300,
  thumbnailHeight = 200,
  fileName,
  size
}: MediaAttachmentProps) {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  if (!mediaUrl) return null;
  
  // Check media types
  const isS3Image = mediaUrl.includes('s3.amazonaws.com') && 
    (mediaUrl.toLowerCase().endsWith('.jpg') || 
     mediaUrl.toLowerCase().endsWith('.png') || 
     mediaUrl.toLowerCase().endsWith('.jpeg') || 
     mediaUrl.toLowerCase().endsWith('.gif') ||
     mediaUrl.toLowerCase().endsWith('.webp') ||
     mediaType === 'image');
  
  const isLoomVideo = isLoomVideoUrl(mediaUrl);
  const loomVideoId = extractLoomVideoId(mediaUrl);
  
  const isS3Video = mediaUrl.includes('s3.amazonaws.com') && 
    (mediaUrl.toLowerCase().endsWith('.mp4') || 
     mediaUrl.toLowerCase().endsWith('.mov') || 
     mediaUrl.toLowerCase().endsWith('.avi') ||
     mediaType === 'video');

  const handleOpenPreview = () => {
    const mediaFile = {
      url: mediaUrl,
      type: (isS3Image || mediaType === 'image') ? 'image' as const : 'video' as const,
      fileName: getSafeFileName(fileName, mediaUrl),
      size
    };
    
    setPreviewModalOpen(true);
  };

  const containerClass = `mt-3 rounded-lg overflow-hidden border border-gray-700/50 ${className}`;

  // Handle S3 images
  if (isS3Image) {
    return (
      <>
        <div className={`${containerClass} cursor-pointer`} onClick={handleOpenPreview}>
          <S3Media
            url={mediaUrl}
            type="image"
            width={thumbnailWidth}
            height={thumbnailHeight}
            thumbnail={true}
            className="w-full object-cover"
          />
        </div>
        
        <MediaPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          mediaFiles={[{
            url: mediaUrl,
            type: 'image',
            fileName: getSafeFileName(fileName, mediaUrl),
            size
          }]}
          initialIndex={0}
        />
      </>
    );
  }
  
  // Handle S3 videos
  if (isS3Video) {
    return (
      <>
        <div className={`${containerClass} cursor-pointer bg-gray-800`} onClick={handleOpenPreview}>
          <div className="relative aspect-video flex items-center justify-center">
            <div className="bg-blue-500/70 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 bg-gray-900/80 text-white text-xs py-1 px-2 rounded">
              S3 Video
            </div>
          </div>
        </div>
        
        <MediaPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          mediaFiles={[{
            url: mediaUrl,
            type: 'video',
            fileName: getSafeFileName(fileName, mediaUrl),
            size
          }]}
          initialIndex={0}
        />
      </>
    );
  }
  
  // Handle Loom videos
  if (isLoomVideo && loomVideoId) {
    return (
      <div className={containerClass}>
        <div className="relative aspect-video rounded-lg border border-gray-700/50">
          <iframe
            src={`https://www.loom.com/embed/${loomVideoId}`}
            frameBorder="0"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-lg"
          />
        </div>
      </div>
    );
  }
  
  // Handle other file types
  return (
    <div className={containerClass}>
      <a 
        href={mediaUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block p-4 bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-blue-400 hover:underline">
            {fileName || 'View Attachment'}
          </span>
        </div>
      </a>
    </div>
  );
} 