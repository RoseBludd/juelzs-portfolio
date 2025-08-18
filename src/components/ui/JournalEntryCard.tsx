'use client';

import { useState } from 'react';
import Button from './Button';
import { JournalEntry, AISuggestion } from '@/services/journal.service';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onMarkSuggestionImplemented: (suggestionId: string) => void;
  onTogglePrivacy?: (entryId: string, isPrivate: boolean) => void;
}

const categoryColors = {
  architecture: 'bg-blue-900/30 text-blue-300 border-blue-700',
  decision: 'bg-purple-900/30 text-purple-300 border-purple-700',
  reflection: 'bg-green-900/30 text-green-300 border-green-700',
  planning: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  'problem-solving': 'bg-red-900/30 text-red-300 border-red-700',
  milestone: 'bg-indigo-900/30 text-indigo-300 border-indigo-700',
  learning: 'bg-orange-900/30 text-orange-300 border-orange-700'
};

const categoryIcons = {
  architecture: '🏗️',
  decision: '🤔',
  reflection: '💭',
  planning: '📅',
  'problem-solving': '🔧',
  milestone: '🎯',
  learning: '📚'
};

const suggestionTypeIcons = {
  architecture: '🏛️',
  optimization: '⚡',
  'best-practice': '✅',
  'risk-assessment': '⚠️',
  'next-steps': '🎯'
};

export default function JournalEntryCard({ entry, onEdit, onDelete, onMarkSuggestionImplemented, onTogglePrivacy }: JournalEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analysis'>('content');
  const [showOriginalContent, setShowOriginalContent] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const fetchAnalysis = async () => {
    if (analysis) {
      setActiveTab('analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai/analyze-journal-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entry }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze entry');
      }

      const data = await response.json();
      if (data.success) {
        setAnalysis(data);
        setActiveTab('analysis');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[entry.category]}`}>
                {categoryIcons[entry.category]} {entry.category}
              </span>
              {entry.projectName && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                  💼 {entry.projectName}
                </span>
              )}
              {entry.aiSuggestions && entry.aiSuggestions.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700">
                  🤖 {entry.aiSuggestions.length} AI Suggestion{entry.aiSuggestions.length !== 1 ? 's' : ''}
                </span>
              )}
              {entry.originalContent && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-900/30 text-orange-300 border border-orange-700">
                  📋 Has Original
                </span>
              )}
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 pr-2">{entry.title}</h3>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <span>📅 {formatDate(entry.createdAt)}</span>
              {entry.updatedAt !== entry.createdAt && (
                <span>✏️ Updated {formatDate(entry.updatedAt)}</span>
              )}
              {entry.metadata?.difficulty && (
                <span>🔥 Difficulty: {entry.metadata.difficulty}/10</span>
              )}
              {entry.metadata?.impact && (
                <span>📈 Impact: {entry.metadata.impact}/10</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => {
                setIsExpanded(!isExpanded);
                if (!isExpanded) setActiveTab('content');
              }}
              className="text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 px-2 py-1"
            >
              {isExpanded ? '👁️ Collapse' : '👁️ Expand'}
            </Button>
            {isExpanded && (
              <>
                <Button
                  onClick={() => setActiveTab('content')}
                  className={`text-xs sm:text-sm px-2 py-1 ${
                    activeTab === 'content'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  📄 Content
                </Button>
                {entry.originalContent && activeTab === 'content' && (
                  <Button
                    onClick={() => setShowOriginalContent(!showOriginalContent)}
                    className={`text-xs sm:text-sm px-2 py-1 ${
                      showOriginalContent
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {showOriginalContent ? '📝 Show Enhanced' : '📋 Show Original'}
                  </Button>
                )}
                <Button
                  onClick={fetchAnalysis}
                  disabled={isAnalyzing}
                  className={`text-xs sm:text-sm px-2 py-1 ${
                    activeTab === 'analysis'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isAnalyzing ? '🤖 Analyzing...' : '🧠 AI Analysis'}
                </Button>
              </>
            )}
            <Button
              onClick={() => onEdit(entry)}
              className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 px-2 py-1"
            >
              ✏️ Edit
            </Button>
            
            {/* Privacy Toggle */}
            {onTogglePrivacy && (
              <button
                onClick={() => onTogglePrivacy(entry.id, !entry.isPrivate)}
                className={`text-xs sm:text-sm px-2 py-1 rounded transition-colors ${
                  entry.isPrivate 
                    ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500' 
                    : 'bg-green-600 hover:bg-green-700 text-white border border-green-500'
                }`}
                title={entry.isPrivate ? 'Currently Private - Click to make Public' : 'Currently Public - Click to make Private'}
              >
                {entry.isPrivate ? '🔒 Private' : '🔓 Public'}
              </button>
            )}
            
            <Button
              onClick={() => onDelete(entry.id)}
              className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 px-2 py-1"
            >
              🗑️ Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {!isExpanded ? (
          // Collapsed view - show truncated content
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">
              {truncateContent(entry.content)}
            </p>
          </div>
        ) : activeTab === 'content' ? (
          // Content tab - show full entry details
          <div className="space-y-4">
            {entry.originalContent && showOriginalContent ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-orange-400 bg-orange-900/30 px-2 py-1 rounded border border-orange-700">
                    📋 Original Content
                  </span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {entry.originalContent}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {entry.originalContent && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-700">
                      🤖 AI Enhanced Content
                    </span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300"
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
                      📊 Diagram {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Related Files */}
            {entry.relatedFiles && entry.relatedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">📁 Related Files</h4>
                <div className="flex flex-wrap gap-2">
                  {entry.relatedFiles.map((file, index) => (
                    <a
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-900/50 transition-colors"
                    >
                      📎 File {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata sections moved from outside */}
            {entry.metadata && (
              <div className="space-y-3">
                {entry.metadata.learnings && entry.metadata.learnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">💡 Key Learnings</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                      {entry.metadata.learnings.map((learning, index) => (
                        <li key={index}>{learning}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {entry.metadata.nextSteps && entry.metadata.nextSteps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">🎯 Next Steps</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                      {entry.metadata.nextSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {entry.metadata.resources && entry.metadata.resources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">📚 Resources</h4>
                    <div className="flex flex-wrap gap-2">
                      {entry.metadata.resources.map((resource, index) => {
                        // Check if it's a URL or just a text reference
                        const isUrl = resource.startsWith('http') || resource.startsWith('www.');
                        const displayName = isUrl 
                          ? new URL(resource.startsWith('www.') ? `https://${resource}` : resource).hostname.replace('www.', '')
                          : resource;
                        
                        return isUrl ? (
                          <a
                            key={index}
                            href={resource.startsWith('www.') ? `https://${resource}` : resource}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-900/50 transition-colors"
                          >
                            🔗 {displayName}
                          </a>
                        ) : (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700"
                          >
                            🛠️ {resource}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'analysis' ? (
          // Analysis tab - show AI analysis
          <div className="space-y-6">
            {analysisError ? (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-300">❌ Analysis failed: {analysisError}</p>
                <button
                  onClick={fetchAnalysis}
                  className="mt-2 text-sm text-red-200 hover:text-red-100 underline"
                >
                  Try again
                </button>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Overall Assessment */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-2">📊 Overall Assessment</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-300">Average Score</p>
                      <p className="text-2xl font-bold text-blue-400">{analysis.overallAssessment?.averageScore}/10</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Confidence</p>
                      <p className="text-2xl font-bold text-green-400">{analysis.confidence}%</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{analysis.overallAssessment?.summary}</p>
                </div>

                {/* Key Strengths */}
                {analysis.overallAssessment?.keyStrengths && (
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-green-300 mb-2">💪 Key Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-green-200 text-sm">
                      {analysis.overallAssessment.keyStrengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Priority Improvements */}
                {analysis.overallAssessment?.priorityImprovements && (
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-yellow-300 mb-2">🎯 Priority Improvements</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-200 text-sm">
                      {analysis.overallAssessment.priorityImprovements.map((improvement: string, index: number) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.analysis && Object.entries(analysis.analysis).map(([category, details]: [string, any]) => (
                    <div key={category} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-md font-medium text-white mb-2 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-300">Score:</span>
                        <span className="ml-2 text-lg font-bold text-blue-400">{details.score}/10</span>
                      </div>
                      <p className="text-gray-300 text-xs mb-2">{details.feedback}</p>
                      {details.improvements && details.improvements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Improvements:</p>
                          <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                            {details.improvements.map((improvement: string, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recommended Actions */}
                {analysis.overallAssessment?.recommendedActions && (
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                    <h4 className="text-md font-medium text-blue-300 mb-2">🚀 Recommended Actions</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-200 text-sm">
                      {analysis.overallAssessment.recommendedActions.map((action: string, index: number) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 mt-2">Analyzing your journal entry...</p>
              </div>
            )}
          </div>
        ) : null}

        {/* AI Suggestions */}
        {entry.aiSuggestions && entry.aiSuggestions.length > 0 && (
          <div className="mt-6 border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-300">🤖 AI Suggestions</h4>
              <Button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="text-xs bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700"
              >
                {showAISuggestions ? 'Hide' : 'Show'} ({entry.aiSuggestions.length})
              </Button>
            </div>
            
            {showAISuggestions && (
              <div className="space-y-3">
                {entry.aiSuggestions.map((suggestion: AISuggestion) => (
                  <div key={suggestion.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{suggestionTypeIcons[suggestion.type]}</span>
                        <span className="text-sm font-medium text-gray-300 capitalize">
                          {suggestion.type.replace('-', ' ')}
                        </span>
                        <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% confidence
                        </span>
                        <span className={`text-xs ${getComplexityColor(suggestion.implementationComplexity || 'medium')}`}>
                          {suggestion.implementationComplexity} complexity
                        </span>
                      </div>
                      <Button
                        onClick={() => onMarkSuggestionImplemented(suggestion.id)}
                        className="text-xs bg-green-600 hover:bg-green-700"
                      >
                        ✅ Mark Done
                      </Button>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">{suggestion.suggestion}</p>
                    <p className="text-gray-400 text-xs mb-2">{suggestion.reasoning}</p>
                    
                    {suggestion.estimatedTimeToImplement && (
                      <p className="text-gray-500 text-xs">
                        ⏱️ Estimated time: {suggestion.estimatedTimeToImplement}
                      </p>
                    )}
                    
                    {suggestion.resources && suggestion.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {suggestion.resources.map((resource, index) => (
                          <a
                            key={index}
                            href={resource}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-900/50 transition-colors"
                          >
                            📖 Resource
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
