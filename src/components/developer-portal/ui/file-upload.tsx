"use client"

import { Upload, X, Loader2 } from 'lucide-react'
import React, { useState, useRef } from 'react'

import { Button } from '@/components/ui/button'

interface FileUploadProps {
  onFileUpload: (files: File[]) => Promise<void>
  accept?: string
  maxSize?: number // in MB
  label?: string
  isUploading?: boolean
  multiple?: boolean
}

export function FileUpload({
  onFileUpload,
  accept = "image/*,video/*",
  maxSize = 50, // 50MB default
  label = "Upload file",
  isUploading = false,
  multiple = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return false
    }

    // Check file type
    const fileType = file.type.split('/')[0]
    if (accept.includes('image/*') && fileType === 'image') {
      return true
    }
    if (accept.includes('video/*') && fileType === 'video') {
      return true
    }

    // Check specific mime types
    if (accept.split(',').some(type => file.type === type.trim())) {
      return true
    }

    setError(`File type not supported. Please upload ${accept.replace('*', '')} files`)
    return false
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      const validFiles = multiple
        ? files.filter(validateFile)
        : files.slice(0, 1).filter(validateFile)

      if (validFiles.length > 0) {
        onFileUpload(validFiles)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setError(null)

    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const validFiles = multiple
        ? files.filter(validateFile)
        : files.slice(0, 1).filter(validateFile)

      if (validFiles.length > 0) {
        onFileUpload(validFiles)
      }
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-2 text-sm text-red-500 bg-red-100/10 p-2 rounded-md">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-5 w-5 p-0"
            onClick={() => setError(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
          multiple={multiple}
        />

        {isUploading ? (
          <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
        ) : (
          <Upload className="h-10 w-10 text-gray-400" />
        )}

        <p className="mt-2 text-sm text-gray-400">
          {multiple ? `${label}s` : label}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Drag and drop or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {multiple ? `Select multiple files (max ${maxSize}MB each)` : `Max size: ${maxSize}MB`}
        </p>
      </div>
    </div>
  )
}