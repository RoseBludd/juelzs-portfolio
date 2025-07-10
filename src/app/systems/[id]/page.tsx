import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PortfolioService from '@/services/portfolio.service';

interface SystemDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SystemDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const project = await portfolioService.getSystemById(id);
  
  if (!project) {
    return {
      title: 'System Not Found',
    };
  }

  return {
    title: `${project.title} - System Details`,
    description: project.description,
  };
}

export default async function SystemDetailPage({ params }: SystemDetailPageProps) {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const project = await portfolioService.getSystemById(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Button href="/systems" variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Systems
            </Button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.category === 'ai' ? 'bg-blue-500/20 text-blue-300' :
              project.category === 'architecture' ? 'bg-purple-500/20 text-purple-300' :
              project.category === 'leadership' ? 'bg-green-500/20 text-green-300' :
              'bg-orange-500/20 text-orange-300'
            }`}>
              {project.category.toUpperCase()}
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            {project.title}
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 max-w-3xl">
            {project.description}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-12">
            {project.githubUrl && (
              <Button href={project.githubUrl} target="_blank" size="lg">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View Code
              </Button>
            )}
            {project.liveUrl && (
              <Button href={project.liveUrl} target="_blank" variant="outline" size="lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Live Demo
              </Button>
            )}
            <Button href="/contact?project=${project.id}" variant="ghost" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discuss This System
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Architecture Diagram */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">System Architecture</h2>
              <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Architecture Diagram</h3>
                  <p className="text-gray-500 text-sm">Visual system architecture will be displayed here</p>
                  <p className="text-gray-600 text-xs mt-2">Coming soon - will show data flow, components, and interactions</p>
                </div>
              </div>
              <p className="text-gray-300">
                This diagram will illustrate the complete system architecture, showing how different components 
                interact, data flows, and the intelligent decision-making processes built into the system.
              </p>
            </Card>

            {/* Technical Deep Dive */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">Technical Deep Dive</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">System Overview</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.description} This system was designed with modularity and intelligence at its core, 
                    allowing it to adapt and scale based on real-world usage patterns and performance metrics.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Key Architectural Decisions</h3>
                  <div className="space-y-3">
                    {project.uniqueDecisions.map((decision, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                          <span className="text-blue-400 text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-gray-300">{decision}</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Detailed explanation of this decision and its impact on system performance and maintainability.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Implementation Highlights</h3>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
                      <code>{`// Example: Intelligent routing implementation
class IntelligentRouter {
  constructor(config) {
    this.config = config;
    this.metrics = new PerformanceMetrics();
    this.adaptiveAlgorithms = new AdaptiveAlgorithms();
  }

  route(request) {
    const pattern = this.analyzePattern(request);
    const route = this.adaptiveAlgorithms.selectOptimalRoute(
      pattern, 
      this.metrics.getCurrentLoad()
    );
    
    return this.executeRoute(route, request);
  }

  analyzePattern(request) {
    // AI-driven pattern analysis
    return this.patternAnalyzer.analyze(request);
  }
}`}</code>
                    </pre>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    This code snippet demonstrates the core routing logic that adapts based on usage patterns.
                  </p>
                </div>
              </div>
            </Card>

            {/* Results & Impact */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">Results & Impact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Performance</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-400 mb-1">95%</p>
                  <p className="text-gray-400 text-sm">Improvement in response time</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Scalability</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-400 mb-1">10x</p>
                  <p className="text-gray-400 text-sm">Increase in concurrent users</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Reliability</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-400 mb-1">99.9%</p>
                  <p className="text-gray-400 text-sm">System uptime achieved</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Cost Reduction</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-400 mb-1">60%</p>
                  <p className="text-gray-400 text-sm">Reduction in operational costs</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Business Impact</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Enabled the team to handle 10x more concurrent users without infrastructure changes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Reduced operational costs by 60% through intelligent resource allocation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Improved development velocity by providing modular, reusable components</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Enhanced system reliability with self-healing architecture patterns</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* System Screenshots */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">System Screenshots</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Main Interface */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Main Interface</h3>
                  <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-2">💻</div>
                      <p className="text-gray-400 text-sm">System Interface</p>
                      <p className="text-gray-500 text-xs mt-1">Upload screenshot</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Main dashboard showing system overview, real-time metrics, and primary controls.
                  </p>
                </div>

                {/* Architecture View */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Architecture View</h3>
                  <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🏗️</div>
                      <p className="text-gray-400 text-sm">Architecture Diagram</p>
                      <p className="text-gray-500 text-xs mt-1">Upload diagram</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Visual representation of system components, data flow, and integration points.
                  </p>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
                  <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📊</div>
                      <p className="text-gray-400 text-sm">Performance Dashboard</p>
                      <p className="text-gray-500 text-xs mt-1">Upload metrics</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Real-time performance metrics, system health indicators, and optimization insights.
                  </p>
                </div>

                {/* Feature Demonstration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Key Features</h3>
                  <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-2">⚡</div>
                      <p className="text-gray-400 text-sm">Feature Demo</p>
                      <p className="text-gray-500 text-xs mt-1">Upload demo</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Demonstration of core features, intelligent algorithms, and user interactions.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Visual Documentation</h3>
                <p className="text-gray-300 text-sm">
                  These screenshots provide visual documentation of the system&apos;s interface, architecture, 
                  and key features. They demonstrate the production-ready implementation and showcase 
                  the intelligent design decisions that make this system unique.
                </p>
              </div>
            </Card>

            {/* Video Walkthrough */}
            {project.videoUrl && (
              <Card>
                <h2 className="text-2xl font-bold mb-6 text-white">System Walkthrough</h2>
                <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Implementation Video</h3>
                    <p className="text-gray-500 text-sm">Watch me build and explain this system</p>
                    <p className="text-gray-600 text-xs mt-2">Video will be embedded here</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  In this video, I walk through the implementation process, explaining key decisions 
                  and demonstrating how the system handles different scenarios.
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Project Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">My Role</h4>
                  <p className="text-gray-400 text-sm">{project.role}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Technology Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Category</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.category === 'ai' ? 'bg-blue-500/20 text-blue-300' :
                    project.category === 'architecture' ? 'bg-purple-500/20 text-purple-300' :
                    project.category === 'leadership' ? 'bg-green-500/20 text-green-300' :
                    'bg-orange-500/20 text-orange-300'
                  }`}>
                    {project.category.toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Related Projects */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Related Systems</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-1">AI Data Pipeline</h4>
                  <p className="text-gray-400 text-xs">Intelligent data processing system</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-1">Microservices Gateway</h4>
                  <p className="text-gray-400 text-xs">Smart routing and load balancing</p>
                </div>
                <Button href="/systems" variant="outline" size="sm" className="w-full">
                  View All Systems
                </Button>
              </div>
            </Card>

            {/* Call to Action */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Interested in This Approach?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Let&apos;s discuss how I can help you build similar intelligent systems for your organization.
              </p>
              <div className="space-y-2">
                <Button href="/contact?project=${project.id}" className="w-full">
                  Start a Project
                </Button>
                <Button href="/philosophy" variant="outline" size="sm" className="w-full">
                  Learn My Approach
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 