'use client';

import { useState } from 'react';
import Button from './Button';
import { JournalSearchFilters } from '@/services/journal.service';

interface JournalFiltersProps {
  filters: JournalSearchFilters;
  onFiltersChange: (filters: JournalSearchFilters) => void;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'architecture', label: '🏗️ Architecture' },
  { value: 'decision', label: '🤔 Decision' },
  { value: 'reflection', label: '💭 Reflection' },
  { value: 'planning', label: '📅 Planning' },
  { value: 'problem-solving', label: '🔧 Problem Solving' },
  { value: 'milestone', label: '🎯 Milestone' }
];

export default function JournalFilters({ filters, onFiltersChange }: JournalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<JournalSearchFilters>(filters);

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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">🔍 Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              className="text-xs bg-red-600 hover:bg-red-700"
            >
              Clear All
            </Button>
          )}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs bg-gray-600 hover:bg-gray-700"
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </Button>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <input
            type="text"
            value={localFilters.projectId || ''}
            onChange={(e) => updateFilter('projectId', e.target.value || undefined)}
            placeholder="Project ID or name"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-600">
          {/* Date Range */}
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

          {/* Tags Filter */}
          <div className="md:col-span-2">
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
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-600">
          <span className="text-xs text-gray-400">Active filters:</span>
          
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
              Project: {localFilters.projectId}
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
        </div>
      )}
    </div>
  );
}
