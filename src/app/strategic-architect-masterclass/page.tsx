'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  IconSearch, 
  IconDownload, 
  IconShare, 
  IconEye, 
  IconBrain,
  IconChartBar,
  IconTarget,
  IconBook,
  IconArrowRight,
  IconClock,
  IconMessageCircle,
  IconTrendingUp,
  IconFilter,
  IconX
} from '@tabler/icons-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ConversationSegment {
  id: string;
  speaker: 'User' | 'Cursor';
  content: string;
  timestamp: string;
  strategicPatterns: {
    directionGiving: number;
    systemThinking: number;
    qualityControl: number;
    iterativeRefinement: number;
    problemDiagnosis: number;
    metaAnalysis: number;
  };
  philosophicalAlignment: {
    execution: number;
    modularity: number;
    reusability: number;
    teachability: number;
    progressiveEnhancement: number;
  };
  alignmentScore: number;
  strategicScore: number;
  keyInsights: string[];
}

interface ConversationAnalysis {
  totalCharacters: number;
  totalExchanges: number;
  strategicRatio: number;
  philosophicalAlignment: number;
  keyMoments: string[];
  evolutionPhases: Array<{
    phase: string;
    focus: string;
    strategicIntensity: number;
  }>;
}

// Principle View Components
function ExecutionPrincipleView({ segments }: { segments: ConversationSegment[] }) {
  const executionSegments = segments.filter(segment => 
    segment.speaker === 'User' && 
    segment.content.toLowerCase().match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 mb-6">
        <h4 className="text-lg font-semibold text-green-300 mb-2">⚡ "If it needs to be done, do it" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {executionSegments.length} conversation moments showing immediate execution focus and decisive action-taking
        </p>
      </div>
      
      {executionSegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="green"
          principleKeywords={['proceed', 'implement', 'build', 'create', 'execute', 'make sure']}
        />
      ))}
    </div>
  );
}

function ModularityPrincipleView({ segments }: { segments: ConversationSegment[] }) {
  const modularitySegments = segments.filter(segment => 
    segment.speaker === 'User' && 
    segment.content.toLowerCase().match(/\b(modular|component|service|singleton|module|reusable|separate|individual)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 mb-6">
        <h4 className="text-lg font-semibold text-blue-300 mb-2">🧩 "Make it modular" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {modularitySegments.length} conversation moments emphasizing modular design, components, and separation of concerns
        </p>
      </div>
      
      {modularitySegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="blue"
          principleKeywords={['modular', 'component', 'service', 'singleton', 'module', 'separate']}
        />
      ))}
    </div>
  );
}

function ReusabilityPrincipleView({ segments }: { segments: ConversationSegment[] }) {
  const reusabilitySegments = segments.filter(segment => 
    segment.speaker === 'User' && 
    segment.content.toLowerCase().match(/\b(reusable|framework|pattern|template|systematic|scale|optimize|comprehensive)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 mb-6">
        <h4 className="text-lg font-semibold text-purple-300 mb-2">♻️ "Make it reusable" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {reusabilitySegments.length} conversation moments focusing on reusability, frameworks, and systematic approaches
        </p>
      </div>
      
      {reusabilitySegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="purple"
          principleKeywords={['reusable', 'framework', 'pattern', 'systematic', 'scale', 'comprehensive']}
        />
      ))}
    </div>
  );
}

function TeachabilityPrincipleView({ segments }: { segments: ConversationSegment[] }) {
  const teachabilitySegments = segments.filter(segment => 
    segment.speaker === 'User' && 
    segment.content.toLowerCase().match(/\b(document|explain|understand|framework|define|teach|learn|analyze|styles|difference)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 mb-6">
        <h4 className="text-lg font-semibold text-yellow-300 mb-2">📚 "Make it teachable" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {teachabilitySegments.length} conversation moments emphasizing documentation, understanding, and knowledge transfer
        </p>
      </div>
      
      {teachabilitySegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="yellow"
          principleKeywords={['document', 'explain', 'understand', 'define', 'analyze', 'styles']}
        />
      ))}
    </div>
  );
}

function StrategicPatternsView({ segments }: { segments: ConversationSegment[] }) {
  const strategicSegments = segments.filter(segment => 
    segment.speaker === 'User' && segment.strategicScore >= 70
  );

  return (
    <div className="space-y-4">
      <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20 mb-6">
        <h4 className="text-lg font-semibold text-indigo-300 mb-2">🧠 Strategic Patterns - High-Impact Moments</h4>
        <p className="text-gray-400 text-sm">
          {strategicSegments.length} conversation segments with 70+ strategic scores showing direction-giving, system thinking, and meta-analysis
        </p>
      </div>
      
      {strategicSegments.slice(0, 20).map((segment, index) => (
        <StrategicSegmentCard key={segment.id} segment={segment} />
      ))}
    </div>
  );
}

function AllSegmentsView({ 
  segments, 
  selectedSegment, 
  setSelectedSegment 
}: { 
  segments: ConversationSegment[];
  selectedSegment: string | null;
  setSelectedSegment: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-500/10 rounded-lg p-4 border border-gray-500/20 mb-6">
        <h4 className="text-lg font-semibold text-gray-300 mb-2">📖 Complete Conversation Archive</h4>
        <p className="text-gray-400 text-sm">
          All {segments.length} conversation segments in chronological order - full 1.83M character archive
        </p>
      </div>
      
      {segments.map((segment, index) => (
        <Card 
          key={segment.id} 
          className={`border-gray-700 hover:border-gray-600 transition-all ${
            selectedSegment === segment.id ? 'ring-2 ring-indigo-500/50' : ''
          }`}
        >
          <div className="space-y-4">
            {/* Segment Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                  segment.speaker === 'User' 
                    ? 'bg-indigo-500/20 border-2 border-indigo-500/30' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {segment.speaker === 'User' ? (
                    <img 
                      src="/profile-logo.png" 
                      alt="Juelz" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    '🤖'
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">{segment.speaker}</div>
                  <div className="text-xs text-gray-400">{segment.timestamp}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className={`text-sm font-medium ${segment.strategicScore >= 80 ? 'text-green-400' : segment.strategicScore >= 60 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {segment.strategicScore}/100 Strategic
                  </div>
                  <div className={`text-xs ${segment.alignmentScore >= 80 ? 'text-green-300' : 'text-gray-400'}`}>
                    {segment.alignmentScore}/100 Alignment
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSegment(
                    selectedSegment === segment.id ? null : segment.id
                  )}
                  className="text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <IconEye size={20} />
                </button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-300 text-sm leading-relaxed">
                {segment.content.length > 200 
                  ? `${segment.content.substring(0, 200)}...` 
                  : segment.content
                }
              </div>
              
              {segment.content.length > 200 && (
                <button
                  onClick={() => setSelectedSegment(segment.id)}
                  className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 flex items-center gap-1"
                >
                  Read Full Segment <IconArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Expanded View */}
            {selectedSegment === segment.id && (
              <div className="border-t border-gray-700 pt-4 space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Full Content</h4>
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {segment.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Helper Components
function PrincipleSegmentCard({ 
  segment, 
  principleColor, 
  principleKeywords 
}: { 
  segment: ConversationSegment;
  principleColor: string;
  principleKeywords: string[];
}) {
  const colorClasses = {
    green: 'border-green-500/30 bg-green-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5'
  };

  const highlightKeywords = (text: string) => {
    let highlightedText = text;
    principleKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<mark class="bg-${principleColor}-500/30 text-${principleColor}-300 px-1 rounded">$1</mark>`);
    });
    return highlightedText;
  };

  return (
    <Card className={colorClasses[principleColor as keyof typeof colorClasses]}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
              <img 
                src="/profile-logo.png" 
                alt="Juelz" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{segment.timestamp}</div>
              <div className="text-xs text-gray-400">Strategic Score: {segment.strategicScore}/100</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div 
            className="text-gray-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: highlightKeywords(segment.content.substring(0, 300) + (segment.content.length > 300 ? '...' : ''))
            }}
          />
        </div>

        {segment.keyInsights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {segment.keyInsights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className={`text-xs bg-${principleColor}-500/20 text-${principleColor}-300 px-2 py-1 rounded`}>
                {insight}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function StrategicSegmentCard({ segment }: { segment: ConversationSegment }) {
  return (
    <Card className="border-indigo-500/30 bg-indigo-500/5">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
              <img 
                src="/profile-logo.png" 
                alt="Juelz" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{segment.timestamp}</div>
              <div className="text-xs text-indigo-400">Strategic Score: {segment.strategicScore}/100</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-green-400">{segment.alignmentScore}/100</div>
            <div className="text-xs text-green-300">Alignment</div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-gray-300 text-sm leading-relaxed">
            {segment.content.substring(0, 300)}{segment.content.length > 300 ? '...' : ''}
          </div>
        </div>

        {/* Strategic Patterns */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-indigo-500/20 rounded p-2 text-center">
            <div className="text-indigo-300 font-medium">Direction</div>
            <div className="text-gray-400">{segment.strategicPatterns.directionGiving}</div>
          </div>
          <div className="bg-blue-500/20 rounded p-2 text-center">
            <div className="text-blue-300 font-medium">System</div>
            <div className="text-gray-400">{segment.strategicPatterns.systemThinking}</div>
          </div>
          <div className="bg-green-500/20 rounded p-2 text-center">
            <div className="text-green-300 font-medium">Quality</div>
            <div className="text-gray-400">{segment.strategicPatterns.qualityControl}</div>
          </div>
        </div>

        {segment.keyInsights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {segment.keyInsights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                {insight}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function StrategicArchitectMasterclass() {
  const [conversationData, setConversationData] = useState<ConversationSegment[]>([]);
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('execution');
  const [showOnlyStrategic, setShowOnlyStrategic] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  useEffect(() => {
    loadConversationData();
  }, []);

  const loadConversationData = async () => {
    try {
      setLoading(true);
      
      // Fetch the conversation analysis data
      const response = await fetch('/api/strategic-architect-masterclass');
      
      if (response.ok) {
        const data = await response.json();
        setConversationData(data.segments || []);
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error loading conversation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSegments = useMemo(() => {
    let filtered = conversationData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(segment => 
        segment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        segment.keyInsights.some(insight => 
          insight.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Strategic filter
    if (showOnlyStrategic) {
      filtered = filtered.filter(segment => segment.strategicScore >= 70);
    }

    // Phase filter
    if (selectedPhase !== 'all') {
      const phaseIndex = analysis?.evolutionPhases.findIndex(p => p.phase === selectedPhase);
      if (phaseIndex !== undefined && phaseIndex >= 0) {
        const segmentsPerPhase = Math.floor(conversationData.length / (analysis?.evolutionPhases.length || 1));
        const startIndex = phaseIndex * segmentsPerPhase;
        const endIndex = startIndex + segmentsPerPhase;
        filtered = filtered.slice(startIndex, endIndex);
      }
    }

    return filtered;
  }, [conversationData, searchTerm, showOnlyStrategic, selectedPhase, analysis]);

  const getStrategicColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 95) return 'text-emerald-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Strategic Architect Masterclass...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <IconBrain size={40} className="text-indigo-400" />
            <h1 className="text-4xl font-bold text-white">
              Strategic Architect <span className="text-indigo-400">Masterclass</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-6">
            Real-time analysis of a 1.83M character conversation demonstrating Strategic Architect thinking, 
            execution-led refinement, and 98/100 philosophical alignment in action.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <IconClock size={16} />
              <span>Exported: August 18, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <IconMessageCircle size={16} />
              <span>{analysis?.totalExchanges || 0} exchanges</span>
            </div>
            <div className="flex items-center gap-2">
              <IconTrendingUp size={16} />
              <span>{analysis?.strategicRatio || 0}% strategic focus</span>
            </div>
          </div>
        </div>

        {/* Philosophical Alignment in Action */}
        {analysis && (
          <div className="mb-8 space-y-6">
            {/* Core Philosophy Demonstration */}
            <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-green-400 mb-2">
                  {analysis.philosophicalAlignment}/100
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Philosophical Alignment</h3>
                <p className="text-gray-300">Every principle consistently demonstrated across 1.9M characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-lg font-bold text-green-400">If it needs to be done, do it</div>
                  <div className="text-sm text-gray-400 mt-2">440 execution commands</div>
                  <div className="text-xs text-green-300 mt-1">"proceed", "implement", "build"</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                  <div className="text-3xl mb-2">🧩</div>
                  <div className="text-lg font-bold text-blue-400">Make it modular</div>
                  <div className="text-sm text-gray-400 mt-2">524 modular patterns</div>
                  <div className="text-xs text-blue-300 mt-1">"singleton", "service", "component"</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 text-center">
                  <div className="text-3xl mb-2">♻️</div>
                  <div className="text-lg font-bold text-purple-400">Make it reusable</div>
                  <div className="text-sm text-gray-400 mt-2">493 reusability focuses</div>
                  <div className="text-xs text-purple-300 mt-1">"framework", "systematic", "scale"</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-lg font-bold text-yellow-400">Make it teachable</div>
                  <div className="text-sm text-gray-400 mt-2">250 teaching moments</div>
                  <div className="text-xs text-yellow-300 mt-1">"document", "framework", "define"</div>
                </div>
              </div>
            </Card>

            {/* Strategic Architect Patterns in Action */}
            <Card className="border-indigo-500/30">
              <h3 className="text-2xl font-semibold text-indigo-300 mb-6 text-center">
                Strategic Architect Patterns in Action
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-bold text-indigo-300">Direction-Giving</div>
                      <div className="text-sm text-gray-400">652 instances</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "proceed and make sure that CADIS is using the developer information properly"
                  </div>
                </div>

                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🧠</div>
                    <div>
                      <div className="font-bold text-blue-300">System Thinking</div>
                      <div className="text-sm text-gray-400">2,894 instances</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "comprehensive developer intelligence... ecosystem analysis... CADIS integration"
                  </div>
                </div>

                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <div className="font-bold text-green-300">Quality Control</div>
                      <div className="text-sm text-gray-400">314 instances</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "verify", "confirm", "check", "proper", "should be doing as it should"
                  </div>
                </div>

                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🔄</div>
                    <div>
                      <div className="font-bold text-purple-300">Iterative Refinement</div>
                      <div className="text-sm text-gray-400">Real-time evolution</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "but should also be getting... what about... make sure it also..."
                  </div>
                </div>

                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🔧</div>
                    <div>
                      <div className="font-bold text-red-300">Problem Diagnosis</div>
                      <div className="text-sm text-gray-400">Deep investigation</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "why not...", "what is the real issue", "understand the gap", "optimize"
                  </div>
                </div>

                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🎭</div>
                    <div>
                      <div className="font-bold text-yellow-300">Meta-Analysis</div>
                      <div className="text-sm text-gray-400">217 instances</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "analyze our current conversation", "define the styles", "framework creation"
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20 text-center">
                <div className="text-lg font-semibold text-indigo-300 mb-2">
                  66% Strategic Focus vs 34% Technical Implementation
                </div>
                <div className="text-sm text-gray-400">
                  Perfect balance: Strategic leadership with hands-on execution capability
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Key Strategic Moments */}
        <Card className="mb-8 border-amber-500/30">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-amber-300 mb-2">
              Key Strategic Moments
            </h3>
            <p className="text-gray-400">
              Witness execution-led refinement in action - no search required
            </p>
          </div>

          {/* Curated Key Moments */}
          <div className="space-y-4">
            {/* Moment 1: Initial Strategic Direction */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-lg p-6 border border-indigo-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
                    <img 
                      src="/profile-logo.png" 
                      alt="Juelz" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">Strategic Direction</div>
                    <div className="text-xs text-gray-400">Opening Command</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-400">95/100 Strategic</div>
                  <div className="text-xs text-green-300">Perfect execution focus</div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="text-gray-300 text-sm leading-relaxed">
                  <strong className="text-indigo-400">"proceed and make sure that CADIS is using the developer information in the database properly.. we recently ran script confirming how the data was. proceed with that. and confirm it is doing as it should in regards to insights about developers and what they are creating, their efficiencies, if they are following my principles and whatever else data we can get on them based on my setup. proceed."</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-indigo-500/20 rounded p-2 text-center">
                  <div className="text-indigo-300 font-medium">Direction-Giving</div>
                  <div className="text-gray-400">5 commands</div>
                </div>
                <div className="bg-blue-500/20 rounded p-2 text-center">
                  <div className="text-blue-300 font-medium">Quality Control</div>
                  <div className="text-gray-400">"confirm", "proper"</div>
                </div>
                <div className="bg-green-500/20 rounded p-2 text-center">
                  <div className="text-green-300 font-medium">System Focus</div>
                  <div className="text-gray-400">CADIS ecosystem</div>
                </div>
              </div>
            </div>

            {/* Moment 2: Iterative Refinement */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center overflow-hidden">
                    <img 
                      src="/profile-logo.png" 
                      alt="Juelz" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">Iterative Refinement</div>
                    <div className="text-xs text-gray-400">Scope Expansion</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-400">88/100 Strategic</div>
                  <div className="text-xs text-green-300">Perfect refinement pattern</div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="text-gray-300 text-sm leading-relaxed">
                  <strong className="text-purple-400">"yes.. the info it got is cool but should also be getting individual developer (active) info and them as an individual.. proceed."</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-purple-500/20 rounded p-2 text-center">
                  <div className="text-purple-300 font-medium">Refinement</div>
                  <div className="text-gray-400">"but should also"</div>
                </div>
                <div className="bg-pink-500/20 rounded p-2 text-center">
                  <div className="text-pink-300 font-medium">Individual Focus</div>
                  <div className="text-gray-400">Developer-specific</div>
                </div>
                <div className="bg-red-500/20 rounded p-2 text-center">
                  <div className="text-red-300 font-medium">Action Command</div>
                  <div className="text-gray-400">"proceed"</div>
                </div>
              </div>
            </div>

            {/* Moment 3: Meta-Analysis */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 flex items-center justify-center overflow-hidden">
                    <img 
                      src="/profile-logo.png" 
                      alt="Juelz" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">Meta-Analysis</div>
                    <div className="text-xs text-gray-400">Framework Creation</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-400">100/100 Strategic</div>
                  <div className="text-xs text-green-300">Perfect meta-cognitive</div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="text-gray-300 text-sm leading-relaxed">
                  <strong className="text-yellow-400">"what about guiding and directing.. ? are any using the ai like, i am conversating with you here.. analyze our current conversation. anyone using and developing like i am.. lets make a md and define the styles so can understand difference (so CADIS can as well)"</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-yellow-500/20 rounded p-2 text-center">
                  <div className="text-yellow-300 font-medium">Meta-Analysis</div>
                  <div className="text-gray-400">"analyze our conversation"</div>
                </div>
                <div className="bg-orange-500/20 rounded p-2 text-center">
                  <div className="text-orange-300 font-medium">Framework Creation</div>
                  <div className="text-gray-400">"define the styles"</div>
                </div>
                <div className="bg-red-500/20 rounded p-2 text-center">
                  <div className="text-red-300 font-medium">System Enhancement</div>
                  <div className="text-gray-400">"so CADIS can as well"</div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Exploration */}
          <div className="mt-8 text-center">
            <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm mb-3">
                Want to explore the full conversation? Advanced search and filtering available below.
              </p>
              <button
                onClick={() => {
                  const advancedSection = document.getElementById('advanced-exploration');
                  advancedSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2 mx-auto"
              >
                <IconArrowRight size={16} />
                Explore Full Conversation Archive
              </button>
            </div>
          </div>
        </Card>

        {/* Advanced Exploration Section */}
        <div id="advanced-exploration" className="mb-8">
          <Card className="border-gray-600">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Advanced Conversation Exploration
              </h3>
              <p className="text-gray-400 text-sm">
                Search, filter, and analyze specific patterns across all 78 conversation segments
              </p>
            </div>

            {/* Advanced Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversation content, patterns, or insights..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Phases</option>
                  {analysis?.evolutionPhases.map(phase => (
                    <option key={phase.phase} value={phase.phase}>{phase.phase}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowOnlyStrategic(!showOnlyStrategic)}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    showOnlyStrategic 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-indigo-500'
                  }`}
                >
                  <IconFilter size={16} className="inline mr-2" />
                  Strategic Only
                </button>
              </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-400">
                Showing {filteredSegments.length} of {conversationData.length} conversation segments
              </div>
              {(searchTerm || selectedPhase !== 'all' || showOnlyStrategic) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedPhase('all');
                    setShowOnlyStrategic(false);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm"
                >
                  <IconX size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Principle-Based Conversation Tabs */}
        <Card className="mb-8 border-indigo-500/30">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-indigo-300 mb-2">
              Philosophical Alignment by Principle
            </h3>
            <p className="text-gray-400">
              Explore conversation segments organized by your core principles - see alignment in real-time
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 border-b border-gray-700 pb-4">
            <button
              onClick={() => setSelectedPhase('execution')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPhase === 'execution'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'text-gray-400 hover:text-green-300 hover:bg-green-500/10'
              }`}
            >
              <span className="mr-2">⚡</span>
              If it needs to be done, do it
              <span className="ml-2 text-xs bg-green-500/20 px-2 py-1 rounded">440</span>
            </button>
            <button
              onClick={() => setSelectedPhase('modularity')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPhase === 'modularity'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-blue-300 hover:bg-blue-500/10'
              }`}
            >
              <span className="mr-2">🧩</span>
              Make it modular
              <span className="ml-2 text-xs bg-blue-500/20 px-2 py-1 rounded">524</span>
            </button>
            <button
              onClick={() => setSelectedPhase('reusability')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPhase === 'reusability'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              <span className="mr-2">♻️</span>
              Make it reusable
              <span className="ml-2 text-xs bg-purple-500/20 px-2 py-1 rounded">493</span>
            </button>
            <button
              onClick={() => setSelectedPhase('teachability')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPhase === 'teachability'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-500/10'
              }`}
            >
              <span className="mr-2">📚</span>
              Make it teachable
              <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-1 rounded">250</span>
            </button>
            <button
              onClick={() => setSelectedPhase('strategic-patterns')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPhase === 'strategic-patterns'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              <span className="mr-2">🧠</span>
              Strategic Patterns
              <span className="ml-2 text-xs bg-indigo-500/20 px-2 py-1 rounded">4,077</span>
            </button>
            <button
              onClick={() => setSelectedPhase('all-segments')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPhase === 'all-segments'
                  ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/10'
              }`}
            >
              <span className="mr-2">📖</span>
              All Segments
              <span className="ml-2 text-xs bg-gray-500/20 px-2 py-1 rounded">{conversationData.length}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {selectedPhase === 'execution' && (
              <ExecutionPrincipleView segments={conversationData} />
            )}
            {selectedPhase === 'modularity' && (
              <ModularityPrincipleView segments={conversationData} />
            )}
            {selectedPhase === 'reusability' && (
              <ReusabilityPrincipleView segments={conversationData} />
            )}
            {selectedPhase === 'teachability' && (
              <TeachabilityPrincipleView segments={conversationData} />
            )}
            {selectedPhase === 'strategic-patterns' && (
              <StrategicPatternsView segments={conversationData} />
            )}
            {selectedPhase === 'all-segments' && (
              <AllSegmentsView segments={conversationData} selectedSegment={selectedSegment} setSelectedSegment={setSelectedSegment} />
            )}
          </div>
        </Card>

        {/* Legacy Filtered Segments (hidden) */}
        <div className="space-y-6 hidden">
          {filteredSegments.slice(0, 10).map((segment, index) => (
            <Card 
              key={segment.id} 
              className={`border-gray-700 hover:border-gray-600 transition-all ${
                selectedSegment === segment.id ? 'ring-2 ring-indigo-500/50' : ''
              }`}
            >
              <div className="space-y-4">
                {/* Segment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      segment.speaker === 'User' 
                        ? 'bg-indigo-500/20 text-indigo-400' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {segment.speaker === 'User' ? '👤' : '🤖'}
                    </div>
                    <div>
                      <div className="font-medium text-white">{segment.speaker}</div>
                      <div className="text-xs text-gray-400">{segment.timestamp}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStrategicColor(segment.strategicScore)}`}>
                        {segment.strategicScore}/100 Strategic
                      </div>
                      <div className={`text-xs ${getAlignmentColor(segment.alignmentScore)}`}>
                        {segment.alignmentScore}/100 Alignment
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSegment(
                        selectedSegment === segment.id ? null : segment.id
                      )}
                      className="text-gray-400 hover:text-indigo-400 transition-colors"
                    >
                      <IconEye size={20} />
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {segment.content.length > 200 
                      ? `${segment.content.substring(0, 200)}...` 
                      : segment.content
                    }
                  </div>
                  
                  {segment.content.length > 200 && (
                    <button
                      onClick={() => setSelectedSegment(segment.id)}
                      className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 flex items-center gap-1"
                    >
                      Read Full Segment <IconArrowRight size={14} />
                    </button>
                  )}
                </div>

                {/* Strategic Patterns */}
                {segment.speaker === 'User' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20">
                      <div className="text-xs text-indigo-300 mb-1">Direction-Giving</div>
                      <div className="text-sm font-medium text-white">
                        {segment.strategicPatterns.directionGiving} instances
                      </div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                      <div className="text-xs text-blue-300 mb-1">System Thinking</div>
                      <div className="text-sm font-medium text-white">
                        {segment.strategicPatterns.systemThinking} instances
                      </div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <div className="text-xs text-green-300 mb-1">Quality Control</div>
                      <div className="text-sm font-medium text-white">
                        {segment.strategicPatterns.qualityControl} instances
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {segment.keyInsights.length > 0 && (
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Key Insights</h4>
                    <ul className="space-y-1">
                      {segment.keyInsights.slice(0, 3).map((insight, idx) => (
                        <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expanded View */}
                {selectedSegment === segment.id && (
                  <div className="border-t border-gray-700 pt-4 space-y-4">
                    {/* Full Content */}
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Full Content</h4>
                      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {segment.content}
                      </div>
                    </div>

                    {/* Detailed Analysis */}
                    {segment.speaker === 'User' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20">
                          <h4 className="text-sm font-medium text-indigo-300 mb-3">Strategic Patterns</h4>
                          <div className="space-y-2">
                            {Object.entries(segment.strategicPatterns).map(([pattern, count]) => (
                              <div key={pattern} className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 capitalize">
                                  {pattern.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-sm text-white">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                          <h4 className="text-sm font-medium text-green-300 mb-3">Philosophical Alignment</h4>
                          <div className="space-y-2">
                            {Object.entries(segment.philosophicalAlignment).map(([principle, score]) => (
                              <div key={principle} className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 capitalize">
                                  {principle.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className={`text-sm font-medium ${getAlignmentColor(score)}`}>
                                  {score}/100
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* All Key Insights */}
                    {segment.keyInsights.length > 0 && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">All Key Insights</h4>
                        <ul className="space-y-2">
                          {segment.keyInsights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-indigo-400 mt-1">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Load More / Pagination */}
        {filteredSegments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <IconSearch size={48} className="mx-auto mb-4" />
              No segments match your current filters
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedPhase('all');
                setShowOnlyStrategic(false);
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-8 border border-indigo-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Experience Strategic Architect Thinking
            </h3>
            <p className="text-gray-300 mb-6 max-w-3xl mx-auto">
              This conversation demonstrates execution-led refinement, systematic framework creation, 
              and meta-cognitive analysis in real time. Perfect example for the upcoming book: 
              "Execution-Led Refinement: The Strategic Architect's Guide to Flow Architecture"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>
                <IconBook size={16} className="mr-2" />
                Pre-order Book
              </Button>
              <Button variant="outline">
                <IconTarget size={16} className="mr-2" />
                Explore CADIS System
              </Button>
              <Button variant="outline">
                <IconBrain size={16} className="mr-2" />
                Strategic Consulting
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
