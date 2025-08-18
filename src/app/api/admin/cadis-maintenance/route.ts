import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import CADISMaintenanceService from '@/services/cadis-maintenance.service';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const maintenanceService = CADISMaintenanceService.getInstance();
    
    console.log('🔧 Running CADIS maintenance analysis...');
    
    // Perform comprehensive maintenance analysis
    const analysis = await maintenanceService.performMaintenanceAnalysis();
    
    // Generate maintenance report
    await maintenanceService.generateMaintenanceReport(analysis);
    
    // Perform auto-tuning if required (non-aggressive)
    const tuningPerformed = await maintenanceService.performAutoTuning(analysis);

    return NextResponse.json({ 
      success: true, 
      analysis,
      tuningPerformed,
      recommendations: analysis.recommendations,
      healthScore: analysis.metrics.overallHealth
    });
  } catch (error) {
    console.error('CADIS maintenance API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform CADIS maintenance analysis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();
    const maintenanceService = CADISMaintenanceService.getInstance();
    
    if (action === 'force-maintenance') {
      console.log('🔧 Forcing CADIS maintenance check...');
      
      const analysis = await maintenanceService.performMaintenanceAnalysis();
      const tuningPerformed = await maintenanceService.performAutoTuning(analysis);
      
      return NextResponse.json({ 
        success: true, 
        analysis,
        tuningPerformed,
        message: 'Forced maintenance completed'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('CADIS maintenance POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform maintenance action' },
      { status: 500 }
    );
  }
}
