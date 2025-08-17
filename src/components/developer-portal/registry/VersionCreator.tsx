"use client";

import { IconGitBranch, IconX, IconAlertTriangle, IconCheck, IconTag, IconPlus, IconFileText, IconCode } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface VersionCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  module: {
    id: string;
    name: string;
    current_version?: string;
  };
  currentUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  onVersionCreated: (version: string) => void;
}

export function VersionCreator({ 
  isOpen, 
  onClose, 
  module, 
  currentUser,
  onVersionCreated 
}: VersionCreatorProps) {
  const [formData, setFormData] = useState({
    version: '',
    description: '',
    changelog: '',
    isBreakingChange: false,
    tags: [] as string[],
    fileHash: '',
    codeContent: '',
    filePath: ''
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleClose = () => {
    setFormData({
      version: '',
      description: '',
      changelog: '',
      isBreakingChange: false,
      tags: [],
      fileHash: '',
      codeContent: '',
      filePath: ''
    });
    setNewTag('');
    setUploadedFile(null);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateVersion = (version: string) => {
    // Basic semantic versioning validation (X.Y.Z)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
  };

  const suggestNextVersion = () => {
    if (!module.current_version) {
      return '1.0.0';
    }

    const parts = module.current_version.split('.').map(Number);
    const [major, minor, patch] = parts;

    if (formData.isBreakingChange) {
      return `${major + 1}.0.0`;
    } else {
      return `${major}.${minor}.${patch + 1}`;
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Please log in to create versions');
      return;
    }

    if (!formData.version.trim()) {
      toast.error('Please enter a version number');
      return;
    }

    if (!validateVersion(formData.version)) {
      toast.error('Please use semantic versioning format (e.g., 1.0.0)');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description for this version');
      return;
    }

    if (!formData.codeContent.trim()) {
      toast.error('Please provide the code content for this version');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/registry/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          developerId: currentUser.id,
          version: formData.version.trim(),
          description: formData.description.trim(),
          changelog: formData.changelog.trim() || null,
          fileHash: formData.fileHash.trim() || null,
          isBreakingChange: formData.isBreakingChange,
          tags: formData.tags,
          codeContent: formData.codeContent,
          filePath: formData.filePath || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Version ${formData.version} created successfully!`);
        onVersionCreated(formData.version);
        handleClose();
      } else {
        toast.error(result.error || 'Failed to create version');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Failed to create version');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 1MB for code files)
    if (file.size > 1024 * 1024) {
      toast.error('File size must be less than 1MB');
      return;
    }

    // Check file type (only allow common code file extensions)
    const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.py', '.php', '.rb', '.go', '.rs', '.java', '.cpp', '.c', '.h', '.css', '.scss', '.html', '.json', '.xml', '.yaml', '.yml', '.md'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('Only code files are allowed');
      return;
    }

    try {
      const content = await file.text();
      setUploadedFile(file);
      setFormData(prev => ({
        ...prev,
        codeContent: content,
        filePath: file.name
      }));
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setFormData(prev => ({
      ...prev,
      codeContent: '',
      filePath: ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <IconGitBranch size={24} className="text-purple-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Create New Version</h2>
              <p className="text-sm text-gray-400">{module.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentUser ? (
            <div className="text-center py-8">
              <IconGitBranch size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Login Required</h3>
              <p className="text-gray-400">Please log in to create module versions</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current User Info */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-300 font-medium">Creating version as:</p>
                    <p className="text-blue-200">{currentUser.name}</p>
                  </div>
                </div>
              </div>

              {/* Current Version Context */}
              {module.current_version && (
                <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Current Version</h4>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-green-600 text-white rounded text-sm font-mono">
                      v{module.current_version}
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="px-2 py-1 bg-purple-600 text-white rounded text-sm font-mono">
                      v{formData.version || 'NEW'}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Version Number */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Version Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      required
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, version: suggestNextVersion() }))}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                    >
                      Suggest
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Use semantic versioning (Major.Minor.Patch)
                  </p>
                </div>

                {/* Breaking Change Toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                  <input
                    type="checkbox"
                    id="breakingChange"
                    checked={formData.isBreakingChange}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBreakingChange: e.target.checked }))}
                    className="rounded border-gray-500 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="breakingChange" className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <IconAlertTriangle size={16} className={formData.isBreakingChange ? 'text-red-400' : 'text-gray-400'} />
                    This is a breaking change
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what changed"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Changelog */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Changelog (Optional)
                  </label>
                  <textarea
                    value={formData.changelog}
                    onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
                    placeholder="Detailed list of changes, additions, and fixes..."
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tags (Optional)
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add a tag (e.g., feature, bugfix, hotfix)"
                        className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={addTag}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                      >
                        <IconPlus size={14} />
                        Add
                      </button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag, index) => (
                          <div key={index} className="flex items-center gap-1 px-2 py-1 bg-purple-600/30 border border-purple-600/50 rounded text-xs text-purple-200">
                            <IconTag size={10} />
                            <span>{tag}</span>
                            <button
                              onClick={() => removeTag(tag)}
                              className="text-purple-300 hover:text-white ml-1"
                            >
                              <IconX size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Content */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Updated Code Content *
                  </label>
                  
                  {/* File Upload Option */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="file"
                        id="codeFile"
                        onChange={handleFileUpload}
                        accept=".js,.jsx,.ts,.tsx,.vue,.py,.php,.rb,.go,.rs,.java,.cpp,.c,.h,.css,.scss,.html,.json,.xml,.yaml,.yml,.md"
                        className="hidden"
                      />
                      <label
                        htmlFor="codeFile"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <IconFileText size={16} />
                        Upload Code File
                      </label>
                      <span className="text-xs text-gray-400">or paste code below</span>
                    </div>
                    
                    {uploadedFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-700/50 rounded text-sm">
                        <IconFileText size={16} className="text-green-400" />
                        <span className="text-green-300">{uploadedFile.name}</span>
                        <span className="text-green-400">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                        <button
                          onClick={clearFile}
                          className="ml-auto text-green-400 hover:text-white"
                        >
                          <IconX size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Code Entry */}
                  <div className="space-y-2">
                    {formData.filePath && (
                      <div className="text-sm">
                        <span className="text-gray-400">File:</span>
                        <span className="text-white ml-1 font-mono">{formData.filePath}</span>
                      </div>
                    )}
                    
                    <textarea
                      value={formData.codeContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, codeContent: e.target.value }))}
                      placeholder={uploadedFile ? "Code content loaded from file (you can edit it here)" : "Paste your updated code here..."}
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
                      rows={12}
                      required
                    />
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{formData.codeContent.split('\n').length} lines</span>
                      <span>{formData.codeContent.length} characters</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Upload a file or paste your modified code. This will be the new version content.
                  </p>
                </div>

                {/* File Path Override */}
                {!uploadedFile && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      File Path (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.filePath}
                      onChange={(e) => setFormData(prev => ({ ...prev, filePath: e.target.value }))}
                      placeholder="e.g., src/components/MyComponent.tsx"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Specify the file path if entering code manually
                    </p>
                  </div>
                )}

                {/* File Hash (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    File Hash (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.fileHash}
                    onChange={(e) => setFormData(prev => ({ ...prev, fileHash: e.target.value }))}
                    placeholder="SHA-256 hash of the modified file(s)"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    For version integrity verification (optional)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentUser && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.version.trim() || !formData.description.trim() || isSubmitting}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <IconCheck size={16} />
                  Create Version
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 