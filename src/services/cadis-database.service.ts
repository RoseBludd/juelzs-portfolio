/**
 * CADIS Database Service
 * 
 * Manages CADIS-specific database tables for decisions, traces, and memory
 * Integrates with the same structure as vibezs-platform but local to juelzs-portfolio
 */

import DatabaseService from './database.service';

export interface CADISDecision {
  id: string;
  context: string;
  question: string;
  recommendation: string;
  reasoning: string;
  confidence: number;
  insights: string[];
  patterns: string[];
  timestamp: Date;
  executionTime: number;
  status: 'success' | 'partial' | 'error';
  philosophyAlignment: string[];
  source: 'journal' | 'intelligence-flow' | 'trace' | 'manual' | 'core-analysis' | 'real-scenario';
  tenantId?: string;
  metadata?: Record<string, any>;
  traceId?: string;
  parentDecisionId?: string;
  branchStrategy?: string;
  deploymentPlan?: string;
  environmentHandling?: string;
  approvalRequired?: boolean;
  riskAssessment?: 'low' | 'medium' | 'high' | 'extreme';
  syncStatus?: 'pending' | 'synced' | 'conflict';
}

export interface CADISTrace {
  traceId: string;
  parentTraceId?: string;
  branchId: string;
  operation: string;
  queryText: string;
  parameters?: Record<string, any>;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  rowCount?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  environment: string;
  decisionId?: string;
}

export class CADISDatabaseService {
  private static instance: CADISDatabaseService;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  static getInstance(): CADISDatabaseService {
    if (!CADISDatabaseService.instance) {
      CADISDatabaseService.instance = new CADISDatabaseService();
    }
    return CADISDatabaseService.instance;
  }

  /**
   * Initialize all CADIS database tables
   */
  async initializeCADISTables(): Promise<void> {
    console.log('🗄️ Initializing CADIS database tables...');
    
    const client = await this.databaseService.getPoolClient();
    
    try {
      // CADIS Memory table (same structure as vibezs)
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_memory (
          memory_id VARCHAR(255) PRIMARY KEY,
          tenant_id VARCHAR(100) NOT NULL DEFAULT 'juelzs-portfolio',
          category VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
          context JSONB,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          last_used TIMESTAMP DEFAULT NOW(),
          usage_count INTEGER DEFAULT 0
        )
      `);

      // CADIS Decisions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_decisions (
          id VARCHAR(255) PRIMARY KEY,
          context TEXT NOT NULL,
          question TEXT NOT NULL,
          recommendation TEXT NOT NULL,
          reasoning TEXT NOT NULL,
          confidence DECIMAL(3,2) NOT NULL,
          insights JSONB,
          patterns JSONB,
          timestamp TIMESTAMP DEFAULT NOW(),
          execution_time_ms INTEGER,
          status VARCHAR(20) DEFAULT 'success',
          philosophy_alignment JSONB,
          source VARCHAR(50) NOT NULL,
          tenant_id VARCHAR(100) DEFAULT 'juelzs-portfolio',
          metadata JSONB,
          trace_id VARCHAR(255),
          parent_decision_id VARCHAR(255),
          branch_strategy VARCHAR(200),
          deployment_plan TEXT,
          environment_handling TEXT,
          approval_required BOOLEAN DEFAULT FALSE,
          risk_assessment VARCHAR(20) DEFAULT 'low',
          sync_status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // CADIS Trace Archive table (same structure as vibezs tbl_trace_archive)
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_trace_archive (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          trace_id VARCHAR(255) UNIQUE NOT NULL,
          parent_trace_id VARCHAR(255),
          branch_id VARCHAR(100) NOT NULL,
          operation VARCHAR(100) NOT NULL,
          query_text TEXT NOT NULL,
          parameters JSONB,
          start_time BIGINT NOT NULL,
          end_time BIGINT,
          duration_ms INTEGER,
          row_count INTEGER,
          success BOOLEAN NOT NULL DEFAULT false,
          error_message TEXT,
          metadata JSONB,
          environment VARCHAR(50) DEFAULT 'development',
          decision_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // CADIS Cross-Repo Patterns table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_cross_repo_patterns (
          pattern_id VARCHAR(255) PRIMARY KEY,
          pattern_name VARCHAR(200) NOT NULL,
          source_repo VARCHAR(100) NOT NULL,
          target_repo VARCHAR(100),
          pattern_type VARCHAR(50) NOT NULL,
          success_rate DECIMAL(5,2) DEFAULT 0.0,
          usage_count INTEGER DEFAULT 0,
          pattern_data JSONB NOT NULL,
          confidence DECIMAL(3,2) DEFAULT 0.5,
          last_used TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_cadis_memory_tenant ON cadis_memory(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_cadis_memory_category ON cadis_memory(category);
        CREATE INDEX IF NOT EXISTS idx_cadis_memory_confidence ON cadis_memory(confidence);
        CREATE INDEX IF NOT EXISTS idx_cadis_memory_last_used ON cadis_memory(last_used);
        
        CREATE INDEX IF NOT EXISTS idx_cadis_decisions_tenant ON cadis_decisions(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_cadis_decisions_source ON cadis_decisions(source);
        CREATE INDEX IF NOT EXISTS idx_cadis_decisions_status ON cadis_decisions(status);
        CREATE INDEX IF NOT EXISTS idx_cadis_decisions_timestamp ON cadis_decisions(timestamp);
        CREATE INDEX IF NOT EXISTS idx_cadis_decisions_trace_id ON cadis_decisions(trace_id);
        
        CREATE INDEX IF NOT EXISTS idx_cadis_trace_archive_trace_id ON cadis_trace_archive(trace_id);
        CREATE INDEX IF NOT EXISTS idx_cadis_trace_archive_branch_id ON cadis_trace_archive(branch_id);
        CREATE INDEX IF NOT EXISTS idx_cadis_trace_archive_created_at ON cadis_trace_archive(created_at);
        CREATE INDEX IF NOT EXISTS idx_cadis_trace_archive_success ON cadis_trace_archive(success);
        CREATE INDEX IF NOT EXISTS idx_cadis_trace_archive_decision_id ON cadis_trace_archive(decision_id);
        
        CREATE INDEX IF NOT EXISTS idx_cadis_patterns_source_repo ON cadis_cross_repo_patterns(source_repo);
        CREATE INDEX IF NOT EXISTS idx_cadis_patterns_type ON cadis_cross_repo_patterns(pattern_type);
        CREATE INDEX IF NOT EXISTS idx_cadis_patterns_success_rate ON cadis_cross_repo_patterns(success_rate);
      `);

      console.log('✅ CADIS database tables initialized successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Store a CADIS decision with full traceability
   */
  async storeDecision(decision: CADISDecision): Promise<void> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      await client.query(`
        INSERT INTO cadis_decisions (
          id, context, question, recommendation, reasoning, confidence,
          insights, patterns, timestamp, execution_time_ms, status,
          philosophy_alignment, source, tenant_id, metadata, trace_id,
          parent_decision_id, branch_strategy, deployment_plan, environment_handling,
          approval_required, risk_assessment, sync_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO UPDATE SET
          recommendation = EXCLUDED.recommendation,
          reasoning = EXCLUDED.reasoning,
          confidence = EXCLUDED.confidence,
          updated_at = NOW()
      `, [
        decision.id,
        decision.context,
        decision.question,
        decision.recommendation,
        decision.reasoning,
        decision.confidence,
        JSON.stringify(decision.insights),
        JSON.stringify(decision.patterns),
        decision.timestamp,
        decision.executionTime,
        decision.status,
        JSON.stringify(decision.philosophyAlignment),
        decision.source,
        decision.tenantId || 'juelzs-portfolio',
        JSON.stringify(decision.metadata || {}),
        decision.traceId,
        decision.parentDecisionId,
        decision.branchStrategy,
        decision.deploymentPlan,
        decision.environmentHandling,
        decision.approvalRequired || false,
        decision.riskAssessment || 'low',
        decision.syncStatus || 'pending'
      ]);

      console.log(`💾 Stored CADIS decision: ${decision.id}`);
    } finally {
      client.release();
    }
  }

  /**
   * Store a CADIS trace
   */
  async storeTrace(trace: CADISTrace): Promise<void> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      await client.query(`
        INSERT INTO cadis_trace_archive (
          trace_id, parent_trace_id, branch_id, operation, query_text,
          parameters, start_time, end_time, duration_ms, row_count,
          success, error_message, metadata, environment, decision_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (trace_id) DO NOTHING
      `, [
        trace.traceId,
        trace.parentTraceId,
        trace.branchId,
        trace.operation,
        trace.queryText,
        JSON.stringify(trace.parameters || {}),
        trace.startTime,
        trace.endTime,
        trace.durationMs,
        trace.rowCount,
        trace.success,
        trace.errorMessage,
        JSON.stringify(trace.metadata || {}),
        trace.environment,
        trace.decisionId
      ]);

      console.log(`📊 Stored CADIS trace: ${trace.traceId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get recent CADIS decisions
   */
  async getRecentDecisions(limit: number = 20, tenantId: string = 'juelzs-portfolio'): Promise<CADISDecision[]> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM cadis_decisions 
        WHERE tenant_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `, [tenantId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        context: row.context,
        question: row.question,
        recommendation: row.recommendation,
        reasoning: row.reasoning,
        confidence: parseFloat(row.confidence),
        insights: row.insights || [],
        patterns: row.patterns || [],
        timestamp: new Date(row.timestamp),
        executionTime: row.execution_time_ms,
        status: row.status,
        philosophyAlignment: row.philosophy_alignment || [],
        source: row.source,
        tenantId: row.tenant_id,
        metadata: row.metadata || {},
        traceId: row.trace_id,
        parentDecisionId: row.parent_decision_id,
        branchStrategy: row.branch_strategy,
        deploymentPlan: row.deployment_plan,
        environmentHandling: row.environment_handling,
        approvalRequired: row.approval_required,
        riskAssessment: row.risk_assessment,
        syncStatus: row.sync_status
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get CADIS traces for a decision
   */
  async getTracesForDecision(decisionId: string): Promise<CADISTrace[]> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM cadis_trace_archive 
        WHERE decision_id = $1 
        ORDER BY created_at ASC
      `, [decisionId]);

      return result.rows.map(row => ({
        traceId: row.trace_id,
        parentTraceId: row.parent_trace_id,
        branchId: row.branch_id,
        operation: row.operation,
        queryText: row.query_text,
        parameters: row.parameters || {},
        startTime: row.start_time,
        endTime: row.end_time,
        durationMs: row.duration_ms,
        rowCount: row.row_count,
        success: row.success,
        errorMessage: row.error_message,
        metadata: row.metadata || {},
        environment: row.environment,
        decisionId: row.decision_id
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Store memory in CADIS memory bank
   */
  async storeMemory(memoryId: string, category: string, content: string, confidence: number, context?: any, metadata?: any): Promise<void> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      await client.query(`
        INSERT INTO cadis_memory (
          memory_id, tenant_id, category, content, confidence, context, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (memory_id) DO UPDATE SET
          content = EXCLUDED.content,
          confidence = EXCLUDED.confidence,
          last_used = NOW(),
          usage_count = cadis_memory.usage_count + 1
      `, [
        memoryId,
        'juelzs-portfolio',
        category,
        content,
        confidence,
        JSON.stringify(context || {}),
        JSON.stringify(metadata || {})
      ]);

      console.log(`🧠 Stored CADIS memory: ${memoryId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get CADIS system status
   */
  async getSystemStatus(): Promise<any> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const [decisions, traces, memory, patterns] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM cadis_decisions'),
        client.query('SELECT COUNT(*) as count FROM cadis_trace_archive'),
        client.query('SELECT COUNT(*) as count FROM cadis_memory'),
        client.query('SELECT COUNT(*) as count FROM cadis_cross_repo_patterns')
      ]);

      const recentDecisions = await client.query(`
        SELECT AVG(confidence) as avg_confidence, COUNT(*) as recent_count 
        FROM cadis_decisions 
        WHERE timestamp > NOW() - INTERVAL '24 hours'
      `);

      return {
        totalDecisions: parseInt(decisions.rows[0].count),
        totalTraces: parseInt(traces.rows[0].count),
        totalMemories: parseInt(memory.rows[0].count),
        totalPatterns: parseInt(patterns.rows[0].count),
        recentDecisions: parseInt(recentDecisions.rows[0].recent_count || '0'),
        avgConfidence: parseFloat(recentDecisions.rows[0].avg_confidence || '0'),
        lastUpdated: new Date()
      };
    } finally {
      client.release();
    }
  }
}

export default CADISDatabaseService;
