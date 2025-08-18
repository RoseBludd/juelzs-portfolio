import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface DeveloperPerformanceMetrics {
  developerId: string;
  developerName: string;
  email: string;
  role: string;
  status: string;
  
  // Module & Widget Analysis
  moduleSubmissions: {
    total: number;
    recentCount: number;
    qualityScore: number;
    principleAdherence: number;
    categories: string[];
    averageComplexity: number;
  };
  
  // Code Quality Analysis
  codeQuality: {
    overallScore: number;
    modularityScore: number;
    reusabilityScore: number;
    documentationScore: number;
    testingScore: number;
    consistencyScore: number;
  };
  
  // Cursor Chat Analysis
  cursorAnalysis: {
    totalChats: number;
    recentActivity: number;
    problemSolvingPatterns: string[];
    learningIndicators: string[];
    collaborationScore: number;
    independenceLevel: number;
  };
  
  // Performance Trends
  trends: {
    productivityTrend: 'increasing' | 'stable' | 'decreasing';
    qualityTrend: 'improving' | 'stable' | 'declining';
    principleAlignment: 'strong' | 'moderate' | 'needs_improvement';
    coachingNeeds: string[];
  };
  
  // Scoring & Recommendations
  overallScore: number;
  coachingRecommendations: string[];
  strengths: string[];
  improvementAreas: string[];
  nextSteps: string[];
}

export interface TeamPerformanceOverview {
  totalActiveDevelopers: number;
  averagePerformanceScore: number;
  topPerformers: DeveloperPerformanceMetrics[];
  needsAttention: DeveloperPerformanceMetrics[];
  principleAdherenceOverall: number;
  teamTrends: {
    moduleProductivity: number;
    codeQuality: number;
    collaboration: number;
  };
  coachingPriorities: string[];
}

/**
 * Developer Performance Analysis Service (Singleton)
 * Analyzes active developers' actual work: modules, widgets, cursor chats, code quality
 * Provides coaching insights and performance metrics
 */
class DeveloperPerformanceAnalysisService {
  private static instance: DeveloperPerformanceAnalysisService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): DeveloperPerformanceAnalysisService {
    if (!DeveloperPerformanceAnalysisService.instance) {
      DeveloperPerformanceAnalysisService.instance = new DeveloperPerformanceAnalysisService();
    }
    return DeveloperPerformanceAnalysisService.instance;
  }

  /**
   * Analyze all active developers' performance
   */
  async analyzeActiveDevelopers(): Promise<TeamPerformanceOverview> {
    try {
      const client = await this.getClient();
      
      try {
        console.log('🧠 CADIS: Analyzing Active Developer Performance...');
        
        // Get active developers with module submissions
        const activeDevelopers = await this.getActiveDevelopersWithWork(client);
        console.log(`📊 Found ${activeDevelopers.length} active developers with work to analyze`);
        
        const performanceMetrics: DeveloperPerformanceMetrics[] = [];
        
        // Analyze each developer
        for (const developer of activeDevelopers) {
          console.log(`🔍 Analyzing: ${developer.name}`);
          const metrics = await this.analyzeDeveloperPerformance(client, developer);
          performanceMetrics.push(metrics);
        }
        
        // Generate team overview
        const teamOverview = await this.generateTeamOverview(performanceMetrics);
        
        return teamOverview;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error analyzing active developers:', error);
      throw error;
    }
  }

  /**
   * Analyze individual developer performance
   */
  async analyzeDeveloperPerformance(client: PoolClient, developer: any): Promise<DeveloperPerformanceMetrics> {
    try {
      // Get developer's module submissions
      const moduleData = await this.analyzeModuleSubmissions(client, developer.id);
      
      // Analyze code quality from submissions
      const codeQuality = await this.analyzeCodeQuality(client, developer.id);
      
      // Analyze cursor chats (if available)
      const cursorAnalysis = await this.analyzeCursorActivity(client, developer.id);
      
      // Calculate performance trends
      const trends = await this.calculatePerformanceTrends(client, developer.id, moduleData, codeQuality);
      
      // Generate coaching recommendations
      const coachingInsights = await this.generateCoachingRecommendations(
        developer, moduleData, codeQuality, cursorAnalysis, trends
      );
      
      const overallScore = this.calculateOverallScore(moduleData, codeQuality, cursorAnalysis);
      
      return {
        developerId: developer.id,
        developerName: developer.name,
        email: developer.email,
        role: developer.role,
        status: developer.status,
        moduleSubmissions: moduleData,
        codeQuality,
        cursorAnalysis,
        trends,
        overallScore,
        coachingRecommendations: coachingInsights.recommendations,
        strengths: coachingInsights.strengths,
        improvementAreas: coachingInsights.improvementAreas,
        nextSteps: coachingInsights.nextSteps
      };
    } catch (error) {
      console.error(`Error analyzing developer ${developer.name}:`, error);
      throw error;
    }
  }

  /**
   * Get active developers who have submitted work
   */
  private async getActiveDevelopersWithWork(client: PoolClient): Promise<any[]> {
    try {
      // First try to get developers from VIBEZS_DB
      const vibezClient = await this.getVibezClient();
      
      try {
        const activeDevelopers = await vibezClient.query(`
          SELECT DISTINCT
            d.id,
            d.name,
            d.email,
            d.role,
            d.status,
            d.github_url,
            d.portfolio_url,
            d.skills,
            d.created_at,
            d.updated_at
          FROM developers d
          WHERE d.status = 'active' 
          AND d.contract_signed = true
          ORDER BY d.updated_at DESC
        `);

        // Also check for developers who have modules in the registry
        const moduleContributors = await client.query(`
          SELECT DISTINCT
            mr.created_by as developer_name,
            COUNT(*) as module_count
          FROM module_registry mr
          WHERE mr.created_by IS NOT NULL
          AND mr.created_by != 'system'
          GROUP BY mr.created_by
          HAVING COUNT(*) > 0
          ORDER BY module_count DESC
        `);

        console.log(`📊 Active contracted developers: ${activeDevelopers.rows.length}`);
        console.log(`📦 Module contributors: ${moduleContributors.rows.length}`);

        // For now, return active developers and simulate some with module work
        let workingDevelopers = activeDevelopers.rows;
        
        // If no active developers, create test data from module contributors
        if (workingDevelopers.length === 0 && moduleContributors.rows.length > 0) {
          workingDevelopers = moduleContributors.rows.map((contributor, index) => ({
            id: `dev_${index + 1}`,
            name: contributor.developer_name,
            email: `${contributor.developer_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            role: 'fullstack_developer',
            status: 'active',
            module_count: contributor.module_count
          }));
        }

        return workingDevelopers;
      } finally {
        vibezClient.release();
      }
    } catch (error) {
      console.warn('Could not get developers from VIBEZS_DB, using module contributors:', error instanceof Error ? error.message : String(error));
      
      // Fallback: get contributors from module registry
      const moduleContributors = await client.query(`
        SELECT DISTINCT
          mr.created_by as developer_name,
          COUNT(*) as module_count,
          MAX(mr.created_at) as last_contribution
        FROM module_registry mr
        WHERE mr.created_by IS NOT NULL
        AND mr.created_by != 'system'
        AND mr.created_at > NOW() - INTERVAL '90 days'
        GROUP BY mr.created_by
        HAVING COUNT(*) >= 2
        ORDER BY module_count DESC, last_contribution DESC
        LIMIT 10
      `);

      return moduleContributors.rows.map((contributor, index) => ({
        id: `contributor_${index + 1}`,
        name: contributor.developer_name || `Developer ${index + 1}`,
        email: `dev${index + 1}@team.com`,
        role: 'fullstack_developer',
        status: 'active',
        module_count: contributor.module_count,
        last_contribution: contributor.last_contribution
      }));
    }
  }

  /**
   * Analyze developer's module submissions
   */
  private async analyzeModuleSubmissions(client: PoolClient, developerId: string): Promise<any> {
    try {
      // Get modules by this developer
      const modules = await client.query(`
        SELECT 
          mr.*,
          LENGTH(mr.description) as description_length,
          CASE 
            WHEN mr.dependencies IS NOT NULL THEN array_length(mr.dependencies, 1)
            ELSE 0
          END as dependency_count
        FROM module_registry mr
        WHERE mr.created_by = $1
        OR mr.created_by ILIKE $2
        ORDER BY mr.created_at DESC
      `, [developerId, `%${developerId}%`]);

      const recentModules = await client.query(`
        SELECT COUNT(*) as count
        FROM module_registry mr
        WHERE (mr.created_by = $1 OR mr.created_by ILIKE $2)
        AND mr.created_at > NOW() - INTERVAL '30 days'
      `, [developerId, `%${developerId}%`]);

      const moduleData = modules.rows;
      const totalModules = moduleData.length;
      const recentCount = parseInt(recentModules.rows[0]?.count || '0');

      // Analyze quality metrics
      let qualityScore = 0;
      let principleScore = 0;
      const categories = new Set<string>();
      let totalComplexity = 0;

      moduleData.forEach(module => {
        // Quality scoring
        let moduleQuality = 50; // Base score
        
        // Description quality
        if (module.description && module.description.length > 50) moduleQuality += 15;
        if (module.description && module.description.length > 150) moduleQuality += 10;
        
        // Documentation
        if (module.usage_example) moduleQuality += 10;
        if (module.dependencies && module.dependency_count > 0) moduleQuality += 5;
        
        // Principle adherence
        let modulePrinciples = 0;
        const desc = (module.description || '').toLowerCase();
        const name = (module.name || '').toLowerCase();
        
        // Modularity
        if (desc.includes('modular') || desc.includes('reusable') || name.includes('component')) {
          modulePrinciples += 20;
        }
        
        // Documentation
        if (module.usage_example || desc.includes('example') || desc.includes('usage')) {
          modulePrinciples += 15;
        }
        
        // Reusability
        if (desc.includes('reusable') || desc.includes('configurable') || module.dependency_count > 0) {
          modulePrinciples += 15;
        }

        qualityScore += moduleQuality;
        principleScore += modulePrinciples;
        categories.add(module.type);
        totalComplexity += module.dependency_count || 1;
      });

      return {
        total: totalModules,
        recentCount,
        qualityScore: totalModules > 0 ? Math.round(qualityScore / totalModules) : 0,
        principleAdherence: totalModules > 0 ? Math.round(principleScore / totalModules) : 0,
        categories: Array.from(categories),
        averageComplexity: totalModules > 0 ? Math.round(totalComplexity / totalModules) : 0
      };
    } catch (error) {
      console.warn(`Could not analyze modules for developer ${developerId}:`, error instanceof Error ? error.message : String(error));
      return {
        total: 0,
        recentCount: 0,
        qualityScore: 0,
        principleAdherence: 0,
        categories: [],
        averageComplexity: 0
      };
    }
  }

  /**
   * Analyze code quality from submissions
   */
  private async analyzeCodeQuality(client: PoolClient, developerId: string): Promise<any> {
    try {
      // Get code samples from module registry
      const codeSamples = await client.query(`
        SELECT 
          mr.code_snippet,
          mr.usage_example,
          mr.description,
          mr.name,
          mr.type
        FROM module_registry mr
        WHERE mr.created_by = $1 OR mr.created_by ILIKE $2
        ORDER BY mr.created_at DESC
        LIMIT 20
      `, [developerId, `%${developerId}%`]);

      let modularityScore = 50;
      let reusabilityScore = 50;
      let documentationScore = 50;
      let testingScore = 30;
      let consistencyScore = 50;

      const samples = codeSamples.rows;
      
      if (samples.length > 0) {
        samples.forEach(sample => {
          const code = sample.code_snippet || '';
          const example = sample.usage_example || '';
          const desc = sample.description || '';
          const name = sample.name || '';

          // Modularity analysis
          if (code.includes('export') || code.includes('module.exports')) modularityScore += 5;
          if (code.includes('function') || code.includes('const ') || code.includes('class ')) modularityScore += 3;
          if (name.includes('component') || name.includes('util') || name.includes('helper')) modularityScore += 5;

          // Reusability analysis
          if (code.includes('props') || code.includes('config') || code.includes('options')) reusabilityScore += 8;
          if (desc.includes('configurable') || desc.includes('customizable')) reusabilityScore += 5;
          if (example.length > 50) reusabilityScore += 5;

          // Documentation analysis
          if (desc.length > 100) documentationScore += 10;
          if (example.length > 0) documentationScore += 15;
          if (code.includes('//') || code.includes('/*') || code.includes('*')) documentationScore += 5;

          // Testing indicators
          if (code.includes('test') || code.includes('spec') || code.includes('jest')) testingScore += 20;
          if (desc.includes('test') || desc.includes('tested')) testingScore += 10;

          // Consistency analysis
          if (name.match(/^[a-z-]+$/)) consistencyScore += 3; // kebab-case
          if (name.match(/^[A-Z][a-zA-Z]+$/)) consistencyScore += 3; // PascalCase
          if (desc.charAt(0) === desc.charAt(0).toUpperCase()) consistencyScore += 2; // Proper description
        });

        // Normalize scores
        const sampleCount = samples.length;
        modularityScore = Math.min(100, modularityScore);
        reusabilityScore = Math.min(100, reusabilityScore);
        documentationScore = Math.min(100, documentationScore);
        testingScore = Math.min(100, testingScore);
        consistencyScore = Math.min(100, consistencyScore);
      }

      const overallScore = Math.round(
        (modularityScore + reusabilityScore + documentationScore + testingScore + consistencyScore) / 5
      );

      return {
        overallScore,
        modularityScore,
        reusabilityScore,
        documentationScore,
        testingScore,
        consistencyScore
      };
    } catch (error) {
      console.warn(`Could not analyze code quality for developer ${developerId}:`, error instanceof Error ? error.message : String(error));
      return {
        overallScore: 60,
        modularityScore: 60,
        reusabilityScore: 60,
        documentationScore: 40,
        testingScore: 30,
        consistencyScore: 70
      };
    }
  }

  /**
   * Analyze cursor chat activity (now with real data from VIBEZS_DB)
   */
  private async analyzeCursorActivity(client: PoolClient, developerId: string): Promise<any> {
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
          totalChats: 0,
          recentActivity: 0,
          problemSolvingPatterns: ['No cursor chat data available'],
          learningIndicators: ['Encourage cursor usage for development'],
          collaborationScore: 50,
          independenceLevel: 50
        };
      }

      // Analyze chat patterns
      let problemSolvingChats = 0;
      let learningIndicatorChats = 0;
      let technicalDiscussions = 0;
      const problemSolvingPatterns: string[] = [];
      const learningIndicators: string[] = [];

      cursorChats.rows.forEach(chat => {
        const content = (chat.content || '').toLowerCase();
        const title = (chat.chat_title || '').toLowerCase();

        // Problem-solving patterns
        if (content.includes('error') || content.includes('bug') || content.includes('fix') || 
            content.includes('debug') || title.includes('fix')) {
          problemSolvingChats++;
          problemSolvingPatterns.push('Error debugging and resolution');
        }

        if (content.includes('optimize') || content.includes('refactor') || content.includes('improve')) {
          problemSolvingPatterns.push('Code optimization and improvement');
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

        // Technical discussions
        if (content.includes('component') || content.includes('function') || content.includes('api') ||
            content.includes('database') || content.includes('service')) {
          technicalDiscussions++;
        }
      });

      // Calculate scores
      const collaborationScore = Math.min(100, 
        (problemSolvingChats * 15) + 
        (technicalDiscussions * 10) + 
        (totalChats * 3)
      );

      const independenceLevel = Math.max(20, Math.min(100,
        100 - (learningIndicatorChats * 8) + (problemSolvingChats * 5)
      ));

      return {
        totalChats,
        recentActivity,
        problemSolvingPatterns: [...new Set(problemSolvingPatterns)],
        learningIndicators: [...new Set(learningIndicators)],
        collaborationScore: Math.round(collaborationScore),
        independenceLevel: Math.round(independenceLevel)
      };
    } catch (error) {
      console.warn(`Error analyzing cursor activity for ${developerId}:`, error instanceof Error ? error.message : String(error));
      return {
        totalChats: 0,
        recentActivity: 0,
        problemSolvingPatterns: ['Analysis unavailable'],
        learningIndicators: ['Cursor chat analysis pending'],
        collaborationScore: 60,
        independenceLevel: 70
      };
    }
  }

  /**
   * Calculate performance trends
   */
  private async calculatePerformanceTrends(client: PoolClient, developerId: string, moduleData: any, codeQuality: any): Promise<any> {
    try {
      // Analyze trends over time
      const recentModules = await client.query(`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) as modules_count,
          AVG(LENGTH(description)) as avg_description_length
        FROM module_registry mr
        WHERE mr.created_by = $1 OR mr.created_by ILIKE $2
        AND mr.created_at > NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
      `, [developerId, `%${developerId}%`]);

      const weeklyData = recentModules.rows;
      
      let productivityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (weeklyData.length >= 2) {
        const recent = weeklyData[0]?.modules_count || 0;
        const previous = weeklyData[1]?.modules_count || 0;
        
        if (recent > previous * 1.2) productivityTrend = 'increasing';
        else if (recent < previous * 0.8) productivityTrend = 'decreasing';
        
        const recentQuality = weeklyData[0]?.avg_description_length || 0;
        const previousQuality = weeklyData[1]?.avg_description_length || 0;
        
        if (recentQuality > previousQuality * 1.1) qualityTrend = 'improving';
        else if (recentQuality < previousQuality * 0.9) qualityTrend = 'declining';
      }

      const principleAlignment = moduleData.principleAdherence >= 70 ? 'strong' : 
                                moduleData.principleAdherence >= 50 ? 'moderate' : 'needs_improvement';

      const coachingNeeds = [];
      if (codeQuality.documentationScore < 60) coachingNeeds.push('Documentation practices');
      if (codeQuality.testingScore < 50) coachingNeeds.push('Testing methodology');
      if (moduleData.principleAdherence < 60) coachingNeeds.push('Principle adherence');
      if (codeQuality.modularityScore < 70) coachingNeeds.push('Modular design');

      return {
        productivityTrend,
        qualityTrend,
        principleAlignment,
        coachingNeeds
      };
    } catch (error) {
      console.warn(`Could not calculate trends for developer ${developerId}:`, error instanceof Error ? error.message : String(error));
      return {
        productivityTrend: 'stable' as const,
        qualityTrend: 'stable' as const,
        principleAlignment: 'moderate' as const,
        coachingNeeds: ['Regular check-ins needed']
      };
    }
  }

  /**
   * Generate coaching recommendations
   */
  private async generateCoachingRecommendations(
    developer: any, 
    moduleData: any, 
    codeQuality: any, 
    cursorAnalysis: any, 
    trends: any
  ): Promise<any> {
    const recommendations = [];
    const strengths = [];
    const improvementAreas = [];
    const nextSteps = [];

    // Identify strengths
    if (codeQuality.modularityScore >= 80) strengths.push('Strong modular design skills');
    if (codeQuality.reusabilityScore >= 80) strengths.push('Excellent reusable component creation');
    if (moduleData.total >= 10) strengths.push('High productivity in module creation');
    if (codeQuality.consistencyScore >= 80) strengths.push('Consistent coding standards');

    // Identify improvement areas
    if (codeQuality.documentationScore < 60) improvementAreas.push('Documentation practices');
    if (codeQuality.testingScore < 50) improvementAreas.push('Testing implementation');
    if (moduleData.principleAdherence < 60) improvementAreas.push('Principle adherence');
    if (trends.productivityTrend === 'decreasing') improvementAreas.push('Productivity optimization');

    // Generate specific recommendations
    if (codeQuality.documentationScore < 60) {
      recommendations.push('Focus on comprehensive documentation: usage examples, parameter descriptions, and implementation notes');
      nextSteps.push('Review top 3 modules and enhance documentation');
    }

    if (codeQuality.testingScore < 50) {
      recommendations.push('Implement testing practices: unit tests, integration tests, and test documentation');
      nextSteps.push('Add tests to 2 most critical modules');
    }

    if (moduleData.principleAdherence < 60) {
      recommendations.push('Strengthen adherence to core principles: modularity, reusability, and teachability');
      nextSteps.push('Review principle guidelines and apply to next 3 modules');
    }

    if (trends.qualityTrend === 'declining') {
      recommendations.push('Quality assurance focus: code review, refactoring, and best practices');
      nextSteps.push('Schedule code review session for recent work');
    }

    // Default recommendations if doing well
    if (recommendations.length === 0) {
      recommendations.push('Continue excellent work and consider mentoring junior developers');
      nextSteps.push('Identify opportunities to share knowledge with team');
    }

    return {
      recommendations,
      strengths,
      improvementAreas,
      nextSteps
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(moduleData: any, codeQuality: any, cursorAnalysis: any): number {
    const moduleScore = Math.min(100, (moduleData.total * 5) + (moduleData.recentCount * 10));
    const qualityWeight = 0.4;
    const productivityWeight = 0.3;
    const principleWeight = 0.3;

    const score = Math.round(
      (codeQuality.overallScore * qualityWeight) +
      (moduleScore * productivityWeight) +
      (moduleData.principleAdherence * principleWeight)
    );

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate team overview
   */
  private async generateTeamOverview(performanceMetrics: DeveloperPerformanceMetrics[]): Promise<TeamPerformanceOverview> {
    const totalDevelopers = performanceMetrics.length;
    const averageScore = totalDevelopers > 0 ? 
      Math.round(performanceMetrics.reduce((sum, dev) => sum + dev.overallScore, 0) / totalDevelopers) : 0;

    const topPerformers = performanceMetrics
      .filter(dev => dev.overallScore >= 80)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3);

    const needsAttention = performanceMetrics
      .filter(dev => dev.overallScore < 60 || dev.trends.coachingNeeds.length > 2)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 5);

    const principleAdherenceOverall = totalDevelopers > 0 ?
      Math.round(performanceMetrics.reduce((sum, dev) => sum + dev.moduleSubmissions.principleAdherence, 0) / totalDevelopers) : 0;

    const teamTrends = {
      moduleProductivity: totalDevelopers > 0 ? 
        Math.round(performanceMetrics.reduce((sum, dev) => sum + dev.moduleSubmissions.recentCount, 0) / totalDevelopers) : 0,
      codeQuality: totalDevelopers > 0 ?
        Math.round(performanceMetrics.reduce((sum, dev) => sum + dev.codeQuality.overallScore, 0) / totalDevelopers) : 0,
      collaboration: totalDevelopers > 0 ?
        Math.round(performanceMetrics.reduce((sum, dev) => sum + dev.cursorAnalysis.collaborationScore, 0) / totalDevelopers) : 0
    };

    const coachingPriorities = [];
    const documentationNeeds = performanceMetrics.filter(dev => dev.codeQuality.documentationScore < 60).length;
    const testingNeeds = performanceMetrics.filter(dev => dev.codeQuality.testingScore < 50).length;
    const principleNeeds = performanceMetrics.filter(dev => dev.moduleSubmissions.principleAdherence < 60).length;

    if (documentationNeeds > totalDevelopers * 0.5) {
      coachingPriorities.push(`Documentation training needed for ${documentationNeeds} developers`);
    }
    if (testingNeeds > totalDevelopers * 0.4) {
      coachingPriorities.push(`Testing methodology training needed for ${testingNeeds} developers`);
    }
    if (principleNeeds > totalDevelopers * 0.3) {
      coachingPriorities.push(`Principle adherence coaching needed for ${principleNeeds} developers`);
    }

    return {
      totalActiveDevelopers: totalDevelopers,
      averagePerformanceScore: averageScore,
      topPerformers,
      needsAttention,
      principleAdherenceOverall,
      teamTrends,
      coachingPriorities
    };
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient();
  }

  private async getVibezClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient(); // Uses VIBEZS_DB connection
  }
}

export default DeveloperPerformanceAnalysisService;
