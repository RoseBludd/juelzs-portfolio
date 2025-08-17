"use client"

import { ImageIcon, Video, X } from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FileUpload } from '@/components/ui/file-upload'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AddMilestoneMediaProps {
  isOpen: boolean
  onClose: () => void
  milestoneId: string
  taskId: string
  onSuccess: () => void
}

export function AddMilestoneMedia({
  isOpen,
  onClose,
  milestoneId,
  taskId,
  onSuccess
}: AddMilestoneMediaProps) {
  const [files, setFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<{id: string, preview: string, type: 'image' | 'video'}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')

  const handleFileUpload = async (uploadedFiles: File[]) => {
    setError(null)

    // Add new files to existing files
    setFiles(prevFiles => [...prevFiles, ...uploadedFiles])

    // Create previews for each file
    const newPreviews = await Promise.all(uploadedFiles.map(async (file) => {
      const id = Math.random().toString(36).substring(2, 11)
      const type = file.type.startsWith('image/') ? 'image' : 'video'
      let preview = ''

      if (type === 'image') {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        })
      } else if (type === 'video') {
        preview = URL.createObjectURL(file)
      }

      return { id, preview, type }
    }))

    setFilePreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (id: string) => {
    // Remove the file preview
    const previewToRemove = filePreviews.find(p => p.id === id)
    if (previewToRemove && previewToRemove.type === 'video') {
      URL.revokeObjectURL(previewToRemove.preview)
    }

    // Update the previews state
    setFilePreviews(prev => prev.filter(p => p.id !== id))

    // Find the index of the file to remove
    const fileIndex = filePreviews.findIndex(p => p.id === id)
    if (fileIndex !== -1) {
      // Update the files state
      setFiles(prev => prev.filter((_, index) => index !== fileIndex))
    }
  }

  const clearAllFiles = () => {
    // Revoke any video object URLs
    filePreviews.forEach(preview => {
      if (preview.type === 'video') {
        URL.revokeObjectURL(preview.preview)
      }
    })

    // Clear all files and previews
    setFiles([])
    setFilePreviews([])
  }

  const resetForm = () => {
    clearAllFiles()
    setComment('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Create form data
      const formData = new FormData()

      // Add all files to the form data
      files.forEach((file, index) => {
        formData.append(`files`, file)
      })

      // Add file types (as JSON array)
      const fileTypes = files.map(file => file.type.startsWith('image/') ? 'image' : 'video')
      formData.append('fileTypes', JSON.stringify(fileTypes))

      // Add other data
      formData.append('milestoneId', milestoneId)
      formData.append('taskId', taskId)
      formData.append('comment', comment)
      formData.append('fileCount', files.length.toString())

      // Upload to API
      const response = await fetch('/api/milestones/upload-media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload files')
      }

      // Success
      onSuccess()
      resetForm()
      onClose()
    } catch (err: any) {
      console.error('Error uploading files:', err)
      setError(err.message || 'Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle>Add Media to Milestone</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <FileUpload
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
          label="Upload image or video"
          multiple={true}
        />

        {filePreviews.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-white">Selected Files ({filePreviews.length})</h3>
              {filePreviews.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={clearAllFiles}
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {filePreviews.map((filePreview) => (
                <div key={filePreview.id} className="bg-gray-800 rounded-md p-2 relative">
                  <div className="flex items-start gap-2">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                      {filePreview.type === 'image' && (
                        <img
                          src={filePreview.preview}
                          alt="Preview"
                          className="object-cover w-full h-full"
                        />
                      )}

                      {filePreview.type === 'video' && (
                        <video
                          src={filePreview.preview}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {filePreview.type === 'image' ? (
                          <ImageIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        ) : (
                          <Video className="h-4 w-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-300 truncate">
                          {files[filePreviews.findIndex(p => p.id === filePreview.id)]?.name || 'File'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-400 mt-1">
                        {filePreview.type === 'image' ? 'Image' : 'Video'} •
                        {(files[filePreviews.findIndex(p => p.id === filePreview.id)]?.size || 0) / (1024 * 1024) < 1
                          ? `${((files[filePreviews.findIndex(p => p.id === filePreview.id)]?.size || 0) / 1024).toFixed(0)} KB`
                          : `${((files[filePreviews.findIndex(p => p.id === filePreview.id)]?.size || 0) / (1024 * 1024)).toFixed(2)} MB`}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-gray-700/50 text-gray-400 hover:text-white"
                      onClick={() => removeFile(filePreview.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="comment">Add a comment (optional)</Label>
          <Textarea
            id="comment"
            placeholder="Add a description or comment about this media..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? 'Uploading...' : files.length > 1 ? `Upload ${files.length} Files` : 'Upload File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}