import Image from 'next/image';
import { useState, useEffect } from 'react';

interface S3MediaProps {
  url: string;
  type: 'image' | 'video';
  className?: string;
  width?: number;
  height?: number;
  thumbnail?: boolean;
  onLoadComplete?: () => void;
}

const S3Media = ({ url, type, className, width = 800, height = 600, thumbnail = false, onLoadComplete }: S3MediaProps) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isFullSizeImage, setIsFullSizeImage] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Determine if this is a full-size image in a modal
  useEffect(() => {
    if (type === 'image' && !thumbnail && width >= 1000) {
      setIsFullSizeImage(true);
    } else {
      setIsFullSizeImage(false);
    }
  }, [type, thumbnail, width]);

  useEffect(() => {
    // Create a flag to track if this effect is still current
    let isMounted = true;

    const fetchPresignedUrl = async () => {
      try {
        setLoading(true);

        // Check if this is an S3 URL
        if (!url.includes('amazonaws.com')) {
          // If not an S3 URL, use it directly
          console.log('Not an S3 URL, using directly:', url);
          if (isMounted) {
            setMediaUrl(url);
            setLoading(false);
          }
          return;
        }

        // Extract the key from the S3 URL
        // Format: https://bucket-name.s3.amazonaws.com/path/to/file
        const urlParts = url.split('.amazonaws.com/');
        if (urlParts.length !== 2) {
          throw new Error('Invalid S3 URL format');
        }

        const key = urlParts[1];

        // Fetch pre-signed URL from our API
        const response = await fetch(`/api/s3/presigned-url?key=${encodeURIComponent(key)}`, {
          credentials: 'include', // Ensure cookies are sent with the request
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API response not OK:', response.status, errorData);
          throw new Error(errorData.error || 'Failed to get pre-signed URL');
        }

        const data = await response.json();

        // Only update state if component is still mounted
        if (isMounted) {
          setMediaUrl(data.url);
        }
      } catch (err) {
        console.error('Error fetching pre-signed URL:', err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          // Fallback to direct URL if pre-signed URL fails
          console.log('Using fallback direct URL');
          setMediaUrl(url);
          setUsingFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Only call onLoadComplete for images here, videos will call it when they actually load
          if (type === 'image') {
            setTimeout(() => {
              if (onLoadComplete && isMounted) {
                onLoadComplete();
              }
            }, 100);
          }
        }
      }
    };

    fetchPresignedUrl();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [url, type]); // Added type to dependencies

  if (loading) {
    return <div className={`flex items-center justify-center p-4 bg-gray-800 rounded-md ${className || ''}`} style={{ width, height }}>
      <div className="animate-pulse text-white text-sm">Loading...</div>
    </div>;
  }

  if (error) {
    console.warn('S3Media error:', error);
    // Try to render with direct URL anyway
    if (!mediaUrl) {
      return <div className={`flex items-center justify-center p-4 bg-gray-800 rounded-md ${className || ''}`} style={{ width, height }}>
        <div className="text-red-500 text-sm">Failed to load media</div>
      </div>;
    }
  }

  if (!mediaUrl) {
    return <div className={`flex items-center justify-center p-4 bg-gray-800 rounded-md ${className || ''}`} style={{ width, height }}>
      <div className="text-red-500 text-sm">Media URL not available</div>
    </div>;
  }

  // For full-size images in modal, use a regular img tag for better scaling
  if (isFullSizeImage) {
    return (
      <img
        src={mediaUrl}
        alt="Media content"
        className={`${className || ''}`}
        style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
        onLoad={() => {
          if (onLoadComplete) {
            onLoadComplete();
          }
        }}
      />
    );
  }

  // If using fallback URL and this is a video, we need to handle CORS
  if (usingFallback && type === 'video') {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-gray-800 rounded-md ${className || ''}`} style={{ width, height }}>
        <div className="text-amber-400 text-sm mb-2">Secure video playback unavailable</div>
        <div className="text-xs text-gray-400">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            Click to view video in new tab
          </a>
        </div>
      </div>
    );
  }

  // For images or video thumbnails, render an image
  if (type === 'image' || thumbnail) {
    // If it's a video thumbnail, we need to handle it specially
    if (type === 'video' && thumbnail) {
      // For video thumbnails, we'll use a solid color background with a video icon
      // This is more reliable than trying to extract a frame from the video
      return (
        <div
          className={`relative flex items-center justify-center bg-gray-800 ${className || ''}`}
          style={{ width, height }}
        >
          {!thumbnailError ? (
            <Image
              src={mediaUrl}
              alt="Video thumbnail"
              fill
              style={{ objectFit: 'cover' }}
              unoptimized={mediaUrl.includes('amazonaws.com')}
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900"></div>
          )}
        </div>
      );
    }

    return (
      <div className={`relative ${className || ''}`} style={{ width, height }}>
        <Image
          src={mediaUrl}
          alt="Media content"
          fill
          style={{ objectFit: 'cover' }}
          unoptimized={mediaUrl.includes('amazonaws.com')}
          onLoad={() => onLoadComplete && onLoadComplete()}
        />
      </div>
    );
  }

  // For videos (not thumbnails), render a video element
  if (type === 'video') {
    return (
      <video
        src={mediaUrl}
        controls
        className={className}
        width={width}
        height={height}
        style={{ 
          maxWidth: '100%', 
          maxHeight: '70vh',
          objectFit: 'contain', // Ensure proper aspect ratio
          width: '100%',
          height: '100%'
        }}
        onLoadedData={() => {
          if (onLoadComplete) {
            onLoadComplete();
          }
        }}
                onError={(e) => {          console.error('Video failed to load:', mediaUrl, e);          setError('Video failed to load');        }}        onLoadStart={() => {          console.log('Video loading started:', mediaUrl);        }}
        // Add preload attribute to improve loading behavior
        preload="metadata"
        // Add additional video attributes for better UX
        playsInline
        webkit-playsinline="true"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return null;
};

export default S3Media;