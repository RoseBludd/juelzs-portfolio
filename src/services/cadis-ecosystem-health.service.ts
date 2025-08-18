import DatabaseService from './database.service';
import { PoolClient } from 'pg';

export interface EcosystemHealthInsight {
  id: string;
  title: string;
  content: string;
  healthScore: number;
  recommendations: string[];
  criticalIssues: string[];
  optimizationOpportunities: string[];
  systemMetrics: {
    moduleCount: number;
    journalEntries: number;
    activityLevel: string;
    overallHealth: number;
  };
}

/**
 * CADIS Ecosystem Health Service
 * Focuses purely on system health, performance, and ecosystem optimization
 */
class CADISEcosystemHealthService {
  private static instance: CADISEcosystemHealthService;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): CADISEcosystemHealthService {
    if (!CADISEcosystemHealthService.instance) {
      CADISEcosystemHealthService.instance = new CADISEcosystemHealthService();
    }
    return CADISEcosystemHealthService.instance;
  }

  async generateEcosystemHealthInsight(): Promise<EcosystemHealthInsight | null> {
    try {
      const client = await this.getClient();
      
      try {
        console.log('🏥 Analyzing ecosystem health...');
        
        const [moduleStats, journalStats, systemHealth] = await Promise.all([
          client.query(`
            SELECT 
              type, 
              COUNT(*) as count,
              MAX(created_at) as latest_addition,
              MIN(created_at) as earliest_addition
            FROM module_registry 
            GROUP BY type
            ORDER BY count DESC
          `),
          
          client.query(`
            SELECT 
              category,
              COUNT(*) as entries,
              MAX(created_at) as latest_entry
            FROM journal_entries 
            WHERE created_at > NOW() - INTERVAL '30 days'
            GROUP BY category
          `),
          
          client.query(`
            SELECT COUNT(*) as total_tables
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          `)
        ]);

        const totalModules = moduleStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        const totalJournalEntries = journalStats.rows.reduce((sum, row) => sum + parseInt(row.entries), 0);
        const healthScore = this.calculateHealthScore(moduleStats.rows, journalStats.rows);

        const insight: EcosystemHealthInsight = {
          id: `ecosystem_health_${Date.now()}`,
          title: 'Ecosystem Health Analysis',
          content: this.generateHealthContent(moduleStats.rows, journalStats.rows, healthScore),
          healthScore,
          recommendations: this.generateHealthRecommendations(healthScore, moduleStats.rows),
          criticalIssues: this.identifyCriticalIssues(moduleStats.rows, journalStats.rows),
          optimizationOpportunities: this.identifyOptimizationOpportunities(moduleStats.rows),
          systemMetrics: {
            moduleCount: totalModules,
            journalEntries: totalJournalEntries,
            activityLevel: this.assessActivityLevel(moduleStats.rows),
            overallHealth: healthScore
          }
        };

        return insight;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error generating ecosystem health insight:', error);
      return null;
    }
  }

  private calculateHealthScore(moduleStats: any[], journalStats: any[]): number {
    const moduleScore = Math.min(100, moduleStats.length * 15); // Up to ~7 types = 100
    const journalScore = Math.min(100, journalStats.length * 10); // Up to 10 categories = 100
    const diversityScore = moduleStats.length > 3 ? 100 : moduleStats.length * 25;
    
    return Math.round((moduleScore + journalScore + diversityScore) / 3);
  }

  private generateHealthContent(moduleStats: any[], journalStats: any[], healthScore: number): string {
    const totalModules = moduleStats.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    return `
# Ecosystem Health Analysis

## Current System State
- **Overall Health Score**: ${healthScore}/100
- **Module Registry**: ${totalModules} modules across ${moduleStats.length} categories
- **Journal Insights**: ${journalStats.length} active categories with recent entries
- **System Diversity**: ${moduleStats.length > 3 ? 'Excellent' : 'Good'} module type diversity

## Module Registry Health
${moduleStats.map(stat => `- **${stat.type}**: ${stat.count} modules (latest: ${new Date(stat.latest_addition).toLocaleDateString()})`).join('\n')}

## Journal Activity Health
${journalStats.map(stat => `- **${stat.category}**: ${stat.entries} entries (latest: ${new Date(stat.latest_entry).toLocaleDateString()})`).join('\n')}

## Health Assessment
${healthScore >= 90 ? 'Excellent ecosystem health with strong foundation for scaling' :
  healthScore >= 75 ? 'Good ecosystem health with minor optimization opportunities' :
  healthScore >= 60 ? 'Moderate ecosystem health requiring focused improvements' :
  'Ecosystem health needs immediate attention and optimization'}

---
*CADIS Ecosystem Health Service: Continuous system health monitoring and optimization*
    `.trim();
  }

  private generateHealthRecommendations(healthScore: number, moduleStats: any[]): string[] {
    const recommendations = [];
    
    if (healthScore < 75) {
      recommendations.push('Increase module type diversity for better ecosystem resilience');
    }
    
    if (moduleStats.length < 4) {
      recommendations.push('Expand module categories to improve system capabilities');
    }
    
    recommendations.push('Monitor module usage patterns for optimization opportunities');
    recommendations.push('Maintain regular journal insights for business context');
    
    return recommendations;
  }

  private identifyCriticalIssues(moduleStats: any[], journalStats: any[]): string[] {
    const issues = [];
    
    if (moduleStats.length < 3) {
      issues.push('Low module type diversity may limit scaling capabilities');
    }
    
    if (journalStats.length < 3) {
      issues.push('Limited journal category diversity may indicate narrow focus');
    }
    
    return issues;
  }

  private identifyOptimizationOpportunities(moduleStats: any[]): string[] {
    const opportunities = [];
    
    const topModuleType = moduleStats[0];
    if (topModuleType && parseInt(topModuleType.count) > 500) {
      opportunities.push(`${topModuleType.type} modules (${topModuleType.count}) could benefit from subcategorization`);
    }
    
    opportunities.push('Module registry could benefit from performance indexing');
    opportunities.push('Cross-module dependency analysis would identify optimization potential');
    
    return opportunities;
  }

  private assessActivityLevel(moduleStats: any[]): string {
    const recentActivity = moduleStats.filter(stat => {
      const daysSinceUpdate = (Date.now() - new Date(stat.latest_addition).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate < 7;
    }).length;
    
    return recentActivity > 2 ? 'high' : recentActivity > 0 ? 'medium' : 'low';
  }

  private async getClient(): Promise<PoolClient> {
    return this.dbService.getPoolClient();
  }
}

export default CADISEcosystemHealthService;
