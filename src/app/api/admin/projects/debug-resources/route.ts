import { NextRequest, NextResponse } from 'next/server';
import ProjectLinkingService from '@/services/project-linking.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Debug: Loading project resources for: ${projectId}`);

    const projectLinkingService = ProjectLinkingService.getInstance();
    const projectResources = await projectLinkingService.getProjectResources(projectId);

    console.log(`📊 Debug: Project resources found:`, {
      projectId,
      photosCount: projectResources.photos.length,
      videosCount: projectResources.linkedVideos.length,
      lastUpdated: projectResources.lastUpdated,
      photos: projectResources.photos.map(p => ({
        id: p.id,
        filename: p.filename,
        s3Key: p.s3Key,
        url: p.url,
        category: p.category
      }))
    });

    return NextResponse.json({
      success: true,
      projectId,
      projectResources,
      debug: {
        photosCount: projectResources.photos.length,
        videosCount: projectResources.linkedVideos.length,
        lastUpdated: projectResources.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 