"use client";

import {
  IconSearch,
  IconFilter,
  IconHeart,
  IconCopy,
  IconExternalLink,
  IconTag,
  IconCode,
  IconApi,
  IconComponents,
  IconLayout,
  IconTestPipe,
  IconDatabase,
  IconTool,
  IconPalette,
  IconFileText,
  IconSettings,
  IconTrendingUp,
  IconClock,
  IconSortAscending,
  IconSortDescending,
  IconCheck,
  IconNetwork,
  IconDownload,
  IconEye,
  IconArrowLeft,
  IconStar,
  IconGrid3x3,
  IconList,
  IconX,
  IconAlertCircle,
  IconGitBranch
} from "@tabler/icons-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

// Import all modular components from task detail page
import { MediaPreviewModal } from '@/components/media/MediaPreviewModal';
import { EnvironmentVariables } from "@/components/tasks/EnvironmentVariables";
import { GitHubIntegration } from "@/components/tasks/GitHubIntegration";
import { MediaGrid } from "@/components/tasks/MediaGrid";
import { ModularMilestonesSection } from "@/components/tasks/ModularMilestonesSection";
import { RequirementsAndCriteria } from "@/components/tasks/RequirementsAndCriteria";
import { TaskDescription } from "@/components/tasks/TaskDescription";
import { TaskHeader } from "@/components/tasks/TaskHeader";
import { VideoExplanation } from "@/components/tasks/VideoExplanation";
import { formatDateTimeCST, formatRelativeWithCST } from "@/utils/taskHelpers";

// Import new rating and favorites components
import { StarRating } from '@/components/registry/StarRating';
import { RatingModal } from '@/components/registry/RatingModal';
import { CommentsSection } from '@/components/registry/CommentsSection';
import { VersionSelector } from '@/components/registry/VersionSelector';
import { VersionCreator } from '@/components/registry/VersionCreator';

interface RegistryModule {
  id: string;
  name: string;
  description: string;
  file_path: string;
  url?: string;
  status?: string;
  completion_percentage: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  task_id: string;
  module_type: string;
  module_icon: string;
  module_color: string;
  module_type_description: string;
  task_title: string;
  task_description: string;
  dependency_count: number;
  submission_count: number;
  update_count: number;
  pre_conditions_count: number;
  post_conditions_count: number;
  relationships_count: number;
  popularity_score: number;
  creator_name?: string;
  creator_email?: string;
  creator_profile_picture?: string;
  total_checkouts?: number;
  unique_users?: number;
  avg_rating?: number;
  total_ratings?: number;
  favorite_count?: number;
  original_task_context?: string;
  current_version?: string;
}

interface ModuleType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

interface ComponentMapping {
  [key: string]: {
    component: React.ComponentType<any>;
    sampleProps: any;
    category: string;
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
  };
}

// Sample data for component previews
const sampleTaskData = {
  id: "sample-task",
  title: "Build React Component Library",
  description: "Create a comprehensive component library with TypeScript support, theming capabilities, and accessibility features. This includes buttons, forms, modals, and complex data visualization components.",
  status: "in_progress",
  priority: "high",
  complexity: "high",
  category: "NEW_FEATURE",
  department: "development",
  department_display_name: "Development Team",
  due_date: "2024-02-15",
  created_at: "2024-01-15",
  updated_at: "2024-01-20",
  compensation: 5000,
  estimated_time: 40,
  milestones: [
    {
      id: "m1",
      title: "Component Architecture",
      description: "Design and implement the base component architecture",
      status: "completed",
      completion_percentage: 100,
      due_date: "2024-01-20",
      updates: []
    },
    {
      id: "m2", 
      title: "Core Components",
      description: "Build button, input, and form components",
      status: "in_progress",
      completion_percentage: 65,
      due_date: "2024-01-25",
      updates: []
    }
  ],
  requirements: [
    "TypeScript support with strict typing",
    "Responsive design for all screen sizes",
    "WCAG 2.1 AA accessibility compliance",
    "Storybook documentation",
    "Jest unit tests with 90%+ coverage"
  ],
  acceptance_criteria: [
    "All components render correctly in Storybook",
    "Components pass accessibility audits",
    "TypeScript definitions are complete",
    "Test coverage meets requirements",
    "Documentation is comprehensive"
  ],
  environment_variables: {
    "STORYBOOK_API_URL": "https://api.storybook.dev",
    "JEST_TIMEOUT": "30000",
    "BUILD_TARGET": "production"
  },
  metadata: {
    github: {
      branch: "feature/component-library",
      pr_number: 42,
      pr_url: "https://github.com/company/repo/pull/42"
    }
  },
  loom_video_url: "https://www.loom.com/share/example123",
  transcript: "In this video, I'll walk through the component library architecture and demonstrate how to build reusable React components..."
};

// Generic module preview component for database modules
const GenericModulePreview = ({ module }: { module: RegistryModule }) => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <div className="space-y-4">
        {/* Module Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{module.description}</p>
        </div>

        {/* File Path */}
        {module.file_path && (
          <div>
            <h4 className="font-medium text-gray-900 mb-1">File Path</h4>
            <code className="text-sm bg-gray-200 px-2 py-1 rounded text-gray-800">
              {module.file_path}
            </code>
          </div>
        )}

        {/* Tags */}
        {module.tags && module.tags.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {module.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loom Video */}
        {module.url && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Demo Video</h4>
            <div className="bg-white border rounded-lg p-4">
              {module.url.includes('loom.com') ? (
                <div>
                  {/* Show embedded video if it's a complete Loom URL */}
                  {module.url.startsWith('http') ? (
                    <>
                      <iframe
                        src={module.url.replace('/share/', '/embed/')}
                        frameBorder="0"
                        allowFullScreen
                        className="w-full h-64 rounded"
                        title={`${module.name} Demo Video`}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={module.url.startsWith('http') ? module.url : `https://${module.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Open in Loom →
                        </a>
                      </div>
                    </>
                  ) : (
                    /* Handle incomplete URLs like "www.loom.com" */
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <IconExternalLink size={24} className="text-purple-600" />
                        </div>
                        <div className="text-gray-800 font-medium mb-1">Loom Video Available</div>
                        <div className="text-gray-600 text-sm">Demo video for this component</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded">
                          URL: {module.url}
                        </div>
                        <div className="text-xs text-orange-600">
                          Note: Video URL needs to be updated with full Loom link
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-600 mb-2">Video Demo Available</div>
                  <a
                    href={module.url.startsWith('http') ? module.url : `https://${module.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <IconExternalLink size={16} />
                    Watch Demo
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status & Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Status</h4>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              module.status === 'completed' ? 'bg-green-100 text-green-800' :
              module.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {module.status ? module.status.replace('_', ' ') : 'Unknown'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Progress</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${module.completion_percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{module.completion_percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Map module types to their corresponding components and properties
const componentMappings: ComponentMapping = {
  // Database module types - use actual module data
  'ui_components': {
    component: GenericModulePreview,
    sampleProps: {}, // Will be populated with actual module data
    category: "UI Components",
    complexity: "medium",
    dependencies: ["React", "TypeScript"]
  },
  'api_endpoints': {
    component: GenericModulePreview,
    sampleProps: {},
    category: "API",
    complexity: "medium", 
    dependencies: ["Node.js", "Express/Next.js"]
  },
  'functions': {
    component: GenericModulePreview,
    sampleProps: {},
    category: "Functions",
    complexity: "low",
    dependencies: ["TypeScript/JavaScript"]
  },
  'database': {
    component: GenericModulePreview,
    sampleProps: {},
    category: "Database",
    complexity: "high",
    dependencies: ["PostgreSQL", "Prisma/SQL"]
  },
  'tests': {
    component: GenericModulePreview,
    sampleProps: {},
    category: "Testing",
    complexity: "medium",
    dependencies: ["Jest", "Testing Library"]
  },
  
  // Legacy hardcoded mappings for backward compatibility
  'task_header': {
    component: TaskHeader,
    sampleProps: { task: sampleTaskData },
    category: "Display",
    complexity: "medium",
    dependencies: ["@tabler/icons-react", "TaskDetails type"]
  },
  'github_integration': {
    component: GitHubIntegration,
    sampleProps: { metadata: sampleTaskData.metadata, taskId: sampleTaskData.id },
    category: "Integration", 
    complexity: "low",
    dependencies: ["@tabler/icons-react"]
  },
  'task_description': {
    component: TaskDescription,
    sampleProps: { description: sampleTaskData.description },
    category: "Content",
    complexity: "low",
    dependencies: []
  },
  'video_explanation': {
    component: VideoExplanation,
    sampleProps: { 
      loomVideoUrl: sampleTaskData.loom_video_url, 
      transcript: sampleTaskData.transcript 
    },
    category: "Media",
    complexity: "medium",
    dependencies: ["Loom embed API"]
  },
  'requirements_criteria': {
    component: RequirementsAndCriteria,
    sampleProps: { 
      requirements: sampleTaskData.requirements,
      acceptanceCriteria: sampleTaskData.acceptance_criteria,
      taskStatus: sampleTaskData.status
    },
    category: "Planning",
    complexity: "medium",
    dependencies: ["@tabler/icons-react"]
  },
  'environment_variables': {
    component: EnvironmentVariables,
    sampleProps: { environmentVariables: sampleTaskData.environment_variables || {} },
    category: "Configuration",
    complexity: "high",
    dependencies: ["@tabler/icons-react", "clipboard API"]
  },
  'modular_milestones': {
    component: ModularMilestonesSection,
    sampleProps: { 
      milestones: sampleTaskData.milestones,
      taskId: sampleTaskData.id,
      onRefetch: () => {},
      onMediaPreview: () => {}
    },
    category: "Project Management",
    complexity: "high",
    dependencies: ["@tabler/icons-react", "ModuleCard", "MilestoneCard"]
  },
  'media_grid': {
    component: MediaGrid,
    sampleProps: { 
      milestones: sampleTaskData.milestones,
      onMediaPreview: () => {}
    },
    category: "Media",
    complexity: "medium", 
    dependencies: ["MediaPreviewModal"]
  }
};

const MODULE_ICONS: { [key: string]: any } = {
  'function': IconCode,
  'api': IconApi,
  'component': IconComponents,
  'layout': IconLayout,
  'test': IconTestPipe,
  'database': IconDatabase,
  'settings': IconSettings,
  'tool': IconTool,
  'palette': IconPalette,
  'file-text': IconFileText
};

const CATEGORY_ICONS: { [key: string]: any } = {
  'Display': IconLayout,
  'Integration': IconApi,
  'Content': IconFileText,
  'Media': IconPalette,
  'Planning': IconCheck,
  'Configuration': IconSettings,
  'Project Management': IconComponents
};

function ModuleRegistryPage() {
  const searchParams = useSearchParams();
  const [modules, setModules] = useState<RegistryModule[]>([]);
  const [moduleTypes, setModuleTypes] = useState<ModuleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModule, setSelectedModule] = useState<RegistryModule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    usagePurpose: '',
    projectContext: '',
    usageType: 'reference',
    notes: ''
  });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingModule, setRatingModule] = useState<RegistryModule | null>(null);

  // Version and comments state
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [commentCount, setCommentCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'versions' | 'comments'>('preview');

  // Version creator state
  const [showVersionCreator, setShowVersionCreator] = useState(false);
  const [versionModule, setVersionModule] = useState<RegistryModule | null>(null);

  // My Checkouts state
  const [activeSection, setActiveSection] = useState<'browse' | 'my-checkouts'>('browse');
  const [userCheckouts, setUserCheckouts] = useState<any[]>([]);
  const [checkoutsLoading, setCheckoutsLoading] = useState(false);
  const [newlyCheckedOutId, setNewlyCheckedOutId] = useState<string | null>(null);
  const [showCompletedCheckouts, setShowCompletedCheckouts] = useState(false);

  // Handle URL parameters for direct module access from dashboard
  useEffect(() => {
    const moduleIdParam = searchParams.get('module');
    if (moduleIdParam && modules.length > 0) {
      const moduleToOpen = modules.find(module => module.id === moduleIdParam);
      if (moduleToOpen) {
        console.log('🔗 Opening module from URL parameter:', moduleToOpen.name);
        openModuleDetail(moduleToOpen);
        
        // Clean up URL parameter after opening
        const url = new URL(window.location.href);
        url.searchParams.delete('module');
        window.history.replaceState({}, '', url.toString());
      } else {
        console.warn('Module not found with ID:', moduleIdParam);
        toast.error('Module not found');
      }
    }
  }, [searchParams, modules]);

  // Load favorites from database when user is loaded
  useEffect(() => {
    if (currentUser) {
      loadUserFavorites();
      loadUserCheckouts();
    } else {
      setFavorites([]);
      setUserCheckouts([]);
    }
  }, [currentUser]);

  // Load user's favorites from database
  const loadUserFavorites = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/registry/favorite?developerId=${currentUser.id}`);
      const data = await response.json();
      
      if (data.favorites) {
        const favoriteIds = data.favorites.map((fav: any) => fav.module_id);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Load user's checkouts from database
  const loadUserCheckouts = async () => {
    if (!currentUser) return;
    
    setCheckoutsLoading(true);
    try {
      const response = await fetch(`/api/registry/user-checkouts?developerId=${currentUser.id}`);
      const data = await response.json();
      
      if (data.checkouts) {
        setUserCheckouts(data.checkouts);
      }
    } catch (error) {
      console.error('Error loading user checkouts:', error);
    } finally {
      setCheckoutsLoading(false);
    }
  };

  // Load current user session
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.isLoggedIn && data.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.name || '',
            email: data.user.email || ''
          });
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };
    
    loadCurrentUser();
  }, []);

  // Toggle favorites using database API
  const toggleFavorite = async (moduleId: string) => {
    if (!currentUser) {
      toast.error('Please log in to manage favorites');
      return;
    }

    const action = favorites.includes(moduleId) ? 'remove' : 'add';
    
    try {
      const response = await fetch('/api/registry/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          developerId: currentUser.id,
          action
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local favorites state
        const newFavorites = action === 'add'
          ? [...favorites, moduleId]
          : favorites.filter(id => id !== moduleId);
        
        setFavorites(newFavorites);

        // Update the module's favorite count in the modules state
        setModules(prevModules =>
          prevModules.map(module =>
            module.id === moduleId
              ? { ...module, favorite_count: result.favoriteCount || 0 }
              : module
          )
        );

        // Update selected module if it's the one being favorited
        if (selectedModule?.id === moduleId) {
          setSelectedModule(prev => prev ? { ...prev, favorite_count: result.favoriteCount || 0 } : null);
        }

        toast.success(result.message);
      } else {
        toast.error(result.error || 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites');
    }
  };

  // Handle module checkout
  const handleCheckout = (module: RegistryModule) => {
    setSelectedModule(module);
    setCheckoutForm({
      usagePurpose: '',
      projectContext: '',
      usageType: 'reference',
      notes: ''
    });
    setShowCheckoutModal(true);
  };

  // Handle rating modal
  const handleRate = (module: RegistryModule) => {
    setRatingModule(module);
    setShowRatingModal(true);
  };

  // Handle rating submission
  const handleRatingSubmitted = (newRating: number, totalRatings: number) => {
    // Update the module in the local state
    setModules(prevModules => 
      prevModules.map(module => 
        module.id === ratingModule?.id 
          ? { ...module, avg_rating: newRating, total_ratings: totalRatings }
          : module
      )
    );

    // Update selected module if it's the one being rated
    if (selectedModule?.id === ratingModule?.id) {
      setSelectedModule(prev => prev ? { ...prev, avg_rating: newRating, total_ratings: totalRatings } : null);
    }

    setShowRatingModal(false);
    setRatingModule(null);
  };

  // Handle version creation
  const handleCreateVersion = (module: RegistryModule) => {
    setVersionModule(module);
    setShowVersionCreator(true);
  };

  // Handle version created
  const handleVersionCreated = (version: string) => {
    // Update the module's current version
    setModules(prevModules => 
      prevModules.map(module => 
        module.id === versionModule?.id 
          ? { ...module, current_version: version }
          : module
      )
    );

    // Update selected module if it's the one getting versioned
    if (selectedModule?.id === versionModule?.id) {
      setSelectedModule(prev => prev ? { ...prev, current_version: version } : null);
    }

    setShowVersionCreator(false);
    setVersionModule(null);
    
    // Switch to versions tab to show the new version
    setActiveTab('versions');
  };

  const submitCheckout = async () => {
    if (!selectedModule || !checkoutForm.usagePurpose.trim()) {
      toast.error('Please fill in the usage purpose');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to check out modules');
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/registry/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          developerId: currentUser.id, // Use the actual logged in developer ID
          usagePurpose: checkoutForm.usagePurpose,
          projectContext: checkoutForm.projectContext,
          usageType: checkoutForm.usageType,
          notes: checkoutForm.notes,
          version: selectedVersion || null // Include selected version
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Module ${selectedVersion ? `v${selectedVersion}` : ''} checked out successfully!`);
        setShowCheckoutModal(false);
        
        // Store the module ID for highlighting
        setNewlyCheckedOutId(selectedModule.id);
        
        // Refresh data to show updated usage statistics
        loadModules(true);
        
        // Refresh user checkouts to include the new one
        loadUserCheckouts();
        
        // Switch to My Checkouts tab to show the new checkout
        setActiveSection('my-checkouts');
        
        // Show additional success message with next steps
        setTimeout(() => {
          toast.success('💡 Tip: You can now create a new version or view the module details from My Checkouts!', {
            duration: 5000
          });
        }, 1000);
        
        // Clear the highlight after 5 seconds
        setTimeout(() => {
          setNewlyCheckedOutId(null);
        }, 5000);
      } else {
        toast.error(result.error || 'Failed to check out module');
      }
    } catch (error) {
      console.error('Error checking out module:', error);
      toast.error('Failed to check out module');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handle completing a checkout
  const handleCompleteCheckout = async (checkoutId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/registry/checkout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutId,
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Checkout marked as completed!');
        loadUserCheckouts(); // Refresh the checkouts list
      } else {
        toast.error(result.error || 'Failed to complete checkout');
      }
    } catch (error) {
      console.error('Error completing checkout:', error);
      toast.error('Failed to complete checkout');
    }
  };

  // Load module types
  useEffect(() => {
    const loadModuleTypes = async () => {
      try {
        const response = await fetch('/api/module-types');
        const data = await response.json();
        setModuleTypes(data.moduleTypes || []);
      } catch (error) {
        console.error('Error loading module types:', error);
      }
    };
    loadModuleTypes();
  }, []);

  // Load modules from database
  const loadModules = async (reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: reset ? '0' : pagination.offset.toString(),
        sortBy
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('moduleType', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

      const response = await fetch(`/api/registry/modules?${params}`);
      const data = await response.json();

      if (reset) {
        setModules(data.modules || []);
        setPagination(data.pagination || {
          total: 0,
          limit: pagination.limit,
          offset: 0,
          hasMore: false
        });
      } else {
        setModules(prev => [...prev, ...(data.modules || [])]);
        setPagination(data.pagination || {
          total: 0,
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: false
        });
      }

      // Extract unique tags
      const tags = new Set<string>();
      data.modules?.forEach((module: RegistryModule) => {
        module.tags?.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());

    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
      // Set safe defaults on error
      setPagination({
        total: 0,
        limit: pagination.limit,
        offset: 0,
        hasMore: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Load modules on component mount and filter changes
  useEffect(() => {
    loadModules(true);
  }, [searchTerm, selectedType, selectedStatus, selectedTags.join(','), sortBy]);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showDetailModal || showCheckoutModal || showRatingModal || showVersionCreator) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showCheckoutModal, showRatingModal, showVersionCreator]);

  const getModuleIcon = (iconName: string) => {
    return MODULE_ICONS[iconName] || IconCode;
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || IconComponents;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 border-green-700/50 text-green-300';
      case 'in_progress':
        return 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300';
      case 'blocked':
        return 'bg-red-900/30 border-red-700/50 text-red-300';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-300';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-900/30 border-green-700/50 text-green-300';
      case 'medium':
        return 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300';
      case 'high':
        return 'bg-red-900/30 border-red-700/50 text-red-300';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-300';
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard!`);
    });
  };

  const openModuleDetail = (module: RegistryModule) => {
    setSelectedModule(module);
    setActiveTab('preview');
    setSelectedVersion('');
    setCommentCount(0);
    setShowDetailModal(true);
  };

  // Get component mapping for a module
  const getComponentMapping = (module: RegistryModule) => {
    // Try to match by module type name, converting to snake_case
    const moduleTypeKey = module.module_type?.toLowerCase().replace(/\s+/g, '_');
    const mapping = componentMappings[moduleTypeKey] || componentMappings['task_description']; // fallback
    
    // For database modules, pass the actual module data as props
    if (['ui_components', 'api_endpoints', 'functions', 'database', 'tests'].includes(moduleTypeKey)) {
      return {
        ...mapping,
        sampleProps: { module }
      };
    }
    
    return mapping;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <IconArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Component Registry</h1>
                <p className="text-gray-400 mt-1">
                  Discover and reuse modular components across all projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{pagination?.total || 0} modules</span>
              <span>•</span>
              <span>{moduleTypes.length} types</span>
              <span>•</span>
              <span>{allTags.length} tags</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search modules, tags, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <IconGrid3x3 size={16} />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <IconList size={16} />
                List
              </button>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="alphabetical">Alphabetical</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-2 border ${
                  showFilters 
                    ? 'bg-purple-600 text-white border-purple-600' 
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <IconFilter size={16} />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
              {/* Module Type */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Module Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Types</option>
                  {moduleTypes.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {allTags.slice(0, 15).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      <IconTag size={10} />
                      {tag}
                    </button>
                  ))}
                  {allTags.length > 15 && (
                    <span className="px-2 py-1 text-xs text-gray-400">
                      +{allTags.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveSection('browse')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'browse'
                ? 'text-white border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Browse All Modules
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveSection('my-checkouts')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === 'my-checkouts'
                  ? 'text-white border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Checkouts ({userCheckouts.length})
            </button>
          )}
        </div>

        {/* My Checkouts Section */}
        {activeSection === 'my-checkouts' && currentUser && (
          <div className="mb-6">
            {/* Checkout Filter */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-400">Show:</span>
              <button
                onClick={() => setShowCompletedCheckouts(false)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  !showCompletedCheckouts 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setShowCompletedCheckouts(true)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  showCompletedCheckouts 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All Checkouts
              </button>
            </div>
            {checkoutsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your checkouts...</p>
              </div>
                        ) : (() => {
              const filteredCheckouts = userCheckouts
                .filter(checkout => showCompletedCheckouts || checkout.checkout_status !== 'completed');
              
              if (filteredCheckouts.length === 0) {
                return (
                  <div className="text-center py-12">
                    <IconDownload size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {showCompletedCheckouts ? 'No checkouts found' : 'No active checkouts'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {showCompletedCheckouts 
                        ? 'Check out modules to modify them and create new versions'
                        : 'Check out modules to get started, or view completed checkouts'
                      }
                    </p>
                    <button
                      onClick={() => setActiveSection('browse')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Browse Modules
                    </button>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {filteredCheckouts.map((checkout) => {
                    const isNewlyCheckedOut = newlyCheckedOutId === checkout.id;
                    
                    return (
                      <div
                        key={checkout.id}
                        className={`bg-gray-800 border rounded-lg p-6 transition-all duration-500 ${
                          isNewlyCheckedOut 
                            ? 'border-green-500 bg-green-900/20 shadow-lg shadow-green-500/20' 
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Module Icon and Info */}
                            <div className="flex items-center gap-3">
                              {(() => {
                                const ModuleIcon = getModuleIcon(checkout.module_icon);
                                return <ModuleIcon size={32} style={{ color: checkout.module_color }} />;
                              })()}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-white text-lg">{checkout.name}</h3>
                                  {isNewlyCheckedOut && (
                                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full animate-pulse">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400">{checkout.module_type}</p>
                              </div>
                            </div>

                            {/* Checkout Details */}
                            <div className="flex-1 min-w-0">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Purpose:</span>
                                  <p className="text-white truncate">{checkout.usage_purpose}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Version:</span>
                                  <p className="text-white">
                                    {checkout.checked_out_version || checkout.current_version || 'Latest'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Checked out:</span>
                                  <p className="text-white">
                                    {formatRelativeWithCST(checkout.checked_out_at).relative}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Status:</span>
                                  <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                                    checkout.checkout_status === 'completed' 
                                      ? 'bg-green-900/30 text-green-300' 
                                      : 'bg-blue-900/30 text-blue-300'
                                  }`}>
                                    {checkout.checkout_status === 'completed' ? 'Completed' : 'Active'}
                                  </span>
                                </div>
                              </div>
                              {checkout.project_context && (
                                <div className="mt-2 text-sm">
                                  <span className="text-gray-400">Project:</span>
                                  <span className="text-white ml-1">{checkout.project_context}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 ml-4">
                            <button
                              onClick={() => openModuleDetail(checkout as RegistryModule)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center gap-2"
                            >
                              <IconEye size={16} />
                              View
                            </button>
                            <button
                              onClick={() => handleCreateVersion(checkout as RegistryModule)}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-2"
                            >
                              <IconGitBranch size={16} />
                              Create Version
                            </button>
                            {checkout.checkout_status === 'active' && (
                              <button
                                onClick={() => handleCompleteCheckout(checkout.id)}
                                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors flex items-center gap-2"
                                title="Mark as completed"
                              >
                                <IconCheck size={16} />
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Module Grid */}
        {activeSection === 'browse' && (
          <>
            {loading && modules.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading modules...</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-12">
                <IconDatabase size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No modules found</h3>
                <p className="text-gray-400">Try adjusting your search criteria or filters</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                  {modules.map((module) => {
                    const ModuleIcon = getModuleIcon(module.module_icon);
                    const componentMapping = getComponentMapping(module);
                    
                    if (viewMode === 'list') {
                      return (
                        <div
                          key={module.id}
                          className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${getStatusColor(module.status)}`}
                          style={{ borderLeft: `4px solid ${module.module_color}` }}
                          onClick={() => openModuleDetail(module)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Icon and Type */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <ModuleIcon size={24} style={{ color: module.module_color }} />
                                <span className="text-xs bg-gray-700/50 px-2 py-1 rounded">
                                  {module.module_type}
                                </span>
                              </div>
                              
                              {/* Module Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-white text-sm truncate">{module.name}</h3>
                                  <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(componentMapping.complexity)}`}>
                                    {componentMapping.complexity}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate mb-1">
                                  {module.description || 'No description'}
                                </p>
                                {/* Creator info in list view */}
                                {module.creator_name && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {module.creator_profile_picture ? (
                                      <img
                                        src={module.creator_profile_picture}
                                        alt={module.creator_name}
                                        className="w-4 h-4 rounded-full object-cover"
                                        onError={(e) => {
                                          // Fallback to initials if image fails to load
                                          e.currentTarget.style.display = 'none';
                                          const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (nextEl) nextEl.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className={`w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium ${module.creator_profile_picture ? 'hidden' : 'flex'}`}
                                    >
                                      {module.creator_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>by {module.creator_name}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Stats */}
                              <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                                {(module.total_checkouts || 0) > 0 && (
                                  <span className="flex items-center gap-1">
                                    <IconDownload size={12} />
                                    {module.total_checkouts}
                                  </span>
                                )}
                                {module.popularity_score > 0 && (
                                  <span className="flex items-center gap-1">
                                    <IconTrendingUp size={12} />
                                    {module.popularity_score}
                                  </span>
                                )}
                                <div className="text-right">
                                  <div className="text-gray-300">{formatRelativeWithCST(module.updated_at).relative}</div>
                                  <div className="text-gray-500 text-xs">{formatRelativeWithCST(module.updated_at).cst}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(module.id);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  favorites.includes(module.id)
                                    ? 'text-red-400 hover:text-red-300'
                                    : 'text-gray-500 hover:text-red-400'
                                }`}
                                title={favorites.includes(module.id) ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <IconHeart size={16} fill={favorites.includes(module.id) ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRate(module);
                                }}
                                className="p-1 text-gray-500 hover:text-yellow-400 transition-colors"
                                title="Rate this module"
                              >
                                <IconStar size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckout(module);
                                }}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors flex items-center gap-1"
                              >
                                <IconDownload size={12} />
                                Checkout
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Grid view (existing code with creator info added)
                    return (
                      <div
                        key={module.id}
                        className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${getStatusColor(module.status)}`}
                        style={{ borderLeft: `4px solid ${module.module_color}` }}
                        onClick={() => openModuleDetail(module)}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <ModuleIcon size={20} style={{ color: module.module_color }} />
                            <span className="text-xs bg-gray-700/50 px-2 py-1 rounded">
                              {module.module_type}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(module.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              favorites.includes(module.id)
                                ? 'text-red-400 hover:text-red-300'
                                : 'text-gray-500 hover:text-red-400'
                            }`}
                            title={favorites.includes(module.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <IconHeart size={16} fill={favorites.includes(module.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        {/* Module Name & Description */}
                        <h3 className="font-medium text-white text-sm mb-2 line-clamp-2">
                          {module.name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                          {module.description || 'No description'}
                        </p>

                        {/* Creator info in grid view */}
                        {module.creator_name && (
                          <div className="flex items-center gap-2 mb-3">
                            {module.creator_profile_picture ? (
                              <img
                                src={module.creator_profile_picture}
                                alt={module.creator_name}
                                className="w-5 h-5 rounded-full object-cover"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextEl) nextEl.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium ${module.creator_profile_picture ? 'hidden' : 'flex'}`}
                            >
                              {module.creator_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500">by {module.creator_name}</span>
                          </div>
                        )}

                        {/* Project Context */}
                        <div className="text-xs text-purple-300 mb-3 line-clamp-1">
                          From: {module.task_title}
                        </div>

                        {/* Complexity */}
                        <div className="mb-3">
                          <span className={`px-2 py-1 rounded text-xs ${getComplexityColor(componentMapping.complexity)}`}>
                            {componentMapping.complexity} complexity
                          </span>
                        </div>

                        {/* Tags */}
                        {module.tags && module.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {module.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {module.tags.length > 2 && (
                              <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
                                +{module.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Rating */}
                        {(module.avg_rating && module.avg_rating > 0) && (
                          <div className="mb-3">
                            <StarRating 
                              rating={module.avg_rating} 
                              readonly 
                              size={12}
                              showText
                              totalRatings={module.total_ratings}
                              className="text-gray-400"
                            />
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            {(module.total_checkouts || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <IconDownload size={12} />
                                {module.total_checkouts}
                              </span>
                            )}
                            {module.popularity_score > 0 && (
                              <span className="flex items-center gap-1">
                                <IconTrendingUp size={12} />
                                {module.popularity_score}
                              </span>
                            )}
                            {module.relationships_count > 0 && (
                              <span className="flex items-center gap-1">
                                <IconNetwork size={12} />
                                {module.relationships_count}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-gray-300">{formatRelativeWithCST(module.updated_at).relative}</div>
                            <div className="text-gray-500 text-xs">{formatRelativeWithCST(module.updated_at).cst}</div>
                          </div>
                        </div>

                        {/* Boolean Checks Indicator */}
                        {(module.pre_conditions_count > 0 || module.post_conditions_count > 0) && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
                            <IconCheck size={12} />
                            <span>
                              {module.pre_conditions_count + module.post_conditions_count} checks
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                {pagination?.hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => {
                        setPagination(prev => ({
                          ...prev,
                          offset: (prev?.offset || 0) + (prev?.limit || 20)
                        }));
                        loadModules(false);
                      }}
                      disabled={loading}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Module Detail Modal */}
      {showDetailModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const ModuleIcon = getModuleIcon(selectedModule.module_icon);
                  return <ModuleIcon size={24} style={{ color: selectedModule.module_color }} />;
                })()}
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedModule.name}</h2>
                  <p className="text-sm text-gray-400">{selectedModule.module_type} • {getComponentMapping(selectedModule).complexity} complexity</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCheckout(selectedModule);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <IconDownload size={16} />
                  Check Out
                </button>
                <button
                  onClick={() => handleCreateVersion(selectedModule)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <IconGitBranch size={16} />
                  Create Version
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <IconX size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Module Info Sidebar */}
              <div className="lg:w-80 border-r border-gray-700 flex-shrink-0">
                <div className="h-full overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Creator Information */}
                    {selectedModule.creator_name && (
                      <div>
                        <h3 className="text-md font-medium text-white mb-2">Creator</h3>
                        <div className="flex items-center gap-2">
                          {selectedModule.creator_profile_picture ? (
                            <img
                              src={selectedModule.creator_profile_picture}
                              alt={selectedModule.creator_name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                e.currentTarget.style.display = 'none';
                                const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextEl) nextEl.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium ${selectedModule.creator_profile_picture ? 'hidden' : 'flex'}`}
                          >
                            {selectedModule.creator_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-white">{selectedModule.creator_name}</div>
                            <div className="text-xs text-gray-400">{selectedModule.creator_email}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Usage Statistics */}
                    <div>
                      <h3 className="text-md font-medium text-white mb-2">Usage Statistics</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-400">{selectedModule.total_checkouts || 0}</div>
                          <div className="text-xs text-gray-400">Total Checkouts</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-green-400">{selectedModule.unique_users || 0}</div>
                          <div className="text-xs text-gray-400">Unique Users</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-yellow-400">{selectedModule.avg_rating || 0}</div>
                          <div className="text-xs text-gray-400">Avg Rating</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-purple-400">{selectedModule.favorite_count || 0}</div>
                          <div className="text-xs text-gray-400">Favorites</div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-md font-medium text-white mb-2">Description</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {selectedModule.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Rating Section */}
                    <div>
                      <h3 className="text-md font-medium text-white mb-2">Rating</h3>
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        {(selectedModule.avg_rating && selectedModule.avg_rating > 0) ? (
                          <div className="space-y-2">
                            <StarRating 
                              rating={selectedModule.avg_rating} 
                              readonly 
                              size={16}
                              showText
                              totalRatings={selectedModule.total_ratings}
                              className="text-gray-300"
                            />
                            <button
                              onClick={() => handleRate(selectedModule)}
                              className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <IconStar size={16} />
                              Rate This Module
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-gray-400 text-sm mb-2">No ratings yet</p>
                            <button
                              onClick={() => handleRate(selectedModule)}
                              className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <IconStar size={16} />
                              Be the First to Rate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project Context */}
                    <div>
                      <h3 className="text-md font-medium text-white mb-2">Project Context</h3>
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-sm text-purple-300 font-medium">{selectedModule.task_title}</div>
                        <div className="text-xs text-gray-400 mt-1">{selectedModule.task_description}</div>
                        {selectedModule.original_task_context && (
                          <div className="text-xs text-gray-500 mt-2">{selectedModule.original_task_context}</div>
                        )}
                      </div>
                    </div>
                  
                    {/* Implementation */}
                    <div>
                      <h3 className="text-md font-medium text-white mb-2">Implementation</h3>
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <IconCode size={16} className="text-green-400" />
                          <span className="text-green-400 font-mono text-xs">{selectedModule.file_path || 'No file path'}</span>
                          <button
                            onClick={() => copyToClipboard(selectedModule.file_path || '', 'File path')}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <IconCopy size={14} />
                          </button>
                        </div>
                        {selectedModule.url && (
                          <div className="flex items-center gap-2 text-sm mt-2">
                            <IconExternalLink size={16} className="text-blue-400" />
                            <a 
                              href={selectedModule.url.startsWith('http') ? selectedModule.url : `https://${selectedModule.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs break-all"
                            >
                              View Source
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedModule.tags && selectedModule.tags.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium text-white mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedModule.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs flex items-center gap-1"
                            >
                              <IconTag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dependencies */}
                    <div>
                      <h3 className="text-md font-medium text-white mb-2">Dependencies</h3>
                      <div className="space-y-1">
                        {getComponentMapping(selectedModule).dependencies.map((dep, index) => (
                          <code key={index} className="block text-xs text-green-400 bg-gray-900/50 p-2 rounded">
                            {dep}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="h-full overflow-y-auto p-6">
                  <div className="h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4 flex-shrink-0">Module Details</h3>
                    
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-700 mb-6 flex-shrink-0">
                      <button 
                        onClick={() => setActiveTab('preview')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === 'preview' 
                            ? 'text-purple-400 border-b-2 border-purple-400' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => setActiveTab('versions')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === 'versions' 
                            ? 'text-purple-400 border-b-2 border-purple-400' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Versions
                      </button>
                      <button 
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === 'comments' 
                            ? 'text-purple-400 border-b-2 border-purple-400' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Comments ({commentCount})
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 min-h-0">
                      {activeTab === 'preview' && (
                        <div className="h-full bg-gray-900/50 rounded-lg border border-gray-600 flex flex-col">
                          <div className="p-6 flex-shrink-0">
                            <p className="text-gray-400 text-sm mb-4">Interactive preview of the component with sample data</p>
                          </div>
                          <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <div className="bg-white rounded-lg p-6 min-h-64">
                              {(() => {
                                const componentMapping = getComponentMapping(selectedModule);
                                const Component = componentMapping.component;
                                
                                try {
                                  return <Component {...componentMapping.sampleProps} />;
                                } catch (error) {
                                  return (
                                    <div className="text-gray-600 text-center py-8">
                                      <IconCode size={48} className="mx-auto mb-2" />
                                      <p>Preview not available</p>
                                      <p className="text-sm">Component: {selectedModule.name}</p>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                            
                            <div className="mt-4 text-xs text-gray-500 flex-shrink-0">
                              <p><strong>Category:</strong> {getComponentMapping(selectedModule).category}</p>
                              <p><strong>Complexity:</strong> {getComponentMapping(selectedModule).complexity}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'versions' && (
                        <div className="h-full overflow-y-auto">
                          <VersionSelector
                            moduleId={selectedModule.id}
                            currentVersion={selectedVersion}
                            onVersionSelect={setSelectedVersion}
                            onCheckout={(version) => {
                              setSelectedVersion(version);
                              setShowDetailModal(false);
                              handleCheckout(selectedModule);
                            }}
                          />
                        </div>
                      )}

                      {activeTab === 'comments' && (
                        <div className="h-full overflow-y-auto">
                          <CommentsSection
                            moduleId={selectedModule.id}
                            version={selectedVersion}
                            currentUser={currentUser}
                            onCommentAdded={setCommentCount}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <IconDownload size={24} className="text-purple-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Check Out Module</h2>
                  <p className="text-sm text-gray-400">{selectedModule.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <IconX size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <IconAlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-yellow-300 font-medium mb-1">Library Checkout System</p>
                      <p className="text-yellow-200">
                        By checking out this module, you're letting others know you're using it and for what purpose. 
                        This helps track module usage and identify popular components across projects.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current User Info */}
                {currentUser && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <p className="text-blue-300 font-medium">Checking out as:</p>
                        <p className="text-blue-200">{currentUser.name} ({currentUser.email})</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Usage Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      What are you using this module for? *
                    </label>
                    <textarea
                      value={checkoutForm.usagePurpose}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, usagePurpose: e.target.value }))}
                      placeholder="e.g., Building a user authentication system for my project"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Version Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Select Version
                    </label>
                    <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <VersionSelector
                        moduleId={selectedModule.id}
                        currentVersion={selectedVersion}
                        onVersionSelect={setSelectedVersion}
                        showStats={false}
                      />
                    </div>
                  </div>

                  {/* Project Context */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Project/Task Context
                    </label>
                    <input
                      type="text"
                      value={checkoutForm.projectContext}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, projectContext: e.target.value }))}
                      placeholder="e.g., E-commerce Dashboard, User Management System"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Usage Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Usage Type
                    </label>
                    <select
                      value={checkoutForm.usageType}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, usageType: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="reference">Reference - Learning/studying the code</option>
                      <option value="fork">Fork - Copying and modifying for my needs</option>
                      <option value="integrate">Integrate - Using as-is in my project</option>
                      <option value="study">Study - Understanding implementation patterns</option>
                    </select>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional context or notes about your usage"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitCheckout}
                disabled={!checkoutForm.usagePurpose.trim() || isCheckingOut}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Checking Out...
                  </>
                ) : (
                  <>
                    <IconDownload size={16} />
                    Check Out Module
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingModule && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          module={{
            id: ratingModule.id,
            name: ratingModule.name,
            module_type: ratingModule.module_type
          }}
          currentUser={currentUser}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Version Creator Modal */}
      {showVersionCreator && versionModule && (
        <VersionCreator
          isOpen={showVersionCreator}
          onClose={() => setShowVersionCreator(false)}
          module={{
            id: versionModule.id,
            name: versionModule.name,
            current_version: versionModule.current_version
          }}
          currentUser={currentUser}
          onVersionCreated={handleVersionCreated}
        />
      )}
    </div>
  );
} 

// Loading component for Suspense fallback
function RegistryLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Module Registry...</p>
      </div>
    </div>
  );
}

// Wrapper component with Suspense for Next.js 14 compatibility
export default function ModuleRegistryPageWrapper() {
  return (
    <Suspense fallback={<RegistryLoading />}>
      <ModuleRegistryPage />
    </Suspense>
  );
} 
