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
  // Enhanced conversation analysis
  conversationAnalysis?: {
    avgExchanges: number;
    avgConversationQuality: number;
    engagementScore: number;
    questionRate: number;
    problemSolvingRate: number;
    codeSharingRate: number;
    learningRate: number;
    coachingRecommendations: string[];
    conversationInsights: string[];
  };
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

        // Enhanced conversation analysis
        const conversationAnalysis = await this.analyzeConversationContent(client, developerId);

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
          learningVelocity,
          conversationAnalysis
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

  /**
   * Analyze actual conversation content for enhanced insights
   */
  private async analyzeConversationContent(client: PoolClient, developerId: string): Promise<{
    avgExchanges: number;
    avgConversationQuality: number;
    engagementScore: number;
    questionRate: number;
    problemSolvingRate: number;
    codeSharingRate: number;
    learningRate: number;
    coachingRecommendations: string[];
    conversationInsights: string[];
  }> {
    try {
      // Get recent conversations for detailed analysis
      const conversations = await client.query(`
        SELECT 
          cc.id, cc.title, cc.filename, cc.content, cc.tags, cc.project_context,
          cc.created_at, cc.file_size
        FROM cursor_chats cc
        WHERE cc.developer_id::text = $1::text
        AND cc.content IS NOT NULL
        AND LENGTH(cc.content) > 1000
        ORDER BY cc.created_at DESC
        LIMIT 10
      `, [developerId]);
      
      if (conversations.rows.length === 0) {
        return {
          avgExchanges: 0,
          avgConversationQuality: 0,
          engagementScore: 0,
          questionRate: 0,
          problemSolvingRate: 0,
          codeSharingRate: 0,
          learningRate: 0,
          coachingRecommendations: ['Encourage cursor usage for development assistance'],
          conversationInsights: ['No detailed conversation data available']
        };
      }
      
      let totalQuestionAsking = 0;
      let totalProblemSolving = 0;
      let totalCodeSharing = 0;
      let totalLearning = 0;
      let totalExchanges = 0;
      let totalConversationQuality = 0;
      
      const insights: string[] = [];
      
      // Analyze each conversation
      for (const chat of conversations.rows) {
        const content = chat.content;
        const lowerContent = content.toLowerCase();
        
        // Count conversation exchanges
        const userMessages = (content.match(/(\*\*User\*\*|\*\*Human\*\*|User:|Human:)/g) || []).length;
        const aiMessages = (content.match(/(\*\*Assistant\*\*|\*\*Cursor\*\*|Assistant:|Cursor:)/g) || []).length;
        const exchanges = Math.max(userMessages, aiMessages);
        totalExchanges += exchanges;
        
        // Analyze conversation patterns
        const hasQuestions = /\b(how do i|how can i|what is|why does|where should|when to)\b/i.test(content);
        const hasProblemSolving = /\b(error|issue|problem|bug|fail)\b/i.test(content);
        const hasCodeSharing = /```|`[^`]+`|\bcode\b|\bfunction\b|\bclass\b/i.test(content);
        const hasLearning = /\b(explain|why|how does this work|what does this do|learn)\b/i.test(content);
        
        if (hasQuestions) totalQuestionAsking++;
        if (hasProblemSolving) totalProblemSolving++;
        if (hasCodeSharing) totalCodeSharing++;
        if (hasLearning) totalLearning++;
        
        // Calculate individual conversation quality
        const developerEngagement = [hasQuestions, hasProblemSolving, hasCodeSharing, hasLearning].filter(Boolean).length;
        const conversationQuality = Math.round((developerEngagement / 4) * 100);
        totalConversationQuality += conversationQuality;
      }
      
      const conversationCount = conversations.rows.length;
      const avgExchanges = Math.round(totalExchanges / conversationCount);
      const avgConversationQuality = Math.round(totalConversationQuality / conversationCount);
      
      // Calculate engagement rates
      const questionRate = Math.round((totalQuestionAsking / conversationCount) * 100);
      const problemSolvingRate = Math.round((totalProblemSolving / conversationCount) * 100);
      const codeSharingRate = Math.round((totalCodeSharing / conversationCount) * 100);
      const learningRate = Math.round((totalLearning / conversationCount) * 100);
      
      // Calculate overall engagement score
      const engagementScore = Math.round((questionRate + problemSolvingRate + codeSharingRate + learningRate) / 4);
      
      // Generate insights based on patterns
      if (questionRate < 20) {
        insights.push(`Low question-asking rate (${questionRate}%) - encourage more curiosity and inquiry`);
      } else if (questionRate > 60) {
        insights.push(`Excellent question-asking approach (${questionRate}%) - shows strong learning mindset`);
      }
      
      if (learningRate < 50) {
        insights.push(`Learning conversations could be improved (${learningRate}%) - encourage explanation requests`);
      } else if (learningRate > 80) {
        insights.push(`Outstanding learning engagement (${learningRate}%) - actively seeks understanding`);
      }
      
      if (codeSharingRate > 90) {
        insights.push(`Excellent code-sharing patterns (${codeSharingRate}%) - highly technical interactions`);
      }
      
      if (problemSolvingRate > 80) {
        insights.push(`Strong problem-solving focus (${problemSolvingRate}%) - effectively uses AI for debugging`);
      }
      
      if (engagementScore >= 80) {
        insights.push('EXCELLENT cursor usage - highly engaged and productive developer');
      } else if (engagementScore >= 60) {
        insights.push('GOOD cursor usage - well engaged with room for growth');
      } else {
        insights.push('MODERATE cursor usage - could benefit from more interactive engagement');
      }
      
      // Generate coaching recommendations
      const coachingRecommendations = this.generateCoachingRecommendations(questionRate, learningRate, engagementScore);
      
      return {
        avgExchanges,
        avgConversationQuality,
        engagementScore,
        questionRate,
        problemSolvingRate,
        codeSharingRate,
        learningRate,
        coachingRecommendations,
        conversationInsights: insights
      };
      
    } catch (error) {
      console.warn('Error analyzing conversation content:', error instanceof Error ? error.message : String(error));
      return {
        avgExchanges: 0,
        avgConversationQuality: 0,
        engagementScore: 0,
        questionRate: 0,
        problemSolvingRate: 0,
        codeSharingRate: 0,
        learningRate: 0,
        coachingRecommendations: ['Conversation analysis unavailable'],
        conversationInsights: ['Error analyzing conversation patterns']
      };
    }
  }

  /**
   * Generate personalized coaching recommendations
   */
  private generateCoachingRecommendations(questionRate: number, learningRate: number, engagementScore: number): string[] {
    const recommendations: string[] = [];
    
    if (questionRate < 20) {
      recommendations.push('🎯 Encourage more curiosity: Ask "how" and "why" questions to deepen understanding');
      recommendations.push('📚 Practice inquiry-driven development: Question assumptions and explore alternatives');
    }
    
    if (learningRate < 50) {
      recommendations.push('🧠 Request explanations: Ask AI to explain code logic and decision-making processes');
      recommendations.push('📖 Seek conceptual understanding: Focus on "why" something works, not just "how"');
    }
    
    if (engagementScore < 60) {
      recommendations.push('💬 Increase interaction depth: Engage in multi-turn conversations for complex problems');
      recommendations.push('🔍 Explore edge cases: Discuss potential issues and alternative approaches');
    } else if (engagementScore > 80) {
      recommendations.push('⭐ Excellent engagement model: Share approach with team for best practices');
      recommendations.push('🏆 Mentor others: Help colleagues improve their cursor interaction patterns');
    }
    
    return recommendations;
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient(); // Uses VIBEZS_DB connection
  }
}

export default CursorChatAnalysisService;
