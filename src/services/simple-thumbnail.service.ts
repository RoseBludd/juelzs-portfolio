interface ThumbnailAnalysis {
  score: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  timeStamp: number;
  canvas: HTMLCanvasElement;
}

interface SimpleThumbnailResult {
  s3Url: string;
  s3Key: string;
  timeStamp: number;
  score: number;
  analysis: {
    brightness: number;
    contrast: number;
    sharpness: number;
    visionScore?: number;
  };
}

class SimpleThumbnailService {
  constructor() {
    // No S3 client needed on browser side
  }

  /**
   * Generate thumbnail by taking screenshots at intervals and picking the best one
   */
  async generateBestThumbnail(videoUrl: string, videoKey: string): Promise<SimpleThumbnailResult> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      const analyses: ThumbnailAnalysis[] = [];
      let currentInterval = 0;
      const totalIntervals = 10; // Take 10 screenshots

      video.onloadedmetadata = () => {
        const duration = video.duration;
        processNextInterval();

        function processNextInterval() {
          if (currentInterval >= totalIntervals) {
            // All screenshots taken, analyze and pick best
            finalizeBestThumbnail();
            return;
          }

          // Calculate time position (skip first 5% and last 5%)
          const timePosition = (duration * 0.05) + ((duration * 0.9) * (currentInterval / (totalIntervals - 1)));
          video.currentTime = timePosition;
        }

        video.onseeked = () => {
          // Create canvas and capture frame
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          canvas.width = 400;
          canvas.height = 225;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Analyze frame quality
          const analysis = analyzeFrame(ctx, canvas, currentInterval, video.currentTime);
          analyses.push(analysis);
          
          currentInterval++;
          
          // Small delay before next screenshot
          setTimeout(processNextInterval, 100);
        };

                 async function finalizeBestThumbnail() {
           console.log(`🔍 [${videoKey}] Analyzing ${analyses.length} screenshots with GPT Vision...`);
           
           // Enhance each analysis with GPT Vision scoring
           const enhancedAnalyses = await Promise.all(
             analyses.map(async (analysis, index) => {
               try {
                 // Convert canvas to base64 for GPT Vision
                 const base64 = analysis.canvas.toDataURL('image/jpeg', 0.8);
                 
                 // Get GPT Vision analysis
                 const visionScore = await analyzeWithGPTVision(base64, videoKey, analysis.timeStamp);
                 
                 // Combine pixel score (40%) with GPT Vision score (60%)
                 const combinedScore = (analysis.score * 0.4) + (visionScore * 0.6);
                 
                 console.log(`📊 [${videoKey}] Frame ${index + 1}: Pixel=${analysis.score.toFixed(1)}, Vision=${visionScore.toFixed(1)}, Combined=${combinedScore.toFixed(1)}`);
                 
                 return {
                   ...analysis,
                   visionScore,
                   combinedScore
                 };
               } catch (error) {
                 console.warn(`⚠️ [${videoKey}] GPT Vision failed for frame ${index + 1}, using pixel score only:`, error);
                 return {
                   ...analysis,
                   visionScore: 0,
                   combinedScore: analysis.score
                 };
               }
             })
           );

           // Sort by combined score (highest first)
           enhancedAnalyses.sort((a, b) => b.combinedScore - a.combinedScore);
           const bestAnalysis = enhancedAnalyses[0];
           
           if (!bestAnalysis) {
             reject(new Error('No valid thumbnails generated'));
             return;
           }

           console.log(`🏆 [${videoKey}] Best thumbnail: ${bestAnalysis.timeStamp.toFixed(1)}s (score: ${bestAnalysis.combinedScore.toFixed(1)})`);

           try {
             // Convert best canvas to blob and send to server
             bestAnalysis.canvas.toBlob(async (blob) => {
               if (!blob) {
                 reject(new Error('Failed to create blob from canvas'));
                 return;
               }

               // Send to server API for S3 upload
               const formData = new FormData();
               formData.append('thumbnail', blob);
               formData.append('videoKey', videoKey);
               formData.append('timeStamp', bestAnalysis.timeStamp.toString());
               formData.append('score', bestAnalysis.combinedScore.toString());
               formData.append('pixelScore', bestAnalysis.score.toString());
               formData.append('visionScore', bestAnalysis.visionScore.toString());
               formData.append('brightness', bestAnalysis.brightness.toString());
               formData.append('contrast', bestAnalysis.contrast.toString());
               formData.append('sharpness', bestAnalysis.sharpness.toString());

               const response = await fetch('/api/simple-thumbnail/upload', {
                 method: 'POST',
                 body: formData
               });

               if (!response.ok) {
                 throw new Error(`Upload failed: ${response.status}`);
               }

               const result = await response.json();
               
               if (!result.success) {
                 throw new Error(result.error || 'Upload failed');
               }

               resolve({
                 s3Url: result.s3Url,
                 s3Key: result.s3Key,
                 timeStamp: bestAnalysis.timeStamp,
                 score: bestAnalysis.combinedScore,
                 analysis: {
                   brightness: bestAnalysis.brightness,
                   contrast: bestAnalysis.contrast,
                   sharpness: bestAnalysis.sharpness,
                   visionScore: bestAnalysis.visionScore
                 }
               });

             }, 'image/jpeg', 0.85);

           } catch (error) {
             reject(error);
           }
         }
      };

      video.onerror = () => reject(new Error('Video loading failed'));
      video.src = videoUrl;
    });
  }


}

/**
 * Analyze frame quality and return score
 */
function analyzeFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, interval: number, timeStamp: number): ThumbnailAnalysis {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // Calculate brightness
  let totalBrightness = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    totalBrightness += (r + g + b) / 3;
    pixelCount++;
  }
  
  const brightness = totalBrightness / pixelCount;
  
  // Calculate contrast (simple standard deviation)
  let variance = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const pixelBrightness = (r + g + b) / 3;
    variance += Math.pow(pixelBrightness - brightness, 2);
  }
  const contrast = Math.sqrt(variance / pixelCount);
  
  // Calculate sharpness (edge detection)
  const sharpness = calculateSharpness(imageData);
  
  // Calculate overall score
  // Prefer good brightness (not too dark/bright), high contrast, high sharpness
  const brightnessScore = 100 - Math.abs(brightness - 128); // Prefer middle brightness
  const contrastScore = Math.min(contrast * 2, 100); // Higher contrast is better
  const sharpnessScore = Math.min(sharpness * 10, 100); // Higher sharpness is better
  
  const score = (brightnessScore + contrastScore + sharpnessScore) / 3;
  
  return {
    score,
    brightness,
    contrast,
    sharpness,
    timeStamp,
    canvas: canvas.cloneNode(true) as HTMLCanvasElement
  };
}

/**
 * Simple edge detection for sharpness calculation
 */
function calculateSharpness(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let edgeSum = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      
      // Get current pixel brightness
      const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // Get surrounding pixels
      const right = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
      const bottom = (data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2]) / 3;
      
      // Calculate gradient
      const gradientX = Math.abs(current - right);
      const gradientY = Math.abs(current - bottom);
      const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
      
      edgeSum += gradient;
      count++;
    }
  }
  
  return edgeSum / count;
}

/**
 * Analyze thumbnail quality using GPT Vision
 */
async function analyzeWithGPTVision(base64Image: string, videoKey: string, timeStamp: number): Promise<number> {
  try {
    const response = await fetch('/api/ai/analyze-thumbnail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        videoKey,
        timeStamp,
        context: 'leadership-video-thumbnail'
      })
    });

    if (!response.ok) {
      throw new Error(`GPT Vision API failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && typeof result.score === 'number') {
      return Math.max(0, Math.min(100, result.score)); // Ensure 0-100 range
    } else {
      throw new Error(result.error || 'Invalid GPT Vision response');
    }
    
  } catch (error) {
    console.warn('GPT Vision analysis failed, using fallback:', error);
    return 50; // Fallback score
  }
}

export default SimpleThumbnailService; 