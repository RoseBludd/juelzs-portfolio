'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import JournalEntryCard from '@/components/ui/JournalEntryCard';
import JournalEntryModal from '@/components/ui/JournalEntryModal';
import JournalFilters from '@/components/ui/JournalFilters';
import JournalStats from '@/components/ui/JournalStats';
import JournalTemplates from '@/components/ui/JournalTemplates';
import { JournalEntry, JournalStats as JournalStatsType, JournalSearchFilters } from '@/services/journal.service';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<JournalSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load entries and stats in parallel
      const [entriesResponse, statsResponse] = await Promise.all([
        loadEntries(),
        loadStats()
      ]);

    } catch (error) {
      console.error('Error loading journal data:', error);
      setError('Failed to load journal data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.tags) params.append('tags', filters.tags.join(','));
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters.hasAISuggestions !== undefined) params.append('hasAISuggestions', filters.hasAISuggestions.toString());

      const response = await fetch(`/api/admin/journal?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load entries: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEntries(data.entries || []);
      } else {
        throw new Error(data.error || 'Failed to load entries');
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      throw error;
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/journal?action=stats');
      
      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEntries();
      return;
    }

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('action', 'search');
      params.append('search', searchQuery);
      
      if (filters.category) params.append('category', filters.category);
      if (filters.projectId) params.append('projectId', filters.projectId);

      const response = await fetch(`/api/admin/journal?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEntries(data.entries || []);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setIsCreating(true);
    setShowModal(true);
  };

  const handleTemplateSelect = (template: any) => {
    setEditingEntry({
      id: '',
      title: template.title,
      content: template.content,
      category: template.category,
      tags: template.tags,
      metadata: template.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    setIsCreating(true);
    setShowTemplates(false);
    setShowModal(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsCreating(false);
    setShowModal(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/journal?id=${entryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload entries
        await loadEntries();
        await loadStats();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete entry');
    }
  };

  const handleSaveEntry = async (entryData: any) => {
    try {
      const method = isCreating ? 'POST' : 'PUT';
      const body = isCreating ? entryData : { ...entryData, id: editingEntry?.id };

      const response = await fetch('/api/admin/journal', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setEditingEntry(null);
        setIsCreating(false);
        
        // Reload data
        await loadData();
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  const handleMarkSuggestionImplemented = async (suggestionId: string) => {
    try {
      const response = await fetch('/api/admin/journal/suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suggestionId,
          action: 'implement'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark suggestion as implemented: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Reload entries to show updated suggestion status
        await loadEntries();
        await loadStats();
      } else {
        throw new Error(data.error || 'Failed to mark suggestion as implemented');
      }
    } catch (error) {
      console.error('Error marking suggestion as implemented:', error);
      setError('Failed to mark suggestion as implemented');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Journal</h1>
          <p className="text-gray-400 mt-1">
            Track architecture decisions, project reflections, and AI-guided insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTemplates(true)} className="bg-purple-600 hover:bg-purple-700">
            📋 From Template
          </Button>
          <Button onClick={handleCreateEntry} className="bg-blue-600 hover:bg-blue-700">
            📝 New Entry
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <Button 
            onClick={() => setError(null)} 
            className="mt-2 text-sm bg-red-700 hover:bg-red-600"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Stats Dashboard */}
      {stats && (
        <JournalStats stats={stats} />
      )}

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journal entries..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
            🔍 Search
          </Button>
          <Button 
            onClick={() => {
              setSearchQuery('');
              setFilters({});
              loadEntries();
            }} 
            className="bg-gray-600 hover:bg-gray-700"
          >
            Clear
          </Button>
        </div>
        
        <JournalFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-2">Loading journal entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-gray-300 mb-2">No entries found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || Object.keys(filters).length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Start documenting your architecture decisions and project insights'}
            </p>
            <Button onClick={handleCreateEntry} className="bg-blue-600 hover:bg-blue-700">
              Create Your First Entry
            </Button>
          </div>
        ) : (
          entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onMarkSuggestionImplemented={handleMarkSuggestionImplemented}
            />
          ))
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <JournalTemplates
          onTemplateSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Entry Modal */}
      {showModal && (
        <JournalEntryModal
          entry={editingEntry}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
            setIsCreating(false);
          }}
          onSave={handleSaveEntry}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
