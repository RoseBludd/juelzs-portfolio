"use client";

import { useState, useEffect, useRef } from "react";
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconClock, 
  IconUser, 
  IconTarget,
  IconVideo,
  IconFileText,
  IconBrain,
  IconCircleDot,
  IconExternalLink,
  IconRefresh
} from "@tabler/icons-react";

interface EnhancedDeveloper {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  dailyWorkHours: number;
  isWorking: boolean;
  sessionsToday: number;
  loomVideos: {
    count: number;
    videos: Array<{
      id: string;
      url: string;
      source: string;
      title: string;
      created_at: string;
    }>;
    sources: {
      task: number;
      module_url: number;
      module_metadata: number;
      module_description: number;
      module_updates: number;
      milestone_updates: number;
    };
  };
  scribes: {
    count: number;
    scribes: Array<{
      id: string;
      source: string;
      module_name?: string;
      created_at: string;
    }>;
    sources: {
      module_submission: number;
      cursor_chat: number;
      module_update: number;
    };
  };
  activeTasks: number;
  latestUpdate: {
    content: string;
    created_at: string;
  } | null;
  quickInsight: {
    status: string;
    insight: string;
    score: number;
  };
}

interface EnhancedActiveDeveloperCardsProps {
  loading?: boolean;
}

export const EnhancedActiveDeveloperCards = ({ loading = false }: EnhancedActiveDeveloperCardsProps) => {
  const [developers, setDevelopers] = useState<EnhancedDeveloper[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchEnhancedDevelopers();
    // No auto-refresh - only loads once or when manually refreshed
  }, []);

  // Generate daily accomplishment insight focused on today's work only
  const generateQuickInsight = (dev: any) => {
    const { name, workHours, loomVideos, scribes, activeTasks, modulesCreated } = dev;
    
    let status = "average";
    let insight = "";
    let score = 50;
    
    // Focus on daily accomplishments: work time + output + documentation
    const hasDocumentation = loomVideos > 0 || scribes > 0;
    const hasOutput = modulesCreated > 0;
    
    if (workHours >= 6 && hasOutput && hasDocumentation) {
      status = "excellent";
      insight = `${name} had an excellent day: ${workHours}h work, ${modulesCreated || 0} modules created, ${loomVideos} videos, ${scribes} cursor chats.`;
      score = 85 + Math.min(15, workHours * 2);
    } else if (workHours >= 4 && (hasOutput || hasDocumentation)) {
      status = "good";
      insight = `${name} made solid daily progress: ${workHours}h logged with ${modulesCreated || 0} modules and documentation.`;
      score = 65 + Math.min(20, workHours * 3);
    } else if (workHours >= 2 && activeTasks > 0) {
      status = "moderate";
      insight = `${name} worked ${workHours}h today on ${activeTasks} active tasks. Check daily output.`;
      score = 45 + Math.min(20, workHours * 5);
    } else if (workHours > 0) {
      status = "starting";
      insight = `${name} started the day with ${workHours}h logged. Monitor daily progress.`;
      score = 30 + Math.min(15, workHours * 10);
    } else {
      status = "quiet";
      insight = `${name} hasn't logged work time today. Check in on daily progress.`;
      score = 15;
    }
    
    return { status, insight, score: Math.min(100, Math.max(0, score)) };
  };

  const fetchEnhancedDevelopers = async () => {
    try {
      setIsLoading(true);
      
      // Use REAL Smart Analysis data for accuracy, but cache it to avoid constant heavy calls
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `smart-analysis-${today}`;
      
      // Check if we have cached data from today
      let cachedData = null;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - parsed.timestamp;
          // Use cache if less than 10 minutes old
          if (cacheAge < 10 * 60 * 1000) {
            cachedData = parsed.data;
            console.log('📦 Using cached Smart Analysis data');
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
      
      let smartData = cachedData;
      
      if (!smartData) {
        console.log('🔍 Fetching fresh Smart Analysis data...');
        const response = await fetch('/api/admin/developer-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: today })
        });
        
        if (response.ok) {
          smartData = await response.json();
          
          // Cache the data
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: smartData,
              timestamp: Date.now()
            }));
          } catch (e) {
            // Ignore cache errors
          }
        } else {
          console.error('Smart Analysis API failed:', response.status);
          setDevelopers([]);
          return;
        }
      }
      
      if (smartData?.success && smartData?.analyses) {
        // Convert REAL Smart Analysis data to enhanced format with corrected field mappings
        const enhancedDevelopers: EnhancedDeveloper[] = smartData.analyses.map((analysis: any) => {
          // Fix field mappings based on actual Smart Analysis API structure
          const realWorkHours = analysis.rawData.totalHoursWorked || 0;
          const realLoomVideos = analysis.rawData.loomVideos || 0;
          const realScribes = analysis.rawData.scribes || 0;
          
          // Fix active tasks mapping - use the correct field structure
          let realActiveTasks = 0;
          if (analysis.rawData.taskProgress) {
            realActiveTasks = analysis.rawData.taskProgress.inProgress || 
                            analysis.rawData.taskProgress.totalAssigned - analysis.rawData.taskProgress.completed || 0;
          }
          
          // Fix working status - ONLY based on active work session from daily workflow
          const isActivelyWorking = analysis.rawData.dailyWorkflow?.isWorking || false;
          
          // Fix sessions count - use the actual work sessions length from time tracking
          const sessionsCount = analysis.rawData.timeTracking?.workSessions?.length || 
                               (realWorkHours > 0 ? 1 : 0); // If they have hours but no session data, assume 1 session
          
          const quickInsight = generateQuickInsight({
            name: analysis.developer.name,
            workHours: realWorkHours,
            loomVideos: realLoomVideos,
            scribes: realScribes,
            activeTasks: realActiveTasks,
            modulesCreated: analysis.rawData.modulesCreated || 0
          });

          console.log(`🔧 Debug ${analysis.developer.name}:`, {
            workHours: realWorkHours,
            activeTasks: realActiveTasks,
            sessionsCount: sessionsCount,
            isWorking: isActivelyWorking,
            loomVideos: realLoomVideos,
            scribes: realScribes,
            modulesCreated: analysis.rawData.modulesCreated || 0,
            taskProgressRaw: analysis.rawData.taskProgress
          });

          return {
            id: analysis.developer.id,
            name: analysis.developer.name,
            email: analysis.developer.email,
            profilePictureUrl: undefined,
            dailyWorkHours: realWorkHours,
            isWorking: isActivelyWorking,
            sessionsToday: sessionsCount,
            loomVideos: {
              count: realLoomVideos,
              videos: analysis.rawData.loomVideoDetails || [],
              sources: analysis.rawData.loomVideoSources || {
                task: 0,
                module_url: 0,
                module_metadata: 0,
                module_description: 0,
                module_updates: 0,
                milestone_updates: 0
              }
            },
            scribes: {
              count: realScribes,
              scribes: analysis.rawData.scribeDetails || [],
              sources: analysis.rawData.scribeSources || {
                module_submission: 0,
                cursor_chat: 0,
                module_update: 0
              }
            },
            activeTasks: realActiveTasks,
            latestUpdate: analysis.rawData.moduleWork?.recentModules?.[0] ? {
              content: `Recent work: ${analysis.rawData.moduleWork.recentModules[0].name}`,
              created_at: analysis.rawData.moduleWork.recentModules[0].created_at
            } : null,
            quickInsight: {
              status: analysis.analysis.overallRating || 'average',
              insight: analysis.analysis.keyInsights?.[0] || quickInsight.insight,
              score: analysis.analysis.overallScore || quickInsight.score
            }
          };
        });

        // Sort by insight score (highest first)
        const sortedDevelopers = enhancedDevelopers.sort((a, b) => 
          b.quickInsight.score - a.quickInsight.score
        );
        
        console.log(`✅ Loaded ${sortedDevelopers.length} developers with REAL data`);
        console.log('📊 Sample accurate data:', sortedDevelopers[0] ? {
          name: sortedDevelopers[0].name,
          workHours: sortedDevelopers[0].dailyWorkHours,
          loomVideos: sortedDevelopers[0].loomVideos.count,
          scribes: sortedDevelopers[0].scribes.count,
          status: sortedDevelopers[0].quickInsight.status
        } : 'No data');
        
        setDevelopers(sortedDevelopers);
      } else {
        console.log('❌ No Smart Analysis data available');
        setDevelopers([]);
      }
      
    } catch (error) {
      console.error('Error fetching enhanced developers:', error);
      setDevelopers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRelativeTime = (dateInput: string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'starting': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'quiet': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    }
  };

  const getWorkingStatusColor = (isWorking: boolean) => {
    return isWorking 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Navigation functions
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

  // Swipe handlers
  const handleStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStart || !isDragging) return;
    const deltaX = clientX - dragStart.x;
    const deltaY = Math.abs(clientY - dragStart.y);
    if (deltaY < 50) setDragOffset(deltaX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    const threshold = 100;
    if (dragOffset > threshold) prevCard();
    else if (dragOffset < -threshold) nextCard();
    setDragStart(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleMouseUp = () => handleEnd();

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const handleTouchEnd = () => handleEnd();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevCard();
      else if (e.key === 'ArrowRight') nextCard();
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

  const currentDeveloper = developers[currentIndex];

  if (!currentDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-800/30 rounded-xl p-8">
          <IconUser className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No active developers</h3>
          <p className="text-gray-500">Loading enhanced developer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Navigation Arrows */}
      {developers.length > 1 && (
        <>
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full p-2 transition-all"
          >
            <IconChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={nextCard}
            disabled={currentIndex === developers.length - 1}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full p-2 transition-all"
          >
            <IconChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Card */}
      <div 
        className={`relative h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-xl overflow-hidden transition-transform duration-200 cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        } flex flex-col`}
        style={{ transform: `translateX(${dragOffset}px)` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="p-6 border-b border-indigo-500/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-indigo-400/30">
                {currentDeveloper.profilePictureUrl ? (
                  <img 
                    src={currentDeveloper.profilePictureUrl} 
                    alt={currentDeveloper.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <IconUser className="w-8 h-8 text-white" />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl">{currentDeveloper.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getWorkingStatusColor(currentDeveloper.isWorking)}`}>
                    {currentDeveloper.isWorking ? 'WORKING' : 'IDLE'}
                  </span>
                  <span className="text-indigo-300/80 text-xs">{currentDeveloper.activeTasks} tasks</span>
                </div>
                <div className="text-indigo-200/60 text-xs mt-1">
                  {currentDeveloper.sessionsToday} session{currentDeveloper.sessionsToday !== 1 ? 's' : ''} today
                </div>
              </div>
            </div>
            
                      {/* Counter & Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEnhancedDevelopers}
              disabled={isLoading}
              className="bg-black/30 hover:bg-black/50 disabled:opacity-50 rounded-full p-2 transition-colors"
              title="Refresh data"
            >
              <IconRefresh className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-black/30 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1}/{developers.length}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="p-4 border-b border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <IconBrain className="w-4 h-4 text-purple-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentDeveloper.quickInsight.status)}`}>
              {currentDeveloper.quickInsight.status.toUpperCase()}
            </span>
            <span className="text-purple-300 text-xs font-medium">{currentDeveloper.quickInsight.score}/100</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{currentDeveloper.quickInsight.insight}</p>
        </div>

        {/* Metrics Grid */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 border border-amber-500/20 rounded-lg p-4 text-center">
              <IconClock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-amber-400">{currentDeveloper.dailyWorkHours}h</div>
              <div className="text-sm text-amber-300/80">Today</div>
            </div>
            <div className="bg-black/20 border border-blue-500/20 rounded-lg p-4 text-center">
              <IconTarget className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-blue-400">{currentDeveloper.activeTasks}</div>
              <div className="text-sm text-blue-300/80">Active Tasks</div>
            </div>
          </div>

          {/* Enhanced Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-black/20 border border-red-500/20 rounded-lg p-4 text-center">
              <IconVideo className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-red-400">{currentDeveloper.loomVideos.count}</div>
              <div className="text-sm text-red-300/80">Loom Videos</div>
            </div>
            <div className="bg-black/20 border border-green-500/20 rounded-lg p-4 text-center">
              <IconFileText className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-400">{currentDeveloper.scribes.count}</div>
              <div className="text-sm text-green-300/80">Scribes</div>
            </div>
          </div>

          {/* Loom Videos Section */}
          {currentDeveloper.loomVideos.count > 0 && (
            <div className="bg-black/20 border border-red-500/20 rounded-lg p-4 mb-4">
              <h4 className="text-red-300 font-medium text-sm mb-3 flex items-center gap-2">
                <IconVideo className="w-4 h-4" />
                Recent Loom Videos
              </h4>
              <div className="space-y-2">
                {currentDeveloper.loomVideos.videos.map((video, index) => (
                  <div key={video.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-md">
                    <IconCircleDot className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{video.title}</div>
                      <div className="text-red-300/60 text-xs">{video.source}</div>
                    </div>
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <IconExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-red-300/60 text-xs">
                Sources: {Object.entries(currentDeveloper.loomVideos.sources)
                  .filter(([_, count]) => count > 0)
                  .map(([source, count]) => `${source}(${count})`)
                  .join(', ')}
              </div>
            </div>
          )}

          {/* Scribes Section */}
          {currentDeveloper.scribes.count > 0 && (
            <div className="bg-black/20 border border-green-500/20 rounded-lg p-4 mb-4">
              <h4 className="text-green-300 font-medium text-sm mb-3 flex items-center gap-2">
                <IconFileText className="w-4 h-4" />
                Recent Scribes
              </h4>
              <div className="space-y-2">
                {currentDeveloper.scribes.scribes.map((scribe, index) => (
                  <div key={scribe.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-md">
                    <IconCircleDot className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium">
                        {scribe.module_name || 'Cursor Chat'}
                      </div>
                      <div className="text-green-300/60 text-xs">{scribe.source}</div>
                    </div>
                    <div className="text-green-300/60 text-xs">
                      {formatRelativeTime(scribe.created_at)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-green-300/60 text-xs">
                Sources: {Object.entries(currentDeveloper.scribes.sources)
                  .filter(([_, count]) => count > 0)
                  .map(([source, count]) => `${source}(${count})`)
                  .join(', ')}
              </div>
            </div>
          )}

          {/* Latest Update */}
          {currentDeveloper.latestUpdate && (
            <div className="bg-black/20 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-purple-300 font-medium text-sm mb-2">Latest Update</h4>
              <p className="text-gray-300 text-sm line-clamp-3">{currentDeveloper.latestUpdate.content}</p>
              <div className="text-purple-300/60 text-xs mt-2">
                {formatRelativeTime(currentDeveloper.latestUpdate.created_at)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 