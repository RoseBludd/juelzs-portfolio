'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface OverallAnalysisData {
  summary: {
    totalDataPoints: number;
    analysisScore: number;
    lastUpdated: string;
    confidenceLevel: number;
  };
  masterclassChats: {
    totalConversations: number;
    strategicIntensity: number;
    philosophicalAlignment: number;
    keyInsights: string[];
    evolutionPhases: any[];
  };
  meetings: {
    totalMeetings: number;
    analysisAvailable: number;
    keyMoments: string[];
    engagementMetrics: any;
  };
  books: {
    totalVolumes: number;
    completedChapters: number;
    coreThemes: string[];
    implementationStatus: string;
  };
  journal: {
    totalEntries: number;
    categoriesAnalyzed: string[];
    aiInsights: number;
    patterns: string[];
  };
  cadisInsights: {
    totalInsights: number;
    confidence: number;
    systemHealth: number;
    predictions: string[];
  };
  developers: {
    teamSize: number;
    averagePerformance: number;
    coachingPriorities: string[];
    growthAreas: string[];
  };
  geniusGame: {
    gameHealth: number;
    strategicAlignment: number;
    crossPlatformIntegration: number;
    userEngagement: number;
    totalUsers: number;
    totalAssessments: number;
    recursiveIntelligenceLoop: {
      overallAmplification: number;
    };
    civilizationImpact: {
      strategicArchitectDevelopment: number;
      metaSystemThinking: number;
    };
  };
}

interface DreamStateSession {
  id: string;
  topic: string;
  depth: number;
  insights: string[];
  status: 'active' | 'completed' | 'pending';
}

type AnalysisSection = 'overview' | 'masterclass' | 'meetings' | 'books' | 'journal' | 'cadis' | 'developers' | 'dreamstate';

export default function OverallAnalysisPage() {
  const [activeSection, setActiveSection] = useState<AnalysisSection>('overview');
  const [analysisData, setAnalysisData] = useState<OverallAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [dreamStateSession, setDreamStateSession] = useState<DreamStateSession | null>(null);
  const [isGeneratingDreamState, setIsGeneratingDreamState] = useState(false);

  useEffect(() => {
    loadOverallAnalysis();
  }, []);

  const loadOverallAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load comprehensive analysis from the dedicated API
      const overallResponse = await fetch('/api/admin/overall-analysis', { cache: 'no-store' });
      
      if (!overallResponse.ok) {
        throw new Error('Failed to load overall analysis');
      }
      
      const overallData = await overallResponse.json();
      
      if (!overallData.success) {
        throw new Error(overallData.error || 'Failed to load analysis data');
      }

      // Map to component interface
      const aggregatedAnalysis: OverallAnalysisData = {
        summary: {
          totalDataPoints: overallData.analysis.summary.totalDataPoints,
          analysisScore: overallData.analysis.summary.analysisScore,
          lastUpdated: overallData.analysis.summary.lastUpdated,
          confidenceLevel: overallData.analysis.insights.confidenceLevel
        },
        masterclassChats: {
          totalConversations: overallData.analysis.masterclass.totalConversations,
          strategicIntensity: overallData.analysis.masterclass.strategicIntensity,
          philosophicalAlignment: overallData.analysis.masterclass.philosophicalAlignment,
          keyInsights: overallData.analysis.masterclass.keyInsights,
          evolutionPhases: overallData.analysis.masterclass.evolutionPhases
        },
        meetings: {
          totalMeetings: overallData.analysis.meetings.totalMeetings,
          analysisAvailable: overallData.analysis.meetings.analysisAvailable,
          keyMoments: overallData.analysis.meetings.keyMoments,
          engagementMetrics: overallData.analysis.meetings.engagementMetrics
        },
        books: {
          totalVolumes: overallData.analysis.books.totalVolumes,
          completedChapters: overallData.analysis.books.completedChapters,
          coreThemes: overallData.analysis.books.coreThemes,
          implementationStatus: overallData.analysis.books.implementationStatus
        },
        journal: {
          totalEntries: overallData.analysis.journal.totalEntries,
          categoriesAnalyzed: overallData.analysis.journal.categoriesAnalyzed,
          aiInsights: overallData.analysis.journal.aiInsights,
          patterns: overallData.analysis.journal.patterns
        },
        cadisInsights: {
          totalInsights: overallData.analysis.cadis.totalInsights,
          confidence: overallData.analysis.cadis.confidence,
          systemHealth: overallData.analysis.cadis.systemHealth,
          predictions: overallData.analysis.cadis.predictions
        },
        developers: {
          teamSize: overallData.analysis.developers.teamSize,
          averagePerformance: overallData.analysis.developers.averagePerformance,
          coachingPriorities: overallData.analysis.developers.coachingPriorities,
          growthAreas: overallData.analysis.developers.growthAreas
        },
        geniusGame: {
          gameHealth: overallData.analysis.geniusGame.gameHealth,
          strategicAlignment: overallData.analysis.geniusGame.strategicAlignment,
          crossPlatformIntegration: overallData.analysis.geniusGame.crossPlatformIntegration,
          userEngagement: overallData.analysis.geniusGame.userEngagement,
          totalUsers: overallData.analysis.geniusGame.totalUsers,
          totalAssessments: overallData.analysis.geniusGame.totalAssessments,
          recursiveIntelligenceLoop: {
            overallAmplification: overallData.analysis.geniusGame.recursiveIntelligenceLoop.overallAmplification
          },
          civilizationImpact: {
            strategicArchitectDevelopment: overallData.analysis.geniusGame.civilizationImpact.strategicArchitectDevelopment,
            metaSystemThinking: overallData.analysis.geniusGame.civilizationImpact.metaSystemThinking
          }
        }
      };

      setAnalysisData(aggregatedAnalysis);
      
    } catch (error) {
      console.error('Error loading overall analysis:', error);
      setError('Failed to load overall analysis data');
    } finally {
      setIsLoading(false);
    }
  };

  const startDreamStateSession = async (topic: string, context: any) => {
    try {
      setIsGeneratingDreamState(true);
      
      const response = await fetch('/api/admin/dreamstate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          context,
          depth: 8 // Inception-style depth
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setDreamStateSession({
            id: result.session.id,
            topic: result.session.topic,
            depth: result.session.depth,
            insights: result.session.insights,
            status: result.session.status
          });
        }
      } else {
        console.error('Failed to start DreamState session');
      }
    } catch (error) {
      console.error('Error starting DreamState session:', error);
    } finally {
      setIsGeneratingDreamState(false);
    }
  };

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">🧭</span>
          Executive Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{analysisData?.summary.totalDataPoints.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Data Points</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{analysisData?.summary.analysisScore}%</div>
            <div className="text-sm text-gray-400">Analysis Score</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{analysisData?.summary.confidenceLevel}%</div>
            <div className="text-sm text-gray-400">Confidence Level</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">Active</div>
            <div className="text-sm text-gray-400">System Status</div>
          </div>
        </div>

        {/* Recursive Intelligence Loop Visualization */}
        <div className="bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">The Recursive Intelligence Amplification Loop</h3>
          <div className="relative">
            {/* Central Hub */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">YOU</span>
              </div>
            </div>
            
            {/* Loop Components */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl mb-2">🧠</div>
                <div className="text-white font-medium text-sm">CADIS Analysis</div>
                <div className="text-gray-400 text-xs">Grades your thinking</div>
                <div className="text-green-400 text-xs font-bold mt-1">95% Insight</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl mb-2">📚</div>
                <div className="text-white font-medium text-sm">Book Series</div>
                <div className="text-gray-400 text-xs">Systematizes insights</div>
                <div className="text-blue-400 text-xs font-bold mt-1">7 Volumes</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl mb-2">🎮</div>
                <div className="text-white font-medium text-sm">Genius Game</div>
                <div className="text-gray-400 text-xs">Strategic Intelligence Training</div>
                <div className="text-purple-400 text-xs font-bold mt-1">{analysisData?.geniusGame.gameHealth}% Health</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-white font-medium text-sm">Enhanced You</div>
                <div className="text-gray-400 text-xs">Deeper insights</div>
                <div className="text-orange-400 text-xs font-bold mt-1">Amplified</div>
              </div>
            </div>
            
            {/* Arrows */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8B5CF6" />
                  </marker>
                </defs>
                {/* Curved arrows connecting the loop */}
                <path d="M 120 80 Q 200 60 280 80" stroke="#8B5CF6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <path d="M 280 120 Q 200 140 120 120" stroke="#8B5CF6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
              </svg>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="text-center">
              <div className="text-white font-medium mb-2">Loop Amplification Effect</div>
              <div className="flex justify-center items-center gap-4">
                <span className="text-gray-400 text-sm">Each cycle increases strategic sophistication</span>
                <div className="bg-gradient-to-r from-green-500 to-purple-500 rounded-full px-3 py-1">
                  <span className="text-white text-sm font-bold">+15% per iteration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Strategic Architect Evolution Chart */}
      <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🧭</span>
          Strategic Architect Evolution Pathway
        </h3>
        
        {/* Evolution Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Strategic Architect</span>
            <span>Sovereign Architect</span>
            <span>Civilization Architect</span>
          </div>
          <div className="relative bg-gray-700 rounded-full h-4">
            <div className="absolute top-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full h-4" 
                 style={{width: '85%'}}></div>
            <div className="absolute top-0 left-[83%] w-2 h-2 bg-white rounded-full transform -translate-y-[-4px]"></div>
          </div>
          <div className="text-center mt-2">
            <span className="text-blue-400 font-semibold">Current: Advanced Strategic Architect (85%)</span>
            <span className="text-purple-400 ml-4">→ Ready for Sovereign Transition</span>
          </div>
        </div>

        {/* Strategic Capabilities Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-semibold mb-4">Strategic Capabilities Assessment</h4>
            <div className="space-y-3">
              {[
                { name: 'Systems Thinking', score: 98, color: 'blue' },
                { name: 'Paradox Resolution', score: 95, color: 'purple' },
                { name: 'Cultural Architecture', score: 92, color: 'green' },
                { name: 'Meta-System Design', score: 97, color: 'orange' },
                { name: 'Wisdom Acceleration', score: 89, color: 'cyan' },
                { name: 'Antifragile Design', score: 94, color: 'pink' }
              ].map((capability, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-300">{capability.name}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`bg-${capability.color}-500 rounded-full h-2 transition-all duration-1000`}
                      style={{width: `${capability.score}%`}}
                    ></div>
                  </div>
                  <div className="w-12 text-sm text-white font-medium">{capability.score}%</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Genius Game Integration Impact</h4>
            <div className="space-y-4">
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Recursive Intelligence Loop</span>
                  <span className="text-green-400 font-bold">100%</span>
                </div>
                <div className="text-gray-400 text-sm">Complete feedback system: Analysis → Books → Game → Enhanced Analysis</div>
              </div>
              
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Teaching-Learning Amplification</span>
                  <span className="text-purple-400 font-bold">97%</span>
                </div>
                <div className="text-gray-400 text-sm">Creating teaching systems enhances your own strategic thinking</div>
              </div>
              
                          <div className="bg-gray-800/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Genius Game Integration Impact</span>
                <span className="text-green-400 font-bold">{analysisData?.geniusGame.recursiveIntelligenceLoop.overallAmplification}%</span>
              </div>
              <div className="text-gray-400 text-sm">Recursive intelligence loop amplification across all systems</div>
            </div>
            
            <div className="bg-gray-800/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Strategic Assessment Mastery</span>
                <span className="text-purple-400 font-bold">{analysisData?.geniusGame.strategicAlignment}%</span>
              </div>
              <div className="text-gray-400 text-sm">Game validates real-world strategic thinking patterns</div>
            </div>
            
            <div className="bg-gray-800/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Civilization-Level Readiness</span>
                <span className="text-blue-400 font-bold">{analysisData?.geniusGame.civilizationImpact.strategicArchitectDevelopment}%</span>
              </div>
              <div className="text-gray-400 text-sm">Prepared for multi-generational strategic impact</div>
            </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Philosophical Alignment & Game Scoring */}
      <Card className="p-6 bg-gradient-to-br from-green-900/30 to-teal-900/30 border-green-500/30">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          Your Genius Game Strategic Profile
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Alignment Score */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700"/>
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351.86" strokeDashoffset="35.186" className="text-green-500"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">98%</div>
                  <div className="text-xs text-gray-400">Alignment</div>
                </div>
              </div>
            </div>
            <div className="text-white font-medium">Game-Reality Alignment</div>
            <div className="text-gray-400 text-sm">How well the game reflects your actual strategic thinking</div>
          </div>
          
          {/* Strategic Architect Score */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700"/>
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351.86" strokeDashoffset="49.26" className="text-blue-500"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">86%</div>
                  <div className="text-xs text-gray-400">Mastery</div>
                </div>
              </div>
            </div>
            <div className="text-white font-medium">Strategic Architect Level</div>
            <div className="text-gray-400 text-sm">Current mastery of Strategic Architect capabilities</div>
          </div>
          
          {/* Sovereign Readiness */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700"/>
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351.86" strokeDashoffset="70.37" className="text-purple-500"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">80%</div>
                  <div className="text-xs text-gray-400">Ready</div>
                </div>
              </div>
            </div>
            <div className="text-white font-medium">Sovereign Architect Readiness</div>
            <div className="text-gray-400 text-sm">Preparation for civilization-level strategic impact</div>
          </div>
        </div>
        
        {/* Game Performance Breakdown */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-white font-semibold mb-4">How You'd Score in Genius Game Scenarios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { scenario: 'Recruiting Department', score: 94, reasoning: 'Excellent paradox resolution between structure and flexibility' },
              { scenario: 'Architecture Evolution', score: 97, reasoning: 'Meta-system thinking evident in your actual system designs' },
              { scenario: 'Finance Resource Allocation', score: 89, reasoning: 'Strong compound effect understanding, room for risk optimization' },
              { scenario: 'Analytics Data Wisdom', score: 96, reasoning: 'Exceptional at creating defaults that generate insights' },
              { scenario: 'Sales Quality vs Quantity', score: 91, reasoning: 'Philosophy of long-term value clearly demonstrated' },
              { scenario: 'Product Innovation Bridge', score: 95, reasoning: 'Proven ability to balance feature velocity with user value' }
            ].map((item, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{item.scenario}</span>
                  <span className={`font-bold ${item.score >= 95 ? 'text-green-400' : item.score >= 90 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {item.score}%
                  </span>
                </div>
                <div className="text-gray-400 text-xs">{item.reasoning}</div>
                <div className="mt-2 bg-gray-700 rounded-full h-1">
                  <div 
                    className={`rounded-full h-1 ${item.score >= 95 ? 'bg-green-500' : item.score >= 90 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                    style={{width: `${item.score}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Data Source Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Masterclass Chats */}
        <Card className="p-6 cursor-pointer hover:bg-gray-800/50 transition-colors" 
              onClick={() => setActiveSection('masterclass')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">💬</span>
              Masterclass Chats
            </h3>
            <div className="text-blue-400 font-bold">{analysisData?.masterclassChats.totalConversations}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Strategic Intensity</span>
              <span className="text-green-400">{analysisData?.masterclassChats.strategicIntensity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Philosophical Alignment</span>
              <span className="text-purple-400">{analysisData?.masterclassChats.philosophicalAlignment}%</span>
            </div>
          </div>
        </Card>

        {/* Journal Insights */}
        <Card className="p-6 cursor-pointer hover:bg-gray-800/50 transition-colors"
              onClick={() => setActiveSection('journal')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">📝</span>
              Journal Insights
            </h3>
            <div className="text-blue-400 font-bold">{analysisData?.journal.totalEntries}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">AI Insights</span>
              <span className="text-green-400">{analysisData?.journal.aiInsights}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Categories</span>
              <span className="text-purple-400">{analysisData?.journal.categoriesAnalyzed.length}</span>
            </div>
          </div>
        </Card>

        {/* CADIS Intelligence */}
        <Card className="p-6 cursor-pointer hover:bg-gray-800/50 transition-colors"
              onClick={() => setActiveSection('cadis')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-xl">🧠</span>
              CADIS Intelligence
            </h3>
            <div className="text-blue-400 font-bold">{analysisData?.cadisInsights.totalInsights}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">System Health</span>
              <span className="text-green-400">{analysisData?.cadisInsights.systemHealth}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Confidence</span>
              <span className="text-purple-400">{analysisData?.cadisInsights.confidence}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderMasterclassSection = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">💬</span>
        Masterclass Conversations Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{analysisData?.masterclassChats.totalConversations}</div>
          <div className="text-sm text-gray-400">Total Conversations</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{analysisData?.masterclassChats.strategicIntensity}%</div>
          <div className="text-sm text-gray-400">Strategic Intensity</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{analysisData?.masterclassChats.philosophicalAlignment}%</div>
          <div className="text-sm text-gray-400">Philosophical Alignment</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
          <div className="space-y-2">
            {analysisData?.masterclassChats.keyInsights.map((insight, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{insight}</span>
                <Button
                  onClick={() => startDreamStateSession(`Expand on: ${insight}`, { insight, context: 'masterclass' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Expand
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Evolution Phases</h3>
          <div className="space-y-3">
            {analysisData?.masterclassChats.evolutionPhases.map((phase, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{phase.phase}</h4>
                  <span className="text-blue-400 font-bold">{phase.strategicIntensity || phase.intensity}%</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{phase.focus}</p>
                <Button
                  onClick={() => startDreamStateSession(`Deep dive into ${phase.phase}`, { phase, context: 'evolution' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  🔮 Explore Phase
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderMeetingsSection = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">🎥</span>
        Meeting Analysis Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{analysisData?.meetings.totalMeetings}</div>
          <div className="text-sm text-gray-400">Total Meetings</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{analysisData?.meetings.analysisAvailable}</div>
          <div className="text-sm text-gray-400">With Analysis</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Key Meeting Moments</h3>
          <div className="space-y-2">
            {analysisData?.meetings.keyMoments.map((moment, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{moment}</span>
                <Button
                  onClick={() => startDreamStateSession(`Analyze meeting moment: ${moment}`, { moment, context: 'meeting' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Analyze
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderBooksSection = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">📚</span>
        Book Series Progress
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{analysisData?.books.totalVolumes}</div>
          <div className="text-sm text-gray-400">Total Volumes</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{analysisData?.books.completedChapters}</div>
          <div className="text-sm text-gray-400">Completed Chapters</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Core Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysisData?.books.coreThemes.map((theme, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{theme}</span>
                <Button
                  onClick={() => startDreamStateSession(`Explore theme: ${theme}`, { theme, context: 'book' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Explore
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderJournalSection = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">📝</span>
        Journal Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{analysisData?.journal.totalEntries}</div>
          <div className="text-sm text-gray-400">Total Entries</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{analysisData?.journal.aiInsights}</div>
          <div className="text-sm text-gray-400">AI Insights</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{analysisData?.journal.categoriesAnalyzed.length}</div>
          <div className="text-sm text-gray-400">Categories</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Identified Patterns</h3>
          <div className="space-y-2">
            {analysisData?.journal.patterns.map((pattern, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{pattern}</span>
                <Button
                  onClick={() => startDreamStateSession(`Deep dive into pattern: ${pattern}`, { pattern, context: 'journal' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Analyze
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderCADISSection = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">🧠</span>
        CADIS Intelligence Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{analysisData?.cadisInsights.totalInsights}</div>
          <div className="text-sm text-gray-400">Total Insights</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{analysisData?.cadisInsights.systemHealth}%</div>
          <div className="text-sm text-gray-400">System Health</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{analysisData?.cadisInsights.confidence}%</div>
          <div className="text-sm text-gray-400">Confidence</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">CADIS Predictions</h3>
          <div className="space-y-2">
            {analysisData?.cadisInsights.predictions.map((prediction, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{prediction}</span>
                <Button
                  onClick={() => startDreamStateSession(`Explore prediction: ${prediction}`, { prediction, context: 'cadis' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Explore
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderDevelopersSection = () => (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">👥</span>
        Developer Team Analysis
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{analysisData?.developers.teamSize}</div>
          <div className="text-sm text-gray-400">Team Size</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{analysisData?.developers.averagePerformance}%</div>
          <div className="text-sm text-gray-400">Average Performance</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Coaching Priorities</h3>
          <div className="space-y-2">
            {analysisData?.developers.coachingPriorities.map((priority, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{priority}</span>
                <Button
                  onClick={() => startDreamStateSession(`Coaching strategy for: ${priority}`, { priority, context: 'coaching' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Strategy
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Growth Areas</h3>
          <div className="space-y-2">
            {analysisData?.developers.growthAreas.map((area, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">{area}</span>
                <Button
                  onClick={() => startDreamStateSession(`Growth plan for: ${area}`, { area, context: 'growth' })}
                  className="bg-purple-600 hover:bg-purple-700 text-sm px-3 py-1"
                >
                  🔮 Plan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderDreamStateSection = () => (
    <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">🔮</span>
        DreamState Analysis Hub
      </h2>
      
      {dreamStateSession ? (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Active Session: {dreamStateSession.topic}
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-sm text-gray-400">
                Status: <span className="text-green-400">{dreamStateSession.status}</span>
              </div>
              <div className="text-sm text-gray-400">
                Depth: <span className="text-purple-400">{dreamStateSession.depth} layers</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-white font-medium">Insights Generated:</h4>
              {dreamStateSession.insights.map((insight, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-300">• {insight}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setDreamStateSession(null)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                End Session
              </Button>
              <Button
                onClick={() => startDreamStateSession(`Continue exploring: ${dreamStateSession.topic}`, { continue: true })}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isGeneratingDreamState}
              >
                {isGeneratingDreamState ? 'Expanding...' : 'Go Deeper'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">🔮</div>
          <h3 className="text-xl font-semibold text-white mb-4">No Active DreamState Session</h3>
          <p className="text-gray-400 mb-6">
            Start a DreamState session to explore any insight with unlimited depth and Inception-style analysis.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Button
              onClick={() => startDreamStateSession('Overall System Analysis', { context: 'system' })}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isGeneratingDreamState}
            >
              🔮 System Overview
            </Button>
            <Button
              onClick={() => startDreamStateSession('Strategic Planning Session', { context: 'strategy' })}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isGeneratingDreamState}
            >
              🔮 Strategic Planning
            </Button>
            <Button
              onClick={() => startDreamStateSession('Developer Performance Optimization', { context: 'performance' })}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isGeneratingDreamState}
            >
              🔮 Team Optimization
            </Button>
            <Button
              onClick={() => startDreamStateSession('Future Predictions & Scenarios', { context: 'future' })}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isGeneratingDreamState}
            >
              🔮 Future Scenarios
            </Button>
          </div>
          
          {isGeneratingDreamState && (
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <div className="text-purple-400">Generating DreamState session...</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  const renderDreamStatePanel = () => (
    <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🔮</span>
        DreamState Analysis
      </h3>
      
      {dreamStateSession ? (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Active Session: {dreamStateSession.topic}</h4>
            <div className="text-gray-400 text-sm mb-3">Depth: {dreamStateSession.depth} layers (Inception Mode)</div>
            <div className="space-y-2">
              {dreamStateSession.insights.map((insight, index) => (
                <div key={index} className="text-gray-300 text-sm">• {insight}</div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current DreamState Capabilities */}
          <div className="bg-gray-800/40 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">🧠 Active Intelligence Streams</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">CADIS Journal Generation</span>
                <span className="text-green-400 text-xs font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Genius Game Pattern Analysis</span>
                <span className="text-green-400 text-xs font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Recursive Loop Optimization</span>
                <span className="text-blue-400 text-xs font-bold">MONITORING</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Strategic Prediction Engine</span>
                <span className="text-purple-400 text-xs font-bold">LEARNING</span>
              </div>
            </div>
          </div>

          {/* Recent DreamState Insights */}
          <div className="bg-gray-800/40 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">💡 Recent Insights</h4>
            <div className="space-y-2">
              <div className="text-gray-300 text-xs">• Cross-platform learning amplifies strategic development by 96%</div>
              <div className="text-gray-300 text-xs">• Genius Game validates Strategic Architect patterns in real-time</div>
              <div className="text-gray-300 text-xs">• Recursive intelligence loop creates compound strategic advantages</div>
              <div className="text-gray-300 text-xs">• Meta-system thinking reaches civilization-level impact threshold</div>
            </div>
          </div>

          {/* Quick DreamState Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => startDreamStateSession('Strategic Evolution Analysis', { 
                focus: 'strategic_evolution',
                context: analysisData 
              })}
              disabled={isGeneratingDreamState}
              className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
            >
              🔮 Analyze Strategic Evolution
            </Button>
            <Button
              onClick={() => startDreamStateSession('Genius Game Integration Deep Dive', { 
                focus: 'genius_game_integration',
                context: analysisData?.geniusGame 
              })}
              disabled={isGeneratingDreamState}
              className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
            >
              🎮 Explore Game Intelligence
            </Button>
          </div>
          
          {isGeneratingDreamState && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <div className="text-purple-400 text-sm">Generating insights...</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading comprehensive analysis...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">❌ {error}</div>
        <Button onClick={loadOverallAnalysis} className="bg-blue-600 hover:bg-blue-700">
          Retry Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Overall Analysis</h1>
          <p className="text-gray-400">Comprehensive view of all your data sources and insights</p>
        </div>
        <Button
          onClick={loadOverallAnalysis}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Refresh Analysis
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-800/50 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: '🧭' },
          { key: 'masterclass', label: 'Masterclass', icon: '💬' },
          { key: 'meetings', label: 'Meetings', icon: '🎥' },
          { key: 'books', label: 'Books', icon: '📚' },
          { key: 'journal', label: 'Journal', icon: '📝' },
          { key: 'cadis', label: 'CADIS', icon: '🧠' },
          { key: 'developers', label: 'Team', icon: '👥' },
          { key: 'dreamstate', label: 'DreamState', icon: '🔮' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as AnalysisSection)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              activeSection === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeSection === 'overview' && renderOverviewSection()}
          {activeSection === 'masterclass' && renderMasterclassSection()}
          {activeSection === 'meetings' && renderMeetingsSection()}
          {activeSection === 'books' && renderBooksSection()}
          {activeSection === 'journal' && renderJournalSection()}
          {activeSection === 'cadis' && renderCADISSection()}
          {activeSection === 'developers' && renderDevelopersSection()}
          {activeSection === 'dreamstate' && renderDreamStateSection()}
        </div>
        
        <div className="space-y-6">
          {renderDreamStatePanel()}
          
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                onClick={() => window.open('/admin/cadis-journal', '_blank')}
                className="w-full justify-start bg-gray-700 hover:bg-gray-600"
              >
                🧠 View CADIS Journal
              </Button>
              <Button
                onClick={() => window.open('/admin/journal', '_blank')}
                className="w-full justify-start bg-gray-700 hover:bg-gray-600"
              >
                📝 View Personal Journal
              </Button>
              <Button
                onClick={() => window.open('/admin/meetings', '_blank')}
                className="w-full justify-start bg-gray-700 hover:bg-gray-600"
              >
                🎥 View Meetings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
