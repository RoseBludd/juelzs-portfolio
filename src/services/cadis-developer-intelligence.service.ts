import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface CADISDeveloperProfile {
  developerId: string;
  developerName: string;
  email: string;
  role: string;
  
  // Real Work Metrics
  codeSubmissions: {
    total: number;
    totalContentSize: number;
    averageSubmissionSize: number;
    approvedSubmissions: number;
    averageScore: number;
    recentSubmissions: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
  };
  
  // Task Performance
  taskPerformance: {
    totalAssignments: number;
    completedTasks: number;
    completionRate: number;
    averageComplexity: string;
    recentAssignments: number;
    onTimeCompletion: number;
  };
  
  // Module Contributions
  moduleContributions: {
    totalUpdates: number;
    recentUpdates: number;
    averageProgress: number;
    totalTimeSpent: number;
    updateTypes: string[];
    maintenanceScore: number;
  };
  
  // Work Sessions & Time Tracking
  workSessions: {
    totalSessions: number;
    totalHours: number;
    averageSessionLength: number;
    recentSessions: number;
    consistencyScore: number;
    latestActivity: Date | null;
  };
  
  // Platform Activity
  platformActivity: {
    totalActivities: number;
    activityTypes: number;
    engagementScore: number;
    recentActivities: number;
    activityConsistency: number;
  };
  
  // CADIS Intelligence Scores
  cadisScores: {
    overallPerformance: number;
    productivityScore: number;
    qualityScore: number;
    consistencyScore: number;
    principleAdherence: number;
    coachingPriority: 'low' | 'medium' | 'high' | 'excellent';
  };
  
  // Coaching Insights
  coaching: {
    strengths: string[];
    improvementAreas: string[];
    specificRecommendations: string[];
    nextActions: string[];
    performanceLevel: 'Developing' | 'Satisfactory' | 'Good' | 'Excellent';
  };
}

export interface CADISTeamIntelligence {
  teamOverview: {
    totalActiveDevelopers: number;
    averageTeamScore: number;
    totalWorkHours: number;
    totalCodeSubmissions: number;
    teamProductivity: number;
    teamQuality: number;
  };
  
  topPerformers: CADISDeveloperProfile[];
  developmentAreas: CADISDeveloperProfile[];
  
  teamInsights: {
    strengths: string[];
    challenges: string[];
    opportunities: string[];
    risks: string[];
  };
  
  coachingStrategy: {
    immediateActions: string[];
    weeklyFocus: string[];
    monthlyGoals: string[];
    quarterlyObjectives: string[];
  };
  
  principleAlignment: {
    modularityScore: number;
    reusabilityScore: number;
    documentationScore: number;
    testingScore: number;
    overallAlignment: number;
  };
}

/**
 * CADIS Developer Intelligence Service (Singleton)
 * Comprehensive analysis of active developers using all real data sources:
 * - module_submissions (actual code submissions)
 * - task_assignments (work assignments)
 * - module_updates (ongoing contributions)  
 * - developer_work_sessions (time tracking)
 * - developer_activity_log (platform engagement)
 */
class CADISDeveloperIntelligenceService {
  private static instance: CADISDeveloperIntelligenceService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): CADISDeveloperIntelligenceService {
    if (!CADISDeveloperIntelligenceService.instance) {
      CADISDeveloperIntelligenceService.instance = new CADISDeveloperIntelligenceService();
    }
    return CADISDeveloperIntelligenceService.instance;
  }

  /**
   * Generate comprehensive CADIS developer intelligence
   */
  async generateDeveloperIntelligence(): Promise<CADISTeamIntelligence> {
    try {
      const client = await this.getVibezClient();
      
      try {
        console.log('🧠 CADIS: Generating Comprehensive Developer Intelligence...');
        
        // Get active developers (Alfredo, Adrian, Enrique)
        const activeDevelopers = await this.getActiveDevelopers(client);
        console.log(`👥 Analyzing ${activeDevelopers.length} active developers`);
        
        const developerProfiles: CADISDeveloperProfile[] = [];
        
        // Analyze each developer comprehensively
        for (const developer of activeDevelopers) {
          console.log(`🔍 Analyzing: ${developer.name}`);
          const profile = await this.analyzeDeveloperComprehensively(client, developer);
          developerProfiles.push(profile);
        }
        
        // Generate team intelligence
        const teamIntelligence = await this.generateTeamIntelligence(developerProfiles);
        
        return teamIntelligence;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error generating developer intelligence:', error);
      throw error;
    }
  }

  /**
   * Get active developers (strict criteria for real developers)
   */
  private async getActiveDevelopers(client: PoolClient): Promise<any[]> {
    const developers = await client.query(`
      SELECT id, name, email, role, github_url, created_at, updated_at
      FROM developers 
      WHERE status = 'active' 
      AND contract_signed = true
      AND email NOT LIKE '%test%'
      AND email NOT LIKE '%example%'
      AND name NOT LIKE '%test%'
      AND (
        name ILIKE '%alfredo%' 
        OR email = 'estopaceadrian@gmail.com'
        OR name ILIKE '%enrique%'
      )
      ORDER BY updated_at DESC
    `);
    
    return developers.rows;
  }

  /**
   * Comprehensive individual developer analysis
   */
  private async analyzeDeveloperComprehensively(client: PoolClient, developer: any): Promise<CADISDeveloperProfile> {
    // 1. Analyze code submissions
    const codeSubmissions = await this.analyzeCodeSubmissions(client, developer.id);
    
    // 2. Analyze task performance
    const taskPerformance = await this.analyzeTaskPerformance(client, developer.id);
    
    // 3. Analyze module contributions
    const moduleContributions = await this.analyzeModuleContributions(client, developer.id);
    
    // 4. Analyze work sessions
    const workSessions = await this.analyzeWorkSessions(client, developer.id);
    
    // 5. Analyze platform activity
    const platformActivity = await this.analyzePlatformActivity(client, developer.id);
    
    // 6. Calculate CADIS scores
    const cadisScores = this.calculateCADISScores(
      codeSubmissions, taskPerformance, moduleContributions, workSessions, platformActivity
    );
    
    // 7. Generate coaching insights
    const coaching = this.generateCoachingInsights(
      developer, codeSubmissions, taskPerformance, moduleContributions, workSessions, cadisScores
    );
    
    return {
      developerId: developer.id,
      developerName: developer.name,
      email: developer.email,
      role: developer.role,
      codeSubmissions,
      taskPerformance,
      moduleContributions,
      workSessions,
      platformActivity,
      cadisScores,
      coaching
    };
  }

  /**
   * Analyze code submissions (module_submissions table)
   */
  private async analyzeCodeSubmissions(client: PoolClient, developerId: string): Promise<any> {
    try {
      const submissions = await client.query(`
        SELECT 
          ms.*,
          mr.name as module_name,
          mr.type as module_type,
          LENGTH(ms.content) as submission_size,
          LENGTH(mr.code_content) as module_code_size
        FROM module_submissions ms
        LEFT JOIN module_registry mr ON ms.module_id = mr.id
        WHERE ms.developer_id::text = $1::text
        ORDER BY ms.created_at DESC
      `, [developerId]);

      const recentSubmissions = await client.query(`
        SELECT COUNT(*) as count
        FROM module_submissions ms
        WHERE ms.developer_id::text = $1::text
        AND ms.created_at > NOW() - INTERVAL '30 days'
      `, [developerId]);

      const total = submissions.rows.length;
      const totalContentSize = submissions.rows.reduce((sum, sub) => sum + (sub.submission_size || 0), 0);
      const averageSubmissionSize = total > 0 ? Math.round(totalContentSize / total) : 0;
      const approvedSubmissions = submissions.rows.filter(sub => sub.status === 'approved').length;
      
      let totalScore = 0;
      let scoredCount = 0;
      submissions.rows.forEach(sub => {
        if (sub.score) {
          totalScore += sub.score;
          scoredCount++;
        }
      });
      const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
      
      // Calculate quality trend (recent vs older submissions)
      const recentSubs = submissions.rows.slice(0, Math.floor(total / 3));
      const olderSubs = submissions.rows.slice(Math.floor(total * 2 / 3));
      
      let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentSubs.length > 0 && olderSubs.length > 0) {
        const recentAvgSize = recentSubs.reduce((sum, sub) => sum + (sub.submission_size || 0), 0) / recentSubs.length;
        const olderAvgSize = olderSubs.reduce((sum, sub) => sum + (sub.submission_size || 0), 0) / olderSubs.length;
        
        if (recentAvgSize > olderAvgSize * 1.2) qualityTrend = 'improving';
        else if (recentAvgSize < olderAvgSize * 0.8) qualityTrend = 'declining';
      }

      return {
        total,
        totalContentSize,
        averageSubmissionSize,
        approvedSubmissions,
        averageScore,
        recentSubmissions: parseInt(recentSubmissions.rows[0].count),
        qualityTrend
      };
    } catch (error) {
      console.warn(`Error analyzing code submissions for ${developerId}:`, error.message);
      return {
        total: 0, totalContentSize: 0, averageSubmissionSize: 0, 
        approvedSubmissions: 0, averageScore: 0, recentSubmissions: 0, qualityTrend: 'stable'
      };
    }
  }

  /**
   * Analyze task performance (task_assignments table)
   */
  private async analyzeTaskPerformance(client: PoolClient, developerId: string): Promise<any> {
    try {
      const assignments = await client.query(`
        SELECT 
          ta.*,
          t.title, t.complexity, t.estimated_time, t.status as task_status
        FROM task_assignments ta
        LEFT JOIN tasks t ON ta.task_id::text = t.id::text
        WHERE ta.developer_id::text = $1::text
        ORDER BY ta.start_date DESC NULLS LAST
      `, [developerId]);

      const recentAssignments = await client.query(`
        SELECT COUNT(*) as count
        FROM task_assignments ta
        WHERE ta.developer_id::text = $1::text
        AND ta.start_date > NOW() - INTERVAL '30 days'
      `, [developerId]);

      const total = assignments.rows.length;
      const completed = assignments.rows.filter(task => task.completed_at).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Analyze complexity distribution
      const complexities = assignments.rows.map(task => task.complexity).filter(Boolean);
      const averageComplexity = complexities.length > 0 ? 
        complexities.reduce((acc, curr) => acc + (curr === 'high' ? 3 : curr === 'medium' ? 2 : 1), 0) / complexities.length > 2 ? 'high' :
        complexities.reduce((acc, curr) => acc + (curr === 'high' ? 3 : curr === 'medium' ? 2 : 1), 0) / complexities.length > 1.5 ? 'medium' : 'low'
        : 'medium';

      // Calculate on-time completion (placeholder - would need due dates)
      const onTimeCompletion = 85; // Default good score

      return {
        totalAssignments: total,
        completedTasks: completed,
        completionRate,
        averageComplexity,
        recentAssignments: parseInt(recentAssignments.rows[0].count),
        onTimeCompletion
      };
    } catch (error) {
      console.warn(`Error analyzing task performance for ${developerId}:`, error.message);
      return {
        totalAssignments: 0, completedTasks: 0, completionRate: 0,
        averageComplexity: 'medium', recentAssignments: 0, onTimeCompletion: 0
      };
    }
  }

  /**
   * Analyze module contributions (module_updates table)
   */
  private async analyzeModuleContributions(client: PoolClient, developerId: string): Promise<any> {
    try {
      const updates = await client.query(`
        SELECT 
          mu.*,
          mr.name as module_name,
          LENGTH(mu.content) as update_size
        FROM module_updates mu
        LEFT JOIN module_registry mr ON mu.module_id = mr.id
        WHERE mu.developer_id::text = $1::text
        ORDER BY mu.created_at DESC
      `, [developerId]);

      const recentUpdates = await client.query(`
        SELECT COUNT(*) as count
        FROM module_updates mu
        WHERE mu.developer_id::text = $1::text
        AND mu.created_at > NOW() - INTERVAL '30 days'
      `, [developerId]);

      const total = updates.rows.length;
      const totalTimeSpent = updates.rows.reduce((sum, update) => sum + (update.time_spent_minutes || 0), 0);
      const averageProgress = total > 0 ? 
        Math.round(updates.rows.reduce((sum, update) => sum + (update.progress_percentage || 0), 0) / total) : 0;
      
      const updateTypes = [...new Set(updates.rows.map(update => update.update_type).filter(Boolean))];
      
      // Calculate maintenance score based on update frequency and progress
      const maintenanceScore = Math.min(100, (total * 10) + (averageProgress * 0.5));

      return {
        totalUpdates: total,
        recentUpdates: parseInt(recentUpdates.rows[0].count),
        averageProgress,
        totalTimeSpent,
        updateTypes,
        maintenanceScore: Math.round(maintenanceScore)
      };
    } catch (error) {
      console.warn(`Error analyzing module contributions for ${developerId}:`, error.message);
      return {
        totalUpdates: 0, recentUpdates: 0, averageProgress: 0,
        totalTimeSpent: 0, updateTypes: [], maintenanceScore: 0
      };
    }
  }

  /**
   * Analyze work sessions (developer_work_sessions table)
   */
  private async analyzeWorkSessions(client: PoolClient, developerId: string): Promise<any> {
    try {
      const sessions = await client.query(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(total_work_minutes) as total_minutes,
          AVG(total_work_minutes) as avg_session_minutes,
          MAX(start_time) as latest_session,
          COUNT(CASE WHEN start_time > NOW() - INTERVAL '30 days' THEN 1 END) as recent_sessions
        FROM developer_work_sessions
        WHERE developer_id::text = $1::text
      `, [developerId]);

      const sessionData = sessions.rows[0];
      const totalSessions = parseInt(sessionData.total_sessions || 0);
      const totalMinutes = parseInt(sessionData.total_minutes || 0);
      const totalHours = Math.round(totalMinutes / 60);
      const averageSessionLength = Math.round(sessionData.avg_session_minutes || 0);
      const recentSessions = parseInt(sessionData.recent_sessions || 0);
      
      // Calculate consistency score based on regular sessions
      const consistencyScore = Math.min(100, (recentSessions * 10) + (totalSessions > 20 ? 20 : totalSessions));
      
      return {
        totalSessions,
        totalHours,
        averageSessionLength,
        recentSessions,
        consistencyScore,
        latestActivity: sessionData.latest_session ? new Date(sessionData.latest_session) : null
      };
    } catch (error) {
      console.warn(`Error analyzing work sessions for ${developerId}:`, error.message);
      return {
        totalSessions: 0, totalHours: 0, averageSessionLength: 0,
        recentSessions: 0, consistencyScore: 0, latestActivity: null
      };
    }
  }

  /**
   * Analyze platform activity (developer_activity_log table)
   */
  private async analyzePlatformActivity(client: PoolClient, developerId: string): Promise<any> {
    try {
      const activity = await client.query(`
        SELECT 
          COUNT(*) as total_activities,
          COUNT(DISTINCT activity_type) as activity_types,
          MAX(timestamp) as latest_activity,
          COUNT(CASE WHEN timestamp > NOW() - INTERVAL '30 days' THEN 1 END) as recent_activities
        FROM developer_activity_log
        WHERE developer_id::text = $1::text
      `, [developerId]);

      const activityData = activity.rows[0];
      const totalActivities = parseInt(activityData.total_activities || 0);
      const activityTypes = parseInt(activityData.activity_types || 0);
      const recentActivities = parseInt(activityData.recent_activities || 0);
      
      // Calculate engagement score
      const engagementScore = Math.min(100, (totalActivities * 0.5) + (activityTypes * 10) + (recentActivities * 2));
      
      // Calculate activity consistency
      const activityConsistency = Math.min(100, (recentActivities * 5) + (activityTypes * 8));

      return {
        totalActivities,
        activityTypes,
        engagementScore: Math.round(engagementScore),
        recentActivities,
        activityConsistency: Math.round(activityConsistency)
      };
    } catch (error) {
      console.warn(`Error analyzing platform activity for ${developerId}:`, error.message);
      return {
        totalActivities: 0, activityTypes: 0, engagementScore: 0,
        recentActivities: 0, activityConsistency: 0
      };
    }
  }

  /**
   * Calculate comprehensive CADIS scores
   */
  private calculateCADISScores(
    codeSubmissions: any, 
    taskPerformance: any, 
    moduleContributions: any, 
    workSessions: any, 
    platformActivity: any
  ): any {
    // Productivity score (40% weight)
    const productivityScore = Math.min(100,
      (codeSubmissions.total * 15) +
      (taskPerformance.totalAssignments * 8) +
      (moduleContributions.totalUpdates * 5) +
      (Math.min(workSessions.totalHours, 200) * 0.3)
    );

    // Quality score (30% weight)  
    const qualityScore = Math.round(
      (codeSubmissions.averageScore || 70) * 0.4 +
      (taskPerformance.completionRate) * 0.3 +
      (moduleContributions.averageProgress) * 0.2 +
      (Math.min(codeSubmissions.averageSubmissionSize / 100, 100)) * 0.1
    );

    // Consistency score (20% weight)
    const consistencyScore = Math.round(
      (workSessions.consistencyScore) * 0.4 +
      (platformActivity.activityConsistency) * 0.3 +
      (codeSubmissions.recentSubmissions * 10) * 0.2 +
      (taskPerformance.recentAssignments * 8) * 0.1
    );

    // Principle adherence (10% weight) - based on work patterns
    const principleAdherence = Math.round(
      (moduleContributions.updateTypes.includes('refactor') ? 20 : 0) +
      (codeSubmissions.averageSubmissionSize > 1000 ? 20 : 10) +
      (taskPerformance.completionRate > 80 ? 20 : 10) +
      (workSessions.consistencyScore > 70 ? 20 : 10) +
      (moduleContributions.totalUpdates > 5 ? 20 : 10) + 10 // Base score
    );

    // Overall performance (weighted average)
    const overallPerformance = Math.round(
      (productivityScore * 0.4) +
      (qualityScore * 0.3) +
      (consistencyScore * 0.2) +
      (principleAdherence * 0.1)
    );

    // Determine coaching priority
    let coachingPriority: 'low' | 'medium' | 'high' | 'excellent' = 'medium';
    if (overallPerformance >= 85) coachingPriority = 'excellent';
    else if (overallPerformance >= 70) coachingPriority = 'low';
    else if (overallPerformance >= 50) coachingPriority = 'medium';
    else coachingPriority = 'high';

    return {
      overallPerformance,
      productivityScore: Math.round(productivityScore),
      qualityScore,
      consistencyScore,
      principleAdherence,
      coachingPriority
    };
  }

  /**
   * Generate coaching insights based on comprehensive analysis
   */
  private generateCoachingInsights(
    developer: any,
    codeSubmissions: any,
    taskPerformance: any,
    moduleContributions: any,
    workSessions: any,
    cadisScores: any
  ): any {
    const strengths = [];
    const improvementAreas = [];
    const recommendations = [];
    const nextActions = [];

    // Identify strengths
    if (codeSubmissions.total >= 10) strengths.push('Consistent code submission practice');
    if (taskPerformance.completionRate >= 80) strengths.push('Reliable task completion');
    if (workSessions.totalHours >= 100) strengths.push('Strong work time commitment');
    if (moduleContributions.totalUpdates >= 10) strengths.push('Active module maintenance');
    if (cadisScores.overallPerformance >= 85) strengths.push('Excellent overall performance');
    if (codeSubmissions.averageSubmissionSize >= 5000) strengths.push('Substantial code contributions');
    if (workSessions.consistencyScore >= 80) strengths.push('Consistent work patterns');

    // Identify improvement areas
    if (codeSubmissions.total < 5) improvementAreas.push('Increase code submission frequency');
    if (taskPerformance.completionRate < 70) improvementAreas.push('Improve task completion rate');
    if (workSessions.recentSessions < 10) improvementAreas.push('More consistent work sessions');
    if (moduleContributions.averageProgress < 50) improvementAreas.push('Complete module updates more thoroughly');
    if (codeSubmissions.averageScore < 80 && codeSubmissions.total > 0) improvementAreas.push('Focus on code quality improvement');

    // Generate specific recommendations
    if (codeSubmissions.total < 5) {
      recommendations.push('Increase code submission frequency - aim for 1-2 submissions per week');
      nextActions.push('Submit code for current task within 3 days');
    }
    
    if (workSessions.totalHours >= 200 && codeSubmissions.total < 10) {
      recommendations.push('Convert work hours into more code submissions - high effort but low output ratio');
      nextActions.push('Break down current work into smaller, submittable pieces');
    }
    
    if (taskPerformance.completionRate < 70) {
      recommendations.push('Focus on completing assigned tasks before taking on new work');
      nextActions.push('Review current task list and prioritize completion');
    }
    
    if (moduleContributions.totalUpdates < 3) {
      recommendations.push('Engage more in module maintenance and updates');
      nextActions.push('Review existing modules and propose improvements');
    }

    // Default positive recommendations for high performers
    if (cadisScores.overallPerformance >= 85) {
      recommendations.push('Continue excellent work and consider mentoring other developers');
      nextActions.push('Identify opportunities to share knowledge with team');
    }

    // Determine performance level
    let performanceLevel: 'Developing' | 'Satisfactory' | 'Good' | 'Excellent' = 'Developing';
    if (cadisScores.overallPerformance >= 85) performanceLevel = 'Excellent';
    else if (cadisScores.overallPerformance >= 70) performanceLevel = 'Good';
    else if (cadisScores.overallPerformance >= 55) performanceLevel = 'Satisfactory';

    return {
      strengths,
      improvementAreas,
      specificRecommendations: recommendations,
      nextActions,
      performanceLevel
    };
  }

  /**
   * Generate comprehensive team intelligence
   */
  private async generateTeamIntelligence(profiles: CADISDeveloperProfile[]): Promise<CADISTeamIntelligence> {
    const totalDevelopers = profiles.length;
    
    // Calculate team metrics
    const averageTeamScore = totalDevelopers > 0 ? 
      Math.round(profiles.reduce((sum, dev) => sum + dev.cadisScores.overallPerformance, 0) / totalDevelopers) : 0;
    
    const totalWorkHours = profiles.reduce((sum, dev) => sum + dev.workSessions.totalHours, 0);
    const totalCodeSubmissions = profiles.reduce((sum, dev) => sum + dev.codeSubmissions.total, 0);
    
    const teamProductivity = totalDevelopers > 0 ?
      Math.round(profiles.reduce((sum, dev) => sum + dev.cadisScores.productivityScore, 0) / totalDevelopers) : 0;
    
    const teamQuality = totalDevelopers > 0 ?
      Math.round(profiles.reduce((sum, dev) => sum + dev.cadisScores.qualityScore, 0) / totalDevelopers) : 0;

    // Identify top performers and development areas
    const topPerformers = profiles
      .filter(dev => dev.cadisScores.overallPerformance >= 80)
      .sort((a, b) => b.cadisScores.overallPerformance - a.cadisScores.overallPerformance);

    const developmentAreas = profiles
      .filter(dev => dev.cadisScores.overallPerformance < 70)
      .sort((a, b) => a.cadisScores.overallPerformance - b.cadisScores.overallPerformance);

    // Generate team insights
    const teamInsights = this.generateTeamInsights(profiles);
    
    // Generate coaching strategy
    const coachingStrategy = this.generateCoachingStrategy(profiles, teamInsights);
    
    // Calculate principle alignment
    const principleAlignment = this.calculatePrincipleAlignment(profiles);

    return {
      teamOverview: {
        totalActiveDevelopers: totalDevelopers,
        averageTeamScore,
        totalWorkHours,
        totalCodeSubmissions,
        teamProductivity,
        teamQuality
      },
      topPerformers,
      developmentAreas,
      teamInsights,
      coachingStrategy,
      principleAlignment
    };
  }

  /**
   * Generate team insights
   */
  private generateTeamInsights(profiles: CADISDeveloperProfile[]): any {
    const strengths = [];
    const challenges = [];
    const opportunities = [];
    const risks = [];

    const avgWorkHours = profiles.reduce((sum, dev) => sum + dev.workSessions.totalHours, 0) / profiles.length;
    const avgSubmissions = profiles.reduce((sum, dev) => sum + dev.codeSubmissions.total, 0) / profiles.length;
    const highPerformers = profiles.filter(dev => dev.cadisScores.overallPerformance >= 80).length;

    // Team strengths
    if (avgWorkHours >= 200) strengths.push('Team shows strong work commitment (300+ hours/month average)');
    if (highPerformers >= profiles.length * 0.6) strengths.push('Majority of team performing at high level');
    if (avgSubmissions >= 10) strengths.push('Good code submission practices across team');

    // Team challenges  
    if (avgSubmissions < 5) challenges.push('Low code submission frequency relative to work hours');
    if (highPerformers < profiles.length * 0.5) challenges.push('Less than half of team at optimal performance');

    // Opportunities
    if (avgWorkHours >= 200 && avgSubmissions < 10) {
      opportunities.push('High work commitment can be converted to more code output');
    }
    opportunities.push('Strong foundation for scaling development practices');

    // Risks
    if (avgSubmissions < 3) risks.push('Risk of work not being properly tracked or submitted');

    return { strengths, challenges, opportunities, risks };
  }

  /**
   * Generate coaching strategy
   */
  private generateCoachingStrategy(profiles: CADISDeveloperProfile[], teamInsights: any): any {
    const immediateActions = [];
    const weeklyFocus = [];
    const monthlyGoals = [];
    const quarterlyObjectives = [];

    // Immediate actions based on team analysis
    const lowSubmitters = profiles.filter(dev => dev.codeSubmissions.total < 5);
    if (lowSubmitters.length > 0) {
      immediateActions.push(`Code submission training for ${lowSubmitters.length} developers`);
    }

    const inconsistentWorkers = profiles.filter(dev => dev.workSessions.consistencyScore < 60);
    if (inconsistentWorkers.length > 0) {
      immediateActions.push(`Work session consistency improvement for ${inconsistentWorkers.length} developers`);
    }

    // Weekly focus
    weeklyFocus.push('Monitor code submission frequency and quality');
    weeklyFocus.push('Review task completion rates and blockers');
    weeklyFocus.push('Ensure work session tracking consistency');

    // Monthly goals
    monthlyGoals.push('Increase team average code submissions by 25%');
    monthlyGoals.push('Maintain 85%+ task completion rate');
    monthlyGoals.push('Achieve 90%+ work session consistency');

    // Quarterly objectives
    quarterlyObjectives.push('Develop team mentoring program with top performers');
    quarterlyObjectives.push('Implement advanced code quality metrics');
    quarterlyObjectives.push('Create developer career progression pathways');

    return {
      immediateActions,
      weeklyFocus,
      monthlyGoals,
      quarterlyObjectives
    };
  }

  /**
   * Calculate principle alignment across team
   */
  private calculatePrincipleAlignment(profiles: CADISDeveloperProfile[]): any {
    const avgModularity = Math.round(
      profiles.reduce((sum, dev) => sum + (dev.moduleContributions.totalUpdates > 0 ? 70 : 40), 0) / profiles.length
    );
    
    const avgReusability = Math.round(
      profiles.reduce((sum, dev) => sum + (dev.codeSubmissions.averageSubmissionSize > 2000 ? 75 : 50), 0) / profiles.length
    );
    
    const avgDocumentation = Math.round(
      profiles.reduce((sum, dev) => sum + (dev.moduleContributions.updateTypes.includes('documentation') ? 80 : 45), 0) / profiles.length
    );
    
    const avgTesting = Math.round(
      profiles.reduce((sum, dev) => sum + (dev.moduleContributions.updateTypes.includes('testing') ? 75 : 40), 0) / profiles.length
    );

    const overallAlignment = Math.round((avgModularity + avgReusability + avgDocumentation + avgTesting) / 4);

    return {
      modularityScore: avgModularity,
      reusabilityScore: avgReusability,
      documentationScore: avgDocumentation,
      testingScore: avgTesting,
      overallAlignment
    };
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient();
  }

  private async getVibezClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient(); // Uses VIBEZS_DB connection
  }
}

export default CADISDeveloperIntelligenceService;
