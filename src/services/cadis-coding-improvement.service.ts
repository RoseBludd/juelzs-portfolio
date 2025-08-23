import { PoolClient } from 'pg';

export interface CodingScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'architecture' | 'optimization' | 'debugging' | 'feature_development' | 'refactoring';
  scenario: string;
  expectedOutcome: string;
  principles: string[];
  createdAt: Date;
}

export interface CodingAttempt {
  id: string;
  scenarioId: string;
  agentVersion: string;
  approach: string;
  solution: string;
  score: number; // 0-100
  principleAdherence: {
    executionLed: number;
    modularity: number;
    reusability: number;
    progressiveEnhancement: number;
  };
  feedback: string;
  improvementAreas: string[];
  completedAt: Date;
}

export interface CodingProgress {
  overallScore: number;
  principleScores: {
    executionLed: number;
    modularity: number;
    reusability: number;
    progressiveEnhancement: number;
  };
  categoryScores: {
    architecture: number;
    optimization: number;
    debugging: number;
    feature_development: number;
    refactoring: number;
  };
  totalAttempts: number;
  recentImprovement: number;
  lastUpdated: Date;
}

class CADISCodingImprovementService {
  private static instance: CADISCodingImprovementService;

  public static getInstance(): CADISCodingImprovementService {
    if (!CADISCodingImprovementService.instance) {
      CADISCodingImprovementService.instance = new CADISCodingImprovementService();
    }
    return CADISCodingImprovementService.instance;
  }

  async initialize(): Promise<void> {
    console.log('🧠 Initializing CADIS Coding Improvement Service...');
    await this.ensureTablesExist();
  }

  private async ensureTablesExist(): Promise<void> {
    const DatabaseService = (await import('./database.service')).default;
    const client = await DatabaseService.getClient();
    
    try {
      // Create coding_scenarios table
      await client.query(`
        CREATE TABLE IF NOT EXISTS coding_scenarios (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT NOT NULL,
          difficulty VARCHAR(50) NOT NULL,
          category VARCHAR(100) NOT NULL,
          scenario TEXT NOT NULL,
          expected_outcome TEXT NOT NULL,
          principles JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create coding_attempts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS coding_attempts (
          id VARCHAR(255) PRIMARY KEY,
          scenario_id VARCHAR(255) REFERENCES coding_scenarios(id),
          agent_version VARCHAR(100) NOT NULL,
          approach TEXT NOT NULL,
          solution TEXT NOT NULL,
          score INTEGER NOT NULL,
          principle_adherence JSONB NOT NULL,
          feedback TEXT NOT NULL,
          improvement_areas JSONB NOT NULL,
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create coding_progress table
      await client.query(`
        CREATE TABLE IF NOT EXISTS coding_progress (
          id SERIAL PRIMARY KEY,
          overall_score DECIMAL(5,2) NOT NULL,
          principle_scores JSONB NOT NULL,
          category_scores JSONB NOT NULL,
          total_attempts INTEGER NOT NULL,
          recent_improvement DECIMAL(5,2) NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Coding improvement tables ensured');
    } finally {
      client.release();
    }
  }

  async generateCodingScenarios(): Promise<CodingScenario[]> {
    console.log('🎯 Generating new coding scenarios for CADIS improvement...');
    
    const scenarios: CodingScenario[] = [
      {
        id: `scenario-${Date.now()}-1`,
        title: 'Modular Authentication System',
        description: 'Design a reusable authentication system following execution-led refinement principles',
        difficulty: 'intermediate',
        category: 'architecture',
        scenario: `Create an authentication system that can be easily integrated into multiple projects. 
                  It should handle login, logout, session management, and role-based access control.
                  Focus on modularity and reusability while maintaining security best practices.`,
        expectedOutcome: 'A modular auth system with clear interfaces, reusable components, and progressive enhancement capabilities',
        principles: ['modularity', 'reusability', 'progressiveEnhancement'],
        createdAt: new Date()
      },
      {
        id: `scenario-${Date.now()}-2`,
        title: 'Performance Optimization Challenge',
        description: 'Optimize a slow-loading dashboard using execution-led approach',
        difficulty: 'advanced',
        category: 'optimization',
        scenario: `You have a dashboard that loads slowly due to multiple API calls and heavy components.
                  Apply execution-led refinement to identify bottlenecks and implement solutions.
                  Focus on immediate impact while building foundation for future improvements.`,
        expectedOutcome: 'Significantly improved load times with maintainable optimization patterns',
        principles: ['executionLed', 'progressiveEnhancement'],
        createdAt: new Date()
      },
      {
        id: `scenario-${Date.now()}-3`,
        title: 'Legacy Code Refactoring',
        description: 'Refactor legacy code to follow modern architectural principles',
        difficulty: 'expert',
        category: 'refactoring',
        scenario: `Transform a monolithic legacy component into a modular, reusable system.
                  Maintain backward compatibility while introducing modern patterns.
                  Apply progressive enhancement to gradually improve the system.`,
        expectedOutcome: 'Clean, modular code that maintains functionality while enabling future enhancements',
        principles: ['modularity', 'reusability', 'progressiveEnhancement'],
        createdAt: new Date()
      },
      {
        id: `scenario-${Date.now()}-4`,
        title: 'Real-time Feature Development',
        description: 'Build a real-time notification system with WebSocket integration',
        difficulty: 'intermediate',
        category: 'feature_development',
        scenario: `Develop a real-time notification system that can handle multiple notification types,
                  user preferences, and graceful fallbacks. Use execution-led approach to deliver
                  core functionality first, then enhance with advanced features.`,
        expectedOutcome: 'Robust real-time system with fallback mechanisms and extensible architecture',
        principles: ['executionLed', 'modularity', 'progressiveEnhancement'],
        createdAt: new Date()
      },
      {
        id: `scenario-${Date.now()}-5`,
        title: 'Complex Bug Investigation',
        description: 'Debug a memory leak in a React application',
        difficulty: 'advanced',
        category: 'debugging',
        scenario: `Investigate and fix a memory leak causing performance degradation in production.
                  Use systematic debugging approach, implement monitoring, and create preventive measures.
                  Apply execution-led refinement to fix the immediate issue while building long-term solutions.`,
        expectedOutcome: 'Fixed memory leak with monitoring and prevention systems in place',
        principles: ['executionLed', 'modularity'],
        createdAt: new Date()
      }
    ];

    // Store scenarios in database
    const DatabaseService = (await import('./database.service')).default;
    const client = await DatabaseService.getClient();
    try {
      for (const scenario of scenarios) {
        await client.query(`
          INSERT INTO coding_scenarios (id, title, description, difficulty, category, scenario, expected_outcome, principles)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [
          scenario.id,
          scenario.title,
          scenario.description,
          scenario.difficulty,
          scenario.category,
          scenario.scenario,
          scenario.expectedOutcome,
          JSON.stringify(scenario.principles)
        ]);
      }
    } finally {
      client.release();
    }

    return scenarios;
  }

  async runCodingScenario(scenarioId: string): Promise<CodingAttempt> {
    console.log(`🚀 Running coding scenario: ${scenarioId}`);
    
    const DatabaseService = (await import('./database.service')).default;
    const client = await DatabaseService.getClient();
    let scenario: CodingScenario;
    
    try {
      const result = await client.query('SELECT * FROM coding_scenarios WHERE id = $1', [scenarioId]);
      if (result.rows.length === 0) {
        throw new Error(`Scenario ${scenarioId} not found`);
      }
      
      scenario = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        difficulty: result.rows[0].difficulty,
        category: result.rows[0].category,
        scenario: result.rows[0].scenario,
        expectedOutcome: result.rows[0].expected_outcome,
        principles: result.rows[0].principles,
        createdAt: result.rows[0].created_at
      };
    } finally {
      client.release();
    }

    // Simulate CADIS agent working on the scenario
    const attempt = await this.simulateAgentAttempt(scenario);
    
    // Store the attempt
    await this.storeCodingAttempt(attempt);
    
    // Update progress
    await this.updateCodingProgress();
    
    return attempt;
  }

  private async simulateAgentAttempt(scenario: CodingScenario): Promise<CodingAttempt> {
    // Simulate AI agent working on the coding scenario
    // In reality, this would use the actual AI models to generate solutions
    
    const baseScore = this.getBaseScoreForDifficulty(scenario.difficulty);
    const randomVariation = (Math.random() - 0.5) * 20; // ±10 points variation
    const score = Math.max(0, Math.min(100, baseScore + randomVariation));
    
    const principleAdherence = {
      executionLed: this.calculatePrincipleScore(scenario.principles.includes('executionLed'), score),
      modularity: this.calculatePrincipleScore(scenario.principles.includes('modularity'), score),
      reusability: this.calculatePrincipleScore(scenario.principles.includes('reusability'), score),
      progressiveEnhancement: this.calculatePrincipleScore(scenario.principles.includes('progressiveEnhancement'), score)
    };

    return {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scenarioId: scenario.id,
      agentVersion: 'CADIS-Tower-v1.0.0',
      approach: this.generateApproachDescription(scenario),
      solution: this.generateSolutionDescription(scenario, score),
      score: Math.round(score),
      principleAdherence,
      feedback: this.generateFeedback(score, principleAdherence),
      improvementAreas: this.generateImprovementAreas(score, principleAdherence),
      completedAt: new Date()
    };
  }

  private getBaseScoreForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'beginner': return 85;
      case 'intermediate': return 75;
      case 'advanced': return 65;
      case 'expert': return 55;
      default: return 70;
    }
  }

  private calculatePrincipleScore(isPrincipleRelevant: boolean, overallScore: number): number {
    if (!isPrincipleRelevant) return overallScore;
    
    // Add bonus for relevant principles
    const bonus = Math.random() * 10;
    return Math.min(100, Math.round(overallScore + bonus));
  }

  private generateApproachDescription(scenario: CodingScenario): string {
    const approaches = {
      architecture: 'Applied modular design patterns with clear separation of concerns',
      optimization: 'Used execution-led approach to identify and fix performance bottlenecks',
      debugging: 'Systematic debugging with comprehensive logging and monitoring',
      feature_development: 'Progressive enhancement starting with core functionality',
      refactoring: 'Incremental refactoring maintaining backward compatibility'
    };
    
    return approaches[scenario.category as keyof typeof approaches] || 'Applied systematic problem-solving approach';
  }

  private generateSolutionDescription(scenario: CodingScenario, score: number): string {
    if (score >= 80) {
      return `Implemented comprehensive solution following all architectural principles. 
              Created modular, reusable components with excellent error handling and documentation.`;
    } else if (score >= 60) {
      return `Delivered functional solution with good adherence to core principles. 
              Some areas identified for future improvement and optimization.`;
    } else {
      return `Basic solution implemented with room for significant improvement. 
              Several principle violations identified that need addressing.`;
    }
  }

  private generateFeedback(score: number, principles: any): string {
    if (score >= 80) {
      return `Excellent work! Strong adherence to architectural principles with clean, maintainable code.`;
    } else if (score >= 60) {
      return `Good progress! Solution works well with some opportunities for principle alignment improvement.`;
    } else {
      return `Needs improvement. Focus on better principle adherence and code quality standards.`;
    }
  }

  private generateImprovementAreas(score: number, principles: any): string[] {
    const areas: string[] = [];
    
    if (principles.executionLed < 70) areas.push('Better execution-led approach');
    if (principles.modularity < 70) areas.push('Improve modularity and separation of concerns');
    if (principles.reusability < 70) areas.push('Enhance reusability patterns');
    if (principles.progressiveEnhancement < 70) areas.push('Apply progressive enhancement principles');
    
    if (score < 60) {
      areas.push('Code quality and best practices');
      areas.push('Error handling and edge cases');
    }
    
    return areas.length > 0 ? areas : ['Continue refining implementation details'];
  }

  private async storeCodingAttempt(attempt: CodingAttempt): Promise<void> {
    const DatabaseService = (await import('./database.service')).default;
    const client = await DatabaseService.getClient();
    
    try {
      await client.query(`
        INSERT INTO coding_attempts (
          id, scenario_id, agent_version, approach, solution, score, 
          principle_adherence, feedback, improvement_areas, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        attempt.id,
        attempt.scenarioId,
        attempt.agentVersion,
        attempt.approach,
        attempt.solution,
        attempt.score,
        JSON.stringify(attempt.principleAdherence),
        attempt.feedback,
        JSON.stringify(attempt.improvementAreas),
        attempt.completedAt
      ]);
    } finally {
      client.release();
    }
  }

  private async updateCodingProgress(): Promise<void> {
    const DatabaseService = (await import('./database.service')).default;
    const client = await DatabaseService.getClient();
    
    try {
      // Calculate overall progress from recent attempts
      const result = await client.query(`
        SELECT 
          AVG(score) as overall_score,
          AVG((principle_adherence->>'executionLed')::numeric) as execution_led,
          AVG((principle_adherence->>'modularity')::numeric) as modularity,
          AVG((principle_adherence->>'reusability')::numeric) as reusability,
          AVG((principle_adherence->>'progressiveEnhancement')::numeric) as progressive_enhancement,
          COUNT(*) as total_attempts
        FROM coding_attempts
        WHERE completed_at >= NOW() - INTERVAL '30 days'
      `);

      const categoryResult = await client.query(`
        SELECT 
          cs.category,
          AVG(ca.score) as avg_score
        FROM coding_attempts ca
        JOIN coding_scenarios cs ON ca.scenario_id = cs.id
        WHERE ca.completed_at >= NOW() - INTERVAL '30 days'
        GROUP BY cs.category
      `);

      const row = result.rows[0];
      const categoryScores: any = {};
      
      categoryResult.rows.forEach(cat => {
        categoryScores[cat.category] = Math.round(parseFloat(cat.avg_score) || 0);
      });

      const progress: CodingProgress = {
        overallScore: Math.round(parseFloat(row.overall_score) || 0),
        principleScores: {
          executionLed: Math.round(parseFloat(row.execution_led) || 0),
          modularity: Math.round(parseFloat(row.modularity) || 0),
          reusability: Math.round(parseFloat(row.reusability) || 0),
          progressiveEnhancement: Math.round(parseFloat(row.progressive_enhancement) || 0)
        },
        categoryScores: {
          architecture: categoryScores.architecture || 0,
          optimization: categoryScores.optimization || 0,
          debugging: categoryScores.debugging || 0,
          feature_development: categoryScores.feature_development || 0,
          refactoring: categoryScores.refactoring || 0
        },
        totalAttempts: parseInt(row.total_attempts) || 0,
        recentImprovement: 0, // Would calculate trend
        lastUpdated: new Date()
      };

      // Store or update progress
      await client.query(`
        INSERT INTO coding_progress (
          overall_score, principle_scores, category_scores, 
          total_attempts, recent_improvement, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        progress.overallScore,
        JSON.stringify(progress.principleScores),
        JSON.stringify(progress.categoryScores),
        progress.totalAttempts,
        progress.recentImprovement,
        progress.lastUpdated
      ]);

    } finally {
      client.release();
    }
  }

  async getCodingProgress(): Promise<CodingProgress | null> {
    const DatabaseService = (await import('./database.service')).default;
    const client = await DatabaseService.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM coding_progress 
        ORDER BY last_updated DESC 
        LIMIT 1
      `);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        overallScore: parseFloat(row.overall_score),
        principleScores: row.principle_scores,
        categoryScores: row.category_scores,
        totalAttempts: row.total_attempts,
        recentImprovement: parseFloat(row.recent_improvement),
        lastUpdated: row.last_updated
      };
    } finally {
      client.release();
    }
  }

  async runScheduledImprovementSession(): Promise<void> {
    console.log('🎯 Running scheduled CADIS coding improvement session...');
    
    try {
      // Generate new scenarios if needed
      const scenarios = await this.generateCodingScenarios();
      
      // Run 2-3 random scenarios
      const selectedScenarios = scenarios.slice(0, Math.floor(Math.random() * 2) + 2);
      
      for (const scenario of selectedScenarios) {
        await this.runCodingScenario(scenario.id);
        console.log(`✅ Completed scenario: ${scenario.title}`);
      }
      
      console.log('🎉 Coding improvement session completed successfully!');
    } catch (error) {
      console.error('❌ Error in coding improvement session:', error);
    }
  }
}

export default CADISCodingImprovementService;
