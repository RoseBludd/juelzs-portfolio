"use client";

import {
  IconFilter,
  IconPlus,
  IconSearch,
  IconTag,
  IconSettings,
  IconCode,
  IconApi,
  IconComponents,
  IconLayout,
  IconTestPipe,
  IconDatabase,
  IconTool,
  IconPalette,
  IconFileText,
  IconGrid3x3,
  IconList,
  IconX
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import { ModuleCard } from "@/components/modules/ModuleCard";
import { ModuleGridCard } from "@/components/modules/ModuleCard";
import { ModuleCreator } from "@/components/modules/ModuleCreator";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { useMilestones } from "@/hooks/useMilestones";
import { Milestone } from "@/hooks/useTaskDetails";

interface ModularMilestonesSectionProps {
  milestones: Milestone[];
  taskId: string;
  onRefetch: () => void;
  onMediaPreview: (mediaFiles: any[], index?: number) => void;
}

interface ModuleType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

interface TaskModule {
  id: string;
  name: string;
  description: string;
  file_path: string;
  estimated_hours: number;
  priority: string;
  status: string;
  completion_percentage: number;
  tags: string[];
  module_type: string;
  module_icon: string;
  module_color: string;
  dependency_count: number;
  submission_count: number;
  update_count: number;
}

const MODULE_ICONS: { [key: string]: any } = {
  'function': IconCode,
  'api': IconApi,
  'component': IconComponents,
  'layout': IconLayout,
  'test': IconTestPipe,
  'database': IconDatabase,
  'settings': IconSettings,
  'tool': IconTool,
  'palette': IconPalette,
  'file-text': IconFileText
};

export const ModularMilestonesSection = ({ 
  milestones, 
  taskId, 
  onRefetch,
  onMediaPreview 
}: ModularMilestonesSectionProps) => {
  const [viewMode, setViewMode] = useState<'legacy' | 'modular'>('modular');
  const [displayMode, setDisplayMode] = useState<'list' | 'grid'>('list');
  const [modules, setModules] = useState<TaskModule[]>([]);
  const [moduleTypes, setModuleTypes] = useState<ModuleType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedModuleType, setSelectedModuleType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // UI State
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Legacy milestone hooks
  const {
    statusUpdateLoading,
    isSubmitting,
    deletingUpdateId,
    updateMilestoneStatus,
    addComment,
    deleteUpdate,
    handleMediaUploadSuccess
  } = useMilestones(taskId, onRefetch);

  // Load module types and modules
  useEffect(() => {
    loadModuleTypes();
    loadModules();
  }, [taskId]);

  const loadModuleTypes = async () => {
    try {
      const response = await fetch('/api/module-types');
      const data = await response.json();
      setModuleTypes(data.moduleTypes || []);
    } catch (error) {
      console.error('Error loading module types:', error);
      toast.error('Failed to load module types');
    }
  };

  const loadModules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ taskId });
      
      if (selectedModuleType) params.append('moduleType', selectedModuleType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

      const response = await fetch(`/api/tasks/modules?${params}`);
      const data = await response.json();
      setModules(data.modules || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  // Reload modules when filters change
  useEffect(() => {
    if (viewMode === 'modular') {
      loadModules();
    }
  }, [selectedModuleType, selectedStatus, selectedTags, viewMode]);

  // Filter modules by search term
  const filteredModules = modules.filter(module => 
    searchTerm === '' || 
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get unique tags from all modules
  const allTags = Array.from(new Set(modules.flatMap(module => module.tags || [])));

  const handleModuleCreated = () => {
    setIsCreatorOpen(false);
    loadModules();
    onRefetch();
  };

  const toggleModule = (id: string) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const getModuleIcon = (iconName: string) => {
    return MODULE_ICONS[iconName] || IconCode;
  };

  const getModuleStats = () => {
    // Group modules by type and count them
    const typeStats = modules.reduce((acc, module) => {
      const typeName = module.module_type;
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort by count descending and return top types
    const sortedTypes = Object.entries(typeStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4); // Show top 4 types
    
    return {
      total: modules.length,
      typeBreakdown: sortedTypes
    };
  };

  const stats = getModuleStats();

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">
            {viewMode === 'modular' ? 'Task Modules' : 'Milestones'}
          </h2>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('modular')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'modular'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Modular
            </button>
            <button
              onClick={() => setViewMode('legacy')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'legacy'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Legacy
            </button>
          </div>
        </div>

        {/* Stats */}
        {viewMode === 'modular' && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Total: {stats.total}</span>
            {stats.typeBreakdown.map(([typeName, count]) => (
              <span key={typeName} className="text-blue-400">
                {count} {typeName.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Modular View */}
      {viewMode === 'modular' && (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('list')}
                className={`px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                  displayMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <IconList size={16} />
                List
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={`px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                  displayMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <IconGrid3x3 size={16} />
                Grid
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                isFilterOpen ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              <IconFilter size={16} />
              Filters
            </button>

            {/* Add Module */}
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <IconPlus size={16} />
              Add Module
            </button>
          </div>

          {/* Filters Panel */}
          {isFilterOpen && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Module Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Module Type</label>
                  <select
                    value={selectedModuleType}
                    onChange={(e) => setSelectedModuleType(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Types</option>
                    {moduleTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        <IconTag size={12} />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modules List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading modules...</p>
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="bg-gray-700/30 p-8 rounded-lg text-center">
              <p className="text-gray-400">No modules found. Create your first module to get started!</p>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Create Module
              </button>
            </div>
          ) : displayMode === 'list' ? (
            <div className="space-y-4">
              {filteredModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  taskId={taskId}
                  allModules={modules}
                  isExpanded={expandedModule === module.id}
                  onToggle={() => toggleModule(module.id)}
                  onUpdate={loadModules}
                  onMediaPreview={onMediaPreview}
                  moduleIcon={getModuleIcon(module.module_icon)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredModules.map((module) => (
                <ModuleGridCard
                  key={module.id}
                  module={module}
                  taskId={taskId}
                  allModules={modules}
                  onUpdate={loadModules}
                  onMediaPreview={onMediaPreview}
                  moduleIcon={getModuleIcon(module.module_icon)}
                  onClick={() => toggleModule(module.id)}
                  isExpanded={expandedModule === module.id}
                  onToggle={() => toggleModule(module.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Legacy View */}
      {viewMode === 'legacy' && (
        <>
          {milestones && milestones.length > 0 ? (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  taskId={taskId}
                  isExpanded={expandedModule === milestone.id}
                  onToggle={() => toggleModule(milestone.id)}
                  onStatusUpdate={updateMilestoneStatus}
                  onAddComment={addComment}
                  onDeleteUpdate={deleteUpdate}
                  onOpenMediaUpload={() => {}}
                  onMediaPreview={onMediaPreview}
                  statusUpdateLoading={statusUpdateLoading}
                  isSubmitting={isSubmitting}
                  deletingUpdateId={deletingUpdateId}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <p className="text-gray-400">No legacy milestones found for this task</p>
            </div>
          )}
        </>
      )}

      {/* Module Creator Modal */}
      <ModuleCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        taskId={taskId}
        moduleTypes={moduleTypes}
        existingModules={modules}
        onSuccess={handleModuleCreated}
      />

      {/* Module Details Modal (for grid view) */}
      {expandedModule && displayMode === 'grid' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Module Details</h2>
              <button
                onClick={() => setExpandedModule(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <IconX size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {(() => {
                const module = filteredModules.find(m => m.id === expandedModule);
                return module ? (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    taskId={taskId}
                    allModules={modules}
                    isExpanded={true}
                    onToggle={() => {}} // No toggle needed in modal
                    onUpdate={() => {
                      loadModules();
                      setExpandedModule(null); // Close modal after update
                    }}
                    onMediaPreview={onMediaPreview}
                    moduleIcon={getModuleIcon(module.module_icon)}
                  />
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 