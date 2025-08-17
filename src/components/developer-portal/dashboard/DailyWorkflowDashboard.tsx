'use client';

import { 
  IconClock, 
  IconTarget, 
  IconCheck,
  IconVideo,
  IconCode,
  IconUpload,
  IconPlayerPlay,
  IconPlayerPause,
  IconX,
  IconCalendar,
  IconAlertTriangle,
  IconEdit,
  IconTrendingUp,
  IconClipboardList,
  IconHourglass,
  IconCoffee,
  IconBolt
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { toZonedTime, format, formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';
import SubmissionForm from '@/app/developer/submit/SubmissionForm';

interface DailyGoals {
  cursor_chats: { required: number; completed: number };
  loom_videos: { required: number; completed: number };
  code_submissions: { required: number; completed: number };
  scribes: { required: number; completed: number };
  work_hours: { target: number; completed: number };
}

interface WorkflowData {
  is_working: boolean;
  is_on_break?: boolean;
  break_type?: string | null;
  session_start?: string | null;
  break_start?: string | null;
  current_priority: any;
  todays_submissions: any;
  time_entries: any[];
  daily_goals: DailyGoals;
  can_end_day: boolean;
  total_work_minutes: number;
  break_minutes: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
}

interface DailyWorkflowDashboardProps {
  tasks: Task[];
}

// Get user's timezone
const getUserTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Parse timestamp safely with timezone awareness
const parseTimestampSafely = (timestamp: string | null): Date | null => {
  if (!timestamp) return null;
  
  try {
    // The API now returns proper ISO 8601 timestamps with timezone info
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error(`Error parsing timestamp "${timestamp}":`, error);
    return null;
  }
};

// Format time for display with specified timezone and format
const formatTimeForDisplay = (timestamp: string | null, timezone: string = 'America/Chicago', format: string = '12'): string => {
  if (!timestamp) return 'N/A';
  
  const date = parseTimestampSafely(timestamp);
  if (!date) return 'Invalid time';
  
  try {
    const timePattern = format === '12' ? 'hh:mm a' : 'HH:mm';
    return formatInTimeZone(date, timezone, timePattern);
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return 'Invalid time';
  }
};

// Code Submission Modal Component
const CodeSubmissionModal = ({ 
  isOpen, 
  onClose, 
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess?: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Submit Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <SubmissionForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
};

// Priority Selection Modal Component
const PrioritySelectionModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  tasks 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (task: Task, note: string) => void; 
  tasks: Task[]; 
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [priorityNote, setPriorityNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedTask && priorityNote.trim()) {
      onSelect(selectedTask, priorityNote);
      setSelectedTask(null);
      setPriorityNote('');
      onClose();
    } else {
      toast.error('Please select a task and add a note about your focus');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Set Today's Priority</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-300 text-sm mb-4">
          Choose which task you'll focus on today. This helps you stay focused and provides clarity for progress tracking.
        </p>

        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTask?.id === task.id
                  ? 'border-blue-500 bg-blue-600/20'
                  : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
              }`}
            >
              <h4 className="font-medium text-white text-sm">{task.title}</h4>
              {task.description && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded bg-orange-600/20 text-orange-300">
                  {task.priority || 'urgent priority'}
                </span>
                <span className="text-xs text-gray-400">Est. 8h</span>
              </div>
            </div>
          ))}
        </div>

        {selectedTask && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Today's Focus Note *
            </label>
            <textarea
              value={priorityNote}
              onChange={(e) => setPriorityNote(e.target.value)}
              placeholder="What specifically will you work on today? What's your main goal or outcome?"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              This helps track daily progress and provides context for your work.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTask || !priorityNote.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Set Priority
          </button>
        </div>
      </div>
    </div>
  );
};

export const DailyWorkflowDashboard = ({ tasks }: DailyWorkflowDashboardProps) => {
  const [data, setData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showCodeSubmissionModal, setShowCodeSubmissionModal] = useState(false);
  const [showEndDaySection, setShowEndDaySection] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realtimeWorkMinutes, setRealtimeWorkMinutes] = useState(0);
  const [realtimeBreakMinutes, setRealtimeBreakMinutes] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    // Load timezone from localStorage or default to CST
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedTimezone') || 'America/Chicago';
    }
    return 'America/Chicago';
  });
  const [timeFormat, setTimeFormat] = useState(() => {
    // Load time format from localStorage or default to 12-hour
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timeFormat') || '12';
    }
    return '12';
  });

  // Common timezone options
  const timezoneOptions = [
    { value: 'America/Chicago', label: 'CST', offset: '-6' },
    { value: 'America/New_York', label: 'EST', offset: '-5' },
    { value: 'America/Denver', label: 'MST', offset: '-7' },
    { value: 'America/Los_Angeles', label: 'PST', offset: '-8' },
    { value: 'UTC', label: 'UTC', offset: '+0' },
    { value: 'America/Phoenix', label: 'MST (AZ)', offset: '-7' },
    { value: 'Asia/Manila', label: 'PHT', offset: '+8' },
    { value: 'Europe/London', label: 'GMT', offset: '+0' },
    { value: 'Europe/Berlin', label: 'CET', offset: '+1' },
    { value: 'Asia/Tokyo', label: 'JST', offset: '+9' }
  ];

  // Time format options
  const timeFormatOptions = [
    { value: '12', label: '12h' },
    { value: '24', label: '24h' }
  ];

  // Save timezone and time format selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedTimezone', selectedTimezone);
      localStorage.setItem('timeFormat', timeFormat);
    }
  }, [selectedTimezone, timeFormat]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Real-time work and break time calculation - simplified to use API data more directly
  useEffect(() => {
    if (!data) return;

    const updateRealTimeMinutes = () => {
      if (!data) return;

      // Use the total work/break minutes from the API as base (completed sessions)
      let workMinutes = data.total_work_minutes || 0;
      let breakMinutes = data.break_minutes || 0;

      // Only add real-time calculations for active sessions
      if (data.is_working && data.session_start) {
        const now = new Date();
        const sessionStart = parseTimestampSafely(data.session_start);

        if (sessionStart && !isNaN(sessionStart.getTime())) {
          const sessionElapsedMs = now.getTime() - sessionStart.getTime();
          const sessionElapsedMinutes = Math.floor(sessionElapsedMs / 60000);

          // Calculate current session break time only
          let currentSessionBreakMinutes = 0;
          if (data.is_on_break && data.break_start) {
            const breakStart = parseTimestampSafely(data.break_start);
            if (breakStart && !isNaN(breakStart.getTime())) {
              const currentBreakElapsedMs = now.getTime() - breakStart.getTime();
              currentSessionBreakMinutes = Math.floor(currentBreakElapsedMs / 60000);
              
              // Add current break time to total break minutes
              breakMinutes += Math.max(0, currentSessionBreakMinutes);
            }
          }

          // Current session work time = session elapsed - current session break time
          const currentSessionWorkMinutes = Math.max(0, sessionElapsedMinutes - currentSessionBreakMinutes);
          
          // Add current session work time to API's work minutes (don't replace)
          workMinutes += currentSessionWorkMinutes;
        }
      }

      setRealtimeWorkMinutes(Math.max(0, workMinutes));
      setRealtimeBreakMinutes(Math.max(0, breakMinutes));
    };

    if (data) {
      // Update immediately
      updateRealTimeMinutes();

      // Update every second for real-time tracking
      const interval = setInterval(updateRealTimeMinutes, 1000);
      return () => clearInterval(interval);
    }
  }, [data]);

  // Load data
  const loadData = async () => {
    try {
      // Make API calls and handle failures gracefully
      const [workflowResponse, statusResponse] = await Promise.allSettled([
        fetch('/api/developer/daily-workflow', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/developer/work-session', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      let workflowData = null;
      let statusData = { is_working: false }; // Default fallback

      // Handle workflow API response
      if (workflowResponse.status === 'fulfilled' && workflowResponse.value.ok) {
        workflowData = await workflowResponse.value.json();
      } else {
        console.error('Daily workflow API failed:', workflowResponse.status === 'fulfilled' ? workflowResponse.value.status : workflowResponse.reason);
        // Set default data structure to prevent component crash
        workflowData = {
          current_priority: null,
          todays_submissions: [],
          time_entries: [],
          daily_goals: {
            cursor_chats: { required: 1, completed: 0 },
            loom_videos: { required: 1, completed: 0 },
            code_submissions: { required: 1, completed: 0 },
            scribes: { required: 0, completed: 0 },
            work_hours: { target: 8, completed: 0 }
          },
          can_end_day: false,
          total_work_minutes: 0,
          break_minutes: 0
        };
      }

      // Handle work status API response
      if (statusResponse.status === 'fulfilled' && statusResponse.value.ok) {
        statusData = await statusResponse.value.json();
      } else {
        console.error('Work status API failed:', statusResponse.status === 'fulfilled' ? statusResponse.value.status : statusResponse.reason);
        // Use default fallback
      }

      // Set data even if one API failed - use the timezone-aware timestamps from API
      const combinedData = {
        ...workflowData,
        is_working: statusData.is_working,
        is_on_break: (statusData as any).is_on_break || false,
        break_type: (statusData as any).break_type || null,
        session_start: (statusData as any).session_start || null,
        break_start: (statusData as any).break_start || null
      };
      
      setData(combinedData);

    } catch (error) {
      console.error('Error loading workflow data:', error);
      // Set minimal fallback data to prevent white screen
      setData({
        is_working: false,
        is_on_break: false,
        break_type: null,
        session_start: null,
        break_start: null,
        current_priority: null,
        todays_submissions: [],
        time_entries: [],
        daily_goals: {
          cursor_chats: { required: 1, completed: 0 },
          loom_videos: { required: 1, completed: 0 },
          code_submissions: { required: 1, completed: 0 },
          scribes: { required: 0, completed: 0 },
          work_hours: { target: 8, completed: 0 }
        },
        can_end_day: false,
        total_work_minutes: 0,
        break_minutes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 text-center text-gray-400">
        <div className="flex justify-center items-center">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3">Loading Daily Workflow...</span>
        </div>
      </div>
    );
  }

  // Work session functions
  const handleWorkAction = async (action: string, breakType?: string) => {
    if (isActionLoading) return; // Prevent multiple clicks
    
    setIsActionLoading(true);
    
    try {
      const response = await fetch('/api/developer/work-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, break_type: breakType })
      });

      if (response.ok) {
        const result = await response.json();
        let message = '';
        
        switch (action) {
          case 'start':
            message = '🚀 Work session started!';
            break;
          case 'end':
            message = '✅ Work session ended!';
            break;
          case 'break_start':
            message = `☕ ${breakType?.charAt(0).toUpperCase()}${breakType?.slice(1)} break started!`;
            break;
          case 'break_end':
            message = '💪 Break ended, back to work!';
            break;
          default:
            message = 'Action completed successfully';
        }
        
        toast.success(message);
        
        // Add a small delay before refreshing data to allow database to update
        setTimeout(() => {
          loadData();
        }, 500);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${action} work session`);
      }
    } catch (error) {
      console.error('Error updating work session:', error);
      toast.error('Error updating work session');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Priority selection
  const handlePrioritySelect = async (task: Task, note: string) => {
    try {
      const response = await fetch('/api/developer/daily-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task_id: task.id
        })
      });

      if (response.ok) {
        toast.success('Daily priority set successfully');
        loadData();
      } else {
        toast.error('Failed to set priority');
      }
    } catch (error) {
      toast.error('Error setting priority');
    }
  };

  // End day function
  const handleEndDay = async () => {
    if (!progressUpdate.trim()) {
      toast.error('Please provide a progress update before ending your day');
      return;
    }

    try {
      // Submit progress update first
      await fetch('/api/developer/progress-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: progressUpdate,
          update_type: 'daily_summary',
          percentage_complete: 0
        })
      });

      // Then end the day
      const response = await fetch('/api/developer/end-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: progressUpdate })
      });

      if (response.ok) {
        toast.success('Day ended successfully');
        setShowEndDaySection(false);
        setProgressUpdate('');
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to end day');
      }
    } catch (error) {
      toast.error('Error ending day');
    }
  };

  // Code submission success handler
  const handleCodeSubmissionSuccess = () => {
    setShowCodeSubmissionModal(false);
    loadData(); // Refresh the workflow data to update submission counts
    toast.success('Code submitted successfully!');
  };

  // Helper functions
  const getGoalProgress = (goal: { required: number; completed: number }) => {
    if (goal.required === 0) return 0;
    return Math.min((goal.completed / goal.required) * 100, 100);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900/90 to-blue-900/90 rounded-lg border border-blue-800/30 backdrop-blur-sm">
        {/* Top Row: Title and Time */}
        <div className="flex items-center justify-between p-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <IconClock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Workflow</h1>
              <p className="text-sm text-blue-200/70">Track your work sessions and progress</p>
            </div>
          </div>

          {/* Right: Time Display */}
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-white mb-1 tracking-wider">
              {formatInTimeZone(currentTime, selectedTimezone, timeFormat === '12' ? 'hh:mm a' : 'HH:mm')}
            </div>
            <div className="text-sm text-blue-200/80 mb-2">
              {formatInTimeZone(currentTime, selectedTimezone, 'MMM dd, yyyy')}
            </div>
            
            {/* Time Controls */}
            <div className="flex items-center gap-2 justify-end">
              {/* Time Format Toggle */}
              <div className="relative">
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="text-xs bg-gray-800/90 text-blue-100 px-2 py-1 rounded border border-blue-600/50 cursor-pointer hover:bg-gray-700/90 transition-colors font-medium appearance-none pr-6"
                  style={{ appearance: 'none', backgroundImage: 'none' }}
                >
                  {timeFormatOptions.map((format) => (
                    <option key={format.value} value={format.value} className="bg-gray-800 text-blue-100">
                      {format.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-blue-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Timezone Dropdown */}
              <div className="relative">
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="text-xs bg-gray-800/90 text-blue-100 px-2 py-1 rounded border border-blue-600/50 cursor-pointer hover:bg-gray-700/90 transition-colors font-medium appearance-none pr-6"
                  style={{ appearance: 'none', backgroundImage: 'none' }}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-gray-800 text-blue-100">
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
                <svg className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-blue-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Header with Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 pb-4">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Status</h3>
              <IconClock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-300">
                {data.is_on_break ? (
                  <span className="flex items-center gap-1">
                    <IconCoffee className="w-4 h-4 text-yellow-400" />
                    On {data.break_type || 'short'} break
                  </span>
                ) : data.is_working ? (
                  <span className="flex items-center gap-1">
                    <IconBolt className="w-4 h-4 text-green-400" />
                    Working
                  </span>
                ) : (
                  'Not working'
                )}
              </div>
              
              {data.is_working && data.session_start && (
                <div className="text-xs text-gray-400 mt-1">
                  Session started: {formatTimeForDisplay(data.session_start, selectedTimezone, timeFormat)}
                </div>
              )}

              {data.is_on_break ? (
                <button
                  onClick={() => handleWorkAction('break_end')}
                  disabled={isActionLoading}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IconPlayerPlay className="w-4 h-4" />
                  )}
                  End Break
                </button>
              ) : data.is_working ? (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleWorkAction('break_start', 'short')}
                      disabled={isActionLoading}
                      className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors flex items-center justify-center"
                    >
                      {isActionLoading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Short'
                      )}
                    </button>
                    <button
                      onClick={() => handleWorkAction('break_start', 'lunch')}
                      disabled={isActionLoading}
                      className="flex-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors flex items-center justify-center"
                    >
                      {isActionLoading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Lunch'
                      )}
                    </button>
                    <button
                      onClick={() => handleWorkAction('break_start', 'long')}
                      disabled={isActionLoading}
                      className="flex-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors flex items-center justify-center"
                    >
                      {isActionLoading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Long'
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleWorkAction('end')}
                    disabled={isActionLoading}
                    className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'End Work'
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleWorkAction('start')}
                  disabled={isActionLoading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isActionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IconPlayerPlay className="w-4 h-4" />
                  )}
                  Start Work
                </button>
              )}
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Today's Time</h3>
              <IconHourglass className="w-5 h-5 text-green-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-green-400">
                    {formatTime(realtimeWorkMinutes)}
                  </div>
                  {data.is_working && !data.is_on_break && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="text-sm text-gray-300">Work</div>
              </div>
              {realtimeBreakMinutes > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-yellow-400">
                      {formatTime(realtimeBreakMinutes)}
                    </div>
                    {data.is_on_break && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">Break</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300 mt-2">
              <span>Target: 8h 0m</span>
              <span>Total: {formatTime(realtimeWorkMinutes + realtimeBreakMinutes)}</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((realtimeWorkMinutes / 480) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Today's Priority</h3>
              <button 
                onClick={() => setShowPriorityModal(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                <IconEdit className="w-4 h-4" />
              </button>
            </div>
            {data.current_priority ? (
              <div>
                <div className="text-sm text-white font-medium">{data.current_priority.title}</div>
                {data.current_priority.description && (
                  <div className="text-xs text-gray-300 mt-1">{data.current_priority.description}</div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowPriorityModal(true)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Set daily priority
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily Goals Progress */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <IconTarget className="w-5 h-5 text-green-400" />
            Daily Goals Progress
          </h3>
          <div className="text-xs text-gray-400">
            * These are minimum daily requirements
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Cursor Chats */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconUpload className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Cursor Chats</span>
            </div>
            <div className="text-lg font-bold text-white mb-2">
              {data.daily_goals.cursor_chats.completed} / {data.daily_goals.cursor_chats.required}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getGoalProgress(data.daily_goals.cursor_chats)}%` }}
              ></div>
            </div>
          </div>

          {/* Loom Videos */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconVideo className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-white">Loom Videos</span>
            </div>
            <div className="text-lg font-bold text-white mb-2">
              {data.daily_goals.loom_videos.completed} / {data.daily_goals.loom_videos.required}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getGoalProgress(data.daily_goals.loom_videos)}%` }}
              ></div>
            </div>
          </div>

          {/* Code Submissions */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconCode className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Code Submissions</span>
            </div>
            <div className="text-lg font-bold text-white mb-2">
              {data.daily_goals.code_submissions.completed} / {data.daily_goals.code_submissions.required}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getGoalProgress(data.daily_goals.code_submissions)}%` }}
              ></div>
            </div>
          </div>

          {/* Module Scribes */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconClipboardList className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Module Scribes</span>
            </div>
            <div className="text-lg font-bold text-white mb-2">
              {data.daily_goals.scribes.completed} / {data.daily_goals.scribes.required}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${
                    data.daily_goals.scribes.required > 0 
                      ? getGoalProgress(data.daily_goals.scribes) 
                      : 0
                  }%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.open('/developer/cursor-chats', '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <IconUpload className="w-4 h-4" />
            Upload Cursor Chat
          </button>
          
          <button
            onClick={() => setShowCodeSubmissionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <IconCode className="w-4 h-4" />
            Submit Code
          </button>
        </div>
      </div>

      {/* End Day Section - Show when ready to end day OR when manually activated */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <IconCheck className="w-5 h-5 text-green-400" />
            End Your Day
          </h3>
          {!showEndDaySection && (
            <button
              onClick={() => setShowEndDaySection(true)}
              disabled={!data.can_end_day}
              className={`px-4 py-2 rounded-lg transition-colors ${
                data.can_end_day 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 cursor-not-allowed text-gray-400'
              }`}
            >
              {data.can_end_day ? 'End My Day' : 'Complete Requirements'}
            </button>
          )}
        </div>

        {!data.can_end_day && !showEndDaySection && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <IconAlertTriangle className="w-4 h-4" />
              Missing required submissions for today
            </div>
            <ul className="mt-2 text-sm text-yellow-300 space-y-1">
              {data.daily_goals.cursor_chats.completed === 0 && (
                <li>• Upload at least 1 cursor chat</li>
              )}
              {data.daily_goals.loom_videos.completed === 0 && (
                <li>• Record at least 1 loom video</li>
              )}
              {data.daily_goals.code_submissions.completed === 0 && (
                <li>• Submit at least 1 code submission</li>
              )}
            </ul>
          </div>
        )}

        {showEndDaySection && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Daily Summary & Tomorrow's Plan *
              </label>
              <textarea
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
                placeholder="What did you accomplish today? What challenges did you face? Where will you pick up tomorrow?"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                rows={4}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                This helps track daily progress and plan for tomorrow's work.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEndDaySection(false);
                  setProgressUpdate('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndDay}
                disabled={!progressUpdate.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <IconCheck className="w-4 h-4" />
                Complete Day
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PrioritySelectionModal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        onSelect={handlePrioritySelect}
        tasks={tasks}
      />
      
      <CodeSubmissionModal
        isOpen={showCodeSubmissionModal}
        onClose={() => setShowCodeSubmissionModal(false)}
        onSuccess={handleCodeSubmissionSuccess}
      />
    </div>
  );
}; 