import { X, ChevronLeft, ChevronRight, Maximize2, ImageIcon, Video, Play } from 'lucide-react';
import React, { useState } from 'react';

import S3Media from '@/components/S3Media';

import { Button } from './button';
import { Dialog, DialogContent, DialogClose } from "./dialog";

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  content: string;
  developer_name?: string;
  created_at?: string;
}

interface MediaGalleryProps {
  mediaItems: MediaItem[];
  title?: string;
  maxDisplayItems?: number;
}

export function MediaGallery({ mediaItems, title, maxDisplayItems = 5 }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const imageItems = mediaItems.filter(item => item.type === 'image');
  const videoItems = mediaItems.filter(item => item.type === 'video');
  
  const handleMediaClick = (media: MediaItem, index: number) => {
    setSelectedMedia(media);
    setCurrentIndex(index);
  };
  
  const handleNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedMedia(mediaItems[currentIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedMedia(mediaItems[currentIndex - 1]);
    }
  };
  
  // Determine if we need to show the "more" button
  const displayItems = maxDisplayItems && mediaItems.length > maxDisplayItems 
    ? mediaItems.slice(0, maxDisplayItems) 
    : mediaItems;
  const hasMoreItems = mediaItems.length > maxDisplayItems;
  
  if (mediaItems.length === 0) {
    return null;
  }
  
  // Determine the grid columns based on item count
  const getGridClass = () => {
    const count = displayItems.length + (hasMoreItems ? 1 : 0);
    if (count <= 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-5";
  };
  
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      )}
      
      <div className={`grid ${getGridClass()} gap-3`}>
        {displayItems.map((item, index) => (
          <div 
            key={item.id} 
            className="relative aspect-video cursor-pointer group rounded-lg overflow-hidden"
            onClick={() => handleMediaClick(item, index)}
          >
            {item.type === 'image' ? (
              <>
                <div className="relative w-full h-full">
                  <S3Media
                    url={item.content}
                    type="image"
                    className="object-cover w-full h-full"
                    width={300}
                    height={169}
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
                </div>
              </>
            ) : (
              <>
                <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                  {/* Video thumbnail with play button overlay */}
                  <S3Media
                    url={item.content}
                    type="video"
                    thumbnail={true}
                    className="object-cover w-full h-full opacity-60"
                    width={300}
                    height={169}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-blue-500/80 rounded-full p-2 shadow-lg">
                      <Play className="text-white w-6 h-6 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center">
                    <Video className="text-white w-4 h-4 mr-1" />
                    <span className="text-white text-xs font-medium">Video</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 w-6 h-6" />
                </div>
              </>
            )}
          </div>
        ))}
        
        {hasMoreItems && (
          <div 
            className="relative aspect-video cursor-pointer bg-gray-800/50 rounded-lg flex items-center justify-center"
            onClick={() => setSelectedMedia(mediaItems[maxDisplayItems])}
          >
            <div className="text-white text-center">
              <span className="text-2xl font-bold">+{mediaItems.length - maxDisplayItems}</span>
              <p className="text-sm">more</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Media Modal */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={(open: boolean) => !open && setSelectedMedia(null)}>
          <DialogContent className="sm:max-w-5xl lg:max-w-6xl bg-gray-900 border-gray-800 p-0 overflow-hidden">
            <div className="relative">
              <DialogClose className="absolute right-4 top-4 z-10">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/50 text-white">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
              
              <div className="flex items-center justify-center min-h-[300px] max-h-[80vh]">
                {selectedMedia.type === 'image' ? (
                  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center p-4">
                    <S3Media
                      url={selectedMedia.content}
                      type="image"
                      className="max-w-full max-h-[70vh] object-contain"
                      width={1200}
                      height={800}
                    />
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-center p-4">
                    <S3Media
                      url={selectedMedia.content}
                      type="video"
                      className="max-h-[70vh] max-w-full"
                      width={1200}
                      height={800}
                    />
                  </div>
                )}
              </div>
              
              {mediaItems.length > 1 && (
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 text-white ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {mediaItems.length > 1 && (
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 text-white mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    disabled={currentIndex === mediaItems.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-300">
                    {currentIndex + 1} of {mediaItems.length}
                  </p>
                </div>
                {selectedMedia.developer_name && (
                  <p className="text-sm text-gray-300">
                    Added by {selectedMedia.developer_name}
                    {selectedMedia.created_at && (
                      <span className="ml-2 text-gray-400">
                        {new Date(selectedMedia.created_at).toLocaleString()}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 