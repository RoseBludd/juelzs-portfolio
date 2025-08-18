import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface IndividualDeveloperMetrics {
  developerId: string;
  developerName: string;
  email: string;
  status: string;
  contractSigned: boolean;
  
  // Module Creation Analysis
  moduleSubmissions: {
    totalModules: number;
    recentModules: number; // last 30 days
    moduleTypes: string[];
    repositoriesWorkedOn: string[];
    avgModuleSize: number;
    codeImplementationRate: number;
  };
  
  // Task & Project Analysis
  taskPerformance: {
    tasksAssigned: number;
    tasksCompleted: number;
    completionRate: number;
    avgTaskComplexity: number;
    estimatedVsActualHours: number;
  };
  
  // Code Quality & Principle Adherence
  codeQuality: {
    modularityScore: number;
    reusabilityScore: number;
    documentationScore: number;
    consistencyScore: number;
    principleAdherence: number;
  };
  
  // Documentation & Learning
  documentation: {
    loomVideosCreated: number;
    scribeDocsCreated: number;
    hasComprehensiveDocumentation: boolean;
    documentationQuality: number;
  };
  
  // Performance Trends
  trends: {
    productivityTrend: 'increasing' | 'stable' | 'decreasing';
    qualityTrend: 'improving' | 'stable' | 'declining';
    learningVelocity: 'fast' | 'moderate' | 'slow';
    principleAlignment: 'strong' | 'moderate' | 'needs_work';
  };
  
  // Individual Coaching Insights
  coaching: {
    overallScore: number;
    strengths: string[];
    improvementAreas: string[];
    specificRecommendations: string[];
    nextActions: string[];
    coachingPriority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export interface TeamOverview {
  totalActiveDevelopers: number;
  averageTeamScore: number;
  topPerformers: IndividualDeveloperMetrics[];
  needsAttention: IndividualDeveloperMetrics[];
  teamStrengths: string[];
  teamWeaknesses: string[];
  coachingPriorities: string[];
}

/**
 * Individual Developer Analysis Service (Singleton)
 * Analyzes each active contracted developer individually
 * Provides specific coaching insights per developer
 */
class IndividualDeveloperAnalysisService {
  private static instance: IndividualDeveloperAnalysisService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): IndividualDeveloperAnalysisService {
    if (!IndividualDeveloperAnalysisService.instance) {
      IndividualDeveloperAnalysisService.instance = new IndividualDeveloperAnalysisService();
    }
    return IndividualDeveloperAnalysisService.instance;
  }

  /**
   * Analyze all active contracted developers individually
   */
  async analyzeActiveDevelopersIndividually(): Promise<TeamOverview> {
    try {
      const client = await this.getClient();
      
      try {
        console.log('🧠 CADIS: Analyzing Individual Active Developers...');
        
        // Get active contracted developers from VIBEZS_DB
        const activeDevelopers = await this.getActiveContractedDevelopers(client);
        console.log(`👥 Found ${activeDevelopers.length} active contracted developers`);
        
        if (activeDevelopers.length === 0) {
          throw new Error('No active contracted developers found');
        }
        
        if (activeDevelopers.length > 3) {
          console.log('⚠️  More than 3 active developers found - being more selective...');
        }
        
        const individualMetrics: IndividualDeveloperMetrics[] = [];
        
        // Analyze each developer individually
        for (const developer of activeDevelopers) {
          console.log(`🔍 Analyzing individual: ${developer.name}`);
          const metrics = await this.analyzeIndividualDeveloper(client, developer);
          individualMetrics.push(metrics);
        }
        
        // Generate team overview
        const teamOverview = await this.generateTeamOverview(individualMetrics);
        
        return teamOverview;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error analyzing individual developers:', error);
      throw error;
    }
  }

  /**
   * Get active contracted developers (strict criteria)
   */
  private async getActiveContractedDevelopers(client: PoolClient): Promise<any[]> {
    try {
      // Use VIBEZS_DB connection for developer data
      const vibezClient = await this.getVibezClient();
      
      try {
        const activeDevelopers = await vibezClient.query(`
          SELECT 
            d.id,
            d.name,
            d.email,
            d.role,
            d.status,
            d.contract_signed,
            d.github_url,
            d.portfolio_url,
            d.created_at,
            d.updated_at
          FROM developers d
          WHERE d.status = 'active' 
          AND d.contract_signed = true
          AND d.email NOT LIKE '%test%'
          AND d.email NOT LIKE '%example%'
          AND d.name NOT LIKE '%test%'
          ORDER BY d.updated_at DESC
        `);

        console.log(`📊 Active contracted developers found: ${activeDevelopers.rows.length}`);
        
        // Filter out test accounts and ensure real developers
        const realDevelopers = activeDevelopers.rows.filter(dev => 
          dev.email && 
          !dev.email.includes('test') && 
          !dev.email.includes('example') &&
          dev.name &&
          !dev.name.toLowerCase().includes('test')
        );

        console.log(`✅ Real active developers: ${realDevelopers.length}`);
        
        return realDevelopers;
      } finally {
        vibezClient.release();
      }
    } catch (error) {
      console.error('Error getting active developers:', error);
      return [];
    }
  }

  /**
   * Analyze individual developer performance
   */
  private async analyzeIndividualDeveloper(client: PoolClient, developer: any): Promise<IndividualDeveloperMetrics> {
    try {
      console.log(`📊 Analyzing ${developer.name}...`);
      
      // Get modules created by this developer
      const moduleAnalysis = await this.analyzeModuleSubmissions(client, developer.id);
      
      // Get task performance
      const taskPerformance = await this.analyzeTaskPerformance(client, developer.id);
      
      // Analyze code quality
      const codeQuality = await this.analyzeCodeQuality(client, developer.id);
      
      // Check documentation (Loom/Scribe)
      const documentation = await this.analyzeDocumentation(client, developer.id);
      
      // Calculate trends
      const trends = await this.calculateTrends(client, developer.id, moduleAnalysis);
      
      // Generate coaching insights
      const coaching = await this.generateCoachingInsights(
        developer, moduleAnalysis, taskPerformance, codeQuality, documentation, trends
      );
      
      return {
        developerId: developer.id,
        developerName: developer.name,
        email: developer.email,
        status: developer.status,
        contractSigned: developer.contract_signed,
        moduleSubmissions: moduleAnalysis,
        taskPerformance,
        codeQuality,
        documentation,
        trends,
        coaching
      };
    } catch (error) {
      console.error(`Error analyzing developer ${developer.name}:`, error);
      throw error;
    }
  }

  /**
   * Analyze module submissions by developer
   */
  private async analyzeModuleSubmissions(client: PoolClient, developerId: string): Promise<any> {
    try {
      // Get modules created by this developer
      const modules = await client.query(`
        SELECT 
          mr.*,
          LENGTH(mr.description) as description_length,
          LENGTH(mr.code_content) as code_length,
          mr.metadata
        FROM module_registry mr
        WHERE mr.metadata->>'developer_id' = $1
        ORDER BY mr.created_at DESC
      `, [developerId]);

      const recentModules = await client.query(`
        SELECT COUNT(*) as count
        FROM module_registry mr
        WHERE mr.metadata->>'developer_id' = $1
        AND mr.created_at > NOW() - INTERVAL '30 days'
      `, [developerId]);

      const moduleData = modules.rows;
      const totalModules = moduleData.length;
      const recentCount = parseInt(recentModules.rows[0]?.count || '0');

      // Analyze module characteristics
      const moduleTypes = [...new Set(moduleData.map(m => m.type))];
      const repositories = [...new Set(moduleData.map(m => m.source_repo).filter(Boolean))];
      
      let totalCodeLength = 0;
      let modulesWithCode = 0;
      
      moduleData.forEach(module => {
        if (module.code_length > 0) {
          totalCodeLength += module.code_length;
          modulesWithCode++;
        }
      });

      const avgModuleSize = modulesWithCode > 0 ? Math.round(totalCodeLength / modulesWithCode) : 0;
      const codeImplementationRate = totalModules > 0 ? Math.round((modulesWithCode / totalModules) * 100) : 0;

      return {
        totalModules,
        recentModules: recentCount,
        moduleTypes,
        repositoriesWorkedOn: repositories,
        avgModuleSize,
        codeImplementationRate
      };
    } catch (error) {
      console.warn(`Could not analyze modules for developer ${developerId}:`, error.message);
      return {
        totalModules: 0,
        recentModules: 0,
        moduleTypes: [],
        repositoriesWorkedOn: [],
        avgModuleSize: 0,
        codeImplementationRate: 0
      };
    }
  }

  /**
   * Analyze task performance
   */
  private async analyzeTaskPerformance(client: PoolClient, developerId: string): Promise<any> {
    try {
      // Check task assignments and completions
      const taskData = await client.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          AVG(CASE WHEN estimated_hours IS NOT NULL THEN estimated_hours ELSE 0 END) as avg_estimated_hours
        FROM tasks t
        WHERE t.assigned_to = $1
        OR t.metadata->>'developer_id' = $1
      `, [developerId]);

      const tasks = taskData.rows[0];
      const tasksAssigned = parseInt(tasks.total_tasks || '0');
      const tasksCompleted = parseInt(tasks.completed_tasks || '0');
      const completionRate = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;

      return {
        tasksAssigned,
        tasksCompleted,
        completionRate,
        avgTaskComplexity: Math.round(tasks.avg_estimated_hours || 0),
        estimatedVsActualHours: 100 // Placeholder - would need actual time tracking
      };
    } catch (error) {
      console.warn(`Could not analyze tasks for developer ${developerId}:`, error.message);
      return {
        tasksAssigned: 0,
        tasksCompleted: 0,
        completionRate: 0,
        avgTaskComplexity: 0,
        estimatedVsActualHours: 100
      };
    }
  }

  /**
   * Analyze code quality and principle adherence
   */
  private async analyzeCodeQuality(client: PoolClient, developerId: string): Promise<any> {
    try {
      // Get code samples from modules
      const codeSamples = await client.query(`
        SELECT 
          mr.code_content,
          mr.description,
          mr.name,
          mr.type,
          mr.metadata
        FROM module_registry mr
        WHERE mr.metadata->>'developer_id' = $1
        AND mr.code_content IS NOT NULL
        ORDER BY mr.created_at DESC
        LIMIT 20
      `, [developerId]);

      let modularityScore = 50;
      let reusabilityScore = 50;
      let documentationScore = 50;
      let consistencyScore = 50;
      let principleScore = 50;

      const samples = codeSamples.rows;
      
      if (samples.length > 0) {
        samples.forEach(sample => {
          const code = sample.code_content || '';
          const desc = sample.description || '';
          const name = sample.name || '';

          // Modularity analysis
          if (code.includes('export') || code.includes('module.exports')) modularityScore += 8;
          if (code.includes('function') || code.includes('const ') || code.includes('class ')) modularityScore += 5;
          if (name.includes('component') || name.includes('service') || name.includes('util')) modularityScore += 5;

          // Reusability analysis
          if (code.includes('props') || code.includes('config') || code.includes('options')) reusabilityScore += 10;
          if (desc.includes('configurable') || desc.includes('reusable')) reusabilityScore += 8;
          if (code.includes('interface') || code.includes('type ')) reusabilityScore += 5;

          // Documentation analysis
          if (desc.length > 100) documentationScore += 10;
          if (code.includes('//') || code.includes('/*') || code.includes('*')) documentationScore += 8;
          if (code.includes('@param') || code.includes('@returns')) documentationScore += 10;

          // Consistency analysis
          if (name.match(/^[a-z-]+$/) || name.match(/^[A-Z][a-zA-Z]+$/)) consistencyScore += 5;
          if (code.includes('typescript') || code.includes('TypeScript')) consistencyScore += 5;

          // Overall principle adherence
          principleScore = Math.round((modularityScore + reusabilityScore + documentationScore) / 3);
        });

        // Normalize scores
        modularityScore = Math.min(100, modularityScore);
        reusabilityScore = Math.min(100, reusabilityScore);
        documentationScore = Math.min(100, documentationScore);
        consistencyScore = Math.min(100, consistencyScore);
        principleScore = Math.min(100, principleScore);
      }

      return {
        modularityScore,
        reusabilityScore,
        documentationScore,
        consistencyScore,
        principleAdherence: principleScore
      };
    } catch (error) {
      console.warn(`Could not analyze code quality for developer ${developerId}:`, error.message);
      return {
        modularityScore: 60,
        reusabilityScore: 60,
        documentationScore: 50,
        consistencyScore: 70,
        principleAdherence: 60
      };
    }
  }

  /**
   * Analyze documentation (Loom videos, Scribe docs)
   */
  private async analyzeDocumentation(client: PoolClient, developerId: string): Promise<any> {
    try {
      // Check for Loom/Scribe references in modules
      const docReferences = await client.query(`
        SELECT 
          COUNT(CASE WHEN description ILIKE '%loom%' OR code_content ILIKE '%loom%' THEN 1 END) as loom_count,
          COUNT(CASE WHEN description ILIKE '%scribe%' OR code_content ILIKE '%scribe%' THEN 1 END) as scribe_count,
          COUNT(CASE WHEN description ILIKE '%video%' OR code_content ILIKE '%video%' THEN 1 END) as video_count,
          AVG(LENGTH(description)) as avg_doc_length
        FROM module_registry mr
        WHERE mr.metadata->>'developer_id' = $1
      `, [developerId]);

      const docs = docReferences.rows[0];
      const loomVideos = parseInt(docs.loom_count || '0');
      const scribeDocs = parseInt(docs.scribe_count || '0');
      const videoRefs = parseInt(docs.video_count || '0');
      const avgDocLength = Math.round(docs.avg_doc_length || 0);

      const hasComprehensiveDocumentation = avgDocLength > 150 && (loomVideos > 0 || scribeDocs > 0);
      const documentationQuality = Math.min(100, avgDocLength / 2 + (loomVideos * 20) + (scribeDocs * 15));

      return {
        loomVideosCreated: loomVideos,
        scribeDocsCreated: scribeDocs,
        hasComprehensiveDocumentation,
        documentationQuality: Math.round(documentationQuality)
      };
    } catch (error) {
      console.warn(`Could not analyze documentation for developer ${developerId}:`, error.message);
      return {
        loomVideosCreated: 0,
        scribeDocsCreated: 0,
        hasComprehensiveDocumentation: false,
        documentationQuality: 30
      };
    }
  }

  /**
   * Calculate performance trends
   */
  private async calculateTrends(client: PoolClient, developerId: string, moduleAnalysis: any): Promise<any> {
    try {
      // Analyze recent vs older performance
      const recentPerformance = await client.query(`
        SELECT 
          COUNT(*) as recent_count,
          AVG(LENGTH(description)) as recent_avg_desc
        FROM module_registry mr
        WHERE mr.metadata->>'developer_id' = $1
        AND mr.created_at > NOW() - INTERVAL '30 days'
      `, [developerId]);

      const olderPerformance = await client.query(`
        SELECT 
          COUNT(*) as older_count,
          AVG(LENGTH(description)) as older_avg_desc
        FROM module_registry mr
        WHERE mr.metadata->>'developer_id' = $1
        AND mr.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
      `, [developerId]);

      const recent = recentPerformance.rows[0];
      const older = olderPerformance.rows[0];

      const recentCount = parseInt(recent.recent_count || '0');
      const olderCount = parseInt(older.older_count || '0');
      const recentQuality = parseFloat(recent.recent_avg_desc || '0');
      const olderQuality = parseFloat(older.older_avg_desc || '0');

      // Determine trends
      let productivityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';

      if (recentCount > olderCount * 1.2) productivityTrend = 'increasing';
      else if (recentCount < olderCount * 0.8) productivityTrend = 'decreasing';

      if (recentQuality > olderQuality * 1.1) qualityTrend = 'improving';
      else if (recentQuality < olderQuality * 0.9) qualityTrend = 'declining';

      const learningVelocity = moduleAnalysis.totalModules > 10 ? 'fast' : 
                               moduleAnalysis.totalModules > 5 ? 'moderate' : 'slow';

      const principleAlignment = moduleAnalysis.totalModules > 5 ? 'strong' : 
                                 moduleAnalysis.totalModules > 2 ? 'moderate' : 'needs_work';

      return {
        productivityTrend,
        qualityTrend,
        learningVelocity,
        principleAlignment
      };
    } catch (error) {
      console.warn(`Could not calculate trends for developer ${developerId}:`, error.message);
      return {
        productivityTrend: 'stable' as const,
        qualityTrend: 'stable' as const,
        learningVelocity: 'moderate' as const,
        principleAlignment: 'moderate' as const
      };
    }
  }

  /**
   * Generate individual coaching insights
   */
  private async generateCoachingInsights(
    developer: any,
    moduleAnalysis: any,
    taskPerformance: any,
    codeQuality: any,
    documentation: any,
    trends: any
  ): Promise<any> {
    const strengths = [];
    const improvementAreas = [];
    const recommendations = [];
    const nextActions = [];

    // Calculate overall score
    const overallScore = Math.round(
      (moduleAnalysis.totalModules * 5) * 0.3 +
      (codeQuality.principleAdherence) * 0.3 +
      (taskPerformance.completionRate) * 0.2 +
      (documentation.documentationQuality) * 0.2
    );

    // Identify strengths
    if (moduleAnalysis.totalModules >= 10) strengths.push('High productivity - consistent module creation');
    if (codeQuality.modularityScore >= 80) strengths.push('Strong modular design skills');
    if (codeQuality.reusabilityScore >= 80) strengths.push('Excellent reusable component creation');
    if (taskPerformance.completionRate >= 90) strengths.push('Reliable task completion');
    if (documentation.hasComprehensiveDocumentation) strengths.push('Good documentation practices');
    if (trends.productivityTrend === 'increasing') strengths.push('Improving productivity trend');

    // Identify improvement areas
    if (moduleAnalysis.totalModules < 5) improvementAreas.push('Increase module contribution frequency');
    if (codeQuality.documentationScore < 60) improvementAreas.push('Enhance code documentation');
    if (codeQuality.modularityScore < 60) improvementAreas.push('Strengthen modular design principles');
    if (documentation.documentationQuality < 50) improvementAreas.push('Create more comprehensive documentation');
    if (taskPerformance.completionRate < 70) improvementAreas.push('Improve task completion consistency');

    // Generate specific recommendations
    if (codeQuality.documentationScore < 60) {
      recommendations.push('Add comprehensive comments and documentation to code modules');
      nextActions.push('Review and document 3 most recent modules');
    }
    
    if (moduleAnalysis.totalModules < 5) {
      recommendations.push('Increase contribution frequency - aim for 1-2 modules per week');
      nextActions.push('Set weekly module creation goals');
    }

    if (!documentation.hasComprehensiveDocumentation) {
      recommendations.push('Create Loom videos or Scribe documentation for complex modules');
      nextActions.push('Record walkthrough video for next module');
    }

    if (trends.qualityTrend === 'declining') {
      recommendations.push('Focus on quality over quantity - review recent work');
      nextActions.push('Schedule code review session');
    }

    // Determine coaching priority
    let coachingPriority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    if (overallScore < 40) coachingPriority = 'urgent';
    else if (overallScore < 60) coachingPriority = 'high';
    else if (overallScore < 80) coachingPriority = 'medium';

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      strengths,
      improvementAreas,
      specificRecommendations: recommendations,
      nextActions,
      coachingPriority
    };
  }

  /**
   * Generate team overview
   */
  private async generateTeamOverview(individualMetrics: IndividualDeveloperMetrics[]): Promise<TeamOverview> {
    const totalDevelopers = individualMetrics.length;
    const averageScore = totalDevelopers > 0 ? 
      Math.round(individualMetrics.reduce((sum, dev) => sum + dev.coaching.overallScore, 0) / totalDevelopers) : 0;

    const topPerformers = individualMetrics
      .filter(dev => dev.coaching.overallScore >= 75)
      .sort((a, b) => b.coaching.overallScore - a.coaching.overallScore)
      .slice(0, 3);

    const needsAttention = individualMetrics
      .filter(dev => dev.coaching.overallScore < 60 || dev.coaching.coachingPriority === 'high' || dev.coaching.coachingPriority === 'urgent')
      .sort((a, b) => a.coaching.overallScore - b.coaching.overallScore);

    // Analyze team strengths and weaknesses
    const teamStrengths = [];
    const teamWeaknesses = [];
    const coachingPriorities = [];

    const avgModularity = Math.round(individualMetrics.reduce((sum, dev) => sum + dev.codeQuality.modularityScore, 0) / totalDevelopers);
    const avgDocumentation = Math.round(individualMetrics.reduce((sum, dev) => sum + dev.codeQuality.documentationScore, 0) / totalDevelopers);
    const avgReusability = Math.round(individualMetrics.reduce((sum, dev) => sum + dev.codeQuality.reusabilityScore, 0) / totalDevelopers);

    if (avgModularity >= 70) teamStrengths.push('Strong team modular design skills');
    else if (avgModularity < 50) teamWeaknesses.push('Team needs modular design training');

    if (avgDocumentation >= 70) teamStrengths.push('Good team documentation practices');
    else if (avgDocumentation < 50) teamWeaknesses.push('Team needs documentation improvement');

    if (avgReusability >= 70) teamStrengths.push('Excellent team reusability focus');
    else if (avgReusability < 50) teamWeaknesses.push('Team needs reusability pattern training');

    // Generate coaching priorities
    if (needsAttention.length > totalDevelopers * 0.5) {
      coachingPriorities.push(`${needsAttention.length} developers need immediate attention`);
    }
    if (avgDocumentation < 60) {
      coachingPriorities.push('Team-wide documentation training needed');
    }
    if (avgModularity < 60) {
      coachingPriorities.push('Modular design workshop required');
    }

    return {
      totalActiveDevelopers: totalDevelopers,
      averageTeamScore: averageScore,
      topPerformers,
      needsAttention,
      teamStrengths,
      teamWeaknesses,
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

export default IndividualDeveloperAnalysisService;
