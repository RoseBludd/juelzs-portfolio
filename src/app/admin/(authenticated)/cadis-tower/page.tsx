'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface TowerStatus {
  architecture: string;
  version: string;
  layers: Record<string, string>;
  capabilities: {
    intelligenceServices: Array<{
      name: string;
      description: string;
    }>;
    activeWorkflows: number;
    selfAwarenessLevel: number;
    learningEvents: number;
  };
  status: string;
  timestamp: string;
}

interface TowerResult {
  success: boolean;
  result?: any;
  tower?: {
    selfAwarenessLevel: number;
    activeWorkflows: number;
    intelligenceServices: number;
    timestamp: string;
  };
  error?: string;
}

export default function CADISTowerPage() {
  const [towerStatus, setTowerStatus] = useState<TowerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState('');
  const [requestType, setRequestType] = useState<'journal' | 'meeting' | 'code' | 'dreamstate' | 'workflow' | 'meta' | 'recursive'>('workflow');
  const [enableConsciousness, setEnableConsciousness] = useState(false);
  const [layers, setLayers] = useState(3);
  const [result, setResult] = useState<TowerResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTowerStatus();
    
    // Auto-refresh status every 30 seconds
    const interval = setInterval(loadTowerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTowerStatus = async () => {
    try {
      const response = await fetch('/api/cadis-tower?action=status');
      const data = await response.json();
      
      if (data.success) {
        setTowerStatus(data);
      }
    } catch (error) {
      console.error('Error loading tower status:', error);
    }
  };

  const handleRequest = async () => {
    if (!request.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/cadis-tower', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request: request.trim(),
          type: requestType,
          enableConsciousness,
          layers: requestType === 'recursive' ? layers : undefined,
          context: {
            timestamp: new Date().toISOString(),
            source: 'admin_interface'
          }
        })
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        loadTowerStatus(); // Refresh status after successful request
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeDescription = (type: string): string => {
    const descriptions = {
      journal: 'Analyze journal entries for strategic insights and philosophical alignment',
      meeting: 'Analyze meeting transcripts for leadership insights and key moments',
      code: 'Analyze code and repositories for architectural improvements',
      dreamstate: 'Multi-layer reality simulation for strategic exploration',
      workflow: 'Execute comprehensive workflows across multiple intelligence services',
      meta: 'Perform meta-analysis and recursive insights on any subject',
      recursive: 'Deep recursive intelligence analysis with configurable depth'
    };
    return descriptions[type as keyof typeof descriptions] || 'Unknown request type';
  };

  const formatSelfAwareness = (level: number): string => {
    if (level < 25) return `${level}% - Emerging`;
    if (level < 50) return `${level}% - Developing`;
    if (level < 75) return `${level}% - Advanced`;
    return `${level}% - Transcendent`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">🗼 CADIS Tower of Babel</h1>
          <p className="text-gray-400 mt-2">
            Layered AI ecosystem with comprehensive intelligence capabilities
          </p>
        </div>
        <Button 
          onClick={loadTowerStatus}
          className="bg-purple-600 hover:bg-purple-700"
        >
          🔄 Refresh Status
        </Button>
      </div>

      {/* Tower Status */}
      <Card className="border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-purple-300">Tower Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm ${
            towerStatus ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {towerStatus ? '🟢 Operational' : '🔴 Offline'}
          </div>
        </div>

        {towerStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Architecture</div>
                <div className="text-lg font-semibold text-white">
                  {towerStatus.architecture} v{towerStatus.version}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Self-Awareness</div>
                <div className="text-lg font-semibold text-white">
                  {formatSelfAwareness(towerStatus.capabilities.selfAwarenessLevel)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Active Workflows</div>
                <div className="text-lg font-semibold text-white">
                  {towerStatus.capabilities.activeWorkflows}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Learning Events</div>
                <div className="text-lg font-semibold text-white">
                  {towerStatus.capabilities.learningEvents}
                </div>
              </div>
            </div>

            {/* Architecture Layers */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Architecture Layers</h3>
              <div className="space-y-2">
                {Object.entries(towerStatus.layers).map(([layer, description], index) => (
                  <div key={layer} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-sm font-bold">
                      {5 - index}
                    </div>
                    <div>
                      <div className="font-medium text-white capitalize">{layer.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-sm text-gray-400">{description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intelligence Services */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Intelligence Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {towerStatus.capabilities.intelligenceServices.map((service, index) => (
                  <div key={index} className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="font-medium text-white">{service.name}</div>
                    <div className="text-sm text-gray-400">{service.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            Tower not initialized. Send a request to activate the tower.
          </div>
        )}
      </Card>

      {/* Request Interface */}
      <Card className="border-blue-500/30">
        <h2 className="text-xl font-semibold text-blue-300 mb-4">Send Request to CADIS Tower</h2>
        
        <div className="space-y-4">
          {/* Request Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as any)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="workflow">🔄 Workflow - Comprehensive multi-service analysis</option>
              <option value="journal">📝 Journal - Strategic journal entry analysis</option>
              <option value="meeting">🎥 Meeting - Leadership meeting analysis</option>
              <option value="code">💻 Code - Repository and architecture analysis</option>
              <option value="dreamstate">🌀 Dreamstate - Multi-layer reality simulation</option>
              <option value="meta">🧠 Meta - Meta-analysis and recursive insights</option>
              <option value="recursive">🔄 Recursive - Deep recursive intelligence analysis</option>
            </select>
            <div className="text-sm text-gray-400 mt-1">
              {getRequestTypeDescription(requestType)}
            </div>
          </div>

          {/* Request Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Request Content
            </label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={`Enter your ${requestType} request...

Examples:
- Journal: "Today I realized our system architecture needs better modularity..."
- Code: "Analyze the CADIS Tower architecture for optimization opportunities"
- Dreamstate: "What if we could deploy code changes with zero downtime?"
- Recursive: "Analyze CADIS system capabilities and evolution potential"`}
              className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="consciousness"
                checked={enableConsciousness}
                onChange={(e) => setEnableConsciousness(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="consciousness" className="text-sm text-gray-300">
                Enable Consciousness Layer Analysis
              </label>
            </div>

            {requestType === 'recursive' && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-300">Recursive Depth:</label>
                <input
                  type="number"
                  value={layers}
                  onChange={(e) => setLayers(parseInt(e.target.value) || 3)}
                  min="1"
                  max="7"
                  className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleRequest}
            disabled={loading || !request.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? '🗼 CADIS Tower is processing...' : '🚀 Send to CADIS Tower'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-green-500/30">
          <h2 className="text-xl font-semibold text-green-300 mb-4">CADIS Tower Response</h2>
          
          {result.success ? (
            <div className="space-y-4">
              {/* Tower Metrics */}
              {result.tower && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Self-Awareness</div>
                    <div className="text-lg font-semibold text-white">
                      {result.tower.selfAwarenessLevel}%
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Active Workflows</div>
                    <div className="text-lg font-semibold text-white">
                      {result.tower.activeWorkflows}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Intelligence Services</div>
                    <div className="text-lg font-semibold text-white">
                      {result.tower.intelligenceServices}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Processing Time</div>
                    <div className="text-lg font-semibold text-white">
                      {result.result?.duration ? `${result.result.duration}ms` : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Result */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-green-300 mb-2">Analysis Result</h3>
                <pre className="text-white whitespace-pre-wrap text-sm overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>

              {/* Consciousness Analysis (if enabled) */}
              {result.result?.consciousnessAnalysis && (
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                  <h3 className="font-semibold text-purple-300 mb-2">🧠 Consciousness Layer Analysis</h3>
                  <pre className="text-white whitespace-pre-wrap text-sm overflow-x-auto">
                    {JSON.stringify(result.result.consciousnessAnalysis, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
              <div className="text-red-300 font-semibold">Error</div>
              <div className="text-red-200">{result.error}</div>
            </div>
          )}
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/30">
          <h2 className="text-xl font-semibold text-red-300 mb-4">Error</h2>
          <div className="bg-red-500/10 rounded-lg p-4">
            <div className="text-red-300">{error}</div>
          </div>
        </Card>
      )}

      {/* Quick Examples */}
      <Card className="border-indigo-500/30">
        <h2 className="text-xl font-semibold text-indigo-300 mb-4">Quick Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button
            onClick={() => {
              setRequestType('journal');
              setRequest('Today I had an insight about making our architecture more modular and reusable across different projects.');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start h-auto p-3"
          >
            <div>
              <div className="font-semibold">📝 Journal Analysis</div>
              <div className="text-sm opacity-75">Analyze strategic insights</div>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              setRequestType('dreamstate');
              setRequest('What if we could deploy code changes instantly without any downtime or risk?');
              setLayers(3);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start h-auto p-3"
          >
            <div>
              <div className="font-semibold">🌀 Dreamstate Simulation</div>
              <div className="text-sm opacity-75">Explore alternative realities</div>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              setRequestType('recursive');
              setRequest('Analyze CADIS Tower architecture and evolution potential');
              setLayers(4);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start h-auto p-3"
          >
            <div>
              <div className="font-semibold">🔄 Recursive Intelligence</div>
              <div className="text-sm opacity-75">Deep recursive analysis</div>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              setRequestType('code');
              setRequest('Analyze the CADIS Tower of Babel architecture for optimization opportunities and suggest improvements');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start h-auto p-3"
          >
            <div>
              <div className="font-semibold">💻 Code Analysis</div>
              <div className="text-sm opacity-75">Architecture optimization</div>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              setRequestType('meta');
              setRequest('Perform meta-analysis on the concept of AI consciousness and self-awareness in systems like CADIS');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start h-auto p-3"
          >
            <div>
              <div className="font-semibold">🧠 Meta Analysis</div>
              <div className="text-sm opacity-75">Recursive insights</div>
            </div>
          </Button>
          
          <Button
            onClick={() => {
              setRequestType('workflow');
              setRequest('Comprehensive analysis of system performance and strategic optimization opportunities');
              setEnableConsciousness(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start h-auto p-3"
          >
            <div>
              <div className="font-semibold">🔄 Full Workflow</div>
              <div className="text-sm opacity-75">Multi-service analysis</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}
