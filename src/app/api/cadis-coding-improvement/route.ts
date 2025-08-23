import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import CADISCodingImprovementService from '@/services/cadis-coding-improvement.service';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    const service = CADISCodingImprovementService.getInstance();
    await service.initialize();

    if (action === 'run_session') {
      console.log('🚀 Running CADIS coding improvement session...');
      await service.runScheduledImprovementSession();
      
      const progress = await service.getCodingProgress();
      
      return NextResponse.json({
        success: true,
        message: 'Coding improvement session completed successfully',
        progress
      });
    }

    if (action === 'generate_scenarios') {
      console.log('🎯 Generating new coding scenarios...');
      const scenarios = await service.generateCodingScenarios();
      
      return NextResponse.json({
        success: true,
        message: `Generated ${scenarios.length} new coding scenarios`,
        scenarios: scenarios.map(s => ({
          id: s.id,
          title: s.title,
          difficulty: s.difficulty,
          category: s.category
        }))
      });
    }

    return NextResponse.json({
      error: 'Invalid action. Use "run_session" or "generate_scenarios"'
    }, { status: 400 });

  } catch (error) {
    console.error('CADIS coding improvement error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process coding improvement request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const service = CADISCodingImprovementService.getInstance();
    await service.initialize();
    
    const progress = await service.getCodingProgress();
    
    return NextResponse.json({
      success: true,
      progress: progress || {
        overallScore: 0,
        principleScores: { executionLed: 0, modularity: 0, reusability: 0, progressiveEnhancement: 0 },
        categoryScores: { architecture: 0, optimization: 0, debugging: 0, feature_development: 0, refactoring: 0 },
        totalAttempts: 0,
        recentImprovement: 0,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting coding improvement progress:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get coding improvement progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
