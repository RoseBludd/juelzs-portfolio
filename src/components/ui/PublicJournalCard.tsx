'use client';

import { useState } from 'react';
import Card from './Card';

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

interface PublicJournalCardProps {
  entry: PublicJournalEntry;
}

const categoryConfig = {
  architecture: { 
    icon: '🏗️', 
    color: 'bg-blue-500/20 text-blue-300 border-blue-700',
    description: 'System Design Decision'
  },
  reflection: { 
    icon: '💭', 
    color: 'bg-green-500/20 text-green-300 border-green-700',
    description: 'Technical Reflection'
  },
  milestone: { 
    icon: '🎯', 
    color: 'bg-purple-500/20 text-purple-300 border-purple-700',
    description: 'Project Milestone'
  },
  planning: { 
    icon: '📅', 
    color: 'bg-orange-500/20 text-orange-300 border-orange-700',
    description: 'Strategic Planning'
  }
};

const suggestionTypeIcons = {
  architecture: '🏛️',
  optimization: '⚡',
  'best-practice': '✅',
  'risk-assessment': '⚠️',
  'next-steps': '🎯'
};

export default function PublicJournalCard({ entry }: PublicJournalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const categoryInfo = categoryConfig[entry.category as keyof typeof categoryConfig] || {
    icon: '📄',
    color: 'bg-gray-500/20 text-gray-300 border-gray-700',
    description: 'Engineering Insight'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${categoryInfo.color}`}>
                {categoryInfo.icon} {categoryInfo.description}
              </span>
              {entry.projectName && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                  💼 {entry.projectName}
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2 leading-tight">
              {entry.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>📅 {formatDate(entry.createdAt)}</span>
              {entry.metadata?.difficulty && (
                <span>🔥 Complexity: {entry.metadata.difficulty}/10</span>
              )}
              {entry.metadata?.impact && (
                <span>📈 Impact: {entry.metadata.impact}/10</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {isExpanded ? entry.content : truncateContent(entry.content)}
          </div>
          
          {entry.content.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Architecture Diagrams */}
        {entry.architectureDiagrams && entry.architectureDiagrams.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">📐 Architecture Diagrams</h4>
            <div className="flex flex-wrap gap-2">
              {entry.architectureDiagrams.map((diagram, index) => (
                <a
                  key={index}
                  href={diagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-900/50 transition-colors"
                >
                  📊 View Diagram {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Key Learnings */}
        {isExpanded && entry.metadata?.learnings && entry.metadata.learnings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Key Learnings</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
              {entry.metadata.learnings.map((learning, index) => (
                <li key={index}>{learning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {isExpanded && entry.metadata?.nextSteps && entry.metadata.nextSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">🎯 Next Steps</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
              {entry.metadata.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Suggestions */}
        {entry.aiSuggestions && entry.aiSuggestions.length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-300">🤖 AI Analysis & Suggestions</h4>
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700 px-3 py-1 rounded transition-colors"
              >
                {showAISuggestions ? 'Hide' : 'Show'} ({entry.aiSuggestions.length})
              </button>
            </div>
            
            {showAISuggestions && (
              <div className="space-y-3">
                {entry.aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{suggestionTypeIcons[suggestion.type as keyof typeof suggestionTypeIcons] || '💡'}</span>
                        <span className="text-sm font-medium text-gray-300 capitalize">
                          {suggestion.type.replace('-', ' ')}
                        </span>
                        <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% confidence
                        </span>
                        {suggestion.implementationComplexity && (
                          <span className={`text-xs ${getComplexityColor(suggestion.implementationComplexity)}`}>
                            {suggestion.implementationComplexity} complexity
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">{suggestion.suggestion}</p>
                    <p className="text-gray-400 text-xs">{suggestion.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Professional Note */}
        <div className="bg-blue-900/10 border border-blue-700 rounded-lg p-3 mt-4">
          <p className="text-xs text-blue-300">
            💡 This represents real engineering decisions and thought processes from building production systems
          </p>
        </div>
      </div>
    </Card>
  );
}
