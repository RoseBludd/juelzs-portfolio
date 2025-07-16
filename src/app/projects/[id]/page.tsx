import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProjectLinkingService from '@/services/project-linking.service';
import PortfolioService from '@/services/portfolio.service';
import ArchitectureAnalysisService from '@/services/architecture-analysis.service';
import Button from '@/components/ui/Button';
import ProjectPageClient from '@/components/ui/ProjectPageClient';
import Link from 'next/link';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const portfolioService = PortfolioService.getInstance();
  const { id } = await params;
  const project = await portfolioService.getSystemById(id);

  if (!project) {
    return {
      title: 'Project Not Found | Juelzs',
      description: 'The requested project could not be found.',
    };
  }

  return {
    title: `${project.title} | Juelzs - Production System Details`,
    description: `${project.description}`,
    keywords: [project.title, ...project.techStack, 'production system'],
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const projectLinkingService = ProjectLinkingService.getInstance();
  const portfolioService = PortfolioService.getInstance();
  const architectureService = ArchitectureAnalysisService.getInstance();
  
  const { id } = await params;
  const project = await portfolioService.getSystemById(id);

  if (!project) {
    notFound();
  }

  // Load project resources
  const projectResources = await projectLinkingService.getProjectResources(id);
  
  // Only analyze architecture if this is a GitHub project with required data
  let architectureAnalysis = null;
  if (project.source === 'github' && project.githubUrl) {
    try {
      // Convert SystemProject to GitHubProject format for architecture analysis
      const githubProject = {
        id: project.id,
        title: project.title,
        description: project.description,
        role: project.role,
        techStack: project.techStack,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        uniqueDecisions: project.uniqueDecisions,
        category: project.category,
        stars: project.stars || 0,
        forks: project.forks || 0,
        lastUpdated: project.lastUpdated || new Date().toISOString(),
        topics: project.topics || [],
        language: project.language || 'Unknown',
        createdAt: project.createdAt || new Date().toISOString(),
      };
      architectureAnalysis = await architectureService.analyzeProjectArchitecture(githubProject);
    } catch (error) {
      console.warn('Failed to analyze architecture for project:', project.id, error);
      architectureAnalysis = null;
    }
  }

  const linkedVideos = await Promise.all(
    projectResources.linkedVideos.map(async (link) => {
      const videos = await portfolioService.getLeadershipVideos(false);
      const video = videos.find(v => v.id === link.videoId);
      return { ...link, video };
    })
  );

  const categoryIcons = {
    'ai': '🤖',
    'architecture': '🏗️', 
    'leadership': '👥',
    'systems': '⚙️'
  };

  const categoryColors = {
    'ai': 'bg-blue-500/20 text-blue-300',
    'architecture': 'bg-purple-500/20 text-purple-300',
    'leadership': 'bg-green-500/20 text-green-300',
    'systems': 'bg-orange-500/20 text-orange-300'
  };

  const lastUpdated = project.lastUpdated 
    ? new Date(project.lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';



  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/projects" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Projects
            </Link>
          </div>

          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-6xl">{categoryIcons[project.category]}</span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.title}</h1>
                <div className="flex items-center gap-3 justify-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${categoryColors[project.category]}`}>
                    {project.category}
                  </span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    {project.language}
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                    {project.role}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {project.description}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {project.githubUrl && (
                <Button variant="primary" size="lg">
                  <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    View on GitHub →
                  </Link>
                </Button>
              )}
              {project.liveUrl && (
                <Button variant="outline" size="lg">
                  <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    Live Demo →
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg">
                <Link href={`/contact?project=${project.id}`}>
                  Discuss Project
                </Link>
              </Button>
            </div>

            <div className="text-sm text-gray-400">
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed Content */}
      <section className="pt-4 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ProjectPageClient 
            project={{
              ...project,
              language: project.language || 'Unknown',
              lastUpdated: project.lastUpdated || new Date().toISOString(),
              createdAt: project.createdAt || new Date().toISOString(),
              githubUrl: project.githubUrl || '',
              stars: project.stars || 0,
              forks: project.forks || 0,
              topics: project.topics || []
            }}
            photos={projectResources.photos.map(p => ({ ...p, url: p.url ?? null }))}
            linkedVideos={linkedVideos}
            architectureAnalysis={architectureAnalysis}
          />
        </div>
      </section>
    </div>
  );
}

 