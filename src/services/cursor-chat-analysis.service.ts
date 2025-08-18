import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface CursorChatAnalysis {
  developerId: string;
  totalChats: number;
  recentActivity: number;
  problemSolvingPatterns: string[];
  learningIndicators: string[];
  collaborationScore: number;
  independenceLevel: number;
  technicalTopics: string[];
  avgContentLength: number;
  chatFrequency: 'high' | 'medium' | 'low';
  learningVelocity: 'fast' | 'moderate' | 'slow';
}

/**
 * Cursor Chat Analysis Service (Singleton)
 * Analyzes cursor chat patterns for developer coaching insights
 * Now integrated with VIBEZS_DB after migration from SUPABASE_DB
 */
class CursorChatAnalysisService {
  private static instance: CursorChatAnalysisService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): CursorChatAnalysisService {
    if (!CursorChatAnalysisService.instance) {
      CursorChatAnalysisService.instance = new CursorChatAnalysisService();
    }
    return CursorChatAnalysisService.instance;
  }

  /**
   * Analyze cursor chats for a specific developer
   */
  async analyzeDeveloperCursorChats(developerId: string): Promise<CursorChatAnalysis> {
    try {
      const client = await this.getClient();
      
      try {
        // Get cursor chats for this developer
        const cursorChats = await client.query(`
          SELECT 
            cc.*,
            LENGTH(cc.content) as content_length
          FROM cursor_chats cc
          WHERE cc.developer_id::text = $1::text
          ORDER BY cc.created_at DESC
        `, [developerId]);

        const recentChats = await client.query(`
          SELECT COUNT(*) as count
          FROM cursor_chats cc
          WHERE cc.developer_id::text = $1::text
          AND cc.created_at > NOW() - INTERVAL '30 days'
        `, [developerId]);

        const totalChats = cursorChats.rows.length;
        const recentActivity = parseInt(recentChats.rows[0]?.count || '0');

        if (totalChats === 0) {
          return {
            developerId,
            totalChats: 0,
            recentActivity: 0,
            problemSolvingPatterns: ['No cursor chat data available'],
            learningIndicators: ['Encourage cursor usage for development'],
            collaborationScore: 50,
            independenceLevel: 50,
            technicalTopics: [],
            avgContentLength: 0,
            chatFrequency: 'low',
            learningVelocity: 'slow'
          };
        }

        // Analyze chat patterns
        let problemSolvingChats = 0;
        let learningIndicatorChats = 0;
        let technicalDiscussions = 0;
        const problemSolvingPatterns: string[] = [];
        const learningIndicators: string[] = [];
        const technicalTopics: string[] = [];
        let totalContentLength = 0;

        cursorChats.rows.forEach(chat => {
          const content = (chat.content || '').toLowerCase();
          const title = (chat.chat_title || '').toLowerCase();
          totalContentLength += chat.content_length || 0;

          // Problem-solving patterns
          if (content.includes('error') || content.includes('bug') || content.includes('fix') || 
              content.includes('debug') || title.includes('fix')) {
            problemSolvingChats++;
            problemSolvingPatterns.push('Error debugging and resolution');
          }

          if (content.includes('optimize') || content.includes('refactor') || content.includes('improve')) {
            problemSolvingPatterns.push('Code optimization and improvement');
          }

          if (content.includes('test') || content.includes('testing') || title.includes('test')) {
            problemSolvingPatterns.push('Testing and quality assurance');
          }

          // Learning indicators
          if (content.includes('how to') || content.includes('learn') || content.includes('understand') ||
              content.includes('explain') || content.includes('what is')) {
            learningIndicatorChats++;
            learningIndicators.push('Seeks explanations and understanding');
          }

          if (content.includes('best practice') || content.includes('recommended') || content.includes('should i')) {
            learningIndicators.push('Asks for best practices and guidance');
          }

          if (content.includes('tutorial') || content.includes('example') || content.includes('documentation')) {
            learningIndicators.push('Studies documentation and examples');
          }

          // Technical topics
          if (content.includes('component') || title.includes('component')) {
            technicalTopics.push('React Components');
          }
          if (content.includes('api') || title.includes('api')) {
            technicalTopics.push('API Development');
          }
          if (content.includes('database') || content.includes('sql') || title.includes('database')) {
            technicalTopics.push('Database Management');
          }
          if (content.includes('typescript') || content.includes('javascript')) {
            technicalTopics.push('TypeScript/JavaScript');
          }
          if (content.includes('css') || content.includes('style') || content.includes('design')) {
            technicalTopics.push('UI/CSS Design');
          }
        });

        const avgContentLength = Math.round(totalContentLength / totalChats);

        // Calculate scores
        const collaborationScore = Math.min(100, 
          (problemSolvingChats * 15) + 
          (technicalDiscussions * 10) + 
          (totalChats * 3)
        );

        const independenceLevel = Math.max(20, Math.min(100,
          100 - (learningIndicatorChats * 8) + (problemSolvingChats * 5)
        ));

        // Determine chat frequency
        let chatFrequency: 'high' | 'medium' | 'low' = 'low';
        if (recentActivity >= 15) chatFrequency = 'high';
        else if (recentActivity >= 5) chatFrequency = 'medium';

        // Determine learning velocity
        let learningVelocity: 'fast' | 'moderate' | 'slow' = 'slow';
        const learningRate = learningIndicatorChats / totalChats;
        if (learningRate <= 0.2) learningVelocity = 'fast'; // Low questions = fast learning
        else if (learningRate <= 0.4) learningVelocity = 'moderate';

        return {
          developerId,
          totalChats,
          recentActivity,
          problemSolvingPatterns: [...new Set(problemSolvingPatterns)],
          learningIndicators: [...new Set(learningIndicators)],
          collaborationScore: Math.round(collaborationScore),
          independenceLevel: Math.round(independenceLevel),
          technicalTopics: [...new Set(technicalTopics)],
          avgContentLength,
          chatFrequency,
          learningVelocity
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.warn(`Error analyzing cursor chats for ${developerId}:`, error instanceof Error ? error.message : String(error));
      return {
        developerId,
        totalChats: 0,
        recentActivity: 0,
        problemSolvingPatterns: ['Analysis unavailable'],
        learningIndicators: ['Cursor chat analysis pending'],
        collaborationScore: 60,
        independenceLevel: 70,
        technicalTopics: [],
        avgContentLength: 0,
        chatFrequency: 'low',
        learningVelocity: 'moderate'
      };
    }
  }

  /**
   * Analyze all active developers' cursor chats
   */
  async analyzeTeamCursorChats(): Promise<CursorChatAnalysis[]> {
    try {
      const client = await this.getClient();
      
      try {
        // Get active developers
        const activeDevelopers = await client.query(`
          SELECT id, name, email, role
          FROM developers 
          WHERE status = 'active' 
          AND contract_signed = true
          AND (
            name ILIKE '%alfredo%' 
            OR email = 'estopaceadrian@gmail.com'
            OR name ILIKE '%enrique%'
          )
          ORDER BY updated_at DESC
        `);

        const analyses: CursorChatAnalysis[] = [];

        for (const developer of activeDevelopers.rows) {
          const analysis = await this.analyzeDeveloperCursorChats(developer.id);
          analyses.push(analysis);
        }

        return analyses;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error analyzing team cursor chats:', error);
      return [];
    }
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient(); // Uses VIBEZS_DB connection
  }
}

export default CursorChatAnalysisService;
