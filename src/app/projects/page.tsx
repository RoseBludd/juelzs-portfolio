import PortfolioService, { SystemProject } from '@/services/portfolio.service';
import ProjectLinkingService, { ProjectPhoto } from '@/services/project-linking.service';
import ProjectsClient from '@/components/ui/ProjectsClient';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects | Juelzs - Real Production Systems',
  description: 'Explore my production systems and applications built for RestoreMasters LLC. From AI-powered platforms to mobile applications, see the real impact of systems thinking in action.',
  keywords: ['production systems', 'typescript', 'ai applications', 'mobile apps', 'business intelligence', 'api integrations'],
};

const categories = [
  {
    id: 'all',
    label: 'All Projects',
    description: 'View all production systems',
    icon: '🎯',
    color: 'bg-gray-500/20 text-gray-300'
  },
  {
    id: 'ai',
    label: 'AI & Machine Learning',
    description: 'Intelligent systems that learn and adapt',
    icon: '🤖',
    color: 'bg-blue-500/20 text-blue-300'
  },
  {
    id: 'architecture',
    label: 'Architecture & Design',
    description: 'Scalable system architectures and frameworks',
    icon: '🏗️',
    color: 'bg-purple-500/20 text-purple-300'
  },
  {
    id: 'leadership',
    label: 'Leadership & Strategy',
    description: 'Tools and platforms for team collaboration',
    icon: '👥',
    color: 'bg-green-500/20 text-green-300'
  },
  {
    id: 'systems',
    label: 'Systems Engineering',
    description: 'Infrastructure and core system components',
    icon: '⚙️',
    color: 'bg-orange-500/20 text-orange-300'
  }
];

interface ProjectWithPhotos extends SystemProject {
  photos: ProjectPhoto[];
  featuredImage?: ProjectPhoto;
}

export default async function ProjectsPage() {
  const portfolioService = PortfolioService.getInstance();
  const projectLinkingService = ProjectLinkingService.getInstance();
  
  let projects: ProjectWithPhotos[] = [];
  
  try {
    console.log('🚀 ProjectsPage: Starting data fetch...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔑 GitHub token available:', !!process.env.GITHUB_TOKEN);
    console.log('🔑 GitHub org:', process.env.GITHUB_ORGANIZATION);
    
    const rawProjects = await portfolioService.getActualProjects();
    console.log(`🎯 Projects Page: Loaded ${rawProjects.length} projects`);
    console.log(`📊 Project sources breakdown:`, rawProjects.map(p => `${p.title} (${p.source})`));
    
            // Load project photos and set featured images
        const projectsWithPhotos = await Promise.all(
          rawProjects.map(async (project) => {
            try {
              const resources = await projectLinkingService.getProjectResources(project.id);
              const photos = resources.photos || [];
              
              // Find featured image using featuredImageId, or fallback to first suitable image
              let featuredImage: ProjectPhoto | undefined;
              if (resources.featuredImageId) {
                featuredImage = photos.find(p => p.id === resources.featuredImageId);
              }
              
              // Fallback if no featured image is set or the set one doesn't exist
              if (!featuredImage && photos.length > 0) {
                featuredImage = photos.find(p => p.category === 'screenshot') ||
                               photos.find(p => p.category === 'interface') ||
                               photos[0];
              }
              
              return {
                ...project,
                photos,
                featuredImage
              };
            } catch (error) {
              console.warn(`Failed to load photos for project ${project.id}:`, error);
              return {
                ...project,
                photos: [],
                featuredImage: undefined
              };
            }
          })
        );
    
    // Ensure proper serialization by creating clean objects
    projects = projectsWithPhotos.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      role: project.role,
      techStack: project.techStack || [],
      architectureDiagram: project.architectureDiagram || '',
      videoUrl: project.videoUrl || '',
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      uniqueDecisions: project.uniqueDecisions || [],
      category: project.category,
      stars: project.stars || 0,
      forks: project.forks || 0,
      lastUpdated: project.lastUpdated || '',
      topics: project.topics || [],
      language: project.language || '',
      createdAt: project.createdAt || '',
      source: project.source,
      photos: project.photos || [],
      featuredImage: project.featuredImage
    }));
    
    if (projects.length === 0) {
      console.error('⚠️ No projects loaded from any source');
    } else if (projects.length <= 3) {
      console.warn('⚠️ Only got fallback projects - GitHub service likely failed');
      console.log('🔍 Debugging: Check if GitHub API is accessible in production');
    } else {
      console.log(`✅ Successfully loaded ${projects.length} projects`);
      console.log(`📊 Project sources: ${projects.map(p => p.source).join(', ')}`);
      console.log(`📸 Projects with photos: ${projects.filter(p => p.photos.length > 0).length}`);
    }
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Use empty array as fallback
    projects = [];
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Real Production Systems
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-6">
              Beyond concepts and theory—these are the actual systems powering RestoreMasters LLC. 
              From AI-driven automation to mobile field operations, each project solves real business challenges.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span className="px-3 py-1 bg-blue-500/20 rounded-full">Production Ready</span>
              <span className="px-3 py-1 bg-green-500/20 rounded-full">Business Impact</span>
              <span className="px-3 py-1 bg-purple-500/20 rounded-full">TypeScript Heavy</span>
              <span className="px-3 py-1 bg-orange-500/20 rounded-full">Full Stack</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{projects.length}</div>
              <div className="text-gray-400">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {projects.filter(p => p.featuredImage).length}
              </div>
              <div className="text-gray-400">With Visuals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {projects.filter(p => p.techStack.includes('TypeScript')).length}
              </div>
              <div className="text-gray-400">TypeScript</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {projects.filter(p => p.role === 'Lead Developer & Architect').length}
              </div>
              <div className="text-gray-400">Leadership Role</div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Client Component */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <ProjectsClient 
            projects={projects} 
            categories={categories}
          />
        </div>
      </section>

      {/* Leadership Integration CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            See My Leadership in Action
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            These projects showcase technical excellence, but leadership is where systems thinking truly shines. 
            Watch real coaching sessions and architecture reviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              <Link href="/leadership">View Leadership Videos</Link>
            </Button>
            <Button variant="outline" size="lg">
              <Link href="/systems">Explore System Architecture</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            These projects represent just a fraction of what&apos;s possible when systems thinking meets real-world problems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              <Link href="/contact">Start a Project</Link>
            </Button>
            <Button variant="outline" size="lg">
              <Link href="/philosophy">Learn My Approach</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 