import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  category: 'architecture' | 'decision' | 'reflection' | 'planning' | 'problem-solving' | 'milestone' | 'learning';
  projectId?: string;
  projectName?: string;
  tags: string[];
  architectureDiagrams?: string[]; // S3 URLs for uploaded diagrams
  relatedFiles?: string[]; // File paths or URLs
  aiSuggestions?: AISuggestion[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    difficulty?: number; // 1-10
    impact?: number; // 1-10
    learnings?: string[];
    nextSteps?: string[];
    resources?: string[];
  };
}

export interface AISuggestion {
  id: string;
  type: 'architecture' | 'optimization' | 'best-practice' | 'risk-assessment' | 'next-steps';
  suggestion: string;
  reasoning: string;
  confidence: number; // 0-100
  resources?: string[];
  implementationComplexity?: 'low' | 'medium' | 'high';
  estimatedTimeToImplement?: string;
  createdAt: Date;
}

export interface JournalStats {
  totalEntries: number;
  entriesByCategory: Record<string, number>;
  recentEntries: JournalEntry[];
  topTags: Array<{ name: string; count: number }>;
  aiSuggestionsGenerated: number;
  aiSuggestionsImplemented: number;
}

export interface JournalSearchFilters {
  category?: string;
  projectId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasAISuggestions?: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'pending' | 'completed' | 'cancelled';
  relatedEntryId?: string;
  nextStepIndex?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

class JournalService {
  private static instance: JournalService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService();
    }
    return JournalService.instance;
  }

  /**
   * Initialize journal tables if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      await this.dbService.initialize();
      await this.createTablesIfNotExists();
    } catch (error) {
      console.warn('Journal service initialization failed, using fallback mode:', error);
    }
  }

  /**
   * Create journal entry
   */
  async createEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    try {
      const client = await this.getClient();
      
      try {
        const id = this.generateId();
        const now = new Date();
        
        const query = `
          INSERT INTO journal_entries (
            id, title, content, category, project_id, project_name, 
            tags, architecture_diagrams, related_files, metadata, 
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `;
        
        const values = [
          id,
          entry.title,
          entry.content,
          entry.category,
          entry.projectId || null,
          entry.projectName || null,
          JSON.stringify(entry.tags || []),
          JSON.stringify(entry.architectureDiagrams || []),
          JSON.stringify(entry.relatedFiles || []),
          JSON.stringify(entry.metadata || {}),
          now,
          now
        ];
        
        const result = await client.query(query, values);
        const newEntry = this.mapRowToEntry(result.rows[0]);
        
        // Generate AI suggestions asynchronously
        this.generateAISuggestions(newEntry).catch(error => 
          console.error('Failed to generate AI suggestions:', error)
        );

        // Create auto-reminders from next steps if enabled
        if ((entry as any).autoReminders && entry.metadata?.nextSteps && entry.metadata.nextSteps.length > 0) {
          this.createRemindersFromNextSteps(newEntry.id, entry.metadata.nextSteps).catch(error =>
            console.error('Failed to create auto-reminders:', error)
          );
        }
        
        return newEntry;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw new Error('Failed to create journal entry');
    }
  }

  /**
   * Get all journal entries with optional filters
   */
  async getEntries(filters?: JournalSearchFilters, limit: number = 50, offset: number = 0): Promise<JournalEntry[]> {
    try {
      const client = await this.getClient();
      
      try {
        let query = `
          SELECT je.*, COALESCE(json_agg(
            json_build_object(
              'id', ais.id,
              'type', ais.type,
              'suggestion', ais.suggestion,
              'reasoning', ais.reasoning,
              'confidence', ais.confidence,
              'resources', ais.resources,
              'implementationComplexity', ais.implementation_complexity,
              'estimatedTimeToImplement', ais.estimated_time_to_implement,
              'createdAt', ais.created_at
            )
          ) FILTER (WHERE ais.id IS NOT NULL), '[]') as ai_suggestions
          FROM journal_entries je
          LEFT JOIN ai_suggestions ais ON je.id = ais.journal_entry_id
        `;
        
        const conditions: string[] = [];
        const values: any[] = [];
        let paramCount = 0;
        
        if (filters) {
          if (filters.category) {
            conditions.push(`je.category = $${++paramCount}`);
            values.push(filters.category);
          }
          
          if (filters.projectId) {
            conditions.push(`je.project_id = $${++paramCount}`);
            values.push(filters.projectId);
          }
          
          if (filters.tags && filters.tags.length > 0) {
            conditions.push(`je.tags::jsonb ?| array[$${++paramCount}]`);
            values.push(filters.tags);
          }
          
          if (filters.dateFrom) {
            conditions.push(`je.created_at >= $${++paramCount}`);
            values.push(filters.dateFrom);
          }
          
          if (filters.dateTo) {
            conditions.push(`je.created_at <= $${++paramCount}`);
            values.push(filters.dateTo);
          }
          
          if (filters.hasAISuggestions) {
            conditions.push(`EXISTS (SELECT 1 FROM ai_suggestions WHERE journal_entry_id = je.id)`);
          }
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += `
          GROUP BY je.id, je.title, je.content, je.category, je.project_id, 
                   je.project_name, je.tags, je.architecture_diagrams, 
                   je.related_files, je.metadata, je.created_at, je.updated_at
          ORDER BY je.updated_at DESC
          LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        
        values.push(limit, offset);
        
        const result = await client.query(query, values);
        return result.rows.map(row => this.mapRowToEntryWithSuggestions(row));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return this.getFallbackEntries();
    }
  }

  /**
   * Get journal entry by ID
   */
  async getEntryById(id: string): Promise<JournalEntry | null> {
    try {
      const client = await this.getClient();
      
      try {
        const query = `
          SELECT je.*, COALESCE(json_agg(
            json_build_object(
              'id', ais.id,
              'type', ais.type,
              'suggestion', ais.suggestion,
              'reasoning', ais.reasoning,
              'confidence', ais.confidence,
              'resources', ais.resources,
              'implementationComplexity', ais.implementation_complexity,
              'estimatedTimeToImplement', ais.estimated_time_to_implement,
              'createdAt', ais.created_at
            )
          ) FILTER (WHERE ais.id IS NOT NULL), '[]') as ai_suggestions
          FROM journal_entries je
          LEFT JOIN ai_suggestions ais ON je.id = ais.journal_entry_id
          WHERE je.id = $1
          GROUP BY je.id, je.title, je.content, je.category, je.project_id, 
                   je.project_name, je.tags, je.architecture_diagrams, 
                   je.related_files, je.metadata, je.created_at, je.updated_at
        `;
        
        const result = await client.query(query, [id]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return this.mapRowToEntryWithSuggestions(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      return null;
    }
  }

  /**
   * Update journal entry
   */
  async updateEntry(id: string, updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>): Promise<JournalEntry | null> {
    try {
      const client = await this.getClient();
      
      try {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramCount = 0;
        
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            const dbKey = this.camelToSnake(key);
            if (key === 'tags' || key === 'architectureDiagrams' || key === 'relatedFiles' || key === 'metadata') {
              setClause.push(`${dbKey} = $${++paramCount}`);
              values.push(JSON.stringify(value));
            } else {
              setClause.push(`${dbKey} = $${++paramCount}`);
              values.push(value);
            }
          }
        });
        
        if (setClause.length === 0) {
          return await this.getEntryById(id);
        }
        
        setClause.push(`updated_at = $${++paramCount}`);
        values.push(new Date());
        values.push(id);
        
        const query = `
          UPDATE journal_entries 
          SET ${setClause.join(', ')}
          WHERE id = $${++paramCount}
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const updatedEntry = this.mapRowToEntry(result.rows[0]);
        
        // Regenerate AI suggestions if content changed
        if (updates.content || updates.category) {
          this.generateAISuggestions(updatedEntry).catch(error => 
            console.error('Failed to regenerate AI suggestions:', error)
          );
        }
        
        return updatedEntry;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw new Error('Failed to update journal entry');
    }
  }

  /**
   * Delete journal entry
   */
  async deleteEntry(id: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      try {
        // Delete AI suggestions first
        await client.query('DELETE FROM ai_suggestions WHERE journal_entry_id = $1', [id]);
        
        // Delete journal entry
        const result = await client.query('DELETE FROM journal_entries WHERE id = $1', [id]);
        
        return (result.rowCount ?? 0) > 0;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return false;
    }
  }

  /**
   * Get journal statistics
   */
  async getStats(): Promise<JournalStats> {
    try {
      const client = await this.getClient();
      
      try {
        // Get total entries
        const totalResult = await client.query('SELECT COUNT(*) as total FROM journal_entries');
        const totalEntries = parseInt(totalResult.rows[0].total);

        // Get entries by category
        const categoryResult = await client.query(`
          SELECT category, COUNT(*) as count 
          FROM journal_entries 
          GROUP BY category 
          ORDER BY count DESC
        `);
        const entriesByCategory = categoryResult.rows.reduce((acc, row) => {
          acc[row.category] = parseInt(row.count);
          return acc;
        }, {});

        // Get recent entries
        const recentResult = await client.query(`
          SELECT * FROM journal_entries 
          ORDER BY updated_at DESC 
          LIMIT 5
        `);
        const recentEntries = recentResult.rows.map(row => this.mapRowToEntry(row));

        // Get top tags
        const tagsResult = await client.query(`
          SELECT tag, COUNT(*) as count
          FROM journal_entries, jsonb_array_elements_text(tags) AS tag
          GROUP BY tag
          ORDER BY count DESC
          LIMIT 10
        `);
        const topTags = tagsResult.rows.map(row => ({
          name: row.tag,
          count: parseInt(row.count)
        }));

        // Get AI suggestions stats
        const aiStatsResult = await client.query(`
          SELECT 
            COUNT(*) as total_suggestions,
            COUNT(CASE WHEN implemented = true THEN 1 END) as implemented
          FROM ai_suggestions
        `);
        const aiStats = aiStatsResult.rows[0];

        return {
          totalEntries,
          entriesByCategory,
          recentEntries,
          topTags,
          aiSuggestionsGenerated: parseInt(aiStats.total_suggestions || '0'),
          aiSuggestionsImplemented: parseInt(aiStats.implemented || '0')
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching journal stats:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Search journal entries
   */
  async searchEntries(query: string, filters?: JournalSearchFilters): Promise<JournalEntry[]> {
    try {
      const client = await this.getClient();
      
      try {
        let searchQuery = `
          SELECT je.*, COALESCE(json_agg(
            json_build_object(
              'id', ais.id,
              'type', ais.type,
              'suggestion', ais.suggestion,
              'reasoning', ais.reasoning,
              'confidence', ais.confidence,
              'resources', ais.resources,
              'implementationComplexity', ais.implementation_complexity,
              'estimatedTimeToImplement', ais.estimated_time_to_implement,
              'createdAt', ais.created_at
            )
          ) FILTER (WHERE ais.id IS NOT NULL), '[]') as ai_suggestions
          FROM journal_entries je
          LEFT JOIN ai_suggestions ais ON je.id = ais.journal_entry_id
          WHERE (
            je.title ILIKE $1 OR 
            je.content ILIKE $1 OR
            EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(je.tags) AS tag 
              WHERE tag ILIKE $1
            )
          )
        `;
        
        const values = [`%${query}%`];
        let paramCount = 1;
        
        // Add filters
        if (filters?.category) {
          searchQuery += ` AND je.category = $${++paramCount}`;
          values.push(filters.category);
        }
        
        if (filters?.projectId) {
          searchQuery += ` AND je.project_id = $${++paramCount}`;
          values.push(filters.projectId);
        }
        
        searchQuery += `
          GROUP BY je.id, je.title, je.content, je.category, je.project_id, 
                   je.project_name, je.tags, je.architecture_diagrams, 
                   je.related_files, je.metadata, je.created_at, je.updated_at
          ORDER BY je.updated_at DESC
          LIMIT 50
        `;
        
        const result = await client.query(searchQuery, values);
        return result.rows.map(row => this.mapRowToEntryWithSuggestions(row));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error searching journal entries:', error);
      return [];
    }
  }

  /**
   * Generate AI suggestions for an entry
   */
  async generateAISuggestions(entry: JournalEntry): Promise<AISuggestion[]> {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/ai/journal-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entry.id,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          projectId: entry.projectId,
          tags: entry.tags,
          metadata: entry.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`AI suggestions API failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.suggestions) {
        // Store suggestions in database
        await this.storeAISuggestions(entry.id, result.suggestions);
        return result.suggestions;
      } else {
        throw new Error(result.error || 'Invalid AI suggestions response');
      }
      
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      return [];
    }
  }

  /**
   * Mark AI suggestion as implemented
   */
  async markSuggestionImplemented(suggestionId: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      
      try {
        const result = await client.query(
          'UPDATE ai_suggestions SET implemented = true, implemented_at = $1 WHERE id = $2',
          [new Date(), suggestionId]
        );
        
        return (result.rowCount ?? 0) > 0;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error marking suggestion as implemented:', error);
      return false;
    }
  }

  /**
   * Get all existing tags for autocomplete
   */
  async getAllTags(query: string = '', limit: number = 20): Promise<string[]> {
    try {
      const client = await this.getClient();
      
      try {
        let searchQuery = `
          SELECT tag, COUNT(*) as usage_count
          FROM journal_entries, jsonb_array_elements_text(tags) AS tag
        `;
        
        const values: any[] = [];
        let paramCount = 0;
        
        if (query.trim()) {
          searchQuery += ` WHERE tag ILIKE $${++paramCount}`;
          values.push(`%${query.trim()}%`);
        }
        
        searchQuery += `
          GROUP BY tag
          ORDER BY usage_count DESC, tag ASC
          LIMIT $${++paramCount}
        `;
        values.push(limit);
        
        const result = await client.query(searchQuery, values);
        return result.rows.map(row => row.tag);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      // Return fallback tags for development
      const fallbackTags = [
        'architecture', 'ai', 'performance', 'debugging', 'team-issues', 
        'reminders', 'ideas', 'planning', 'milestone', 'research',
        'optimization', 'security', 'scalability', 'refactoring',
        'documentation', 'testing', 'deployment', 'monitoring'
      ];
      
      if (query.trim()) {
        return fallbackTags.filter(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
      }
      
      return fallbackTags.slice(0, limit);
    }
  }

  /**
   * Create reminder from next steps
   */
  async createReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reminder> {
    try {
      const client = await this.getClient();
      
      try {
        const id = this.generateId().replace('journal_', 'reminder_');
        const now = new Date();
        
        const query = `
          INSERT INTO reminders (
            id, title, description, due_date, priority, category,
            status, related_entry_id, next_step_index, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        
        const values = [
          id,
          reminder.title,
          reminder.description || null,
          reminder.dueDate,
          reminder.priority,
          reminder.category,
          'pending',
          reminder.relatedEntryId || null,
          reminder.nextStepIndex || null,
          now,
          now
        ];
        
        const result = await client.query(query, values);
        return this.mapRowToReminder(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw new Error('Failed to create reminder');
    }
  }

  /**
   * Get reminders with filtering
   */
  async getReminders(status: string = 'all', limit: number = 50): Promise<Reminder[]> {
    try {
      const client = await this.getClient();
      
      try {
        let query = 'SELECT * FROM reminders';
        const values: any[] = [];
        let paramCount = 0;
        
        if (status !== 'all') {
          if (status === 'overdue') {
            query += ' WHERE status = $1 AND due_date < $2';
            values.push('pending', new Date());
            paramCount = 2;
          } else {
            query += ' WHERE status = $1';
            values.push(status);
            paramCount = 1;
          }
        }
        
        query += ` ORDER BY 
          CASE 
            WHEN priority = 'urgent' THEN 1
            WHEN priority = 'high' THEN 2
            WHEN priority = 'medium' THEN 3
            WHEN priority = 'low' THEN 4
          END,
          due_date ASC
          LIMIT $${++paramCount}
        `;
        values.push(limit);
        
        const result = await client.query(query, values);
        return result.rows.map(row => this.mapRowToReminder(row));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  }

  /**
   * Update reminder status
   */
  async updateReminderStatus(id: string, updates: { status?: string; completedAt?: Date }): Promise<Reminder | null> {
    try {
      const client = await this.getClient();
      
      try {
        const setClause: string[] = ['updated_at = $1'];
        const values: any[] = [new Date()];
        let paramCount = 1;
        
        if (updates.status) {
          setClause.push(`status = $${++paramCount}`);
          values.push(updates.status);
        }
        
        if (updates.completedAt) {
          setClause.push(`completed_at = $${++paramCount}`);
          values.push(updates.completedAt);
        }
        
        values.push(id);
        
        const query = `
          UPDATE reminders 
          SET ${setClause.join(', ')}
          WHERE id = $${++paramCount}
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return this.mapRowToReminder(result.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw new Error('Failed to update reminder');
    }
  }

  /**
   * Auto-create reminders from next steps
   */
  async createRemindersFromNextSteps(entryId: string, nextSteps: string[]): Promise<void> {
    try {
      for (let i = 0; i < nextSteps.length; i++) {
        const step = nextSteps[i];
        
        // Create reminder for each next step (due in 3 days by default)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        
        await this.createReminder({
          title: `Next Step: ${step}`,
          description: `Follow-up action from journal entry`,
          dueDate,
          priority: 'medium',
          category: 'next-steps',
          relatedEntryId: entryId,
          nextStepIndex: i
        });
      }
    } catch (error) {
      console.error('Error creating reminders from next steps:', error);
      // Don't throw - this is a nice-to-have feature
    }
  }

  // Private helper methods
  private async getClient(): Promise<PoolClient> {
    // Use the singleton DatabaseService which already handles SSL and connection pooling
    await this.dbService.initialize();
    
    const connectionStatus = this.dbService.getConnectionStatus();
    if (!connectionStatus.connected) {
      throw new Error('Database not available - falling back to in-memory mode');
    }
    
    return this.dbService.getPoolClient();
  }

  private async createTablesIfNotExists(): Promise<void> {
    try {
      const client = await this.getClient();
      
      try {
        // Create journal_entries table
        await client.query(`
          CREATE TABLE IF NOT EXISTS journal_entries (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            content TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            project_id VARCHAR(255),
            project_name VARCHAR(255),
            tags JSONB DEFAULT '[]',
            architecture_diagrams JSONB DEFAULT '[]',
            related_files JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);

        // Create ai_suggestions table
        await client.query(`
          CREATE TABLE IF NOT EXISTS ai_suggestions (
            id VARCHAR(255) PRIMARY KEY,
            journal_entry_id VARCHAR(255) REFERENCES journal_entries(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            suggestion TEXT NOT NULL,
            reasoning TEXT NOT NULL,
            confidence INTEGER DEFAULT 50,
            resources JSONB DEFAULT '[]',
            implementation_complexity VARCHAR(20) DEFAULT 'medium',
            estimated_time_to_implement VARCHAR(100),
            implemented BOOLEAN DEFAULT FALSE,
            implemented_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);

        // Create reminders table
        await client.query(`
          CREATE TABLE IF NOT EXISTS reminders (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            due_date TIMESTAMP WITH TIME ZONE NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            category VARCHAR(50) DEFAULT 'general',
            status VARCHAR(20) DEFAULT 'pending',
            related_entry_id VARCHAR(255) REFERENCES journal_entries(id) ON DELETE CASCADE,
            next_step_index INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
          )
        `);

        // Create indexes for better performance
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_journal_entries_category ON journal_entries(category);
          CREATE INDEX IF NOT EXISTS idx_journal_entries_project_id ON journal_entries(project_id);
          CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
          CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);
          CREATE INDEX IF NOT EXISTS idx_ai_suggestions_entry_id ON ai_suggestions(journal_entry_id);
          CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
          CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
          CREATE INDEX IF NOT EXISTS idx_reminders_priority ON reminders(priority);
          CREATE INDEX IF NOT EXISTS idx_reminders_related_entry ON reminders(related_entry_id);
        `);

        console.log('Journal tables initialized successfully');
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating journal tables:', error);
      throw error;
    }
  }

  private async storeAISuggestions(entryId: string, suggestions: AISuggestion[]): Promise<void> {
    try {
      const client = await this.getClient();
      
      try {
        // Delete existing suggestions for this entry
        await client.query('DELETE FROM ai_suggestions WHERE journal_entry_id = $1', [entryId]);
        
        // Insert new suggestions
        for (const suggestion of suggestions) {
          await client.query(`
            INSERT INTO ai_suggestions (
              id, journal_entry_id, type, suggestion, reasoning, confidence,
              resources, implementation_complexity, estimated_time_to_implement, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            suggestion.id,
            entryId,
            suggestion.type,
            suggestion.suggestion,
            suggestion.reasoning,
            suggestion.confidence,
            JSON.stringify(suggestion.resources || []),
            suggestion.implementationComplexity || 'medium',
            suggestion.estimatedTimeToImplement,
            suggestion.createdAt
          ]);
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error storing AI suggestions:', error);
    }
  }

  private generateId(): string {
    return `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  private mapRowToEntry(row: any): JournalEntry {
    const parseJsonField = (field: any, fallback: any = null) => {
      if (!field) return fallback;
      if (typeof field === 'object') return field; // Already parsed
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (error) {
          console.warn('Failed to parse JSON field:', field, error);
          return fallback;
        }
      }
      return fallback;
    };

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      projectId: row.project_id,
      projectName: row.project_name,
      tags: parseJsonField(row.tags, []),
      architectureDiagrams: parseJsonField(row.architecture_diagrams, []),
      relatedFiles: parseJsonField(row.related_files, []),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: parseJsonField(row.metadata, {})
    };
  }

  private mapRowToEntryWithSuggestions(row: any): JournalEntry {
    const entry = this.mapRowToEntry(row);
    entry.aiSuggestions = row.ai_suggestions || [];
    return entry;
  }

  private mapRowToReminder(row: any): Reminder {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: new Date(row.due_date),
      priority: row.priority,
      category: row.category,
      status: row.status,
      relatedEntryId: row.related_entry_id,
      nextStepIndex: row.next_step_index,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
  }

  private getFallbackEntries(): JournalEntry[] {
    return [
      {
        id: 'sample_entry_1',
        title: 'AI-Driven Architecture Decision',
        content: 'Implemented a new modular architecture pattern that uses AI to optimize resource allocation...',
        category: 'architecture',
        projectId: 'ai-modular-architecture',
        projectName: 'AI-Driven Modular Architecture',
        tags: ['ai', 'architecture', 'performance'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          difficulty: 8,
          impact: 9,
          learnings: ['AI can significantly improve resource allocation', 'Modular patterns scale better'],
          nextSteps: ['Monitor performance metrics', 'Implement auto-scaling']
        }
      }
    ];
  }

  private getFallbackStats(): JournalStats {
    return {
      totalEntries: 1,
      entriesByCategory: { architecture: 1 },
      recentEntries: this.getFallbackEntries(),
      topTags: [{ name: 'architecture', count: 1 }],
      aiSuggestionsGenerated: 0,
      aiSuggestionsImplemented: 0
    };
  }
}

export default JournalService;
