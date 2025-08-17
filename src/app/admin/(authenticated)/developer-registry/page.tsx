'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Package, 
  GitBranch, 
  Activity, 
  BarChart3, 
  Users, 
  Calendar,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Video,
  FileText,
  Github,
  Link2,
  Eye,
  Code,
  ChevronRight,
  Tag,
  Layers,
  ArrowRight,
  Package2,
  CheckCircle2,
  AlertTriangle,
  Network,
  X
} from 'lucide-react';

interface ModuleType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  module_count: number;
}

interface Module {
  id: string;
  name: string;
  description: string;
  file_path: string;
  url: string;
  status?: string;
  completion_percentage: number;
  tags: string[];
  task_id: string;
  module_type: string;
  module_icon: string;
  module_color: string;
  dependency_count: number;
  dependent_count: number;
  latest_update: string;
  latest_update_date: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface Task {
  task_id: string;
  total_modules: number;
  completed_modules: number;
  in_progress_modules: number;
  pending_modules: number;
  avg_completion: number;
  first_module_created: string;
  last_module_updated: string;
  module_types_used: string[];
}

interface RegistryData {
  overview: {
    total_module_types: number;
    total_modules: number;
    completed_modules: number;
    in_progress_modules: number;
    pending_modules: number;
    total_tasks_with_modules: number;
    total_dependencies: number;
    avg_completion: number;
  };
  moduleTypes: ModuleType[];
  modules: Module[];
  tasks: Task[];
  dependencies: any[];
  recentActivity: any[];
  availableTags: string[];
}

const ModuleDetailModal = ({ module, onClose, allModules }: { 
  module: any; 
  onClose: () => void; 
  allModules: any[];
}) => {
  const [relatedModules, setRelatedModules] = useState<any[]>([]);

  useEffect(() => {
    if (module && allModules) {
      const related = calculateModuleRelationships(module, allModules);
      setRelatedModules(related);
    }
  }, [module, allModules]);

  const calculateModuleRelationships = (currentModule: any, modules: any[]) => {
    const related: any[] = [];
    const currentModuleNameLower = currentModule.name.toLowerCase();
    
    modules.forEach(otherModule => {
      if (otherModule.id === currentModule.id) return;
      
      const otherNameLower = otherModule.name.toLowerCase();
      
      // 1. Testing relationships
      if (['ui_components', 'functions', 'api_endpoints'].includes(currentModule.module_type)) {
        if (otherModule.module_type === 'tests' && 
            (otherNameLower.includes(currentModuleNameLower.split(' ')[0]) || 
             (otherNameLower.includes('test') && 
              currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag))))) {
          related.push({
            ...otherModule,
            relationship_type: 'testing',
            relationship_reason: 'Tests this module'
          });
        }
      }
      
      // 2. Component family relationships
      if (currentModule.module_type === 'ui_components' && otherModule.module_type === 'ui_components') {
        if ((currentModuleNameLower.includes('chat') && otherNameLower.includes('chat')) ||
            (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
            (currentModuleNameLower.includes('user') && otherNameLower.includes('user'))) {
          related.push({
            ...otherModule,
            relationship_type: 'component_family',
            relationship_reason: 'Related UI component'
          });
        }
      }
      
      // 3. Function dependencies
      if (currentModule.module_type === 'ui_components' && otherModule.module_type === 'functions') {
        if (currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag)) ||
            (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
            (currentModuleNameLower.includes('chat') && otherNameLower.includes('notification'))) {
          related.push({
            ...otherModule,
            relationship_type: 'dependency',
            relationship_reason: 'Used by this component'
          });
        }
      }
      
      // 4. API-Component relationships
      if (currentModule.module_type === 'ui_components' && otherModule.module_type === 'api_endpoints') {
        if (currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag)) ||
            (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
            (currentModuleNameLower.includes('chat') && otherNameLower.includes('websocket'))) {
          related.push({
            ...otherModule,
            relationship_type: 'dependency',
            relationship_reason: 'API endpoint used'
          });
        }
      }
      
      // 5. Tag-based relationships
      const sharedTags = currentModule.tags?.filter((tag: string) => otherModule.tags?.includes(tag)) || [];
      if (sharedTags.length >= 2 && !related.find(r => r.id === otherModule.id)) {
        related.push({
          ...otherModule,
          relationship_type: 'related',
          relationship_reason: `Shared: ${sharedTags.slice(0, 2).join(', ')}`
        });
      }
      
      // 6. Video demonstration relationships
      if (otherNameLower.includes('video') || otherNameLower.includes('demo') || 
          otherNameLower.includes('loom') || otherNameLower.includes('recording') ||
          otherModule.tags?.some((tag: string) => ['video', 'demo', 'loom', 'recording', 'walkthrough'].includes(tag.toLowerCase()))) {
        if (currentModuleNameLower.split(' ').some((word: string) => 
            word.length > 3 && otherNameLower.includes(word)) ||
            currentModule.tags?.some((tag: string) => otherModule.tags?.includes(tag))) {
          related.push({
            ...otherModule,
            relationship_type: 'video_demo',
            relationship_reason: 'Video demonstration'
          });
        }
      }
    });
    
    return related;
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'testing':
        return <CheckCircle2 size={14} className="text-green-400" />;
      case 'dependency':
        return <Link2 size={14} className="text-blue-400" />;
      case 'component_family':
        return <GitBranch size={14} className="text-purple-400" />;
      case 'video_demo':
        return <Video size={14} className="text-pink-400" />;
      case 'related':
        return <Network size={14} className="text-yellow-400" />;
      default:
        return <Link2 size={14} className="text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-green-400" size={20} />;
      case 'in_progress':
        return <Clock className="text-yellow-400" size={20} />;
      case 'blocked':
        return <AlertTriangle className="text-red-400" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  if (!module) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: module.module_color + '20', color: module.module_color }}
            >
              <Package2 size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-white truncate">{module.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {module.module_type}
                </span>
                {getStatusIcon(module.status)}
                <span className="text-sm text-gray-400 capitalize">{module.status}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-manipulation flex-shrink-0"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {module.description || 'No description provided.'}
            </p>
          </div>

          {/* File Path */}
          {module.file_path && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">File Path</h3>
              <code className="text-xs sm:text-sm text-green-400 bg-gray-800 px-3 py-2 rounded block break-all">
                {module.file_path}
              </code>
            </div>
          )}

          {/* Resource Links */}
          {module.loom_video_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Loom Video</h3>
              <a
                href={module.loom_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-gray-800 px-3 py-2 rounded transition-colors"
              >
                <Video size={16} />
                Watch Loom Video
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {module.repository_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Repository</h3>
              <a
                href={module.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-gray-800 px-3 py-2 rounded transition-colors"
              >
                <GitBranch size={16} />
                View Repository
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Tags */}
          {module.tags && module.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {module.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relationships */}
          {relatedModules.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Network size={16} />
                Related Modules ({relatedModules.length})
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3">
                {relatedModules.map((related) => (
                  <div
                    key={related.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {getRelationshipIcon(related.relationship_type)}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-white font-medium truncate">{related.name}</div>
                        <div className="text-xs text-gray-400 line-clamp-1">{related.relationship_reason}</div>
                        <div className="text-xs text-gray-500">{related.module_type}</div>
                      </div>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: related.module_color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Progress</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                  style={{ width: `${module.completion_percentage || 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-300 font-medium">
                {module.completion_percentage || 0}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg sm:text-2xl font-bold text-white">{module.estimated_hours || 0}</div>
              <div className="text-xs sm:text-sm text-gray-400">Est. Hours</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg sm:text-2xl font-bold text-white">{relatedModules.length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Related</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg sm:text-2xl font-bold text-white">{module.priority || 'Medium'}</div>
              <div className="text-xs sm:text-sm text-gray-400">Priority</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg sm:text-2xl font-bold text-white">{module.tags?.length || 0}</div>
              <div className="text-xs sm:text-sm text-gray-400">Tags</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminRegistryPage() {
  const [activeView, setActiveView] = useState<'overview' | 'module-types' | 'all' | 'tasks' | 'dependencies' | 'activity'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleTypeFilter, setModuleTypeFilter] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RegistryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        view: activeView
      });

      if (searchTerm) params.append('search', searchTerm);
      if (moduleTypeFilter && moduleTypeFilter !== 'all') params.append('moduleType', moduleTypeFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (taskFilter && taskFilter !== 'all') params.append('taskId', taskFilter);
      if (tagFilter && tagFilter !== 'all') params.append('tags', tagFilter);

      const response = await fetch(`/api/admin/registry?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
        setError(null);
      } else {
        console.error('Failed to fetch registry data:', result.error);
        setError(result.error || 'Failed to fetch registry data');
      }
    } catch (error) {
      console.error('Error fetching registry data:', error);
      setError('Failed to fetch registry data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeView, searchTerm, moduleTypeFilter, statusFilter, taskFilter, tagFilter]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractLoomLinks = (metadata: any, description: string, url: string) => {
    const links = [];
    
    if (metadata && typeof metadata === 'object') {
      if (metadata.loomVideos) links.push(...metadata.loomVideos);
      if (metadata.videoUrls) links.push(...metadata.videoUrls);
    }
    
    const loomRegex = /https?:\/\/(?:www\.)?loom\.com\/share\/[a-zA-Z0-9]+/g;
    const descriptionMatches = description?.match(loomRegex) || [];
    const urlMatches = url?.match(loomRegex) || [];
    
    links.push(...descriptionMatches, ...urlMatches);
    return [...new Set(links)];
  };

  const extractGithubLinks = (metadata: any, description: string, url: string, filePath: string) => {
    const links = [];
    
    if (metadata && typeof metadata === 'object') {
      if (metadata.githubUrls) links.push(...metadata.githubUrls);
      if (metadata.repository) links.push(metadata.repository);
    }
    
    const githubRegex = /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9\-_\.\/]+/g;
    const descriptionMatches = description?.match(githubRegex) || [];
    const urlMatches = url?.match(githubRegex) || [];
    
    links.push(...descriptionMatches, ...urlMatches);
    return [...new Set(links)];
  };

  const hasCodebase = (module: Module) => {
    return module.file_path || 
           extractGithubLinks(module.metadata, module.description, module.url, module.file_path).length > 0 ||
           (module.metadata && (module.metadata.codebase || module.metadata.repository));
  };

  const handleModuleTypeClick = (moduleType: ModuleType) => {
    setModuleTypeFilter(moduleType.name);
    setActiveView('all');
  };

  const handleTaskClick = (task: Task) => {
    setTaskFilter(task.task_id);
    setActiveView('all');
  };

  const handleModuleClick = (module: Module) => {
    setSelectedModule(module);
  };

  const closeModuleDetail = () => {
    setSelectedModule(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setModuleTypeFilter('all');
    setStatusFilter('all');
    setTaskFilter('all');
    setTagFilter('all');
    setSelectedModule(null);
    setShowFilters(false); // Close filters after clearing
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (moduleTypeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (taskFilter !== 'all') count++;
    if (tagFilter !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-lg text-gray-300">Loading registry data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Registry Unavailable</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              Modular Component Registry
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">
              Comprehensive view of all modular components, dependencies, and system health
            </p>
            
            {/* Breadcrumb */}
            {(selectedModule) && (
              <div className="flex items-center space-x-2 mt-3 sm:mt-4 text-sm">
                <button 
                  onClick={() => {
                    setActiveView('overview');
                    clearFilters();
                  }}
                  className="text-indigo-400 hover:text-indigo-300 touch-manipulation"
                >
                  Registry
                </button>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                {selectedModule && (
                  <span className="text-gray-300 truncate">
                    {selectedModule.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {[
            { id: 'overview' as const, label: 'Overview', icon: Package },
            { id: 'module-types' as const, label: 'Types', shortLabel: 'Module Types', icon: Layers },
            { id: 'all' as const, label: 'Modules', shortLabel: 'All Modules', icon: Package2 },
            { id: 'tasks' as const, label: 'Tasks', icon: GitBranch },
            { id: 'dependencies' as const, label: 'Deps', shortLabel: 'Dependencies', icon: ArrowRight },
            { id: 'activity' as const, label: 'Activity', shortLabel: 'Recent Activity', icon: Activity }
          ].map(({ id, label, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveView(id);
                if (activeView === 'all') {
                  clearFilters();
                }
              }}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] ${
                activeView === id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-gray-800/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm lg:text-base whitespace-nowrap">
                <span className="sm:hidden">{label}</span>
                <span className="hidden sm:inline">{shortLabel || label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Filter Toggle */}
        {(activeView === 'all' || activeView === 'overview') && (
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 touch-manipulation min-h-[44px] text-base sm:text-sm w-full sm:w-auto ${
                showFilters
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : hasActiveFilters
                  ? 'bg-gray-700/50 text-gray-200 border border-gray-600'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              <Filter className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              <span>
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </span>
              {hasActiveFilters && !showFilters && (
                <div className="w-2 h-2 rounded-full bg-indigo-400 ml-1" />
              )}
            </button>

            {/* Collapsible Filters */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showFilters ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 lg:gap-4">
                  <div className="flex-1 min-w-full sm:min-w-64">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 placeholder-gray-400 text-base sm:text-sm touch-manipulation"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2 lg:gap-3 w-full sm:w-auto">
                    <select
                      value={moduleTypeFilter}
                      onChange={(e) => setModuleTypeFilter(e.target.value)}
                      className="px-3 py-2.5 sm:py-2 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 text-base sm:text-sm touch-manipulation"
                    >
                      <option value="all">All Module Types</option>
                      {data?.moduleTypes?.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2.5 sm:py-2 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 text-base sm:text-sm touch-manipulation"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <select
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="px-3 py-2.5 sm:py-2 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 text-base sm:text-sm touch-manipulation"
                    >
                      <option value="all">All Tags</option>
                      {data?.availableTags?.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Task ID..."
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value)}
                      className="px-3 py-2.5 sm:py-2 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 placeholder-gray-400 text-base sm:text-sm touch-manipulation"
                    />
                  </div>

                  <button
                    onClick={clearFilters}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-colors border border-gray-600 font-medium touch-manipulation min-h-[44px] text-base sm:text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeView === 'overview' && data?.overview && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 sm:p-4 lg:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Total Modules</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{data.overview.total_modules}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 sm:p-4 lg:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Completed</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{data.overview.completed_modules}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 sm:p-4 lg:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">In Progress</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{data.overview.in_progress_modules}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 sm:p-4 lg:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                  <GitBranch className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-400 truncate">Dependencies</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{data.overview.total_dependencies}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Types Grid */}
            {data.moduleTypes && data.moduleTypes.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Module Types</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {data.moduleTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleModuleTypeClick(type)}
                      className="border border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-900/30 hover:bg-gray-700/30 transition-colors text-left group touch-manipulation min-h-[80px]"
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div 
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: type.color }}
                          >
                            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-white text-sm sm:text-base truncate">{type.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-400">{type.module_count} modules</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Tasks with Modules:</span>
                    <span className="text-sm sm:text-base text-white font-medium">{data.overview.total_tasks_with_modules}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Module Types:</span>
                    <span className="text-sm sm:text-base text-white font-medium">{data.overview.total_module_types}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Avg Completion:</span>
                    <span className="text-sm sm:text-base text-white font-medium">{Math.round(data.overview.avg_completion || 0)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Recent Activity</h3>
                {data.recentActivity && data.recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {data.recentActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="text-sm">
                        <div className="text-gray-300 font-medium">{activity.developer_name || 'Unknown'}</div>
                        <div className="text-gray-500 truncate mt-1">{activity.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm">No recent activity</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'module-types' && data?.moduleTypes && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white">Module Types</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6">
              {data.moduleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleModuleTypeClick(type)}
                  className="border border-gray-600 rounded-lg p-4 sm:p-6 bg-gray-900/30 hover:bg-gray-700/30 transition-colors text-left group touch-manipulation min-h-[120px] sm:min-h-[140px]"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    >
                      <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
                  </div>
                  <h4 className="font-semibold text-white mb-2 text-sm sm:text-base line-clamp-1">{type.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2">{type.description}</p>
                  <div className="text-base sm:text-lg font-bold text-indigo-400">{type.module_count} modules</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === 'all' && data?.modules && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                All Modules ({data.modules.length})
              </h3>
            </div>
            
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-600">
                {data.modules.map((module) => {
                  const loomLinks = extractLoomLinks(module.metadata, module.description, module.url);
                  const githubLinks = extractGithubLinks(module.metadata, module.description, module.url, module.file_path);
                  
                  return (
                    <div 
                      key={module.id} 
                      className="p-4 hover:bg-gray-700/30 cursor-pointer touch-manipulation"
                      onClick={() => handleModuleClick(module)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: module.module_color }}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-white truncate">{module.name}</h4>
                              {hasCodebase(module) && (
                                <Code className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-mono">{module.task_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {getStatusIcon(module.status)}
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>

                      {/* Description */}
                      {module.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{module.description}</p>
                      )}

                      {/* Tags */}
                      {module.tags && module.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {module.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {module.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{module.tags.length - 2} more</span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-400">{module.module_type}</span>
                          <div className="flex items-center space-x-2">
                            <ArrowRight className="w-3 h-3 text-red-400" />
                            <span className="text-gray-300">{module.dependency_count}</span>
                            <Layers className="w-3 h-3 text-green-400 ml-1" />
                            <span className="text-gray-300">{module.dependent_count}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {loomLinks.slice(0, 1).map((link, index) => (
                            <a 
                              key={index}
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 touch-manipulation"
                              title="Loom Video"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Video className="w-4 h-4" />
                            </a>
                          ))}
                          {githubLinks.slice(0, 1).map((link, index) => (
                            <a 
                              key={index}
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-300 touch-manipulation"
                              title="GitHub Repository"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Relationships
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-600">
                  {data.modules.map((module) => {
                    const loomLinks = extractLoomLinks(module.metadata, module.description, module.url);
                    const githubLinks = extractGithubLinks(module.metadata, module.description, module.url, module.file_path);
                    
                    return (
                      <tr 
                        key={module.id} 
                        className="hover:bg-gray-700/30 cursor-pointer"
                        onClick={() => handleModuleClick(module)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white flex items-center">
                              {module.name}
                              {hasCodebase(module) && (
                                <span className="ml-2" title="Has codebase">
                                  <Code className="w-4 h-4 text-indigo-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 font-mono">{module.task_id}</div>
                            {module.description && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {module.description}
                              </div>
                            )}
                            {module.tags && module.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {module.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                                {module.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{module.tags.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                              style={{ backgroundColor: module.module_color }}
                            >
                              <Package className="w-3 h-3" />
                            </div>
                            <span className="text-sm text-gray-200">{module.module_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(module.status)}
                            <span className="text-sm text-gray-200 capitalize">
                              {module.status ? module.status.replace('_', ' ') : 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1" title="Dependencies">
                              <ArrowRight className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-gray-300">
                                {module.dependency_count}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1" title="Dependents">
                              <Layers className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-gray-300">
                                {module.dependent_count}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {module.dependency_count + module.dependent_count} total
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {loomLinks.map((link, index) => (
                              <a 
                                key={index}
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                                title="Loom Video"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Video className="w-4 h-4" />
                              </a>
                            ))}
                            {githubLinks.map((link, index) => (
                              <a 
                                key={index}
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-300"
                                title="GitHub Repository"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            ))}
                            {module.url && !loomLinks.includes(module.url) && !githubLinks.includes(module.url) && (
                              <a 
                                href={module.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300"
                                title="External Link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {module.file_path && (
                              <span 
                                className="text-gray-400" 
                                title={`File: ${module.file_path}`}
                              >
                                <FileText className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(module.updated_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'tasks' && data?.tasks && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Tasks with Modules ({data.tasks.length})
              </h3>
            </div>
            
            {/* Mobile Card Layout */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-600">
                {data.tasks.map((task) => (
                  <div 
                    key={task.task_id} 
                    className="p-4 hover:bg-gray-700/30 cursor-pointer touch-manipulation"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-white font-mono truncate flex-1">
                        {task.task_id}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-400">Total Modules</div>
                        <div className="text-lg font-bold text-white">{task.total_modules}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Status</div>
                        <div className="flex space-x-2 text-xs">
                          <span className="text-green-400">✓{task.completed_modules}</span>
                          <span className="text-yellow-400">⏳{task.in_progress_modules}</span>
                          <span className="text-gray-400">⭕{task.pending_modules}</span>
                        </div>
                      </div>
                    </div>
                    
                    {task.module_types_used.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.module_types_used.slice(0, 2).map((type, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700/50 text-gray-300">
                            {type}
                          </span>
                        ))}
                        {task.module_types_used.length > 2 && (
                          <span className="text-xs text-gray-500">+{task.module_types_used.length - 2} more</span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      Updated: {formatDate(task.last_module_updated)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Task ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total Modules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status Distribution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Module Types
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-600">
                  {data.tasks.map((task) => (
                    <tr 
                      key={task.task_id} 
                      className="hover:bg-gray-700/30 cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-white font-mono">
                            {task.task_id}
                          </div>
                          <ChevronRight className="w-4 h-4 ml-2 text-gray-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {task.total_modules}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-4 text-sm">
                          <span className="text-green-400">✓ {task.completed_modules}</span>
                          <span className="text-yellow-400">⏳ {task.in_progress_modules}</span>
                          <span className="text-gray-400">⭕ {task.pending_modules}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {task.module_types_used.slice(0, 3).map((type, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700/50 text-gray-300">
                              {type}
                            </span>
                          ))}
                          {task.module_types_used.length > 3 && (
                            <span className="text-xs text-gray-500">+{task.module_types_used.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(task.last_module_updated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'dependencies' && data?.dependencies && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Module Dependencies ({data.dependencies.length})
              </h3>
            </div>
            {data.dependencies.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 text-center">
                <GitBranch className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No module dependencies found</p>
                <p className="text-sm text-gray-500 mt-1">Dependencies will appear here when modules reference each other</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="block lg:hidden">
                  <div className="divide-y divide-gray-600">
                    {data.dependencies.map((dep, index) => (
                      <div key={index} className="p-4 hover:bg-gray-700/30">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-white">{dep.module_name}</div>
                            <div className="text-xs text-gray-400">{dep.module_type}</div>
                          </div>
                          <div className="flex items-center">
                            <ArrowRight className="w-4 h-4 text-gray-500 mx-2" />
                            <div>
                              <div className="text-sm font-medium text-white">{dep.depends_on_module_name}</div>
                              <div className="text-xs text-gray-400">{dep.depends_on_module_type}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Created: {formatDate(dep.dependency_created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Module
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Depends On
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-600">
                      {data.dependencies.map((dep, index) => (
                        <tr key={index} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">{dep.module_name}</div>
                              <div className="text-sm text-gray-400">{dep.module_type}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">{dep.depends_on_module_name}</div>
                              <div className="text-sm text-gray-400">{dep.depends_on_module_type}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(dep.dependency_created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeView === 'activity' && data?.recentActivity && (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Recent Activity ({data.recentActivity.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-600">
              {data.recentActivity.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 text-center">
                  <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity found</p>
                  <p className="text-sm text-gray-500 mt-1">Module updates will appear here when available</p>
                </div>
              ) : (
                data.recentActivity.map((activity, index) => (
                  <div key={index} className="px-4 sm:px-6 py-4 hover:bg-gray-700/30">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <Activity className="w-5 h-5 text-indigo-400 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {activity.developer_name || 'Unknown Developer'} updated {activity.module_name}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {activity.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-700/50 text-gray-300">
                            {activity.module_type}
                          </span>
                          <span>{formatDate(activity.created_at)}</span>
                          <span className="capitalize">{activity.update_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedModule && (
        <ModuleDetailModal
          module={selectedModule}
          onClose={closeModuleDetail}
          allModules={data?.modules || []}
        />
      )}
    </div>
  );
} 