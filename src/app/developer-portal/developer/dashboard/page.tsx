'use client';

import { 
  IconTrophy, 
  IconTarget, 
  IconBolt,
  IconVideo,
  IconDownload,
  IconStar,
  IconCode,
  IconComponents,
  IconApi,
  IconDatabase,
  IconTestPipe,
  IconCheckbox,
  IconFlag,
  IconClock,
  IconCalendar,
  IconChevronRight,
  IconFlame,
  IconGift,
  IconTrendingUp,
  IconAward,
  IconShieldCheck,
  IconHome,
  IconClipboardList,
  IconUsers,
  IconSettings,
  IconLogout,
  IconMenu,
  IconX
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';


import { ModuleCreator } from '@/components/modules/ModuleCreator';
import { TaskSelectionModal } from '@/components/modules/TaskSelectionModal';
import { DailyWorkflowDashboard } from '@/components/dashboard/DailyWorkflowDashboard';

interface DashboardData {
  developer: {
    id: string;
    name: string;
    email: string;
    profile_picture_url?: string;
    achievement_level: string;
  };
  stats: {
    completed_modules: number;
    in_progress_modules: number;
    pending_modules: number;
    total_checkouts: number;
    total_ratings: number;
    total_loom_videos: number;
    total_pre_conditions: number;
    total_post_conditions: number;
    avg_completion_quality: number;
    current_streak: number;
    modules_this_week: number;
    modules_this_month: number;
  };
  leaderboard: {
    overall_rank: number;
    weekly_rank: number;
    monthly_rank: number;
    comprehensive_score: number;
    weekly_score: number;
    monthly_score: number;
  };
  bonuses: {
    available: any[];
    completed: any[];
    progress: any[];
  };
  recent_activity: any[];
}

interface WeeklyBonus {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  reward_points: number;
  deadline: string;
  category: string;
  icon: string;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_picture_url?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  task_status?: string;
  created_at?: string;
  updated_at?: string;
  assignment_status?: string;
  notes?: any[];
  start_date?: string;
  due_date?: string;
  completed_at?: string | null;
}

interface RecentModule {
  id: string;
  name: string;
  description: string;
  status?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  module_type: string;
  module_icon: string;
  module_color: string;
}

interface NavigationItem {
  id: string;
  name: string;
  icon: any;
  href?: string;
  count?: number;
}

interface ModuleType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

export default function DeveloperDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [weeklyBonuses, setWeeklyBonuses] = useState<WeeklyBonus[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [session, setSession] = useState<{ user: UserSession | null, isLoggedIn: boolean }>({
    user: null,
    isLoggedIn: false
  });
  
  // Task management state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentModules, setRecentModules] = useState<RecentModule[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [moduleTypes, setModuleTypes] = useState<ModuleType[]>([]);
  const [displayProfilePicture, setDisplayProfilePicture] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    checkSession();
    loadModuleTypes();
  }, []);

  // Update current time every minute for the header
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      console.log('Gamified Dashboard - Session check:', data);
      
      if (data.isLoggedIn && data.user) {
        setSession({
          user: data.user,
          isLoggedIn: true
        });
      } else {
        // Even if session fails, continue with data loading using leaderboard fallback
        console.log('Session not found, continuing with leaderboard data...');
        setSession({
          user: null,
          isLoggedIn: false
        });
      }
      
      // Always try to load dashboard data - we have fallbacks
      loadDashboardData();
      loadSubmissionHistory();
      loadTasksAndModules();
      loadWeeklyGoals();
      
    } catch (error) {
      console.error('Error checking session:', error);
      // Continue with data loading even if session check fails
      setSession({
        user: null,
        isLoggedIn: false
      });
      loadDashboardData();
      loadSubmissionHistory();
      loadTasksAndModules();
      loadWeeklyGoals();
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    console.log('🔄 Manual refresh triggered');
    toast.loading('Refreshing dashboard...', { id: 'refresh' });
    
    try {
      await Promise.all([
        loadDashboardData(),
        loadSubmissionHistory(),
        loadTasksAndModules(),
        loadWeeklyGoals()
      ]);
      toast.success('Dashboard refreshed!', { id: 'refresh' });
    } catch (error) {
      toast.error('Failed to refresh dashboard', { id: 'refresh' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes when page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing data...');
        loadTasksAndModules();
      }
    };

    const autoRefreshInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('🔄 Auto-refresh triggered (5min interval)');
        loadTasksAndModules();
      }
    }, 5 * 60 * 1000); // 5 minutes

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(autoRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadTasksAndModules = async () => {
    try {
      // Add cache-busting timestamp for fresh data
      const timestamp = new Date().getTime();
      
      // Load tasks and recent modules with fresh data
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`/api/tasks/assigned?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        }),
        fetch(`/api/developer/stats?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const normalizedTasks = tasksData.map((task: any) => ({
          ...task,
          status: task.task_status || task.status || "assigned"
        }));
        setTasks(normalizedTasks);
        console.log('✅ Tasks loaded:', normalizedTasks.length);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats?.recentModules) {
          setRecentModules(statsData.stats.recentModules);
          console.log('✅ Recent modules loaded:', statsData.stats.recentModules.length);
        }
      }
    } catch (error) {
      console.error('Error loading tasks and modules:', error);
      toast.error('Failed to load tasks and modules');
    }
  };

  const loadModuleTypes = async () => {
    try {
      const response = await fetch('/api/module-types');
      const data = await response.json();
      setModuleTypes(data.moduleTypes || []);
    } catch (error) {
      console.error('Error loading module types:', error);
      toast.error('Failed to load module types');
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (!isValidDate(date)) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatDueDate = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays < 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const isValidDate = (date: Date) => {
    return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 1970;
  };

  const mapTaskStatusForDisplay = (status: string | null | undefined): string => {
    if (!status) return "Assigned";
    
    switch(status.toLowerCase()) {
      case "pending": return "Available";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "blocked": return "Blocked";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Filter tasks based on selected status
  const filteredTasks = filterStatus ? 
    tasks.filter(task => 
      task.status?.toLowerCase() === filterStatus.toLowerCase() || 
      task.task_status?.toLowerCase() === filterStatus.toLowerCase()
    ) : tasks;

  // Use session data as primary source, fallback to API data
  const displayName = session.user?.name || data?.developer?.name || 'Developer';
  const rawProfilePicture = session.user?.profile_picture_url || data?.developer?.profile_picture_url;

  // Convert profile picture URL to S3 presigned URL whenever it changes
  useEffect(() => {
    const updateProfilePictureUrl = async () => {
      if (rawProfilePicture) {
        try {
          // Call our server-side API to convert the URL (same as profile page)
          const response = await fetch('/api/images/convert-profile-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: rawProfilePicture }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setDisplayProfilePicture(data.presignedUrl || rawProfilePicture);
            console.log('Dashboard profile picture converted to S3 URL:', data.presignedUrl);
          } else {
            // Fallback to original URL if conversion fails
            setDisplayProfilePicture(rawProfilePicture);
          }
        } catch (error) {
          console.error('Error converting profile picture to S3 URL:', error);
          // Fallback to original URL if conversion fails
          setDisplayProfilePicture(rawProfilePicture);
        }
      } else {
        setDisplayProfilePicture('');
      }
    };

    updateProfilePictureUrl();
  }, [rawProfilePicture]);

  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', name: 'Dashboard', icon: IconHome },
    { id: 'workflow', name: 'Daily Workflow', icon: IconClock },
    { id: 'tasks', name: 'My Tasks', icon: IconClipboardList, count: tasks.length },
    { id: 'modules', name: 'Recent Modules', icon: IconComponents, count: recentModules.length },
    { id: 'leaderboard', name: 'Leaderboard', icon: IconTrophy, href: '/leaderboard' },
    { id: 'registry', name: 'Module Registry', icon: IconDatabase, href: '/developer/registry' },
    { id: 'chats', name: 'Cursor Chats', icon: IconVideo, href: '/developer/cursor-chats' },
    { id: 'profile', name: 'Profile', icon: IconSettings, href: '/profile' },
  ];

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const loadSubmissionHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('/api/tasks/assigned');
      const data = await response.json();
      
      // Get only completed tasks as submission history
      const submissions = data.filter((task: any) => task.status === 'completed' || task.task_status === 'completed');
      setSubmissionHistory(submissions.slice(0, 10)); // Show last 10 submissions
    } catch (error) {
      console.error('Error loading submission history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadWeeklyGoals = async () => {
    try {
      console.log('🎯 Loading weekly goals...');
      const response = await fetch('/api/weekly-goals/current', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklyGoals(data.currentGoals || []);
        console.log('✅ Weekly goals loaded:', data.currentGoals?.length || 0);
      } else {
        console.log('⚠️ Weekly goals API not available, using fallback');
        setWeeklyGoals([]);
      }
    } catch (error) {
      console.error('Error loading weekly goals:', error);
      setWeeklyGoals([]);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard data
      const [dashboardRes, leaderboardRes, bonusesRes] = await Promise.all([
        fetch('/api/developer/dashboard'),
        fetch('/api/leaderboard?limit=1'),
        fetch('/api/developer/bonuses')
      ]);

      // Handle potential 401s gracefully
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : { profile: null, stats: null };
      const leaderboardData = leaderboardRes.ok ? await leaderboardRes.json() : { leaderboard: [] };
      const bonusesData = bonusesRes.ok ? await bonusesRes.json() : { available: [] };

      console.log('Dashboard Data:', dashboardData); // Debug log
      console.log('Leaderboard Data:', leaderboardData); // Debug log

      // Use leaderboard data as fallback if session or dashboard API fails
      const topDeveloper = leaderboardData.leaderboard?.[0];
      
      // Combine the data, using session data as primary, leaderboard as secondary fallback
      const combinedData: DashboardData = {
        developer: dashboardData.profile || {
          id: session.user?.id || topDeveloper?.id || '',
          name: session.user?.name || topDeveloper?.name || 'Developer',
          email: session.user?.email || topDeveloper?.email || '',
          profile_picture_url: session.user?.profile_picture_url || topDeveloper?.profile_picture_url,
          achievement_level: topDeveloper?.achievement_level || 'newcomer'
        },
        stats: {
          completed_modules: dashboardData.stats?.completed_modules || topDeveloper?.completed_modules || 0,
          in_progress_modules: dashboardData.stats?.in_progress_modules || topDeveloper?.in_progress_modules || 0,
          pending_modules: dashboardData.stats?.pending_modules || 0,
          total_checkouts: dashboardData.stats?.total_checkouts || topDeveloper?.modules_checked_out || 0,
          total_ratings: dashboardData.stats?.total_ratings || topDeveloper?.modules_rated || 0,
          total_loom_videos: dashboardData.stats?.total_loom_videos || 0,
          total_pre_conditions: dashboardData.stats?.total_pre_conditions || 0,
          total_post_conditions: dashboardData.stats?.total_post_conditions || 0,
          avg_completion_quality: dashboardData.stats?.avg_completion_quality || topDeveloper?.avg_completion_quality || 0,
          current_streak: dashboardData.stats?.current_streak || 0,
          modules_this_week: dashboardData.stats?.modules_this_week || 0,
          modules_this_month: dashboardData.stats?.modules_this_month || 0,
        },
        leaderboard: {
          overall_rank: topDeveloper?.overall_rank || 0,
          weekly_rank: 0,
          monthly_rank: 0,
          comprehensive_score: topDeveloper?.comprehensive_score || 0,
          weekly_score: 0,
          monthly_score: 0,
        },
        bonuses: bonusesData || { available: [], completed: [], progress: [] },
        recent_activity: dashboardData.recent_activity || []
      };

      setData(combinedData);
      setWeeklyBonuses(bonusesData.available || []);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getAchievementBadge = (level: string) => {
    const badges = {
      'newcomer': { icon: IconShieldCheck, color: 'text-gray-400', bg: 'bg-gray-500/20' },
      'contributor': { icon: IconStar, color: 'text-green-400', bg: 'bg-green-500/20' },
      'developer': { icon: IconCode, color: 'text-blue-400', bg: 'bg-blue-500/20' },
      'senior_developer': { icon: IconTrophy, color: 'text-purple-400', bg: 'bg-purple-500/20' },
      'master_developer': { icon: IconAward, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    };
    return badges[level as keyof typeof badges] || badges.newcomer;
  };

  const formatProgress = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  // Debug: Log current view
  console.log('Current view:', currentView);
  console.log('Data loaded:', !!data);
  console.log('Tasks count:', tasks.length);
  console.log('Recent modules count:', recentModules.length);

  const handleModuleCreated = () => {
    setShowCreateModule(false);
    setSelectedTaskId("");
    // Refresh any data if needed
    loadTasksAndModules();
    toast.success('Module created successfully!');
  };

  const handleTaskSelected = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskSelection(false);
    setShowCreateModule(true);
  };

  const handleCreateModuleClick = () => {
    setShowTaskSelection(true);
  };

  const handleCloseTaskSelection = () => {
    setShowTaskSelection(false);
    setSelectedTaskId("");
  };

  const handleCloseModuleCreator = () => {
    setShowCreateModule(false);
    setSelectedTaskId("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex">
        {/* Loading Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 lg:relative lg:flex lg:flex-shrink-0">
          <div className="w-64 flex flex-col">
            <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-16 mt-1 animate-pulse"></div>
                </div>
              </div>
            </div>
            <nav className="flex-1 mt-8 px-4">
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 lg:pl-0">
          <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <button className="lg:hidden text-gray-400 hover:text-white">
                <IconMenu size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Developer Portal</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Loading...</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-96 bg-gray-700 rounded-lg"></div>
                <div className="h-96 bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:flex lg:flex-shrink-0`}>
          <div className="w-64 flex flex-col">
            <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
              <div className="flex items-center gap-3">
                {displayProfilePicture ? (
                  <Image
                    src={displayProfilePicture}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                    onError={() => setDisplayProfilePicture('')}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">{displayName?.[0] || 'D'}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-sm font-semibold">{displayName}</h1>
                  <p className="text-xs text-gray-400">DEVELOPER</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 mt-8 px-4">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.id}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="flex items-center justify-between px-4 py-3 text-sm rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={20} />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors ${
                          currentView === item.id 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={20} />
                          <span>{item.name}</span>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700">
                <Link
                  href="/developer/tasks/create"
                  className="w-full flex items-center gap-3 px-4 py-3 mb-3 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <IconTarget size={20} />
                  <span>Create Task</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                >
                  <IconLogout size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:pl-0">
          <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <IconMenu size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Developer Portal</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Loading data...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold mb-4">Loading Dashboard...</h1>
              <p className="text-gray-400">Setting up your gamified developer experience</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const achievementBadge = getAchievementBadge(data.developer?.achievement_level || 'newcomer');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:relative lg:flex lg:flex-shrink-0`}>
        <div className="w-64 flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
            <div className="flex items-center gap-3">
              {displayProfilePicture ? (
                <Image
                  src={displayProfilePicture}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={() => setDisplayProfilePicture('')}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">{displayName?.[0] || 'D'}</span>
                </div>
              )}
              <div>
                <h1 className="text-sm font-semibold">{displayName}</h1>
                <p className="text-xs text-gray-400">
                  {data?.developer?.achievement_level?.replace('_', ' ').toUpperCase() || 'DEVELOPER'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <IconX size={20} />
            </button>
          </div>

          <nav className="flex-1 mt-8 px-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors ${
                        currentView === item.id 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors ${
                        currentView === item.id 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <button
                onClick={handleCreateModuleClick}
                className="w-full flex items-center gap-3 px-4 py-3 mb-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <IconComponents size={20} />
                <span>Create Module</span>
              </button>
              
              <Link
                href="/developer/tasks/create"
                className="w-full flex items-center gap-3 px-4 py-3 mb-3 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <IconTarget size={20} />
                <span>Create Task</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
              >
                <IconLogout size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        {/* Top bar - Fixed Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <IconMenu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Developer Portal</h1>
              {data && (
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Rank #{data.leaderboard?.overall_rank || '?'}</span>
                  <span>{data.leaderboard?.comprehensive_score || 0} Points</span>
                  <span>{data.stats?.current_streak || 0} Day Streak</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {currentTime.toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-400">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6">
          {currentView === 'dashboard' && (
            <>
              {/* Gamification Stats */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 mb-8 border border-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{data?.stats?.completed_modules || 5}</div>
                    <div className="text-xs text-gray-400">Completed Modules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{data?.stats?.modules_this_week || 0}</div>
                    <div className="text-xs text-gray-400">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{data?.stats?.total_checkouts || 0}</div>
                    <div className="text-xs text-gray-400">Checkouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{data?.stats?.current_streak || 0}</div>
                    <div className="text-xs text-gray-400">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">#{data?.leaderboard?.overall_rank || 1}</div>
                    <div className="text-xs text-gray-400">Rank</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-400">{data?.stats?.total_loom_videos || 0}</div>
                    <div className="text-xs text-gray-400">Loom Videos</div>
                  </div>
                </div>
              </div>

              {/* Weekly Bonuses */}
              <div className="bg-gray-800 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <IconGift className="w-6 h-6 text-yellow-400" />
                    Weekly Bonuses & Challenges
                  </h2>
                  <span className="text-sm text-gray-400">Resets every Monday</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Module Completion Bonus */}
                  <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <IconCheckbox className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Module Master</h3>
                        <p className="text-xs text-gray-400">Complete 3 modules this week</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{data?.stats?.modules_this_week || 0}/3</span>
                        <span className="text-green-400">+50 points</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, ((data?.stats?.modules_this_week || 0) / 3) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {(data?.stats?.modules_this_week || 0) >= 3 ? (
                      <div className="text-green-400 text-sm font-medium">🎉 Completed!</div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        {3 - (data?.stats?.modules_this_week || 0)} more to go
                      </div>
                    )}
                  </div>

                  {/* Checkout Bonus */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <IconDownload className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Popular Creator</h3>
                        <p className="text-xs text-gray-400">Get 5 component checkouts</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{data?.stats?.total_checkouts || 0}/5</span>
                        <span className="text-purple-400">+30 points</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, ((data?.stats?.total_checkouts || 0) / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {(data?.stats?.total_checkouts || 0) >= 5 ? (
                      <div className="text-purple-400 text-sm font-medium">🎉 Completed!</div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        {5 - (data?.stats?.total_checkouts || 0)} more checkouts needed
                      </div>
                    )}
                  </div>

                  {/* Video Documentation Bonus */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <IconVideo className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Video Producer</h3>
                        <p className="text-xs text-gray-400">Create 2 Loom videos</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{data?.stats?.total_loom_videos || 0}/2</span>
                        <span className="text-blue-400">+25 points</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, ((data?.stats?.total_loom_videos || 0) / 2) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {(data?.stats?.total_loom_videos || 0) >= 2 ? (
                      <div className="text-blue-400 text-sm font-medium">🎉 Completed!</div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        {2 - (data?.stats?.total_loom_videos || 0)} more videos needed
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Goals */}
              <div className="bg-gray-800 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <IconTrophy className="w-6 h-6 text-yellow-400" />
                    Weekly Goals & Challenges
                  </h2>
                  <span className="text-sm text-gray-400">Live from admin</span>
                </div>
                
                {weeklyGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <IconTarget className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No Active Goals</h3>
                    <p className="text-gray-400">Check back later for new challenges!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {weeklyGoals.map((goal) => {
                      const daysRemaining = goal.days_remaining || 0;
                      const isActive = daysRemaining > 0;
                      const hasWinners = goal.winner_count > 0;
                      
                      // Icon mapping for goal types
                      const getGoalIcon = (iconName: string) => {
                        const iconMap: { [key: string]: any } = {
                          'video': IconVideo,
                          'components': IconComponents,
                          'api': IconApi,
                          'code': IconCode,
                          'test-pipe': IconTestPipe,
                          'activity': IconFlame,
                          'star': IconStar,
                          'calendar': IconCalendar,
                          'users': IconUsers,
                          'default': IconTarget
                        };
                        return iconMap[iconName] || iconMap.default;
                      };
                      
                      const IconComponent = getGoalIcon(goal.goal_icon);
                      
                      return (
                        <div key={goal.id} className={`border rounded-lg p-4 transition-all bg-gradient-to-r ${
                          goal.goal_color === 'green' ? 'from-green-500/20 to-green-600/20 border-green-500/30' :
                          goal.goal_color === 'blue' ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30' :
                          goal.goal_color === 'purple' ? 'from-purple-500/20 to-purple-600/20 border-purple-500/30' :
                          goal.goal_color === 'yellow' ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30' :
                          goal.goal_color === 'red' ? 'from-red-500/20 to-red-600/20 border-red-500/30' :
                          'from-gray-500/20 to-gray-600/20 border-gray-500/30'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              goal.goal_color === 'green' ? 'bg-green-500/20' :
                              goal.goal_color === 'blue' ? 'bg-blue-500/20' :
                              goal.goal_color === 'purple' ? 'bg-purple-500/20' :
                              goal.goal_color === 'yellow' ? 'bg-yellow-500/20' :
                              goal.goal_color === 'red' ? 'bg-red-500/20' :
                              'bg-gray-500/20'
                            }`}>
                              <IconComponent className={`w-5 h-5 ${
                                goal.goal_color === 'green' ? 'text-green-400' :
                                goal.goal_color === 'blue' ? 'text-blue-400' :
                                goal.goal_color === 'purple' ? 'text-purple-400' :
                                goal.goal_color === 'yellow' ? 'text-yellow-400' :
                                goal.goal_color === 'red' ? 'text-red-400' :
                                'text-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{goal.title}</h3>
                              <p className="text-xs text-gray-400">{goal.goal_display_name}</p>
                            </div>
                            {hasWinners && (
                              <IconAward className="w-5 h-5 text-yellow-400" title={`${goal.winner_count} winner(s)`} />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-3">{goal.description}</p>
                          
                          {goal.prize_description && (
                            <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                              <p className="text-sm text-yellow-300 font-medium">🏆 {goal.prize_description}</p>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">
                                {goal.participant_count} participant{goal.participant_count !== 1 ? 's' : ''}
                              </span>
                              <span className={`${
                                isActive ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                {isActive ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left` : 'Ended'}
                              </span>
                            </div>
                            
                            {goal.top_performers && goal.top_performers.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Top performers:</p>
                                <div className="space-y-1">
                                  {goal.top_performers.slice(0, 3).map((performer: any, index: number) => (
                                    <div key={performer.developer_id} className="flex justify-between text-xs">
                                      <span className="text-gray-300">
                                        #{index + 1} {performer.developer_name}
                                      </span>
                                      <span className="text-white font-medium">{performer.current_value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {goal.current_winners && goal.current_winners.length > 0 && (
                              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                                <p className="text-xs text-green-300 font-medium">
                                  🎉 Winner{goal.current_winners.length > 1 ? 's' : ''}: {goal.current_winners.map((w: any) => w.developer_name).join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {weeklyGoals.length > 0 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/leaderboard"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View full leaderboard →
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button 
                  onClick={handleCreateModuleClick}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <IconComponents className="w-8 h-8 text-white" />
                    <div className="text-left">
                      <h3 className="font-semibold text-white">Create Module</h3>
                      <p className="text-sm text-blue-100">Build reusable modules</p>
                    </div>
                  </div>
                </button>

                <Link href="/developer/registry" className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-6 hover:from-green-600 hover:to-teal-600 transition-all">
                  <div className="flex items-center gap-4">
                    <IconDatabase className="w-8 h-8 text-white" />
                    <div>
                      <h3 className="font-semibold text-white">Module Registry</h3>
                      <p className="text-sm text-green-100">Browse available modules</p>
                    </div>
                  </div>
                </Link>

                <Link href="/leaderboard" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 hover:from-yellow-600 hover:to-orange-600 transition-all">
                  <div className="flex items-center gap-4">
                    <IconTrophy className="w-8 h-8 text-white" />
                    <div>
                      <h3 className="font-semibold text-white">View Leaderboard</h3>
                      <p className="text-sm text-yellow-100">See your competitive ranking</p>
                    </div>
                  </div>
                </Link>
              </div>
            </>
          )}

          {/* Daily Workflow View */}
          {currentView === 'workflow' && (
            <DailyWorkflowDashboard 
              tasks={tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                priority: task.priority || 'medium'
              }))}
            />
          )}

          {/* Tasks View */}
          {currentView === 'tasks' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">My Tasks</h2>
                <div className="flex items-center gap-3">
                  <select 
                    value={filterStatus || ''} 
                    onChange={(e) => setFilterStatus(e.target.value || null)}
                    className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Tasks</option>
                    <option value="pending">Available</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={handleCreateModuleClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Module
                  </button>
                  <Link
                    href="/developer/tasks/create"
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Create Task
                  </Link>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <IconClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-300 mb-2">No Tasks Found</h3>
                  <p className="text-gray-400 mb-6">
                    {filterStatus ? `No ${filterStatus} tasks available.` : 'You have no tasks assigned yet. Start by creating modules!'}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleCreateModuleClick}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Create Module
                    </button>
                    <Link
                      href="/developer/tasks/create"
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Create Task
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <Link key={task.id} href={`/developer/tasks/${task.id}`}>
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 transition-colors">{task.title}</h3>
                            {task.description && (
                              <p className="text-gray-400 mb-3">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'completed' || task.task_status === 'completed'
                                  ? 'bg-green-500/20 text-green-400'
                                  : task.status === 'in_progress' || task.task_status === 'in_progress'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {mapTaskStatusForDisplay(task.status || task.task_status)}
                              </span>
                              {task.priority && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {task.priority} priority
                                </span>
                              )}
                              {task.created_at && (
                                <span className="text-gray-500">
                                  Created {formatDate(task.created_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <IconChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Modules View */}
          {currentView === 'modules' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Recent Modules</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                    title="Refresh modules"
                  >
                    <IconBolt className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                <Link
                    href="/developer/registry"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Browse All Modules
                </Link>
                </div>
              </div>

              {recentModules.length === 0 ? (
                <div className="text-center py-12">
                  <IconComponents className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-300 mb-2">No Recent Modules</h3>
                  <p className="text-gray-400 mb-6">You haven't worked on any modules recently.</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleRefresh}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <IconBolt className="w-4 h-4" />
                      Refresh Data
                    </button>
                  <Link
                      href="/developer/registry"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Browse Module Registry
                  </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentModules.map((module) => (
                    <Link 
                      key={module.id} 
                      href={`/developer/registry?module=${module.id}`}
                      className="block"
                    >
                      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          module.module_color || 'bg-blue-500/20'
                        }`}>
                          <IconComponents className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{module.name}</h3>
                          <p className="text-xs text-gray-400">{module.module_type}</p>
                        </div>
                      </div>
                      
                      {module.description && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{module.description}</p>
                      )}
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Progress</span>
                          <span className="text-gray-300">{module.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all" 
                            style={{ width: `${module.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          module.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          module.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {module.status ? module.status.replace('_', ' ') : 'Unknown'}
                        </span>
                        <span className="text-gray-500 text-xs">
                          Updated {formatDate(module.updated_at)}
                        </span>
                      </div>
                        
                        {/* Click indicator */}
                        <div className="mt-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-blue-400 flex items-center gap-1">
                            <IconChevronRight className="w-3 h-3" />
                            View in Registry
                          </span>
                    </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Show fallback content if currentView is not set correctly */}
          {currentView !== 'dashboard' && currentView !== 'workflow' && currentView !== 'tasks' && currentView !== 'modules' && (
            <div className="text-center py-12">
              <h2 className="text-xl font-bold text-white mb-4">Welcome to Developer Portal</h2>
              <p className="text-gray-400 mb-6">Select a section from the sidebar to get started</p>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Selection Modal */}
      <TaskSelectionModal
        isOpen={showTaskSelection}
        onClose={handleCloseTaskSelection}
        onTaskSelected={handleTaskSelected}
      />

      {/* Create Module Modal */}
      {showCreateModule && selectedTaskId && (
        <ModuleCreator
          isOpen={showCreateModule}
          onClose={handleCloseModuleCreator}
          taskId={selectedTaskId}
          moduleTypes={moduleTypes}
          onSuccess={handleModuleCreated}
        />
      )}
    </div>
  );
} 