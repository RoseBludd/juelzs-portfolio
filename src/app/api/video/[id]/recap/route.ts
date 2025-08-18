import { NextRequest, NextResponse } from 'next/server';
import PortfolioService from '@/services/portfolio.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const portfolioService = PortfolioService.getInstance();
    
    const recap = await portfolioService.getVideoRecap(id);
    
    if (!recap) {
      return NextResponse.json({ error: 'Recap not found' }, { status: 404 });
    }

    return new NextResponse(recap, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error fetching recap:', error);
    return NextResponse.json({ error: 'Failed to fetch recap' }, { status: 500 });
  }
} 