import { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PortfolioService from '@/services/portfolio.service';

export const metadata: Metadata = {
  title: 'Systems Portfolio',
  description: 'Explore intelligent architectures and modular systems that demonstrate advanced engineering principles.',
};

export default async function SystemsPage() {
  const portfolioService = PortfolioService.getInstance();
  const projects = await portfolioService.getSystemArchitectures();

  const categories = ['all', 'ai', 'architecture', 'leadership', 'systems'];
  const categoryLabels = {
    all: 'All Systems',
    ai: 'AI & Machine Learning',
    architecture: 'Architecture & Design',
    leadership: 'Leadership & Strategy',
    systems: 'Systems Engineering'
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
              Powered by Prompt-Led Flow Architecture
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Systems That <span className="gradient-text">Think</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-8">
            Intelligent architectures and modular systems built using <strong>Prompt-Led Flow Architecture</strong> — 
            where AI-assisted development, modular tooling, and just-in-time enhancement create systems that 
            teach themselves and evolve with their teams.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === 'all' ? 'primary' : 'outline'}
                size="sm"
                className="text-sm"
              >
                {categoryLabels[category as keyof typeof categoryLabels]}
              </Button>
            ))}
          </div>
        </div>

        {/* Architecture Foundations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Data & Industry Agnostic</h3>
            <p className="text-sm text-gray-300 mb-4">Built with adapters and stable contracts so the same core system works across domains and data sources without rewrites.</p>
            <Button href="/philosophy/data-industry-agnostic" variant="outline" size="sm">Learn more</Button>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Proof of Concept → Progressive Enhancement</h3>
            <p className="text-sm text-gray-300 mb-4">Ship a minimal working flow, connect to real systems, then harden in iterations while keeping UX stable.</p>
            <Button href="/philosophy/poc-progressive-enhancement" variant="outline" size="sm">Learn more</Button>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Shift-Left</h3>
            <p className="text-sm text-gray-300 mb-4">Testing, observability, security, and rollback are architectural concerns from day one.</p>
            <Button href="/philosophy/shift-left-architecture" variant="outline" size="sm">Learn more</Button>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">Tower of Babel Architecture</h3>
            <p className="text-sm text-gray-300 mb-4">Single root with multiple specialized branches (services, data, AI). Add new integrations without touching core logic.</p>
            <div className="flex gap-2">
              <Button href="/philosophy/tower-of-babel-architecture" variant="outline" size="sm">Learn more</Button>
              <Button href="/systems/tower-of-babel" size="sm">View diagram</Button>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">CADIS – Living Thought Architecture</h3>
            <p className="text-sm text-gray-300 mb-4">Context-aware intelligence, memory, and orchestration that help systems learn and teams scale.</p>
            <Button href="/philosophy/cadis-living-thought-architecture" variant="outline" size="sm">Learn more</Button>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-pink-400 mb-2">Modular & Singleton Services</h3>
            <p className="text-sm text-gray-300 mb-4">Clear boundaries and singleton service roots keep systems composable, observable, and scalable.</p>
            <Button href="/philosophy/modular-singleton-services" variant="outline" size="sm">Learn more</Button>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {projects.map((project) => (
            <Card key={project.id} hover className="h-full">
              <div className="flex flex-col h-full">
                {/* Project Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                    {project.category.toUpperCase()}
                  </span>
                  <div className="flex space-x-2 text-gray-400">
                    <span className="text-xs">Curated System</span>
                  </div>
                </div>

                {/* Project Content */}
                <h3 className="text-xl font-semibold mb-3 text-white">{project.title}</h3>
                <p className="text-gray-400 mb-4">{project.description}</p>

                {/* Role */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">My Role:</h4>
                  <p className="text-sm text-gray-400">{project.role}</p>
                </div>

                {/* Unique Decisions */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Key Architectural Decisions:</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {project.uniqueDecisions.map((decision, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tech Stack */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Technology Stack:</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Architecture Diagram */}
                <div className="mb-4 bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 text-center">System Architecture</h4>
                  <div className="font-mono text-xs text-gray-300 overflow-x-auto">
                    {project.id === 'ai-modular-architecture' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`    ┌─────────────────────────────────────┐
    │          AI Engine Layer           │
    │  [Pattern] [Adapt] [Learn] [Scale] │
    └─────────────────┬───────────────────┘
                      │
    ┌─────────────────┼───────────────────┐
    │                 │                   │
    ▼                 ▼                   ▼
[Module A]      [Module B]        [Module C]
    │               │                   │
    └───────────────┼───────────────────┘
                    │
          [Intelligent Router]
                    │
      [Performance Monitor & ML Engine]
                    │
      [Self-Healing & Auto-Scaler]`}
                      </pre>
                    )}
                    {project.id === 'scalable-microservices-platform' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`┌───────────────────────────────────────┐
│       Service Mesh Layer              │
│  [Discovery] [Routing] [Security]     │
│  [ML Traffic] [Circuit Breaker]       │
└───────────────┬───────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
[Service A] [Service B] [Service C]
    │           │           │
    └───────────┼───────────┘
                │
┌───────────────▼───────────────┐
│       Observability           │
│  [Monitor] [AI Alert] [Scale] │
└───────────────────────────────┘`}
                      </pre>
                    )}
                     {project.id === 'tower-of-babel' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`           ┌───────────────────────────────┐
           │        Service Root          │
           │    (Single Entry Point)      │
           └─────────────┬─────────────────┘
                         │
        ┌────────────────┼───────────────┐
        │                │               │
        ▼                ▼               ▼
   [Main Branch]   [Analytics]      [Memory]
        │                │               │
   [API][DB][Auth]   [BI][ETL][ML]   [Cache][Sim]
                         │
               [Cross-Branch Intelligence]
                         │
                 [Graceful Fallbacks]`}
                      </pre>
                    )}
                    {project.id === 'realtime-data-processing-pipeline' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`[Input Stream] ──→ [Kafka] ──→ [Processor]
       │                            │
       │            ┌───────────────▼
       │            │        [ML Engine]
       │            │      [Anomaly Detection]
       ▼            ▼            ▼
[Batch Layer] [Real-time] [Adaptive Batching]
       │            │            │
       └────────────┼────────────┘
                    │
        [Intelligent Partitioning]
                    │
           [Output Storage]`}
                      </pre>
                    )}
                    {project.id === 'collaborative-realtime-platform' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`┌──────────────────────────────────────┐
│       WebSocket Gateway              │
│  [Real-time] [Conflict Resolve]     │
│  [AI Intent] [Operation Transform]  │
└──────────────┬───────────────────────┘
               │
  ┌────────────┼────────────┐
  │            │            │
  ▼            ▼            ▼
[Editor A]  [Editor B]  [Editor C]
  │            │            │
  └────────────┼────────────┘
               │
    [Smart Notifications & Sync]`}
                      </pre>
                    )}
                    {project.id === 'predictive-infrastructure-management' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`[Monitoring] ──→ [ML Predictor] ──→ [Alert]
      │              │                  │
      ▼              ▼                  ▼
 [Metrics]     [Failure Analysis]   [Auto-Fix]
      │              │                  │
      └──────────────┼──────────────────┘
                     │
        ┌────────────▼────────────┐
        │    Infrastructure       │
        │  [Self-Heal] [Optimize] │
        └─────────────────────────┘`}
                      </pre>
                    )}
                    {project.id === 'intelligent-api-gateway' && (
                      <pre className="whitespace-pre text-center leading-tight">
{`[Client] ──→ [Gateway] ──→ [Services]
              │     │
              ▼     ▼
        [Rate Limit] [Auth]
              │     │
              ▼     ▼
        [AI Threat] [Smart Cache]
              │     │
              └─────┘
          [ML Analytics]
               │
        [Performance Optimizer]`}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Video Placeholder */}
                {project.videoUrl && (
                  <div className="mb-4 bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Implementation Video</p>
                      <p className="text-xs text-gray-600 mt-1">Coming Soon</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-auto">
                  <Button href={`/systems/${project.id}`} variant="primary" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button href="/contact?project=${project.id}" variant="outline" size="sm">
                    Discuss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gray-800/50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Build Something <span className="gradient-text">Intelligent</span>?
          </h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Let&apos;s discuss how I can help you design and build systems that not only meet 
            your current needs but evolve with your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/contact" size="lg">
              Start a Project
            </Button>
            <Button href="/philosophy" variant="outline" size="lg">
              Learn My Approach
            </Button>
          </div>
        </div>

        {/* Leadership Integration */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-8 border border-purple-500/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              See These Systems Come to Life
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Building great systems requires great leadership. Watch me coach teams through complex 
              architectural decisions and guide technical implementations in real-time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Architecture Reviews</h3>
              <p className="text-sm text-gray-400">Deep technical discussions on system design</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Team Leadership</h3>
              <p className="text-sm text-gray-400">Strategic decision-making with teams</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Mentoring Sessions</h3>
              <p className="text-sm text-gray-400">Coaching developers on systems thinking</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Technical Discussions</h3>
              <p className="text-sm text-gray-400">Implementation and problem-solving</p>
            </div>
          </div>
          
          <div className="text-center">
            <Button href="/leadership" variant="primary" size="lg">
              Watch Leadership Videos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 