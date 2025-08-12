'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import PublicJournalCard from './PublicJournalCard';

interface PublicJournalEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  projectName?: string;
  tags: string[];
  architectureDiagrams?: string[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    difficulty?: number;
    impact?: number;
    learnings?: string[];
    nextSteps?: string[];
  };
  aiSuggestions?: Array<{
    type: string;
    suggestion: string;
    reasoning: string;
    confidence: number;
    implementationComplexity?: string;
  }>;
}

interface PublicStats {
  totalPublicEntries: number;
  categoryCounts: Record<string, number>;
  topTags: Array<{ name: string; count: number }>;
}

export default function InsightsPageClient() {
  const [entries, setEntries] = useState<PublicJournalEntry[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categories = [
    { value: 'all', label: 'All Insights', icon: '💡', color: 'bg-gray-500/20 text-gray-300' },
    { value: 'architecture', label: 'Architecture', icon: '🏗️', color: 'bg-blue-500/20 text-blue-300' },
    { value: 'reflection', label: 'Reflections', icon: '💭', color: 'bg-green-500/20 text-green-300' },
    { value: 'milestone', label: 'Milestones', icon: '🎯', color: 'bg-purple-500/20 text-purple-300' },
    { value: 'planning', label: 'Planning', icon: '📅', color: 'bg-orange-500/20 text-orange-300' }
  ];

  useEffect(() => {
    loadInsights();
  }, [selectedCategory, selectedTags]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      params.append('limit', '20');

      const response = await fetch(`/api/journal/public?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEntries(data.entries || []);
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
              Engineering Process Transparency
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Engineering <span className="gradient-text">Insights</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-8">
            A transparent look into my architectural decisions, technical reflections, and engineering process. 
            See how I think through complex problems, make strategic decisions, and continuously improve systems.
          </p>
          
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-white">{stats.totalPublicEntries}</div>
                <div className="text-sm text-gray-400">Published Insights</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-blue-400">{Object.keys(stats.categoryCounts).length}</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl font-bold text-green-400">{stats.topTags.length}</div>
                <div className="text-sm text-gray-400">Topics Covered</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-12">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {categories.map((category) => (
              <Button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`text-sm transition-all ${
                  selectedCategory === category.value 
                    ? category.color + ' ring-2 ring-current'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
                {stats?.categoryCounts[category.value] && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-current/20 text-xs">
                    {stats.categoryCounts[category.value]}
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Tag Filter */}
          {stats?.topTags && stats.topTags.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">Filter by topics:</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {stats.topTags.slice(0, 12).map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedTags.includes(tag.name)
                        ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    #{tag.name} ({tag.count})
                  </button>
                ))}
              </div>
              
              {(selectedCategory !== 'all' || selectedTags.length > 0) && (
                <Button
                  onClick={clearFilters}
                  className="text-xs bg-red-600 hover:bg-red-700"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading insights...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No insights found</h3>
            <p className="text-gray-400">
              {selectedCategory !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your filters to see more content'
                : 'Check back soon for new engineering insights'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {entries.map((entry) => (
              <PublicJournalCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* About This Section */}
        <div className="mt-20 pt-16 border-t border-gray-700">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">About These Insights</h2>
              <p className="text-gray-300 max-w-3xl mx-auto mb-6">
                This journal provides transparency into my engineering process and decision-making. 
                Each entry represents real architectural decisions, technical challenges, and lessons learned 
                while building intelligent systems using <span className="text-blue-400 font-semibold">Prompt-Led Flow Architecture</span>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏗️</div>
                  <h3 className="font-semibold text-white mb-2">Architecture Decisions</h3>
                  <p className="text-sm text-gray-400">Deep dives into system design choices and their reasoning</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💭</div>
                  <h3 className="font-semibold text-white mb-2">Technical Reflections</h3>
                  <p className="text-sm text-gray-400">Lessons learned and continuous improvement insights</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold text-white mb-2">Project Milestones</h3>
                  <p className="text-sm text-gray-400">Key achievements and breakthrough moments</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
