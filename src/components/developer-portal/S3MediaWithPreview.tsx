"use client"

import React, { useState } from 'react'

import { MediaPreviewModal } from './media/MediaPreviewModal'
import S3Media from './S3Media'
import { getSafeFileName } from '@/utils/fileUtils'

interface S3MediaWithPreviewProps {
  url: string
  type: 'image' | 'video'
  width?: number
  height?: number
  className?: string
  fileName?: string
  size?: number
  comment?: string
}

export default function S3MediaWithPreview({
  url,
  type,
  width,
  height,
  className,
  fileName,
  size,
  comment
}: S3MediaWithPreviewProps) {
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  const handleOpenPreview = () => {
    setPreviewModalOpen(true)
  }

  const mediaFile = {
    url,
    type,
    fileName: getSafeFileName(fileName, url),
    size,
    comment
  }

  return (
    <>
      <div className="cursor-pointer" onClick={handleOpenPreview}>
        <S3Media
          url={url}
          type={type}
          width={width}
          height={height}
          className={className}
        />
      </div>

      <MediaPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        mediaFiles={[mediaFile]}
        initialIndex={0}
      />
    </>
  )
}
