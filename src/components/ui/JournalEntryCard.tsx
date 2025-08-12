'use client';

import { useState } from 'react';
import Button from './Button';
import { JournalEntry, AISuggestion } from '@/services/journal.service';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onMarkSuggestionImplemented: (suggestionId: string) => void;
}

const categoryColors = {
  architecture: 'bg-blue-900/30 text-blue-300 border-blue-700',
  decision: 'bg-purple-900/30 text-purple-300 border-purple-700',
  reflection: 'bg-green-900/30 text-green-300 border-green-700',
  planning: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  'problem-solving': 'bg-red-900/30 text-red-300 border-red-700',
  milestone: 'bg-indigo-900/30 text-indigo-300 border-indigo-700'
};

const categoryIcons = {
  architecture: '🏗️',
  decision: '🤔',
  reflection: '💭',
  planning: '📅',
  'problem-solving': '🔧',
  milestone: '🎯'
};

const suggestionTypeIcons = {
  architecture: '🏛️',
  optimization: '⚡',
  'best-practice': '✅',
  'risk-assessment': '⚠️',
  'next-steps': '🎯'
};

export default function JournalEntryCard({ entry, onEdit, onDelete, onMarkSuggestionImplemented }: JournalEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

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

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[entry.category]}`}>
                {categoryIcons[entry.category]} {entry.category}
              </span>
              {entry.projectName && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                  💼 {entry.projectName}
                </span>
              )}
              {entry.aiSuggestions && entry.aiSuggestions.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700">
                  🤖 {entry.aiSuggestions.length} AI Suggestion{entry.aiSuggestions.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">{entry.title}</h3>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
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
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm bg-gray-700 hover:bg-gray-600"
            >
              {isExpanded ? '👁️ Collapse' : '👁️ Expand'}
            </Button>
            <Button
              onClick={() => onEdit(entry)}
              className="text-sm bg-blue-600 hover:bg-blue-700"
            >
              ✏️ Edit
            </Button>
            <Button
              onClick={() => onDelete(entry.id)}
              className="text-sm bg-red-600 hover:bg-red-700"
            >
              🗑️ Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 whitespace-pre-wrap">
            {isExpanded ? entry.content : truncateContent(entry.content)}
          </p>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
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
          <div className="mt-4">
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
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">📁 Related Files</h4>
            <div className="flex flex-wrap gap-2">
              {entry.relatedFiles.map((file, index) => (
                <a
                  key={index}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 transition-colors"
                >
                  📄 {file.split('/').pop() || `File ${index + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {entry.metadata && isExpanded && (
          <div className="mt-4 space-y-3">
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
                  {entry.metadata.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-900/50 transition-colors"
                    >
                      🔗 Resource {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
