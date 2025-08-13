import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import JournalService from '@/services/journal.service';
import ProjectLinkingService from '@/services/project-linking.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId } = params;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const journalService = JournalService.getInstance();
    await journalService.initialize();

    const projectLinkingService = ProjectLinkingService.getInstance();

    // Get project timeline with journal entries
    const journalTimeline = await journalService.getProjectJournalTimeline(projectId);

    // Get project videos (meetings) for timeline
    const projectVideos = await projectLinkingService.getProjectVideoLinks(projectId);

    // Get development stats
    const devStats = await journalService.getProjectDevelopmentStats(projectId);

    // Combine timeline data
    const timeline = [
      ...journalTimeline.map(entry => ({
        id: entry.id,
        type: 'journal-entry',
        title: entry.title,
        content: entry.content,
        category: entry.category,
        linkType: entry.linkInfo.linkType,
        relevanceScore: entry.linkInfo.relevanceScore,
        impactType: entry.linkInfo.impactType,
        difficulty: entry.metadata?.difficulty,
        impact: entry.metadata?.impact,
        tags: entry.tags,
        aiSuggestions: entry.aiSuggestions?.length || 0,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      ...projectVideos.map(video => ({
        id: video.videoId,
        type: 'meeting-video',
        title: video.videoTitle,
        linkType: video.linkType,
        relevanceScore: video.relevanceScore,
        notes: video.notes,
        createdAt: video.linkedAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ 
      success: true,
      projectId,
      timeline,
      stats: devStats,
      metadata: {
        totalItems: timeline.length,
        journalEntries: journalTimeline.length,
        meetingVideos: projectVideos.length,
        lastActivity: timeline[0]?.createdAt || null
      }
    });

  } catch (error) {
    console.error('Project timeline API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch project timeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
