import CalendarService from './calendar.service';
import CADISJournalService from './cadis-journal.service';
import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'self_review' | 'cadis_maintenance' | 'notification';
  schedule: string; // cron-like schedule
  nextRun: Date;
  lastRun?: Date;
  status: 'active' | 'paused' | 'completed';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  createdAt: Date;
}

class ScheduledTasksService {
  private static instance: ScheduledTasksService;
  private dbService: DatabaseService;
  private calendarService: CalendarService;
  private cadisService: CADISJournalService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.calendarService = CalendarService.getInstance();
    this.cadisService = CADISJournalService.getInstance();
  }

  public static getInstance(): ScheduledTasksService {
    if (!ScheduledTasksService.instance) {
      ScheduledTasksService.instance = new ScheduledTasksService();
    }
    return ScheduledTasksService.instance;
  }

  /**
   * Initialize the scheduled tasks service
   */
  async initialize(): Promise<void> {
    try {
      await this.createTablesIfNotExists();
      await this.setupDefaultTasks();
      console.log('📋 Scheduled Tasks Service initialized');
    } catch (error) {
      console.error('❌ Scheduled Tasks Service initialization failed:', error);
    }
  }

  /**
   * Setup default scheduled tasks
   */
  async setupDefaultTasks(): Promise<void> {
    try {
      // Setup biweekly self-reviews starting 8/19/25
      const firstReviewDate = new Date('2025-08-19T09:00:00Z');
      await this.createBiweeklyReviews(firstReviewDate);

      // Setup CADIS maintenance tasks (Tuesday and Friday)
      await this.createCADISMaintenanceTasks();

      console.log('✅ Default scheduled tasks created');
    } catch (error) {
      console.error('Error setting up default tasks:', error);
    }
  }

  /**
   * Create biweekly self-review tasks starting from a specific date
   */
  async createBiweeklyReviews(startDate: Date): Promise<void> {
    try {
      const client = await this.getClient();
      
      try {
        // Create 12 biweekly reviews (6 months worth)
        for (let i = 0; i < 12; i++) {
          const reviewDate = new Date(startDate);
          reviewDate.setDate(startDate.getDate() + (i * 14)); // Every 2 weeks

          const endDate = new Date(reviewDate);
          endDate.setDate(reviewDate.getDate() + 13); // 2-week period

          const taskId = `biweekly_review_${reviewDate.toISOString().split('T')[0]}`;
          
          // Check if task already exists
          const existing = await client.query(
            'SELECT id FROM scheduled_tasks WHERE id = $1',
            [taskId]
          );

          if (existing.rows.length === 0) {
            await client.query(`
              INSERT INTO scheduled_tasks (
                id, name, type, schedule, next_run, status, metadata, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              taskId,
              `Biweekly Self Review - ${reviewDate.toLocaleDateString()}`,
              'self_review',
              'biweekly',
              reviewDate,
              'active',
              JSON.stringify({
                reviewPeriod: {
                  start: reviewDate.toISOString(),
                  end: endDate.toISOString()
                },
                scope: {
                  includeJournal: true,
                  includeRepositories: true,
                  includeMeetings: true,
                  includeCADIS: true,
                  includeProjects: true
                }
              }),
              new Date(),
              new Date()
            ]);

            console.log(`📅 Created biweekly review task for ${reviewDate.toLocaleDateString()}`);
          }
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating biweekly reviews:', error);
    }
  }

  /**
   * Create CADIS maintenance tasks (Tuesday and Friday)
   */
  async createCADISMaintenanceTasks(): Promise<void> {
    try {
      const client = await this.getClient();
      
      try {
        const now = new Date();
        
        // Create tasks for the next 3 months
        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (i * 7));
          
          // Tuesday CADIS run
          const tuesdayDate = new Date(weekStart);
          tuesdayDate.setDate(weekStart.getDate() + (2 - weekStart.getDay() + 7) % 7);
          tuesdayDate.setHours(10, 0, 0, 0); // 10 AM

          // Friday CADIS run
          const fridayDate = new Date(weekStart);
          fridayDate.setDate(weekStart.getDate() + (5 - weekStart.getDay() + 7) % 7);
          fridayDate.setHours(14, 0, 0, 0); // 2 PM

          if (tuesdayDate >= now) {
            const tuesdayTaskId = `cadis_maintenance_tuesday_${tuesdayDate.toISOString().split('T')[0]}`;
            
            const existing = await client.query(
              'SELECT id FROM scheduled_tasks WHERE id = $1',
              [tuesdayTaskId]
            );

            if (existing.rows.length === 0) {
              await client.query(`
                INSERT INTO scheduled_tasks (
                  id, name, type, schedule, next_run, status, metadata, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                tuesdayTaskId,
                'CADIS Full System Analysis',
                'cadis_maintenance',
                'weekly_tuesday',
                tuesdayDate,
                'active',
                JSON.stringify({
                  analysisType: 'full_system',
                  includeEcosystem: true,
                  includeDreamState: true,
                  includeCreativeIntelligence: true
                }),
                new Date(),
                new Date()
              ]);
            }
          }

          if (fridayDate >= now) {
            const fridayTaskId = `cadis_maintenance_friday_${fridayDate.toISOString().split('T')[0]}`;
            
            const existing = await client.query(
              'SELECT id FROM scheduled_tasks WHERE id = $1',
              [fridayTaskId]
            );

            if (existing.rows.length === 0) {
              await client.query(`
                INSERT INTO scheduled_tasks (
                  id, name, type, schedule, next_run, status, metadata, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                fridayTaskId,
                'CADIS Ecosystem Health Check',
                'cadis_maintenance',
                'weekly_friday',
                fridayDate,
                'active',
                JSON.stringify({
                  analysisType: 'ecosystem_health',
                  includeEcosystem: true,
                  includeOptimization: true
                }),
                new Date(),
                new Date()
              ]);
            }
          }
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating CADIS maintenance tasks:', error);
    }
  }

  /**
   * Check for due tasks and execute them
   */
  async processDueTasks(): Promise<void> {
    try {
      const client = await this.getClient();
      
      try {
        const now = new Date();
        const result = await client.query(`
          SELECT * FROM scheduled_tasks 
          WHERE next_run <= $1 AND status = 'active'
          ORDER BY next_run ASC
        `, [now]);

        for (const taskRow of result.rows) {
          const task = this.mapRowToScheduledTask(taskRow);
          await this.executeTask(task);
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error processing due tasks:', error);
    }
  }

  /**
   * Execute a specific task
   */
  async executeTask(task: ScheduledTask): Promise<void> {
    try {
      console.log(`🔄 Executing task: ${task.name}`);

      switch (task.type) {
        case 'self_review':
          await this.executeSelfReviewTask(task);
          break;
        case 'cadis_maintenance':
          await this.executeCADISMaintenanceTask(task);
          break;
      }

      // Update task as completed and create notification
      await this.markTaskCompleted(task.id);
      await this.createNotification({
        title: `Task Completed: ${task.name}`,
        message: `Scheduled task "${task.name}" has been completed successfully.`,
        type: 'success',
        priority: 'medium',
        actionUrl: '/admin/calendar',
        actionLabel: 'View Calendar'
      });

      console.log(`✅ Task completed: ${task.name}`);
    } catch (error) {
      console.error(`❌ Error executing task ${task.name}:`, error);
      
      await this.createNotification({
        title: `Task Failed: ${task.name}`,
        message: `Scheduled task "${task.name}" failed to execute. Please check the logs.`,
        type: 'error',
        priority: 'high',
        actionUrl: '/admin/calendar',
        actionLabel: 'View Calendar'
      });
    }
  }

  /**
   * Execute self-review task
   */
  async executeSelfReviewTask(task: ScheduledTask): Promise<void> {
    try {
      const { reviewPeriod, scope } = task.metadata;
      
      // Create self-review period
      const review = await this.calendarService.createSelfReviewPeriod(
        task.name,
        new Date(reviewPeriod.start),
        new Date(reviewPeriod.end),
        'weekly',
        scope
      );

      // Start analysis generation in background
      this.calendarService.generateSelfReviewAnalysis(review.id).catch(error => {
        console.error('Background analysis failed:', error);
      });

      // Create notification
      await this.createNotification({
        title: '📋 Self-Review Period Started',
        message: `Your biweekly self-review period has been created and CADIS analysis is being generated.`,
        type: 'info',
        priority: 'medium',
        actionUrl: '/admin/calendar',
        actionLabel: 'View Review'
      });
    } catch (error) {
      console.error('Error executing self-review task:', error);
      throw error;
    }
  }

  /**
   * Execute CADIS maintenance task
   */
  async executeCADISMaintenanceTask(task: ScheduledTask): Promise<void> {
    try {
      const { analysisType } = task.metadata;

      if (analysisType === 'full_system') {
        // Run full CADIS analysis - Tuesday comprehensive analysis
        console.log('🧠 Running CADIS Tuesday Full System Analysis...');
        
        const results = await Promise.allSettled([
          this.cadisService.generateEcosystemInsight(),
          this.cadisService.generateDreamStatePredictions(),
          this.cadisService.generateCreativeIntelligence()
        ]);

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const total = results.length;

        await this.createNotification({
          title: '🧠 CADIS Tuesday Analysis Complete',
          message: `CADIS completed its comprehensive Tuesday analysis (${successful}/${total} components successful). Generated ecosystem insights, dream state predictions, and creative intelligence.`,
          type: successful === total ? 'success' : 'warning',
          priority: 'medium',
          actionUrl: '/admin/cadis-journal',
          actionLabel: 'View New Insights'
        });

        console.log(`✅ CADIS Tuesday analysis completed: ${successful}/${total} components successful`);
      } else if (analysisType === 'ecosystem_health') {
        // Run ecosystem health check - Friday focused analysis
        console.log('🏥 Running CADIS Friday Ecosystem Health Check...');
        
        try {
          await this.cadisService.generateEcosystemInsight();

          await this.createNotification({
            title: '🏥 CADIS Friday Health Check Complete',
            message: 'CADIS completed its ecosystem health analysis and generated optimization recommendations for the week.',
            type: 'success',
            priority: 'medium',
            actionUrl: '/admin/cadis-journal',
            actionLabel: 'View Health Report'
          });

          console.log('✅ CADIS Friday health check completed successfully');
        } catch (error) {
          await this.createNotification({
            title: '⚠️ CADIS Friday Health Check Issue',
            message: 'CADIS encountered an issue during the Friday health check. Please review the system logs.',
            type: 'warning',
            priority: 'high',
            actionUrl: '/admin/cadis-journal',
            actionLabel: 'Check Status'
          });

          console.error('❌ CADIS Friday health check failed:', error);
        }
      }
    } catch (error) {
      console.error('Error executing CADIS maintenance task:', error);
      throw error;
    }
  }

  /**
   * Create admin notification
   */
  async createNotification(notification: Omit<AdminNotification, 'id' | 'isRead' | 'createdAt'>): Promise<AdminNotification> {
    try {
      const client = await this.getClient();
      
      try {
        const id = this.generateId();
        const now = new Date();

        const query = `
          INSERT INTO admin_notifications (
            id, title, message, type, priority, is_read, action_url, action_label, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const values = [
          id,
          notification.title,
          notification.message,
          notification.type,
          notification.priority,
          false,
          notification.actionUrl || null,
          notification.actionLabel || null,
          now
        ];

        const result = await client.query(query, values);
        return this.mapRowToNotification(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get unread admin notifications
   */
  async getUnreadNotifications(): Promise<AdminNotification[]> {
    try {
      const client = await this.getClient();
      
      try {
        const result = await client.query(`
          SELECT * FROM admin_notifications 
          WHERE is_read = false
          ORDER BY created_at DESC
          LIMIT 20
        `);

        return result.rows.map(row => this.mapRowToNotification(row));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      const client = await this.getClient();
      
      try {
        await client.query(
          'UPDATE admin_notifications SET is_read = true WHERE id = $1',
          [notificationId]
        );
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Private helper methods
  private async createTablesIfNotExists(): Promise<void> {
    const client = await this.getClient();
    
    try {
      // Scheduled tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS scheduled_tasks (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(500) NOT NULL,
          type VARCHAR(50) NOT NULL,
          schedule VARCHAR(100) NOT NULL,
          next_run TIMESTAMP NOT NULL,
          last_run TIMESTAMP,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Admin notifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          priority VARCHAR(50) NOT NULL,
          is_read BOOLEAN DEFAULT false,
          action_url VARCHAR(500),
          action_label VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Scheduled tasks tables created/verified');
    } finally {
      client.release();
    }
  }

  private async markTaskCompleted(taskId: string): Promise<void> {
    const client = await this.getClient();
    
    try {
      await client.query(
        'UPDATE scheduled_tasks SET status = $1, last_run = $2, updated_at = $3 WHERE id = $4',
        ['completed', new Date(), new Date(), taskId]
      );
    } finally {
      client.release();
    }
  }

  private mapRowToScheduledTask(row: any): ScheduledTask {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      schedule: row.schedule,
      nextRun: new Date(row.next_run),
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      status: row.status,
      metadata: JSON.parse(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToNotification(row: any): AdminNotification {
    return {
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      priority: row.priority,
      isRead: row.is_read,
      actionUrl: row.action_url,
      actionLabel: row.action_label,
      expiresAt: undefined,
      createdAt: new Date(row.created_at)
    };
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient();
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ScheduledTasksService;
