import { NextRequest, NextResponse } from 'next/server';
import AWSS3Service from '@/services/aws-s3.service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Only handle S3 videos
    if (!id.startsWith('s3-')) {
      return NextResponse.json({ error: 'Invalid video ID format' }, { status: 400 });
    }

    const s3Service = AWSS3Service.getInstance();
    const groupId = id.replace('s3-', '');
    

    // Get the meeting group to find the video file
    const group = await s3Service.getMeetingGroupById(groupId);
    
    if (!group) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (!group.video) {
      return NextResponse.json({ error: 'Video file not available' }, { status: 404 });
    }

    // Generate a fresh signed URL (valid for 1 hour)
    const signedUrl = await s3Service.getFileUrl(group.video.s3Key, 3600);
    
    console.log('🎬 Generated signed URL for video:', {
      videoId: id,
      title: group.title,
      s3Key: group.video.s3Key,
      urlLength: signedUrl.length
    });

    return NextResponse.json({ 
      url: signedUrl,
      title: group.title,
      duration: group.insights?.duration || '0:00',
      fileSize: group.video.size,
      lastModified: group.video.lastModified.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error generating video URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate video URL' },
      { status: 500 }
    );
  }
} 