import { NextRequest, NextResponse } from 'next/server';
import PortfolioService from '@/services/portfolio.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const portfolioService = PortfolioService.getInstance();
    
    const transcript = await portfolioService.getVideoTranscript(id);
    
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    return new NextResponse(transcript, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
  }
} 