"use client";

import { 
  IconChevronLeft, 
  IconVideo, 
  IconComponents, 
  IconActivity, 
  IconFileText,
  IconPlayerPlay,
  IconExternalLink,
  IconPlus,
  IconEdit,
  IconCheck,
  IconClock,
  IconUser,
  IconCalendar,
  IconTarget,
  IconSend,
  IconDownload,
  IconGitBranch,
  IconDatabase,
  IconHome,
  IconX,
  IconPackage,
  IconTag,
  IconNetwork,
  IconLink,
  IconAlertTriangle,
  IconCircleCheck,
  IconSettings,
  IconCopy
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";

import { MediaPreviewModal } from '@/components/media/MediaPreviewModal';
import { ModuleCreator } from '@/components/modules/ModuleCreator';
import { TaskSelectionModal } from '@/components/modules/TaskSelectionModal';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleDetailModal } from '@/components/modules/ModuleDetailModal';
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTaskDetails } from "@/hooks/useTaskDetails";

interface TaskModule {
  id: string;
  name: string;
  description: string;
  status: string;
  completion_percentage: number;
  module_type: string;
  loom_video_url?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
  module_color?: string; // Added for new module list styling
  metadata?: {
    loom_video_url?: string;
    [key: string]: any;
  };
}

interface Scribe {
  id: string;
  title: string;
  content: string;
  scribe_url?: string;
  module_id?: string;
  module_name?: string;
  created_at: string;
  updated_at: string;
}

interface LoomVideo {
  id: string;
  url: string;
  title: string;
  source: 'task' | 'module' | 'milestone';
  module_name?: string;
  created_at: string;
}

export default function DeveloperTaskDetailPage({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  
  // Use custom hook for task data
  const { task, loading, error, refetch } = useTaskDetails(params.taskId);

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'scribes' | 'videos' | 'modules' | 'progress'>('overview');
  
  // Data states for each tab
  const [taskModules, setTaskModules] = useState<TaskModule[]>([]);
  const [scribes, setScribes] = useState<Scribe[]>([]);
  const [loomVideos, setLoomVideos] = useState<LoomVideo[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingScribes, setLoadingScribes] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    activeDays: 0,
    totalModules: 0,
    totalScribes: 0,
    totalVideos: 0,
    totalUpdates: 0,
    overallProgress: 0
  });

  // Scribe form state
  const [showScribeForm, setShowScribeForm] = useState(false);
  const [scribeTitle, setScribeTitle] = useState('');
  const [scribeContent, setScribeContent] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');

  // Module creation state
  const [showModuleCreator, setShowModuleCreator] = useState(false);
  const [showTaskSelection, setShowTaskSelection] = useState(false);

  // Video form state
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoModuleId, setVideoModuleId] = useState('');

  // GitHub and Database state
  const [showGitHubForm, setShowGitHubForm] = useState(false);
  const [gitHubUrl, setGitHubUrl] = useState('');
  const [showDatabaseForm, setShowDatabaseForm] = useState(false);
  const [databaseUrl, setDatabaseUrl] = useState('');

  // Media preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<any[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  // Module detail modal state
  const [moduleTypes, setModuleTypes] = useState<any[]>([]);
  const [selectedModuleForDetail, setSelectedModuleForDetail] = useState<TaskModule | null>(null);
  const [showModuleDetailModal, setShowModuleDetailModal] = useState(false);
  
  // State for ModuleCard component
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  
  // Milestone update state
  const [milestoneUpdateContent, setMilestoneUpdateContent] = useState('');
  const [showMilestoneUpdateForm, setShowMilestoneUpdateForm] = useState<string | null>(null);
  const [updatingMilestoneStatus, setUpdatingMilestoneStatus] = useState<string | null>(null);
  
  // Expanded milestones state
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

  // Load data based on active tab
  useEffect(() => {
    if (task) {
      // Load module types once
      loadModuleTypes();
      
      switch (activeTab) {
        case 'overview':
          // Load modules first, then scribes and videos to get accurate counts
          loadTaskModules().then(() => {
            loadScribes();
            loadLoomVideos();
          });
          break;
        case 'modules':
          loadTaskModules().then(() => loadLoomVideos());
          break;
        case 'scribes':
          loadScribes();
          break;
        case 'videos':
          if (taskModules.length > 0) {
            loadLoomVideos();
          } else {
            loadTaskModules().then(() => loadLoomVideos());
          }
          break;
      }
    }
  }, [activeTab, task]);

  const loadModuleTypes = async () => {
    try {
      const response = await fetch('/api/module-types');
      if (response.ok) {
        const data = await response.json();
        setModuleTypes(data.moduleTypes || []);
      }
    } catch (error) {
      console.error('Error loading module types:', error);
    }
  };

  const handleModuleCreated = () => {
    setShowModuleCreator(false);
    loadTaskModules(); // Refresh modules after creation
    loadOverviewStats(); // Refresh overview stats
  };

  const loadTaskModules = async () => {
    if (!task) return;
    try {
      setLoadingModules(true);
      const response = await fetch(`/api/tasks/modules?taskId=${task.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw module data from API:', data.modules?.length || 0, 'modules');
        // Log sample module to see structure
        if (data.modules && data.modules.length > 0) {
          console.log('Sample module structure:', data.modules[0]);
        }
        setTaskModules(data.modules || []);
        
        // Update overview stats when modules load
        updateOverviewStats(data.modules || []);
      } else {
        console.error('Failed to load task modules');
        toast.error('Failed to load modules');
      }
    } catch (error) {
      console.error('Error loading task modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoadingModules(false);
    }
  };

  const updateOverviewStats = (modules: TaskModule[]) => {
    if (!task) return;
    
    // Calculate active days (days since task was assigned/started)
    const startDate = new Date(task.assignment?.start_date || task.created_at);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Get overall progress from milestones
    const overallProgress = calculateOverallProgress();

    setOverviewStats({
      activeDays,
      totalModules: modules.length,
      totalScribes: scribes.length, // Use actual scribes count from database
      totalVideos: loomVideos.length, // Use actual loom videos count
      totalUpdates: 25, // Will be updated dynamically when admin data loads
      overallProgress
    });
  };

  const loadOverviewStats = async () => {
    // This function is now called by updateOverviewStats after modules load
    // Just trigger module loading if modules aren't loaded yet
    if (taskModules.length === 0) {
      await loadTaskModules();
    } else {
      updateOverviewStats(taskModules);
    }
  };

  const loadScribes = async () => {
    if (!task) return;
    try {
      setLoadingScribes(true);
      const response = await fetch(`/api/tasks/module-scribes?taskId=${task.id}`);
      if (response.ok) {
        const data = await response.json();
        const scribeList = data.scribes.map((scribe: any) => ({
          id: scribe.id,
          title: scribe.title,
          content: scribe.description || 'No description available',
          scribe_url: scribe.scribe_url,
          module_id: scribe.module_id,
          module_name: scribe.module?.name,
          created_at: scribe.created_at,
          updated_at: scribe.updated_at
        }));
        setScribes(scribeList);
        
        // Update overview stats with new scribe count
        if (taskModules.length > 0) {
          updateOverviewStats(taskModules);
        }
      } else {
        console.error('Failed to load scribes');
        toast.error('Failed to load scribes');
      }
    } catch (error) {
      console.error('Error loading scribes:', error);
      toast.error('Failed to load scribes');
    } finally {
      setLoadingScribes(false);
    }
  };

  const loadLoomVideos = async () => {
    if (!task) return;
    try {
      setLoadingVideos(true);
      
      console.log('Loading loom videos using admin API directly...');
      
      // Call the admin API directly since it has the correct comprehensive extraction
      const adminResponse = await fetch(`/api/admin/tasks/details?taskId=${task.id}`);
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        
        // Use the admin API's loom_videos array directly
        const adminLoomVideos = (adminData.loom_videos || []).map((video: any) => ({
          id: video.id,
          url: video.url,
          title: video.title,
          source: video.source,
          module_name: video.module_name,
          module_type: video.module_type,
          created_at: video.created_at
        }));

        console.log(`Found ${adminLoomVideos.length} loom videos from admin API:`, {
          sources: adminData.stats?.total_loom_videos || 0,
          breakdown: adminLoomVideos.reduce((acc: any, video: any) => {
            acc[video.source] = (acc[video.source] || 0) + 1;
            return acc;
          }, {})
        });

        setLoomVideos(adminLoomVideos);
        
        // Update the total updates count from admin data and video count
        setOverviewStats(prev => ({
          ...prev,
          totalVideos: adminLoomVideos.length,
          totalUpdates: adminData.recent_activity?.length || 0
        }));
      } else {
        console.error('Failed to load admin data for loom videos:', adminResponse.status);
        toast.error('Failed to load loom videos');
      }
      
    } catch (error) {
      console.error('Error loading loom videos:', error);
      toast.error('Failed to load loom videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  // Update tab data to use accurate counts
  const tabData = [
    { id: 'overview', label: 'Overview', icon: IconActivity, count: undefined },
    { id: 'scribes', label: 'Scribe Docs', icon: IconFileText, count: overviewStats.totalScribes },
    { id: 'videos', label: 'Loom Videos', icon: IconVideo, count: overviewStats.totalVideos },
    { id: 'modules', label: 'Task Modules', icon: IconComponents, count: overviewStats.totalModules },
    { id: 'progress', label: 'Progress Updates', icon: IconActivity, count: overviewStats.totalUpdates }
  ];

  const handleCreateScribe = async () => {
    if (!scribeTitle.trim() || !scribeContent.trim()) {
      toast.error('Please fill in both title and scribe URL');
      return;
    }

    if (!selectedModuleId) {
      toast.error('Please select a module to associate the scribe with');
      return;
    }

    // Validate scribe URL format
    if (!scribeContent.includes('scribehow.com')) {
      toast.error('Please provide a valid ScribeHow URL');
      return;
    }

    try {
      const response = await fetch('/api/tasks/module-scribes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          title: scribeTitle,
          scribeUrl: scribeContent,
          description: `Scribe documentation for ${scribeTitle}`
        })
      });
      
      if (response.ok) {
        toast.success('Scribe documentation created successfully');
        setShowScribeForm(false);
        setScribeTitle('');
        setScribeContent('');
        setSelectedModuleId('');
        await loadScribes(); // Reload scribes
        await loadTaskModules(); // Refresh modules
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create scribe documentation');
      }
    } catch (error) {
      console.error('Error creating scribe:', error);
      toast.error('Failed to create scribe');
    }
  };

  const handleCreateVideo = async () => {
    if (!videoUrl.trim() || !videoTitle.trim()) {
      toast.error('Please fill in video URL and title');
      return;
    }

    if (!videoUrl.includes('loom.com')) {
      toast.error('Please provide a valid Loom video URL');
      return;
    }

    if (!videoModuleId) {
      toast.error('Please select a module to associate the video with');
      return;
    }

    try {
      // Add video as a module update (this is how the system finds videos)
      const response = await fetch(`/api/tasks/module-comments?taskId=${task?.id}&moduleId=${videoModuleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎥 **${videoTitle}**\n\nLoom Video: ${videoUrl}\n\nVideo demonstration added for this module.`,
          updateType: 'video_demo'
        })
      });
      
      if (response.ok) {
        toast.success('Video added successfully');
        setShowVideoForm(false);
        setVideoUrl('');
        setVideoTitle('');
        setVideoModuleId('');
        // Refresh both videos and modules to update counts
        await loadLoomVideos();
        await loadTaskModules();
        await loadOverviewStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add video');
      }
    } catch (error) {
      console.error('Error creating video:', error);
      toast.error('Failed to add video');
    }
  };

  const handleCreateModule = () => {
    setShowModuleCreator(true);
  };

  const handleTaskSelected = (taskId: string) => {
    setShowTaskSelection(false);
    // Handle task selection logic
  };

  const handleAddGitHubRepo = async () => {
    if (!gitHubUrl.trim()) {
      toast.error('Please provide a GitHub repository URL');
      return;
    }

    if (!task) {
      toast.error('Task data not available');
      return;
    }

    try {
      // Update task metadata with repository URL
      const response = await fetch(`/api/developer/tasks/${task.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository_url: gitHubUrl
        })
      });
      
      if (response.ok) {
        toast.success('GitHub repository linked successfully');
        setShowGitHubForm(false);
        setGitHubUrl('');
        refetch(); // Refresh task data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to link GitHub repository');
      }
    } catch (error) {
      console.error('Error adding GitHub repo:', error);
      toast.error('Failed to link repository');
    }
  };

  const handleAddDatabaseConnection = async () => {
    if (!databaseUrl.trim()) {
      toast.error('Please provide a database connection string');
      return;
    }

    if (!task) {
      toast.error('Task data not available');
      return;
    }

    try {
      // This would need an API endpoint to update task environment variables
      const response = await fetch(`/api/tasks/${task.id}/environment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DATABASE_URL: databaseUrl
        })
      });
      
      if (response.ok) {
        toast.success('Database connection added successfully');
        setShowDatabaseForm(false);
        setDatabaseUrl('');
        refetch(); // Refresh task data
      } else {
        toast.error('Failed to add database connection');
      }
    } catch (error) {
      console.error('Error adding database connection:', error);
      toast.error('Failed to add database connection');
    }
  };

  const extractLoomVideoId = (url: string) => {
    const match = url.match(/\/share\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  };

  const extractGitHubUrlFromDescription = (description: string | null) => {
    if (!description) return null;
    const githubMatch = description.match(/https:\/\/github\.com\/[^\s]+/);
    return githubMatch ? githubMatch[0] : null;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getModuleIcon = (moduleType: string) => {
    const iconMap: Record<string, any> = {
      'function': IconFileText,
      'api': IconComponents,
      'component': IconComponents,
      'database': IconFileText,
      'test': IconCheck,
    };
    return iconMap[moduleType.toLowerCase()] || IconFileText;
  };

  // Handle media preview
  const handleOpenMediaPreview = (mediaFiles: any[], index: number = 0) => {
    if (!mediaFiles || mediaFiles.length === 0) {
      return;
    }
    setSelectedMediaFiles(mediaFiles);
    setSelectedMediaIndex(index);
    setPreviewModalOpen(true);
  };

  // Handle module detail modal
  const handleOpenModuleDetail = (module: TaskModule) => {
    setSelectedModuleForDetail(module);
    setShowModuleDetailModal(true);
  };

  const handleCloseModuleDetail = () => {
    setShowModuleDetailModal(false);
    setSelectedModuleForDetail(null);
  };

  // Milestone update functions
  const handleMilestoneStatusChange = async (milestoneId: string, newStatus: string) => {
    if (updatingMilestoneStatus) return;

    setUpdatingMilestoneStatus(milestoneId);
    
    try {
      // Set completion percentage based on status
      let completionPercentage = 0;
      switch (newStatus) {
        case 'pending':
          completionPercentage = 0;
          break;
        case 'in_progress':
          completionPercentage = 50;
          break;
        case 'completed':
          completionPercentage = 100;
          break;
        case 'blocked':
          // Keep current percentage for blocked status
          const currentMilestone = task?.milestones?.find(m => m.id === milestoneId);
          completionPercentage = currentMilestone?.completion_percentage || 0;
          break;
        default:
          completionPercentage = 0;
      }

      const response = await fetch('/api/tasks/milestone-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          milestoneId, 
          status: newStatus,
          completionPercentage 
        })
      });

      if (response.ok) {
        toast.success(`Milestone marked as ${newStatus.replace('_', ' ')}`);
        refetch(); // Reload task data to get updated milestone
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update milestone status');
      }
    } catch (error) {
      console.error('Error updating milestone status:', error);
      toast.error('Failed to update milestone status');
    } finally {
      setUpdatingMilestoneStatus(null);
    }
  };

  const handleAddMilestoneUpdate = async (milestoneId: string) => {
    if (!milestoneUpdateContent.trim()) {
      toast.error('Please enter an update message');
      return;
    }

    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/milestone-comments?taskId=${task.id}&milestoneId=${milestoneId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: milestoneUpdateContent
        })
      });
      
      if (response.ok) {
        toast.success('Update added successfully');
        setMilestoneUpdateContent('');
        setShowMilestoneUpdateForm(null);
        refetch(); // Refresh task data to show new update
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add update');
      }
    } catch (error) {
      console.error('Error adding milestone update:', error);
      toast.error('Failed to add update');
    }
  };

  const calculateOverallProgress = () => {
    if (!task || !task.milestones || task.milestones.length === 0) return 0;
    
    const totalPercentage = task.milestones.reduce((sum, milestone) => {
      return sum + (milestone.completion_percentage || 0);
    }, 0);
    
    return Math.round(totalPercentage / task.milestones.length);
  };

  const toggleMilestoneExpansion = (milestoneId: string) => {
    setExpandedMilestones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error || !task) {
    return (
      <ErrorMessage 
        message={error || "Task not found"} 
        backUrl="/developer/dashboard"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <Link
                href="/developer/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
              >
                <IconChevronLeft size={18} />
                <span>Dashboard</span>
              </Link>
              
              <div className="h-8 w-px bg-gray-600"></div>
              
              <div>
                <h1 className="text-xl font-semibold text-white">{task.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-900/50 text-green-300 border border-green-700/50' :
                    task.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50' :
                    task.status === 'assigned' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' :
                    'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                  }`}>
                    {task.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.complexity === 'low' ? 'bg-green-900/30 text-green-400' :
                    task.complexity === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {task.complexity}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Progress info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Progress</div>
                <div className="text-lg font-semibold text-white">
                  {overviewStats.overallProgress}%
                </div>
              </div>
              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                  style={{ width: `${overviewStats.overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mt-6 bg-gray-700/30 rounded-lg p-1">
            {tabData.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gray-600/70 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-gray-500/50 text-xs px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-4 border border-blue-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-200">{overviewStats.totalModules}</div>
                    <div className="text-blue-300/70 text-sm">Modules</div>
                  </div>
                  <IconComponents className="text-blue-400" size={28} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-4 border border-purple-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-200">{overviewStats.totalScribes}</div>
                    <div className="text-purple-300/70 text-sm">Scribes</div>
                  </div>
                  <IconFileText className="text-purple-400" size={28} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-4 border border-red-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-200">{overviewStats.totalVideos}</div>
                    <div className="text-red-300/70 text-sm">Videos</div>
                  </div>
                  <IconVideo className="text-red-400" size={28} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-4 border border-green-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-200">{overviewStats.activeDays}</div>
                    <div className="text-green-300/70 text-sm">Active Days</div>
                  </div>
                  <IconCalendar className="text-green-400" size={28} />
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Information */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <IconHome size={20} className="text-blue-400" />
                  Task Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Description</p>
                    <p className="text-gray-300 text-sm">{task.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Department</p>
                      <p className="text-white text-sm">{task.department_display_name || task.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Complexity</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.complexity === 'low' ? 'bg-green-900/30 text-green-400' :
                        task.complexity === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {task.complexity}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Overall Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${overviewStats.overallProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-semibold text-sm">{overviewStats.overallProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GitHub & Database */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <IconGitBranch size={20} className="text-purple-400" />
                  Integration Status
                </h3>
                
                {/* GitHub Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">GitHub Repository</h4>
                    {!(task.metadata as any)?.repository_url && !extractGitHubUrlFromDescription(task.description) && (
                      <button
                        onClick={() => setShowGitHubForm(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-600/70 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                      >
                        <IconPlus size={12} />
                        Add
                      </button>
                    )}
                  </div>
                  {((task.metadata as any)?.repository_url || extractGitHubUrlFromDescription(task.description)) ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Repository:</span>
                        <a 
                          href={(task.metadata as any)?.repository_url || extractGitHubUrlFromDescription(task.description)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm font-mono break-all transition-colors"
                        >
                          {(task.metadata as any)?.repository_url || extractGitHubUrlFromDescription(task.description)}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 text-sm">Repository linked</span>
                        <a 
                          href={(task.metadata as any)?.repository_url || extractGitHubUrlFromDescription(task.description)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/70 hover:bg-blue-600 text-white rounded text-xs transition-colors ml-auto"
                        >
                          <IconExternalLink size={12} />
                          Open Repo
                        </a>
                      </div>
                      {extractGitHubUrlFromDescription(task.description) && !(task.metadata as any)?.repository_url && (
                        <div className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                          Found in task description - consider adding to metadata
                        </div>
                      )}
                    </div>
                  ) : showGitHubForm ? (
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={gitHubUrl}
                        onChange={(e) => setGitHubUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddGitHubRepo}
                          className="px-3 py-1 bg-green-600/70 hover:bg-green-600 text-white rounded text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowGitHubForm(false);
                            setGitHubUrl('');
                          }}
                          className="px-3 py-1 bg-gray-600/70 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      No GitHub repository linked
                    </div>
                  )}
                </div>
                
                {/* Database Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <IconDatabase size={16} />
                      Database Connection
                    </h4>
                    {(!task.environment_variables || !Object.keys(task.environment_variables).some(key => key.includes('DATABASE'))) && (
                      <button
                        onClick={() => setShowDatabaseForm(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600/70 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                      >
                        <IconPlus size={12} />
                        Add
                      </button>
                    )}
                  </div>
                  {task.environment_variables && Object.keys(task.environment_variables).some(key => key.includes('DATABASE')) ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 text-sm">Database configured</span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {Object.keys(task.environment_variables).filter(key => key.includes('DATABASE')).length} database variable(s) configured
                      </p>
                    </div>
                  ) : showDatabaseForm ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={databaseUrl}
                        onChange={(e) => setDatabaseUrl(e.target.value)}
                        placeholder="postgresql://username:password@host:port/database"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 text-sm font-mono"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddDatabaseConnection}
                          className="px-3 py-1 bg-green-600/70 hover:bg-green-600 text-white rounded text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowDatabaseForm(false);
                            setDatabaseUrl('');
                          }}
                          className="px-3 py-1 bg-gray-600/70 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-gray-400 text-sm">No database configuration found</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Requirements and Acceptance Criteria Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requirements */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <IconCheck size={20} className="text-green-400" />
                  Requirements
                  <span className="text-sm text-gray-400 ml-auto">
                    {task.completed_requirements?.length || 0} of {task.requirements?.length || 0} completed
                  </span>
                </h3>
                <div className="space-y-3">
                  {task.requirements && task.requirements.length > 0 ? (
                    task.requirements.map((requirement: string, index: number) => {
                      const isCompleted = task.completed_requirements?.[index] || false;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-600 border-green-600' 
                              : 'border-gray-500 bg-transparent'
                          }`}>
                            {isCompleted && <IconCheck size={12} className="text-white" />}
                          </div>
                          <span className={`text-sm flex-1 ${
                            isCompleted ? 'text-gray-400 line-through' : 'text-gray-300'
                          }`}>
                            {requirement}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No requirements specified for this task.</p>
                  )}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <IconTarget size={20} className="text-blue-400" />
                  Acceptance Criteria
                  <span className="text-sm text-gray-400 ml-auto">
                    {task.completed_acceptance_criteria?.length || 0} of {task.acceptance_criteria?.length || 0} completed
                  </span>
                </h3>
                <div className="space-y-3">
                  {task.acceptance_criteria && task.acceptance_criteria.length > 0 ? (
                    task.acceptance_criteria.map((criteria: string, index: number) => {
                      const isCompleted = task.completed_acceptance_criteria?.[index] || false;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-500 bg-transparent'
                          }`}>
                            {isCompleted && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className={`text-sm flex-1 ${
                            isCompleted ? 'text-gray-400 line-through' : 'text-gray-300'
                          }`}>
                            {criteria}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No acceptance criteria specified for this task.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Environment Variables */}
            {task.environment_variables && Object.keys(task.environment_variables).length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <IconSettings size={20} className="text-yellow-400" />
                  Environment Variables
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(task.environment_variables).map(([key, value]) => (
                    <div key={key} className="bg-gray-700/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <code className="text-blue-400 text-sm font-mono">{key}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(value as string)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Copy value"
                        >
                          <IconCopy size={14} />
                        </button>
                      </div>
                      <code className="text-gray-300 text-xs font-mono break-all block mt-1">
                        {value as string}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scribes Tab */}
        {activeTab === 'scribes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Scribe Documentation</h2>
                <p className="text-gray-400 mt-1">Link Scribe.com step-by-step guides to your modules for better documentation</p>
              </div>
              <button
                onClick={() => setShowScribeForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 border border-purple-500/50"
              >
                <IconPlus size={18} />
                <span>Add Scribe Link</span>
              </button>
            </div>

            {/* Create Scribe Form */}
            {showScribeForm && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Add Scribe Documentation Link</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={scribeTitle}
                      onChange={(e) => setScribeTitle(e.target.value)}
                      placeholder="e.g., How to setup authentication..."
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Module</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">Select a module...</option>
                      {taskModules.map(module => (
                        <option key={module.id} value={module.id}>{module.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Scribe URL</label>
                    <input
                      type="url"
                      value={scribeContent}
                      onChange={(e) => setScribeContent(e.target.value)}
                      placeholder="https://scribehow.com/shared/..."
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the shareable link from your Scribe.com documentation
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateScribe}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <IconLink size={16} />
                      Add Scribe Link
                    </button>
                    <button
                      onClick={() => {
                        setShowScribeForm(false);
                        setScribeTitle('');
                        setScribeContent('');
                        setSelectedModuleId('');
                      }}
                      className="px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scribes List */}
            {loadingScribes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading scribes...</p>
              </div>
            ) : scribes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scribes.map((scribe) => (
                  <div key={scribe.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-purple-600/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-1">{scribe.title}</h4>
                        {scribe.module_name && (
                          <span className="text-sm text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                            {scribe.module_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={scribe.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-purple-400 hover:text-purple-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                          title="Open Scribe documentation"
                        >
                          <IconExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <IconFileText size={14} className="text-purple-400" />
                        <span className="text-gray-300">Scribe Documentation</span>
                      </div>
                      <a 
                        href={scribe.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-xs break-all transition-colors mt-1 block"
                      >
                        {scribe.content}
                      </a>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Added {formatTimeAgo(scribe.updated_at)}</span>
                      <a
                        href={scribe.content}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                      >
                        View Guide <IconExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconFileText size={64} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Scribe Documentation Found</h3>
                <p className="text-gray-500 mb-4">Create step-by-step guides with Scribe.com and link them to your modules.</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowScribeForm(true)}
                    className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Add First Scribe Link
                  </button>
                  <div>
                    <a
                      href="https://scribehow.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1"
                    >
                      Create documentation at Scribe.com <IconExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Loom Videos & Demos</h2>
                <p className="text-gray-400 mt-1">All video demonstrations and explanations for this task</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowVideoForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 border border-purple-500/50"
                >
                  <IconPlus size={18} />
                  <span>Add Video</span>
                </button>
                <span className="text-sm text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full">
                  {loomVideos.length} video{loomVideos.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Add Video Form */}
            {showVideoForm && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Loom Video</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Video Title</label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title..."
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Loom Video URL</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.loom.com/share/..."
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Associated Module</label>
                    <select
                      value={videoModuleId}
                      onChange={(e) => setVideoModuleId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">Select a module</option>
                      {taskModules.map(module => (
                        <option key={module.id} value={module.id}>{module.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateVideo}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <IconSend size={16} />
                      Add Video
                    </button>
                    <button
                      onClick={() => {
                        setShowVideoForm(false);
                        setVideoUrl('');
                        setVideoTitle('');
                        setVideoModuleId('');
                      }}
                      className="px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loadingVideos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading videos...</p>
              </div>
            ) : loomVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loomVideos.map((video) => {
                  const videoId = extractLoomVideoId(video.url);
                  const embedUrl = videoId ? `https://www.loom.com/embed/${videoId}` : null;
                  
                  return (
                    <div key={video.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-3 bg-purple-900/50 rounded-lg flex-shrink-0">
                          <IconPlayerPlay size={24} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-lg mb-1 truncate">{video.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className={`px-2 py-0.5 rounded ${
                              video.source === 'task' ? 'bg-blue-900/30 text-blue-300' :
                              video.source === 'module' ? 'bg-green-900/30 text-green-300' :
                              'bg-purple-900/30 text-purple-300'
                            }`}>
                              {video.source}
                            </span>
                            {video.module_name && <span>{video.module_name}</span>}
                          </div>
                        </div>
                      </div>

                      {embedUrl && (
                        <div className="mb-4">
                          <iframe
                            src={embedUrl}
                            frameBorder="0"
                            allowFullScreen
                            className="w-full h-48 rounded-lg"
                            title={video.title}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <span>{formatTimeAgo(video.created_at)}</span>
                        <div className="flex items-center gap-1">
                          <IconClock size={14} />
                          <span>Demo</span>
                        </div>
                      </div>

                      <button
                        onClick={() => window.open(video.url, '_blank')}
                        className="w-full px-4 py-2 bg-purple-600/70 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <IconExternalLink size={16} />
                        Open in Loom
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconVideo size={64} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Videos Found</h3>
                <p className="text-gray-500">No loom videos have been submitted yet.</p>
                <p className="text-gray-500 text-sm mt-2">Create video demos and add them to your modules to see them here.</p>
              </div>
            )}
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Task Modules</h2>
                <p className="text-gray-400 mt-1">All development modules for this task</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCreateModule}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-all duration-200 border border-green-500/50"
                >
                  <IconPlus size={18} />
                  <span>Add Module</span>
                </button>
                <span className="text-sm text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full">
                  {taskModules.length} module{taskModules.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Modules List */}
            {loadingModules ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading modules...</p>
              </div>
            ) : taskModules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {taskModules
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .map((module) => (
                  <div 
                    key={module.id}
                    onClick={() => handleOpenModuleDetail(module)}
                    className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 cursor-pointer transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: module.module_color + '20', border: `1px solid ${module.module_color}40` }}
                      >
                        {(() => {
                          const Icon = getModuleIcon(module.module_type);
                          return <Icon size={24} style={{ color: module.module_color }} />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-lg mb-1 truncate">{module.name}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400">{module.module_type}</span>
                        </div>
                      </div>
                    </div>
                    
                    {module.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{module.description}</p>
                    )}
                    
                    <div className="flex items-center justify-end text-sm text-gray-400">
                      <span>{formatTimeAgo(module.updated_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconComponents size={64} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Modules Found</h3>
                <p className="text-gray-500 mb-4">Start building by creating your first module.</p>
                <button
                  onClick={handleCreateModule}
                  className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Create First Module
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Updates Tab (Legacy Milestones) */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Progress Updates</h2>
                <p className="text-gray-400 mt-1">Track your progress through task milestones and submit updates</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-400 bg-green-900/30 px-3 py-1 rounded-full">
                  {task.milestones?.filter(m => m.status === 'completed').length || 0} of {task.milestones?.length || 0} completed
                </span>
              </div>
            </div>

            {task.milestones && task.milestones.length > 0 ? (
              <div className="space-y-4">
                {task.milestones.map((milestone, index) => {
                  const isExpanded = expandedMilestones.has(milestone.id);
                  
                  return (
                  <div key={milestone.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          milestone.status === 'completed' ? 'bg-green-600' :
                          milestone.status === 'in_progress' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}>
                          {milestone.status === 'completed' ? <IconCircleCheck size={16} /> : index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h4 className="text-white font-semibold text-lg">{milestone.title}</h4>
                            <button
                              onClick={() => toggleMilestoneExpansion(milestone.id)}
                              className="p-1 hover:bg-gray-700 rounded transition-colors"
                              title={isExpanded ? "Collapse updates" : "Expand updates"}
                            >
                              <IconChevronLeft 
                                size={16} 
                                className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-[-90deg]' : 'rotate-180'}`} 
                              />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              milestone.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                              milestone.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-gray-700/50 text-gray-400'
                            }`}>
                              {milestone.completion_percentage}%
                            </span>
                          </div>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-gray-300 text-sm mb-4">{milestone.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <IconUser size={14} />
                            <span>{milestone.updates?.length || 0} updates</span>
                          </div>
                          {milestone.due_date && (
                            <div className="flex items-center gap-1">
                              <IconCalendar size={14} />
                              <span>Due {new Date(milestone.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              milestone.status === 'completed' ? 'bg-green-500' :
                              milestone.status === 'in_progress' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${milestone.completion_percentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Milestone Actions - Always visible */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={milestone.status}
                              onChange={(e) => handleMilestoneStatusChange(milestone.id, e.target.value)}
                              disabled={updatingMilestoneStatus === milestone.id}
                              className="px-3 py-1 text-xs bg-gray-600/70 hover:bg-gray-600 text-white rounded-full transition-colors border border-gray-500/50 focus:outline-none focus:border-blue-500/50"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                            <button
                              onClick={() => setShowMilestoneUpdateForm(milestone.id)}
                              className="px-3 py-1 text-xs bg-blue-600/70 hover:bg-blue-600 text-white rounded-full transition-colors"
                            >
                              Add Update
                            </button>
                          </div>
                        </div>

                        {/* Add Update Form - Always visible when active */}
                        {showMilestoneUpdateForm === milestone.id && (
                          <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                            <h6 className="text-sm font-medium text-gray-300 mb-2">Add Progress Update</h6>
                            <textarea
                              value={milestoneUpdateContent}
                              onChange={(e) => setMilestoneUpdateContent(e.target.value)}
                              placeholder="Describe your progress on this milestone..."
                              className="w-full px-3 py-2 bg-gray-600/50 border border-gray-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAddMilestoneUpdate(milestone.id)}
                                className="px-3 py-1 bg-green-600/70 hover:bg-green-600 text-white rounded text-sm transition-colors"
                              >
                                Add Update
                              </button>
                              <button
                                onClick={() => {
                                  setShowMilestoneUpdateForm(null);
                                  setMilestoneUpdateContent('');
                                }}
                                className="px-3 py-1 bg-gray-600/70 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Updates - Show preview or all based on expansion */}
                        {milestone.updates && milestone.updates.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium text-gray-300">
                                {isExpanded ? 'All Updates' : 'Recent Updates'}
                              </h5>
                              {milestone.updates.length > 3 && (
                                <button
                                  onClick={() => toggleMilestoneExpansion(milestone.id)}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  {isExpanded ? 'Show Less' : `View All ${milestone.updates.length}`}
                                </button>
                              )}
                            </div>
                            {(isExpanded ? milestone.updates : milestone.updates.slice(0, 3)).map((update) => (
                              <div key={update.id} className="bg-gray-700/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white text-sm font-medium">{update.developer_name}</span>
                                  <span className="text-gray-400 text-xs">{formatTimeAgo(update.created_at)}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{update.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <IconTarget size={64} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Progress Updates</h3>
                <p className="text-gray-500">This task doesn't have milestone-based progress tracking.</p>
                <p className="text-gray-500 text-sm mt-2">Use the modules tab to track your development progress.</p>
              </div>
            )}
          </div>
        )}
        
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        mediaFiles={selectedMediaFiles}
        initialIndex={selectedMediaIndex}
      />

      {/* Module Creator Modal */}
      {showModuleCreator && (
        <ModuleCreator
          isOpen={showModuleCreator}
          onClose={() => setShowModuleCreator(false)}
          onSuccess={handleModuleCreated}
          taskId={task?.id || ''}
          moduleTypes={moduleTypes}
        />
      )}

      {/* Task Selection Modal */}
      {showTaskSelection && (
        <TaskSelectionModal
          isOpen={showTaskSelection}
          onClose={() => setShowTaskSelection(false)}
          onTaskSelected={handleTaskSelected}
        />
      )}

      {/* Module Detail Modal */}
      {selectedModuleForDetail && (
        <ModuleDetailModal
          module={selectedModuleForDetail as any}
          taskId={task?.id || ''}
          allModules={taskModules as any[]}
          isOpen={showModuleDetailModal}
          onClose={handleCloseModuleDetail}
          onUpdate={loadTaskModules}
          moduleIcon={getModuleIcon(selectedModuleForDetail.module_type)}
        />
      )}
    </div>
  );
}