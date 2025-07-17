/**
 * Project View Configuration Service
 * Manages different views for project showcases (Admin, Developer, Mobile, etc.)
 */

export interface ProjectView {
  id: string;
  label: string;
  icon: string;
  description?: string;
  categories: string[];
  isDefault?: boolean;
}

export interface ProjectViewConfig {
  projectId: string;
  views: ProjectView[];
  defaultView?: string;
  customViews?: ProjectView[];
}

class ProjectViewConfigService {
  private static instance: ProjectViewConfigService;
  private configs: Map<string, ProjectViewConfig> = new Map();

  private constructor() {}

  static getInstance(): ProjectViewConfigService {
    if (!ProjectViewConfigService.instance) {
      ProjectViewConfigService.instance = new ProjectViewConfigService();
    }
    return ProjectViewConfigService.instance;
  }

  /**
   * Default view templates for common project types
   */
  private getDefaultViews(): ProjectView[] {
    return [
      {
        id: 'all',
        label: 'All Views',
        icon: '👁️',
        description: 'Show all photos from every view',
        categories: [], // Empty means all categories
        isDefault: true
      },
      {
        id: 'admin',
        label: 'Admin View',
        icon: '⚙️',
        description: 'Administrative interface and management screens',
        categories: ['screenshot', 'interface', 'dashboard']
      },
      {
        id: 'developer',
        label: 'Developer View',
        icon: '💻',
        description: 'Technical architecture and system diagrams',
        categories: ['diagram', 'analytics', 'architecture']
      },
      {
        id: 'mobile',
        label: 'Mobile View',
        icon: '📱',
        description: 'Mobile app interfaces and responsive design',
        categories: ['mobile', 'responsive']
      },
      {
        id: 'demo',
        label: 'Demo View',
        icon: '🎬',
        description: 'Live demonstrations and user interactions',
        categories: ['demo', 'workflow']
      },
      {
        id: 'api',
        label: 'API View',
        icon: '🔌',
        description: 'API documentation and integration examples',
        categories: ['api', 'integration', 'docs']
      }
    ];
  }

  /**
   * Get views for a specific project
   */
  getProjectViews(projectId: string, availableCategories: string[]): ProjectView[] {
    const config = this.configs.get(projectId);
    let views = config?.views || this.getDefaultViews();

    // Add any custom views from config
    if (config?.customViews) {
      views = [...views, ...config.customViews];
    }

    // Filter views to only show those with available photos
    return views.filter(view => {
      if (view.id === 'all') return true;
      
      // Check if any of the view's categories have photos
      return view.categories.some(category => 
        availableCategories.includes(category)
      );
    });
  }

  /**
   * Add a custom view for a project
   */
  addCustomView(projectId: string, view: Omit<ProjectView, 'id'>): void {
    const config = this.configs.get(projectId) || {
      projectId,
      views: this.getDefaultViews(),
      customViews: []
    };

    const customView: ProjectView = {
      ...view,
      id: `custom_${Date.now()}_${view.label.toLowerCase().replace(/\s+/g, '_')}`
    };

    config.customViews = config.customViews || [];
    config.customViews.push(customView);
    this.configs.set(projectId, config);
  }

  /**
   * Update project view configuration
   */
  updateProjectConfig(projectId: string, updates: Partial<ProjectViewConfig>): void {
    const existing = this.configs.get(projectId) || {
      projectId,
      views: this.getDefaultViews()
    };

    this.configs.set(projectId, { ...existing, ...updates });
  }

  /**
   * Get specific project view configurations for popular project types
   */
  getProjectTypeViews(projectType: 'webapp' | 'mobile' | 'api' | 'dashboard' | 'ecommerce'): ProjectView[] {
    const baseViews = this.getDefaultViews();

    switch (projectType) {
      case 'webapp':
        return [
          ...baseViews,
          {
            id: 'frontend',
            label: 'Frontend',
            icon: '🎨',
            description: 'User interface and frontend components',
            categories: ['interface', 'frontend', 'ui']
          },
          {
            id: 'backend',
            label: 'Backend',
            icon: '🗄️',
            description: 'Server-side architecture and database views',
            categories: ['backend', 'database', 'server']
          }
        ];

      case 'mobile':
        return [
          ...baseViews.filter(v => ['all', 'mobile'].includes(v.id)),
          {
            id: 'ios',
            label: 'iOS View',
            icon: '📱',
            description: 'iOS-specific interface screenshots',
            categories: ['ios', 'mobile']
          },
          {
            id: 'android',
            label: 'Android View',
            icon: '🤖',
            description: 'Android-specific interface screenshots',
            categories: ['android', 'mobile']
          }
        ];

      case 'dashboard':
        return [
          ...baseViews,
          {
            id: 'analytics',
            label: 'Analytics',
            icon: '📊',
            description: 'Data visualization and analytics screens',
            categories: ['analytics', 'charts', 'reports']
          },
          {
            id: 'users',
            label: 'User Management',
            icon: '👥',
            description: 'User administration and management features',
            categories: ['users', 'admin', 'management']
          }
        ];

      case 'ecommerce':
        return [
          ...baseViews,
          {
            id: 'storefront',
            label: 'Storefront',
            icon: '🏪',
            description: 'Customer-facing store interface',
            categories: ['storefront', 'products', 'shop']
          },
          {
            id: 'checkout',
            label: 'Checkout Flow',
            icon: '💳',
            description: 'Payment and checkout process',
            categories: ['checkout', 'payment', 'cart']
          }
        ];

      default:
        return baseViews;
    }
  }

  /**
   * Get the default view for a project
   */
  getDefaultView(projectId: string): string {
    const config = this.configs.get(projectId);
    return config?.defaultView || 'all';
  }

  /**
   * Set the default view for a project
   */
  setDefaultView(projectId: string, viewId: string): void {
    this.updateProjectConfig(projectId, { defaultView: viewId });
  }
}

export default ProjectViewConfigService; 