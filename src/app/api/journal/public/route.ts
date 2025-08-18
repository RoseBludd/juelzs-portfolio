import { NextRequest, NextResponse } from 'next/server';
import JournalService, { JournalSearchFilters } from '@/services/journal.service';

export async function GET(request: NextRequest) {
  try {
    const journalService = JournalService.getInstance();
    await journalService.initialize();

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters for public filtering
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Create filters for public content only
    const filters: JournalSearchFilters = {};
    if (category && category !== 'all') filters.category = category;
    if (tags && tags.length > 0) filters.tags = tags;
    
    // Get all entries first
    const allEntries = await journalService.getEntries(filters, 100, 0);
    
    // Filter for public-appropriate content
    const publicEntries = allEntries
      .filter(entry => {
        // Exclude entries explicitly marked as private
        if (entry.isPrivate) return false;
        
        // Exclude sensitive categories
        const privateTags = ['team-issues', 'personal', 'confidential', 'internal'];
        const hasPrivateTags = entry.tags.some(tag => 
          privateTags.some(privateTag => tag.toLowerCase().includes(privateTag))
        );
        
        // Exclude if has private tags
        if (hasPrivateTags) return false;
        
        // Only include certain categories for public
        const publicCategories = ['architecture', 'reflection', 'milestone', 'planning', 'Strategic Philosophy', 'Leadership Self-Discovery'];
        if (!publicCategories.includes(entry.category)) return false;
        
        // Must have good content length (not just quick notes)
        if (entry.content.length < 200) return false;
        
        // Only show entries with medium+ impact or difficulty (more substantial)
        const difficulty = entry.metadata?.difficulty || 0;
        const impact = entry.metadata?.impact || 0;
        if (difficulty < 5 && impact < 6) return false;
        
        return true;
      })
      .map(entry => ({
        // Return sanitized version for public
        id: entry.id,
        title: entry.title,
        content: entry.content,
        category: entry.category,
        projectName: entry.projectName,
        tags: entry.tags.filter(tag => 
          !['team-issues', 'personal', 'confidential', 'internal'].includes(tag.toLowerCase())
        ),
        architectureDiagrams: entry.architectureDiagrams,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        metadata: {
          difficulty: entry.metadata?.difficulty,
          impact: entry.metadata?.impact,
          learnings: entry.metadata?.learnings || [],
          nextSteps: entry.metadata?.nextSteps || []
        },
        // Include AI suggestions but sanitize them
        aiSuggestions: entry.aiSuggestions?.filter(suggestion => 
          !suggestion.suggestion.toLowerCase().includes('team') &&
          !suggestion.suggestion.toLowerCase().includes('personal')
        ).map(suggestion => ({
          type: suggestion.type,
          suggestion: suggestion.suggestion,
          reasoning: suggestion.reasoning,
          confidence: suggestion.confidence,
          implementationComplexity: suggestion.implementationComplexity
        })) || []
      }))
      .slice(0, limit);

    // Get basic stats for public display
    const stats = {
      totalPublicEntries: publicEntries.length,
      categoryCounts: publicEntries.reduce((acc, entry) => {
        acc[entry.category] = (acc[entry.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topTags: Object.entries(
        publicEntries.flatMap(e => e.tags).reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
    };

    return NextResponse.json({ 
      success: true, 
      entries: publicEntries,
      stats
    });

  } catch (error) {
    console.error('Public journal API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public journal entries' },
      { status: 500 }
    );
  }
}
