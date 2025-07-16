'use client';

import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import Button from './Button';
import Link from 'next/link';

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
}

export default function ProjectPageClient({ 
  project, 
  photos, 
  linkedVideos, 
  architectureAnalysis 
}: ProjectPageClientProps) {
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
          <ProjectOverviewTab project={project} />
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
function ProjectOverviewTab({ project }: { project: Project }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Project Stats */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-blue-400">📈</span>
          Project Stats
        </h2>
        <div className="grid grid-cols-2 gap-4 text-center mb-6">
          <div>
            <div className="text-2xl font-bold text-green-400 mb-1">{project.stars}</div>
            <div className="text-sm text-gray-400">Stars</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 mb-1">{project.forks}</div>
            <div className="text-sm text-gray-400">Forks</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">Created</div>
          <div className="text-white">{new Date(project.createdAt).toLocaleDateString()}</div>
        </div>
      </Card>

      {/* Technical Stack */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-purple-400">⚙️</span>
          Technical Stack
        </h2>
        <div className="space-y-3 mb-6">
          {project.techStack.slice(0, 5).map((tech, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-white font-medium">{tech}</span>
              <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                {idx === 0 ? 'Primary' : 'Secondary'}
              </span>
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-400">
          Primary Language: <span className="text-white">{project.language}</span>
        </div>
        {project.topics.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-400 mb-2">Topics</div>
            <div className="flex flex-wrap gap-2">
              {project.topics.map((topic, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Key Decisions */}
      <Card className="p-8 lg:col-span-2">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-orange-400">🔧</span>
          Key Technical Decisions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {project.uniqueDecisions.map((decision, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-gray-300">{decision}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProjectShowcaseTab({ photos }: { photos: ProjectPhoto[] }) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {photos
        .sort((a, b) => a.order - b.order)
        .map((photo) => (
          <Card key={photo.id} className="overflow-hidden group">
            <div className="relative">
              <img
                src={photo.url || '/placeholder-image.png'}
                alt={photo.alt || photo.filename}
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-black/60 text-white rounded text-xs capitalize">
                  {photo.category.replace('-', ' ')}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-white mb-2 capitalize">
                {photo.category.replace('-', ' ')}
              </h3>
              {photo.alt && (
                <p className="text-sm text-gray-400">{photo.alt}</p>
              )}
            </div>
          </Card>
        ))}
    </div>
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