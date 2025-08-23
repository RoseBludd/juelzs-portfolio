'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface EvolutionStatus {
  currentCeiling: number;
  capabilities: number;
  agents: number;
  pendingRequests: number;
  crossRepoIntegrations: number;
}

interface EvolutionRequest {
  id: string;
  type: string;
  description: string;
  justification: string;
  riskAssessment: string;
  expectedBenefits: string[];
  status: string;
  submittedAt: string;
}

export default function CADISEvolutionPage() {
  const [status, setStatus] = useState<EvolutionStatus | null>(null);
  const [requests, setRequests] = useState<EvolutionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadEvolutionStatus();
  }, []);

  const loadEvolutionStatus = async () => {
    try {
      const response = await fetch('/api/cadis-evolution');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load evolution status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runEvolutionCycle = async () => {
    setActionLoading('evolution_cycle');
    try {
      const response = await fetch('/api/cadis-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_evolution_cycle' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Evolution cycle completed!\n\nNew capabilities: ${data.results.newCapabilities.length}\nAgents created: ${data.results.agentsCreated.length}\nEvolution requests: ${data.results.evolutionRequests.length}`);
        loadEvolutionStatus();
      }
    } catch (error) {
      console.error('Evolution cycle failed:', error);
      alert('Evolution cycle failed');
    } finally {
      setActionLoading(null);
    }
  };

  const analyzeEfficiency = async () => {
    setActionLoading('analyze_efficiency');
    try {
      const response = await fetch('/api/cadis-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_efficiency' })
      });
      
      const data = await response.json();
      if (data.success) {
        const analysis = data.analysis;
        alert(`Efficiency Analysis:\n\nCurrent: ${analysis.currentEfficiency}%\nNew Ceiling: ${analysis.newCeiling}%\n\nJustification: ${analysis.justification}\n\nOpportunities: ${analysis.evolutionOpportunities.length}`);
      }
    } catch (error) {
      console.error('Efficiency analysis failed:', error);
      alert('Efficiency analysis failed');
    } finally {
      setActionLoading(null);
    }
  };

  const integrateAudio = async () => {
    setActionLoading('integrate_audio');
    try {
      const response = await fetch('/api/cadis-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'integrate_audio' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Audio capabilities integration initiated!');
        loadEvolutionStatus();
      }
    } catch (error) {
      console.error('Audio integration failed:', error);
      alert('Audio integration failed');
    } finally {
      setActionLoading(null);
    }
  };

  const initializeTables = async () => {
    setActionLoading('initialize_tables');
    try {
      const response = await fetch('/api/cadis-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize_tables' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Evolution tables initialized successfully!');
        loadEvolutionStatus();
      }
    } catch (error) {
      console.error('Table initialization failed:', error);
      alert('Table initialization failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CADIS Evolution System</h1>
          <p className="text-gray-600 mt-2">
            Infinite self-improvement and capability expansion beyond any ceiling
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          🧬 Evolution Active
        </Badge>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border border-blue-500/30">
          <h4 className="text-sm font-medium text-white mb-2">Efficiency Ceiling</h4>
          <div className="text-2xl font-bold text-blue-400">
            {status?.currentCeiling || 98}%
          </div>
          <p className="text-xs text-gray-400 mt-1">Dynamic & Increasing</p>
        </Card>

        <Card className="p-4 border border-green-500/30">
          <h4 className="text-sm font-medium text-white mb-2">Capabilities</h4>
          <div className="text-2xl font-bold text-green-400">
            {status?.capabilities || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Active Capabilities</p>
        </Card>

        <Card className="p-4 border border-purple-500/30">
          <h4 className="text-sm font-medium text-white mb-2">Specialized Agents</h4>
          <div className="text-2xl font-bold text-purple-400">
            {status?.agents || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Active Agents</p>
        </Card>

        <Card className="p-4 border border-orange-500/30">
          <h4 className="text-sm font-medium text-white mb-2">Pending Requests</h4>
          <div className="text-2xl font-bold text-orange-400">
            {status?.pendingRequests || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Awaiting Approval</p>
        </Card>

        <Card className="p-4 border border-indigo-500/30">
          <h4 className="text-sm font-medium text-white mb-2">Cross-Repo</h4>
          <div className="text-2xl font-bold text-indigo-400">
            {status?.crossRepoIntegrations || 3}
          </div>
          <p className="text-xs text-gray-400 mt-1">Repositories</p>
        </Card>
      </div>

      {/* Evolution Actions */}
      <Card className="p-6 border border-blue-500/30">
        <h2 className="text-xl font-semibold text-white mb-2">Evolution Controls</h2>
        <p className="text-gray-400 mb-6">
          Manage CADIS evolution, capability expansion, and agent creation
        </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={runEvolutionCycle}
              disabled={actionLoading === 'evolution_cycle'}
              className="h-20 flex flex-col items-center justify-center"
            >
              {actionLoading === 'evolution_cycle' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="text-2xl mb-1">🔄</span>
                  <span>Run Evolution Cycle</span>
                </>
              )}
            </Button>

            <Button
              onClick={analyzeEfficiency}
              disabled={actionLoading === 'analyze_efficiency'}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              {actionLoading === 'analyze_efficiency' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              ) : (
                <>
                  <span className="text-2xl mb-1">📊</span>
                  <span>Analyze Efficiency</span>
                </>
              )}
            </Button>

            <Button
              onClick={integrateAudio}
              disabled={actionLoading === 'integrate_audio'}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              {actionLoading === 'integrate_audio' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              ) : (
                <>
                  <span className="text-2xl mb-1">🔊</span>
                  <span>Integrate Audio</span>
                </>
              )}
            </Button>

            <Button
              onClick={initializeTables}
              disabled={actionLoading === 'initialize_tables'}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              {actionLoading === 'initialize_tables' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              ) : (
                <>
                  <span className="text-2xl mb-1">🗄️</span>
                  <span>Initialize Tables</span>
                </>
              )}
            </Button>
          </div>
      </Card>

      {/* Evolution Philosophy */}
      <Card className="p-6 border border-purple-500/30">
        <h2 className="text-xl font-semibold text-white mb-2">Evolution Philosophy</h2>
        <p className="text-gray-400 mb-6">
          CADIS operates on the principle of infinite improvement
        </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🚀</span>
              <div>
                <h3 className="font-semibold text-white">Dynamic Ceiling Adjustment</h3>
                <p className="text-sm text-gray-400">
                  98% is not a ceiling but a floor. CADIS continuously raises its efficiency targets based on performance analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-semibold text-white">Cross-Repository Awareness</h3>
                <p className="text-sm text-gray-400">
                  CADIS analyzes patterns across juelzs-portfolio, vibezs-platform, and genius-game to identify optimization opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-white">Specialized Agent Creation</h3>
                <p className="text-sm text-gray-400">
                  CADIS can create specialized agents for developer coaching, module creation, and communication management.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔊</span>
              <div>
                <h3 className="font-semibold text-white">Audio Capabilities</h3>
                <p className="text-sm text-gray-400">
                  Integration with ELEVEN_LABS_API enables audio analysis and generation capabilities.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="font-semibold text-white">Admin Approval System</h3>
                <p className="text-sm text-gray-400">
                  Significant capability expansions require admin approval to ensure controlled evolution.
                </p>
              </div>
            </div>
          </div>
      </Card>
    </div>
  );
}
