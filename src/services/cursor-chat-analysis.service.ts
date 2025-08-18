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
    interactionStyle: {
      primaryStyle: 'strategic_architect' | 'technical_implementer' | 'learning_explorer' | 'rapid_prototyper' | 'creative_collaborator';
      styleConfidence: number;
      styleBreakdown: {
        strategicArchitect: number;
        technicalImplementer: number;
        learningExplorer: number;
        rapidPrototyper: number;
        creativeCollaborator: number;
      };
      styleInsights: string[];
    };
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
        learningVelocity: 'moderate',
        conversationAnalysis: {
          avgExchanges: 0,
          avgConversationQuality: 0,
          engagementScore: 0,
          questionRate: 0,
          problemSolvingRate: 0,
          codeSharingRate: 0,
          learningRate: 0,
          coachingRecommendations: ['Cursor chat analysis unavailable'],
          conversationInsights: ['Error analyzing cursor conversations'],
          interactionStyle: {
            primaryStyle: 'technical_implementer',
            styleConfidence: 0,
            styleBreakdown: {
              strategicArchitect: 0,
              technicalImplementer: 0,
              learningExplorer: 0,
              rapidPrototyper: 0,
              creativeCollaborator: 0
            },
            styleInsights: ['Style analysis unavailable']
          }
        }
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
    interactionStyle: {
      primaryStyle: 'strategic_architect' | 'technical_implementer' | 'learning_explorer' | 'rapid_prototyper' | 'creative_collaborator';
      styleConfidence: number;
      styleBreakdown: {
        strategicArchitect: number;
        technicalImplementer: number;
        learningExplorer: number;
        rapidPrototyper: number;
        creativeCollaborator: number;
      };
      styleInsights: string[];
    };
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
          conversationInsights: ['No detailed conversation data available'],
          interactionStyle: {
            primaryStyle: 'technical_implementer',
            styleConfidence: 0,
            styleBreakdown: {
              strategicArchitect: 0,
              technicalImplementer: 0,
              learningExplorer: 0,
              rapidPrototyper: 0,
              creativeCollaborator: 0
            },
            styleInsights: ['Insufficient conversation data for style analysis']
          }
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
      
      // Analyze interaction style
      const interactionStyle = this.analyzeInteractionStyle(conversations.rows);
      
      return {
        avgExchanges,
        avgConversationQuality,
        engagementScore,
        questionRate,
        problemSolvingRate,
        codeSharingRate,
        learningRate,
        coachingRecommendations,
        conversationInsights: insights,
        interactionStyle
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
        conversationInsights: ['Error analyzing conversation patterns'],
        interactionStyle: {
          primaryStyle: 'technical_implementer',
          styleConfidence: 0,
          styleBreakdown: {
            strategicArchitect: 0,
            technicalImplementer: 0,
            learningExplorer: 0,
            rapidPrototyper: 0,
            creativeCollaborator: 0
          },
          styleInsights: ['Style analysis unavailable']
        }
      };
    }
  }

  /**
   * Analyze interaction style based on conversation patterns
   */
  private analyzeInteractionStyle(conversations: any[]): {
    primaryStyle: 'strategic_architect' | 'technical_implementer' | 'learning_explorer' | 'rapid_prototyper' | 'creative_collaborator';
    styleConfidence: number;
    styleBreakdown: {
      strategicArchitect: number;
      technicalImplementer: number;
      learningExplorer: number;
      rapidPrototyper: number;
      creativeCollaborator: number;
    };
    styleInsights: string[];
  } {
    let strategicScore = 0;
    let technicalScore = 0;
    let learningScore = 0;
    let prototyperScore = 0;
    let collaboratorScore = 0;
    
    const insights: string[] = [];
    
    for (const chat of conversations) {
      const content = chat.content.toLowerCase();
      
      // Strategic Architect patterns (Enhanced with real 1.83M character conversation analysis)
      const strategicPatterns = {
        // Core direction-giving patterns (704 instances validated)
        directionGiving: /\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm|create|build)\b/g,
        // System thinking patterns (2,504 instances validated)
        systemThinking: /\b(ecosystem|integration|overall|comprehensive|end-to-end|system|architecture|cadis|developer|team)\b/g,
        // Quality control patterns (1,120 instances validated)
        qualityControl: /\b(verify|confirm|test|validate|check|quality|proper|right|should|correct)\b/g,
        // Iterative refinement patterns (177 instances validated)
        iterativeRefinement: /\b(but|however|also|additionally|what about|should also|make sure|scope|expand)\b/g,
        // Problem diagnosis patterns (221 instances validated)
        problemDiagnosis: /\b(what do|why|understand|explain|real issue|root cause|gap|missing|optimize)\b/g,
        // Meta-analysis patterns (validated from conversation)
        metaAnalysis: /\b(analyze.*conversation|define.*styles|framework|pattern|understand.*difference|meta)\b/g,
        // Execution-led refinement patterns (1,755 instances validated)
        executionLed: /\b(do it|execute|implement|build|create|fix|solve|action)\b/g
      };
      
      // Technical Implementer patterns
      const implementerPatterns = {
        problemSolving: /\b(error|bug|issue|fix|debug|not working|broken|fail)\b/g,
        codeSharing: /```[\s\S]*?```|`[^`]+`|\bfunction\b|\bclass\b|\bcomponent\b/g,
        howToQuestions: /\b(how do i|how can i|how to|show me how)\b/g,
        specificRequests: /\b(add|implement|create|build|make|write|code)\b/g
      };
      
      // Learning Explorer patterns
      const learnerPatterns = {
        conceptualQuestions: /\b(why|how does|what is|explain|understand|concept)\b/g,
        bestPractices: /\b(best practice|recommended|should|better way|right way)\b/g,
        comparisons: /\b(difference|compare|versus|vs|better than|which is)\b/g,
        theoretical: /\b(theory|principle|pattern|approach|methodology)\b/g
      };
      
      // Rapid Prototyper patterns
      const prototyperPatterns = {
        speedFocus: /\b(quick|fast|rapid|quickly|asap|urgent|deadline)\b/g,
        mvpMentality: /\b(mvp|basic|simple|minimal|prototype|proof of concept)\b/g,
        pragmaticApproach: /\b(good enough|for now|later|temporary|quick fix)\b/g,
        timeConstraints: /\b(time|schedule|deadline|rush|hurry)\b/g
      };
      
      // Creative Collaborator patterns
      const collaboratorPatterns = {
        brainstorming: /\b(ideas|creative|innovative|alternative|brainstorm)\b/g,
        userExperience: /\b(user|ux|ui|experience|intuitive|usable)\b/g,
        designThinking: /\b(design|aesthetic|visual|layout|style|theme)\b/g,
        exploration: /\b(explore|experiment|try|different|unique)\b/g
      };
      
      // Count pattern matches
      strategicScore += this.countPatternMatches(content, strategicPatterns);
      technicalScore += this.countPatternMatches(content, implementerPatterns);
      learningScore += this.countPatternMatches(content, learnerPatterns);
      prototyperScore += this.countPatternMatches(content, prototyperPatterns);
      collaboratorScore += this.countPatternMatches(content, collaboratorPatterns);
    }
    
    // Normalize scores
    const totalScore = strategicScore + technicalScore + learningScore + prototyperScore + collaboratorScore;
    
    if (totalScore === 0) {
      return {
        primaryStyle: 'technical_implementer',
        styleConfidence: 0,
        styleBreakdown: {
          strategicArchitect: 0,
          technicalImplementer: 0,
          learningExplorer: 0,
          rapidPrototyper: 0,
          creativeCollaborator: 0
        },
        styleInsights: ['Insufficient data for style analysis']
      };
    }
    
    const styleBreakdown = {
      strategicArchitect: Math.round((strategicScore / totalScore) * 100),
      technicalImplementer: Math.round((technicalScore / totalScore) * 100),
      learningExplorer: Math.round((learningScore / totalScore) * 100),
      rapidPrototyper: Math.round((prototyperScore / totalScore) * 100),
      creativeCollaborator: Math.round((collaboratorScore / totalScore) * 100)
    };
    
    // Determine primary style
    const maxScore = Math.max(
      styleBreakdown.strategicArchitect,
      styleBreakdown.technicalImplementer,
      styleBreakdown.learningExplorer,
      styleBreakdown.rapidPrototyper,
      styleBreakdown.creativeCollaborator
    );
    
    let primaryStyle: 'strategic_architect' | 'technical_implementer' | 'learning_explorer' | 'rapid_prototyper' | 'creative_collaborator' = 'technical_implementer';
    
    if (styleBreakdown.strategicArchitect === maxScore) primaryStyle = 'strategic_architect';
    else if (styleBreakdown.technicalImplementer === maxScore) primaryStyle = 'technical_implementer';
    else if (styleBreakdown.learningExplorer === maxScore) primaryStyle = 'learning_explorer';
    else if (styleBreakdown.rapidPrototyper === maxScore) primaryStyle = 'rapid_prototyper';
    else if (styleBreakdown.creativeCollaborator === maxScore) primaryStyle = 'creative_collaborator';
    
    // Generate style insights (Enhanced with real conversation analysis)
    if (styleBreakdown.strategicArchitect > 60) {
      insights.push('EXCEPTIONAL strategic thinking - demonstrates Strategic Architect mastery with execution-led refinement patterns');
    } else if (styleBreakdown.strategicArchitect > 40) {
      insights.push('Shows strong strategic thinking and system-level approach - developing Strategic Architect capabilities');
    } else if (styleBreakdown.strategicArchitect > 20) {
      insights.push('Emerging strategic thinking potential - could benefit from Strategic Architect coaching');
    }
    if (styleBreakdown.technicalImplementer > 60) {
      insights.push('Primarily focused on technical implementation and problem-solving');
    }
    if (styleBreakdown.learningExplorer > 50) {
      insights.push('Demonstrates strong learning curiosity and conceptual thinking');
    }
    if (styleBreakdown.rapidPrototyper > 30) {
      insights.push('Shows pragmatic, speed-focused development approach');
    }
    if (styleBreakdown.creativeCollaborator > 30) {
      insights.push('Exhibits creative problem-solving and design thinking');
    }
    
    // Mixed style detection
    const topTwoStyles = Object.entries(styleBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);
    
    if (topTwoStyles[1][1] > 25) {
      insights.push(`Hybrid style: Primary ${primaryStyle.replace('_', ' ')} with strong ${topTwoStyles[1][0].replace(/([A-Z])/g, ' $1').toLowerCase()} tendencies`);
    }
    
    return {
      primaryStyle,
      styleConfidence: maxScore,
      styleBreakdown,
      styleInsights: insights
    };
  }
  
  /**
   * Count pattern matches in content
   */
  private countPatternMatches(content: string, patterns: Record<string, RegExp>): number {
    let count = 0;
    for (const pattern of Object.values(patterns)) {
      const matches = content.match(pattern);
      count += matches ? matches.length : 0;
    }
    return count;
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
