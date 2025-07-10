import { NextResponse } from 'next/server';
import MeetingAnalysisService from '@/services/meeting-analysis.service';

export async function GET() {
  try {
    console.log('🔄 Resetting and testing OpenAI service...');
    
    // Reset the singleton to pick up fresh environment variables
    MeetingAnalysisService.resetInstance();
    
    // Get fresh instance
    const analysisService = MeetingAnalysisService.getInstance();
    
    // Check API availability
    const apiAvailable = analysisService.isApiAvailable();
    
    return NextResponse.json({
      success: true,
      message: 'Service reset and tested',
      apiAvailable,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error during service reset:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to reset service',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 