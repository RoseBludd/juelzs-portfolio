"use client";

import {
  IconX,
  IconPlus,
  IconTag,
  IconCode,
  IconApi,
  IconComponents,
  IconLayout,
  IconTestPipe,
  IconDatabase,
  IconSettings,
  IconTool,
  IconPalette,
  IconFileText,
  IconCopy,
  IconTrash
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import { TagInput } from "@/components/ui/TagInput";

interface ModuleType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

interface CodeSnippet {
  id: string;
  language: string;
  code: string;
  description: string;
}

interface ModuleCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  moduleTypes: ModuleType[];
  onSuccess: () => void;
}

const MODULE_ICONS: { [key: string]: any } = {
  'function': IconCode,
  'api': IconApi,
  'component': IconComponents,
  'layout': IconLayout,
  'test': IconTestPipe,
  'database': IconDatabase,
  'settings': IconSettings,
  'tool': IconTool,
  'palette': IconPalette,
  'file-text': IconFileText
};

const PROGRAMMING_LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'html', 'css', 'scss', 'sql', 
  'python', 'bash', 'json', 'yaml', 'markdown', 'php', 'java', 'go'
];

export const ModuleCreator = ({
  isOpen,
  onClose,
  taskId,
  moduleTypes,
  onSuccess
}: ModuleCreatorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    moduleTypeId: '',
    filePath: '',
    tags: '',
    implementationNotes: '',
    codeSnippets: [] as CodeSnippet[],
    url: ''
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        description: '',
        moduleTypeId: '',
        filePath: '',
        tags: '',
        implementationNotes: '',
        codeSnippets: [],
        url: ''
      });
    }
  }, [isOpen]);

  const addCodeSnippet = () => {
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      language: 'typescript',
      code: '',
      description: ''
    };
    setFormData({
      ...formData,
      codeSnippets: [...formData.codeSnippets, newSnippet]
    });
  };

  const updateCodeSnippet = (id: string, field: keyof CodeSnippet, value: string) => {
    setFormData({
      ...formData,
      codeSnippets: formData.codeSnippets.map(snippet =>
        snippet.id === id ? { ...snippet, [field]: value } : snippet
      )
    });
  };

  const removeCodeSnippet = (id: string) => {
    setFormData({
      ...formData,
      codeSnippets: formData.codeSnippets.filter(snippet => snippet.id !== id)
    });
  };

  const copyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.moduleTypeId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/tasks/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          moduleTypeId: formData.moduleTypeId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          filePath: formData.filePath.trim(),
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          metadata: {
            implementationNotes: formData.implementationNotes,
            codeSnippets: formData.codeSnippets.filter(snippet => snippet.code.trim()),
            url: formData.url.trim()
          }
        })
      });

      if (response.ok) {
        toast.success('Module created successfully!');
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create module');
      }
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModuleIcon = (iconName: string) => {
    const IconComponent = MODULE_ICONS[iconName] || IconCode;
    return IconComponent;
  };

  const selectedModuleType = moduleTypes.find(mt => mt.id === formData.moduleTypeId);

  // Step validation
  const canProceedToStep2 = formData.name.trim() && formData.moduleTypeId;
  const canProceedToStep3 = canProceedToStep2 && formData.description.trim();
  const canSubmit = canProceedToStep3; // Can always submit from step 3, even without code snippets

  const nextStep = () => {
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3);
    } else if (currentStep === 1) {
      toast.error('Please fill in module name and select a type');
    } else if (currentStep === 2) {
      toast.error('Please add a description');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Document Completed Work</h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${
              currentStep >= 1 ? 'text-blue-400' : 'text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm">Basic Info</span>
            </div>
            <div className={`h-px flex-1 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-600'
            }`} />
            <div className={`flex items-center gap-2 ${
              currentStep >= 2 ? 'text-blue-400' : 'text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm">What You Built</span>
            </div>
            <div className={`h-px flex-1 ${
              currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-600'
            }`} />
            <div className={`flex items-center gap-2 ${
              currentStep >= 3 ? 'text-blue-400' : 'text-gray-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm">Code & Details</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    What did you build? <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., User Authentication Component, Payment API Endpoint"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    What type of module is this? <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {moduleTypes.map((type) => {
                      const IconComponent = getModuleIcon(type.icon);
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData({...formData, moduleTypeId: type.id});
                          }}
                          className={`p-4 rounded-lg border transition-all ${
                            formData.moduleTypeId === type.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <IconComponent 
                              size={24} 
                              style={{ color: type.color }}
                            />
                            <span className="text-sm text-white font-medium">
                              {type.name}
                            </span>
                            <span className="text-xs text-gray-400 text-center">
                              {type.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    File/Folder Path
                  </label>
                  <input
                    type="text"
                    value={formData.filePath}
                    onChange={(e) => setFormData({...formData, filePath: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="src/components/auth/LoginForm.tsx"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Where is this module located in the codebase?
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Description & Tags */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    What does this module do? <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                    placeholder="Describe what this module accomplishes, its key features, and how it works..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Tags (comma separated)
                  </label>
                  <TagInput
                    value={formData.tags}
                    onChange={(value) => setFormData({...formData, tags: value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add tags to make this module easily searchable
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/video"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add a URL to a video or external resource related to this module
                  </p>
                </div>

                {/* Preview */}
                {selectedModuleType && formData.name && formData.description && (
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedModuleType.color}20` }}>
                          {(() => {
                            const IconComponent = getModuleIcon(selectedModuleType.icon);
                            return <IconComponent size={20} style={{ color: selectedModuleType.color }} />;
                          })()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{formData.name}</div>
                          <div className="text-xs text-gray-400">{selectedModuleType.name}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-3">{formData.description}</p>
                    {formData.filePath && (
                      <code className="text-xs text-green-400 bg-gray-900/50 px-2 py-1 rounded mt-2 block">
                        {formData.filePath}
                      </code>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Code Snippets & Implementation Notes */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Implementation Notes
                  </label>
                  <textarea
                    value={formData.implementationNotes}
                    onChange={(e) => setFormData({...formData, implementationNotes: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    placeholder="Any important implementation details, challenges overcome, or notes for future reference..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-400">
                      Code Snippets
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        addCodeSnippet();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
                    >
                      <IconPlus size={14} />
                      Add Snippet
                    </button>
                  </div>

                  {formData.codeSnippets.length === 0 ? (
                    <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                      <p className="text-gray-400 text-sm">No code snippets added yet</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          addCodeSnippet();
                        }}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Add Your First Code Snippet
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.codeSnippets.map((snippet, index) => (
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
                              className="w-full bg-gray-900 text-green-400 rounded p-3 text-sm font-mono h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Paste your code here..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final Preview */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Final Preview</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {selectedModuleType && (
                        <>
                          <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${selectedModuleType.color}20` }}>
                            {(() => {
                              const IconComponent = getModuleIcon(selectedModuleType.icon);
                              return <IconComponent size={16} style={{ color: selectedModuleType.color }} />;
                            })()}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{formData.name}</div>
                            <div className="text-xs text-gray-400">{selectedModuleType.name}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{formData.description}</p>
                    {formData.filePath && (
                      <code className="text-xs text-green-400 bg-gray-900/50 px-2 py-1 rounded block">
                        {formData.filePath}
                      </code>
                    )}
                    {formData.tags && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.split(',').map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      {formData.codeSnippets.filter(s => s.code.trim()).length} code snippet(s)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-700">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    prevStep();
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    nextStep();
                  }}
                  className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    (currentStep === 1 && canProceedToStep2) || (currentStep === 2 && canProceedToStep3)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <IconPlus size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    canSubmit && !isSubmitting
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconCode size={16} />
                      Save Component
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 