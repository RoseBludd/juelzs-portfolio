import { NextRequest, NextResponse } from 'next/server';
import AWSS3Service from '@/services/aws-s3.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await context.params;
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('🎬 API: Getting video URL for:', videoId);
    
    const s3Service = AWSS3Service.getInstance();
    const result = await s3Service.getVideoUrl(videoId);
    
    if (!result.url) {
      return NextResponse.json(
        { error: 'Video URL not found' },
        { status: 404 }
      );
    }

    console.log('✅ API: Video URL retrieved successfully');
    
    return NextResponse.json({
      url: result.url,
      fileSize: result.fileSize,
      title: result.title,
      cached: true // Indicates this URL is cached for performance
    });
    
  } catch (error) {
    console.error('❌ API: Error getting video URL:', error);
    
    return NextResponse.json(
      { error: 'Failed to get video URL' },
      { status: 500 }
    );
  }
} 