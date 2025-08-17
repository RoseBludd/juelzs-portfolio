"use client";

import {
  IconSearch,
  IconFilter,
  IconGrid3x3,
  IconList,
  IconUserCircle,
  IconChevronDown,
  IconRefresh,
  IconPlus,
  IconStar,
  IconClock,
  IconActivity,
  IconMail,
  IconCode,
  IconChevronLeft,
  IconChevronRight,
  IconMessage,
  IconBriefcase,
  IconTrendingUp,
  IconCalendar,
  IconEye,
  IconProgress,
  IconCheck,
  IconX,
  IconUsers,
  IconSettings,
  IconSend,
  IconChartBar,
  IconChartPie,
  IconChartLine,
  IconTarget,
  IconAlertTriangle,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface PerformanceMetrics {
  task_completion_rate: number;
  avg_response_time_hours: number;
  on_time_delivery_rate: number;
  code_quality_score: number;
  communication_score: number;
  reliability_score: number | null;
}

interface CurrentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  progress: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

interface Availability {
  hours_per_week: number;
  timezone: string;
  preferred_communication: string;
}

interface Developer {
  id: string;
  name: string;
  email: string;
  profile_picture_url?: string;
  role: string;
  status: string;
  progression_stage: string;
  contract_signed: boolean;
  skills: string[];
  preferred_technologies: string[];
  created_at: string;
  last_activity: string;
  active_tasks: number;
  completed_tasks: number;
  average_score: number | null;
  total_earned: number;
  current_work_status: string;
  specializations: string[];
  performance_metrics: PerformanceMetrics;
  current_tasks: CurrentTask[];
  recent_activity: RecentActivity[];
  availability: Availability;
  // Enhanced working status fields
  is_working?: boolean;
  is_on_break?: boolean;
  break_type?: string | null;
  session_start?: string | null;
  break_start?: string | null;
  work_minutes_today?: number;
  break_minutes_today?: number;
  // Phone/WhatsApp field (actual database field)
  phone?: string;
}

interface DevelopersResponse {
  developers: Developer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    total: number;
    active: number;
    working: number;
    available: number;
    totalEarnings: number;
    averageScore: number;
    averageTaskCompletion: number;
    totalActiveTasks: number;
  };
}

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [roleFilter, setRoleFilter] = useState('all');
  const [workStatusFilter, setWorkStatusFilter] = useState('all');
  // Enhanced Phase 3 filters
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [technologyFilter, setTechnologyFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Bulk actions states  
  const [selectedDevelopers, setSelectedDevelopers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'status' | 'task' | 'message' | null>(null);
  
  // Analytics dashboard state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Export functionality state
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Data states
  const [pagination, setPagination] = useState<DevelopersResponse['pagination'] | null>(null);
  const [summary, setSummary] = useState<DevelopersResponse['summary'] | null>(null);

  // Fetch developers data
  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
        workStatus: workStatusFilter,
        performance: performanceFilter,
        skill: skillFilter,
        technology: technologyFilter,
        availability: availabilityFilter,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '12'
      });

      const response = await fetch(`/api/admin/developers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch developers');
      }

      const data: DevelopersResponse = await response.json();
      setDevelopers(data.developers);
      setPagination(data.pagination);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      console.error('Error fetching developers:', err);
      setError('Failed to load developers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchDevelopers();
  }, [searchTerm, statusFilter, roleFilter, workStatusFilter, performanceFilter, skillFilter, technologyFilter, availabilityFilter, sortBy, sortOrder, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, roleFilter, workStatusFilter, performanceFilter, skillFilter, technologyFilter, availabilityFilter]);

  // Bulk action functions
  const toggleDeveloperSelection = (developerId: string) => {
    const newSelected = new Set(selectedDevelopers);
    if (newSelected.has(developerId)) {
      newSelected.delete(developerId);
    } else {
      newSelected.add(developerId);
    }
    setSelectedDevelopers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllDevelopers = () => {
    const allIds = new Set(developers.map(dev => dev.id));
    setSelectedDevelopers(allIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedDevelopers(new Set());
    setShowBulkActions(false);
    setBulkActionType(null);
  };

  const handleExport = async (format: 'csv' | 'json', includeMetrics: boolean, includeAvailability: boolean) => {
    try {
      const params = new URLSearchParams({
        format,
        includeMetrics: includeMetrics.toString(),
        includeAvailability: includeAvailability.toString(),
        // Apply current filters to export
        status: statusFilter,
        role: roleFilter,
        workStatus: workStatusFilter
      });

      const response = await fetch(`/api/admin/developers/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `developers-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowExportModal(false);
      console.log('✅ Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleBulkAction = async (action: 'status' | 'task' | 'message', data: any) => {
    try {
      console.log('Bulk action:', action, 'for developers:', Array.from(selectedDevelopers), 'with data:', data);
      
      const response = await fetch('/api/admin/developers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          developerIds: Array.from(selectedDevelopers),
          data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to perform bulk action');
      }

      const result = await response.json();
      console.log('✅ Bulk action completed:', result);
      
      // Refresh data and clear selection
      await fetchDevelopers();
      clearSelection();
      
      // Show success message
      alert(`Successfully applied ${action} to ${result.affectedDevelopers} developer(s)`);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert(`Bulk action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWorkTime = (minutes: number) => {
    if (minutes === 0) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
      inactive: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getWorkStatusIndicator = (developer: Developer) => {
    // Enhanced status based on working session data
    if (developer.is_working) {
      if (developer.is_on_break) {
        const breakType = developer.break_type || 'short';
        const breakColors = {
          short: { color: 'bg-yellow-400', text: 'Short Break', icon: '☕' },
          lunch: { color: 'bg-orange-400', text: 'Lunch Break', icon: '🍽️' },
          long: { color: 'bg-amber-400', text: 'Long Break', icon: '🛋️' }
        };
        const breakInfo = breakColors[breakType as keyof typeof breakColors] || breakColors.short;
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${breakInfo.color} animate-pulse`}></div>
            <span className="text-xs text-gray-400">{breakInfo.icon} {breakInfo.text}</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-400">💪 Working</span>
          </div>
        );
      }
    }

    // Fallback to current_work_status for non-working developers
    const indicators = {
      working: { color: 'bg-green-400', text: 'Working', pulse: true, icon: '💪' },
      available: { color: 'bg-blue-400', text: 'Available', pulse: false, icon: '✅' },
      offline: { color: 'bg-gray-400', text: 'Offline', pulse: false, icon: '⚫' },
      pending: { color: 'bg-yellow-400', text: 'Pending', pulse: false, icon: '⏳' },
    };
    const indicator = indicators[developer.current_work_status as keyof typeof indicators] || indicators.offline;
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${indicator.color} ${indicator.pulse ? 'animate-pulse' : ''}`}></div>
        <span className="text-xs text-gray-400">{indicator.icon} {indicator.text}</span>
      </div>
    );
  };

  const getRoleIcon = (role: string) => {
    return <IconCode className="w-4 h-4" />;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const ProgressBar = ({ value, max = 100, color = 'bg-indigo-500' }: { value: number; max?: number; color?: string }) => (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      ></div>
    </div>
  );

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-500/20 text-red-300 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[priority as keyof typeof colors]}`}>
        {priority}
      </span>
    );
  };

  const QuickActions = ({ developer }: { developer: Developer }) => {
    const formatPhoneForWhatsApp = (phone: string) => {
      // Remove all non-digit characters except +
      let cleaned = phone.replace(/[^\d+]/g, '');
      
      // If it starts with +, keep it, otherwise add country code logic
      if (cleaned.startsWith('+')) {
        return cleaned;
      }
      
      // If it's a Philippine number starting with 9, add +63
      if (cleaned.startsWith('9') && cleaned.length === 10) {
        return `+63${cleaned}`;
      }
      
      // If it's a US number (10 digits), add +1
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      }
      
      // For other cases, assume it's already in correct format
      return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    };
    
    return (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/admin/developers/${developer.id}`}
          className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors"
          onClick={(e) => e.stopPropagation()}
          title="View Profile"
        >
          <IconEye className="w-4 h-4 text-gray-300" />
        </Link>
        {developer.phone ? (
          <button
            className="p-2 bg-green-600/50 hover:bg-green-600 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const whatsappNumber = formatPhoneForWhatsApp(developer.phone!);
              window.open(`https://wa.me/${whatsappNumber}`, '_blank');
            }}
            title={`WhatsApp: ${developer.phone}`}
          >
            <IconMessage className="w-4 h-4 text-green-300" />
          </button>
        ) : (
          <button
            className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Send Message"
          >
            <IconMessage className="w-4 h-4 text-gray-300" />
          </button>
        )}
        <button
          className="p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors"
          onClick={(e) => e.stopPropagation()}
          title="Assign Task"
        >
          <IconBriefcase className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    );
  };

  const DeveloperCard = ({ developer }: { developer: Developer }) => (
    <div className={`group bg-gray-800/50 border rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 relative ${
      selectedDevelopers.has(developer.id) 
        ? 'border-indigo-500/50 bg-indigo-500/5' 
        : 'border-gray-700/50 hover:border-gray-600/50'
    }`}>
      {/* Selection Checkbox */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDeveloperSelection(developer.id);
          }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            selectedDevelopers.has(developer.id)
              ? 'bg-indigo-500 border-indigo-500'
              : 'border-gray-600 hover:border-gray-500 group-hover:opacity-100 opacity-60'
          }`}
        >
          {selectedDevelopers.has(developer.id) && (
            <IconCheck className="w-3 h-3 text-white" />
          )}
        </button>
      </div>
      
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {developer.profile_picture_url ? (
            <img
              src={developer.profile_picture_url}
              alt={developer.name}
              className="w-12 h-12 rounded-full border-2 border-gray-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
              <IconUserCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800 ${
            developer.is_working ? (developer.is_on_break ? 'bg-yellow-400' : 'bg-green-400') :
            developer.current_work_status === 'available' ? 'bg-blue-400' :
            developer.current_work_status === 'offline' ? 'bg-gray-400' : 'bg-yellow-400'
          }`}></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-white truncate">{developer.name}</h3>
              <p className="text-sm text-gray-400 truncate">{developer.email}</p>
              {developer.phone && (
                <div className="mt-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md inline-flex items-center gap-2">
                  <IconMessage className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300 font-medium">{developer.phone}</span>
                </div>
              )}
            </div>
            <div className="relative z-20">
              <QuickActions developer={developer} />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getRoleIcon(developer.role)}
              <span className="text-sm text-gray-300 capitalize">
                {developer.role.replace('_', ' ')}
              </span>
            </div>
            {getStatusBadge(developer.status)}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400">Task Completion</span>
          <span className={`text-xs font-medium ${getPerformanceColor(developer.performance_metrics.task_completion_rate)}`}>
            {developer.performance_metrics.task_completion_rate}%
          </span>
        </div>
        <ProgressBar 
          value={developer.performance_metrics.task_completion_rate}
          color={developer.performance_metrics.task_completion_rate >= 90 ? 'bg-green-500' : 
                 developer.performance_metrics.task_completion_rate >= 80 ? 'bg-yellow-500' : 
                 developer.performance_metrics.task_completion_rate >= 70 ? 'bg-orange-500' : 'bg-red-500'}
        />
      </div>

      {/* Current Work */}
      {developer.current_tasks.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-400 mb-2">Current Work</div>
          <div className="space-y-2">
            {developer.current_tasks.slice(0, 2).map((task) => (
              <div key={task.id} className="bg-gray-900/50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white font-medium truncate">{task.title}</span>
                  {getPriorityBadge(task.priority)}
                </div>
                <div className="flex items-center justify-between">
                  <ProgressBar value={task.progress} color="bg-indigo-500" />
                  <span className="text-xs text-gray-400 ml-2">{task.progress}%</span>
                </div>
              </div>
            ))}
            {developer.current_tasks.length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                +{developer.current_tasks.length - 2} more tasks
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400">Active Tasks</div>
          <div className="text-sm font-medium text-white">{developer.active_tasks}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Completed</div>
          <div className="text-sm font-medium text-white">{developer.completed_tasks}</div>
        </div>
        {developer.average_score ? (
          <>
            <div>
              <div className="text-xs text-gray-400">Rating</div>
              <div className="flex items-center gap-1">
                <IconStar className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-white">{developer.average_score.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Response</div>
              <div className="text-sm font-medium text-white">{developer.performance_metrics.avg_response_time_hours.toFixed(1)}h</div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-xs text-gray-400">Today's Work</div>
              <div className="text-sm font-medium text-white">
                {developer.work_minutes_today ? formatWorkTime(developer.work_minutes_today) : '0m'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Session</div>
              <div className="text-sm font-medium text-white">
                {developer.session_start ? 'Active' : 'Inactive'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
        {getWorkStatusIndicator(developer)}
        <div className="text-right">
          <div className="text-xs text-gray-400">Last active</div>
          <div className="text-xs text-gray-300">{formatDate(developer.last_activity)}</div>
        </div>
      </div>

      {/* Click overlay for navigation - lower z-index to allow QuickActions */}
      <Link
        href={`/admin/developers/${developer.id}`}
        className="absolute inset-0 rounded-xl z-10"
      />
    </div>
  );

  const DeveloperListItem = ({ developer }: { developer: Developer }) => (
    <div className={`group bg-gray-800/50 border rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-200 relative ${
      selectedDevelopers.has(developer.id) 
        ? 'border-indigo-500/50 bg-indigo-500/5' 
        : 'border-gray-700/50 hover:border-gray-600/50'
    }`}>
      <div className="flex items-center gap-4">
        {/* Selection Checkbox */}
        <div className="flex items-center relative z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleDeveloperSelection(developer.id);
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              selectedDevelopers.has(developer.id)
                ? 'bg-indigo-500 border-indigo-500'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            {selectedDevelopers.has(developer.id) && (
              <IconCheck className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
        <div className="relative">
          {developer.profile_picture_url ? (
            <img
              src={developer.profile_picture_url}
              alt={developer.name}
              className="w-10 h-10 rounded-full border-2 border-gray-600"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
              <IconUserCircle className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
            developer.is_working ? (developer.is_on_break ? 'bg-yellow-400' : 'bg-green-400') :
            developer.current_work_status === 'available' ? 'bg-blue-400' :
            developer.current_work_status === 'offline' ? 'bg-gray-400' : 'bg-yellow-400'
          }`}></div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          <div className="md:col-span-2">
            <h3 className="font-medium text-white">{developer.name}</h3>
            <p className="text-sm text-gray-400">{developer.email}</p>
            {developer.phone && (
              <div className="mt-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md inline-flex items-center gap-1">
                <IconMessage className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-300 font-medium">{developer.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getRoleIcon(developer.role)}
            <span className="text-sm text-gray-300 capitalize">
              {developer.role.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(developer.status)}
            {getWorkStatusIndicator(developer)}
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-white">{developer.active_tasks}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className={`text-sm font-medium ${getPerformanceColor(developer.performance_metrics.task_completion_rate)}`}>
                {developer.performance_metrics.task_completion_rate}%
              </span>
            </div>
            <ProgressBar 
              value={developer.performance_metrics.task_completion_rate}
              color={developer.performance_metrics.task_completion_rate >= 90 ? 'bg-green-500' : 
                     developer.performance_metrics.task_completion_rate >= 80 ? 'bg-yellow-500' : 
                     developer.performance_metrics.task_completion_rate >= 70 ? 'bg-orange-500' : 'bg-red-500'}
            />
          </div>
          
          <div className="flex items-center justify-end gap-2 relative z-20">
            <QuickActions developer={developer} />
          </div>
        </div>
      </div>

      {/* Click overlay for navigation - lower z-index to allow QuickActions */}
      <Link
        href={`/admin/developers/${developer.id}`}
        className="absolute inset-0 rounded-lg z-10"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <IconUserCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Developers
                </h1>
                <p className="text-gray-400">
                  Manage and monitor your development team
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bulk Actions */}
              {showBulkActions && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <IconUsers className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-indigo-300">
                    {selectedDevelopers.size} selected
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setBulkActionType('status')}
                      className="p-1.5 bg-gray-600/50 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors"
                      title="Change Status"
                    >
                      <IconSettings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBulkActionType('task')}
                      className="p-1.5 bg-gray-600/50 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors"
                      title="Assign Task"
                    >
                      <IconBriefcase className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBulkActionType('message')}
                      className="p-1.5 bg-gray-600/50 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors"
                      title="Send Message"
                    >
                      <IconSend className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={clearSelection}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-md transition-colors ml-1"
                      title="Clear Selection"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                  showAnalytics 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                    : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-600/50'
                }`}
              >
                <IconChartBar className="w-4 h-4" />
                Analytics
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/50"
              >
                <IconProgress className="w-4 h-4" />
                Export
              </button>
              
              <button
                onClick={() => fetchDevelopers()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/50"
              >
                <IconRefresh className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Enhanced Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{summary.total}</div>
                <div className="text-sm text-gray-400">Total Developers</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{summary.active}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{summary.working}</div>
                <div className="text-sm text-gray-400">Working</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-indigo-400">{summary.available}</div>
                <div className="text-sm text-gray-400">Available</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">{summary.averageTaskCompletion.toFixed(0)}%</div>
                <div className="text-sm text-gray-400">Avg Performance</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400">{summary.totalActiveTasks}</div>
                <div className="text-sm text-gray-400">Active Tasks</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Analytics Dashboard */}
        {showAnalytics && summary && (
          <div className="mt-6 px-6">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <IconChartBar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Team Analytics Dashboard</h2>
                  <p className="text-gray-400">Performance insights and trends</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Performance Distribution */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-4">
                    <IconChartPie className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Performance Distribution</h3>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const highPerformers = developers.filter(d => d.performance_metrics.task_completion_rate >= 90).length;
                      const goodPerformers = developers.filter(d => d.performance_metrics.task_completion_rate >= 80 && d.performance_metrics.task_completion_rate < 90).length;
                      const averagePerformers = developers.filter(d => d.performance_metrics.task_completion_rate >= 70 && d.performance_metrics.task_completion_rate < 80).length;
                      const needsAttention = developers.filter(d => d.performance_metrics.task_completion_rate < 70).length;
                      const total = developers.length || 1;

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-400">High Performers (≥90%)</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div className="bg-green-400 h-2 rounded-full" style={{ width: `${(highPerformers / total) * 100}%` }}></div>
                              </div>
                              <span className="text-sm text-white w-8">{highPerformers}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-400">Good Performers (80-89%)</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(goodPerformers / total) * 100}%` }}></div>
                              </div>
                              <span className="text-sm text-white w-8">{goodPerformers}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-orange-400">Average (70-79%)</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${(averagePerformers / total) * 100}%` }}></div>
                              </div>
                              <span className="text-sm text-white w-8">{averagePerformers}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-red-400">Needs Attention (&lt;70%)</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div className="bg-red-400 h-2 rounded-full" style={{ width: `${(needsAttention / total) * 100}%` }}></div>
                              </div>
                              <span className="text-sm text-white w-8">{needsAttention}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Workload Distribution */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-4">
                    <IconTrendingUp className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Workload Distribution</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400">Working</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="bg-green-400 h-2 rounded-full" style={{ width: `${(summary.working / summary.total) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-white w-8">{summary.working}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-400">Available</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${(summary.available / summary.total) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-white w-8">{summary.available}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Inactive</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${((summary.total - summary.active) / summary.total) * 100}%` }}></div>
                        </div>
                        <span className="text-sm text-white w-8">{summary.total - summary.active}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics & Alerts */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-4">
                    <IconTarget className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-white">Key Metrics</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">Team Avg. Performance</span>
                        <span className="text-sm font-medium text-white">{summary.averageTaskCompletion.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          summary.averageTaskCompletion >= 90 ? 'bg-green-400' :
                          summary.averageTaskCompletion >= 80 ? 'bg-yellow-400' :
                          summary.averageTaskCompletion >= 70 ? 'bg-orange-400' : 'bg-red-400'
                        }`} style={{ width: `${summary.averageTaskCompletion}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">Active Task Ratio</span>
                        <span className="text-sm font-medium text-white">{(summary.totalActiveTasks / summary.active).toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-400">Tasks per active developer</div>
                    </div>

                    {/* Alerts */}
                    <div className="pt-3 border-t border-gray-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <IconAlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">Alerts</span>
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          const needsAttention = developers.filter(d => d.performance_metrics.task_completion_rate < 70).length;
                          const overloaded = developers.filter(d => d.active_tasks > 3).length;
                          
                          return (
                            <>
                              {needsAttention > 0 && (
                                <div className="text-xs text-red-400">
                                  {needsAttention} developer(s) need attention
                                </div>
                              )}
                              {overloaded > 0 && (
                                <div className="text-xs text-orange-400">
                                  {overloaded} developer(s) may be overloaded
                                </div>
                              )}
                              {needsAttention === 0 && overloaded === 0 && (
                                <div className="text-xs text-green-400">
                                  Team performance is healthy
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Select All Checkbox */}
            {developers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectedDevelopers.size === developers.length ? clearSelection : selectAllDevelopers}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                    selectedDevelopers.size > 0
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedDevelopers.size === developers.length
                      ? 'bg-indigo-500 border-indigo-500'
                      : selectedDevelopers.size > 0
                      ? 'bg-indigo-500/50 border-indigo-500'
                      : 'border-gray-600'
                  }`}>
                    {selectedDevelopers.size > 0 && (
                      <IconCheck className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">
                    {selectedDevelopers.size === developers.length ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
              </div>
            )}
            
            <div className="relative flex-1 max-w-md">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, skills, role, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                showFilters 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
            >
              <IconFilter className="w-4 h-4" />
              Filters
              <IconChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-800/50 border border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <IconGrid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <IconList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            {/* Basic Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="frontend_specialist">Frontend Specialist</option>
                  <option value="backend_specialist">Backend Specialist</option>
                  <option value="integration_specialist">Integration Specialist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Work Status</label>
                <select
                  value={workStatusFilter}
                  onChange={(e) => setWorkStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="working">Working</option>
                  <option value="available">Available</option>
                  <option value="offline">Offline</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="name">Name</option>
                    <option value="lastActivity">Last Activity</option>
                    <option value="score">Rating</option>
                    <option value="tasks">Active Tasks</option>
                    <option value="earnings">Earnings</option>
                    <option value="performance">Performance</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Advanced Filters Row */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="text-sm font-medium text-gray-300 mb-3">Advanced Filters</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Performance</label>
                  <select
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Performance</option>
                    <option value="high">High Performers (≥90%)</option>
                    <option value="good">Good Performers (≥80%)</option>
                    <option value="average">Average (≥70%)</option>
                    <option value="needs_attention">Needs Attention (&lt;70%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                  <select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Skills</option>
                    <option value="react">React</option>
                    <option value="nodejs">Node.js</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="nextjs">Next.js</option>
                    <option value="aws">AWS</option>
                    <option value="database">Database Management</option>
                    <option value="api">API Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Technology</label>
                  <select
                    value={technologyFilter}
                    onChange={(e) => setTechnologyFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Technologies</option>
                    <option value="frontend">Frontend Technologies</option>
                    <option value="backend">Backend Technologies</option>
                    <option value="cloud">Cloud Services</option>
                    <option value="database">Database Technologies</option>
                    <option value="mobile">Mobile Development</option>
                    <option value="devops">DevOps & Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Availability</option>
                    <option value="full_time">Full Time (≥40h/week)</option>
                    <option value="part_time">Part Time (20-39h/week)</option>
                    <option value="limited">Limited (&lt;20h/week)</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="flexible">Flexible Schedule</option>
                  </select>
                </div>
              </div>
              
              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                <div className="text-sm text-gray-400">
                  {developers.length > 0 && pagination && (
                    <>Showing {developers.length} of {pagination.total} developers</>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setRoleFilter('all');
                    setWorkStatusFilter('all');
                    setPerformanceFilter('all');
                    setSkillFilter('all');
                    setTechnologyFilter('all');
                    setAvailabilityFilter('all');
                    setSortBy('name');
                    setSortOrder('asc');
                  }}
                  className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200 text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchDevelopers()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : developers.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <IconUserCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No developers found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          </div>
        ) : (
          <>
            {/* Developers Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {developers.map((developer) => (
                  <DeveloperCard key={developer.id} developer={developer} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {developers.map((developer) => (
                  <DeveloperListItem key={developer.id} developer={developer} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} developers
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                    {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Action Modals */}
      {bulkActionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {bulkActionType === 'status' && 'Change Status'}
                {bulkActionType === 'task' && 'Assign Task'} 
                {bulkActionType === 'message' && 'Send Message'}
              </h3>
              <button
                onClick={() => setBulkActionType(null)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-400 mb-4">
              This action will be applied to {selectedDevelopers.size} selected developer(s).
            </p>

            {bulkActionType === 'status' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Status</label>
                  <select
                    id="bulk-status-select"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select status...</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    const selectElement = document.getElementById('bulk-status-select') as HTMLSelectElement;
                    const status = selectElement?.value;
                    if (status) {
                      handleBulkAction('status', { status });
                      setBulkActionType(null);
                    } else {
                      alert('Please select a status');
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Update Status
                </button>
              </div>
            )}

            {bulkActionType === 'task' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                  <input
                    id="bulk-task-title"
                    type="text"
                    placeholder="Enter task title..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    id="bulk-task-description"
                    rows={3}
                    placeholder="Enter task description..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select 
                    id="bulk-task-priority"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    const titleElement = document.getElementById('bulk-task-title') as HTMLInputElement;
                    const descriptionElement = document.getElementById('bulk-task-description') as HTMLTextAreaElement;
                    const priorityElement = document.getElementById('bulk-task-priority') as HTMLSelectElement;
                    
                    const taskTitle = titleElement?.value?.trim();
                    const description = descriptionElement?.value?.trim();
                    const priority = priorityElement?.value;
                    
                    if (!taskTitle) {
                      alert('Please enter a task title');
                      return;
                    }
                    
                    handleBulkAction('task', { 
                      taskTitle, 
                      description: description || undefined,
                      priority 
                    });
                    setBulkActionType(null);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Assign Task
                </button>
              </div>
            )}

            {bulkActionType === 'message' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <input
                    id="bulk-message-subject"
                    type="text"
                    placeholder="Enter message subject..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    id="bulk-message-content"
                    rows={4}
                    placeholder="Enter your message..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <button
                  onClick={() => {
                    const subjectElement = document.getElementById('bulk-message-subject') as HTMLInputElement;
                    const messageElement = document.getElementById('bulk-message-content') as HTMLTextAreaElement;
                    
                    const subject = subjectElement?.value?.trim();
                    const message = messageElement?.value?.trim();
                    
                    if (!subject) {
                      alert('Please enter a subject');
                      return;
                    }
                    
                    if (!message) {
                      alert('Please enter a message');
                      return;
                    }
                    
                    handleBulkAction('message', { subject, message });
                    setBulkActionType(null);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Export Developer Data</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-400 mb-4">
              Export {developers.length > 0 ? `${developers.length} developer(s)` : 'all developers'} based on current filters.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Export Format</label>
                <select 
                  id="export-format"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="json">JSON (Data)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Include Additional Data</label>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="include-metrics"
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2"
                  />
                  <label htmlFor="include-metrics" className="text-sm text-gray-300">
                    Performance Metrics
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="include-availability"
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-2"
                  />
                  <label htmlFor="include-availability" className="text-sm text-gray-300">
                    Availability Information
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const formatElement = document.getElementById('export-format') as HTMLSelectElement;
                    const metricsElement = document.getElementById('include-metrics') as HTMLInputElement;
                    const availabilityElement = document.getElementById('include-availability') as HTMLInputElement;
                    
                    const format = formatElement?.value as 'csv' | 'json';
                    const includeMetrics = metricsElement?.checked || false;
                    const includeAvailability = availabilityElement?.checked || false;
                    
                    handleExport(format, includeMetrics, includeAvailability);
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
    );
  } 