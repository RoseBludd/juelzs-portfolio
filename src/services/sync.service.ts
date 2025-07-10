import PortfolioService from './portfolio.service';

export interface SyncConfig {
  intervalMinutes: number;
  enableAutoSync: boolean;
  syncOnLoad: boolean;
}

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  githubProjects: number;
  s3Meetings: number;
  errors: string[];
  duration: number;
}

class SyncService {
  private static instance: SyncService;
  private portfolioService: PortfolioService;
  private syncInterval: NodeJS.Timeout | null = null;
  private config: SyncConfig;
  private lastSyncResult: SyncResult | null = null;

  private constructor() {
    this.portfolioService = PortfolioService.getInstance();
    this.config = {
      intervalMinutes: 30, // Sync every 30 minutes
      enableAutoSync: true,
      syncOnLoad: true
    };
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    console.log('Initializing sync service...');
    
    // Sync on load if enabled
    if (this.config.syncOnLoad) {
      await this.performSync();
    }

    // Start automatic sync if enabled
    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Start automatic syncing
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    
    this.syncInterval = setInterval(async () => {
      console.log('Performing scheduled sync...');
      await this.performSync();
    }, intervalMs);

    console.log(`Auto-sync started with ${this.config.intervalMinutes}-minute interval`);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Perform a sync operation
   */
  async performSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const timestamp = new Date();
    
    try {
      console.log('Starting sync operation...');
      
      // Perform the sync
      const syncStatus = await this.portfolioService.syncExternalData();
      
      const duration = Date.now() - startTime;
      
      this.lastSyncResult = {
        success: syncStatus.errors.length === 0,
        timestamp,
        githubProjects: syncStatus.githubProjects,
        s3Meetings: syncStatus.s3Meetings,
        errors: syncStatus.errors,
        duration
      };

      if (this.lastSyncResult.success) {
        console.log(`Sync completed successfully in ${duration}ms`);
        console.log(`- GitHub projects: ${syncStatus.githubProjects}`);
        console.log(`- S3 meetings: ${syncStatus.s3Meetings}`);
      } else {
        console.warn('Sync completed with errors:', syncStatus.errors);
      }

      return this.lastSyncResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.lastSyncResult = {
        success: false,
        timestamp,
        githubProjects: 0,
        s3Meetings: 0,
        errors: [errorMessage],
        duration
      };

      console.error('Sync failed:', error);
      return this.lastSyncResult;
    }
  }

  /**
   * Force a manual sync
   */
  async forceSync(): Promise<SyncResult> {
    console.log('Forcing manual sync...');
    return await this.performSync();
  }

  /**
   * Get the last sync result
   */
  getLastSyncResult(): SyncResult | null {
    return this.lastSyncResult;
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto-sync if interval changed
    if (newConfig.intervalMinutes !== undefined && this.config.enableAutoSync) {
      this.startAutoSync();
    }
    
    // Start/stop auto-sync based on enableAutoSync
    if (newConfig.enableAutoSync !== undefined) {
      if (newConfig.enableAutoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Check if sync is due (based on last sync time and interval)
   */
  isSyncDue(): boolean {
    if (!this.lastSyncResult) return true;
    
    const now = Date.now();
    const lastSync = this.lastSyncResult.timestamp.getTime();
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    
    return (now - lastSync) >= intervalMs;
  }

  /**
   * Get sync status information
   */
  getSyncStatus(): {
    isAutoSyncEnabled: boolean;
    lastSync: Date | null;
    nextSync: Date | null;
    isSyncDue: boolean;
    intervalMinutes: number;
  } {
    let nextSync: Date | null = null;
    
    if (this.config.enableAutoSync && this.lastSyncResult) {
      const nextSyncTime = this.lastSyncResult.timestamp.getTime() + 
                          (this.config.intervalMinutes * 60 * 1000);
      nextSync = new Date(nextSyncTime);
    }

    return {
      isAutoSyncEnabled: this.config.enableAutoSync,
      lastSync: this.lastSyncResult?.timestamp || null,
      nextSync,
      isSyncDue: this.isSyncDue(),
      intervalMinutes: this.config.intervalMinutes
    };
  }

  /**
   * Cleanup when shutting down
   */
  shutdown(): void {
    this.stopAutoSync();
    console.log('Sync service shut down');
  }
}

export default SyncService; 