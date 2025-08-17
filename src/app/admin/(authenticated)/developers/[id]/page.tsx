"use client";

import {
  IconArrowLeft,
  IconUserCircle,
  IconMail,
  IconCode,
  IconStar,
  IconActivity,
  IconClock,
  IconTrendingUp,
  IconCalendar,
  IconBriefcase,
  IconEdit,
  IconMessage,
  IconAlertCircle,
  IconCircleCheck,
  IconProgress,
  IconTrophy,
  IconChartBar,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

export default function DeveloperProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeveloper();
  }, [params.id]);

  const fetchDeveloper = async () => {
    try {
      setLoading(true);
      
      // Use dedicated API endpoint for individual developer
      const response = await fetch(`/api/admin/developers/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Developer not found');
        }
        throw new Error('Failed to fetch developer data');
      }
      
      const data = await response.json();
      setDeveloper(data.developer);
      setError(null);
    } catch (err) {
      console.error('Error fetching developer:', err);
      setError(err instanceof Error ? err.message : 'Failed to load developer profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' },
      inactive: { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getWorkStatusIndicator = (workStatus: string) => {
    const indicators = {
      working: { color: 'bg-green-400', text: 'Working', description: 'Currently active on tasks' },
      available: { color: 'bg-blue-400', text: 'Available', description: 'Ready for new assignments' },
      offline: { color: 'bg-gray-400', text: 'Offline', description: 'Not currently active' },
      pending: { color: 'bg-yellow-400', text: 'Pending', description: 'Awaiting approval' },
    };
    const indicator = indicators[workStatus as keyof typeof indicators] || indicators.offline;
    
    return (
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${indicator.color} ${workStatus === 'working' ? 'animate-pulse' : ''}`}></div>
        <div>
          <span className="text-white font-medium">{indicator.text}</span>
          <p className="text-sm text-gray-400">{indicator.description}</p>
        </div>
      </div>
    );
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const ProgressBar = ({ value, max = 100, color = 'bg-indigo-500', showLabel = false }: { 
    value: number; 
    max?: number; 
    color?: string;
    showLabel?: boolean;
  }) => (
    <div className="space-y-1">
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        ></div>
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span className={getPerformanceColor(value)}>{value}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IconCircleCheck className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <IconProgress className="w-4 h-4 text-blue-400" />;
      case 'review':
        return <IconTrophy className="w-4 h-4 text-purple-400" />;
      case 'planning':
        return <IconCalendar className="w-4 h-4 text-yellow-400" />;
      default:
        return <IconAlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_update':
      case 'task_completion':
        return <IconBriefcase className="w-4 h-4 text-blue-400" />;
      case 'code_commit':
      case 'code_review':
        return <IconCode className="w-4 h-4 text-purple-400" />;
      case 'deployment':
      case 'infrastructure':
        return <IconTrendingUp className="w-4 h-4 text-green-400" />;
      case 'mentorship':
        return <IconTrophy className="w-4 h-4 text-yellow-400" />;
      default:
        return <IconActivity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Developer not found'}</p>
          <Link
            href="/admin/developers"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Back to Developers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/admin/developers"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/50"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back to Developers
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Info */}
            <div className="flex items-start gap-6">
              <div className="relative">
                {developer.profile_picture_url ? (
                  <img
                    src={developer.profile_picture_url}
                    alt={developer.name}
                    className="w-24 h-24 rounded-full border-4 border-gray-600"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                    <IconUserCircle className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-gray-800 ${
                  developer.current_work_status === 'working' ? 'bg-green-400' :
                  developer.current_work_status === 'available' ? 'bg-blue-400' :
                  developer.current_work_status === 'offline' ? 'bg-gray-400' : 'bg-yellow-400'
                }`}></div>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{developer.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <IconMail className="w-4 h-4" />
                    {developer.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <IconCode className="w-4 h-4" />
                    {developer.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  {getStatusBadge(developer.status)}
                  {developer.contract_signed && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Contract Signed
                    </span>
                  )}
                </div>
                {getWorkStatusIndicator(developer.current_work_status)}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:ml-auto flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <IconMessage className="w-4 h-4" />
                Send Message
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                <IconEdit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Performance Metrics */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <IconChartBar className="w-5 h-5" />
                Performance Metrics
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Task Completion Rate</span>
                    <span className={`text-sm font-bold ${getPerformanceColor(developer.performance_metrics.task_completion_rate)}`}>
                      {developer.performance_metrics.task_completion_rate}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={developer.performance_metrics.task_completion_rate}
                    color={developer.performance_metrics.task_completion_rate >= 90 ? 'bg-green-500' : 
                           developer.performance_metrics.task_completion_rate >= 80 ? 'bg-yellow-500' : 
                           developer.performance_metrics.task_completion_rate >= 70 ? 'bg-orange-500' : 'bg-red-500'}
                    showLabel={false}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">On-Time Delivery</span>
                    <span className={`text-sm font-bold ${getPerformanceColor(developer.performance_metrics.on_time_delivery_rate)}`}>
                      {developer.performance_metrics.on_time_delivery_rate}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={developer.performance_metrics.on_time_delivery_rate}
                    color={developer.performance_metrics.on_time_delivery_rate >= 90 ? 'bg-green-500' : 
                           developer.performance_metrics.on_time_delivery_rate >= 80 ? 'bg-yellow-500' : 
                           developer.performance_metrics.on_time_delivery_rate >= 70 ? 'bg-orange-500' : 'bg-red-500'}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Code Quality Score</span>
                    <div className="flex items-center gap-1">
                      <IconStar className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-bold text-white">{developer.performance_metrics.code_quality_score.toFixed(1)}</span>
                    </div>
                  </div>
                  <ProgressBar 
                    value={(developer.performance_metrics.code_quality_score / 5) * 100}
                    color="bg-yellow-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Communication Score</span>
                    <div className="flex items-center gap-1">
                      <IconStar className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-bold text-white">{developer.performance_metrics.communication_score.toFixed(1)}</span>
                    </div>
                  </div>
                  <ProgressBar 
                    value={(developer.performance_metrics.communication_score / 5) * 100}
                    color="bg-blue-500"
                  />
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{developer.performance_metrics.avg_response_time_hours.toFixed(1)}h</div>
                      <div className="text-xs text-gray-400">Avg Response Time</div>
                    </div>
                    {developer.performance_metrics.reliability_score && (
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{developer.performance_metrics.reliability_score.toFixed(1)}</div>
                        <div className="text-xs text-gray-400">Reliability Score</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Stats */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Tasks</span>
                  <span className="text-2xl font-bold text-white">{developer.active_tasks}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Completed Tasks</span>
                  <span className="text-2xl font-bold text-white">{developer.completed_tasks}</span>
                </div>
                
                {developer.average_score && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <IconStar className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-2xl font-bold text-white">{developer.average_score.toFixed(1)}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Earned</span>
                  <span className="text-2xl font-bold text-green-400">${developer.total_earned.toLocaleString()}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <IconClock className="w-4 h-4" />
                    Last Activity
                  </div>
                  <p className="text-white">{formatDate(developer.last_activity)}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <IconCalendar className="w-4 h-4" />
                    Joined
                  </div>
                  <p className="text-white">{formatDate(developer.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Tasks */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <IconBriefcase className="w-5 h-5" />
                Current Tasks ({developer.current_tasks.length})
              </h2>
              
              {developer.current_tasks.length > 0 ? (
                <div className="space-y-4">
                  {developer.current_tasks.map((task) => (
                    <div key={task.id} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {getTaskStatusIcon(task.status)}
                          <div>
                            <h3 className="font-medium text-white">{task.title}</h3>
                            <p className="text-sm text-gray-400 capitalize">
                              {task.status.replace('_', ' ')} • Due {formatDate(task.due_date)}
                            </p>
                          </div>
                        </div>
                        {getPriorityBadge(task.priority)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white font-medium">{task.progress}%</span>
                        </div>
                        <ProgressBar 
                          value={task.progress}
                          color={task.progress >= 90 ? 'bg-green-500' : 
                                 task.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconBriefcase className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No active tasks</p>
                  <p className="text-sm text-gray-500">This developer is available for new assignments</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <IconActivity className="w-5 h-5" />
                Recent Activity
              </h2>
              
              {developer.recent_activity.length > 0 ? (
                <div className="space-y-4">
                  {developer.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-white">{activity.description}</p>
                        <p className="text-sm text-gray-400">{formatRelativeTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconActivity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Skills & Technologies</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {developer.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium border border-indigo-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Preferred Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {developer.preferred_technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {developer.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Availability Info */}
                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Availability</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">{developer.availability.hours_per_week}h</div>
                      <div className="text-xs text-gray-400">Hours/Week</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white">{developer.availability.timezone}</div>
                      <div className="text-xs text-gray-400">Timezone</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-lg font-bold text-white capitalize">{developer.availability.preferred_communication}</div>
                      <div className="text-xs text-gray-400">Preferred Contact</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
