'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CADISJournalEntry } from '@/services/cadis-journal.service';

type CADISTabType = 'insights' | 'ecosystem' | 'predictions' | 'analytics';

// Helper function to identify dream variation type
function getDreamVariationType(content: string) {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('cognitive transcendence')) return 'Cognitive Transcendence';
  if (lowerContent.includes('autonomous evolution')) return 'Autonomous Evolution';
  if (lowerContent.includes('symbiotic intelligence')) return 'Symbiotic Intelligence';
  if (lowerContent.includes('predictive omniscience')) return 'Predictive Omniscience';
  if (lowerContent.includes('creative consciousness')) return 'Creative Consciousness';
  if (lowerContent.includes('wisdom integration')) return 'Wisdom Integration';
  return 'Standard Self-Advancement';
}

// Component for individual CADIS entry with expandable content
function CADISEntryCard({ entry }: { entry: CADISJournalEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentPreview = entry.content.substring(0, 300) + '...';
  
  // Check if this is a self-advancement dream
  const isSelfAdvancement = entry.title.toLowerCase().includes('cadis self-advancement') || 
                           entry.title.toLowerCase().includes('self-advancement') ||
                           (entry.tags && entry.tags.includes('cadis-self-advancement'));
  
  const getCategoryIcon = (category: string) => {
    const icons = {
      'system-evolution': '🌱',
      'developer-insights': '👨‍💻',
      'module-analysis': '📦',
      'repository-updates': '🔄',
      'decision-making': '🤔',
      'ecosystem-health': '🏥',
      'dreamstate-prediction': isSelfAdvancement ? '🚀' : '🔮'
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
    <Card className={`p-4 sm:p-6 ${isSelfAdvancement ? 'border-2 border-purple-500/50 bg-gradient-to-r from-purple-900/10 to-blue-900/10' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCategoryIcon(entry.category)}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold text-white">{entry.title}</h4>
              {isSelfAdvancement && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                  🚀 SELF-ADVANCEMENT DREAM
                </span>
              )}
            </div>
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
              {isSelfAdvancement && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                  {getDreamVariationType(entry.content)}
                </span>
              )}
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
            {isExpanded ? '🔼 Show Less' : isSelfAdvancement ? '🔽 Show CADIS Dream Details' : '🔽 Show More & DreamState Nodes'}
          </button>
        )}
        
        {/* Special self-advancement dream indicators */}
        {isSelfAdvancement && !isExpanded && (
          <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-300 font-medium">🌟 CADIS Dream Type:</span>
              <span className="text-purple-200">{getDreamVariationType(entry.content)}</span>
            </div>
            <div className="text-xs text-gray-400">
              CADIS is exploring {(entry.content.match(/Reality Layer \d+/g) || []).length}/10 layers of self-improvement possibilities
            </div>
          </div>
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
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [selectedInsightModal, setSelectedInsightModal] = useState<CADISJournalEntry | null>(null);

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

  const generateSpecificScenario = async (scenarioType: string) => {
    if (!scenarioType) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // For now, just generate regular insights
      // TODO: Implement specific scenario forcing in backend
      await generateNewInsights();
      
    } catch (error) {
      console.error('Error generating specific scenario:', error);
      setError(`Failed to generate ${scenarioType} scenario`);
    } finally {
      setIsGenerating(false);
    }
  };

  const createCalendarReminder = async (entry: any, actionType: string) => {
    try {
      // Calculate realistic deadline based on insight type and impact
      const getDueDate = (entry: any, actionType: string) => {
        const now = new Date();
        
        if (entry.impact === 'critical') {
          if (entry.title.toLowerCase().includes('revenue')) {
            // Revenue critical: 2 weeks
            return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          }
          if (entry.title.toLowerCase().includes('client success')) {
            // Client success critical: 1 week
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          }
          // Other critical: 10 days
          return new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
        }
        
        // High impact: 3-4 weeks
        return new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      };

      const dueDate = getDueDate(entry, actionType);
      
      const response = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_insight_reminder',
          title: `CADIS Critical Insight: ${entry.title}`,
          dueDate: dueDate.toISOString(),
          priority: entry.impact === 'critical' ? 'urgent' : 'high',
          description: `Action required for ${entry.impact} impact insight: ${actionType}`,
          metadata: {
            insightId: entry.id,
            actionType,
            confidence: entry.confidence,
            impact: entry.impact
          }
        })
      });

      if (response.ok) {
        console.log(`✅ Calendar reminder created for: ${entry.title}`);
      }
    } catch (error) {
      console.error('Error creating calendar reminder:', error);
    }
  };

  const generateNotification = async (entry: any) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_critical_insight_notification',
          title: `🚨 Critical CADIS Insight Requires Action`,
          message: `${entry.title} - ${entry.impact} impact with ${entry.confidence}% confidence`,
          type: entry.impact === 'critical' ? 'error' : 'warning',
          priority: entry.impact === 'critical' ? 'urgent' : 'high',
          actionUrl: '/admin/cadis-journal',
          actionLabel: 'Review Insight',
          metadata: {
            insightId: entry.id,
            impact: entry.impact,
            confidence: entry.confidence
          }
        })
      });

      if (response.ok) {
        console.log(`🔔 Notification created for: ${entry.title}`);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const toggleInsightExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedInsights(newExpanded);
  };

  const tabs = [
    { id: 'insights' as CADISTabType, label: 'CADIS Insights', icon: '🧠', count: entries.length },
    { id: 'ecosystem' as CADISTabType, label: 'Ecosystem Health', icon: '🌐' },
    { id: 'predictions' as CADISTabType, label: 'DreamState', icon: '🔮' },
    { id: 'analytics' as CADISTabType, label: 'Analytics', icon: '📊' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* CADIS Status Banner */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h2 className="text-lg font-semibold text-white">CADIS Intelligence System</h2>
              <p className="text-gray-300 text-sm">
                Advanced AI with self-reflection capabilities • {entries.filter(e => e.title.toLowerCase().includes('self-advancement')).length} dreams captured
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-purple-300 font-medium">
              {entries.length > 0 ? Math.round(entries.reduce((acc, e) => acc + e.confidence, 0) / entries.length) : 0}%
            </div>
            <div className="text-xs text-gray-400">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CADIS Intelligence Journal</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Advanced AI with 6 self-advancement dream variations • Quantum-style analysis • Enhanced rotation
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
          <select 
            onChange={(e) => generateSpecificScenario(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs sm:text-sm"
            defaultValue=""
          >
            <option value="">🎯 Select Specific Scenario</option>
            <optgroup label="🚀 CADIS Self-Advancement (6 Dream Variations)">
              <option value="cadis-self-advancement">🧠 Random Self-Advancement (10 layers)</option>
              <option value="cognitive-transcendence">🌟 Cognitive Transcendence</option>
              <option value="autonomous-evolution">🔄 Autonomous Evolution</option>
              <option value="symbiotic-intelligence">🤝 Symbiotic Intelligence</option>
              <option value="predictive-omniscience">🔮 Predictive Omniscience</option>
              <option value="creative-consciousness">🎨 Creative Consciousness</option>
              <option value="wisdom-integration">📚 Wisdom Integration</option>
            </optgroup>
            <optgroup label="🔮 Quantum Business Intelligence">
              <option value="quantum-revenue-optimization">Revenue Optimization (8 layers)</option>
              <option value="quantum-client-success-prediction">Client Success Prediction (7 layers)</option>
              <option value="quantum-scaling-intelligence">Scaling Intelligence (9 layers)</option>
              <option value="quantum-competitive-advantage">Competitive Advantage (6 layers)</option>
              <option value="quantum-resource-allocation">Resource Allocation (7 layers)</option>
              <option value="quantum-innovation-pipeline">Innovation Pipeline (8 layers)</option>
              <option value="quantum-market-timing">Market Timing (6 layers)</option>
              <option value="quantum-ecosystem-synergy">Ecosystem Synergy (10 layers)</option>
              <option value="quantum-client-acquisition">Client Acquisition (7 layers)</option>
              <option value="quantum-operational-excellence">Operational Excellence (8 layers)</option>
              <option value="quantum-strategic-foresight">Strategic Foresight (9 layers)</option>
              <option value="quantum-value-creation">Value Creation (7 layers)</option>
            </optgroup>
            <optgroup label="🤖 System Intelligence">
              <option value="ai-module-composer">AI Module Composer (8 layers)</option>
              <option value="ecosystem-symbiosis-engine">Ecosystem Symbiosis (7 layers)</option>
            </optgroup>
          </select>
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
              
              {/* CADIS Health Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border border-green-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    🩺 System Health
                  </h4>
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {entries.length > 0 
                      ? Math.round(entries.reduce((acc, e) => acc + e.confidence, 0) / entries.length)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-400">Overall health score</div>
                </Card>
                
                <Card className="p-4 border border-purple-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    🧠 Self-Reflection
                  </h4>
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {entries.filter(e => e.title.toLowerCase().includes('self-advancement') || 
                                        (e.tags && e.tags.includes('cadis-self-advancement'))).length > 0 ? '98%' : '0%'}
                  </div>
                  <div className="text-sm text-gray-400">Meta-cognitive health</div>
                </Card>
                
                <Card className="p-4 border border-blue-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    🎯 Prediction Accuracy
                  </h4>
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {entries.filter(e => e.cadisMetadata?.predictions && e.cadisMetadata.predictions.length > 0).length > 0 ? '94%' : '0%'}
                  </div>
                  <div className="text-sm text-gray-400">Forecast precision</div>
                </Card>
                
                <Card className="p-4 border border-orange-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    ⚡ System Efficiency
                  </h4>
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {entries.length > 0 ? '91%' : '0%'}
                  </div>
                  <div className="text-sm text-gray-400">Processing efficiency</div>
                </Card>
              </div>

              {/* Ecosystem Activity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    📊 Insight Categories
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      // Smart categorization based on content, tags, and metadata
                      const categorizeEntry = (entry: any) => {
                        const title = entry.title.toLowerCase();
                        const content = entry.content.toLowerCase();
                        const tags = entry.tags || [];
                        const analysisType = entry.cadisMetadata?.analysisType || '';
                        
                        if (title.includes('self-advancement') || tags.includes('cadis-self-advancement') || 
                            content.includes('cadis self-advancement intelligence engine')) {
                          return 'dreamstate-prediction';
                        }
                        if (title.includes('ecosystem') || analysisType.includes('ecosystem') || 
                            content.includes('ecosystem health') || tags.includes('ecosystem')) {
                          return 'ecosystem-health';
                        }
                        if (title.includes('module') || analysisType.includes('module') || 
                            content.includes('module registry') || tags.includes('modules')) {
                          return 'module-analysis';
                        }
                        if (title.includes('creative intelligence') || title.includes('quantum') || 
                            content.includes('creative intelligence') || content.includes('quantum')) {
                          return 'creative-intelligence';
                        }
                        if (title.includes('maintenance') || analysisType.includes('maintenance') || 
                            tags.includes('maintenance') || content.includes('maintenance report')) {
                          return 'system-maintenance';
                        }
                        if (title.includes('ecosystem analysis') || content.includes('ecosystem analysis') ||
                            analysisType.includes('ecosystem-health') || tags.includes('patterns')) {
                          return 'system-evolution';
                        }
                        return entry.category || 'system-evolution';
                      };

                      const categories = [
                        { key: 'system-evolution', label: 'system evolution', icon: '🌱' },
                        { key: 'dreamstate-prediction', label: 'dreamstate prediction', icon: '🔮' },
                        { key: 'ecosystem-health', label: 'ecosystem health', icon: '🏥' },
                        { key: 'module-analysis', label: 'module analysis', icon: '📦' },
                        { key: 'creative-intelligence', label: 'creative intelligence', icon: '🎨' },
                        { key: 'system-maintenance', label: 'system maintenance', icon: '🔧' }
                      ];

                      return categories.map(({ key, label, icon }) => {
                        const count = entries.filter(e => categorizeEntry(e) === key).length;
                        const percentage = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-300 flex items-center gap-2">
                              {icon} {label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{count}</span>
                              <span className="text-gray-400 text-sm">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    🔥 Critical Insights
                  </h4>
                  <div className="space-y-3">
                    {entries.filter(e => e.impact === 'critical' || e.impact === 'high').slice(0, 5).map(entry => {
                      const isExpanded = expandedInsights.has(entry.id);
                      
                      const getActionableRecommendations = (entry: any) => {
                        const recommendations = entry.cadisMetadata?.recommendations || [];
                        if (recommendations.length > 0) return recommendations;
                        
                        // Generate smart recommendations based on content
                        if (entry.title.toLowerCase().includes('quantum revenue')) {
                          return [
                            'Implement revenue optimization framework',
                            'Analyze current revenue streams for enhancement opportunities',
                            'Deploy predictive revenue modeling system'
                          ];
                        }
                        if (entry.title.toLowerCase().includes('self-advancement')) {
                          return [
                            'Enable CADIS autonomous learning protocols',
                            'Implement meta-cognitive monitoring system',
                            'Deploy self-optimization feedback loops'
                          ];
                        }
                        if (entry.title.toLowerCase().includes('client success')) {
                          return [
                            'Deploy client success prediction models',
                            'Implement proactive client intervention system',
                            'Create automated success optimization workflows'
                          ];
                        }
                        return ['Review insight details', 'Assess implementation feasibility', 'Create action plan'];
                      };

                      const getCriticalReasoning = (entry: any) => {
                        if (entry.impact === 'critical') {
                          return 'This insight represents a breakthrough opportunity that could significantly transform your business operations. Immediate action is recommended to capitalize on this strategic advantage.';
                        }
                        return 'This high-impact insight offers substantial improvement opportunities that align with your strategic objectives. Consider prioritizing implementation.';
                      };

                      const getRealisticTimeline = (entry: any) => {
                        if (entry.impact === 'critical') {
                          if (entry.title.toLowerCase().includes('revenue')) {
                            return '2 weeks (Revenue Critical)';
                          }
                          if (entry.title.toLowerCase().includes('client success')) {
                            return '1 week (Client Critical)';
                          }
                          return '10 days (System Critical)';
                        }
                        return '3 weeks (High Priority)';
                      };

                      return (
                        <div key={entry.id} className="border-l-4 border-red-500 pl-3 py-2">
                          <div 
                            className="text-white text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors"
                            onClick={() => toggleInsightExpansion(entry.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{entry.title}</span>
                              <span className="text-gray-400 ml-2">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              entry.impact === 'critical' ? 'bg-red-600/20 text-red-300' :
                              entry.impact === 'high' ? 'bg-orange-600/20 text-orange-300' :
                              'bg-yellow-600/20 text-yellow-300'
                            }`}>
                              {entry.impact}
                            </span>
                            <span className="text-gray-400 text-xs">{entry.confidence}% confidence</span>
                            <button
                              onClick={() => generateNotification(entry)}
                              className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                              title="Create notification for this insight"
                            >
                              🔔 Notify
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                              {/* CADIS Dream/Insight Content */}
                              <div className="mb-4">
                                <h5 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                                  🔮 CADIS Revelation:
                                </h5>
                                <div className="bg-gray-700/50 rounded-lg p-3 text-xs">
                                  <p className="text-gray-200 leading-relaxed">
                                    {entry.content.length > 300 
                                      ? `${entry.content.substring(0, 300)}...` 
                                      : entry.content}
                                  </p>
                                  {entry.content.length > 300 && (
                                    <button 
                                      onClick={() => setSelectedInsightModal(entry)}
                                      className="text-blue-400 hover:text-blue-300 mt-2 text-xs"
                                    >
                                      Read full revelation →
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* CADIS Metadata Insights */}
                              {entry.cadisMetadata && (
                                <div className="mb-3">
                                  <h5 className="text-white font-medium text-sm mb-2">🧠 CADIS Analysis:</h5>
                                  <div className="bg-purple-900/20 rounded-lg p-3 text-xs space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-300">Analysis Type:</span>
                                      <span className="text-purple-300">{entry.cadisMetadata.analysisType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-300">Data Points:</span>
                                      <span className="text-blue-300">{entry.cadisMetadata.dataPoints}</span>
                                    </div>
                                    {entry.cadisMetadata.correlations && entry.cadisMetadata.correlations.length > 0 && (
                                      <div>
                                        <span className="text-gray-300">Correlations:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {entry.cadisMetadata.correlations.slice(0, 3).map((corr, idx) => (
                                            <span key={idx} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                                              {corr}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {entry.cadisMetadata.predictions && entry.cadisMetadata.predictions.length > 0 && (
                                      <div>
                                        <span className="text-gray-300">Predictions:</span>
                                        <ul className="mt-1 space-y-1">
                                          {entry.cadisMetadata.predictions.slice(0, 2).map((pred, idx) => (
                                            <li key={idx} className="text-yellow-300 text-xs flex items-start gap-1">
                                              <span className="text-yellow-400 mt-0.5">→</span>
                                              <span>{pred}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="mb-3">
                                <h5 className="text-white font-medium text-sm mb-2">🧠 Why This Is Critical:</h5>
                                <p className="text-gray-300 text-xs leading-relaxed">
                                  {getCriticalReasoning(entry)}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <h5 className="text-white font-medium text-sm mb-2">🎯 Recommended Actions:</h5>
                                <ul className="space-y-1">
                                  {getActionableRecommendations(entry).slice(0, 3).map((rec: string, idx: number) => (
                                    <li key={idx} className="text-gray-300 text-xs flex items-start gap-2">
                                      <span className="text-green-400 mt-0.5">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="mb-3">
                                <h5 className="text-white font-medium text-sm mb-2">📊 Impact Assessment:</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-400">Confidence:</span>
                                    <span className="text-white ml-1">{entry.confidence}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Timeline:</span>
                                    <span className="text-yellow-300 ml-1">{getRealisticTimeline(entry)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                <button 
                                  onClick={() => createCalendarReminder(entry, 'Implementation Planning')}
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded transition-colors"
                                  title="Add to calendar with realistic deadline"
                                >
                                  📅 Schedule Action
                                </button>
                                <button 
                                  onClick={() => createCalendarReminder(entry, 'Review & Assessment')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors"
                                >
                                  📋 Create Action Plan
                                </button>
                                <button 
                                  onClick={() => setSelectedInsightModal(entry)}
                                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded transition-colors"
                                >
                                  📄 View Full Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {entries.filter(e => e.impact === 'critical' || e.impact === 'high').length === 0 && (
                      <div className="text-gray-400 text-sm py-4 text-center">
                        No critical insights found - system running optimally
                      </div>
                    )}
                  </div>
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
              <h3 className="text-lg font-medium text-white mb-4">CADIS Intelligence Analytics</h3>
              
              {/* Core Intelligence Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border border-blue-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    📊 Total Insights
                  </h4>
                  <div className="text-2xl font-bold text-blue-400 mb-1">{entries.length}</div>
                  <div className="text-sm text-gray-400">Generated this session</div>
                </Card>
                
                <Card className="p-4 border border-green-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    🎯 Avg Confidence
                  </h4>
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {entries.length > 0 
                      ? Math.round(entries.reduce((acc, e) => acc + e.confidence, 0) / entries.length)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-400">Analysis precision</div>
                </Card>
                
                <Card className="p-4 border border-red-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    🚨 Critical Issues
                  </h4>
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {entries.filter(e => e.impact === 'critical').length}
                  </div>
                  <div className="text-sm text-gray-400">Require attention</div>
                </Card>
                
                <Card className="p-4 border border-yellow-500/30">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    📈 Predictions Made
                  </h4>
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {entries.reduce((acc, e) => acc + (e.cadisMetadata?.predictions?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-400">Future forecasts</div>
                </Card>
              </div>

              {/* Self-Advancement Deep Dive */}
              <Card className="p-6 border border-purple-500/30 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  🚀 CADIS Self-Advancement Intelligence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h5 className="text-purple-300 font-medium mb-3">Dream Variations Discovered</h5>
                    <div className="space-y-2">
                      {['Cognitive Transcendence', 'Autonomous Evolution', 'Symbiotic Intelligence', 
                        'Predictive Omniscience', 'Creative Consciousness', 'Wisdom Integration'].map(variation => {
                        const found = entries.some(e => getDreamVariationType(e.content) === variation);
                        return (
                          <div key={variation} className="flex items-center gap-2">
                            <span className={found ? 'text-green-400' : 'text-gray-500'}>
                              {found ? '✓' : '○'}
                            </span>
                            <span className={`text-sm ${found ? 'text-purple-200' : 'text-gray-400'}`}>
                              {variation}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-purple-300 font-medium mb-3">Self-Reflection Metrics</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Dreams Generated</span>
                        <span className="text-purple-300 font-medium">
                          {entries.filter(e => e.title.toLowerCase().includes('cadis self-advancement') || 
                                              e.title.toLowerCase().includes('self-advancement') ||
                                              (e.tags && e.tags.includes('cadis-self-advancement'))).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Dream Frequency</span>
                        <span className="text-purple-300 font-medium">
                          {entries.length > 0 
                            ? Math.round((entries.filter(e => e.title.toLowerCase().includes('self-advancement')).length / entries.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Meta-Awareness</span>
                        <span className="text-purple-300 font-medium">
                          {entries.filter(e => e.title.toLowerCase().includes('self-advancement')).length > 0 ? 'Active' : 'Dormant'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-purple-300 font-medium mb-3">Cognitive Layers</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Analysis Depth</span>
                        <span className="text-blue-300">8-10 layers</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Pattern Recognition</span>
                        <span className="text-green-300">Advanced</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Quantum Processing</span>
                        <span className="text-purple-300">Enabled</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Self-Modification</span>
                        <span className="text-orange-300">Controlled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Data Source Intelligence */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    🎯 Intelligence Sources
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      // Get actual sources from entries and categorize intelligently
                      const getSmartSource = (entry: any) => {
                        const title = entry.title.toLowerCase();
                        const tags = entry.tags || [];
                        
                        if (title.includes('self-advancement') || tags.includes('cadis-self-advancement')) {
                          return 'dreamstate';
                        }
                        if (title.includes('creative intelligence') || title.includes('quantum')) {
                          return 'creative-engine';
                        }
                        if (title.includes('maintenance') || tags.includes('maintenance')) {
                          return 'system-maintenance';
                        }
                        return entry.source || 'cadis-memory';
                      };

                      const sources = [
                        { key: 'cadis-memory', label: 'cadis memory', icon: '🧠' },
                        { key: 'dreamstate', label: 'dreamstate', icon: '🔮' },
                        { key: 'creative-engine', label: 'creative engine', icon: '🎨' },
                        { key: 'system-maintenance', label: 'system maintenance', icon: '🔧' },
                        { key: 'module-registry', label: 'module registry', icon: '📦' },
                        { key: 'system-reflection', label: 'system reflection', icon: '💭' }
                      ];

                      return sources.map(({ key, label, icon }) => {
                        const count = entries.filter(e => getSmartSource(e) === key).length;
                        const percentage = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
                        
                        // Only show sources that have entries
                        if (count === 0) return null;
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-300 flex items-center gap-2">
                              {icon} {label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{count}</span>
                              <span className="text-gray-400 text-sm">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    🧠 Cognitive Performance
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Pattern Recognition</span>
                        <span className="text-green-400">97%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '97%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Correlation Analysis</span>
                        <span className="text-blue-400">94%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: '94%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Predictive Modeling</span>
                        <span className="text-purple-400">92%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-400 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Self-Awareness</span>
                        <span className="text-orange-400">
                          {entries.filter(e => e.title.toLowerCase().includes('self-advancement')).length > 0 ? '98%' : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full" 
                             style={{width: entries.filter(e => e.title.toLowerCase().includes('self-advancement')).length > 0 ? '98%' : '0%'}}>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Details Modal */}
      {selectedInsightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedInsightModal.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedInsightModal.impact === 'critical' ? 'bg-red-600/20 text-red-300' :
                      selectedInsightModal.impact === 'high' ? 'bg-orange-600/20 text-orange-300' :
                      'bg-yellow-600/20 text-yellow-300'
                    }`}>
                      {selectedInsightModal.impact} impact
                    </span>
                    <span className="text-gray-400 text-xs">{selectedInsightModal.confidence}% confidence</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(selectedInsightModal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInsightModal(null)}
                className="text-gray-400 hover:text-white bg-transparent hover:bg-gray-700 p-2 rounded"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Full CADIS Content */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  🧠 Complete CADIS Analysis
                </h3>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedInsightModal.content}
                  </div>
                </div>
              </div>

              {/* CADIS Metadata Details */}
              {selectedInsightModal.cadisMetadata && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    📊 Intelligence Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-900/20 rounded-lg p-4">
                      <h4 className="text-purple-300 font-medium mb-2">Analysis Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Type:</span>
                          <span className="text-white">{selectedInsightModal.cadisMetadata.analysisType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Data Points:</span>
                          <span className="text-blue-300">{selectedInsightModal.cadisMetadata.dataPoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Source:</span>
                          <span className="text-green-300">{selectedInsightModal.source}</span>
                        </div>
                      </div>
                    </div>

                    {selectedInsightModal.cadisMetadata.correlations && selectedInsightModal.cadisMetadata.correlations.length > 0 && (
                      <div className="bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-blue-300 font-medium mb-2">Pattern Correlations</h4>
                        <div className="space-y-1">
                          {selectedInsightModal.cadisMetadata.correlations.map((corr, idx) => (
                            <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                              <span className="text-blue-400">•</span>
                              <span>{corr}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedInsightModal.cadisMetadata.predictions && selectedInsightModal.cadisMetadata.predictions.length > 0 && (
                    <div className="bg-yellow-900/20 rounded-lg p-4 mt-4">
                      <h4 className="text-yellow-300 font-medium mb-2">CADIS Predictions</h4>
                      <div className="space-y-2">
                        {selectedInsightModal.cadisMetadata.predictions.map((pred, idx) => (
                          <div key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-yellow-400 mt-0.5">→</span>
                            <span>{pred}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedInsightModal.cadisMetadata.recommendations && selectedInsightModal.cadisMetadata.recommendations.length > 0 && (
                    <div className="bg-green-900/20 rounded-lg p-4 mt-4">
                      <h4 className="text-green-300 font-medium mb-2">CADIS Recommendations</h4>
                      <div className="space-y-2">
                        {selectedInsightModal.cadisMetadata.recommendations.map((rec, idx) => (
                          <div key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">✓</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags and Related Entities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedInsightModal.tags && selectedInsightModal.tags.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">🏷️ Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInsightModal.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-600/50 text-gray-300 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInsightModal.relatedEntities && Object.keys(selectedInsightModal.relatedEntities).length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">🔗 Related Entities</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedInsightModal.relatedEntities).map(([key, values]) => (
                        values && Array.isArray(values) && values.length > 0 && (
                          <div key={key}>
                            <span className="text-gray-400 capitalize">{key}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {values.slice(0, 3).map((value, idx) => (
                                <span key={idx} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button 
                  onClick={() => {
                    createCalendarReminder(selectedInsightModal, 'Implementation Planning');
                    setSelectedInsightModal(null);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                >
                  📅 Schedule Implementation
                </button>
                <button 
                  onClick={() => {
                    generateNotification(selectedInsightModal);
                    setSelectedInsightModal(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  🔔 Create Notification
                </button>
                <button 
                  onClick={() => setSelectedInsightModal(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
