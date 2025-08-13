import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import PortfolioService from '@/services/portfolio.service';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'full'; // 'full' or 'dropdown'

    const portfolioService = PortfolioService.getInstance();
    const projects = await portfolioService.getSystemProjects();

    if (format === 'dropdown') {
      // Return simplified format for dropdowns
      const dropdownProjects = projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        techStack: project.techStack.slice(0, 3), // First 3 tech stack items for display
      }));

      return NextResponse.json({ 
        success: true, 
        projects: dropdownProjects,
        count: dropdownProjects.length
      });
    }

    // Return full project data
    return NextResponse.json({ 
      success: true, 
      projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
