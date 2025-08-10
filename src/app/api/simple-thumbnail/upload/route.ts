import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// POST - Upload thumbnail to S3 (called from browser-side service)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const thumbnailBlob = formData.get('thumbnail') as Blob;
    const videoKey = formData.get('videoKey') as string;
    const timeStamp = formData.get('timeStamp') as string;
    const score = formData.get('score') as string;
    const pixelScore = formData.get('pixelScore') as string;
    const visionScore = formData.get('visionScore') as string;
    const brightness = formData.get('brightness') as string;
    const contrast = formData.get('contrast') as string;
    const sharpness = formData.get('sharpness') as string;

    if (!thumbnailBlob || !videoKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'thumbnail and videoKey are required' 
      }, { status: 400 });
    }

    console.log(`📸 Uploading simple thumbnail for: ${videoKey}`);

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET || 'genius-untitled';
    const s3Key = `video-thumbnails/${videoKey}/simple-thumbnail.jpg`;

    // Convert blob to buffer
    const arrayBuffer = await thumbnailBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: 'image/jpeg',
      Metadata: {
        'video-key': videoKey,
        'timestamp': timeStamp || '0',
        'combined-score': score || '0',
        'pixel-score': pixelScore || '0',
        'vision-score': visionScore || '0',
        'brightness': brightness || '0',
        'contrast': contrast || '0',
        'sharpness': sharpness || '0',
        'generated-at': new Date().toISOString(),
        'generation-type': 'simple-thumbnail-gpt-vision'
      }
    });

    await s3Client.send(putCommand);

    // Generate presigned URL for accessing the uploaded thumbnail
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const s3Url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // 1 hour expiry

    console.log(`✅ Simple thumbnail uploaded with presigned URL: ${s3Url.substring(0, 100)}...`);

    return NextResponse.json({
      success: true,
      s3Url,
      s3Key,
      metadata: {
        videoKey,
        timeStamp: parseFloat(timeStamp || '0'),
        combinedScore: parseFloat(score || '0'),
        pixelScore: parseFloat(pixelScore || '0'),
        visionScore: parseFloat(visionScore || '0'),
        brightness: parseFloat(brightness || '0'),
        contrast: parseFloat(contrast || '0'),
        sharpness: parseFloat(sharpness || '0')
      }
    });

  } catch (error) {
    console.error('❌ Error uploading simple thumbnail:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload thumbnail' 
    }, { status: 500 });
  }
} 