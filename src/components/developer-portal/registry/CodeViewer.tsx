"use client";

import { IconCode, IconCopy, IconDownload, IconFileText, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface CodeViewerProps {
  version: {
    id: string;
    version: string;
    description: string;
    code_content?: string;
    file_paths?: string[];
    developer_name: string;
    created_at: string;
  };
}

export function CodeViewer({ version }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!version.code_content) return;
    
    try {
      await navigator.clipboard.writeText(version.code_content);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const downloadCode = () => {
    if (!version.code_content) return;

    const fileName = version.file_paths?.[0] || `module-v${version.version}.txt`;
    const blob = new Blob([version.code_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Code downloaded');
  };

  const getLanguageFromPath = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': case 'jsx': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'css': case 'scss': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'sql': return 'sql';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  if (!version.code_content) {
    return (
      <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
        <IconCode size={48} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Code Available</h3>
        <p className="text-gray-400">
          Code content is not available for this version
        </p>
      </div>
    );
  }

  const fileName = version.file_paths?.[0] || `v${version.version}`;
  const language = version.file_paths?.[0] ? getLanguageFromPath(version.file_paths[0]) : 'text';
  const lineCount = version.code_content.split('\n').length;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <IconFileText size={20} className="text-blue-400" />
          <div>
            <h4 className="text-white font-medium">{fileName}</h4>
            <p className="text-xs text-gray-400">
              {lineCount} lines • {language} • by {version.developer_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded"
            title="Copy code"
          >
            {copied ? <IconCheck size={16} className="text-green-400" /> : <IconCopy size={16} />}
          </button>
          <button
            onClick={downloadCode}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded"
            title="Download code"
          >
            <IconDownload size={16} />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-gray-300 font-mono whitespace-pre">
            {version.code_content}
          </code>
        </pre>
        
        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 p-4 pointer-events-none">
          <div className="text-gray-600 text-sm font-mono leading-relaxed">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="text-right pr-3">
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Code content with left padding for line numbers */}
        <div className="absolute left-0 top-0 w-full">
          <pre className="p-4 pl-12 overflow-x-auto text-sm leading-relaxed">
            <code className="text-gray-300 font-mono whitespace-pre">
              {version.code_content}
            </code>
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>Version {version.version} • {version.description}</span>
          <span>Created {new Date(version.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
} 