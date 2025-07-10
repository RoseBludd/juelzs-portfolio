import SyncService from './sync.service';
import PortfolioService from './portfolio.service';

export interface InitConfig {
  environment: 'development' | 'production' | 'test';
  enableSync: boolean;
  syncInterval: number;
  connectionPoolSize: number;
}

class InitService {
  private static instance: InitService;
  private config: InitConfig;
  private syncService: SyncService;
  private portfolioService: PortfolioService;
  private initialized = false;

  private constructor() {
    this.config = {
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      enableSync: true,
      syncInterval: process.env.NODE_ENV === 'development' ? 30 : 15, // 30 min dev, 15 min prod
      connectionPoolSize: process.env.NODE_ENV === 'development' ? 1 : 10 // Singleton in dev, pool in prod
    };
    
    this.syncService = SyncService.getInstance();
    this.portfolioService = PortfolioService.getInstance();
  }

  public static getInstance(): InitService {
    if (!InitService.instance) {
      InitService.instance = new InitService();
    }
    return InitService.instance;
  }

  /**
   * Initialize the entire application
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Application already initialized');
      return;
    }

    console.log(`Initializing application in ${this.config.environment} mode...`);
    
    try {
      // Configure sync service based on environment
      this.syncService.updateConfig({
        intervalMinutes: this.config.syncInterval,
        enableAutoSync: this.config.enableSync,
        syncOnLoad: true
      });

      // Initialize sync service
      await this.syncService.initialize();

      // Set up environment-specific configurations
      await this.setupEnvironmentConfig();

      this.initialized = true;
      console.log('Application initialized successfully');
      
      // Log initial sync status
      const syncStatus = this.syncService.getSyncStatus();
      console.log('Sync status:', syncStatus);
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Setup environment-specific configurations
   */
  private async setupEnvironmentConfig(): Promise<void> {
    console.log(`Setting up ${this.config.environment} configuration...`);
    
    switch (this.config.environment) {
      case 'development':
        // Development specific setup
        console.log('Development mode: Using singleton connections');
        // Add any dev-specific configuration here
        break;
        
      case 'production':
        // Production specific setup
        console.log('Production mode: Using connection pooling');
        // Add any prod-specific configuration here
        break;
        
      case 'test':
        // Test specific setup
        console.log('Test mode: Disabling auto-sync');
        this.syncService.updateConfig({ enableAutoSync: false });
        break;
    }
  }

  /**
   * Get application status
   */
  getStatus(): {
    initialized: boolean;
    environment: string;
    config: InitConfig;
    syncStatus: ReturnType<SyncService['getSyncStatus']>;
    portfolioStatus: ReturnType<PortfolioService['getSyncStatus']>;
  } {
    return {
      initialized: this.initialized,
      environment: this.config.environment,
      config: this.config,
      syncStatus: this.syncService.getSyncStatus(),
      portfolioStatus: this.portfolioService.getSyncStatus()
    };
  }

  /**
   * Manually trigger data sync
   */
  async triggerSync(): Promise<void> {
    console.log('Manually triggering sync...');
    await this.syncService.forceSync();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<InitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sync service if sync-related config changed
    if (newConfig.enableSync !== undefined || newConfig.syncInterval !== undefined) {
      this.syncService.updateConfig({
        enableAutoSync: newConfig.enableSync,
        intervalMinutes: newConfig.syncInterval
      });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down application...');
    
    this.syncService.shutdown();
    
    this.initialized = false;
    console.log('Application shutdown complete');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    lastSync: Date | null;
    errors: string[];
  }> {
    const checks = {
      initialized: this.initialized,
      syncService: this.syncService.getLastSyncResult()?.success || false,
      envConfigured: process.env.AWS_ACCESS_KEY_ID !== undefined && 
                     process.env.GITHUB_TOKEN !== undefined
    };

    const lastSyncResult = this.syncService.getLastSyncResult();
    const allChecksPass = Object.values(checks).every(check => check === true);

    return {
      status: allChecksPass ? 'healthy' : 'unhealthy',
      checks,
      lastSync: lastSyncResult?.timestamp || null,
      errors: lastSyncResult?.errors || []
    };
  }
}

export default InitService; 