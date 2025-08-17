'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  IconX,
  IconUser,
  IconClock,
  IconActivity,
  IconCode,
  IconTarget,
  IconUsers,
  IconMessage,
  IconPhoto,
  IconChevronUp,
  IconFlag,
  IconBuilding,
  IconCircle,
  IconExternalLink
} from '@tabler/icons-react';
import Image from 'next/image';
import { formatDateCST, formatRelativeWithCST } from '@/utils/taskHelpers';
import { useTimezone } from '@/hooks/useTimezone';

interface CalendarUpdate {
  id: string;
  type: 'milestone_update' | 'module_update' | 'module_created' | 'task_assigned';
  developer_name: string;
  developer_profile_picture_url?: string;
  content: string;
  task_title?: string;
  task_id?: string;
  task_priority?: string;
  task_status?: string;
  task_department?: string;
  module_name?: string;
  created_at: string;
  date: string;
}

interface DayUpdatesPanelProps {
  date: string;
  updates: CalendarUpdate[];
  onClose: () => void;
}

type FilterType = 'all' | 'milestone_update' | 'module_update' | 'module_created' | 'task_assigned';

export const DayUpdatesPanel: React.FC<DayUpdatesPanelProps> = ({
  date,
  updates,
  onClose
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isClient, todayInCST, yesterdayInCST } = useTimezone();

  // Handle scroll events to show/hide back to top button
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      setShowBackToTop(scrollTop > 100); // Show button after scrolling 100px
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Filter updates based on active filter
  const filteredUpdates = activeFilter === 'all' 
    ? updates 
    : updates.filter(update => update.type === activeFilter);

  // Format the selected date for display
  const formatDisplayDate = (dateString: string) => {
    // Prevent hydration mismatch by only calculating on client
    if (!isClient) {
      // Return a safe fallback for SSR
      const date = new Date(dateString + 'T12:00:00');
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/Chicago'
      });
    }
    
    // Client-side calculation with proper timezone handling
    if (dateString === todayInCST) {
      return 'Today';
    } else if (dateString === yesterdayInCST) {
      return 'Yesterday';
    } else {
      // Parse the date string (which is in YYYY-MM-DD format from CST timezone)
      const date = new Date(dateString + 'T12:00:00'); // Add noon time to avoid timezone issues
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/Chicago'
      });
    }
  };

  // Group updates by type
  const groupedUpdates = filteredUpdates.reduce((groups, update) => {
    if (!groups[update.type]) {
      groups[update.type] = [];
    }
    groups[update.type].push(update);
    return groups;
  }, {} as Record<string, CalendarUpdate[]>);

  // Get filter options with counts
  const getFilterOptions = () => {
    const typeCounts = updates.reduce((counts, update) => {
      counts[update.type] = (counts[update.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return [
      { 
        key: 'all' as FilterType, 
        label: 'All', 
        count: updates.length,
        color: 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      },
      { 
        key: 'milestone_update' as FilterType, 
        label: 'Milestones', 
        count: typeCounts.milestone_update || 0,
        color: 'bg-teal-900/50 text-teal-300 hover:bg-teal-800/50'
      },
      { 
        key: 'module_update' as FilterType, 
        label: 'Module Updates', 
        count: typeCounts.module_update || 0,
        color: 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50'
      },
      { 
        key: 'module_created' as FilterType, 
        label: 'Modules Created', 
        count: typeCounts.module_created || 0,
        color: 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
      },
      { 
        key: 'task_assigned' as FilterType, 
        label: 'Task Assignments', 
        count: typeCounts.task_assigned || 0,
        color: 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
      }
    ].filter(option => option.key === 'all' || option.count > 0);
  };

  // Get type configuration
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'milestone_update':
        return {
          label: 'Milestone Updates',
          icon: IconTarget,
          color: 'from-teal-900/80 to-emerald-900/90',
          borderColor: 'border-teal-700/30',
          iconColor: 'text-teal-400',
          count: groupedUpdates[type]?.length || 0
        };
      case 'module_update':
        return {
          label: 'Module Updates',
          icon: IconCode,
          color: 'from-indigo-800/80 to-purple-900/90',
          borderColor: 'border-indigo-600/40',
          iconColor: 'text-indigo-300',
          count: groupedUpdates[type]?.length || 0
        };
      case 'module_created':
        return {
          label: 'Modules Created',
          icon: IconActivity,
          color: 'from-blue-900/80 to-indigo-900/90',
          borderColor: 'border-blue-700/30',
          iconColor: 'text-blue-400',
          count: groupedUpdates[type]?.length || 0
        };
      case 'task_assigned':
        return {
          label: 'Task Assignments',
          icon: IconUsers,
          color: 'from-green-900/80 to-emerald-900/90',
          borderColor: 'border-green-700/30',
          iconColor: 'text-green-400',
          count: groupedUpdates[type]?.length || 0
        };
      default:
        return {
          label: 'Other Updates',
          icon: IconMessage,
          color: 'from-gray-800/90 to-gray-900/95',
          borderColor: 'border-gray-600/40',
          iconColor: 'text-gray-400',
          count: groupedUpdates[type]?.length || 0
        };
    }
  };

  // Process content for display
  const processContent = (content: string) => {
    if (!content) return <span className="text-gray-400">No content provided</span>;
    
    // Truncate long content
    if (content.length > 150) {
      return <span>{content.substring(0, 150)}...</span>;
    }
    
    return <span>{content}</span>;
  };

  // Get priority styling
  const getPriorityConfig = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { color: 'text-red-400', bgColor: 'bg-red-900/30', label: 'High' };
      case 'medium':
        return { color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', label: 'Medium' };
      case 'low':
        return { color: 'text-green-400', bgColor: 'bg-green-900/30', label: 'Low' };
      default:
        return { color: 'text-gray-400', bgColor: 'bg-gray-800/30', label: priority || 'Unknown' };
    }
  };

  // Get status styling
  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { color: 'text-green-400', bgColor: 'bg-green-900/30', label: 'Completed' };
      case 'in_progress':
      case 'in progress':
        return { color: 'text-blue-400', bgColor: 'bg-blue-900/30', label: 'In Progress' };
      case 'pending':
        return { color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', label: 'Pending' };
      case 'on_hold':
      case 'on hold':
        return { color: 'text-orange-400', bgColor: 'bg-orange-900/30', label: 'On Hold' };
      default:
        return { color: 'text-gray-400', bgColor: 'bg-gray-800/30', label: status || 'Unknown' };
    }
  };

  // Get department styling
  const getDepartmentConfig = (department?: string) => {
    switch (department?.toLowerCase()) {
      case 'frontend':
        return { color: 'text-cyan-400', bgColor: 'bg-cyan-900/30', label: 'Frontend' };
      case 'backend':
        return { color: 'text-purple-400', bgColor: 'bg-purple-900/30', label: 'Backend' };
      case 'fullstack':
        return { color: 'text-indigo-400', bgColor: 'bg-indigo-900/30', label: 'Fullstack' };
      case 'devops':
        return { color: 'text-orange-400', bgColor: 'bg-orange-900/30', label: 'DevOps' };
      case 'design':
        return { color: 'text-pink-400', bgColor: 'bg-pink-900/30', label: 'Design' };
      default:
        return { color: 'text-gray-400', bgColor: 'bg-gray-800/30', label: department || 'General' };
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden flex flex-col max-h-[620px] relative">
      {/* Panel Header */}
      <div className="p-4 sm:p-6 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {formatDisplayDate(date)}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {filteredUpdates.length} of {updates.length} {updates.length === 1 ? 'update' : 'updates'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            title="Close panel"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5">
          {getFilterOptions().map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${activeFilter === option.key 
                  ? 'ring-2 ring-indigo-500/50 ' + option.color.replace('hover:', '')
                  : option.color
                }
              `}
            >
              {option.label} {option.count > 0 && (
                <span className="ml-1 opacity-75">({option.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Updates Content */}
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto" ref={scrollContainerRef}>
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-8">
            <IconActivity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">
              {activeFilter === 'all' 
                ? 'No updates for this date' 
                : `No ${getFilterOptions().find(f => f.key === activeFilter)?.label.toLowerCase()} for this date`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedUpdates).map(([type, typeUpdates]) => {
              const config = getTypeConfig(type);
              const Icon = config.icon;
              
              return (
                <div key={type} className="space-y-3">
                  {/* Type Header */}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    <h4 className="text-sm font-medium text-white">
                      {config.label}
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                      {config.count}
                    </span>
                  </div>

                  {/* Updates List */}
                  <div className="space-y-2">
                    {typeUpdates.map((update) => {
                      const timeInfo = formatRelativeWithCST(update.created_at);
                      
                      return (
                        <div
                          key={update.id}
                          className={`
                            p-3 rounded-lg border bg-gradient-to-r
                            ${config.color} ${config.borderColor}
                            hover:bg-opacity-80 transition-all duration-200
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {/* Developer Avatar */}
                            <div className="flex-shrink-0">
                              {update.developer_profile_picture_url ? (
                                <Image
                                  src={update.developer_profile_picture_url}
                                  alt={update.developer_name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                  <IconUser className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Update Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                  {update.developer_name}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <IconClock className="w-3 h-3" />
                                  {timeInfo.relative}
                                </span>
                              </div>
                              
                              {/* Task Information */}
                              {update.task_title && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <IconTarget className="w-3 h-3 text-indigo-400" />
                                    <span className="text-sm font-medium text-indigo-300 break-words">
                                      {update.task_title}
                                    </span>
                                    {update.task_id && (
                                      <button
                                        onClick={() => window.open(`/admin/tasks/${update.task_id}`, '_blank')}
                                        className="text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                                        title="View task details"
                                      >
                                        <IconExternalLink className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Module Name within Task */}
                                  {update.module_name && (
                                    <div className="flex items-center gap-1 mb-1">
                                      <IconCode className="w-3 h-3 text-cyan-400" />
                                      <span className="text-xs text-cyan-300 break-words">
                                        Module: {update.module_name}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Task Badges */}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {update.task_priority && (
                                      <span className={`
                                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                        ${getPriorityConfig(update.task_priority).bgColor} ${getPriorityConfig(update.task_priority).color}
                                      `}>
                                        <IconFlag className="w-3 h-3" />
                                        {getPriorityConfig(update.task_priority).label}
                                      </span>
                                    )}
                                    
                                    {update.task_status && (
                                      <span className={`
                                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                        ${getStatusConfig(update.task_status).bgColor} ${getStatusConfig(update.task_status).color}
                                      `}>
                                        <IconCircle className="w-3 h-3" />
                                        {getStatusConfig(update.task_status).label}
                                      </span>
                                    )}
                                    
                                    {update.task_department && (
                                      <span className={`
                                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                        ${getDepartmentConfig(update.task_department).bgColor} ${getDepartmentConfig(update.task_department).color}
                                      `}>
                                        <IconBuilding className="w-3 h-3" />
                                        {getDepartmentConfig(update.task_department).label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Module Name (for module-related updates without task info) */}
                              {!update.task_title && update.module_name && (
                                <p className="text-xs text-gray-300 mb-1 break-words flex items-center gap-1">
                                  <IconCode className="w-3 h-3" />
                                  {update.module_name}
                                </p>
                              )}
                              
                              {/* Update Content */}
                              <p className="text-sm text-gray-200 break-words overflow-wrap-anywhere">
                                {processContent(update.content)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-4 right-4 p-2.5 rounded-full bg-indigo-600/80 backdrop-blur-sm text-white hover:bg-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl z-10"
          title="Scroll to top"
        >
          <IconChevronUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}; 