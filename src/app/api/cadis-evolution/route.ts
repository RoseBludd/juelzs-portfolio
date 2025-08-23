import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import CADISEvolutionService from '@/services/cadis-evolution.service';

export async function POST(request: NextRequest) {
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    const service = CADISEvolutionService.getInstance();

    switch (action) {
      case 'initialize_tables':
        await service.initializeEvolutionTables();
        return NextResponse.json({
          success: true,
          message: 'Evolution tables initialized successfully'
        });

      case 'run_evolution_cycle':
        console.log('🧬 Running CADIS evolution cycle...');
        const evolutionResults = await service.runEvolutionCycle();
        
        return NextResponse.json({
          success: true,
          message: 'Evolution cycle completed successfully',
          results: evolutionResults,
          timestamp: new Date().toISOString()
        });

      case 'analyze_efficiency':
        const efficiencyAnalysis = await service.analyzeEfficiencyAndRaiseCeiling();
        
        return NextResponse.json({
          success: true,
          analysis: efficiencyAnalysis,
          timestamp: new Date().toISOString()
        });

      case 'create_agent':
        const { agentConfig } = body;
        if (!agentConfig) {
          return NextResponse.json({
            error: 'Agent configuration required'
          }, { status: 400 });
        }

        const agentId = await service.createSpecializedAgent(agentConfig);
        
        return NextResponse.json({
          success: true,
          agentId,
          message: agentConfig.approvalRequired ? 
            'Agent creation request submitted for approval' : 
            'Agent created successfully'
        });

      case 'request_evolution':
        const { evolutionRequest } = body;
        if (!evolutionRequest) {
          return NextResponse.json({
            error: 'Evolution request configuration required'
          }, { status: 400 });
        }

        const requestId = await service.requestEvolutionApproval(evolutionRequest);
        
        return NextResponse.json({
          success: true,
          requestId,
          message: 'Evolution request submitted for approval'
        });

      case 'integrate_audio':
        await service.integrateAudioCapabilities();
        
        return NextResponse.json({
          success: true,
          message: 'Audio capabilities integration initiated'
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: initialize_tables, run_evolution_cycle, analyze_efficiency, create_agent, request_evolution, integrate_audio'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('CADIS evolution error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process evolution request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const service = CADISEvolutionService.getInstance();
    const status = await service.getEvolutionStatus();

    return NextResponse.json({
      success: true,
      status,
      message: 'CADIS Evolution System Status',
      capabilities: [
        'Dynamic efficiency ceiling adjustment',
        'Cross-repository pattern analysis',
        'Specialized agent creation',
        'Audio analysis and generation (ELEVEN_LABS)',
        'Autonomous capability expansion',
        'Admin approval workflow'
      ],
      repositories: [
        'juelzs-portfolio',
        'vibezs-platform', 
        'genius-game'
      ]
    });

  } catch (error) {
    console.error('Evolution status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get evolution status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
