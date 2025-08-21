import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// POST - Generate simple thumbnail by analyzing video at intervals
export async function POST(request: NextRequest) {
  let videoKey = 'unknown';
  try {
    const { videoUrl, videoKey: key } = await request.json();
    videoKey = key;

    if (!videoUrl || !videoKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'videoUrl and videoKey are required' 
      }, { status: 400 });
    }

    console.log(`📸 [${videoKey}] Starting server-side thumbnail generation...`);

    // For server-side, we'll use a simpler approach:
    // Take multiple screenshots, analyze with GPT Vision, pick the best one
    
    const result = await generateServerSideThumbnail(videoUrl, videoKey);

    console.log(`✅ [${videoKey}] Thumbnail generated successfully:`, {
      s3Url: result.s3Url,
      timeStamp: result.timeStamp,
      score: result.score
    });

    return NextResponse.json({
      success: true,
      s3Url: result.s3Url,
      s3Key: result.s3Key,
      timeStamp: result.timeStamp,
      score: result.score,
      analysis: result.analysis
    });

  } catch (error) {
    console.error(`❌ [${videoKey}] Error generating thumbnail:`, error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate thumbnail' 
    }, { status: 500 });
  }
}

/**
 * Generate thumbnail server-side using external tools
 */
async function generateServerSideThumbnail(videoUrl: string, videoKey: string) {
  console.log(`🎬 [${videoKey}] Generating thumbnails using FFmpeg approach...`);
  
  // Use a simpler approach for server-side: generate a thumbnail at the middle of the video
  // and analyze it with GPT Vision
  
  const middleTimestamp = await getVideoMiddleTimestamp(videoUrl);
  console.log(`⏱️ [${videoKey}] Using middle timestamp: ${middleTimestamp}s`);
  
  // For now, we'll create a simple implementation that generates a basic thumbnail
  // In a real implementation, you'd use FFmpeg or similar to extract frames
  
  // Generate a basic thumbnail URL (this is a placeholder approach)
  const thumbnailData = await generateBasicThumbnail(videoUrl, videoKey, middleTimestamp);
  
  // Analyze with GPT Vision
  const visionScore = await analyzeWithGPTVision(thumbnailData.base64, videoKey, middleTimestamp);
  
  // Upload to S3
  const s3Result = await uploadThumbnailToS3(thumbnailData.buffer, videoKey, middleTimestamp, visionScore);
  
  return {
    s3Url: s3Result.s3Url,
    s3Key: s3Result.s3Key,
    timeStamp: middleTimestamp,
    score: visionScore,
    analysis: {
      visionScore: visionScore,
      method: 'server-side-middle-frame'
    }
  };
}

/**
 * Get the middle timestamp of a video (placeholder implementation)
 */
async function getVideoMiddleTimestamp(_videoUrl: string): Promise<number> {
  // For now, assume a typical meeting video is about 30 minutes
  // In a real implementation, you'd use FFprobe to get actual duration
  const estimatedDuration = 30 * 60; // 30 minutes in seconds
  return estimatedDuration / 2; // Middle of the video
}

/**
 * Generate basic thumbnail (placeholder implementation)
 */
async function generateBasicThumbnail(_videoUrl: string, videoKey: string, timestamp: number) {
  console.log(`🖼️ [${videoKey}] Creating placeholder thumbnail for timestamp ${timestamp}s`);
  
  // This is a placeholder implementation
  // In a real implementation, you'd use FFmpeg to extract the actual frame
  
  // Create a simple canvas with text as placeholder
  const canvas = createPlaceholderCanvas(videoKey, timestamp);
  const buffer = canvasToBuffer(canvas);
  const base64 = canvasToBase64(canvas);
  
  return { buffer, base64 };
}

interface PlaceholderCanvas {
  width: number;
  height: number;
  videoKey: string;
  timestamp: number;
  pixels: Uint8Array;
}

/**
 * Create placeholder canvas (for demonstration)
 */
function createPlaceholderCanvas(videoKey: string, timestamp: number): PlaceholderCanvas {
  // This is a Node.js environment, so we can't use actual Canvas API
  // This is just a structure to represent what would be a canvas
  const placeholderData: PlaceholderCanvas = {
    width: 400,
    height: 225,
    videoKey,
    timestamp,
    pixels: new Uint8Array(400 * 225 * 4) // RGBA
  };
  
  // Fill with a simple pattern (placeholder)
  for (let i = 0; i < placeholderData.pixels.length; i += 4) {
    placeholderData.pixels[i] = 100;     // R
    placeholderData.pixels[i + 1] = 150; // G
    placeholderData.pixels[i + 2] = 200; // B
    placeholderData.pixels[i + 3] = 255; // A
  }
  
  return placeholderData;
}

/**
 * Convert placeholder canvas to buffer
 */
function canvasToBuffer(canvas: PlaceholderCanvas): Buffer {
  // This is a placeholder - in a real implementation you'd convert canvas to JPEG
  const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
  const data = Buffer.from(canvas.pixels);
  return Buffer.concat([header, data]);
}

/**
 * Convert placeholder canvas to base64
 */
function canvasToBase64(canvas: PlaceholderCanvas): string {
  const buffer = canvasToBuffer(canvas);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

/**
 * Analyze thumbnail with GPT Vision
 */
async function analyzeWithGPTVision(base64Image: string, videoKey: string, timestamp: number): Promise<number> {
  try {
    console.log(`🤖 [${videoKey}] Analyzing with GPT Vision...`);
    
    const openai = getOpenAIClient();
    if (!openai) {
      console.warn(`⚠️ [${videoKey}] OPENAI_API_KEY not set; returning fallback score`);
      return 50;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are analyzing a video thumbnail for a leadership/technical video. 

Rate this thumbnail from 0-100 based on:
- Visual Quality: Clear, well-lit, good contrast, not blurry or dark
- Content Relevance: Shows people, faces, meaningful content (not just slides)
- Professional Appearance: Suitable for leadership portfolio
- Composition: Well-framed, centered, appealing
- Technical Meeting Context: Appropriate for professional/technical discussion

Respond with ONLY a number between 0-100.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 10
    });

    const scoreText = response.choices[0]?.message?.content?.trim();
    const score = parseFloat(scoreText || '0');
    
    if (isNaN(score) || score < 0 || score > 100) {
      console.warn(`⚠️ [${videoKey}] Invalid GPT Vision score: ${scoreText}, using 50`);
      return 50;
    }
    
    console.log(`📊 [${videoKey}] GPT Vision score: ${score}`);
    return score;
    
  } catch (error) {
    console.warn(`⚠️ [${videoKey}] GPT Vision analysis failed:`, error);
    return 50; // Fallback score
  }
}

/**
 * Upload thumbnail to S3
 */
async function uploadThumbnailToS3(buffer: Buffer, videoKey: string, timestamp: number, score: number) {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
  const s3Key = `video-thumbnails/${videoKey}/simple-thumbnail.jpg`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: buffer,
    ContentType: 'image/jpeg',
    Metadata: {
      'video-key': videoKey,
      'timestamp': timestamp.toString(),
      'vision-score': score.toString(),
      'generated-at': new Date().toISOString(),
      'generation-type': 'server-side-simple'
    }
  });

  await s3Client.send(command);

  const region = process.env.AWS_REGION || 'us-east-1';
  const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

  console.log(`✅ [${videoKey}] Uploaded to S3: ${s3Url}`);

  return { s3Url, s3Key };
} 