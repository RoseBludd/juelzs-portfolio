'use client';

import { useState, useEffect } from 'react';
import GitHubService, { GitHubProject } from '@/services/github.service';
import { ArchitectureAnalysis } from '@/services/architecture-analysis.service';
import AWSS3Service from '@/services/aws-s3.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ProjectWithAnalysis extends GitHubProject {
  analysis?: ArchitectureAnalysis | null;
  analysisStatus: 'none' | 'cached' | 'loading' | 'error';
  lastAnalyzed?: string;
}

export default function AdminArchitecturePage() {
  const [projects, setProjects] = useState<ProjectWithAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'title'>('score');
  const [refreshingProjects, setRefreshingProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const githubService = GitHubService.getInstance();
      const s3Service = AWSS3Service.getInstance();
      
      const githubProjects = await githubService.getPortfolioProjects();
      
      // Check cache status for each project
      const projectsWithAnalysis = await Promise.all(
        githubProjects.map(async (project) => {
          try {
            const cachedAnalysis = await s3Service.getCachedArchitectureAnalysis(project.id);
            
            // Get the metadata for when this was stored
            let lastAnalyzed;
            if (cachedAnalysis) {
              try {
                // Try to get the S3 metadata for timestamp
                lastAnalyzed = new Date().toISOString(); // For now, we'll use current time as placeholder
              } catch {
                lastAnalyzed = undefined;
              }
            }
            
            return {
              ...project,
              analysis: cachedAnalysis,
              analysisStatus: cachedAnalysis ? 'cached' as const : 'none' as const,
              lastAnalyzed
            };
          } catch {
            return {
              ...project,
              analysis: null,
              analysisStatus: 'error' as const
            };
          }
        })
      );

      setProjects(projectsWithAnalysis);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalysis = async (projectId: string) => {
    setRefreshingProjects(prev => new Set(prev).add(projectId));
    
    try {
      // Update project status to loading
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, analysisStatus: 'loading' as const }
          : p
      ));

      const response = await fetch('/api/admin/architecture/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });

      const result = await response.json();

      if (result.success) {
        // Update project with new analysis
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { 
                ...p, 
                analysis: result.analysis,
                analysisStatus: 'cached' as const,
                lastAnalyzed: new Date().toISOString()
              }
            : p
        ));
      } else {
        // Mark as error
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, analysisStatus: 'error' as const }
            : p
        ));
        console.error('Failed to refresh analysis:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, analysisStatus: 'error' as const }
          : p
      ));
    } finally {
      setRefreshingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const refreshAllAnalyses = async () => {
    const projectsToRefresh = projects.filter(p => p.analysisStatus !== 'loading');
    
    for (const project of projectsToRefresh) {
      await refreshAnalysis(project.id);
      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'analyzed') return project.analysisStatus === 'cached';
      if (selectedCategory === 'unanalyzed') return project.analysisStatus === 'none';
      if (selectedCategory === 'errors') return project.analysisStatus === 'error';
      return project.category === selectedCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          const scoreA = a.analysis?.overallScore || 0;
          const scoreB = b.analysis?.overallScore || 0;
          return scoreB - scoreA;
        case 'date':
          const dateA = new Date(a.lastAnalyzed || 0).getTime();
          const dateB = new Date(b.lastAnalyzed || 0).getTime();
          return dateB - dateA;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const stats = {
    total: projects.length,
    analyzed: projects.filter(p => p.analysisStatus === 'cached').length,
    unanalyzed: projects.filter(p => p.analysisStatus === 'none').length,
    errors: projects.filter(p => p.analysisStatus === 'error').length,
    highScore: projects.filter(p => p.analysis && p.analysis.overallScore >= 8).length,
    avgScore: projects.filter(p => p.analysis).length > 0 
      ? Math.round(projects.filter(p => p.analysis).reduce((acc, p) => acc + (p.analysis?.overallScore || 0), 0) / projects.filter(p => p.analysis).length * 10) / 10
      : 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cached': return 'text-green-400';
      case 'loading': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'cached': return '✅';
      case 'loading': return '⏳';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 8) return 'text-green-400';
    if (score >= 7) return 'text-blue-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const analyzed = new Date(timestamp);
    const diffMs = now.getTime() - analyzed.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return analyzed.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-white mb-2">Loading projects...</h3>
          <p className="text-gray-300">Checking architecture analysis status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Architecture Analysis Management</h1>
            <p className="mt-2 text-gray-300">
              Manage AI-powered architecture analysis for your portfolio projects. Refresh analysis to capture new improvements or updated analysis logic.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={refreshAllAnalyses}
            disabled={refreshingProjects.size > 0}
          >
            🔄 Refresh All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-sm text-gray-300">Total Projects</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.analyzed}</div>
          <div className="text-sm text-gray-300">Analyzed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{stats.unanalyzed}</div>
          <div className="text-sm text-gray-300">Unanalyzed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
          <div className="text-sm text-gray-300">Errors</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.highScore}</div>
          <div className="text-sm text-gray-300">Score ≥ 8</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.avgScore}</div>
          <div className="text-sm text-gray-300">Avg Score</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="all">All Projects</option>
              <option value="analyzed">Analyzed</option>
              <option value="unanalyzed">Unanalyzed</option>
              <option value="errors">Errors</option>
              <option value="ai">AI Projects</option>
              <option value="architecture">Architecture</option>
              <option value="systems">Systems</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'date' | 'title')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="score">Analysis Score</option>
              <option value="date">Last Analyzed</option>
              <option value="title">Project Title</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              onClick={loadProjects}
              className="w-full"
            >
              🔄 Refresh List
            </Button>
          </div>
        </div>
      </Card>

      {/* Projects List */}
      <div className="space-y-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-6">
                <div className="flex items-center mb-3">
                  <h3 className="text-lg font-semibold text-white mr-3">{project.title}</h3>
                  <span className={`text-sm ${getStatusColor(project.analysisStatus)}`}>
                    {getStatusIcon(project.analysisStatus)} {project.analysisStatus}
                  </span>
                  {project.analysis && (
                    <span className={`ml-3 text-lg font-bold ${getScoreColor(project.analysis.overallScore)}`}>
                      {project.analysis.overallScore}/10
                    </span>
                  )}
                </div>
                
                <p className="text-gray-300 text-sm mb-3">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.techStack.slice(0, 5).map((tech) => (
                    <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 5 && (
                    <span className="px-2 py-1 bg-gray-600 text-gray-400 rounded text-xs">
                      +{project.techStack.length - 5} more
                    </span>
                  )}
                </div>

                {project.analysis && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${getScoreColor(project.analysis.bestPractices.modularity)}`}>
                        {project.analysis.bestPractices.modularity}/10
                      </div>
                      <div className="text-xs text-gray-400">Modularity</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${getScoreColor(project.analysis.bestPractices.scalability)}`}>
                        {project.analysis.bestPractices.scalability}/10
                      </div>
                      <div className="text-xs text-gray-400">Scalability</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${getScoreColor(project.analysis.bestPractices.maintainability)}`}>
                        {project.analysis.bestPractices.maintainability}/10
                      </div>
                      <div className="text-xs text-gray-400">Maintainability</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${getScoreColor(project.analysis.bestPractices.security)}`}>
                        {project.analysis.bestPractices.security}/10
                      </div>
                      <div className="text-xs text-gray-400">Security</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${getScoreColor(project.analysis.bestPractices.performance)}`}>
                        {project.analysis.bestPractices.performance}/10
                      </div>
                      <div className="text-xs text-gray-400">Performance</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${getScoreColor(project.analysis.bestPractices.testability)}`}>
                        {project.analysis.bestPractices.testability}/10
                      </div>
                      <div className="text-xs text-gray-400">Testability</div>
                    </div>
                  </div>
                )}

                {project.lastAnalyzed && (
                  <div className="text-xs text-gray-500 mt-3">
                    Last analyzed: {getTimeAgo(project.lastAnalyzed)}
                  </div>
                )}
                
                {project.analysis && (
                  <div className="mt-3 text-xs text-gray-400">
                    <span className="font-medium">Summary:</span> {project.analysis.summary.substring(0, 100)}...
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => refreshAnalysis(project.id)}
                  disabled={refreshingProjects.has(project.id)}
                >
                  {refreshingProjects.has(project.id) ? '⏳' : '🔄'} 
                  {project.analysisStatus === 'none' ? ' Analyze' : ' Refresh'}
                </Button>
                
                {project.analysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/projects/${project.id}`, '_blank')}
                  >
                    👁️ View
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
          <p className="text-gray-400">
            {selectedCategory === 'all' 
              ? 'No projects available for analysis'
              : `No projects found in the "${selectedCategory}" category`
            }
          </p>
        </Card>
      )}
    </div>
  );
} 