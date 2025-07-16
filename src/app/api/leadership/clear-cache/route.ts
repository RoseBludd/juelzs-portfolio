import { NextResponse } from 'next/server';
import PortfolioService from '@/services/portfolio.service';

export async function POST() {
  try {
    console.log('🗑️ Clearing leadership page cache...');
    
    const portfolioService = PortfolioService.getInstance();
    portfolioService.clearFilteredVideosCache();
    
    console.log('✅ Leadership page cache cleared');
    
    return NextResponse.json({
      success: true,
      message: 'Leadership page cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error clearing leadership cache:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 