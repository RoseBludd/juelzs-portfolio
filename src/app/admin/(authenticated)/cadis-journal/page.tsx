'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CADISJournalEntry } from '@/services/cadis-journal.service';

type CADISTabType = 'insights' | 'ecosystem' | 'predictions' | 'analytics';

// Component for individual CADIS entry with expandable content
function CADISEntryCard({ entry }: { entry: CADISJournalEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentPreview = entry.content.substring(0, 300) + '...';
  
  const getCategoryIcon = (category: string) => {
    const icons = {
      'system-evolution': '🌱',
      'developer-insights': '👨‍💻',
      'module-analysis': '📦',
      'repository-updates': '🔄',
      'decision-making': '🤔',
      'ecosystem-health': '🏥',
      'dreamstate-prediction': '🔮'
    };
    return icons[category as keyof typeof icons] || '🧠';
  };

  const getSourceIcon = (source: string) => {
    const icons = {
      'module-registry': '📦',
      'developer-activity': '👨‍💻',
      'repository-analysis': '📊',
      'cadis-memory': '🧠',
      'dreamstate': '🔮',
      'system-reflection': '💭'
    };
    return icons[source as keyof typeof icons] || '🤖';
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      'low': 'bg-gray-500/20 text-gray-300',
      'medium': 'bg-blue-500/20 text-blue-300',
      'high': 'bg-orange-500/20 text-orange-300',
      'critical': 'bg-red-500/20 text-red-300'
    };
    return colors[impact as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCategoryIcon(entry.category)}</span>
          <div>
            <h4 className="text-lg font-semibold text-white">{entry.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">
                {getSourceIcon(entry.source)} {entry.source.replace('-', ' ')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${getImpactColor(entry.impact)}`}>
                {entry.impact} impact
              </span>
              <span className="text-xs text-gray-400">
                {entry.confidence}% confidence
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(entry.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <div 
          className="text-gray-300"
          dangerouslySetInnerHTML={{ 
            __html: (isExpanded ? entry.content : contentPreview)
              .replace(/# (.*)/g, '<h3 class="text-lg font-semibold text-white mb-3">$1</h3>')
              .replace(/## (.*)/g, '<h4 class="text-base font-medium text-white mb-2">$1</h4>')
              .replace(/### (.*)/g, '<h5 class="text-sm font-medium text-white mb-2">$1</h5>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
              .replace(/^- (.*)/gm, '<li class="text-gray-300 ml-4">$1</li>')
              .replace(/\n\n/g, '</p><p class="mb-3">')
              .replace(/^(?!<[h|l])/gm, '<p class="mb-3 text-gray-300">')
          }}
        />
        
        {entry.content.length > 300 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-purple-400 hover:text-purple-300 text-sm font-medium"
          >
            {isExpanded ? '🔼 Show Less' : '🔽 Show More & DreamState Nodes'}
          </button>
        )}
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CADIS Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Analysis Type</span>
            <p className="text-white font-medium">{entry.cadisMetadata.analysisType}</p>
          </div>
          <div>
            <span className="text-gray-400">Data Points</span>
            <p className="text-white font-medium">{entry.cadisMetadata.dataPoints}</p>
          </div>
          <div>
            <span className="text-gray-400">Correlations</span>
            <p className="text-white font-medium">{entry.cadisMetadata.correlations.length}</p>
          </div>
          <div>
            <span className="text-gray-400">Recommendations</span>
            <p className="text-white font-medium">{entry.cadisMetadata.recommendations.length}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function CADISJournalPage() {
  const [activeTab, setActiveTab] = useState<CADISTabType>('insights');
  const [entries, setEntries] = useState<CADISJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCADISData();
  }, [activeTab]);

  const loadCADISData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/cadis-journal');
      
      if (!response.ok) {
        throw new Error(`Failed to load CADIS data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEntries(data.entries || []);
      } else {
        throw new Error(data.error || 'Failed to load CADIS entries');
      }
    } catch (error) {
      console.error('Error loading CADIS data:', error);
      setError('Failed to load CADIS journal data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInsights = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch('/api/admin/cadis-journal/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate insights: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await loadCADISData(); // Reload to show new insights
      } else {
        throw new Error(data.error || 'Failed to generate insights');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Failed to generate new insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: 'insights' as CADISTabType, label: 'CADIS Insights', icon: '🧠', count: entries.length },
    { id: 'ecosystem' as CADISTabType, label: 'Ecosystem Health', icon: '🌐' },
    { id: 'predictions' as CADISTabType, label: 'DreamState', icon: '🔮' },
    { id: 'analytics' as CADISTabType, label: 'Analytics', icon: '📊' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CADIS Intelligence Journal</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            AI-generated insights from your entire development ecosystem
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            onClick={generateNewInsights} 
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
          >
            {isGenerating ? '🧠 Analyzing...' : '🧠 Generate Insights'}
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

      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg">
        <div className="flex overflow-x-auto border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-750'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-base sm:text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 6)}</span>
              {tab.count !== undefined && (
                <span className="ml-1 px-1 sm:px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">CADIS Intelligence Insights</h3>
                <div className="text-sm text-gray-400">
                  🧠 AI-generated ecosystem analysis
                </div>
              </div>

              {/* CADIS Entries */}
              <div className="space-y-3 sm:space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <p className="text-gray-400 mt-2">CADIS is analyzing your ecosystem...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No CADIS insights yet</h3>
                    <p className="text-gray-400 mb-4">
                      CADIS will automatically generate insights based on your ecosystem activity
                    </p>
                    <Button onClick={generateNewInsights} className="bg-purple-600 hover:bg-purple-700">
                      🧠 Generate First Insights
                    </Button>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <CADISEntryCard key={entry.id} entry={entry} />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Ecosystem Health Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-2">📦 Module Registry</h4>
                  <div className="text-2xl font-bold text-blue-400 mb-1">2,283</div>
                  <div className="text-sm text-gray-400">Total modules</div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-2">👨‍💻 Developer Activity</h4>
                  <div className="text-2xl font-bold text-green-400 mb-1">Active</div>
                  <div className="text-sm text-gray-400">Ecosystem status</div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-2">🧠 CADIS Intelligence</h4>
                  <div className="text-2xl font-bold text-purple-400 mb-1">85%</div>
                  <div className="text-sm text-gray-400">Confidence level</div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">DreamState Predictions</h3>
                <Button 
                  onClick={() => {/* TODO: Generate DreamState predictions */}}
                  className="bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  🔮 Generate Predictions
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/20">
                <h4 className="text-white font-semibold mb-4">🔮 DreamState Analysis</h4>
                <p className="text-gray-300 mb-4">
                  DreamState uses advanced simulation to predict ecosystem evolution and identify optimization opportunities.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Module growth trajectory analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Developer performance predictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">System bottleneck identification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-gray-300">Resource optimization recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">CADIS Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-4">📊 Insight Generation</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Insights</span>
                      <span className="text-white font-medium">{entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Avg Confidence</span>
                      <span className="text-white font-medium">
                        {entries.length > 0 
                          ? Math.round(entries.reduce((acc, e) => acc + e.confidence, 0) / entries.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">High Impact</span>
                      <span className="text-white font-medium">
                        {entries.filter(e => e.impact === 'high' || e.impact === 'critical').length}
                      </span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-4">🎯 Source Distribution</h4>
                  <div className="space-y-2">
                    {['module-registry', 'developer-activity', 'repository-analysis', 'cadis-memory', 'dreamstate'].map(source => {
                      const count = entries.filter(e => e.source === source).length;
                      return (
                        <div key={source} className="flex justify-between">
                          <span className="text-gray-300 flex items-center gap-1">
                            {getSourceIcon(source)} {source.replace('-', ' ')}
                          </span>
                          <span className="text-white font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
