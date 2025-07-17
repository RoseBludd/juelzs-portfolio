'use client';

import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import Button from './Button';
import Link from 'next/link';
import type { ProjectOverview } from '@/services/project-overview.service';

interface ProjectPhoto {
  id: string;
  url: string | null;
  filename: string;
  alt?: string;
  category: string;
  order: number;
}

interface LinkedVideo {
  id: string;
  videoId: string;
  videoTitle: string;
  linkType: string;
  relevanceScore: number;
  notes?: string;
  video?: {
    id: string;
    title: string;
    description?: string;
    participants?: string[];
    duration?: string;
  };
}

interface ArchitectureAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  designPatterns: {
    name: string;
    confidence: number;
    description: string;
  }[];
  bestPractices: {
    modularity: number;
    testability: number;
    maintainability: number;
    scalability: number;
    security: number;
    performance: number;
  };
  codeQuality: {
    structure: number;
    documentation: number;
    consistency: number;
    complexity: number;
  };
  frameworksAndLibraries: {
    name: string;
    usage: 'optimal' | 'good' | 'needs-improvement';
    reasoning: string;
  }[];
  architecturalDecisions: string[];
  recommendations: string[];
  technicalDebt: {
    level: 'low' | 'medium' | 'high';
    areas: string[];
    priority: string[];
  };
  summary: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  role: string;
  techStack: string[];
  topics: string[];
  uniqueDecisions: string[];
  stars: number;
  forks: number;
  createdAt: string;
  lastUpdated: string;
  githubUrl: string;
  liveUrl?: string;
}

interface ProjectPageClientProps {
  project: Project;
  photos: ProjectPhoto[];
  linkedVideos: LinkedVideo[];
  architectureAnalysis: ArchitectureAnalysis | null;
  projectOverview: ProjectOverview | null;
}

export default function ProjectPageClient({ 
  photos, 
  linkedVideos, 
  architectureAnalysis,
  projectOverview 
}: Omit<ProjectPageClientProps, 'project'>) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📋',
      badge: null
    },
    {
      id: 'showcase',
      label: 'Project Showcase',
      icon: '📸',
      badge: photos.length > 0 ? photos.length : null
    },
    {
      id: 'videos',
      label: 'Leadership Videos',
      icon: '🎥',
      badge: linkedVideos.length > 0 ? linkedVideos.length : null
    },
    {
      id: 'system-architecture',
      label: 'System Architecture',
      icon: '🏗️',
      badge: 'Visual'
    },
    {
      id: 'architecture',
      label: 'Architecture Analysis',
      icon: '📊',
      badge: architectureAnalysis ? Math.round(architectureAnalysis.overallScore) : '?'
    }
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'overview' && (
          <ProjectOverviewTab projectOverview={projectOverview} />
        )}
        
        {activeTab === 'showcase' && (
          <ProjectShowcaseTab photos={photos} />
        )}
        
        {activeTab === 'videos' && (
          <ProjectVideosTab linkedVideos={linkedVideos} />
        )}
        
        {activeTab === 'system-architecture' && (
          <ProjectSystemArchitectureTab analysis={architectureAnalysis} />
        )}
        
        {activeTab === 'architecture' && (
          <ProjectArchitectureTab analysis={architectureAnalysis} />
        )}
      </div>
    </div>
  );
}

// Tab Content Components
function ProjectOverviewTab({ projectOverview }: { projectOverview: ProjectOverview | null }) {
  if (!projectOverview) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">🔍</div>
        <p className="text-gray-400">Project overview analysis not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Purpose & Overview */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-blue-400">🎯</span>
          What This System Does
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-3">System Purpose</h3>
            <p className="text-gray-300 leading-relaxed">{projectOverview.systemPurpose}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Functionality</h3>
            <p className="text-gray-300 leading-relaxed">{projectOverview.whatItDoes}</p>
          </div>
        </div>
      </Card>

      {/* Key Features & Use Case */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-green-400">✨</span>
            Key Features
          </h2>
          <ul className="space-y-3">
            {projectOverview.keyFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-green-400 mt-1">•</span>
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-purple-400">🎪</span>
            Use Case & Users
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-purple-400 mb-2">Primary Use Case</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{projectOverview.useCase}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-400 mb-2">Target Users</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{projectOverview.targetUsers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Business Value & Technical Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-yellow-400">💼</span>
            Business Value
          </h2>
          <p className="text-gray-300 leading-relaxed">{projectOverview.businessValue}</p>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-orange-400">🛠️</span>
            Technical Highlights
          </h2>
          <ul className="space-y-3">
            {projectOverview.technicalHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-orange-400 mt-1">•</span>
                <span className="text-gray-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Project Quality Score */}
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3">
          <span className="text-blue-400">📊</span>
          Project Quality Score
        </h2>
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-2xl mb-4">
          {projectOverview.score}/10
        </div>
        <p className="text-gray-400 text-sm">
          Based on complexity, utility, and apparent quality
        </p>
      </Card>
    </div>
  );
}

function ProjectShowcaseTab({ photos }: { photos: ProjectPhoto[] }) {
  const [activeView, setActiveView] = useState('all');
  const [lightboxImage, setLightboxImage] = useState<ProjectPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📸</div>
        <h3 className="text-lg font-medium text-white mb-2">No Photos Available</h3>
        <p className="text-gray-300">
          Photos for this project haven&apos;t been uploaded yet. Check back later for visual documentation.
        </p>
      </div>
    );
  }

  // Get available photo categories
  const availableCategories = [...new Set(photos.map(p => p.category))];

  // Define project views with dynamic configuration
  const getProjectViews = () => {
    // Fallback to static configuration for server-side rendering
    const staticViews = [
      { id: 'all', label: 'All Views', icon: '👁️', categories: [], description: 'Show all photos' },
      { id: 'admin', label: 'Admin View', icon: '⚙️', categories: ['interface', 'dashboard', 'admin'], description: 'Administrative interfaces' },
      { id: 'developer', label: 'Developer View', icon: '💻', categories: ['screenshot', 'diagram', 'analytics', 'architecture'], description: 'Developer tools and technical views' },
      { id: 'mobile', label: 'Mobile View', icon: '📱', categories: ['mobile', 'responsive'], description: 'Mobile interfaces' },
      { id: 'demo', label: 'Demo View', icon: '🎬', categories: ['demo', 'workflow'], description: 'Live demonstrations' },
      { id: 'api', label: 'API View', icon: '🔌', categories: ['api', 'integration', 'docs'], description: 'API documentation' }
    ];

    return staticViews.filter(view => {
      if (view.id === 'all') return true;
      // Only show views that have photos in their categories
      return view.categories.some(category => availableCategories.includes(category));
    }).map(view => ({
      ...view,
      count: view.id === 'all' ? photos.length : 
        photos.filter(p => view.categories.includes(p.category)).length
    }));
  };

  const views = getProjectViews();

  // Filter photos based on active view
  const getFilteredPhotos = () => {
    if (activeView === 'all') return photos;
    
    const activeViewConfig = views.find(v => v.id === activeView);
    if (!activeViewConfig) return photos;
    
    const filtered = photos.filter(photo => activeViewConfig.categories.includes(photo.category));
    
    // Debug logging
    console.log(`🔍 ProjectShowcaseTab Debug:`);
    console.log(`   Active view: ${activeView}`);
    console.log(`   View config categories:`, activeViewConfig.categories);
    console.log(`   Total photos:`, photos.length);
    console.log(`   Filtered photos:`, filtered.length);
    console.log(`   Photo categories:`, photos.map(p => p.category));
    
    return filtered;
  };

  const filteredPhotos = getFilteredPhotos().sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="space-y-8">
        {/* View Selector */}
        <div className="flex flex-wrap gap-3 justify-center">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${activeView === view.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-600'
                }
              `}
            >
              <span className="text-lg">{view.icon}</span>
              <span>{view.label}</span>
              {view.count > 0 && (
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${activeView === view.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-600 text-gray-300'
                  }
                `}>
                  {view.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dribbble-style Photo Gallery */}
        <div className="space-y-12">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group cursor-pointer"
              onClick={() => setLightboxImage(photo)}
            >
              {/* Photo Container */}
              <div className="relative overflow-hidden rounded-xl bg-gray-900 shadow-2xl">
                <img
                  src={photo.url || '/placeholder-image.png'}
                  alt={photo.alt || photo.filename}
                  className="w-full h-auto object-contain max-h-[80vh] transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1 capitalize">
                          {photo.category.replace('-', ' ')} View
                        </h3>
                        {photo.alt && (
                          <p className="text-gray-200 text-sm">{photo.alt}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-sm">View Full Size</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-xs font-medium capitalize">
                    {photo.category.replace('-', ' ')}
                  </span>
                </div>

                {/* Photo Number */}
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                    {index + 1} of {filteredPhotos.length}
                  </span>
                </div>
              </div>

              {/* Photo Info */}
              <div className="mt-4 px-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-gray-300 font-medium">
                    {photo.filename.replace(/\.[^/.]+$/, "").replace(/[\d_-]/g, ' ').trim()}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {photo.category.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPhotos.length === 0 && activeView !== 'all' && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-white mb-2">No Photos in This View</h3>
            <p className="text-gray-300">
              No photos have been categorized for the {views.find(v => v.id === activeView)?.label} yet.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full">
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={lightboxImage.url || '/placeholder-image.png'}
              alt={lightboxImage.alt || lightboxImage.filename}
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white font-semibold text-xl mb-2 capitalize">
                {lightboxImage.category.replace('-', ' ')} View
              </h3>
              {lightboxImage.alt && (
                <p className="text-gray-200">{lightboxImage.alt}</p>
              )}
              <p className="text-gray-400 text-sm mt-2">
                {lightboxImage.filename}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProjectVideosTab({ linkedVideos }: { linkedVideos: LinkedVideo[] }) {
  if (linkedVideos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-medium text-white mb-2">No Videos Linked</h3>
        <p className="text-gray-300">
          No leadership videos have been linked to this project yet. These videos showcase the technical decision-making process and architecture discussions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {linkedVideos.map((link) => (
        <Card key={link.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {link.video?.title || link.videoTitle}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  link.linkType === 'technical-discussion' ? 'bg-blue-100 text-blue-800' :
                  link.linkType === 'architecture-review' ? 'bg-purple-100 text-purple-800' :
                  link.linkType === 'mentoring-session' ? 'bg-green-100 text-green-800' :
                  link.linkType === 'demo' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {link.linkType.replace('-', ' ')}
                </span>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    link.relevanceScore >= 8 ? 'text-green-400' :
                    link.relevanceScore >= 5 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {link.relevanceScore}/10 relevance
                  </span>
                </div>
              </div>
            </div>
          </div>

          {link.video?.description && (
            <p className="text-gray-300 text-sm mb-4">
              {link.video.description}
            </p>
          )}

          {link.notes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-purple-400 mb-1">Project Relevance</h4>
              <p className="text-gray-300 text-sm">{link.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <span>
              {link.video?.participants?.join(', ') || 'Participants not available'}
            </span>
            <span>{link.video?.duration || 'Duration not available'}</span>
          </div>

          <Button variant="primary" size="sm" className="w-full">
            <Link href={`/leadership/${link.video?.id || link.videoId}`}>
              Watch Video →
            </Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ProjectSystemArchitectureTab({ analysis }: { analysis: ArchitectureAnalysis | null }) {
  if (!analysis) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🏗️</div>
        <h3 className="text-lg font-medium text-white mb-2">System Architecture Visualization</h3>
        <p className="text-gray-300 mb-6">
          ByteByteGo-style system visualization requires architecture analysis data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
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
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 7) return 'text-blue-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-12">
      {/* System Architecture Overview */}
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-blue-400">🏗️</span>
            System Architecture Overview
          </h2>
          <p className="text-gray-400">ByteByteGo-style system visualization and analysis</p>
        </div>

        {/* Visual Architecture Diagram */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">📐</span>
            Visual Architecture Diagram
          </h3>
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
            <ArchitectureDiagram analysis={analysis} />
          </div>
        </Card>

        {/* Project Summary Block */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">📋</span>
            Project Summary
          </h3>
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/20">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Architecture Style</h4>
                  <p className="text-white font-medium text-lg">
                    {analysis.designPatterns.length > 0 ? analysis.designPatterns[0].name : 'Modern Modular Architecture'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Primary Strengths</h4>
                  <p className="text-white font-medium text-lg">
                    {analysis.strengths.slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Core Modules Used</h4>
                <div className="flex flex-wrap gap-3 mt-2">
                  {analysis.frameworksAndLibraries.slice(0, 6).map((framework, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                      {framework.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Key Architectural Decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Technical Decisions */}
          <Card className="p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">💡</span>
              Key Technical Decisions
            </h3>
            <div className="space-y-6">
              {analysis.architecturalDecisions.slice(0, 4).map((decision, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-500/5 rounded-r-lg">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mt-1 mr-4 flex-shrink-0">
                      <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-gray-300 mb-2">{decision}</p>
                      <div className="text-xs text-gray-500">
                        Strategic architectural thinking
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Design Patterns */}
          <Card className="p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">🏛️</span>
              Design Patterns
            </h3>
            <div className="space-y-6">
              {analysis.designPatterns.map((pattern, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">{pattern.name}</h4>
                    <div className={`text-sm font-bold ${getScoreColor(pattern.confidence)}`}>
                      {pattern.confidence}/10
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{pattern.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Technical Artifacts & Resources */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="text-2xl mr-3">🔗</span>
            Technical Artifacts & Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
              <div className="text-center">
                <div className="text-4xl mb-4">🎥</div>
                <h4 className="text-xl font-bold text-white mb-3">Leadership Videos</h4>
                <p className="text-gray-300 text-sm mb-4">
                  Technical discussions and architectural decision videos
                </p>
                <div className="text-xs text-gray-500">Coming soon - video integration</div>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
              <div className="text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h4 className="text-xl font-bold text-white mb-3">AI Analysis</h4>
                <p className="text-gray-300 text-sm mb-4">
                  GPT-4 powered analysis of architectural decisions
                </p>
                <div className="text-xs text-green-400">✓ Active & Running</div>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <div className="text-center">
                <div className="text-4xl mb-4">📚</div>
                <h4 className="text-xl font-bold text-white mb-3">Registry Modules</h4>
                <p className="text-gray-300 text-sm mb-4">
                  Reusable components and modules
                </p>
                <div className="text-xs text-gray-500">Integration available</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProjectArchitectureTab({ analysis }: { analysis: ArchitectureAnalysis | null }) {
  if (!analysis) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-white mb-2">Architecture Analysis Unavailable</h3>
        <p className="text-gray-300 mb-6">
          AI-powered architecture analysis is currently unavailable. This feature analyzes code structure, design patterns, and best practices.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
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
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 7) return 'text-blue-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Strong';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Solid';
    return 'Developing';
  };

  return (
    <div className="space-y-8">
      {/* Overall Assessment */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full mb-4">
          <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
            {analysis.overallScore}/10
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Architectural Excellence</h2>
        <p className="text-gray-300 max-w-3xl mx-auto">{analysis.summary}</p>
      </div>

      {/* Architectural Strengths */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="text-2xl mr-3">✅</span>
          Demonstrated Architectural Expertise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.strengths.map((strength, index) => (
            <div key={index} className="flex items-start">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <p className="text-gray-300">{strength}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Excellence Metrics */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-white mb-6">Excellence Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {Object.entries(analysis.bestPractices).map(([metric, score]) => (
            <div key={metric} className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(score)}`}>
                {score}/10
              </div>
              <div className="text-sm text-gray-400 capitalize mb-1">{metric}</div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                score >= 8 ? 'bg-green-500/20 text-green-300' : 
                score >= 7 ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {getScoreLabel(score)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Design Patterns Identified */}
      {analysis.designPatterns && analysis.designPatterns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">🧩</span>
            Sophisticated Design Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.designPatterns.map((pattern, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-400">{pattern.name}</h4>
                  <span className={`text-sm ${getScoreColor(pattern.confidence)}`}>
                    {pattern.confidence}/10
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{pattern.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Intelligent Architectural Decisions */}
      {analysis.architecturalDecisions && analysis.architecturalDecisions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            Key Architectural Decisions
          </h3>
          <div className="space-y-3">
            {analysis.architecturalDecisions.map((decision, index) => (
              <div key={index} className="flex items-start">
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <span className="text-blue-400 text-sm font-semibold">{index + 1}</span>
                </div>
                <p className="text-gray-300">{decision}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Future Enhancement Opportunities */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            Scaling & Enhancement Opportunities
          </h3>
          <div className="space-y-3">
            {analysis.recommendations.slice(0, 4).map((recommendation, index) => (
              <div key={index} className="flex items-start">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <span className="text-purple-400 text-sm font-semibold">{index + 1}</span>
                </div>
                <p className="text-gray-300">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tech Stack Assessment */}
      {analysis.frameworksAndLibraries && analysis.frameworksAndLibraries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="text-2xl mr-3">⚡</span>
            Technology Choices & Implementation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.frameworksAndLibraries.map((tech, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-400">{tech.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tech.usage === 'optimal' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {tech.usage === 'optimal' ? 'Excellent' : 'Good'}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{tech.reasoning}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Architecture Diagram Component
function ArchitectureDiagram({ analysis }: { analysis: ArchitectureAnalysis }) {
  const [diagramType, setDiagramType] = useState<'system' | 'flow' | 'deployment'>('system');
  
  // Generate Mermaid diagram based on analysis
  const generateSystemDiagram = () => {
    const patterns = analysis.designPatterns.map(p => p.name.replace(/\s+/g, '')).slice(0, 3);
    const frameworks = analysis.frameworksAndLibraries.map(f => f.name.replace(/[^a-zA-Z0-9]/g, '')).slice(0, 4);
    
    return `graph TB
      A[Client Layer] --> B[API Gateway]
      B --> C[${patterns[0] || 'Core'} Service]
      C --> D[${patterns[1] || 'Data'} Layer]
      C --> E[${frameworks[0] || 'Framework'} Engine]
      E --> F[${frameworks[1] || 'Cache'} System]
      D --> G[Database]
      F --> H[External APIs]
      
      style A fill:#3b82f6,stroke:#1d4ed8,color:#fff
      style B fill:#8b5cf6,stroke:#6d28d9,color:#fff
      style C fill:#10b981,stroke:#047857,color:#fff
      style D fill:#f59e0b,stroke:#d97706,color:#fff
      style E fill:#ef4444,stroke:#dc2626,color:#fff
      style F fill:#06b6d4,stroke:#0891b2,color:#fff
      style G fill:#6b7280,stroke:#374151,color:#fff
      style H fill:#f97316,stroke:#ea580c,color:#fff`;
  };

  const generateFlowDiagram = () => {
    return `sequenceDiagram
      participant U as User
      participant A as API
      participant S as Service
      participant D as Database
      
      U->>A: Request
      A->>S: Process
      S->>D: Query
      D-->>S: Data
      S-->>A: Response
      A-->>U: Result
      
      Note over S: ${analysis.designPatterns[0]?.name || 'Design Pattern'}
      Note over D: Optimized Storage`;
  };

  const generateDeploymentDiagram = () => {
    return `graph LR
      A[Load Balancer] --> B[App Server 1]
      A --> C[App Server 2]
      B --> D[Microservice A]
      B --> E[Microservice B]
      C --> D
      C --> E
      D --> F[Database Cluster]
      E --> F
      D --> G[Cache Layer]
      E --> G
      
      style A fill:#3b82f6,stroke:#1d4ed8,color:#fff
      style B fill:#10b981,stroke:#047857,color:#fff
      style C fill:#10b981,stroke:#047857,color:#fff
      style D fill:#8b5cf6,stroke:#6d28d9,color:#fff
      style E fill:#8b5cf6,stroke:#6d28d9,color:#fff
      style F fill:#ef4444,stroke:#dc2626,color:#fff
      style G fill:#f59e0b,stroke:#d97706,color:#fff`;
  };

  const getCurrentDiagram = () => {
    switch (diagramType) {
      case 'system': return generateSystemDiagram();
      case 'flow': return generateFlowDiagram();
      case 'deployment': return generateDeploymentDiagram();
      default: return generateSystemDiagram();
    }
  };

  return (
    <div className="space-y-4">
      {/* Diagram Type Selector */}
      <div className="flex gap-2 justify-center">
        {[
          { id: 'system', label: 'System View', icon: '🏗️' },
          { id: 'flow', label: 'Data Flow', icon: '🔄' },
          { id: 'deployment', label: 'Deployment', icon: '🚀' }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setDiagramType(type.id as 'system' | 'flow' | 'deployment')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              diagramType === type.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* Mermaid Diagram Container */}
      <div className="bg-white rounded-lg p-6 min-h-[400px] flex items-center justify-center">
        <MermaidDiagram diagram={getCurrentDiagram()} />
      </div>
    </div>
  );
}

// Mermaid Diagram Component
function MermaidDiagram({ diagram }: { diagram: string }) {
  const [isClient, setIsClient] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !diagramRef.current) return;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1e40af',
            primaryBorderColor: '#1d4ed8',
            lineColor: '#6b7280',
            secondaryColor: '#8b5cf6',
            tertiaryColor: '#10b981',
            background: '#ffffff',
            mainBkg: '#f8fafc',
            secondBkg: '#e2e8f0',
            tertiaryBkg: '#cbd5e1'
          }
        });

        const element = diagramRef.current;
        if (element) {
          // Clear previous content
          element.innerHTML = '';
          
          // Generate unique ID for this diagram
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          try {
            const { svg } = await mermaid.render(id, diagram);
            element.innerHTML = svg;
          } catch (error) {
            console.error('Mermaid render error:', error);
            element.innerHTML = `
              <div class="text-center p-8">
                <div class="text-gray-500 mb-2">🏗️</div>
                <p class="text-gray-600 text-sm">Diagram generation in progress...</p>
                <p class="text-gray-500 text-xs mt-2">Complex architecture visualization</p>
              </div>
            `;
          }
        }
      } catch (error) {
        console.error('Mermaid import error:', error);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="text-center p-8">
              <div class="text-gray-500 mb-2">📐</div>
              <p class="text-gray-600 text-sm">Architecture diagram available</p>
              <p class="text-gray-500 text-xs mt-2">Visual system overview</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [isClient, diagram]);

  if (!isClient) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 mb-2">⏳</div>
        <p className="text-gray-600 text-sm">Loading diagram...</p>
      </div>
    );
  }

  return <div ref={diagramRef} className="w-full" />;
} 