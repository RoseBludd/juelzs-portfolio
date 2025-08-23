import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/services/database.service';

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Initializing CADIS Database Tables...');
    
    const dbService = DatabaseService.getInstance();
    const client = await dbService.getPoolClient();
    
    try {
      // Create cadis_evolution_requests table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_evolution_requests (
          id VARCHAR(255) PRIMARY KEY,
          type VARCHAR(100) NOT NULL,
          description TEXT,
          justification TEXT,
          risk_assessment TEXT,
          expected_benefits TEXT[],
          required_approvals TEXT[],
          implementation_plan JSONB,
          status VARCHAR(50) DEFAULT 'pending',
          priority INTEGER DEFAULT 5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          approved_at TIMESTAMP WITH TIME ZONE,
          implemented_at TIMESTAMP WITH TIME ZONE
        );
      `);
      
      // Create cadis_capabilities table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_capabilities (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          category VARCHAR(100),
          implementation_status VARCHAR(50) DEFAULT 'active',
          confidence_level DECIMAL(3,2) DEFAULT 0.0,
          usage_count INTEGER DEFAULT 0,
          last_used TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create cadis_agents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_agents (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          type VARCHAR(100) NOT NULL,
          description TEXT,
          capabilities TEXT[],
          status VARCHAR(50) DEFAULT 'active',
          performance_score DECIMAL(3,2) DEFAULT 0.0,
          principle_alignment_score DECIMAL(3,2) DEFAULT 0.0,
          total_tasks INTEGER DEFAULT 0,
          successful_tasks INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create cadis_decisions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_decisions (
          id SERIAL PRIMARY KEY,
          decision_id VARCHAR(255) UNIQUE NOT NULL,
          context TEXT,
          decision_type VARCHAR(100),
          reasoning TEXT,
          confidence DECIMAL(3,2),
          outcome TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          agent_name VARCHAR(255),
          metadata JSONB
        );
      `);
      
      // Create cadis_decision_traces table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_decision_traces (
          id SERIAL PRIMARY KEY,
          trace_id VARCHAR(255) NOT NULL,
          decision_id VARCHAR(255),
          step_number INTEGER,
          step_description TEXT,
          input_data JSONB,
          output_data JSONB,
          processing_time INTEGER,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create cadis_integrations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_integrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          api_key_env_var VARCHAR(255) NOT NULL,
          base_url VARCHAR(255),
          docs_url VARCHAR(255),
          capabilities TEXT[],
          service_code TEXT,
          status VARCHAR(50) DEFAULT 'active',
          health_status VARCHAR(50) DEFAULT 'unknown',
          total_requests INTEGER DEFAULT 0,
          successful_requests INTEGER DEFAULT 0,
          last_health_check TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Insert initial capabilities
      const initialCapabilities = [
        { name: 'file-system-operations', description: 'Create, read, write, and delete files', category: 'core' },
        { name: 'git-operations', description: 'Git repository management and version control', category: 'development' },
        { name: 'deployment-automation', description: 'Automated deployment to various platforms', category: 'deployment' },
        { name: 'api-integration', description: 'Integration with external APIs and services', category: 'integration' },
        { name: 'code-generation', description: 'Generate production-ready code', category: 'development' },
        { name: 'architecture-analysis', description: 'Analyze and improve system architecture', category: 'analysis' },
        { name: 'principle-alignment', description: 'Ensure code follows user principles', category: 'quality' },
        { name: 'real-implementation', description: 'Create actual working implementations', category: 'core' }
      ];
      
      for (const capability of initialCapabilities) {
        await client.query(
          `INSERT INTO cadis_capabilities (name, description, category, confidence_level) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (name) DO NOTHING`,
          [capability.name, capability.description, capability.category, 0.8]
        );
      }
      
      // Insert initial agents
      const initialAgents = [
        { 
          name: 'cadis-background-agent', 
          type: 'implementation', 
          description: 'Core implementation and coding agent',
          capabilities: ['file-system-operations', 'code-generation', 'real-implementation']
        },
        { 
          name: 'cadis-evolution-intelligence', 
          type: 'evolution', 
          description: 'System evolution and improvement agent',
          capabilities: ['architecture-analysis', 'principle-alignment']
        },
        { 
          name: 'cadis-developer-coaching', 
          type: 'coaching', 
          description: 'Developer performance analysis and coaching',
          capabilities: ['analysis', 'coaching', 'performance-tracking']
        }
      ];
      
      for (const agent of initialAgents) {
        await client.query(
          `INSERT INTO cadis_agents (name, type, description, capabilities, performance_score, principle_alignment_score) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (name) DO NOTHING`,
          [agent.name, agent.type, agent.description, agent.capabilities, 0.7, 0.6]
        );
      }
      
      console.log('✅ CADIS database tables initialized successfully');
      
      return NextResponse.json({
        success: true,
        message: 'CADIS database tables initialized successfully',
        tablesCreated: [
          'cadis_evolution_requests',
          'cadis_capabilities', 
          'cadis_agents',
          'cadis_decisions',
          'cadis_decision_traces',
          'cadis_integrations'
        ]
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ CADIS database initialization failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
