'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CADISProject {
  id: string;
  name: string;
  type: 'implementation' | 'integration' | 'enhancement' | 'new-project';
  status: 'planning' | 'development' | 'preview' | 'deployed';
  confidence: number;
  description: string;
  technologies: string[];
  estimatedTime: string;
  actualTime?: string;
  previewUrl?: string;
  repositoryUrl?: string;
  approvalRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function CADISHub() {
  const [projects, setProjects] = useState<CADISProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with real API call
    const mockProjects: CADISProject[] = [
      {
        id: 'storm-tracker-reonomy',
        name: 'Storm Tracker + Reonomy Integration',
        type: 'integration',
        status: 'planning',
        confidence: 92,
        description: 'Parallel Reonomy API integration with PropertyRadar for consolidated company data',
        technologies: ['Next.js', 'Reonomy API', 'PropertyRadar API', 'TypeScript'],
        estimatedTime: '4-6 hours',
        approvalRequired: false,
        riskLevel: 'low',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ai-callers-bland',
        name: 'AI Callers + Bland.ai Integration',
        type: 'new-project',
        status: 'planning',
        confidence: 89,
        description: 'New repository with Bland.ai integration and multi-workflow roofing campaigns',
        technologies: ['Next.js', 'Bland.ai', 'Twilio', 'Multi-Agent Architecture'],
        estimatedTime: '8-12 hours',
        approvalRequired: true,
        riskLevel: 'medium',
        createdAt: new Date().toISOString()
      }
    ];
    
    setProjects(mockProjects);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-500';
      case 'development': return 'bg-blue-500';
      case 'preview': return 'bg-purple-500';
      case 'deployed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white text-xl">🧠 CADIS is analyzing projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-white">{projects.length}</div>
          <div className="text-blue-200">Active Projects</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-400">
            {Math.round(projects.reduce((acc, p) => acc + p.confidence, 0) / projects.length)}%
          </div>
          <div className="text-blue-200">Avg Confidence</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {projects.filter(p => p.status === 'preview').length}
          </div>
          <div className="text-blue-200">In Preview</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400">
            {projects.filter(p => p.approvalRequired).length}
          </div>
          <div className="text-blue-200">Awaiting Approval</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/15 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)} text-white`}>
                    {project.status.toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${getRiskColor(project.riskLevel)}`}>
                    {project.riskLevel.toUpperCase()} RISK
                  </span>
                  <span className="text-sm text-blue-200">
                    {project.confidence}% confidence
                  </span>
                </div>
              </div>
              {project.approvalRequired && (
                <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                  APPROVAL NEEDED
                </div>
              )}
            </div>

            <p className="text-gray-300 mb-4">{project.description}</p>

            <div className="mb-4">
              <div className="text-sm text-blue-200 mb-2">Technologies:</div>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span key={tech} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Est: {project.estimatedTime}</span>
              {project.actualTime && <span>Actual: {project.actualTime}</span>}
            </div>

            <div className="mt-4 flex space-x-3">
              {project.status === 'planning' && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                  🚀 Start Implementation
                </button>
              )}
              {project.previewUrl && (
                <Link 
                  href={project.previewUrl}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  👁️ View Preview
                </Link>
              )}
              <Link 
                href={`/cadis/${project.id}`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                📋 Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">🎯 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left transition-colors">
            <div className="font-medium">🔄 Run Evolution Cycle</div>
            <div className="text-sm text-green-200 mt-1">Trigger CADIS self-improvement</div>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left transition-colors">
            <div className="font-medium">🔧 Add New Capability</div>
            <div className="text-sm text-blue-200 mt-1">Integrate new API or service</div>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-left transition-colors">
            <div className="font-medium">📊 View Analytics</div>
            <div className="text-sm text-purple-200 mt-1">Performance and decision metrics</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">📈 Recent CADIS Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-gray-300">Storm Tracker scenario analyzed with 92% confidence</span>
            <span className="text-gray-500">2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">AI Callers integration planned with approval workflow</span>
            <span className="text-gray-500">3 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-gray-300">Decision traces stored in database successfully</span>
            <span className="text-gray-500">5 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
