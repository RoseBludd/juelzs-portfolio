'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import { JournalSearchFilters } from '@/services/journal.service';

interface JournalFiltersProps {
  filters: JournalSearchFilters;
  onFiltersChange: (filters: JournalSearchFilters) => void;
}

interface ProjectOption {
  id: string;
  title: string;
  description: string;
  category: string;
  techStack: string[];
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'architecture', label: '🏗️ Architecture' },
  { value: 'decision', label: '🤔 Decision' },
  { value: 'reflection', label: '💭 Reflection' },
  { value: 'planning', label: '📅 Planning' },
  { value: 'problem-solving', label: '🔧 Problem Solving' },
  { value: 'milestone', label: '🎯 Milestone' },
  { value: 'learning', label: '📚 Learning' }
];

export default function JournalFilters({ filters, onFiltersChange }: JournalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<JournalSearchFilters>(filters);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load projects for dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await fetch('/api/admin/projects?format=dropdown');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProjects(data.projects);
          }
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  const updateFilter = (key: keyof JournalSearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: JournalSearchFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-300">🔍 Filters</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1"
            >
              Clear All
            </Button>
          )}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1"
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </Button>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Category Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select
            value={localFilters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Project Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Project</label>
          <select
            value={localFilters.projectId || ''}
            onChange={(e) => updateFilter('projectId', e.target.value || undefined)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingProjects}
          >
            <option value="">
              {loadingProjects ? 'Loading projects...' : 'All Projects'}
            </option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title} ({project.category})
              </option>
            ))}
          </select>
        </div>

        {/* AI Suggestions Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">AI Suggestions</label>
          <select
            value={localFilters.hasAISuggestions === undefined ? '' : localFilters.hasAISuggestions.toString()}
            onChange={(e) => updateFilter('hasAISuggestions', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Entries</option>
            <option value="true">🤖 With AI Suggestions</option>
            <option value="false">📝 Without AI Suggestions</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-600">
          {/* Quick Date Filters */}
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Quick Date Filters</label>
            <select
              value={localFilters.dateFilter || ''}
              onChange={(e) => {
                const dateFilter = e.target.value as any;
                updateFilter('dateFilter', dateFilter || undefined);
                
                // Auto-set date ranges based on selection
                if (dateFilter) {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  switch (dateFilter) {
                    case 'today':
                      updateFilter('dateFrom', today);
                      updateFilter('dateTo', new Date(today.getTime() + 24 * 60 * 60 * 1000));
                      break;
                    case 'yesterday':
                      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                      updateFilter('dateFrom', yesterday);
                      updateFilter('dateTo', today);
                      break;
                    case 'this-week':
                      const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
                      updateFilter('dateFrom', startOfWeek);
                      updateFilter('dateTo', undefined);
                      break;
                    case 'last-week':
                      const lastWeekStart = new Date(today.getTime() - (today.getDay() + 7) * 24 * 60 * 60 * 1000);
                      const lastWeekEnd = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
                      updateFilter('dateFrom', lastWeekStart);
                      updateFilter('dateTo', lastWeekEnd);
                      break;
                    case 'this-month':
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      updateFilter('dateFrom', startOfMonth);
                      updateFilter('dateTo', undefined);
                      break;
                    case 'last-month':
                      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                      updateFilter('dateFrom', lastMonthStart);
                      updateFilter('dateTo', lastMonthEnd);
                      break;
                    case 'this-year':
                      const startOfYear = new Date(now.getFullYear(), 0, 1);
                      updateFilter('dateFrom', startOfYear);
                      updateFilter('dateTo', undefined);
                      break;
                    case 'custom':
                      // Clear auto-dates for custom selection
                      break;
                  }
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Time</option>
              <option value="today">📅 Today</option>
              <option value="yesterday">📅 Yesterday</option>
              <option value="this-week">📅 This Week</option>
              <option value="last-week">📅 Last Week</option>
              <option value="this-month">📅 This Month</option>
              <option value="last-month">📅 Last Month</option>
              <option value="this-year">📅 This Year</option>
              <option value="custom">⚙️ Custom Range</option>
            </select>
          </div>

          {/* Specific Date Picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Specific Date</label>
            <input
              type="date"
              value={localFilters.specificDate ? localFilters.specificDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const date = new Date(e.target.value);
                  updateFilter('specificDate', date);
                  updateFilter('dateFilter', 'custom');
                  updateFilter('dateFrom', date);
                  updateFilter('dateTo', new Date(date.getTime() + 24 * 60 * 60 * 1000));
                } else {
                  updateFilter('specificDate', undefined);
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Custom Date Range - Only show when custom is selected */}
          {localFilters.dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date From</label>
                <input
                  type="date"
                  value={localFilters.dateFrom ? localFilters.dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Date To</label>
                <input
                  type="date"
                  value={localFilters.dateTo ? localFilters.dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Impact Level Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Impact Level</label>
            <select
              value={localFilters.impactLevel || ''}
              onChange={(e) => updateFilter('impactLevel', e.target.value || undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Impact Levels</option>
              <option value="high">🔥 High Impact (8-10)</option>
              <option value="medium">⚡ Medium Impact (5-7)</option>
              <option value="low">💡 Low Impact (1-4)</option>
            </select>
          </div>

          {/* Difficulty Level Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Difficulty Level</label>
            <select
              value={localFilters.difficultyLevel || ''}
              onChange={(e) => updateFilter('difficultyLevel', e.target.value || undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulty Levels</option>
              <option value="high">🚀 High Difficulty (8-10)</option>
              <option value="medium">⚙️ Medium Difficulty (5-7)</option>
              <option value="low">📝 Low Difficulty (1-4)</option>
            </select>
          </div>

          {/* Link Type Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Decision Type</label>
            <select
              value={localFilters.linkType || ''}
              onChange={(e) => updateFilter('linkType', e.target.value || undefined)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="architecture-decision">🏗️ Architecture Decisions</option>
              <option value="technical-challenge">🔧 Technical Challenges</option>
              <option value="milestone">🎯 Milestones</option>
              <option value="learning">📚 Learnings</option>
              <option value="planning">📅 Planning</option>
              <option value="general">📋 General</option>
            </select>
          </div>

          {/* Original Content Filter */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Content Type</label>
            <select
              value={localFilters.hasOriginalContent === undefined ? '' : localFilters.hasOriginalContent.toString()}
              onChange={(e) => updateFilter('hasOriginalContent', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Content</option>
              <option value="true">🤖 AI Enhanced (with original)</option>
              <option value="false">📝 Manual Entries</option>
            </select>
          </div>

          {/* Tags Filter */}
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={localFilters.tags?.join(', ') || ''}
              onChange={(e) => {
                const tags = e.target.value
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0);
                updateFilter('tags', tags.length > 0 ? tags : undefined);
              }}
              placeholder="architecture, ai, performance"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-2 pt-2 border-t border-gray-600">
          <span className="text-xs text-gray-400 block sm:inline">Active filters:</span>
          <div className="flex flex-wrap gap-1 sm:gap-2">
          
          {localFilters.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700">
              {categories.find(c => c.value === localFilters.category)?.label || localFilters.category}
              <button
                onClick={() => updateFilter('category', undefined)}
                className="ml-1 text-blue-300 hover:text-blue-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.projectId && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700">
              💼 {projects.find(p => p.id === localFilters.projectId)?.title || localFilters.projectId}
              <button
                onClick={() => updateFilter('projectId', undefined)}
                className="ml-1 text-purple-300 hover:text-purple-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.hasAISuggestions !== undefined && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-700">
              {localFilters.hasAISuggestions ? 'With AI' : 'Without AI'}
              <button
                onClick={() => updateFilter('hasAISuggestions', undefined)}
                className="ml-1 text-green-300 hover:text-green-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.dateFrom && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300 border border-yellow-700">
              From: {localFilters.dateFrom.toLocaleDateString()}
              <button
                onClick={() => updateFilter('dateFrom', undefined)}
                className="ml-1 text-yellow-300 hover:text-yellow-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.dateTo && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300 border border-yellow-700">
              To: {localFilters.dateTo.toLocaleDateString()}
              <button
                onClick={() => updateFilter('dateTo', undefined)}
                className="ml-1 text-yellow-300 hover:text-yellow-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.dateFilter && localFilters.dateFilter !== 'custom' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-700">
              {localFilters.dateFilter === 'today' ? '📅 Today' :
               localFilters.dateFilter === 'yesterday' ? '📅 Yesterday' :
               localFilters.dateFilter === 'this-week' ? '📅 This Week' :
               localFilters.dateFilter === 'last-week' ? '📅 Last Week' :
               localFilters.dateFilter === 'this-month' ? '📅 This Month' :
               localFilters.dateFilter === 'last-month' ? '📅 Last Month' :
               localFilters.dateFilter === 'this-year' ? '📅 This Year' : localFilters.dateFilter}
              <button
                onClick={() => {
                  updateFilter('dateFilter', undefined);
                  updateFilter('dateFrom', undefined);
                  updateFilter('dateTo', undefined);
                  updateFilter('specificDate', undefined);
                }}
                className="ml-1 text-emerald-300 hover:text-emerald-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.specificDate && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-900/30 text-teal-300 border border-teal-700">
              📅 {localFilters.specificDate.toLocaleDateString()}
              <button
                onClick={() => {
                  updateFilter('specificDate', undefined);
                  updateFilter('dateFilter', undefined);
                  updateFilter('dateFrom', undefined);
                  updateFilter('dateTo', undefined);
                }}
                className="ml-1 text-teal-300 hover:text-teal-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.tags && localFilters.tags.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
              Tags: {localFilters.tags.join(', ')}
              <button
                onClick={() => updateFilter('tags', undefined)}
                className="ml-1 text-gray-300 hover:text-gray-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.impactLevel && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-700">
              {localFilters.impactLevel === 'high' ? '🔥 High Impact' : 
               localFilters.impactLevel === 'medium' ? '⚡ Medium Impact' : '💡 Low Impact'}
              <button
                onClick={() => updateFilter('impactLevel', undefined)}
                className="ml-1 text-red-300 hover:text-red-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.difficultyLevel && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-900/30 text-orange-300 border border-orange-700">
              {localFilters.difficultyLevel === 'high' ? '🚀 High Difficulty' : 
               localFilters.difficultyLevel === 'medium' ? '⚙️ Medium Difficulty' : '📝 Low Difficulty'}
              <button
                onClick={() => updateFilter('difficultyLevel', undefined)}
                className="ml-1 text-orange-300 hover:text-orange-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.linkType && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-300 border border-indigo-700">
              {localFilters.linkType === 'architecture-decision' ? '🏗️ Architecture' :
               localFilters.linkType === 'technical-challenge' ? '🔧 Challenge' :
               localFilters.linkType === 'milestone' ? '🎯 Milestone' :
               localFilters.linkType === 'learning' ? '📚 Learning' :
               localFilters.linkType === 'planning' ? '📅 Planning' : '📋 General'}
              <button
                onClick={() => updateFilter('linkType', undefined)}
                className="ml-1 text-indigo-300 hover:text-indigo-200"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.hasOriginalContent !== undefined && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-900/30 text-cyan-300 border border-cyan-700">
              {localFilters.hasOriginalContent ? '🤖 AI Enhanced' : '📝 Manual'}
              <button
                onClick={() => updateFilter('hasOriginalContent', undefined)}
                className="ml-1 text-cyan-300 hover:text-cyan-200"
              >
                ×
              </button>
            </span>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
