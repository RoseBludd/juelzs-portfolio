"use client";

import { useState, useEffect, useRef } from "react";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconClock, 
  IconUser, 
  IconCode,
  IconVideo,
  IconMessage,
  IconDownload,
  IconCalendar,
  IconTrendingUp,
  IconActivity,
  IconTarget,
  IconStar,
  IconCheckbox,
  IconPhoto,
  IconFlag,
  IconChartBar
} from "@tabler/icons-react";

interface DeveloperMetrics {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  status: 'active' | 'pending';
  role: string;
  activityStatus: 'active' | 'idle' | 'busy';
  lastActive: string | null;
  activeTasks: number;
  latestUpdate: {
    content: string;
    created_at: string;
    task_title: string;
    task_id?: string;
  } | null;
  componentsSubmitted: {
    daily: number;
    weekly: number;
    total: number;
  };
  checkouts: {
    total: number;
    daily: number;
    weekly: number;
  };
  loomVideos: number;
  componentTypes: {
    [key: string]: number;
  };
  avgModuleCompletionTime: number;
  points: {
    weekly: number;
    total: number;
  };
}

interface ActiveDeveloperSwipeCardsProps {
  loading?: boolean;
}

const formatTimeCST = (dateInput: string) => {
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date input:', dateInput);
    return 'Unknown time';
  }
  
  return date.toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }) + ' CST';
};

const formatRelativeTime = (dateInput: string) => {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / (1000 * 60));
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'busy': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'idle': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
};

const processContent = (content: string) => {
  if (!content) return <p className="text-gray-300">No recent updates</p>;
  
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

export const ActiveDeveloperSwipeCards = ({ loading = false }: ActiveDeveloperSwipeCardsProps) => {
  const [developers, setDevelopers] = useState<DeveloperMetrics[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetchDeveloperMetrics();
  }, []);

  const fetchDeveloperMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/developers/metrics');
      
      if (response.ok) {
        const data = await response.json();
        
        // Specific developers that should be shown
        const allowedDevelopers = [
          'ryan canseco',
          'enrique lacambra iii', 
          'junniel rome ardepuela',
          'adrian estopace',
          'christopher tarroja',
          'alfredo luis lagamon',
          'francis roy stanley falcon'
        ];
        
        // Filter to only show specific developers who have active tasks
        const activeDevelopers = (data.developers || []).filter((dev: DeveloperMetrics) => {
          const hasActiveTasks = dev.activeTasks > 0;
          const isAllowedDeveloper = allowedDevelopers.includes(dev.name.toLowerCase());
          return hasActiveTasks && isAllowedDeveloper;
        });
        
        console.log(`🔍 [DEBUG] Filtered developers: ${activeDevelopers.length} out of ${data.developers?.length || 0} total`);
        activeDevelopers.forEach((dev: DeveloperMetrics) => {
          console.log(`  ✅ ${dev.name} - ${dev.activeTasks} active tasks`);
        });
        
        setDevelopers(activeDevelopers);
      } else {
        console.error('Failed to fetch developer metrics');
        setDevelopers([]);
      }
    } catch (error) {
      console.error('Error fetching developer metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentDeveloper = developers[currentIndex];

  const nextCard = () => {
    if (currentIndex < developers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!currentDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/30 rounded-xl p-8">
          <IconUser className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No active developers</h3>
          <p className="text-gray-500">Developers will appear here when they have active tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Card Container */}
      <div 
        ref={cardRef}
        className={`relative h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-xl overflow-hidden transition-transform duration-200 cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        } flex flex-col min-h-[400px]`}
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
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-indigo-500/20 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Developer Avatar */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-400/30">
                {currentDeveloper.profilePictureUrl ? (
                  <img 
                    src={currentDeveloper.profilePictureUrl} 
                    alt={currentDeveloper.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <IconUser className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                )}
              </div>
              
              {/* Developer Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg sm:text-xl leading-tight">
                  {currentDeveloper.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentDeveloper.activityStatus)}`}>
                    {currentDeveloper.activityStatus.toUpperCase()}
                  </span>
                  <span className="text-indigo-300/80 text-xs">
                    {currentDeveloper.activeTasks} active tasks
                  </span>
                </div>
                <p className="text-indigo-200/60 text-xs mt-1">
                  Last active: {currentDeveloper.lastActive ? formatRelativeTime(currentDeveloper.lastActive) : 'Unknown'}
                </p>
              </div>
            </div>
            
            {/* Counter */}
            <div className="bg-black/30 px-3 py-1 rounded-full flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1}/{developers.length}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* Quick Performance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-black/20 border border-green-500/20 rounded-lg p-3 text-center">
              <IconCode className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-400">{currentDeveloper.componentsSubmitted.total}</div>
              <div className="text-xs text-green-300/80">Components</div>
            </div>
            <div className="bg-black/20 border border-blue-500/20 rounded-lg p-3 text-center">
              <IconDownload className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-400">{currentDeveloper.checkouts.weekly}</div>
              <div className="text-xs text-blue-300/80">Checkouts</div>
            </div>
            <div className="bg-black/20 border border-purple-500/20 rounded-lg p-3 text-center">
              <IconVideo className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-400">{currentDeveloper.loomVideos}</div>
              <div className="text-xs text-purple-300/80">Videos</div>
            </div>
            <div className="bg-black/20 border border-orange-500/20 rounded-lg p-3 text-center">
              <IconStar className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-orange-400">{currentDeveloper.points.weekly}</div>
              <div className="text-xs text-orange-300/80">Points</div>
            </div>
          </div>

          {/* Latest Update */}
          {currentDeveloper.latestUpdate && (
            <div className="bg-black/20 border border-indigo-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <IconActivity className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 font-medium text-sm">Latest Update</span>
                <span className="text-indigo-200/60 text-xs">
                  {formatTimeCST(currentDeveloper.latestUpdate.created_at)}
                </span>
              </div>
              {currentDeveloper.latestUpdate.task_title && (
                <div className="text-indigo-200/80 text-sm font-medium mb-2">
                  {currentDeveloper.latestUpdate.task_title}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none text-indigo-100/90">
                {processContent(currentDeveloper.latestUpdate.content)}
              </div>
            </div>
          )}

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Component Types */}
            <div className="bg-black/20 border border-gray-500/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <IconCheckbox className="w-4 h-4 text-gray-400" />
                Component Types
              </h4>
              <div className="space-y-2">
                {Object.entries(currentDeveloper.componentTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm capitalize">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-black/20 border border-gray-500/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <IconChartBar className="w-4 h-4 text-gray-400" />
                Performance
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Avg Module Time</span>
                  <span className="text-white font-medium">{currentDeveloper.avgModuleCompletionTime}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Components Total</span>
                  <span className="text-white font-medium">{currentDeveloper.componentsSubmitted.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Checkouts Total</span>
                  <span className="text-white font-medium">{currentDeveloper.checkouts.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Total Points</span>
                  <span className="text-white font-medium">{currentDeveloper.points.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="p-4 border-t border-indigo-500/20 flex items-center justify-between bg-black/20 flex-shrink-0">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex space-x-2">
            {developers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-indigo-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextCard}
            disabled={currentIndex === developers.length - 1}
            className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <IconChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 