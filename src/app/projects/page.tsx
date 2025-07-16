import PortfolioService, { SystemProject } from '@/services/portfolio.service';
import Card from '@/components/ui/Card';
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

export default async function ProjectsPage() {
  const portfolioService = PortfolioService.getInstance();
  
  let projects: SystemProject[] = [];
  
  try {
    console.log('🚀 ProjectsPage: Starting data fetch...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔑 GitHub token available:', !!process.env.GITHUB_TOKEN);
    console.log('🔑 GitHub org:', process.env.GITHUB_ORGANIZATION);
    
    const rawProjects = await portfolioService.getSystemProjects();
    console.log(`🎯 Projects Page: Loaded ${rawProjects.length} projects`);
    console.log(`📊 Project sources breakdown:`, rawProjects.map(p => `${p.title} (${p.source})`));
    
    // Ensure proper serialization by creating clean objects
    projects = rawProjects.map(project => ({
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
      source: project.source
    }));
    
    if (projects.length === 0) {
      console.error('⚠️ No projects loaded from any source');
    } else if (projects.length <= 3) {
      console.warn('⚠️ Only got fallback projects - GitHub service likely failed');
      console.log('🔍 Debugging: Check if GitHub API is accessible in production');
    } else {
      console.log(`✅ Successfully loaded ${projects.length} projects`);
      console.log(`📊 Project sources: ${projects.map(p => p.source).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error loading projects:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Use empty array as fallback
    projects = [];
  }
  
  // Group projects by category
  const projectsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = projects.filter((p: SystemProject) => p.category === category.id);
    return acc;
  }, {} as Record<string, SystemProject[]>);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Real Production Systems
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{projects.length}</div>
              <div className="text-gray-400">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {projects.filter(p => p.category === 'ai').length}
              </div>
              <div className="text-gray-400">AI Systems</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {projects.filter(p => p.techStack.includes('TypeScript')).length}
              </div>
              <div className="text-gray-400">TypeScript</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {projects.filter(p => p.githubUrl).length}
              </div>
              <div className="text-gray-400">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects by Category */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {categories.map((category) => {
            const categoryProjects = projectsByCategory[category.id];
            if (categoryProjects.length === 0) return null;

            return (
              <div key={category.id} className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-4xl">{category.icon}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{category.label}</h2>
                    <p className="text-gray-400">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryProjects.map((project: SystemProject) => (
                    <Card key={project.id} className="group hover:scale-105 transition-transform duration-300">
                      <div className="p-6">
                        {/* Project Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span className={`px-2 py-1 rounded-full text-xs ${category.color}`}>
                                {category.label}
                              </span>
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                                {project.role}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400 mb-1">Primary</div>
                            <div className="text-sm font-medium text-white">{project.language}</div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 mb-4 line-clamp-3">{project.description}</p>

                        {/* Stats */}
                        <div className="mb-4 flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>⭐</span>
                            <span>{project.stars || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🍴</span>
                            <span>{project.forks || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>{project.lastUpdated || 'Recently'}</span>
                          </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-purple-400 mb-2">Tech Stack</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.techStack.slice(0, 4).map((tech: string, idx: number) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                            {project.techStack.length > 4 && (
                              <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                                +{project.techStack.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Unique Decisions */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-green-400 mb-2">Key Decisions</h4>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {project.uniqueDecisions.slice(0, 2).map((decision: string, idx: number) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                <span className="line-clamp-1">{decision}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="flex-1"
                          >
                            <Link href={`/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                          {project.githubUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                            >
                              <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                GitHub →
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
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