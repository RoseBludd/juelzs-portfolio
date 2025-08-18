import DatabaseService from './database.service';
import JournalService, { JournalEntry, Reminder } from './journal.service';
import CADISJournalService, { CADISJournalEntry } from './cadis-journal.service';
import AWSS3Service from './aws-s3.service';
import { PoolClient } from 'pg';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'journal_entry' | 'cadis_entry' | 'reminder' | 'self_review' | 'meeting' | 'milestone' | 'cadis_maintenance';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'completed' | 'in_progress' | 'cancelled';
  metadata: {
    entryId?: string;
    projectId?: string;
    projectName?: string;
    tags?: string[];
    impact?: 'low' | 'medium' | 'high' | 'critical';
    confidence?: number;
    relatedEntities?: {
      developers?: string[];
      repositories?: string[];
      modules?: string[];
      projects?: string[];
    };
  };
  contextSummary: string;
  s3ContextPath?: string; // Path to detailed context stored in S3
}

export interface SelfReviewPeriod {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'milestone';
  status: 'pending' | 'in_progress' | 'completed';
  scope: {
    includeJournal: boolean;
    includeRepositories: boolean;
    includeMeetings: boolean;
    includeCADIS: boolean;
    includeProjects: boolean;
  };
  analysisResults?: {
    overallProgress: string;
    keyInsights: string[];
    recommendations: string[];
    performanceMetrics: Record<string, number>;
    s3AnalysisPath?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarFilters {
  types?: CalendarEvent['type'][];
  categories?: string[];
  priorities?: CalendarEvent['priority'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectIds?: string[];
  tags?: string[];
  showCompleted?: boolean;
  showPrivate?: boolean;
}

export interface CalendarStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByMonth: Record<string, number>;
  upcomingReminders: number;
  completedSelfReviews: number;
  pendingSelfReviews: number;
  journalEntriesThisMonth: number;
  cadisInsightsThisMonth: number;
}

class CalendarService {
  private static instance: CalendarService;
  private dbService: DatabaseService;
  private journalService: JournalService;
  private cadisService: CADISJournalService;
  private s3Service: AWSS3Service;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.journalService = JournalService.getInstance();
    this.cadisService = CADISJournalService.getInstance();
    this.s3Service = AWSS3Service.getInstance();
  }

  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * Initialize calendar service and create necessary tables
   */
  async initialize(): Promise<void> {
    try {
      await this.createTablesIfNotExists();
      console.log('📅 Calendar Service initialized');
    } catch (error) {
      console.error('❌ Calendar Service initialization failed:', error);
    }
  }

  /**
   * Get all calendar events with optional filtering
   */
  async getCalendarEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const [journalEvents, cadisEvents, reminders, selfReviews, meetings, cadisMaintenance] = await Promise.all([
        this.getJournalEvents(filters),
        this.getCADISEvents(filters),
        this.getReminderEvents(filters),
        this.getSelfReviewEvents(filters),
        this.getMeetingEvents(filters),
        this.getCADISMaintenanceEvents(filters)
      ]);

      let allEvents = [...journalEvents, ...cadisEvents, ...reminders, ...selfReviews, ...meetings, ...cadisMaintenance];

      // Apply filters
      if (filters) {
        allEvents = this.applyFilters(allEvents, filters);
      }

      // Sort by date (newest first)
      return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  /**
   * Get events for a specific date range (for calendar view)
   */
  async getEventsForDateRange(startDate: Date, endDate: Date, filters?: CalendarFilters): Promise<CalendarEvent[]> {
    const dateRangeFilter: CalendarFilters = {
      ...filters,
      dateRange: { start: startDate, end: endDate }
    };

    return this.getCalendarEvents(dateRangeFilter);
  }

  /**
   * Get calendar statistics (optimized - use working services)
   */
  async getCalendarStats(): Promise<CalendarStats> {
    try {
      console.log('📊 Calculating calendar stats using working services...');
      
      // Use the working services directly instead of database queries
      const [journalEntries, cadisEntries] = await Promise.allSettled([
        this.journalService.getJournalEntries().catch(() => []),
        this.cadisService.getCADISEntries().catch(() => [])
      ]);

      const journal = journalEntries.status === 'fulfilled' ? journalEntries.value : [];
      const cadis = cadisEntries.status === 'fulfilled' ? cadisEntries.value : [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Count journal entries this month
      const journalThisMonth = journal.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }).length;

      // Count CADIS insights this month
      const cadisThisMonth = cadis.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }).length;

      // Get CADIS maintenance events for this week
      const maintenanceEvents = await this.getCADISMaintenanceEvents();
      const upcomingMaintenance = maintenanceEvents.filter(event => 
        event.date >= startOfWeek && event.date <= endOfWeek && event.status === 'pending'
      ).length;

      const stats: CalendarStats = {
        totalEvents: journal.length + cadis.length + maintenanceEvents.length,
        eventsByType: {
          journal_entry: journal.length,
          cadis_entry: cadis.length,
          cadis_maintenance: maintenanceEvents.length,
          reminder: 0, // Will be updated when reminders service is working
          self_review: 0 // Will be updated when self-review data exists
        },
        eventsByMonth: {},
        upcomingReminders: upcomingMaintenance, // Show upcoming CADIS maintenance as "upcoming events"
        completedSelfReviews: 0,
        pendingSelfReviews: 0,
        journalEntriesThisMonth: journalThisMonth,
        cadisInsightsThisMonth: cadisThisMonth
      };

      console.log(`📊 Stats calculated: ${stats.journalEntriesThisMonth} journal, ${stats.cadisInsightsThisMonth} CADIS, ${stats.upcomingReminders} upcoming`);
      return stats;
    } catch (error) {
      console.error('Error calculating calendar stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByMonth: {},
        upcomingReminders: 0,
        completedSelfReviews: 0,
        pendingSelfReviews: 0,
        journalEntriesThisMonth: 0,
        cadisInsightsThisMonth: 0
      };
    }
  }

  /**
   * Create a new self-review period
   */
  async createSelfReviewPeriod(
    title: string,
    startDate: Date,
    endDate: Date,
    type: SelfReviewPeriod['type'],
    scope: SelfReviewPeriod['scope']
  ): Promise<SelfReviewPeriod> {
    try {
      const client = await this.getClient();
      
      try {
        const id = this.generateId();
        const now = new Date();

        const query = `
          INSERT INTO self_review_periods (
            id, title, start_date, end_date, type, status, scope, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const values = [
          id, title, startDate, endDate, type, 'pending', 
          JSON.stringify(scope), now, now
        ];

        const result = await client.query(query, values);
        return this.mapRowToSelfReviewPeriod(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating self-review period:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive self-review analysis using CADIS
   */
  async generateSelfReviewAnalysis(reviewId: string): Promise<void> {
    try {
      console.log(`🔍 Generating comprehensive self-review analysis for: ${reviewId}`);
      
      const review = await this.getSelfReviewPeriod(reviewId);
      if (!review) {
        throw new Error('Self-review period not found');
      }

      // Gather data from all sources based on scope
      const analysisData = await this.gatherReviewData(review);
      
      // Generate CADIS analysis
      const cadisAnalysis = await this.runCADISAnalysis(analysisData, review);
      
      // Store detailed analysis in S3
      const s3AnalysisPath = await this.storeAnalysisInS3(reviewId, cadisAnalysis);
      
      // Update review with results
      await this.updateSelfReviewResults(reviewId, {
        overallProgress: cadisAnalysis.overallProgress,
        keyInsights: cadisAnalysis.keyInsights,
        recommendations: cadisAnalysis.recommendations,
        performanceMetrics: cadisAnalysis.performanceMetrics,
        s3AnalysisPath
      });

      console.log(`✅ Self-review analysis completed for: ${reviewId}`);
    } catch (error) {
      console.error('Error generating self-review analysis:', error);
      throw error;
    }
  }

  /**
   * Get detailed event context (with CADIS enhancement)
   */
  async getEventContext(eventId: string, eventType: CalendarEvent['type']): Promise<any> {
    try {
      console.log(`🔍 Getting enhanced context for ${eventType} event: ${eventId}`);

      let baseContext: any = {};
      
      // Get base context based on event type
      switch (eventType) {
        case 'journal_entry':
          const journalEntry = await this.journalService.getJournalEntry(eventId);
          baseContext = { journalEntry, type: 'journal' };
          break;
        case 'cadis_entry':
          const cadisEntry = await this.cadisService.getCADISEntry(eventId);
          baseContext = { cadisEntry, type: 'cadis' };
          break;
        case 'reminder':
          const reminder = await this.journalService.getReminder(eventId);
          baseContext = { reminder, type: 'reminder' };
          break;
        case 'self_review':
          const review = await this.getSelfReviewPeriod(eventId);
          baseContext = { review, type: 'self_review' };
          break;
        default:
          baseContext = { type: eventType };
      }

      // Enhance with CADIS contextual intelligence
      const cadisContext = await this.generateCADISContext(baseContext, eventType);
      
      const enhancedContext = {
        ...baseContext,
        cadisEnhancement: cadisContext,
        generatedAt: new Date().toISOString()
      };

      // Store enhanced context in S3 for future reference
      const s3Path = await this.storeEventContextInS3(eventId, eventType, enhancedContext);
      enhancedContext.s3ContextPath = s3Path;

      return enhancedContext;
    } catch (error) {
      console.error('Error getting event context:', error);
      return null;
    }
  }

  // Private helper methods

  private async getJournalEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const entries = await this.journalService.getJournalEntries();
      return entries.map(entry => this.mapJournalEntryToCalendarEvent(entry));
    } catch (error) {
      console.error('Error fetching journal events:', error);
      return [];
    }
  }

  private async getCADISEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const entries = await this.cadisService.getCADISEntries();
      return entries.map(entry => this.mapCADISEntryToCalendarEvent(entry));
    } catch (error) {
      console.error('Error fetching CADIS events:', error);
      return [];
    }
  }

  private async getReminderEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const reminders = await this.journalService.getReminders();
      return reminders.map(reminder => this.mapReminderToCalendarEvent(reminder));
    } catch (error) {
      console.error('Error fetching reminder events:', error);
      return [];
    }
  }

  private async getSelfReviewEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const reviews = await this.getSelfReviewPeriods();
      return reviews.map(review => this.mapSelfReviewToCalendarEvent(review));
    } catch (error) {
      console.error('Error fetching self-review events:', error);
      return [];
    }
  }

  private async getMeetingEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      // Only load meetings if specifically requested to avoid performance issues
      if (filters?.types?.includes('meeting')) {
        const meetingGroups = await this.s3Service.getMeetingGroups();
        return meetingGroups.map(meeting => this.mapMeetingToCalendarEvent(meeting));
      }
      return [];
    } catch (error) {
      console.error('Error fetching meeting events:', error);
      return [];
    }
  }

  private async getCADISMaintenanceEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      if (filters?.types && !filters.types.includes('cadis_maintenance')) {
        return [];
      }

      const events: CalendarEvent[] = [];
      const now = new Date();
      
      // Generate CADIS maintenance events for the next 3 months
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (i * 7));
        
        // CADIS runs twice a week: Tuesday and Friday
        const tuesdayDate = new Date(weekStart);
        tuesdayDate.setDate(weekStart.getDate() + (2 - weekStart.getDay() + 7) % 7);
        
        const fridayDate = new Date(weekStart);
        fridayDate.setDate(weekStart.getDate() + (5 - weekStart.getDay() + 7) % 7);

        if (tuesdayDate >= now) {
          events.push({
            id: `cadis_maintenance_tuesday_${tuesdayDate.toISOString().split('T')[0]}`,
            title: 'CADIS Full System Analysis',
            date: tuesdayDate,
            type: 'cadis_maintenance',
            category: 'system',
            priority: 'medium',
            status: tuesdayDate > now ? 'pending' : 'completed',
            metadata: {
              tags: ['cadis', 'maintenance', 'system-analysis']
            },
            contextSummary: 'Automated CADIS system analysis including ecosystem health, dream state predictions, and creative intelligence generation.'
          });
        }

        if (fridayDate >= now) {
          events.push({
            id: `cadis_maintenance_friday_${fridayDate.toISOString().split('T')[0]}`,
            title: 'CADIS Ecosystem Health Check',
            date: fridayDate,
            type: 'cadis_maintenance',
            category: 'health-check',
            priority: 'medium',
            status: fridayDate > now ? 'pending' : 'completed',
            metadata: {
              tags: ['cadis', 'maintenance', 'ecosystem-health']
            },
            contextSummary: 'CADIS ecosystem health monitoring and optimization recommendations.'
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error generating CADIS maintenance events:', error);
      return [];
    }
  }

  private applyFilters(events: CalendarEvent[], filters: CalendarFilters): CalendarEvent[] {
    let filtered = events;

    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(event => filters.types!.includes(event.type));
    }

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(event => 
        event.category && filters.categories!.includes(event.category)
      );
    }

    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(event => 
        event.priority && filters.priorities!.includes(event.priority)
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(event => 
        event.date >= filters.dateRange!.start && event.date <= filters.dateRange!.end
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(event => 
        event.metadata.tags && 
        filters.tags!.some(tag => event.metadata.tags!.includes(tag))
      );
    }

    if (filters.showCompleted === false) {
      filtered = filtered.filter(event => event.status !== 'completed');
    }

    return filtered;
  }

  private mapJournalEntryToCalendarEvent(entry: JournalEntry): CalendarEvent {
    return {
      id: `journal_${entry.id}`,
      title: entry.title,
      date: entry.createdAt,
      type: 'journal_entry',
      category: entry.category,
      status: 'completed',
      metadata: {
        entryId: entry.id,
        projectId: entry.projectId,
        projectName: entry.projectName,
        tags: entry.tags,
        impact: entry.metadata?.impact ? this.mapImpactLevel(entry.metadata.impact) : undefined
      },
      contextSummary: entry.content.substring(0, 200) + '...'
    };
  }

  private mapCADISEntryToCalendarEvent(entry: CADISJournalEntry): CalendarEvent {
    return {
      id: `cadis_${entry.id}`,
      title: entry.title,
      date: entry.createdAt,
      type: 'cadis_entry',
      category: entry.category,
      priority: this.mapImpactToPriority(entry.impact),
      status: 'completed',
      metadata: {
        entryId: entry.id,
        tags: entry.tags,
        impact: entry.impact,
        confidence: entry.confidence,
        relatedEntities: entry.relatedEntities
      },
      contextSummary: entry.content.substring(0, 200) + '...'
    };
  }

  private mapReminderToCalendarEvent(reminder: Reminder): CalendarEvent {
    return {
      id: `reminder_${reminder.id}`,
      title: reminder.title,
      date: reminder.dueDate,
      type: 'reminder',
      category: reminder.category,
      priority: reminder.priority,
      status: reminder.status,
      metadata: {
        entryId: reminder.relatedEntryId
      },
      contextSummary: reminder.description || 'Reminder'
    };
  }

  private mapSelfReviewToCalendarEvent(review: SelfReviewPeriod): CalendarEvent {
    return {
      id: `review_${review.id}`,
      title: review.title,
      date: review.startDate,
      type: 'self_review',
      category: review.type,
      priority: 'high',
      status: review.status,
      metadata: {},
      contextSummary: `${review.type} review period: ${review.startDate.toLocaleDateString()} - ${review.endDate.toLocaleDateString()}`
    };
  }

  private mapMeetingToCalendarEvent(meeting: any): CalendarEvent {
    return {
      id: `meeting_${meeting.id}`,
      title: meeting.title,
      date: new Date(meeting.dateRecorded),
      type: 'meeting',
      category: meeting.category,
      priority: meeting.isPortfolioRelevant ? 'high' : 'medium',
      status: 'completed',
      metadata: {
        tags: meeting.participants
      },
      contextSummary: `Meeting with ${meeting.participants.join(', ')}`
    };
  }

  private mapImpactLevel(impact: number): 'low' | 'medium' | 'high' | 'critical' {
    if (impact >= 8) return 'critical';
    if (impact >= 6) return 'high';
    if (impact >= 4) return 'medium';
    return 'low';
  }

  private mapImpactToPriority(impact: 'low' | 'medium' | 'high' | 'critical'): 'low' | 'medium' | 'high' | 'urgent' {
    const mapping = {
      'low': 'low' as const,
      'medium': 'medium' as const,
      'high': 'high' as const,
      'critical': 'urgent' as const
    };
    return mapping[impact];
  }

  private async createTablesIfNotExists(): Promise<void> {
    const client = await this.getClient();
    
    try {
      // Self-review periods table
      await client.query(`
        CREATE TABLE IF NOT EXISTS self_review_periods (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          scope JSONB NOT NULL,
          analysis_results JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Calendar tables created/verified');
    } finally {
      client.release();
    }
  }

  private async getSelfReviewPeriods(): Promise<SelfReviewPeriod[]> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM self_review_periods 
        ORDER BY start_date DESC
      `);
      
      return result.rows.map(row => this.mapRowToSelfReviewPeriod(row));
    } finally {
      client.release();
    }
  }

  private async getSelfReviewPeriod(id: string): Promise<SelfReviewPeriod | null> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM self_review_periods WHERE id = $1',
        [id]
      );
      
      return result.rows[0] ? this.mapRowToSelfReviewPeriod(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  private mapRowToSelfReviewPeriod(row: any): SelfReviewPeriod {
    return {
      id: row.id,
      title: row.title,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      type: row.type,
      status: row.status,
      scope: JSON.parse(row.scope),
      analysisResults: row.analysis_results ? JSON.parse(row.analysis_results) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private async gatherReviewData(review: SelfReviewPeriod): Promise<any> {
    const data: any = { period: review, sources: {} };

    if (review.scope.includeJournal) {
      data.sources.journal = await this.journalService.getJournalEntriesByDateRange(
        review.startDate, review.endDate
      );
    }

    if (review.scope.includeCADIS) {
      data.sources.cadis = await this.cadisService.getCADISEntriesByDateRange(
        review.startDate, review.endDate
      );
    }

    if (review.scope.includeMeetings) {
      data.sources.meetings = await this.s3Service.getMeetingGroups();
      // Filter by date range
      data.sources.meetings = data.sources.meetings.filter((meeting: any) => {
        const meetingDate = new Date(meeting.dateRecorded);
        return meetingDate >= review.startDate && meetingDate <= review.endDate;
      });
    }

    return data;
  }

  private async runCADISAnalysis(data: any, review: SelfReviewPeriod): Promise<any> {
    // This would integrate with CADIS to generate comprehensive analysis
    // For now, return a structured analysis template
    return {
      overallProgress: "Comprehensive progress analysis generated by CADIS",
      keyInsights: [
        "Key insight 1 from CADIS analysis",
        "Key insight 2 from CADIS analysis",
        "Key insight 3 from CADIS analysis"
      ],
      recommendations: [
        "Recommendation 1 from CADIS",
        "Recommendation 2 from CADIS"
      ],
      performanceMetrics: {
        productivity: 85,
        learning: 78,
        impact: 92
      }
    };
  }

  private async storeAnalysisInS3(reviewId: string, analysis: any): Promise<string> {
    const key = `calendar/self-reviews/${reviewId}/analysis.json`;
    
    try {
      await this.s3Service.storeAnalysisResult(reviewId, analysis);
      return key;
    } catch (error) {
      console.error('Error storing analysis in S3:', error);
      throw error;
    }
  }

  private async storeEventContextInS3(eventId: string, eventType: string, context: any): Promise<string> {
    const key = `calendar/contexts/${eventType}/${eventId}/context.json`;
    
    try {
      await this.s3Service.storeAnalysisResult(`${eventType}_${eventId}`, context);
      return key;
    } catch (error) {
      console.error('Error storing context in S3:', error);
      throw error;
    }
  }

  private async updateSelfReviewResults(reviewId: string, results: any): Promise<void> {
    const client = await this.getClient();
    
    try {
      await client.query(
        `UPDATE self_review_periods 
         SET analysis_results = $1, status = $2, updated_at = $3 
         WHERE id = $4`,
        [JSON.stringify(results), 'completed', new Date(), reviewId]
      );
    } finally {
      client.release();
    }
  }

  private async generateCADISContext(baseContext: any, eventType: string): Promise<any> {
    // This would use CADIS to generate contextual intelligence
    // For now, return a structured context template
    return {
      relatedPatterns: [],
      insights: [],
      recommendations: [],
      confidence: 85,
      generatedBy: 'CADIS',
      generatedAt: new Date().toISOString()
    };
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getClient();
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Optimized stats methods to avoid heavy analysis
  private async getJournalStats(currentMonth: number, currentYear: number): Promise<{count: number, thisMonth: number}> {
    try {
      const client = await this.getClient();
      try {
        const result = await client.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 THEN 1 END) as this_month
          FROM journal_entries
        `, [currentMonth + 1, currentYear]);
        
        return {
          count: parseInt(result.rows[0].total_count) || 0,
          thisMonth: parseInt(result.rows[0].this_month) || 0
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting journal stats:', error);
      return { count: 0, thisMonth: 0 };
    }
  }

  private async getCADISStats(currentMonth: number, currentYear: number): Promise<{count: number, thisMonth: number}> {
    try {
      const client = await this.getClient();
      try {
        const result = await client.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 THEN 1 END) as this_month
          FROM cadis_journal_entries
        `, [currentMonth + 1, currentYear]);
        
        return {
          count: parseInt(result.rows[0].total_count) || 0,
          thisMonth: parseInt(result.rows[0].this_month) || 0
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting CADIS stats:', error);
      return { count: 0, thisMonth: 0 };
    }
  }

  private async getReminderStats(nextWeek: Date): Promise<{count: number, upcoming: number}> {
    try {
      const client = await this.getClient();
      try {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);

        const result = await client.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN due_date >= $1 AND due_date <= $2 AND status = 'pending' THEN 1 END) as upcoming
          FROM reminders
        `, [now, endOfWeek]);
        
        return {
          count: parseInt(result.rows[0].total_count) || 0,
          upcoming: parseInt(result.rows[0].upcoming) || 0
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      return { count: 0, upcoming: 0 };
    }
  }

  private async getReviewStats(): Promise<{count: number, completed: number, pending: number}> {
    try {
      const client = await this.getClient();
      try {
        const result = await client.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
          FROM self_review_periods
        `);
        
        return {
          count: parseInt(result.rows[0].total_count) || 0,
          completed: parseInt(result.rows[0].completed) || 0,
          pending: parseInt(result.rows[0].pending) || 0
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error getting review stats:', error);
      return { count: 0, completed: 0, pending: 0 };
    }
  }
}

export default CalendarService;
