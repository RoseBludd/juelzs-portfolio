'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import FileUploadComponent from './FileUploadComponent';
import TagAutocomplete from './TagAutocomplete';
import { JournalEntry } from '@/services/journal.service';

type JournalCategory = 'architecture' | 'decision' | 'reflection' | 'planning' | 'problem-solving' | 'milestone';

interface JournalEntryModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryData: any) => Promise<void>;
  isCreating: boolean;
}

const categories = [
  { value: 'architecture', label: '🏗️ Architecture', description: 'System design and architectural decisions' },
  { value: 'decision', label: '🤔 Decision', description: 'Important project or technical decisions' },
  { value: 'reflection', label: '💭 Reflection', description: 'Retrospective thoughts and analysis' },
  { value: 'planning', label: '📅 Planning', description: 'Future planning and roadmaps' },
  { value: 'problem-solving', label: '🔧 Problem Solving', description: 'Solutions to technical challenges' },
  { value: 'milestone', label: '🎯 Milestone', description: 'Important achievements and milestones' }
];

export default function JournalEntryModal({ entry, isOpen, onClose, onSave, isCreating }: JournalEntryModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'architecture' as JournalCategory,
    projectId: '',
    projectName: '',
    tags: [] as string[],
    architectureDiagrams: [] as string[],
    relatedFiles: [] as string[],
    metadata: {
      difficulty: 5,
      impact: 5,
      learnings: [] as string[],
      nextSteps: [] as string[],
      resources: [] as string[]
    }
  });
  const [currentTag, setCurrentTag] = useState('');
  const [currentLearning, setCurrentLearning] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [currentResource, setCurrentResource] = useState('');
  const [currentDiagram, setCurrentDiagram] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCategoryAnalysis, setAiCategoryAnalysis] = useState<any>(null);
  const [autoReminders, setAutoReminders] = useState(true);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [aiProgress, setAiProgress] = useState('');

  useEffect(() => {
    if (entry && !isCreating) {
      setFormData({
        title: entry.title,
        content: entry.content,
        category: entry.category,
        projectId: entry.projectId || '',
        projectName: entry.projectName || '',
        tags: entry.tags || [],
        architectureDiagrams: entry.architectureDiagrams || [],
        relatedFiles: entry.relatedFiles || [],
        metadata: {
          difficulty: entry.metadata?.difficulty || 5,
          impact: entry.metadata?.impact || 5,
          learnings: entry.metadata?.learnings || [],
          nextSteps: entry.metadata?.nextSteps || [],
          resources: entry.metadata?.resources || []
        }
      });
    } else if (isCreating) {
      setFormData({
        title: '',
        content: '',
        category: 'architecture' as JournalCategory,
        projectId: '',
        projectName: '',
        tags: [],
        architectureDiagrams: [],
        relatedFiles: [],
        metadata: {
          difficulty: 5,
          impact: 5,
          learnings: [],
          nextSteps: [],
          resources: []
        }
      });
    }
    setError(null);
    setAiCategoryAnalysis(null);
  }, [entry, isCreating, isOpen]);

  const analyzeEntry = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    try {
      setIsAnalyzing(true);
      const response = await fetch('/api/ai/categorize-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          projectId: formData.projectId,
          tags: formData.tags
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAiCategoryAnalysis(result.analysis);
          
          // Auto-apply AI suggestions if user wants
          if (result.analysis.suggestedCategory && result.analysis.suggestedCategory !== formData.category) {
            const shouldApply = confirm(
              `AI suggests category "${result.analysis.suggestedCategory}" instead of "${formData.category}". Apply this suggestion?`
            );
            if (shouldApply) {
              setFormData(prev => ({ ...prev, category: result.analysis.suggestedCategory }));
            }
          }
          
          // Suggest additional tags
          if (result.analysis.suggestedTags?.length > 0) {
            const newTags = result.analysis.suggestedTags.filter((tag: string) => !formData.tags.includes(tag));
            if (newTags.length > 0) {
              const shouldAddTags = confirm(
                `AI suggests adding these tags: ${newTags.join(', ')}. Add them?`
              );
              if (shouldAddTags) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, ...newTags] }));
              }
            }
          }

          // Auto-apply difficulty and impact scores if confidence is high
          if (result.analysis.autoScoring?.shouldAutoApply && result.analysis.autoScoring.confidence > 70) {
            const { difficulty, impact } = result.analysis.autoScoring;
            setFormData(prev => ({
              ...prev,
              metadata: {
                ...prev.metadata,
                difficulty: difficulty.score,
                impact: impact.score
              }
            }));
          } else if (result.analysis.autoScoring) {
            // Ask user if they want to apply the suggested scores
            const shouldApplyScores = confirm(
              `AI suggests:\n• Difficulty: ${result.analysis.autoScoring.difficulty.score}/10 - ${result.analysis.autoScoring.difficulty.reasoning}\n• Impact: ${result.analysis.autoScoring.impact.score}/10 - ${result.analysis.autoScoring.impact.reasoning}\n\nApply these scores?`
            );
            if (shouldApplyScores) {
              const { difficulty, impact } = result.analysis.autoScoring;
              setFormData(prev => ({
                ...prev,
                metadata: {
                  ...prev.metadata,
                  difficulty: difficulty.score,
                  impact: impact.score
                }
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoFillFromContent = async () => {
    if (!formData.content || formData.content.trim().length < 10) {
      setError('Please enter at least 10 characters of content for AI to analyze');
      return;
    }

    setIsAutoFilling(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/auto-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData.content,
          files: [...formData.architectureDiagrams, ...formData.relatedFiles],
          currentDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to auto-generate entry');
      }

      const data = await response.json();
      
      if (data.success && data.optimizedEntry) {
        const optimized = data.optimizedEntry;
        setFormData(prev => ({
          ...prev,
          title: optimized.title,
          category: optimized.category as JournalCategory,
          projectId: optimized.projectId || '',
          projectName: optimized.projectName || '',
          tags: optimized.tags || [],
          metadata: {
            difficulty: optimized.metadata.difficulty || 5,
            impact: optimized.metadata.impact || 5,
            learnings: optimized.metadata.learnings || [],
            nextSteps: optimized.metadata.nextSteps || [],
            resources: optimized.metadata.resources || []
          }
        }));
        
        setAiCategoryAnalysis(data.aiAnalysis);
        setShowManualFields(true); // Show all fields after AI fills them
      }
    } catch (error) {
      console.error('Error auto-filling entry:', error);
      setError('Failed to auto-generate entry with AI');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      let finalFormData = { ...formData };

      // If not in manual mode and has sufficient content, auto-fill with AI
      if (!showManualFields && formData.content.trim().length >= 10) {
        setIsAutoSubmitting(true);
        setAiProgress('🔍 Analyzing content...');
        
        try {
          const response = await fetch('/api/ai/auto-journal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: formData.content,
              files: [...formData.architectureDiagrams, ...formData.relatedFiles],
              currentDate: new Date().toISOString()
            }),
          });

          setAiProgress('⚡ Processing AI response...');

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.optimizedEntry) {
              setAiProgress('✨ Applying AI insights...');
              const optimized = data.optimizedEntry;
              finalFormData = {
                ...finalFormData,
                title: optimized.title || finalFormData.title || 'Untitled Entry',
                category: optimized.category || finalFormData.category,
                projectId: optimized.projectId || finalFormData.projectId,
                projectName: optimized.projectName || finalFormData.projectName,
                tags: optimized.tags || finalFormData.tags,
                metadata: {
                  difficulty: optimized.metadata.difficulty || finalFormData.metadata.difficulty,
                  impact: optimized.metadata.impact || finalFormData.metadata.impact,
                  learnings: optimized.metadata.learnings || finalFormData.metadata.learnings,
                  nextSteps: optimized.metadata.nextSteps || finalFormData.metadata.nextSteps,
                  resources: optimized.metadata.resources || finalFormData.metadata.resources
                }
              };
            }
          }
        } catch (aiError) {
          console.warn('AI auto-fill failed, proceeding with manual data:', aiError);
          setAiProgress('⚠️ AI failed, using defaults...');
          // Continue with manual data if AI fails
          if (!finalFormData.title.trim()) {
            finalFormData.title = 'Journal Entry - ' + new Date().toLocaleDateString();
          }
        }
        
        setAiProgress('💾 Saving entry...');
        setIsAutoSubmitting(false);
      } else {
        // Manual mode - validate title is provided
        if (!finalFormData.title.trim()) {
          setError('Title is required in manual mode');
          return;
        }
      }

      // Save the entry with auto-reminders enabled by default
      const savedFormData = { ...finalFormData, autoReminders: true };
      await onSave(savedFormData);
      
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save entry');
    } finally {
      setIsSaving(false);
      setIsAutoSubmitting(false);
      setAiProgress('');
    }
  };

  const addItem = (item: string, setter: (value: string) => void, array: string[], field: string) => {
    if (item.trim() && !array.includes(item.trim())) {
      if (field === 'tags') {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, item.trim()]
        }));
      } else if (field === 'architectureDiagrams') {
        setFormData(prev => ({
          ...prev,
          architectureDiagrams: [...prev.architectureDiagrams, item.trim()]
        }));
      } else if (field === 'relatedFiles') {
        setFormData(prev => ({
          ...prev,
          relatedFiles: [...prev.relatedFiles, item.trim()]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            [field]: [...(prev.metadata as any)[field], item.trim()]
          }
        }));
      }
      setter('');
    }
  };

  const removeItem = (index: number, field: string) => {
    if (field === 'tags') {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index)
      }));
    } else if (field === 'architectureDiagrams') {
      setFormData(prev => ({
        ...prev,
        architectureDiagrams: prev.architectureDiagrams.filter((_, i) => i !== index)
      }));
    } else if (field === 'relatedFiles') {
      setFormData(prev => ({
        ...prev,
        relatedFiles: prev.relatedFiles.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [field]: (prev.metadata as any)[field].filter((_: any, i: number) => i !== index)
        }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              {isCreating ? '📝 Create New Journal Entry' : '✏️ Edit Journal Entry'}
            </h2>
            <Button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white bg-transparent hover:bg-gray-700"
            >
              ✕
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Streamlined Content Entry */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Content * {!showManualFields && <span className="text-gray-500 text-xs">(AI will auto-fill title, category, tags, etc.)</span>}
                </label>
                <div className="flex gap-2">
                  {showManualFields && (
                    <Button
                      type="button"
                      onClick={() => setShowManualFields(false)}
                      className="text-xs bg-gray-600 hover:bg-gray-700"
                    >
                      ⬆️ Simple Mode
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => setShowManualFields(true)}
                    className="text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    ⚙️ Advanced
                  </Button>
                </div>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your journal entry content here. Be detailed about your decisions, thought process, and insights."
                required
              />
              
              {/* AI Analysis Results */}
              {aiCategoryAnalysis && (
                <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-300 mb-2">🤖 AI Analysis</h4>
                  
                  {aiCategoryAnalysis.templateRecommendation?.shouldUseTemplate && (
                    <div className="mb-2 p-2 bg-blue-900/20 border border-blue-700 rounded">
                      <p className="text-xs text-blue-300">
                        <strong>Template Suggestion:</strong> {aiCategoryAnalysis.templateRecommendation.templateName}
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        {aiCategoryAnalysis.templateRecommendation.reason}
                      </p>
                    </div>
                  )}
                  
                  {aiCategoryAnalysis.improvements && aiCategoryAnalysis.improvements.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-purple-300 font-medium">Suggestions:</p>
                      <ul className="text-xs text-purple-400 list-disc list-inside mt-1">
                        {aiCategoryAnalysis.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiCategoryAnalysis.autoScoring && (
                    <div className="mb-2 p-2 bg-green-900/20 border border-green-700 rounded">
                      <p className="text-xs text-green-300 font-medium mb-1">AI Assessment:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-green-400">Difficulty: {aiCategoryAnalysis.autoScoring.difficulty.score}/10</span>
                          <p className="text-green-500 text-xs">{aiCategoryAnalysis.autoScoring.difficulty.reasoning}</p>
                        </div>
                        <div>
                          <span className="text-green-400">Impact: {aiCategoryAnalysis.autoScoring.impact.score}/10</span>
                          <p className="text-green-500 text-xs">{aiCategoryAnalysis.autoScoring.impact.reasoning}</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Confidence: {aiCategoryAnalysis.autoScoring.confidence}%
                        {aiCategoryAnalysis.autoScoring.shouldAutoApply ? ' (Auto-applied)' : ' (Manual review needed)'}
                      </p>
                    </div>
                  )}

                  {aiCategoryAnalysis.structureAnalysis && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${aiCategoryAnalysis.structureAnalysis.hasContext ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        Context {aiCategoryAnalysis.structureAnalysis.hasContext ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 rounded ${aiCategoryAnalysis.structureAnalysis.hasDecision ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        Decision {aiCategoryAnalysis.structureAnalysis.hasDecision ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 rounded ${aiCategoryAnalysis.structureAnalysis.hasNextSteps ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        Next Steps {aiCategoryAnalysis.structureAnalysis.hasNextSteps ? '✓' : '✗'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags with Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <TagAutocomplete
                tags={formData.tags}
                onTagsChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
                placeholder="Add tags to organize your entry"
                maxTags={15}
              />
            </div>



            {/* Show Manual Fields Only When Requested */}
            {showManualFields && (
              <div className="space-y-6 border-t border-gray-700 pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">Manual Configuration</h3>
                  <p className="text-sm text-gray-400">Configure all fields manually or let AI handle them</p>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a descriptive title for your journal entry"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {categories.find(c => c.value === formData.category)?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Associated project name"
                    />
                  </div>
                </div>

                {/* Assessment Scores - Auto-detected or Manual */}
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">📊 Assessment Scores</h4>
                    {aiCategoryAnalysis?.autoScoring && (
                      <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                        🤖 AI Detected
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Difficulty (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.metadata.difficulty}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, difficulty: parseInt(e.target.value) }
                        }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Easy</span>
                        <span className="font-medium text-white">{formData.metadata.difficulty}</span>
                        <span>Hard</span>
                      </div>
                      {aiCategoryAnalysis?.autoScoring?.difficulty && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 {aiCategoryAnalysis.autoScoring.difficulty.reasoning}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Impact (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.metadata.impact}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, impact: parseInt(e.target.value) }
                        }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Low</span>
                        <span className="font-medium text-white">{formData.metadata.impact}</span>
                        <span>High</span>
                      </div>
                      {aiCategoryAnalysis?.autoScoring?.impact && (
                        <p className="text-xs text-gray-500 mt-1">
                          💡 {aiCategoryAnalysis.autoScoring.impact.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    💡 AI will automatically detect difficulty and impact
                  </p>
                </div>

                {/* Architecture Diagrams with Upload */}
                <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Architecture Diagrams
              </label>
              
              {/* File Upload for Diagrams */}
              <div className="mb-4">
                <FileUploadComponent
                  onFileUploaded={(file) => {
                    setFormData(prev => ({
                      ...prev,
                      architectureDiagrams: [...prev.architectureDiagrams, file.url]
                    }));
                  }}
                  onError={setError}
                  allowedCategories={['diagram', 'image']}
                  maxSize={25}
                />
              </div>

              {/* Manual URL Entry */}
              <div className="border-t border-gray-600 pt-4">
                <p className="text-xs text-gray-400 mb-2">Or add diagram URLs manually:</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={currentDiagram}
                    onChange={(e) => setCurrentDiagram(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    onClick={() => addItem(currentDiagram, setCurrentDiagram, formData.architectureDiagrams, 'architectureDiagrams')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add URL
                  </Button>
                </div>
              </div>

              {formData.architectureDiagrams.length > 0 && (
                <div className="space-y-1 mt-3">
                  {formData.architectureDiagrams.map((diagram, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                      <a
                        href={diagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 truncate"
                      >
                        📊 {diagram.split('/').pop() || `Diagram ${index + 1}`}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeItem(index, 'architectureDiagrams')}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Files with Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Related Files & Screenshots
              </label>
              
              {/* File Upload for Any File Type */}
              <div className="mb-4">
                <FileUploadComponent
                  onFileUploaded={(file) => {
                    setFormData(prev => ({
                      ...prev,
                      relatedFiles: [...prev.relatedFiles, file.url]
                    }));
                  }}
                  onError={setError}
                  allowedCategories={['document', 'code', 'screenshot', 'image']}
                  maxSize={50}
                />
              </div>

              {/* Manual Path/URL Entry */}
              <div className="border-t border-gray-600 pt-4">
                <p className="text-xs text-gray-400 mb-2">Or add file paths/URLs manually:</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentFile}
                    onChange={(e) => setCurrentFile(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="File path, URL, or code repository link"
                  />
                  <Button
                    type="button"
                    onClick={() => addItem(currentFile, setCurrentFile, formData.relatedFiles, 'relatedFiles')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Link
                  </Button>
                </div>
              </div>

              {formData.relatedFiles.length > 0 && (
                <div className="space-y-1 mt-3">
                  {formData.relatedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 truncate"
                      >
                        📄 {file.split('/').pop() || file}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeItem(index, 'relatedFiles')}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Learnings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key Learnings
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentLearning}
                  onChange={(e) => setCurrentLearning(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What did you learn from this?"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(currentLearning, setCurrentLearning, formData.metadata.learnings, 'learnings'))}
                />
                <Button
                  type="button"
                  onClick={() => addItem(currentLearning, setCurrentLearning, formData.metadata.learnings, 'learnings')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add
                </Button>
              </div>
              {formData.metadata.learnings.length > 0 && (
                <ul className="space-y-1">
                  {formData.metadata.learnings.map((learning, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                      <span className="text-sm text-gray-300">💡 {learning}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index, 'learnings')}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Next Steps */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Next Steps
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentStep}
                  onChange={(e) => setCurrentStep(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What should be done next?"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(currentStep, setCurrentStep, formData.metadata.nextSteps, 'nextSteps'))}
                />
                <Button
                  type="button"
                  onClick={() => addItem(currentStep, setCurrentStep, formData.metadata.nextSteps, 'nextSteps')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Add
                </Button>
              </div>
              {formData.metadata.nextSteps.length > 0 && (
                <ul className="space-y-1">
                  {formData.metadata.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                      <span className="text-sm text-gray-300">🎯 {step}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index, 'nextSteps')}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Resources */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resources
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={currentResource}
                  onChange={(e) => setCurrentResource(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://helpful-resource.com"
                />
                <Button
                  type="button"
                  onClick={() => addItem(currentResource, setCurrentResource, formData.metadata.resources, 'resources')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Add
                </Button>
              </div>
              {formData.metadata.resources.length > 0 && (
                <div className="space-y-1">
                  {formData.metadata.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                      <a
                        href={resource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 truncate"
                      >
                        🔗 {resource}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeItem(index, 'resources')}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auto-Reminder Settings */}
            <div className="border-t border-gray-600 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">
                  🔔 Auto-Reminders
                </label>
                <input
                  type="checkbox"
                  checked={autoReminders}
                  onChange={(e) => setAutoReminders(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                {autoReminders 
                  ? "Automatically create reminders from 'Next Steps' (due in 3 days)"
                  : "Next steps will not create automatic reminders"
                }
              </p>
            </div>
              </div>
            )}

            {/* File Upload Section - Always Visible */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Files & Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Architecture Diagrams
                  </label>
                  <FileUploadComponent
                    onFileUploaded={(file) => {
                      setFormData(prev => ({
                        ...prev,
                        architectureDiagrams: [...prev.architectureDiagrams, file.url]
                      }));
                    }}
                    acceptedTypes="image/*,.pdf,.svg"
                    category="diagram"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Related Files & Screenshots
                  </label>
                  <FileUploadComponent
                    onFileUploaded={(file) => {
                      setFormData(prev => ({
                        ...prev,
                        relatedFiles: [...prev.relatedFiles, file.url]
                      }));
                    }}
                    acceptedTypes="*"
                    category="document"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? (aiProgress || '💾 Saving...') : (isCreating ? '📝 Create Entry' : '💾 Save Changes')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
