import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import GitHubService from '@/services/github.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const gitHubService = GitHubService.getInstance();
  const { id } = await params;
  const project = await gitHubService.getRepositoryById(id);

  if (!project) {
    return {
      title: 'Project Not Found | Juelzs',
      description: 'The requested project could not be found.',
    };
  }

  return {
    title: `${project.name} | Juelzs - Production System Details`,
    description: `${project.description} - ${project.businessImpact}`,
    keywords: [project.name, ...project.languages.map(l => l.name), 'production system'],
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const gitHubService = GitHubService.getInstance();
  const { id } = await params;
  const project = await gitHubService.getRepositoryById(id);

  if (!project) {
    notFound();
  }

  const categoryInfo = gitHubService.getCategoryInfo().find(c => c.id === project.category);
  const lastUpdated = new Date(project.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/projects" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Projects
            </Link>
          </div>

          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-6xl">{categoryInfo?.icon}</span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.name}</h1>
                <div className="flex items-center gap-3 justify-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${categoryInfo?.color}`}>
                    {categoryInfo?.label}
                  </span>
                  {project.isPrivate && (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                      Private Repository
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    {project.primaryLanguage}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {project.description}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {!project.isPrivate && (
                <Button variant="primary" size="lg">
                  <Link href={project.url} target="_blank" rel="noopener noreferrer">
                    View on GitHub →
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg">
                <Link href="/contact?project=${project.id}">
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

      {/* Project Details */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Business Impact */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-blue-400">📈</span>
                Business Impact
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                {project.businessImpact}
              </p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400 mb-1">Production</div>
                  <div className="text-sm text-gray-400">Status</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">Active</div>
                  <div className="text-sm text-gray-400">Development</div>
                </div>
              </div>
            </Card>

            {/* Technical Stack */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-purple-400">⚙️</span>
                Technical Stack
              </h2>
              <div className="space-y-4 mb-6">
                {project.languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-white font-medium">{lang.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400 transition-all duration-300"
                          style={{ width: `${Math.min(lang.percentage || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">
                        {lang.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-400">
                Primary Language: <span className="text-white">{project.primaryLanguage}</span>
              </div>
            </Card>

            {/* Technical Highlights */}
            <Card className="p-8 lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-orange-400">🔧</span>
                Technical Highlights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.technicalHighlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* System Screenshots */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">System Screenshots</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Visual overview of the system interface, key features, and user experience 
              demonstrating the production-ready implementation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main System Interface */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-blue-400">💻</span>
                Main System Interface
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-gray-400">System Interface Screenshot</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload screenshot of main system interface
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Main dashboard and primary user interface showing core functionality, 
                navigation, and key metrics in production environment.
              </p>
            </Card>

            {/* Mobile/Responsive View */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-green-400">📱</span>
                Mobile & Responsive Design
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-gray-400">Mobile Interface Screenshot</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload mobile/responsive view screenshot
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Mobile-optimized interface demonstrating responsive design, 
                touch-friendly interactions, and optimized user experience across devices.
              </p>
            </Card>

            {/* Key Features Demo */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-purple-400">⚡</span>
                Key Features in Action
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-400">Feature Demo Screenshot</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload screenshot of key features
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Demonstration of core features, workflows, and unique functionality 
                that delivers business value and user satisfaction.
              </p>
            </Card>

            {/* Analytics & Performance */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-orange-400">📊</span>
                Analytics & Performance
              </h3>
              <div className="bg-gray-800 rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-600">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-gray-400">Analytics Screenshot</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Upload analytics/performance dashboard
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Real-time analytics, performance metrics, and operational dashboards 
                showing system health, usage patterns, and business KPIs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture & Implementation */}
      <section className="py-16 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">System Architecture</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              This system demonstrates production-ready architecture patterns and best practices 
              for scalable, maintainable enterprise applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Architecture Principles */}
            <Card className="p-6 text-center">
              <div className="text-3xl mb-4">🏗️</div>
              <h3 className="text-xl font-bold mb-3">Architecture</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Modular design patterns</li>
                <li>• Singleton implementations</li>
                <li>• Scalable infrastructure</li>
                <li>• Environment-aware configs</li>
              </ul>
            </Card>

            {/* Development Practices */}
            <Card className="p-6 text-center">
              <div className="text-3xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3">Development</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• TypeScript-first approach</li>
                <li>• Progressive enhancement</li>
                <li>• Shift-left principles</li>
                <li>• Production-ready code</li>
              </ul>
            </Card>

            {/* Integration & Deployment */}
            <Card className="p-6 text-center">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3">Deployment</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• CI/CD pipelines</li>
                <li>• Environment management</li>
                <li>• Monitoring & logging</li>
                <li>• Performance optimization</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Related Projects</h2>
          <div className="text-center">
            <p className="text-gray-300 mb-8">
              Explore other production systems in the same category or discover different approaches to solving complex problems.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" size="md">
                <Link href="/projects">View All Projects</Link>
              </Button>
              <Button variant="outline" size="md">
                <Link href="/systems">Architecture Showcase</Link>
              </Button>
              <Button variant="primary" size="md">
                <Link href="/contact">Start a Project</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 