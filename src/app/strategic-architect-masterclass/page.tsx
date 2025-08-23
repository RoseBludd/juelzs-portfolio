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
  strategicPatternCounts?: {
    directionGiving: number;
    systemThinking: number;
    qualityControl: number;
    iterativeRefinement: number;
    problemDiagnosis: number;
    metaAnalysis: number;
  };
  principleCounts?: {
    execution: number;
    modularity: number;
    reusability: number;
    teachability: number;
    progressiveEnhancement: number;
  };
}

// Principle View Components
function ExecutionPrincipleView({ segments }: { segments: ConversationSegment[] }) {
    const executionSegments = segments.filter(segment =>
    (segment.speaker === 'User' || segment.speaker === 'Cursor') && 
    segment.content.toLowerCase().match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure|ensure|verify|confirm|analyze)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 mb-6">
        <h4 className="text-lg font-semibold text-green-300 mb-2">⚡ "If it needs to be done, do it" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {executionSegments.length} conversation moments showing immediate execution focus and decisive action-taking
        </p>
      </div>
      
      {executionSegments.length > 0 ? (
        executionSegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="green"
            principleKeywords={['proceed', 'implement', 'build', 'create', 'execute', 'make sure', 'ensure', 'verify', 'confirm', 'analyze']}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No execution-focused moments found in this conversation.</p>
          <p className="text-sm mt-2">This conversation may focus more on other principles like problem-solving or system thinking.</p>
        </div>
      )}
    </div>
  );
}

function ModularityPrincipleView({ segments }: { segments: ConversationSegment[] }) {
  const modularitySegments = segments.filter(segment => 
    segment.speaker === 'User' && 
    segment.content.toLowerCase().match(/\b(modular|component|service|singleton|module|reusable|separate|individual|architecture|system|structure)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 mb-6">
        <h4 className="text-lg font-semibold text-blue-300 mb-2">🧩 "Make it modular" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {modularitySegments.length} conversation moments emphasizing modular design, components, and separation of concerns
        </p>
      </div>
      
      {modularitySegments.length > 0 ? (
        modularitySegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="blue"
            principleKeywords={['modular', 'component', 'service', 'singleton', 'module', 'separate', 'architecture', 'system', 'structure']}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No modularity-focused moments found in this conversation.</p>
          <p className="text-sm mt-2">This conversation may focus more on other principles like execution or problem-solving.</p>
        </div>
      )}
    </div>
  );
}

function ReusabilityPrincipleView({ segments }: { segments: ConversationSegment[] }) {
    const reusabilitySegments = segments.filter(segment =>
    (segment.speaker === 'User' || segment.speaker === 'Cursor') && 
    segment.content.toLowerCase().match(/\b(reusable|framework|pattern|template|systematic|scale|optimize|comprehensive|standard|consistent)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 mb-6">
        <h4 className="text-lg font-semibold text-purple-300 mb-2">♻️ "Make it reusable" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {reusabilitySegments.length} conversation moments focusing on reusability, frameworks, and systematic approaches
        </p>
      </div>
      
      {reusabilitySegments.length > 0 ? (
        reusabilitySegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="purple"
            principleKeywords={['reusable', 'framework', 'pattern', 'systematic', 'scale', 'comprehensive', 'standard', 'consistent']}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No reusability-focused moments found in this conversation.</p>
          <p className="text-sm mt-2">This conversation may focus more on other principles like execution or modularity.</p>
        </div>
      )}
    </div>
  );
}

function TeachabilityPrincipleView({ segments }: { segments: ConversationSegment[] }) {
    const teachabilitySegments = segments.filter(segment =>
    (segment.speaker === 'User' || segment.speaker === 'Cursor') && 
    segment.content.toLowerCase().match(/\b(document|explain|understand|framework|define|teach|learn|analyze|styles|difference|investigate|study)\b/g)
  );

  return (
    <div className="space-y-4">
      <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 mb-6">
        <h4 className="text-lg font-semibold text-yellow-300 mb-2">📚 "Make it teachable" - In Action</h4>
        <p className="text-gray-400 text-sm">
          {teachabilitySegments.length} conversation moments emphasizing documentation, understanding, and knowledge transfer
        </p>
      </div>
      
      {teachabilitySegments.length > 0 ? (
        teachabilitySegments.slice(0, 15).map((segment, index) => (
        <PrincipleSegmentCard 
          key={segment.id} 
          segment={segment} 
          principleColor="yellow"
            principleKeywords={['document', 'explain', 'understand', 'define', 'analyze', 'styles', 'investigate', 'study']}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No teachability-focused moments found in this conversation.</p>
          <p className="text-sm mt-2">This conversation may focus more on other principles like execution or problem-solving.</p>
        </div>
      )}
    </div>
  );
}

function StrategicPatternsView({ segments }: { segments: ConversationSegment[] }) {
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  
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
        <StrategicSegmentCard 
          key={segment.id} 
          segment={segment}
          isExpanded={expandedSegment === segment.id}
          onToggleExpand={() => setExpandedSegment(
            expandedSegment === segment.id ? null : segment.id
          )}
        />
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
          All {segments.length} conversation segments in chronological order - full 1.85M character archive
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

            {/* Expanded Full Segment View */}
            {selectedSegment === segment.id && (
              <div className="border-t border-indigo-500/30 pt-6 space-y-4">
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-6 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                      📖 Full Segment Content
                      <span className="px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs">
                        {segment.content.length.toLocaleString()} characters
                      </span>
                    </h4>
                    <button
                      onClick={() => setSelectedSegment(null)}
                      className="text-gray-400 hover:text-gray-300 flex items-center gap-1 text-sm"
                    >
                      <IconX size={16} />
                      Close
                    </button>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 max-h-96 overflow-y-auto">
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {segment.content}
                  </div>
                  </div>
                  
                  {/* Segment Analysis */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-400">{segment.strategicScore}</div>
                      <div className="text-xs text-gray-400">Strategic Score</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-400">{segment.alignmentScore}</div>
                      <div className="text-xs text-gray-400">Alignment Score</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-purple-400">{segment.keyInsights.length}</div>
                      <div className="text-xs text-gray-400">Key Insights</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-yellow-400">{segment.speaker}</div>
                      <div className="text-xs text-gray-400">Speaker</div>
                    </div>
                  </div>
                  
                  {/* Key Insights */}
                  {segment.keyInsights.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">🔍 Key Insights</h5>
                      <div className="space-y-2">
                        {segment.keyInsights.map((insight, idx) => (
                          <div key={idx} className="bg-gray-800/30 rounded-lg p-3 border border-gray-600/30">
                            <div className="text-gray-300 text-sm">{insight}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

// Learning Goal Categories Component
function LearningGoalCategories({ 
  segments, 
  onCategorySelect, 
  selectedGoal 
}: { 
  segments: ConversationSegment[];
  onCategorySelect: (category: string, filteredSegments: ConversationSegment[]) => void;
  selectedGoal: string;
}) {
  const learningGoals = [
    {
      id: 'all',
      title: '🔍 All Segments',
      description: 'Browse all conversation segments',
      icon: IconEye,
      color: 'border-gray-600 bg-gray-800/50',
      activeColor: 'border-indigo-500 bg-indigo-600/20',
      filter: () => segments
    },
    {
      id: 'strategic-leadership',
      title: '👑 Strategic Leadership',
      description: 'Direction-setting, vision casting, and high-level decision making',
      icon: IconTarget,
      color: 'border-purple-600 bg-purple-800/20',
      activeColor: 'border-purple-400 bg-purple-600/30',
      filter: () => segments.filter(s => 
        s.speaker === 'User' && 
        (s.strategicPatterns.directionGiving >= 3 || 
         s.strategicPatterns.systemThinking >= 3 ||
         s.strategicScore >= 85)
      )
    },
    {
      id: 'technical-implementation',
      title: '⚡ Technical Implementation',
      description: 'Code analysis, system architecture, and deep technical workflows',
      icon: IconBrain,
      color: 'border-blue-600 bg-blue-800/20',
      activeColor: 'border-blue-400 bg-blue-600/30',
      filter: () => segments.filter(s => 
        s.speaker === 'Cursor' && 
        (s.content.includes('```') || 
         s.content.includes('async function') ||
         s.content.includes('class ') ||
         s.content.includes('interface ') ||
         s.content.length > 2000)
      )
    },
    {
      id: 'problem-solving',
      title: '🔧 Problem Solving',
      description: 'Debugging, troubleshooting, and systematic problem resolution',
      icon: IconChartBar,
      color: 'border-orange-600 bg-orange-800/20',
      activeColor: 'border-orange-400 bg-orange-600/30',
      filter: () => segments.filter(s => 
        s.strategicPatterns.problemDiagnosis >= 2 ||
        s.content.toLowerCase().includes('error') ||
        s.content.toLowerCase().includes('fix') ||
        s.content.toLowerCase().includes('debug') ||
        s.content.toLowerCase().includes('issue')
      )
    },
    {
      id: 'iterative-refinement',
      title: '🔄 Iterative Refinement',
      description: 'Course corrections, feedback loops, and continuous improvement',
      icon: IconTrendingUp,
      color: 'border-green-600 bg-green-800/20',
      activeColor: 'border-green-400 bg-green-600/30',
      filter: () => segments.filter(s => 
        s.strategicPatterns.iterativeRefinement >= 2 ||
        s.content.toLowerCase().includes('proceed') ||
        s.content.toLowerCase().includes('also') ||
        s.content.toLowerCase().includes('refine') ||
        s.content.toLowerCase().includes('improve')
      )
    },
    {
      id: 'meta-analysis',
      title: '🧠 Meta-Analysis',
      description: 'System design thinking, framework creation, and higher-order analysis',
      icon: IconBook,
      color: 'border-cyan-600 bg-cyan-800/20',
      activeColor: 'border-cyan-400 bg-cyan-600/30',
      filter: () => segments.filter(s => 
        s.strategicPatterns.metaAnalysis >= 2 ||
        s.content.toLowerCase().includes('analyze') ||
        s.content.toLowerCase().includes('framework') ||
        s.content.toLowerCase().includes('pattern') ||
        s.content.toLowerCase().includes('architecture')
      )
    },
    {
      id: 'coaching-insights',
      title: '📈 Coaching & Insights',
      description: 'Performance analysis, recommendations, and developer evaluation',
      icon: IconMessageCircle,
      color: 'border-yellow-600 bg-yellow-800/20',
      activeColor: 'border-yellow-400 bg-yellow-600/30',
      filter: () => segments.filter(s => 
        s.content.toLowerCase().includes('developer') ||
        s.content.toLowerCase().includes('performance') ||
        s.content.toLowerCase().includes('analysis') ||
        s.content.toLowerCase().includes('recommendation') ||
        s.content.toLowerCase().includes('insight')
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {learningGoals.map((goal) => {
        const filteredSegments = goal.filter();
        const isSelected = selectedGoal === goal.id;
        const IconComponent = goal.icon;
        
        return (
          <button
            key={goal.id}
            onClick={() => onCategorySelect(goal.id, filteredSegments)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
              isSelected ? goal.activeColor : goal.color
            } hover:border-opacity-80`}
          >
            <div className="flex items-center gap-3 mb-2">
              <IconComponent size={24} className={isSelected ? 'text-white' : 'text-gray-400'} />
              <div className="flex-1">
                <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {goal.title}
                </h4>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                isSelected 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-600/50 text-gray-400'
              }`}>
                {filteredSegments.length}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${
              isSelected ? 'text-gray-200' : 'text-gray-500'
            }`}>
              {goal.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// Learning Recommendations Component
function LearningRecommendations({ 
  learningGoal, 
  segmentCount, 
  segments 
}: { 
  learningGoal: string;
  segmentCount: number;
  segments: ConversationSegment[];
}) {
  const getRecommendations = (goal: string) => {
    const recommendations: Record<string, {
      icon: string;
      title: string;
      insights: string[];
      keyQuestions: string[];
    }> = {
      'strategic-leadership': {
        icon: '👑',
        title: 'Strategic Leadership Learning Path',
        insights: [
          'Study how initial direction is given and problems are framed',
          'Notice the balance between high-level vision and specific action items',
          'Observe how complex technical requirements are communicated simply',
          'Look for patterns in decision-making and priority setting'
        ],
        keyQuestions: [
          'How does the leader set context before giving direction?',
          'What makes the communication clear and actionable?',
          'How are trade-offs and constraints communicated?'
        ]
      },
      'technical-implementation': {
        icon: '⚡',
        title: 'Technical Implementation Deep Dive',
        insights: [
          'Analyze complete code solutions and architectural patterns',
          'Study how complex systems are broken down into manageable parts',
          'Learn database design and service integration patterns',
          'Observe testing and debugging methodologies'
        ],
        keyQuestions: [
          'What makes this code modular and maintainable?',
          'How are edge cases and error handling addressed?',
          'What patterns can be reused in other projects?'
        ]
      },
      'problem-solving': {
        icon: '🔧',
        title: 'Systematic Problem Resolution',
        insights: [
          'Study the diagnostic process from symptom to root cause',
          'Learn how to systematically eliminate possibilities',
          'Observe how debugging information is gathered and analyzed',
          'Notice how solutions are tested and validated'
        ],
        keyQuestions: [
          'What was the hypothesis and how was it tested?',
          'How was the problem scope defined and limited?',
          'What preventive measures were put in place?'
        ]
      },
      'iterative-refinement': {
        icon: '🔄',
        title: 'Continuous Improvement Mastery',
        insights: [
          'Study how feedback loops are established and maintained',
          'Learn to recognize when course correction is needed',
          'Observe how scope expansion is managed strategically',
          'Notice how improvements build on previous work'
        ],
        keyQuestions: [
          'What triggers the need for refinement?',
          'How is the balance between perfection and progress maintained?',
          'What criteria determine when something is "good enough"?'
        ]
      },
      'meta-analysis': {
        icon: '🧠',
        title: 'Higher-Order Thinking Development',
        insights: [
          'Study how systems are analyzed at multiple levels',
          'Learn to create frameworks and mental models',
          'Observe pattern recognition across different contexts',
          'Notice how abstract concepts are made concrete'
        ],
        keyQuestions: [
          'What patterns emerge across different scenarios?',
          'How are complex systems simplified for understanding?',
          'What frameworks help organize this information?'
        ]
      },
      'coaching-insights': {
        icon: '📈',
        title: 'Performance Analysis & Coaching',
        insights: [
          'Study how performance is measured and evaluated',
          'Learn to identify improvement opportunities',
          'Observe how feedback is structured and delivered',
          'Notice how development plans are created'
        ],
        keyQuestions: [
          'What metrics indicate strong performance?',
          'How is constructive feedback balanced with recognition?',
          'What development paths are most effective?'
        ]
      }
    };

    return recommendations[goal] || recommendations['strategic-leadership'];
  };

  const rec = getRecommendations(learningGoal);
  const avgStrategicScore = Math.round(
    segments.reduce((sum, s) => sum + s.strategicScore, 0) / segments.length
  );

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-6 border border-indigo-500/20 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{rec.icon}</span>
        <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
        <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm">
          {segmentCount} segments • Avg Score: {avgStrategicScore}/100
        </span>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-indigo-300 mb-3 flex items-center gap-2">
            <IconTarget size={16} />
            Key Learning Insights
          </h4>
          <ul className="space-y-2">
            {rec.insights.map((insight, index) => (
              <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-indigo-400 mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-indigo-300 mb-3 flex items-center gap-2">
            <IconMessageCircle size={16} />
            Questions to Ask Yourself
          </h4>
          <ul className="space-y-2">
            {rec.keyQuestions.map((question, index) => (
              <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-purple-400 mt-1">?</span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StrategicSegmentCard({ 
  segment, 
  isExpanded, 
  onToggleExpand 
}: { 
  segment: ConversationSegment;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
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
          
          <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-green-400">{segment.alignmentScore}/100</div>
            <div className="text-xs text-green-300">Alignment</div>
            </div>
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="text-gray-400 hover:text-indigo-400 transition-colors"
              >
                <IconEye size={18} />
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {isExpanded 
              ? segment.content
              : `${segment.content.substring(0, 300)}${segment.content.length > 300 ? '...' : ''}`
            }
          </div>
          
          {!isExpanded && segment.content.length > 300 && onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 flex items-center gap-1"
            >
              Read Full Segment <IconArrowRight size={14} />
            </button>
          )}
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
            {(isExpanded ? segment.keyInsights : segment.keyInsights.slice(0, 2)).map((insight, idx) => (
              <div key={idx} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                {insight}
              </div>
            ))}
          </div>
        )}

        {isExpanded && onToggleExpand && (
          <div className="pt-3 border-t border-indigo-500/20">
            <button
              onClick={onToggleExpand}
              className="text-gray-400 hover:text-gray-300 flex items-center gap-1 text-sm w-full justify-center"
            >
              <IconX size={16} />
              Collapse Segment
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

interface AvailableConversation {
  id: string;
  title: string;
  description: string;
  source: string;
  isEnabled: boolean;
  createdAt: Date;
  totalCharacters: number;
  strategicScore: number;
  alignmentScore: number;
}

export default function StrategicArchitectMasterclass() {
  const [conversationData, setConversationData] = useState<ConversationSegment[]>([]);
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('execution');
  const [mainTab, setMainTab] = useState<string>('moments'); // 'moments', 'principles', or 'exploration'
  const [showOnlyStrategic, setShowOnlyStrategic] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [learningGoal, setLearningGoal] = useState<string>('all');
  const [filteredByGoal, setFilteredByGoal] = useState<ConversationSegment[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string>('cadis-developer');
  const [availableConversations, setAvailableConversations] = useState<AvailableConversation[]>([]);

  useEffect(() => {
    loadConversationData();
    
    // Check for anchor navigation to learning-goal explorer
    const hash = window.location.hash;
    if (hash === '#learning-explorer' || hash === '#exploration') {
      setMainTab('exploration');
      // Scroll to the learning explorer section after a brief delay
      setTimeout(() => {
        const explorerElement = document.getElementById('learning-goal-explorer');
        if (explorerElement) {
          explorerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  // Reload data when conversation selection changes
  useEffect(() => {
    if (selectedConversation) {
      loadConversationData();
      // Reset filters when switching conversations
      setLearningGoal('all');
      setFilteredByGoal([]);
      setSearchTerm('');
      setSelectedSegment(null);
    }
  }, [selectedConversation]);

  const loadConversationData = async () => {
    try {
      setLoading(true);

      // Fetch available conversations and current conversation data in parallel
      const conversationsReq = fetch('/api/strategic-architect-masterclass/conversations');
      const dataReq = fetch(`/api/strategic-architect-masterclass?conversation=${selectedConversation}`);
      
      const [conversationsRes, dataRes] = await Promise.all([conversationsReq, dataReq]);
      
      // Load available conversations for dropdown
      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json();
        setAvailableConversations(conversationsData.conversations || []);
        console.log(`📊 Loaded ${conversationsData.conversations?.length || 0} available conversations`);
      }
      
      // Load current conversation analysis
      if (dataRes.ok) {
        const data = await dataRes.json();
        setConversationData(data.segments || []);
        setAnalysis(data.analysis);
        console.log(`✅ Loaded conversation: ${data.metadata?.title || selectedConversation}`);
      } else {
        console.error('Failed to load conversation data:', await dataRes.text());
      }
    } catch (error) {
      console.error('Error loading conversation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSegments = useMemo(() => {
    // Start with learning goal filtered segments if available
    let filtered = learningGoal !== 'all' && filteredByGoal.length > 0 
      ? filteredByGoal 
      : conversationData;

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

    // Phase filter (only if not using learning goal filter)
    if (selectedPhase !== 'all' && learningGoal === 'all') {
      const phaseIndex = analysis?.evolutionPhases.findIndex(p => p.phase === selectedPhase);
      if (phaseIndex !== undefined && phaseIndex >= 0) {
        const segmentsPerPhase = Math.floor(conversationData.length / (analysis?.evolutionPhases.length || 1));
        const startIndex = phaseIndex * segmentsPerPhase;
        const endIndex = startIndex + segmentsPerPhase;
        filtered = filtered.slice(startIndex, endIndex);
      }
    }

    return filtered;
  }, [conversationData, filteredByGoal, learningGoal, searchTerm, showOnlyStrategic, selectedPhase, analysis]);

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
            Real-time analysis of strategic conversations demonstrating leadership thinking, 
            execution-led refinement, and philosophical alignment in action.
          </p>
          
          {/* Conversation Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                📚 Select Conversation to Analyze
              </label>
              <select
                value={selectedConversation}
                onChange={(e) => setSelectedConversation(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:border-indigo-500 focus:outline-none min-w-96 text-center"
              >
                {availableConversations.map(conversation => (
                  <option key={conversation.id} value={conversation.id}>
                    {conversation.title}
                  </option>
                ))}
                {availableConversations.length === 0 && (
                  <option value="cadis-developer">🧠 Loading conversations...</option>
                )}
              </select>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {availableConversations.find(c => c.id === selectedConversation)?.description || 
                 'Loading conversation details...'}
              </p>
            </div>
          </div>
          
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
                <p className="text-gray-300">Every principle consistently demonstrated across {(analysis.totalCharacters/1_000_000).toFixed(1)}M characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-lg font-bold text-green-400">If it needs to be done, do it</div>
                  <div className="text-sm text-gray-400 mt-2">{(analysis.principleCounts?.execution || 0).toLocaleString()} execution tokens</div>
                  <div className="text-xs text-green-300 mt-1">"proceed", "implement", "build"</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                  <div className="text-3xl mb-2">🧩</div>
                  <div className="text-lg font-bold text-blue-400">Make it modular</div>
                  <div className="text-sm text-gray-400 mt-2">{(analysis.principleCounts?.modularity || 0).toLocaleString()} modular tokens</div>
                  <div className="text-xs text-blue-300 mt-1">"singleton", "service", "component"</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 text-center">
                  <div className="text-3xl mb-2">♻️</div>
                  <div className="text-lg font-bold text-purple-400">Make it reusable</div>
                  <div className="text-sm text-gray-400 mt-2">{(analysis.principleCounts?.reusability || 0).toLocaleString()} reusability tokens</div>
                  <div className="text-xs text-purple-300 mt-1">"framework", "systematic", "scale"</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-lg font-bold text-yellow-400">Make it teachable</div>
                  <div className="text-sm text-gray-400 mt-2">{(analysis.principleCounts?.teachability || 0).toLocaleString()} teaching tokens</div>
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
                      <div className="text-sm text-gray-400">{(analysis?.strategicPatternCounts?.directionGiving || 0).toLocaleString()} instances</div>
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
                      <div className="text-sm text-gray-400">{(analysis?.strategicPatternCounts?.systemThinking || 0).toLocaleString()} instances</div>
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
                      <div className="text-sm text-gray-400">{(analysis?.strategicPatternCounts?.qualityControl || 0).toLocaleString()} instances</div>
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
                      <div className="text-sm text-gray-400">{(analysis?.strategicPatternCounts?.iterativeRefinement || 0).toLocaleString()} instances</div>
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
                      <div className="text-sm text-gray-400">{(analysis?.strategicPatternCounts?.problemDiagnosis || 0).toLocaleString()} instances</div>
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
                      <div className="text-sm text-gray-400">{(analysis?.strategicPatternCounts?.metaAnalysis || 0).toLocaleString()} instances</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    "analyze our current conversation", "define the styles", "framework creation"
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20 text-center">
                <div className="text-lg font-semibold text-indigo-300 mb-2">
                  {analysis?.strategicRatio || 0}% Strategic Focus vs {100 - (analysis?.strategicRatio || 0)}% Technical Implementation
                </div>
                <div className="text-sm text-gray-400">
                  Perfect balance: Strategic leadership with hands-on execution capability
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="mb-8">
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setMainTab('moments')}
              className={`px-6 py-4 rounded-lg text-lg font-semibold transition-all ${
                mainTab === 'moments'
                  ? 'bg-amber-600 text-white border-2 border-amber-500 shadow-lg'
                  : 'bg-gray-800 text-gray-300 border-2 border-gray-600 hover:border-amber-500 hover:text-amber-300'
              }`}
            >
              <span className="mr-3">⭐</span>
              Key Strategic Moments
            </button>
            <button
              onClick={() => setMainTab('principles')}
              className={`px-6 py-4 rounded-lg text-lg font-semibold transition-all ${
                mainTab === 'principles'
                  ? 'bg-indigo-600 text-white border-2 border-indigo-500 shadow-lg'
                  : 'bg-gray-800 text-gray-300 border-2 border-gray-600 hover:border-indigo-500 hover:text-indigo-300'
              }`}
            >
              <span className="mr-3">🎭</span>
              Philosophical Alignment
            </button>
            <button
              onClick={() => setMainTab('exploration')}
              className={`px-6 py-4 rounded-lg text-lg font-semibold transition-all ${
                mainTab === 'exploration'
                  ? 'bg-gray-600 text-white border-2 border-gray-500 shadow-lg'
                  : 'bg-gray-800 text-gray-300 border-2 border-gray-600 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="mr-3">🔍</span>
              Advanced Exploration
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {mainTab === 'moments' && (
          <Card className="mb-8 border-amber-500/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-amber-300 mb-2">
                Key Strategic Moments
              </h3>
              <p className="text-gray-400">
                Witness execution-led refinement in action - curated highlights from the {analysis?.totalCharacters ? (analysis.totalCharacters / 1000000).toFixed(2) + 'M' : ''} character conversation
              </p>
            </div>

            {/* Dynamic Key Strategic Moments */}
            <div className="space-y-6">
              {analysis?.keyMoments?.map((moment, index) => (
                <div key={index} className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-lg p-6 border border-indigo-500/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
                        <img 
                          src="/profile-logo.png" 
                          alt="Juelz" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">
                          {selectedConversation === 'image-display-issues' 
                            ? ['Problem Identification', 'Root Cause Analysis', 'Architecture Refinement', 'Solution Implementation', 'Quality Control', 'Strategic Direction'][index] || 'Strategic Moment'
                            : ['Strategic Direction', 'Scope Refinement', 'Deep Investigation', 'Meta-Analysis', 'Quality Control', 'Framework Creation'][index] || 'Strategic Moment'
                          }
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedConversation === 'image-display-issues' ? 'Problem-Solving' : 'Strategic'} Pattern - Exchange {index + 1}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {selectedConversation === 'image-display-issues' ? [85, 90, 95, 80, 95, 88][index] || 85 : [95, 88, 92, 100, 90, 85][index] || 90}/100
                      </div>
                      <div className="text-sm text-green-300">
                        {selectedConversation === 'image-display-issues' ? 'Strategic Problem-Solving' : 'Strategic Leadership'}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-5 mb-4">
                    <div className="text-gray-300 leading-relaxed">
                      <strong className="text-indigo-400">"{moment}"</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div className="bg-indigo-500/20 rounded p-2">
                      <div className="text-indigo-300 font-medium">
                        {selectedConversation === 'image-display-issues' ? 'Direction' : 'Direction'}
                      </div>
                      <div className="text-gray-400">
                        {selectedConversation === 'image-display-issues' ? [3, 4, 5, 2, 4, 3][index] || 3 : [5, 3, 4, 2, 4, 3][index] || 4}
                      </div>
                    </div>
                    <div className="bg-blue-500/20 rounded p-2">
                      <div className="text-blue-300 font-medium">Quality</div>
                      <div className="text-gray-400">
                        {selectedConversation === 'image-display-issues' ? [4, 3, 2, 3, 5, 4][index] || 3 : [3, 2, 3, 1, 4, 2][index] || 3}
                      </div>
                    </div>
                    <div className="bg-green-500/20 rounded p-2">
                      <div className="text-green-300 font-medium">System</div>
                      <div className="text-gray-400">
                        {selectedConversation === 'image-display-issues' ? [2, 3, 4, 2, 2, 3][index] || 2 : [4, 3, 2, 5, 3, 4][index] || 3}
                      </div>
                    </div>
                    <div className="bg-purple-500/20 rounded p-2">
                      <div className="text-purple-300 font-medium">Focus</div>
                      <div className="text-gray-400">
                        {selectedConversation === 'image-display-issues' ? 'Problem' : 'Strategic'}
                      </div>
                    </div>
                  </div>
                </div>
              )) || []}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg p-6 border border-amber-500/20">
              <h4 className="text-lg font-semibold text-amber-300 mb-4 text-center">Strategic Moment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{analysis?.keyMoments?.length || 0}</div>
                  <div className="text-sm text-gray-400">Key Moments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {(() => {
                      const strategicSegments = conversationData.filter(s => (s.speaker === 'User' || s.speaker === 'Cursor') && s.strategicScore > 0);
                      return strategicSegments.length > 0 
                        ? Math.round(strategicSegments.reduce((sum, s) => sum + s.strategicScore, 0) / strategicSegments.length)
                        : 0;
                    })()}/100
                  </div>
                  <div className="text-sm text-gray-400">Avg Strategic Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-400">
                    {conversationData.filter(s => (s.speaker === 'User' || s.speaker === 'Cursor') && s.strategicScore >= 70).length}
                  </div>
                  <div className="text-sm text-gray-400">Strategic Patterns</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{analysis?.philosophicalAlignment || 98}/100</div>
                  <div className="text-sm text-gray-400">Philosophy Alignment</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-lg p-6 border border-indigo-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/profile-logo.png" 
                        alt="Juelz" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">Strategic Direction</div>
                      <div className="text-sm text-gray-400">Opening Command - Exchange 1</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">95/100 Strategic</div>
                    <div className="text-sm text-green-300">Perfect execution focus</div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 mb-4">
                  <div className="text-gray-300 leading-relaxed">
                    <strong className="text-indigo-400">"proceed and make sure that CADIS is using the developer information in the database properly.. we recently ran script confirming how the data was. proceed with that. and confirm it is doing as it should in regards to insights about developers and what they are creating, their efficiencies, if they are following my principles and whatever else data we can get on them based on my setup. proceed."</strong>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-indigo-500/20 rounded-lg p-3 text-center">
                    <div className="text-indigo-300 font-medium">Direction-Giving</div>
                    <div className="text-2xl font-bold text-white">5</div>
                    <div className="text-xs text-gray-400">"proceed", "make sure", "confirm"</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-lg p-3 text-center">
                    <div className="text-blue-300 font-medium">Quality Control</div>
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-gray-400">"proper", "should", "confirm"</div>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 text-center">
                    <div className="text-green-300 font-medium">System Focus</div>
                    <div className="text-2xl font-bold text-white">4</div>
                    <div className="text-xs text-gray-400">CADIS ecosystem analysis</div>
                  </div>
                </div>
              </div>

              {/* Moment 2: Iterative Refinement */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/profile-logo.png" 
                        alt="Juelz" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">Iterative Refinement</div>
                      <div className="text-sm text-gray-400">Scope Expansion - Exchange 4</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">88/100 Strategic</div>
                    <div className="text-sm text-green-300">Perfect refinement pattern</div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 mb-4">
                  <div className="text-gray-300 leading-relaxed">
                    <strong className="text-purple-400">"yes.. the info it got is cool but should also be getting individual developer (active) info and them as an individual.. proceed."</strong>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-purple-500/20 rounded-lg p-3 text-center">
                    <div className="text-purple-300 font-medium">Refinement</div>
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-gray-400">"but should also"</div>
                  </div>
                  <div className="bg-pink-500/20 rounded-lg p-3 text-center">
                    <div className="text-pink-300 font-medium">Individual Focus</div>
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-gray-400">Developer-specific analysis</div>
                  </div>
                  <div className="bg-red-500/20 rounded-lg p-3 text-center">
                    <div className="text-red-300 font-medium">Action Command</div>
                    <div className="text-2xl font-bold text-white">1</div>
                    <div className="text-xs text-gray-400">"proceed"</div>
                  </div>
                </div>
              </div>

              {/* Moment 3: Meta-Analysis */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/profile-logo.png" 
                        alt="Juelz" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">Meta-Analysis</div>
                      <div className="text-sm text-gray-400">Framework Creation - Exchange 15</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">100/100 Strategic</div>
                    <div className="text-sm text-green-300">Perfect meta-cognitive</div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 mb-4">
                  <div className="text-gray-300 leading-relaxed">
                    <strong className="text-yellow-400">"what about guiding and directing.. ? are any using the ai like, i am conversating with you here.. analyze our current conversation. anyone using and developing like i am.. lets make a md and define the styles so can understand difference (so CADIS can as well)"</strong>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                    <div className="text-yellow-300 font-medium">Meta-Analysis</div>
                    <div className="text-2xl font-bold text-white">4</div>
                    <div className="text-xs text-gray-400">"analyze our conversation"</div>
                  </div>
                  <div className="bg-orange-500/20 rounded-lg p-3 text-center">
                    <div className="text-orange-300 font-medium">Framework Creation</div>
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-gray-400">"define the styles"</div>
                  </div>
                  <div className="bg-red-500/20 rounded-lg p-3 text-center">
                    <div className="text-red-300 font-medium">System Enhancement</div>
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-gray-400">"so CADIS can as well"</div>
                  </div>
                </div>
              </div>

              {/* Moment 4: Problem Diagnosis */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg p-6 border border-red-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center overflow-hidden">
                      <img 
                        src="/profile-logo.png" 
                        alt="Juelz" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">Problem Diagnosis</div>
                      <div className="text-sm text-gray-400">Root Cause Analysis - Exchange 12</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">92/100 Strategic</div>
                    <div className="text-sm text-green-300">Deep investigation mode</div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-5 mb-4">
                  <div className="text-gray-300 leading-relaxed">
                    <strong className="text-red-400">"no.. im not understanding.. it is saying max connections but we need it.. find a better way now you have direct string etc.. but we need to make this happen."</strong>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-red-500/20 rounded-lg p-3 text-center">
                    <div className="text-red-300 font-medium">Problem Focus</div>
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-gray-400">"not understanding", "issue"</div>
                  </div>
                  <div className="bg-orange-500/20 rounded-lg p-3 text-center">
                    <div className="text-orange-300 font-medium">Solution Drive</div>
                    <div className="text-2xl font-bold text-white">4</div>
                    <div className="text-xs text-gray-400">"find better way", "make happen"</div>
                  </div>
                  <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                    <div className="text-yellow-300 font-medium">Persistence</div>
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-gray-400">"we need", "must happen"</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg p-6 border border-amber-500/20">
              <h4 className="text-lg font-semibold text-amber-300 mb-4 text-center">Strategic Moment Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">4</div>
                  <div className="text-sm text-gray-400">Key Moments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">94/100</div>
                  <div className="text-sm text-gray-400">Avg Strategic Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-400">15</div>
                  <div className="text-sm text-gray-400">Strategic Patterns</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">98/100</div>
                  <div className="text-sm text-gray-400">Philosophy Alignment</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {mainTab === 'principles' && (
          <Card className="mb-8 border-indigo-500/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-indigo-300 mb-2">
                Philosophical Alignment by Principle
              </h3>
              <p className="text-gray-400">
                Explore conversation segments organized by your core principles - see alignment in real-time
              </p>
            </div>

            {/* Principle Tab Navigation */}
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
                <span className="ml-2 text-xs bg-green-500/20 px-2 py-1 rounded">
                  {conversationData.filter(s => 
                    (s.speaker === 'User' || s.speaker === 'Cursor') && 
                    s.content.toLowerCase().match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure|ensure|verify|confirm|analyze)\b/g)
                  ).length}
                </span>
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
                <span className="ml-2 text-xs bg-blue-500/20 px-2 py-1 rounded">
                  {conversationData.filter(s => 
                    (s.speaker === 'User' || s.speaker === 'Cursor') && 
                    s.content.toLowerCase().match(/\b(modular|component|service|singleton|module|reusable|separate|individual|architecture|system)\b/g)
                  ).length}
                </span>
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
                <span className="ml-2 text-xs bg-purple-500/20 px-2 py-1 rounded">
                  {conversationData.filter(s => 
                    (s.speaker === 'User' || s.speaker === 'Cursor') && 
                    s.content.toLowerCase().match(/\b(reusable|framework|pattern|template|systematic|scale|standard|consistent)\b/g)
                  ).length}
                </span>
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
                <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-1 rounded">
                  {conversationData.filter(s => 
                    (s.speaker === 'User' || s.speaker === 'Cursor') && 
                    s.content.toLowerCase().match(/\b(document|explain|understand|framework|define|teach|learn|analyze|study|investigate)\b/g)
                  ).length}
                </span>
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
                <span className="ml-2 text-xs bg-indigo-500/20 px-2 py-1 rounded">
                  {conversationData.filter(s => (s.speaker === 'User' || s.speaker === 'Cursor') && s.strategicScore >= 70).length}
                </span>
              </button>
            </div>

            {/* Principle Tab Content */}
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
            </div>
          </Card>
        )}

        {mainTab === 'exploration' && (
          <Card className="mb-8 border-gray-600" id="learning-goal-explorer">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                🎯 Learning-Goal-Based Segment Explorer
              </h3>
              <p className="text-gray-400 text-sm">
                Choose your learning objective to find the most relevant conversation segments from {conversationData.length} total segments
              </p>
            </div>

            {/* Learning Goal Categories */}
            <LearningGoalCategories 
              segments={conversationData}
              onCategorySelect={(category, segments) => {
                setLearningGoal(category);
                setFilteredByGoal(segments);
              }}
              selectedGoal={learningGoal}
            />

            {/* Advanced Search & Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 mt-6">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Refine your search within selected learning goal..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOnlyStrategic(!showOnlyStrategic)}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    showOnlyStrategic 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-indigo-500'
                  }`}
                >
                  <IconFilter size={16} className="inline mr-2" />
                  Strategic Only (70+)
                </button>
              </div>
            </div>

            {/* Learning Goal Status & Results Info */}
            {learningGoal !== 'all' && (
              <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                  <h4 className="font-semibold text-indigo-300">
                    Learning Goal Active: {learningGoal.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h4>
                </div>
                <p className="text-gray-400 text-sm">
                  Showing segments specifically filtered for your learning objective. Use search to refine further.
                </p>
              </div>
            )}

            {/* Results Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-400">
                Showing <span className="text-white font-semibold">{filteredSegments.length}</span> of <span className="text-gray-300">{conversationData.length}</span> conversation segments
                {learningGoal !== 'all' && (
                  <span className="ml-2 px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-xs">
                    Goal Filtered
                  </span>
                )}
                {searchTerm && (
                  <span className="ml-2 px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
              </div>
              {(searchTerm || showOnlyStrategic || learningGoal !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setShowOnlyStrategic(false);
                    setLearningGoal('all');
                    setFilteredByGoal([]);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm"
                >
                  <IconX size={14} />
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Learning Recommendations */}
            {learningGoal !== 'all' && filteredSegments.length > 0 && (
              <LearningRecommendations 
                learningGoal={learningGoal}
                segmentCount={filteredSegments.length}
                segments={filteredSegments}
              />
            )}

            {/* All Segments View */}
            <AllSegmentsView segments={filteredSegments} selectedSegment={selectedSegment} setSelectedSegment={setSelectedSegment} />
          </Card>
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
