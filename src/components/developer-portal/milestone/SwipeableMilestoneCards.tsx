"use client";

import { useState, useEffect, useRef } from "react";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconClock, 
  IconUser, 
  IconEye,
  IconMessage,
  IconSend,
  IconX,
  IconCheck,
  IconCode,
  IconPhoto,
  IconCalendar
} from "@tabler/icons-react";

interface MilestoneUpdate {
  id: string;
  update_type: string;
  content: string;
  created_at: string;
  developer_id: string;
  developer_name: string;
  developer_profile: string | null;
  admin_response?: string;
  media_url?: string;
  media_type?: string;
  timestamp_ms?: number;
  task_id?: string;
  task_title?: string;
  milestone_id?: string;
  milestone_title?: string;
  source_type?: 'legacy' | 'module';
  module_name?: string;
  module_type?: string;
}

interface SwipeableMilestoneCardsProps {
  updates: MilestoneUpdate[];
  onCommentSubmit: (updateId: string, comment: string) => Promise<void>;
  loading?: boolean;
}

const formatDateCST = (dateInput: string | number) => {
  let date: Date;
  
  if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    date = new Date();
  }
  
  return date.toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }) + ' CST';
};

const getSystemColor = (updateType: string, sourceType?: string) => {
  if (sourceType === 'module') {
    return {
      bg: 'from-orange-900/90 to-amber-900/90',
      border: 'border-orange-500/30',
      icon: 'text-orange-400',
      accent: 'text-orange-300'
    };
  }
  
  switch (updateType) {
    case 'milestone':
      return {
        bg: 'from-teal-900/90 to-emerald-900/90',
        border: 'border-teal-500/30',
        icon: 'text-teal-400',
        accent: 'text-teal-300'
      };
    case 'module_created':
      return {
        bg: 'from-blue-900/90 to-indigo-900/90',
        border: 'border-blue-500/30',
        icon: 'text-blue-400',
        accent: 'text-blue-300'
      };
    default:
      return {
        bg: 'from-slate-900/90 to-gray-900/90',
        border: 'border-slate-500/30',
        icon: 'text-slate-400',
        accent: 'text-slate-300'
      };
  }
};

const processContent = (content: string) => {
  if (!content) return <p className="text-gray-300">No content provided</p>;
  
  return content.split('\n').map((line, i) => {
    if (line.includes('http')) {
      const parts = [];
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let lastIndex = 0;
      let match;
      
      while ((match = urlRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        
        parts.push(
          <a 
            key={`link-${i}-${match.index}`}
            href={match[0]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 break-all underline"
          >
            {match[0]}
          </a>
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      return <p key={i} className={i > 0 ? 'mt-2' : ''}>{parts}</p>;
    }
    
    return <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>;
  });
};

export const SwipeableMilestoneCards = ({ 
  updates, 
  onCommentSubmit, 
  loading = false 
}: SwipeableMilestoneCardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset to first card when updates change
  useEffect(() => {
    setCurrentIndex(0);
    setComment('');
    setShowCommentForm(false);
  }, [updates]);

  const currentUpdate = updates[currentIndex];

  const nextCard = () => {
    if (currentIndex < updates.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setComment('');
      setShowCommentForm(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setComment('');
      setShowCommentForm(false);
    }
  };

  // Handle comment submission for milestone updates
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !currentUpdate) return;
    
    setIsSubmitting(true);
    try {
      // Use the parent component's handler which has the correct endpoint and session data
      await onCommentSubmit(currentUpdate.id, comment.trim());
      
      // Reset form state on success
      setComment('');
      setShowCommentForm(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
      // Show user-friendly error message
      alert(`Failed to submit response: ${error instanceof Error ? error.message : 'Unknown error'}. Please try refreshing the page.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Touch/Mouse handlers for swipe
  const handleStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = Math.abs(clientY - dragStart.y);
    
    // Only track horizontal swipes
    if (deltaY < 50) {
      setDragOffset(deltaX);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    
    if (dragOffset > threshold) {
      prevCard();
    } else if (dragOffset < -threshold) {
      nextCard();
    }
    
    setDragStart(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    handleEnd();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCommentForm(!showCommentForm);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, showCommentForm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentUpdate) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/30 rounded-xl p-8">
          <IconMessage className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No updates available</h3>
          <p className="text-gray-500">Check back later for new milestone updates.</p>
        </div>
      </div>
    );
  }

  const colors = getSystemColor(currentUpdate.update_type, currentUpdate.source_type);

  return (
    <div className="relative h-full max-h-[90vh] sm:max-h-[85vh] lg:max-h-[75vh] overflow-hidden">
      {/* Card Container */}
      <div 
        ref={cardRef}
        className={`relative h-full bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden transition-transform duration-200 cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        } flex flex-col min-h-[400px] max-h-[90vh] sm:min-h-[450px] lg:min-h-[500px]`}
        style={{
          transform: `translateX(${dragOffset}px) rotateY(${dragOffset * 0.1}deg)`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header - Enhanced & Mobile Optimized */}
        <div className="p-3 sm:p-4 lg:p-6 xl:p-7 border-b border-white/10 flex-shrink-0">
          <div className="flex items-start justify-between gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 xl:gap-5 flex-1 min-w-0">
              {/* Developer Avatar/Icon - Mobile Optimized */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white/30`}>
                {currentUpdate.developer_profile ? (
                  <img 
                    src={currentUpdate.developer_profile} 
                    alt={currentUpdate.developer_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : currentUpdate.source_type === 'module' ? (
                  <IconCode className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 ${colors.icon}`} />
                ) : (
                  <IconUser className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 ${colors.icon}`} />
                )}
              </div>
              
              {/* Developer and Module Info - Mobile Optimized */}
              <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 lg:space-y-2 xl:space-y-3">
                {/* Developer Name */}
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base lg:text-xl xl:text-2xl leading-tight">
                    {currentUpdate.developer_name}
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm mt-0.5 sm:mt-1">Developer</p>
                </div>
                
                {/* Module/Milestone Info */}
                <div className="bg-white/5 rounded-lg p-2 sm:p-3 lg:p-4 border border-white/10">
                  <p className="text-white/70 text-xs uppercase tracking-wide font-medium mb-1">
                    {currentUpdate.source_type === 'module' ? 'Module' : 'Milestone'}
                  </p>
                  <p className={`${colors.accent} font-semibold text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed break-words`}>
                    {currentUpdate.source_type === 'module' 
                      ? currentUpdate.module_name || 'Unknown Module'
                      : currentUpdate.milestone_title || 'General Update'
                    }
                  </p>
                </div>
                
                {/* Timestamp - Mobile Optimized */}
                <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm">
                  <IconClock className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.accent}`} />
                  <span className="truncate">
                    {formatDateCST(currentUpdate.timestamp_ms || currentUpdate.created_at)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Status Badge & Counter - Mobile Optimized */}
            <div className="flex flex-col items-end gap-1 sm:gap-1.5 lg:gap-3 flex-shrink-0">
              <span className={`px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-semibold ${
                currentUpdate.update_type === 'milestone' ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30' :
                currentUpdate.update_type === 'module_created' ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' :
                'bg-orange-600/20 text-orange-300 border border-orange-500/30'
              } shadow-lg whitespace-nowrap`}>
                <span className="sm:hidden">{currentUpdate.update_type.replace('_', ' ').toUpperCase().substring(0, 6)}</span>
                <span className="hidden sm:inline">{currentUpdate.update_type.replace('_', ' ').toUpperCase()}</span>
              </span>
              <div className="bg-black/30 px-2 py-1 lg:px-3 lg:py-1 rounded-full">
                <span className="text-white text-xs lg:text-sm font-medium whitespace-nowrap">
                  {currentIndex + 1}/{updates.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Mobile Optimized Scrolling */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-4 lg:p-6 xl:p-7">
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
              {processContent(currentUpdate.content)}
            </div>
            
            {/* Media - Mobile Optimized */}
            {currentUpdate.media_url && (
              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 lg:p-4 bg-black/20 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <IconPhoto className={`w-4 h-4 ${colors.accent}`} />
                  <span className={`text-xs sm:text-sm ${colors.accent}`}>Attachment</span>
                </div>
                <a 
                  href={currentUpdate.media_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm break-all touch-manipulation inline-block py-1"
                >
                  View Media
                </a>
              </div>
            )}

            {/* Task Info - Mobile Optimized */}
            {currentUpdate.task_title && (
              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 bg-black/20 rounded-lg">
                <p className={`text-xs sm:text-sm ${colors.accent} mb-1`}>Related Task:</p>
                <p className="text-white text-xs sm:text-sm lg:text-base font-medium">{currentUpdate.task_title}</p>
              </div>
            )}

            {/* Admin Response - Mobile Optimized */}
            {currentUpdate.admin_response && (
              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 lg:p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <IconCheck className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm text-yellow-300 font-medium">Admin Response</span>
                </div>
                <p className="text-yellow-100 text-xs sm:text-sm lg:text-base">{currentUpdate.admin_response}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Mobile Optimized & Always Visible */}
        <div className={`border-t border-white/10 bg-black/20 flex-shrink-0 ${showCommentForm ? 'p-3 sm:p-4 lg:p-5' : 'p-3 sm:p-4 lg:p-5 xl:p-6'} min-h-[76px] sm:min-h-[auto]`}>
          {showCommentForm ? (
            <div className="max-h-28 sm:max-h-32 lg:max-h-48 overflow-y-auto">
              <form onSubmit={handleCommentSubmit} className="space-y-2 sm:space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a response..."
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 resize-none text-sm"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                    className="flex-1 px-3 py-3 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium touch-manipulation min-h-[48px] sm:min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <IconSend className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{isSubmitting ? 'Sending...' : 'Send Response'}</span>
                    <span className="sm:hidden">{isSubmitting ? 'Sending...' : 'Send'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCommentForm(false)}
                    className="px-3 py-3 sm:py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors touch-manipulation min-h-[48px] sm:min-h-[44px]"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <button
                onClick={() => setShowCommentForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium touch-manipulation min-h-[48px] sm:min-h-[44px]"
              >
                <IconMessage className="w-4 h-4" />
                <span className="sm:hidden">Respond</span>
                <span className="hidden sm:inline">Respond</span>
              </button>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                  className="p-3 sm:p-2.5 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg transition-colors touch-manipulation min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-[44px]"
                  title="Previous update"
                >
                  <IconChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white text-xs sm:text-sm font-medium px-2 whitespace-nowrap">
                  {currentIndex + 1} / {updates.length}
                </span>
                <button
                  onClick={nextCard}
                  disabled={currentIndex === updates.length - 1}
                  className="p-3 sm:p-2.5 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg transition-colors touch-manipulation min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-[44px]"
                  title="Next update"
                >
                  <IconChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation dots - Mobile & Desktop Optimized */}
      {!showCommentForm && (
        <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 xl:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-black/50 px-2 py-1 sm:px-3 sm:py-2 rounded-full backdrop-blur-sm">
          {updates.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setComment('');
                setShowCommentForm(false);
              }}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors touch-manipulation min-w-[16px] min-h-[16px] sm:min-w-[10px] sm:min-h-[10px] ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
          {updates.length > 5 && (
            <span className="text-white/70 text-xs ml-1 sm:ml-2">+{updates.length - 5}</span>
          )}
        </div>
      )}

      {/* Swipe hint - Mobile & Desktop Optimized */}
      {currentIndex === 0 && updates.length > 1 && !showCommentForm && (
        <div className="absolute top-1/2 right-2 sm:right-3 lg:right-4 transform -translate-y-1/2 animate-pulse">
          <div className="bg-black/50 px-2 py-1 sm:px-3 sm:py-2 rounded-lg backdrop-blur-sm">
            <p className="text-white text-xs sm:text-sm">
              <span className="sm:hidden">← →</span>
              <span className="hidden sm:inline">← Swipe →</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 