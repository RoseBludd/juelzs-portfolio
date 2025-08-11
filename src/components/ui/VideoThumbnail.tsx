'use client';

import React, { useRef, useState, useEffect } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
// Re-enabled for permanent caching
import VideoThumbnailCacheService from '@/services/video-thumbnail-cache.service';

interface VideoThumbnailProps {
  videoKey: string;
  videoUrl?: string;
  className?: string;
  showPlayButton?: boolean;
  onClick?: () => void;
  seekTime?: number; // Time in seconds to seek to for thumbnail
  aspectRatio?: 'video' | 'square'; // Default to video aspect ratio
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoKey,
  videoUrl,
  className = '',
  showPlayButton = true,
  onClick,
  seekTime = 3, // Simplified default
  aspectRatio = 'video'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [seekProgress, setSeekProgress] = useState<string>('');

  const addDebugInfo = (info: string) => {
    console.log(`🔍 [${videoKey.substring(0, 20)}...] ${info}`);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Send diagnostic data to main application API
  const sendDiagnostic = async (data: any) => {
    try {
      await fetch('/api/admin/thumbnail-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoKey, ...data })
      });
    } catch (error) {
      // Silently fail if diagnostic endpoint not available
    }
  };

  useEffect(() => {
    addDebugInfo('Component mounted, checking cache first...');
    checkCacheAndGenerate();
  }, []);

  const checkCacheAndGenerate = async () => {
    try {
      // STEP 1: Check for SHOWCASED THUMBNAILS first (highest priority)
      addDebugInfo('🎯 [SHOWCASED CHECK] Looking for showcased thumbnail...');
      addDebugInfo(`🎯 [SHOWCASED CHECK] Video key: ${videoKey}`);
      
      try {
        const showcasedResponse = await fetch(`/api/showcased-thumbnails?videoKey=${videoKey}`);
        if (showcasedResponse.ok) {
          const showcasedData = await showcasedResponse.json();
          if (showcasedData.success && showcasedData.thumbnails?.options?.length > 0) {
            const selectedIndex = showcasedData.thumbnails.selectedOption - 1;
            const selectedThumbnail = showcasedData.thumbnails.options[selectedIndex] || showcasedData.thumbnails.options[0];
            
            addDebugInfo(`🏆 [SHOWCASED SUCCESS] Found showcased thumbnail!`);
            addDebugInfo(`🏆 [SHOWCASED SUCCESS] Option: ${selectedThumbnail.optionNumber}, Score: ${selectedThumbnail.combinedScore}`);
            addDebugInfo(`🏆 [SHOWCASED SUCCESS] URL: ${selectedThumbnail.s3Url.substring(0, 50)}...`);
            
            setThumbnailUrl(selectedThumbnail.s3Url);
            setIsLoading(false);
            return;
          }
        }
             } catch {
         addDebugInfo('⚠️ [SHOWCASED ERROR] Failed to check showcased thumbnails');
       }
      
      addDebugInfo('⚠️ [SHOWCASED MISS] No showcased thumbnail found');

      // STEP 2: Check for COMPREHENSIVE AI THUMBNAILS (second priority)
      addDebugInfo('🎯 [COMPREHENSIVE CHECK] Looking for best AI thumbnail...');
      
      const cacheService = VideoThumbnailCacheService.getInstance();
      const comprehensiveThumbnail = await cacheService.getBestComprehensiveThumbnail(videoKey);
      
      if (comprehensiveThumbnail) {
        addDebugInfo(`🏆 [COMPREHENSIVE SUCCESS] Found AI thumbnail!`);
        addDebugInfo(`🏆 [COMPREHENSIVE SUCCESS] Score: ${comprehensiveThumbnail.comprehensiveScore}`);
        addDebugInfo(`🏆 [COMPREHENSIVE SUCCESS] Seek time: ${comprehensiveThumbnail.seekTime}s`);
        addDebugInfo(`🏆 [COMPREHENSIVE SUCCESS] URL: ${comprehensiveThumbnail.thumbnailUrl.substring(0, 50)}...`);
        
        setThumbnailUrl(comprehensiveThumbnail.thumbnailUrl);
        setIsLoading(false);
        return;
      } else {
        addDebugInfo('⚠️ [COMPREHENSIVE MISS] No AI thumbnail found');
      }

      // STEP 3: Check REGULAR CACHE (fallback)
      addDebugInfo('🔍 [CACHE CHECK] Checking regular cache...');
      
      const cachedThumbnail = await cacheService.getCachedThumbnail(videoKey);
      addDebugInfo(`🔍 [CACHE CHECK] Cache lookup result: ${cachedThumbnail ? 'FOUND' : 'NOT FOUND'}`);
      
      if (cachedThumbnail) {
        addDebugInfo(`🔍 [CACHE CHECK] Cached URL: ${cachedThumbnail.thumbnailUrl.substring(0, 50)}...`);
        addDebugInfo(`🔍 [CACHE CHECK] Generated at: ${cachedThumbnail.generatedAt}`);
        addDebugInfo(`🔍 [CACHE CHECK] Seek time: ${cachedThumbnail.seekTime}s`);
        
        const isExpired = cacheService.isThumbnailExpired(cachedThumbnail);
        addDebugInfo(`🔍 [CACHE CHECK] Is expired: ${isExpired}`);
        
        if (!isExpired) {
          addDebugInfo('✅ [CACHE SUCCESS] Using cached thumbnail!');
          setThumbnailUrl(cachedThumbnail.thumbnailUrl);
          setIsLoading(false);
          return;
        } else {
          addDebugInfo('⚠️ [CACHE EXPIRED] Cached thumbnail is expired');
        }
      } else {
        addDebugInfo('❌ [CACHE MISS] No cached thumbnail found');
      }
      
      // STEP 3: LAST RESORT - Generate new thumbnail
      addDebugInfo('🎬 [FALLBACK] Starting thumbnail generation...');
      addDebugInfo('💡 [SUGGESTION] Consider generating comprehensive AI thumbnails for this video');
      generateThumbnail();
    } catch (error) {
      addDebugInfo(`⚠️ [ERROR] Cache check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      generateThumbnail();
    }
  };

    const generateThumbnail = async () => {
    let isMounted = true;
    let videoElement: HTMLVideoElement | null = null;
    
    try {
      addDebugInfo('🎬 Starting thumbnail generation');
      
      // Get presigned URL for video (same as working gallery)
      let sourceUrl = videoUrl;
      if (!sourceUrl) {
        addDebugInfo('📡 Fetching video URL from API...');
        const response = await fetch(`/api/video/${videoKey}/url`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to get video URL');
        }
        
        sourceUrl = data.url;
        if (sourceUrl) {
          addDebugInfo(`✅ Got video URL: ${String(sourceUrl).substring(0, 50)}...`);
        }
      }

      if (!sourceUrl) {
        throw new Error('No video URL available');
      }

      if (!isMounted) return; // Component was unmounted
      
      // Create video element (same pattern as working gallery)
      videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.muted = true;
      videoElement.preload = 'metadata';
      videoElement.playsInline = true; // Important for mobile
      
      addDebugInfo('📹 Created video element, setting up events');
      
                     // Smart seeking variables for aggressive generation
        let seekAttempts = 0;
        const maxSeekAttempts = 20; // Aggressive smart generation
        // More strategic spread - early, middle, and late times
        const seekTimes = [2, 5, 10, 15, 25, 45, 60, 90, 120, 180, 240, 300, 360, 450, 600, 750, 900, 1200, 1500, 1800];
        
        // Best-of-the-best mode: collect multiple thumbnails and score them
        const bestMode = true; // Always use best mode for highest quality
        const minAttempts = bestMode ? 10 : 1;
        let collectedThumbnails: Array<{
          blob: Blob;
          brightness: number;
          contrast: number;
          detail: number;
          colorDistribution: number;
          totalScore: number;
          seekTime: number;
          attempt: number;
        }> = [];

       videoElement.onloadedmetadata = () => {
         if (!isMounted) return;
         addDebugInfo(`📊 Video metadata loaded, duration: ${videoElement!.duration}, size: ${videoElement!.videoWidth}x${videoElement!.videoHeight}`);
                   // Start with first seek attempt
          const initialSeekTime = Math.min(3, videoElement!.duration * 0.1);
          addDebugInfo(`⏭️ Starting smart generation - seeking to: ${initialSeekTime}s (attempt 1/${maxSeekAttempts})`);
          setSeekProgress(`Analyzing video... (1/${maxSeekAttempts})`);
          videoElement!.currentTime = initialSeekTime;
       };

               // Advanced pixel analysis functions for best-of-the-best selection
        const analyzeContrast = (pixels: Uint8ClampedArray): number => {
          let minBrightness = 255;
          let maxBrightness = 0;
          
          for (let i = 0; i < pixels.length; i += 4) {
            const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);
          }
          
          return maxBrightness - minBrightness; // Higher = better contrast
        };

        const analyzeDetail = (pixels: Uint8ClampedArray, width: number, height: number): number => {
          let edgeStrength = 0;
          const sobelThreshold = 50;
          
          // Simplified Sobel edge detection
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;
              
              // Get surrounding pixels
              const tl = (pixels[((y-1) * width + (x-1)) * 4] + pixels[((y-1) * width + (x-1)) * 4 + 1] + pixels[((y-1) * width + (x-1)) * 4 + 2]) / 3;
              const tr = (pixels[((y-1) * width + (x+1)) * 4] + pixels[((y-1) * width + (x+1)) * 4 + 1] + pixels[((y-1) * width + (x+1)) * 4 + 2]) / 3;
              const bl = (pixels[((y+1) * width + (x-1)) * 4] + pixels[((y+1) * width + (x-1)) * 4 + 1] + pixels[((y+1) * width + (x-1)) * 4 + 2]) / 3;
              const br = (pixels[((y+1) * width + (x+1)) * 4] + pixels[((y+1) * width + (x+1)) * 4 + 1] + pixels[((y+1) * width + (x+1)) * 4 + 2]) / 3;
              
              const gx = (tr + br) - (tl + bl);
              const gy = (bl + br) - (tl + tr);
              const magnitude = Math.sqrt(gx * gx + gy * gy);
              
              if (magnitude > sobelThreshold) {
                edgeStrength += magnitude;
              }
            }
          }
          
          return edgeStrength / (width * height); // Normalized edge strength
        };

        const analyzeColorDistribution = (pixels: Uint8ClampedArray): number => {
          const colorBuckets = { red: 0, green: 0, blue: 0, gray: 0 };
          let totalPixels = 0;
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // Determine dominant color
            if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
              colorBuckets.gray++;
            } else if (r > g && r > b) {
              colorBuckets.red++;
            } else if (g > r && g > b) {
              colorBuckets.green++;
            } else {
              colorBuckets.blue++;
            }
            totalPixels++;
          }
          
          // Calculate color diversity (lower gray percentage = better)
          const grayPercentage = colorBuckets.gray / totalPixels;
          return (1 - grayPercentage) * 100; // Higher = more colorful
        };

        const calculateThumbnailScore = (brightness: number, contrast: number, detail: number, colorDist: number): number => {
          // Weighted scoring system
          const weights = {
            brightness: 0.25,      // 25% - optimal range 30-200
            contrast: 0.30,        // 30% - higher is better
            detail: 0.25,          // 25% - higher is better  
            colorDistribution: 0.20 // 20% - higher is better
          };
          
          // Normalize scores to 0-100 range
          const normalizedBrightness = brightness >= 30 && brightness <= 200 ? 
            100 - Math.abs(115 - brightness) : Math.max(0, 100 - Math.abs(115 - brightness));
          const normalizedContrast = Math.min(100, (contrast / 255) * 100);
          const normalizedDetail = Math.min(100, detail);
          const normalizedColorDist = Math.min(100, colorDist);
          
          return (
            normalizedBrightness * weights.brightness +
            normalizedContrast * weights.contrast +
            normalizedDetail * weights.detail +
            normalizedColorDist * weights.colorDistribution
          );
        };

        const attemptThumbnailGeneration = () => {
          if (!isMounted) return;
          addDebugInfo(`✅ Video seeked to: ${videoElement!.currentTime}s (attempt ${seekAttempts + 1}/${maxSeekAttempts})`);
          
          const canvas = canvasRef.current;
          if (!canvas) {
            addDebugInfo('❌ Canvas not found');
            return;
          }
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            addDebugInfo('❌ Canvas context not found');
            return;
          }
          
          addDebugInfo('🎨 Drawing frame and analyzing quality...');
         
         // Set canvas size based on aspect ratio
         if (aspectRatio === 'square') {
           canvas.width = 400;
           canvas.height = 400;
         } else {
           canvas.width = 400;
           canvas.height = 225; // 16:9 aspect ratio
         }
         
         // Draw video frame to canvas
         ctx.drawImage(
           videoElement!,
           0, 0, videoElement!.videoWidth, videoElement!.videoHeight,
           0, 0, canvas.width, canvas.height
         );
         
         // Analyze frame quality (check if it's mostly black)
         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
         const pixels = imageData.data;
         let totalBrightness = 0;
         let sampleCount = 0;
         
         // Sample every 10th pixel to check brightness
         for (let i = 0; i < pixels.length; i += 40) { // 40 = 4 channels * 10 pixels
           const r = pixels[i];
           const g = pixels[i + 1];
           const b = pixels[i + 2];
           const brightness = (r + g + b) / 3;
           totalBrightness += brightness;
           sampleCount++;
         }
         
                                       const averageBrightness = totalBrightness / sampleCount;
                    
                    // Advanced analysis for best-of-the-best mode
                    const contrast = analyzeContrast(pixels);
                    const detail = analyzeDetail(pixels, canvas.width, canvas.height);
                    const colorDist = analyzeColorDistribution(pixels);
                    const totalScore = calculateThumbnailScore(averageBrightness, contrast, detail, colorDist);
                    
                     addDebugInfo(`🔍 Frame analysis - brightness: ${averageBrightness.toFixed(1)}, contrast: ${contrast.toFixed(1)}, detail: ${detail.toFixed(1)}, color: ${colorDist.toFixed(1)}, score: ${totalScore.toFixed(1)}`);
           
                       // Send diagnostic data for this attempt
            sendDiagnostic({
              attempt: seekAttempts + 1,
              brightness: averageBrightness,
              seekTime: videoElement!.currentTime,
              duration: videoElement!.duration,
              success: totalScore > 50, // Use composite score instead of just brightness
              contrast,
              detail,
              colorDistribution: colorDist,
              totalScore
            });
            
            // Best-of-the-best mode: collect this thumbnail for scoring
            canvas.toBlob((blob) => {
              if (blob) {
                collectedThumbnails.push({
                  blob,
                  brightness: averageBrightness,
                  contrast,
                  detail,
                  colorDistribution: colorDist,
                  totalScore,
                  seekTime: videoElement!.currentTime,
                  attempt: seekAttempts + 1
                });
                
                addDebugInfo(`💾 Collected thumbnail ${seekAttempts + 1} (score: ${totalScore.toFixed(1)})`);
                
                // Continue collecting until we have enough attempts
                if (seekAttempts < minAttempts - 1 && seekAttempts < maxSeekAttempts - 1) {
                  seekAttempts++;
                  let nextSeekTime;
                  
                  if (seekAttempts < seekTimes.length) {
                    // Use predefined strategic seek times first
                    nextSeekTime = Math.min(seekTimes[seekAttempts], videoElement!.duration * 0.9);
                  } else {
                    // More systematic approach: divide remaining video into segments
                    const segment = (seekAttempts - seekTimes.length + 1);
                    const segmentSize = videoElement!.duration / 10;
                    nextSeekTime = Math.min(segment * segmentSize + (Math.random() * segmentSize * 0.5), videoElement!.duration * 0.9);
                  }
                  
                  addDebugInfo(`🔄 Collecting more thumbnails... seeking to ${nextSeekTime.toFixed(1)}s (${seekAttempts + 1}/${Math.max(minAttempts, maxSeekAttempts)})`);
                  setSeekProgress(`Collecting best thumbnails... (${seekAttempts + 1}/${Math.max(minAttempts, maxSeekAttempts)})`);
                  videoElement!.currentTime = nextSeekTime;
                  return; // Continue collecting
                }
                
                            // We have enough thumbnails - select the best one
            selectBestThumbnail();
          }
        }, 'image/jpeg', 0.8);
        
        return; // Exit early since we're handling blob creation above
      };
      
      const selectBestThumbnail = async () => {
        if (collectedThumbnails.length === 0) {
          addDebugInfo('❌ No thumbnails collected');
          setError('Failed to generate thumbnails');
          setIsLoading(false);
          return;
        }
        
        // Sort by total score and select the best one
        collectedThumbnails.sort((a, b) => b.totalScore - a.totalScore);
        const bestThumbnail = collectedThumbnails[0];
        
        addDebugInfo(`🏆 Selected best thumbnail: attempt ${bestThumbnail.attempt}, score: ${bestThumbnail.totalScore.toFixed(1)}`);
        addDebugInfo(`   📊 Best scores - brightness: ${bestThumbnail.brightness.toFixed(1)}, contrast: ${bestThumbnail.contrast.toFixed(1)}, detail: ${bestThumbnail.detail.toFixed(1)}, color: ${bestThumbnail.colorDistribution.toFixed(1)}`);
        
        const url = URL.createObjectURL(bestThumbnail.blob);
        
        // Save to permanent cache
        try {
          addDebugInfo('💾 Saving best thumbnail to permanent cache...');
          const cacheService = VideoThumbnailCacheService.getInstance();
          await cacheService.saveThumbnailToCache(videoKey, url, {
            attempts: bestThumbnail.attempt,
            brightness: bestThumbnail.brightness,
            duration: videoElement!.duration,
            size: bestThumbnail.blob.size,
            strategy: 'best-of-the-best'
          });
          addDebugInfo('✅ Best thumbnail cached permanently!');
        } catch (cacheError) {
          addDebugInfo('⚠️ Failed to cache, but best thumbnail selected successfully');
        }
        
        // Send final success diagnostic
        sendDiagnostic({ 
          result: 'SUCCESS', 
          finalAttempt: bestThumbnail.attempt, 
          finalBrightness: bestThumbnail.brightness,
          finalScore: bestThumbnail.totalScore,
          blobSize: bestThumbnail.blob.size,
          totalCandidates: collectedThumbnails.length
        });
        
        setThumbnailUrl(url);
        setIsLoading(false);
        setSeekProgress('');
      };

      videoElement.onseeked = attemptThumbnailGeneration;

                           videoElement.onerror = () => {
          if (!isMounted) return;
          const errorMsg = `Video error: ${videoElement!.error?.code} - ${videoElement!.error?.message}`;
          addDebugInfo(`❌ ${errorMsg}`);
          sendDiagnostic({ error: errorMsg });
          createPlaceholderThumbnail();
        };
       
       // Start loading the video (THIS WAS MISSING!)
       addDebugInfo('🚀 Starting video load');
       if (sourceUrl) {
         videoElement.src = sourceUrl;
         videoElement.load();
       } else {
         throw new Error('No video URL available');
       }
       
          } catch (error) {
       const errorMsg = error instanceof Error ? error.message : 'Unknown error';
       addDebugInfo(`❌ Generation failed: ${errorMsg}`);
       sendDiagnostic({ error: errorMsg });
       setError(errorMsg);
       setIsLoading(false);
     }
  };

  const createPlaceholderThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    addDebugInfo('🎨 Creating placeholder thumbnail');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = aspectRatio === 'square' ? 400 : 225;
    
    // Create gradient background (same as working gallery)
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(1, '#1e1b4b');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add video icon
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎬', canvas.width / 2, canvas.height / 2 - 20);
    
    // Add "Leadership Video" text
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Leadership Video', canvas.width / 2, canvas.height / 2 + 20);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        addDebugInfo('✅ Placeholder created successfully');
        setThumbnailUrl(url);
        setIsLoading(false);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const aspectRatioClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden rounded-lg ${aspectRatioClass} ${className} ${onClick ? 'cursor-pointer' : ''} bg-gray-900`}
      onClick={handleClick}
    >
             {/* Hidden canvas for thumbnail generation */}
       <canvas ref={canvasRef} className="hidden" />
       
               {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-gray-900 text-xs">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-400 text-center">
              {seekProgress || 'Generating thumbnail...'}
            </span>
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
               setError('');
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

export default VideoThumbnail; 