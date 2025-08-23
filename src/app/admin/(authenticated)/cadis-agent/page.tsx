'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AgentStatus {
  isProcessing: boolean;
  queueLength: number;
  uptime: number;
}

interface AgentInfo {
  agent: string;
  version: string;
  status: AgentStatus;
  capabilities: string[];
  models: {
    gpt5: string;
    claude: string;
    gemini: string;
  };
}

export default function CADISAgentPage() {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgentStatus();
    
    // Auto-refresh status every 10 seconds
    const interval = setInterval(loadAgentStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAgentStatus = async () => {
    try {
      const response = await fetch('/api/cadis-agent');
      const data = await response.json();
      
      if (data.success) {
        setAgentInfo(data);
      }
    } catch (error) {
      console.error('Error loading agent status:', error);
    }
  };

  const handleRequest = async () => {
    if (!request.trim()) return;

    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/cadis-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'handle_request',
          request: request.trim(),
          context: context ? JSON.parse(context) : undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
        setRequest(''); // Clear the request
        loadAgentStatus(); // Refresh status
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">CADIS Background Agent</h1>
          <p className="text-gray-400 mt-2">
            Autonomous coding agent with multi-AI model support
          </p>
        </div>
        <Button 
          onClick={loadAgentStatus}
          className="bg-blue-600 hover:bg-blue-700"
        >
          🔄 Refresh Status
        </Button>
      </div>

      {/* Agent Status */}
      <Card className="border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-300">Agent Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm ${
            agentInfo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {agentInfo ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>

        {agentInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Processing Status</div>
              <div className="text-lg font-semibold text-white">
                {agentInfo.status.isProcessing ? '🔄 Processing' : '⏸️ Idle'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Queue Length</div>
              <div className="text-lg font-semibold text-white">
                {agentInfo.status.queueLength} jobs
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Uptime</div>
              <div className="text-lg font-semibold text-white">
                {formatUptime(agentInfo.status.uptime)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            Agent not initialized. Send a request to start the agent.
          </div>
        )}
      </Card>

      {/* AI Models */}
      {agentInfo && (
        <Card className="border-purple-500/30">
          <h2 className="text-xl font-semibold text-purple-300 mb-4">AI Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">OpenAI GPT-5</div>
              <div className="text-white font-mono text-sm">{agentInfo.models.gpt5}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Claude Opus</div>
              <div className="text-white font-mono text-sm">{agentInfo.models.claude}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Gemini Pro</div>
              <div className="text-white font-mono text-sm">{agentInfo.models.gemini}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Request Interface */}
      <Card className="border-green-500/30">
        <h2 className="text-xl font-semibold text-green-300 mb-4">Send Request to CADIS</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Request Description
            </label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Describe what you want CADIS to do... 

Examples:
- Fix the login bug in the authentication system
- Add a new feature to the portfolio projects page  
- Deploy the latest changes to production
- Handle support ticket about slow loading times
- Adjust the Strategic Architect Masterclass UI"
              className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Context (Optional JSON)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder='{"repository": "juelzs-portfolio", "priority": "high", "environment": "production"}'
              className="w-full h-20 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-green-500 focus:outline-none resize-none font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleRequest}
            disabled={loading || !request.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
          >
            {loading ? '🤖 CADIS is thinking...' : '🚀 Send to CADIS Agent'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className="border-amber-500/30">
          <h2 className="text-xl font-semibold text-amber-300 mb-4">CADIS Response</h2>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <pre className="text-white whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-500/30">
          <h2 className="text-xl font-semibold text-red-300 mb-4">Error</h2>
          <div className="bg-red-500/10 rounded-lg p-4">
            <div className="text-red-300">{error}</div>
          </div>
        </Card>
      )}

      {/* Capabilities */}
      {agentInfo && (
        <Card className="border-gray-500/30">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Agent Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {agentInfo.capabilities.map((capability, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span>
                <span className="text-sm">{capability}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-indigo-500/30">
        <h2 className="text-xl font-semibold text-indigo-300 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button
            onClick={() => setRequest('Fix any TypeScript errors in the codebase')}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start"
          >
            🔧 Fix TypeScript Errors
          </Button>
          <Button
            onClick={() => setRequest('Update dependencies to latest versions')}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start"
          >
            📦 Update Dependencies
          </Button>
          <Button
            onClick={() => setRequest('Optimize the Strategic Architect Masterclass performance')}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start"
          >
            ⚡ Optimize Performance
          </Button>
          <Button
            onClick={() => setRequest('Add comprehensive error handling to API routes')}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start"
          >
            🛡️ Improve Error Handling
          </Button>
          <Button
            onClick={() => setRequest('Deploy latest changes to production')}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start"
          >
            🚀 Deploy to Production
          </Button>
          <Button
            onClick={() => setRequest('Generate comprehensive documentation for the codebase')}
            className="bg-indigo-600 hover:bg-indigo-700 text-left justify-start"
          >
            📚 Generate Documentation
          </Button>
        </div>
      </Card>
    </div>
  );
}
