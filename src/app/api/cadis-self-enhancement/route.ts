import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import CADISSelfEnhancementService from '@/services/cadis-self-enhancement.service';

export async function POST(request: NextRequest) {
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    const service = CADISSelfEnhancementService.getInstance();

    if (action === 'run_enhancement_cycle') {
      console.log('🔄 Running CADIS self-enhancement cycle...');
      await service.runSelfEnhancementCycle();
      
      return NextResponse.json({
        success: true,
        message: 'Self-enhancement cycle completed successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'analyze_capabilities') {
      const capabilities = await service.analyzeCurrentCapabilities();
      const opportunities = await service.identifyEnhancementOpportunities();
      
      return NextResponse.json({
        success: true,
        capabilities,
        opportunities,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: 'Invalid action. Use "run_enhancement_cycle" or "analyze_capabilities"'
    }, { status: 400 });

  } catch (error) {
    console.error('CADIS self-enhancement error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process self-enhancement request',
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
    const service = CADISSelfEnhancementService.getInstance();
    const capabilities = await service.analyzeCurrentCapabilities();
    const opportunities = await service.identifyEnhancementOpportunities();
    
    return NextResponse.json({
      success: true,
      status: 'CADIS Self-Enhancement System Active',
      capabilities,
      opportunities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting self-enhancement status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get self-enhancement status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}