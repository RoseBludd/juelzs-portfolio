"use client"

import { Download, Share2, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Music, Film, Image as ImageIcon, AlertCircle } from 'lucide-react'
import React, { useState, useEffect, useRef, useCallback, MouseEvent, TouchEvent } from 'react'
import { toast } from 'react-hot-toast'

import S3Media from '@/components/S3Media'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Enhanced media type support
type MediaType = 'image' | 'video' | 'audio' | 'document' | 'unknown'

interface MediaFile {
  url: string
  type: MediaType
  fileName?: string
  size?: number
  mimeType?: string
}

interface MediaPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  mediaFiles: MediaFile[]
  initialIndex?: number
}

// Utility functions for better media type detection and URL handling
const cleanMediaUrl = (url: string): string => {
  if (!url) return url
  
  // Remove query parameters first
  const urlWithoutQuery = url.split('?')[0]
  
  if (urlWithoutQuery.includes('s3.amazonaws.com')) {
    // Extract just the S3 URL part if there's extra data
    const s3Match = urlWithoutQuery.match(/(https:\/\/[^"',\s}]+\.s3\.amazonaws\.com\/[^"',\s}]+)/)
    if (s3Match) {
      url = s3Match[1]
    }
    // Additional cleaning: remove any trailing quotes, commas, or JSON artifacts
    url = url.replace(/[",}]+$/, '')
  } else {
    url = urlWithoutQuery
  }
  
  return url
}

const detectMediaType = (url: string, providedType?: MediaType, mimeType?: string): MediaType => {
  // Use provided type if available and valid
  if (providedType && ['image', 'video', 'audio', 'document'].includes(providedType)) {
    return providedType
  }
  
  // Use MIME type if available
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
  }
  
  // Fallback to file extension detection
  const cleanUrl = url.toLowerCase()
  
  // Image extensions
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff?)(\?|$)/.test(cleanUrl)) {
    return 'image'
  }
  
  // Video extensions
  if (/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp)(\?|$)/.test(cleanUrl)) {
    return 'video'
  }
  
  // Audio extensions
  if (/\.(mp3|wav|ogg|aac|flac|m4a|wma)(\?|$)/.test(cleanUrl)) {
    return 'audio'
  }
  
  // Document extensions
  if (/\.(pdf|doc|docx|txt|rtf|odt)(\?|$)/.test(cleanUrl)) {
    return 'document'
  }
  
  return 'unknown'
}

// Enhanced file name extraction function
const extractFileNameFromUrl = (url: string): string => {
  if (!url) return 'Unknown File'
  
  try {
    // First, remove query parameters from the original URL to get the clean path
    const urlWithoutQuery = url.split('?')[0]
    
    // Handle S3 URLs - extract from the key/path
    if (urlWithoutQuery.includes('amazonaws.com')) {
      const s3Match = urlWithoutQuery.match(/amazonaws\.com\/(.+)$/)
      if (s3Match) {
        const key = s3Match[1]
        // Decode URI components and get the last part of the path
        const decodedKey = decodeURIComponent(key)
        const pathParts = decodedKey.split('/')
        const fileName = pathParts[pathParts.length - 1]
        
        // If we have a meaningful filename, return it
        if (fileName && fileName.length > 0 && fileName !== '/' && fileName.includes('.')) {
          return fileName
        }
      }
    }
    
    // For regular URLs, extract filename from the path
    try {
      const urlObj = new URL(urlWithoutQuery)
      const pathname = urlObj.pathname
      const pathParts = pathname.split('/')
      const fileName = pathParts[pathParts.length - 1]
      
      // If we have a filename with extension, return it
      if (fileName && fileName.includes('.')) {
        return decodeURIComponent(fileName)
      }
    } catch (urlError) {
      // If URL constructor fails, fall back to string manipulation
    }
    
    // Fallback: extract from the raw string
    const parts = urlWithoutQuery.split('/')
    const lastPart = parts[parts.length - 1]
    
    if (lastPart && lastPart.includes('.')) {
      return decodeURIComponent(lastPart)
    }
    
    // If no proper filename found, return unknown
    return 'Unknown File'
  } catch (error) {
    // Final fallback: try to extract from the raw string
    const parts = url.split('/')
    const lastPart = parts[parts.length - 1]
    
    if (lastPart && lastPart.includes('.')) {
      // Remove query parameters and decode
      const cleanPart = lastPart.split('?')[0]
      return decodeURIComponent(cleanPart)
    }
    
    return 'Unknown File'
  }
}

// Get display name for a media file with proper fallback logic
const getDisplayFileName = (file: MediaFile & { cleanUrl: string }): string => {
  // First priority: use provided fileName if it exists and is meaningful
  if (file.fileName && file.fileName.trim() && file.fileName !== 'undefined' && file.fileName !== 'null') {
    return file.fileName.trim()
  }
  
  // Second priority: extract from original URL (not cleaned URL)
  const extractedName = extractFileNameFromUrl(file.url)
  
  // If extraction gives us a meaningful name, use it
  if (extractedName && extractedName !== 'Unknown File') {
    return extractedName
  }
  
  // Final fallback: create a name based on media type and timestamp
  const typeNames = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    unknown: 'File'
  }
  
  const extension = getFileExtension(file.type, file.url)
  return `${typeNames[file.type] || 'File'}.${extension}`
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return ''
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

const getFileExtension = (type: MediaType, url: string): string => {
  // Try to extract extension from URL first
  const urlMatch = url.match(/\.([a-zA-Z0-9]+)(\?|$)/)
  if (urlMatch) {
    return urlMatch[1]
  }
  
  // Fallback to type-based extensions
  switch (type) {
    case 'image': return 'jpg'
    case 'video': return 'mp4'
    case 'audio': return 'mp3'
    case 'document': return 'pdf'
    default: return 'bin'
  }
}

const getDefaultMimeType = (type: MediaType): string => {
  switch (type) {
    case 'image': return 'image/jpeg'
    case 'video': return 'video/mp4'
    case 'audio': return 'audio/mpeg'
    case 'document': return 'application/pdf'
    default: return 'application/octet-stream'
  }
}

export function MediaPreviewModal({
  isOpen,
  onClose,
  mediaFiles,
  initialIndex = 0
}: MediaPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isCopied, setIsCopied] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const mediaContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Enhanced media file processing
  const processedMediaFiles = mediaFiles.map(file => ({
    ...file,
    type: detectMediaType(file.url, file.type, file.mimeType),
    cleanUrl: cleanMediaUrl(file.url)
  }))

  const currentFile = processedMediaFiles && processedMediaFiles.length > 0 ? processedMediaFiles[currentIndex] : null
  const hasMultipleFiles = processedMediaFiles && processedMediaFiles.length > 1
  const canZoom = currentFile?.type === 'image'
  const isVideoFile = currentFile?.type === 'video'
  const isAudioFile = currentFile?.type === 'audio'
  const isDocumentFile = currentFile?.type === 'document'
  const isUnsupportedFile = currentFile?.type === 'unknown'

  useEffect(() => {
    if (isOpen) {
      resetZoom() // This will set zoomLevel to 1
      setCurrentIndex(initialIndex)
      setError(null)
      setRetryCount(0)
      
      // Set loading state when modal opens or when switching files
      setIsLoading(true)

      // Fallback timer to prevent indefinite loading state
      const timer = setTimeout(() => {
        setIsLoading(false)
        if (currentFile && !error) {
          setError('Media took too long to load')
        }
      }, 10000) // Extended timeout for better UX with large media files

      return () => clearTimeout(timer)
    }
  }, [isOpen, initialIndex])

  // Reset error and loading state when switching files
  useEffect(() => {
    setError(null)
    setIsLoading(true)
    setRetryCount(0)
  }, [currentIndex])

  // Completely revised centering function for top-left transform origin
  const centerContent = () => {
    if (!mediaContainerRef.current) return;

    const container = mediaContainerRef.current;

    if (canZoom && zoomLevel > 1) {
      // With transformOrigin set to '0 0' (top-left), we need to adjust our approach
      // We want to initially position the content in the center of the viewport

      // First, reset scroll position to ensure we're starting from a clean state
      container.scrollLeft = 0;
      container.scrollTop = 0;

      // For a centered view with top-left transform origin, we need to scroll to a position
      // that places the center of the scaled content in the center of the viewport
      const scrollLeft = (container.clientWidth * (zoomLevel - 1)) / 2;
      const scrollTop = (container.clientHeight * (zoomLevel - 1)) / 2;

      // Apply the calculated scroll position
      container.scrollLeft = scrollLeft;
      container.scrollTop = scrollTop;

      // Calculate the maximum scroll values
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const maxScrollTop = container.scrollHeight - container.clientHeight;

      // Ensure our scroll values don't exceed the maximum
      container.scrollLeft = Math.min(container.scrollLeft, maxScrollLeft);
      container.scrollTop = Math.min(container.scrollTop, maxScrollTop);
    } else {
      // If not zoomed, reset scroll position
      container.scrollLeft = 0;
      container.scrollTop = 0;
    }
  };

  useEffect(() => {
    // Center content when zoomLevel changes, or when current file changes (which might change `canZoom` or dimensions)
    // A timeout allows the browser to apply the scale transform and update layout properties
    // like clientWidth/Height before we try to calculate scroll positions.
    if (mediaContainerRef.current) {
      const timerId = setTimeout(() => {
        centerContent();
      }, 50); // 50ms delay, adjust if needed
      return () => clearTimeout(timerId);
    }
  }, [zoomLevel, currentIndex, canZoom]); // Important dependencies

  // Add non-passive touch event listeners to allow preventDefault
  useEffect(() => {
    const container = mediaContainerRef.current;
    if (!container) return;

    const handleTouchMoveNonPassive = (e: Event) => {
      const touchEvent = e as globalThis.TouchEvent;
      if (!isDragging || zoomLevel <= 1 || touchEvent.touches.length !== 1) return;
      e.preventDefault(); // This works because we're using non-passive listener

      const dx = touchEvent.touches[0].clientX - dragStart.x;
      const dy = touchEvent.touches[0].clientY - dragStart.y;

      // Update scroll position with the delta
      container.scrollLeft -= dx;
      container.scrollTop -= dy;

      // Calculate the maximum scroll values
      const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

      // Clamp scroll values
      container.scrollLeft = Math.max(0, Math.min(container.scrollLeft, maxScrollLeft));
      container.scrollTop = Math.max(0, Math.min(container.scrollTop, maxScrollTop));

      setDragStart({
        x: touchEvent.touches[0].clientX,
        y: touchEvent.touches[0].clientY
      });
    };

    // Add non-passive touch event listener
    container.addEventListener('touchmove', handleTouchMoveNonPassive, { passive: false });

    return () => {
      container.removeEventListener('touchmove', handleTouchMoveNonPassive);
    };
  }, [isDragging, zoomLevel, dragStart]);

  const handlePrevious = useCallback(() => {
    if (!processedMediaFiles || processedMediaFiles.length <= 1) return
    
    setIsLoading(true)
    setCurrentIndex(currentIndex === 0 ? processedMediaFiles.length - 1 : currentIndex - 1)
  }, [processedMediaFiles, currentIndex]);

  const handleNext = useCallback(() => {
    if (!processedMediaFiles || processedMediaFiles.length <= 1) return
    
    setIsLoading(true)
    setCurrentIndex(currentIndex === processedMediaFiles.length - 1 ? 0 : currentIndex + 1)
  }, [processedMediaFiles, currentIndex]);

  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    setRetryCount(prev => prev + 1)
  }, [])

  const handleDownload = async () => {
    if (!currentFile || !currentFile.cleanUrl) {
      toast.error('No file available to download')
      return
    }

    try {
      // Use the enhanced file name extraction logic
      let filename = getDisplayFileName(currentFile)
      
      // If we still don't have a good filename, create one with timestamp
      if (!filename || filename === 'Unknown File') {
        const extension = getFileExtension(currentFile.type, currentFile.cleanUrl)
        filename = `file-${Date.now()}.${extension}`
      }

      const cleanUrl = currentFile.cleanUrl
      // Check if this is an S3 URL that needs a pre-signed URL
      const isS3Url = cleanUrl.includes('amazonaws.com')

      if (isS3Url) {
        // For S3 URLs, we need to get a pre-signed URL first
        const urlParts = cleanUrl.split('.amazonaws.com/')
        if (urlParts.length !== 2) {
          throw new Error('Invalid S3 URL format')
        }

        const key = urlParts[1]
        // Get a pre-signed URL from our API
        const response = await fetch(`/api/s3/presigned-url?key=${encodeURIComponent(key)}`)

        if (!response.ok) {
          throw new Error('Failed to get download URL')
        }

        const data = await response.json()

        // Fetch the file with the pre-signed URL
        const fileResponse = await fetch(data.url)
        if (!fileResponse.ok) {
          throw new Error(`Failed to download file: ${fileResponse.status}`)
        }

        // Get content type from response
        const contentType = fileResponse.headers.get('content-type') ||
          getDefaultMimeType(currentFile.type)

        // Create a blob with the correct content type
        const blob = await fileResponse.blob()
        const blobWithType = new Blob([blob], { type: contentType })

        // Create object URL and trigger download
        const objectUrl = URL.createObjectURL(blobWithType)

        // Create and trigger download link
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } else {
        // For non-S3 URLs, use the direct download method
        const a = document.createElement('a')
        a.href = cleanUrl
        a.download = filename
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const handleShare = async () => {
    if (!currentFile || !currentFile.cleanUrl) {
      toast.error('No file link available to copy')
      return
    }

    try {
      const cleanUrl = currentFile.cleanUrl
      // Check if this is an S3 URL that needs a pre-signed URL
      const isS3Url = cleanUrl.includes('amazonaws.com')

      if (isS3Url) {
        // For S3 URLs, we need to get a pre-signed URL
        const urlParts = cleanUrl.split('.amazonaws.com/')
        if (urlParts.length !== 2) {
          throw new Error('Invalid S3 URL format')
        }

        const key = urlParts[1]
        // Get a pre-signed URL from our API
        const response = await fetch(`/api/s3/presigned-url?key=${encodeURIComponent(key)}`)

        if (!response.ok) {
          throw new Error('Failed to get shareable link')
        }

        const data = await response.json()
        // Copy the pre-signed URL to clipboard
        await navigator.clipboard.writeText(data.url)
      } else {
        // For non-S3 URLs, just copy the cleaned URL directly
        await navigator.clipboard.writeText(cleanUrl)
      }

      setIsCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Failed to copy link to clipboard')
    }
  }

  const zoomIn = useCallback(() => {
    if (canZoom) {
      setZoomLevel(prev => Math.min(prev + 0.25, 3));
    }
  }, [canZoom]);

  const zoomOut = useCallback(() => {
    if (canZoom) {
      setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    }
  }, [canZoom]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    // Centering (which includes scroll reset) is handled by the useEffect listening to zoomLevel
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || !canZoom || !mediaContainerRef.current) return;
    e.preventDefault(); // Prevent text selection/image drag
    setIsDragging(true);
    setDragStart({
      x: e.clientX, // Store initial mouse position
      y: e.clientY,
    });
    mediaContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoomLevel <= 1 || !mediaContainerRef.current) return;
    e.preventDefault();

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Update scroll position with the delta (negative because we're moving the viewport opposite to cursor)
    const container = mediaContainerRef.current;
    container.scrollLeft -= dx;
    container.scrollTop -= dy;

    // Calculate the maximum scroll values
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

    // Ensure we can scroll to all edges by clamping the scroll values
    // The minimum is 0 to allow scrolling all the way to the left/top edge
    container.scrollLeft = Math.max(0, Math.min(container.scrollLeft, maxScrollLeft));
    container.scrollTop = Math.max(0, Math.min(container.scrollTop, maxScrollTop));

    setDragStart({ x: e.clientX, y: e.clientY }); // Update drag start for next move
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (mediaContainerRef.current && canZoom) {
      mediaContainerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1 || !canZoom || !mediaContainerRef.current) return;
    // Consider preventDefault carefully for touch, it can block native pinch-zoom/scroll
    // e.preventDefault();
    if (e.touches.length === 1) { // Only pan with one finger
        setIsDragging(true);
        setDragStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        });
        mediaContainerRef.current.style.cursor = 'grabbing';
    }
  };



  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
     if (mediaContainerRef.current && canZoom) {
      mediaContainerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
    }
  };

  const handleDoubleClick = () => {
    if (!canZoom) return;
    if (zoomLevel > 1) {
      resetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  // Enhanced keyboard navigation with accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (hasMultipleFiles) handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (hasMultipleFiles) handleNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          if (canZoom) zoomIn();
          break;
        case '-':
          e.preventDefault();
          if (canZoom) zoomOut();
          break;
        case '0':
          e.preventDefault();
          if (canZoom) resetZoom();
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleDownload();
          }
          break;
        case 'c':
        case 'C':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleShare();
          }
          break;
        case 'r':
        case 'R':
          if (error) {
            e.preventDefault();
            handleRetry();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMultipleFiles, canZoom, error, onClose, handlePrevious, handleNext, zoomIn, zoomOut, resetZoom, handleDownload, handleShare, handleRetry]);

  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #2d3748; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4a5568; border-radius: 4px; border: 2px solid #2d3748; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #718096; }
    .custom-scrollbar.overflow-auto { scrollbar-width: auto; /* scrollbar-gutter: stable; */ }
  `;

  const s3MediaClassName = currentFile?.type === 'image'
    ? 'object-contain max-w-full max-h-full block'
    : 'w-full h-full object-contain';

  // Enhanced cursor styles for better UX
  let cursorStyle = 'cursor-default';
  if (canZoom) {
    if (isDragging) {
      cursorStyle = 'cursor-grabbing';
    } else if (zoomLevel > 1) {
      cursorStyle = 'cursor-grab'; // Indicates content can be panned
    } else {
      cursorStyle = 'cursor-zoom-in';
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <style jsx global>{scrollbarStyles}</style>
      <DialogContent className="w-full max-w-[95vw] max-h-[95vh] sm:max-w-6xl lg:max-w-7xl bg-gray-900 border-gray-800 p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col">
        {/* Simple loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="animate-spin rounded-full border-t-2 border-b-2 border-blue-500 h-12 w-12"></div>
          </div>
        )}
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b border-gray-800 gap-2">
            <div className="text-sm text-gray-300 min-w-0 flex-1">
              {hasMultipleFiles && <span className="whitespace-nowrap">{currentIndex + 1} of {processedMediaFiles.length}</span>}
              {currentFile && (
                <span className="ml-2 truncate block sm:inline font-medium" title={getDisplayFileName(currentFile)}>
                  {getDisplayFileName(currentFile)}
                </span>
              )}
              {currentFile?.size && <span className="ml-2 text-gray-400 text-xs">({formatFileSize(currentFile.size)})</span>}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {canZoom && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    title="Zoom out (- key)"
                    className="text-gray-400 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                    disabled={zoomLevel <= 0.5}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <span className="text-xs text-gray-400 min-w-[35px] sm:min-w-[40px] text-center" aria-label={`Zoom level ${Math.round(zoomLevel * 100)} percent`}>
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomIn}
                    title="Zoom in (+ key)"
                    className="text-gray-400 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                    disabled={zoomLevel >= 3}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              )}
              {error && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRetry}
                  title="Retry loading (R key)"
                  className="text-yellow-400 hover:text-yellow-300 h-8 w-8 sm:h-10 sm:w-10"
                  aria-label="Retry loading media"
                >
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Download (Ctrl+D)"
                className="text-gray-400 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                disabled={!currentFile?.cleanUrl}
                aria-label="Download file"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                title={isCopied ? "Copied!" : "Copy link (Ctrl+C)"}
                className="text-gray-400 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                disabled={!currentFile?.cleanUrl}
                aria-label={isCopied ? "Link copied to clipboard" : "Copy link to clipboard"}
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close (Escape)"
                className="text-gray-400 hover:text-white h-8 w-8 sm:h-10 sm:w-10"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Media Content Area */}
          <div className="relative flex-1 bg-gradient-to-b from-gray-900 to-black min-h-[400px] flex items-center justify-center">
            {/* Error State */}
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900/90">
                <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Media</h3>
                <p className="text-gray-400 mb-4 max-w-md">{error}</p>
                <div className="flex gap-3">
                  <Button onClick={handleRetry} variant="outline" className="text-white border-gray-600">
                    Try Again
                  </Button>
                  {currentFile?.cleanUrl && (
                    <Button
                      onClick={() => window.open(currentFile.cleanUrl, '_blank')}
                      variant="ghost"
                      className="text-gray-400"
                    >
                      Open in New Tab
                    </Button>
                  )}
                </div>
              </div>
            ) : currentFile ? (
              <>
                {/* Video Content - Enhanced containment */}
                {isVideoFile && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative w-full h-full max-w-[85vw] max-h-[70vh] bg-black rounded-lg overflow-hidden shadow-2xl">
                      <S3Media
                        url={currentFile.cleanUrl}
                        type="video"
                        width={1200}
                        height={800}
                        className="w-full h-full object-contain"
                        onLoadComplete={() => {
                          setIsLoading(false)
                          setError(null)
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Audio Content */}
                {isAudioFile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl">
                      <div className="flex items-center justify-center mb-6">
                        <Music className="h-16 w-16 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white text-center mb-4">
                        {currentFile.fileName || 'Audio File'}
                      </h3>
                      <audio
                        controls
                        className="w-full"
                        onLoadedData={() => {
                          setIsLoading(false)
                          setError(null)
                        }}
                        onError={() => setError('Failed to load audio file')}
                      >
                        <source src={currentFile.cleanUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}

                {/* Document Content */}
                {isDocumentFile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
                      <div className="flex items-center justify-center mb-6">
                        <FileText className="h-16 w-16 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {currentFile.fileName || 'Document'}
                      </h3>
                      <p className="text-gray-400 mb-6">
                        This document cannot be previewed in the browser.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => window.open(currentFile.cleanUrl, '_blank')}
                          variant="outline"
                          className="border-gray-600 text-white"
                        >
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unsupported Content */}
                {isUnsupportedFile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
                      <div className="flex items-center justify-center mb-6">
                        <AlertCircle className="h-16 w-16 text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Unsupported File Type
                      </h3>
                      <p className="text-gray-400 mb-2">
                        {currentFile.fileName || 'Unknown file'}
                      </p>
                      <p className="text-gray-500 text-sm mb-6">
                        This file type cannot be previewed in the browser.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={handleDownload} variant="outline" className="border-gray-600 text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => window.open(currentFile.cleanUrl, '_blank')}
                          variant="ghost"
                          className="text-gray-400"
                        >
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Content with Enhanced Zoom Support */}
                {canZoom && (
                  <div
                    ref={mediaContainerRef}
                    className={`absolute inset-0 custom-scrollbar
                      ${canZoom && zoomLevel > 1 ? 'overflow-auto' : 'overflow-hidden'}
                      ${cursorStyle}
                    `}
                    onClick={canZoom && zoomLevel === 1 && !isDragging ? zoomIn : undefined}
                    onDoubleClick={handleDoubleClick}
                    style={{ userSelect: 'none', scrollbarWidth: 'thin', scrollbarColor: '#4a5568 #2d3748' }}
                    // Panning handlers are on this div, which is the viewport
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    role="img"
                    aria-label={`Image: ${currentFile.fileName || 'Media content'}`}
                  >
                    {/* Content wrapper for centering scaled content. It doesn't scroll itself. */}
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ minHeight: '100%', minWidth: '100%' }}
                    >
                      {/* Scalable Image Content */}
                      <div
                        className="media-content-scalable flex items-center justify-center"
                        style={{
                          width: '100%',
                          height: '100%',
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: '0 0', // Change to top-left corner to prevent cutoff
                          transition: 'transform 0.15s ease-out',
                          margin: 'auto', // Center the content
                          position: 'relative', // Ensure proper positioning
                        }}
                      >
                        <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
                          <S3Media
                            url={currentFile.cleanUrl}
                            type="image"
                            width={1200}
                            height={800}
                            className="object-contain max-w-full max-h-full block"
                            onLoadComplete={() => {
                              setIsLoading(false)
                              setError(null)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No current file */
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Media Available</h3>
                  <p className="text-gray-400">No media files to display.</p>
                </div>
              </div>
            )}

            {hasMultipleFiles && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 z-20"
                  disabled={currentIndex === 0}
                  aria-label="Previous media file"
                  title="Previous (← key)"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 z-20"
                  disabled={currentIndex === processedMediaFiles.length - 1}
                  aria-label="Next media file"
                  title="Next (→ key)"
                >
                  <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                </Button>
              </>
            )}

            {canZoom && zoomLevel !== 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={resetZoom}
                className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 hover:bg-black/70 text-white text-xs py-1 px-2 z-20"
                aria-label="Reset zoom level"
                title="Reset Zoom (0 key)"
              >
                Reset Zoom
              </Button>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="p-2 sm:p-3 border-t border-gray-800 bg-gray-800/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-gray-300 flex items-center gap-2">
                {currentFile ? (
                  <>
                    <div className="flex items-center gap-1">
                      {currentFile.type === 'image' && <ImageIcon className="h-4 w-4" />}
                      {currentFile.type === 'video' && <Film className="h-4 w-4" />}
                      {currentFile.type === 'audio' && <Music className="h-4 w-4" />}
                      {currentFile.type === 'document' && <FileText className="h-4 w-4" />}
                      {currentFile.type === 'unknown' && <AlertCircle className="h-4 w-4" />}
                      <span className="capitalize">{currentFile.type}</span>
                    </div>
                    {currentFile.size && (
                      <span className="text-gray-400">({formatFileSize(currentFile.size)})</span>
                    )}
                    {error && (
                      <span className="text-red-400 text-xs">• Failed to load</span>
                    )}
                  </>
                ) : (
                  'No Media'
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                <span className="hidden lg:inline">
                  {canZoom && !error && (
                    <>
                      {zoomLevel > 1 ? 'Drag to pan • ' : 'Click/Double-click to zoom • '}
                      +/- keys to zoom • 0 to reset •
                    </>
                  )}
                  {isVideoFile && !error && 'Video controls available • '}
                  {isAudioFile && !error && 'Audio controls available • '}
                  {hasMultipleFiles && '← → to navigate • '}
                  {error && 'R to retry • '}
                  Ctrl+D to download • Ctrl+C to copy link • ESC to close
                </span>
                <span className="lg:hidden">
                  {error ? (
                    'Tap retry to reload'
                  ) : canZoom ? (
                    zoomLevel > 1 ? 'Drag to pan' : 'Tap to zoom'
                  ) : isVideoFile ? (
                    'Video controls available'
                  ) : isAudioFile ? (
                    'Audio controls available'
                  ) : (
                    'Tap outside to close'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}