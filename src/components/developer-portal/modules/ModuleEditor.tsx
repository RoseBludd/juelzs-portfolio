"use client";

import {
  IconX,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconPlayerPlay,
  IconPlayerPause,
  IconCheckbox,
  IconEdit,
  IconDeviceFloppy,
  IconVideo,
  IconCode,
  IconBolt,
  IconTarget,
  IconFlag,
  IconPlus,
  IconCopy,
  IconTrash,
  IconFileText
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface ModuleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  module: any;
  onSave: () => void;
}

interface PreCondition {
  id: string;
  description: string;
  completed: boolean;
}

interface PostCondition {
  id: string;
  description: string;
  verified: boolean;
}

interface CodeSnippet {
  id: string;
  language: string;
  code: string;
  description: string;
}

const PROGRAMMING_LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'html', 'css', 'scss', 'sql', 
  'python', 'bash', 'json', 'yaml', 'markdown', 'php', 'java', 'go'
];

export const ModuleEditor = ({ isOpen, onClose, module, onSave }: ModuleEditorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    status: module?.status || 'pending',
    completion_percentage: module?.completion_percentage || 0,
    file_path: module?.file_path || '',
    url: module?.url || '',
    tags: Array.isArray(module?.tags) ? module.tags.join(', ') : '',
    loom_video_url: module?.metadata?.loom_video_url || '',
    implementationNotes: module?.metadata?.implementationNotes || '',
    pre_conditions: module?.metadata?.pre_conditions || [],
    post_conditions: module?.metadata?.post_conditions || [],
    effort_estimate: module?.metadata?.effort_estimate || 1,
    complexity_score: module?.metadata?.complexity_score || 1,
    business_value: module?.metadata?.business_value || 1,
    code_snippets: module?.metadata?.code_snippets || []
  });

  const [newPreCondition, setNewPreCondition] = useState('');
  const [newPostCondition, setNewPostCondition] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: IconClock, color: 'text-yellow-400' },
    { value: 'in_progress', label: 'In Progress', icon: IconPlayerPlay, color: 'text-blue-400' },
    { value: 'completed', label: 'Completed', icon: IconCheck, color: 'text-green-400' },
    { value: 'blocked', label: 'Blocked', icon: IconAlertTriangle, color: 'text-red-400' },
    { value: 'on_hold', label: 'On Hold', icon: IconPlayerPause, color: 'text-orange-400' }
  ];

  const addPreCondition = () => {
    if (!newPreCondition.trim()) return;
    const condition: PreCondition = {
      id: Date.now().toString(),
      description: newPreCondition.trim(),
      completed: false
    };
    setFormData({
      ...formData,
      pre_conditions: [...formData.pre_conditions, condition]
    });
    setNewPreCondition('');
  };

  const addPostCondition = () => {
    if (!newPostCondition.trim()) return;
    const condition: PostCondition = {
      id: Date.now().toString(),
      description: newPostCondition.trim(),
      verified: false
    };
    setFormData({
      ...formData,
      post_conditions: [...formData.post_conditions, condition]
    });
    setNewPostCondition('');
  };

  const togglePreCondition = (id: string) => {
    setFormData({
      ...formData,
      pre_conditions: formData.pre_conditions.map(pc =>
        pc.id === id ? { ...pc, completed: !pc.completed } : pc
      )
    });
  };

  const togglePostCondition = (id: string) => {
    setFormData({
      ...formData,
      post_conditions: formData.post_conditions.map(pc =>
        pc.id === id ? { ...pc, verified: !pc.verified } : pc
      )
    });
  };

  const removePreCondition = (id: string) => {
    setFormData({
      ...formData,
      pre_conditions: formData.pre_conditions.filter(pc => pc.id !== id)
    });
  };

  const removePostCondition = (id: string) => {
    setFormData({
      ...formData,
      post_conditions: formData.post_conditions.filter(pc => pc.id !== id)
    });
  };

  // Code snippet functions
  const addCodeSnippet = () => {
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      language: 'typescript',
      code: '',
      description: ''
    };
    setFormData({
      ...formData,
      code_snippets: [...formData.code_snippets, newSnippet]
    });
  };

  const updateCodeSnippet = (id: string, field: keyof CodeSnippet, value: string) => {
    setFormData({
      ...formData,
      code_snippets: formData.code_snippets.map(snippet =>
        snippet.id === id ? { ...snippet, [field]: value } : snippet
      )
    });
  };

  const removeCodeSnippet = (id: string) => {
    setFormData({
      ...formData,
      code_snippets: formData.code_snippets.filter(snippet => snippet.id !== id)
    });
  };

  const copyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const calculateProgress = () => {
    const preConditionsCompleted = formData.pre_conditions.filter(pc => pc.completed).length;
    const postConditionsVerified = formData.post_conditions.filter(pc => pc.verified).length;
    const totalConditions = formData.pre_conditions.length + formData.post_conditions.length;
    
    if (totalConditions === 0) return formData.completion_percentage;
    
    const conditionsProgress = ((preConditionsCompleted + postConditionsVerified) / totalConditions) * 100;
    return Math.round(conditionsProgress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const calculatedProgress = calculateProgress();
      const finalStatus = calculatedProgress === 100 ? 'completed' : formData.status;

      const response = await fetch(`/api/modules/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: finalStatus,
          completion_percentage: calculatedProgress,
          file_path: formData.file_path.trim(),
          url: formData.url.trim(),
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          metadata: {
            ...module.metadata,
            loom_video_url: formData.loom_video_url.trim(),
            implementationNotes: formData.implementationNotes.trim(),
            pre_conditions: formData.pre_conditions,
            post_conditions: formData.post_conditions,
            effort_estimate: formData.effort_estimate,
            complexity_score: formData.complexity_score,
            business_value: formData.business_value,
            code_snippets: formData.code_snippets.filter(snippet => snippet.code.trim()),
            last_updated: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        // Show detailed success message with what the developer accomplished
        if (responseData.developerSummary) {
          toast.success(responseData.developerSummary, {
            duration: 6000, // Show longer for detailed message
          });
        } else {
          toast.success(responseData.message || 'Module updated successfully!');
        }
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  if (!isOpen) return null;

  const progress = calculateProgress();
  const statusInfo = getStatusInfo(formData.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Edit Module</h2>
              <p className="text-sm text-gray-400">Track progress and manage module completion</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <IconX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            {/* Status and Progress */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Status & Progress</h3>
                <div className="flex items-center gap-2">
                  <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Manual Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.completion_percentage}
                    onChange={(e) => setFormData({...formData, completion_percentage: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Calculated Progress
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-green-400 font-medium text-sm">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Module Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-md p-3 text-sm"
                  placeholder="Module name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">File Path</label>
                <input
                  type="text"
                  value={formData.file_path}
                  onChange={(e) => setFormData({...formData, file_path: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-md p-3 text-sm"
                  placeholder="src/components/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-md p-3 text-sm h-24 resize-none"
                placeholder="Describe what this module does..."
              />
            </div>

            {/* Implementation Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <IconFileText className="w-4 h-4 inline mr-1" />
                Implementation Notes
              </label>
              <textarea
                value={formData.implementationNotes}
                onChange={(e) => setFormData({...formData, implementationNotes: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-md p-3 text-sm h-24 resize-none"
                placeholder="Any important implementation details, challenges overcome, or notes for future reference..."
              />
            </div>

            {/* URLs and Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <IconVideo className="w-4 h-4 inline mr-1" />
                  Loom Video URL
                </label>
                <input
                  type="url"
                  value={formData.loom_video_url}
                  onChange={(e) => setFormData({...formData, loom_video_url: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-md p-3 text-sm"
                  placeholder="https://loom.com/share/..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <IconCode className="w-4 h-4 inline mr-1" />
                  Documentation URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-md p-3 text-sm"
                  placeholder="https://docs.example.com/..."
                />
              </div>
            </div>

            {/* Module Metrics */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">Module Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <IconBolt className="w-4 h-4 inline mr-1" />
                    Effort (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.effort_estimate}
                    onChange={(e) => setFormData({...formData, effort_estimate: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <IconTarget className="w-4 h-4 inline mr-1" />
                    Complexity (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.complexity_score}
                    onChange={(e) => setFormData({...formData, complexity_score: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <IconFlag className="w-4 h-4 inline mr-1" />
                    Business Value (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.business_value}
                    onChange={(e) => setFormData({...formData, business_value: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Pre-Conditions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">
                <IconCheckbox className="w-5 h-5 inline mr-2" />
                Pre-Conditions ({formData.pre_conditions.filter(pc => pc.completed).length}/{formData.pre_conditions.length})
              </h3>
              
              <div className="space-y-2 mb-4">
                {formData.pre_conditions.map((condition) => (
                  <div key={condition.id} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
                    <button
                      type="button"
                      onClick={() => togglePreCondition(condition.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        condition.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-400 hover:border-green-400'
                      }`}
                    >
                      {condition.completed && <IconCheck size={12} />}
                    </button>
                    <span className={`flex-1 text-sm ${condition.completed ? 'text-green-400 line-through' : 'text-white'}`}>
                      {condition.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePreCondition(condition.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPreCondition}
                  onChange={(e) => setNewPreCondition(e.target.value)}
                  placeholder="Add pre-condition..."
                  className="flex-1 bg-gray-700 text-white rounded-md p-2 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreCondition())}
                />
                <button
                  type="button"
                  onClick={addPreCondition}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Post-Conditions */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-4">
                <IconFlag className="w-5 h-5 inline mr-2" />
                Post-Conditions ({formData.post_conditions.filter(pc => pc.verified).length}/{formData.post_conditions.length})
              </h3>
              
              <div className="space-y-2 mb-4">
                {formData.post_conditions.map((condition) => (
                  <div key={condition.id} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
                    <button
                      type="button"
                      onClick={() => togglePostCondition(condition.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        condition.verified 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-400 hover:border-green-400'
                      }`}
                    >
                      {condition.verified && <IconCheck size={12} />}
                    </button>
                    <span className={`flex-1 text-sm ${condition.verified ? 'text-green-400 line-through' : 'text-white'}`}>
                      {condition.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePostCondition(condition.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <IconX size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPostCondition}
                  onChange={(e) => setNewPostCondition(e.target.value)}
                  placeholder="Add post-condition..."
                  className="flex-1 bg-gray-700 text-white rounded-md p-2 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPostCondition())}
                />
                <button
                  type="button"
                  onClick={addPostCondition}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Code Snippets */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  <IconCode className="w-5 h-5 inline mr-2" />
                  Code Snippets ({formData.code_snippets.length})
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    addCodeSnippet();
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center gap-1"
                >
                  <IconPlus size={14} />
                  Add Snippet
                </button>
              </div>

              {formData.code_snippets.length === 0 ? (
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">No code snippets added yet</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      addCodeSnippet();
                    }}
                    className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                  >
                    Add Your First Code Snippet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.code_snippets.map((snippet, index) => (
                    <div key={snippet.id} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-white">Snippet {index + 1}</h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              copyCodeSnippet(snippet.code);
                            }}
                            className="p-1 text-gray-400 hover:text-white"
                            title="Copy code"
                          >
                            <IconCopy size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              removeCodeSnippet(snippet.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400"
                            title="Remove snippet"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Language</label>
                          <select
                            value={snippet.language}
                            onChange={(e) => updateCodeSnippet(snippet.id, 'language', e.target.value)}
                            className="w-full bg-gray-700 text-white rounded p-2 text-sm"
                          >
                            {PROGRAMMING_LANGUAGES.map(lang => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Description</label>
                          <input
                            type="text"
                            value={snippet.description}
                            onChange={(e) => updateCodeSnippet(snippet.id, 'description', e.target.value)}
                            className="w-full bg-gray-700 text-white rounded p-2 text-sm"
                            placeholder="What does this code do?"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Code</label>
                        <textarea
                          value={snippet.code}
                          onChange={(e) => updateCodeSnippet(snippet.id, 'code', e.target.value)}
                          className="w-full bg-gray-900 text-green-400 rounded p-3 text-sm font-mono h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Paste your code here..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-md p-3 text-sm"
                placeholder="react, typescript, component, ui..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-700 flex-shrink-0">
            <div className="text-sm text-gray-400">
              Progress calculated from conditions: {progress}%
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy size={16} />
                    Save Module
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 