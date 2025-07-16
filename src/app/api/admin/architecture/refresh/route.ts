import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import GitHubService from '@/services/github.service';
import ArchitectureAnalysisService from '@/services/architecture-analysis.service';
import AWSS3Service from '@/services/aws-s3.service';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Admin requested architecture analysis refresh for project: ${projectId}`);

    // Get the project
    const githubService = GitHubService.getInstance();
    const project = await githubService.getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete existing cached analysis to force refresh
    const s3Service = AWSS3Service.getInstance();
    try {
      const existingAnalysis = await s3Service.getCachedArchitectureAnalysis(projectId);
      if (existingAnalysis) {
        console.log(`🗑️ Removing cached analysis for: ${project.title}`);
        // Note: We don't have a delete method yet, but the new analysis will overwrite
      }
    } catch {
      // No existing analysis, that's fine
      console.log(`📄 No existing analysis found for: ${project.title}`);
    }

    // Run fresh analysis (bypassing cache)
    const architectureService = ArchitectureAnalysisService.getInstance();
    const analysis = await architectureService.forceRefreshProjectArchitecture(project);

    if (!analysis) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate analysis. OpenAI service may be unavailable.' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Fresh architecture analysis completed for: ${project.title} - Score: ${analysis.overallScore}/10`);

    return NextResponse.json({
      success: true,
      message: `Architecture analysis refreshed for ${project.title}`,
      analysis: {
        overallScore: analysis.overallScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        bestPractices: analysis.bestPractices,
        designPatterns: analysis.designPatterns,
        technicalDebt: analysis.technicalDebt,
        summary: analysis.summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error refreshing architecture analysis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 