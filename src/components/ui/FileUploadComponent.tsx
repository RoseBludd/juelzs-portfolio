'use client';

import { useState, useRef } from 'react';
import Button from './Button';

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  fileType: string;
  fileCategory: string;
  size: number;
}

interface FileUploadComponentProps {
  onFileUploaded: (file: UploadedFile) => void;
  onError: (error: string) => void;
  allowedCategories?: string[];
  maxSize?: number; // in MB
}

const fileCategories = [
  { value: 'image', label: '🖼️ Image', description: 'Screenshots, photos, visual references' },
  { value: 'diagram', label: '📊 Diagram', description: 'Architecture diagrams, flowcharts, wireframes' },
  { value: 'document', label: '📄 Document', description: 'PDFs, Word docs, text files, notes' },
  { value: 'code', label: '💻 Code', description: 'Code snippets, config files, scripts' },
  { value: 'screenshot', label: '📸 Screenshot', description: 'UI screenshots, error screens, demos' }
];

export default function FileUploadComponent({ 
  onFileUploaded, 
  onError, 
  allowedCategories = ['image', 'diagram', 'document', 'code', 'screenshot'],
  maxSize = 10 
}: FileUploadComponentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(allowedCategories[0] || 'document');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      onError(`File size must be less than ${maxSize}MB`);
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      // Convert file to base64
      const fileBuffer = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const buffer = Buffer.from(arrayBuffer);
          resolve(buffer.toString('base64'));
        };
        reader.readAsArrayBuffer(file);
      });

      const uploadData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileBuffer,
        fileCategory: selectedCategory
      };

      const response = await fetch('/api/admin/journal/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        onFileUploaded(result.file);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const availableCategories = fileCategories.filter(cat => 
    allowedCategories.includes(cat.value)
  );

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          File Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isUploading}
        >
          {availableCategories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {availableCategories.find(c => c.value === selectedCategory)?.description}
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-gray-600 bg-gray-800/50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-500'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
          accept={selectedCategory === 'image' || selectedCategory === 'screenshot' 
            ? 'image/*' 
            : selectedCategory === 'diagram'
            ? 'image/*,.pdf,.drawio'
            : selectedCategory === 'document'
            ? '.pdf,.doc,.docx,.txt,.md,.json,.yaml,.yml'
            : selectedCategory === 'code'
            ? '.js,.ts,.py,.java,.cpp,.cs,.go,.rs,.sql,.sh,.json,.yaml,.xml,.txt'
            : '*'
          }
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400">Uploading file...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">
              {selectedCategory === 'image' || selectedCategory === 'screenshot' ? '🖼️' :
               selectedCategory === 'diagram' ? '📊' :
               selectedCategory === 'document' ? '📄' :
               selectedCategory === 'code' ? '💻' : '📎'}
            </div>
            
            <div>
              <p className="text-lg text-gray-300 mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Max size: {maxSize}MB
              </p>
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              📂 Choose File
            </Button>
          </div>
        )}
      </div>

      {/* File Type Hints */}
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Supported file types for {selectedCategory}:</p>
        <p>
          {selectedCategory === 'image' && 'JPG, PNG, WebP, GIF, SVG'}
          {selectedCategory === 'screenshot' && 'JPG, PNG, WebP, GIF'}
          {selectedCategory === 'diagram' && 'JPG, PNG, SVG, PDF, DrawIO files'}
          {selectedCategory === 'document' && 'PDF, DOC, DOCX, TXT, MD, JSON, YAML'}
          {selectedCategory === 'code' && 'JS, TS, PY, Java, C++, C#, Go, Rust, SQL, Shell scripts, Config files'}
        </p>
      </div>
    </div>
  );
}
