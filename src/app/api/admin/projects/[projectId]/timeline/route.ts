import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import JournalService from '@/services/journal.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId } = await context.params;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const journalService = JournalService.getInstance();
    await journalService.initialize();

    // Get project timeline with journal entries
    const journalTimeline = await journalService.getProjectJournalTimeline(projectId);

    // Create simplified timeline data
    const timeline = journalTimeline.map(entry => ({
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
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate basic stats
    const stats = {
      totalEntries: timeline.length,
      avgRelevanceScore: timeline.length > 0 ? timeline.reduce((sum, item) => sum + item.relevanceScore, 0) / timeline.length : 0,
      entriesByType: timeline.reduce((acc, item) => {
        acc[item.linkType] = (acc[item.linkType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgDifficulty: timeline.filter(item => item.difficulty).length > 0 
        ? timeline.filter(item => item.difficulty).reduce((sum, item) => sum + (item.difficulty || 0), 0) / timeline.filter(item => item.difficulty).length 
        : 0,
      avgImpact: timeline.filter(item => item.impact).length > 0 
        ? timeline.filter(item => item.impact).reduce((sum, item) => sum + (item.impact || 0), 0) / timeline.filter(item => item.impact).length 
        : 0
    };

    return NextResponse.json({ 
      success: true,
      projectId,
      timeline,
      stats,
      metadata: {
        totalItems: timeline.length,
        journalEntries: timeline.length,
        meetingVideos: 0, // No meeting videos for now
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
