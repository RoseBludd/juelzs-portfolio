'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

interface Module {
  id: string;
  name: string;
  task_id: string;
  task_title?: string;
  status: string;
  module_type: string;
}

interface SubmissionFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PROGRAMMING_LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'html', 'css', 'scss', 'sql', 
  'python', 'bash', 'json', 'yaml', 'markdown', 'php', 'java', 'go'
];

export default function SubmissionForm({ onSuccess, onError }: SubmissionFormProps = {}) {
  const router = useRouter();
  const [submissionType, setSubmissionType] = useState<'file' | 'snippet'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [moduleId, setModuleId] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Code snippet states
  const [codeSnippet, setCodeSnippet] = useState({
    language: 'typescript',
    code: '',
    description: ''
  });

  // Load available modules on component mount
  useEffect(() => {
    loadAvailableModules();
  }, []);

  const loadAvailableModules = async () => {
    try {
      setModulesLoading(true);
      const response = await fetch('/api/developer/modules');
      
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      } else {
        console.error('Failed to load modules:', response.status);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getFileExtension = (language: string) => {
    const extensions: { [key: string]: string } = {
      'typescript': 'ts',
      'javascript': 'js',
      'tsx': 'tsx',
      'jsx': 'jsx',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
      'python': 'py',
      'bash': 'sh',
      'json': 'json',
      'yaml': 'yml',
      'markdown': 'md',
      'php': 'php',
      'java': 'java',
      'go': 'go'
    };
    return extensions[language] || 'txt';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submissionType === 'file') {
      if (!file) {
        setError('Please provide a code file');
        return;
      }
    } else {
      if (!codeSnippet.code.trim()) {
        setError('Please enter your code snippet');
        return;
      }
      if (!codeSnippet.description.trim()) {
        setError('Please provide a description for your code');
        return;
      }
    }

    setLoading(true);
    setError('');
    setFeedback('');
    
    try {
      let fileToSubmit = file;
      
      // For code snippets, create a temporary file
      if (submissionType === 'snippet') {
        const blob = new Blob([codeSnippet.code], { type: 'text/plain' });
        const fileName = `code-snippet.${getFileExtension(codeSnippet.language)}`;
        fileToSubmit = new File([blob], fileName, { type: 'text/plain' });
      }
      
      const formData = new FormData();
      formData.append('file', fileToSubmit!);
      if (moduleId) {
        formData.append('moduleId', moduleId);
      }
      
      // Combine descriptions for snippets
      const finalDescription = submissionType === 'snippet' 
        ? `${description || 'Code snippet submission'} (Language: ${codeSnippet.language}, Snippet: ${codeSnippet.description})`
        : description;
        
      if (finalDescription) {
        formData.append('description', finalDescription);
      }
      if (version) {
        formData.append('version', version);
      }
      
      const response = await fetch('/api/developer/submit-code', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit code');
      }
      
      // Handle successful submission
      if (data.passed) {
        if (onSuccess) {
          // If we have a success callback (modal mode), call it
          onSuccess();
        } else {
          // If no callback (standalone page mode), navigate to success page
          const params = new URLSearchParams({
            score: data.score.toString(),
            type: data.submission.type,
            ...(data.submission.module_name && { module: data.submission.module_name })
          });
          
          router.push(`/developer/submit/success?${params.toString()}`);
        }
      } else {
        const errorMessage = data.feedback || 'Your submission has been received but did not pass all requirements. Please review the feedback and try again.';
        setFeedback(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Module Selection */}
        <div>
          <label htmlFor="module" className="block text-sm font-medium text-gray-200 mb-2">
            Select Module (Optional)
          </label>
          <div className="relative">
            {modulesLoading ? (
              <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400">
                Loading your modules...
              </div>
            ) : (
              <select
                id="module"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">General Code Submission</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name} ({module.module_type})
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Select a module to associate your code submission with a specific task module, or leave empty for a general submission.
          </p>
        </div>

        {/* Submission Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-3">
            Submission Type *
          </label>
          <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setSubmissionType('file')}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                submissionType === 'file'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType('snippet')}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                submissionType === 'snippet'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Code Snippet
            </button>
          </div>
        </div>

        {submissionType === 'file' ? (
          /* File Upload Form */
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-200 mb-2">
              Code File *
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required={submissionType === 'file'}
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                       file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.html,.css,.json,.xml,.sql,.sh,.ps1,.vue,.svelte"
            />
            <p className="mt-2 text-sm text-gray-400">
              Accepted file types: .js, .jsx, .ts, .tsx, .py, .java, .c, .cpp, .cs, .go, .rb, .php, .html, .css, .json, .xml, .sql, .sh, .ps1, .vue, .svelte
            </p>
          </div>
        ) : (
          /* Code Snippet Form */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-200 mb-2">
                  Programming Language *
                </label>
                <select
                  id="language"
                  value={codeSnippet.language}
                  onChange={(e) => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required={submissionType === 'snippet'}
                >
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="snippetDescription" className="block text-sm font-medium text-gray-200 mb-2">
                  Code Description *
                </label>
                <input
                  id="snippetDescription"
                  type="text"
                  value={codeSnippet.description}
                  onChange={(e) => setCodeSnippet({ ...codeSnippet, description: e.target.value })}
                  placeholder="What does this code do?"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required={submissionType === 'snippet'}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="code" className="block text-sm font-medium text-gray-200">
                  Code *
                </label>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(codeSnippet.code)}
                  className="text-gray-400 hover:text-white p-1 text-sm"
                  title="Copy code"
                >
                  📋 Copy
                </button>
              </div>
              <textarea
                id="code"
                value={codeSnippet.code}
                onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
                placeholder="Paste your code here..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-green-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={12}
                required={submissionType === 'snippet'}
              />
              <p className="mt-2 text-sm text-gray-400">
                Paste your code here. The code will be automatically saved as a {codeSnippet.language} file.
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe what your code does, any challenges you faced, or implementation notes..."
          />
        </div>

        {/* Version */}
        {moduleId && (
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-200 mb-2">
              Version
            </label>
            <input
              id="version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="1.0.0"
            />
            <p className="mt-2 text-sm text-gray-400">
              Version number for this module submission (e.g., 1.0.0, 1.1.0, 2.0.0)
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {feedback && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-400">{feedback}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (submissionType === 'file' && !file) || (submissionType === 'snippet' && (!codeSnippet.code.trim() || !codeSnippet.description.trim()))}
          className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-colors ${
            loading || (submissionType === 'file' && !file) || (submissionType === 'snippet' && (!codeSnippet.code.trim() || !codeSnippet.description.trim()))
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            `Submit ${submissionType === 'file' ? 'File' : 'Code Snippet'}${moduleId ? ' to Module' : ''}`
          )}
        </button>
      </form>
    </div>
  );
} 