import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import CADISJournalService from '@/services/cadis-journal.service';
import CADISGeniusGameIntelligenceService from '@/services/cadis-genius-game-intelligence.service';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cadisService = CADISJournalService.getInstance();
    await cadisService.initialize();

    console.log('🧠 CADIS generating new ecosystem insights...');

    // Generate different types of insights including creative intelligence, journal analysis, and Genius Game intelligence
    const [
      ecosystemInsight,
      moduleInsights,
      dreamStateInsight,
      creativeInsights,
      journalAnalysisDream,
      geniusGameInsight
    ] = await Promise.all([
      cadisService.generateEcosystemInsight(),
      cadisService.analyzeModuleRegistryChanges(),
      cadisService.generateDreamStatePredictions(),
      cadisService.generateCreativeIntelligence(),
      cadisService.generateJournalAnalysisDream(),
      CADISGeniusGameIntelligenceService.getInstance().generateGeniusGameIntelligence()
    ]);

    const generatedEntries = [];
    
    if (ecosystemInsight) {
      await cadisService.createCADISEntry(ecosystemInsight);
      generatedEntries.push(ecosystemInsight);
    }
    
    for (const moduleInsight of moduleInsights) {
      await cadisService.createCADISEntry(moduleInsight);
      generatedEntries.push(moduleInsight);
    }
    
    if (dreamStateInsight) {
      await cadisService.createCADISEntry(dreamStateInsight);
      generatedEntries.push(dreamStateInsight);
    }
    
    for (const creativeInsight of creativeInsights) {
      await cadisService.createCADISEntry(creativeInsight);
      generatedEntries.push(creativeInsight);
    }
    
    if (journalAnalysisDream) {
      await cadisService.createCADISEntry(journalAnalysisDream);
      generatedEntries.push(journalAnalysisDream);
    }
    
    if (geniusGameInsight) {
      await cadisService.createCADISEntry(geniusGameInsight);
      generatedEntries.push(geniusGameInsight);
    }

    console.log(`✅ Generated ${generatedEntries.length} CADIS insights (including Genius Game intelligence)`);

    return NextResponse.json({ 
      success: true, 
      generated: generatedEntries.length,
      insights: generatedEntries.map((e, index) => ({
        id: (e as any).id || `generated_${index}`,
        title: e.title,
        category: e.category,
        confidence: e.confidence,
        impact: e.impact
      }))
    });
  } catch (error) {
    console.error('CADIS insight generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CADIS insights' },
      { status: 500 }
    );
  }
}
