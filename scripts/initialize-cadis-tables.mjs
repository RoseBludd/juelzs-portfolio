#!/usr/bin/env node

/**
 * Initialize CADIS Database Tables
 * Creates all missing tables needed for CADIS evolution and operations
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5
});

console.log('🗄️ Initializing CADIS Database Tables...');

const tables = [
  {
    name: 'cadis_capabilities',
    sql: `
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
    `
  },
  {
    name: 'cadis_agents',
    sql: `
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
    `
  },
  {
    name: 'cadis_evolution_requests',
    sql: `
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
    `
  },
  {
    name: 'cadis_decisions',
    sql: `
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
    `
  },
  {
    name: 'cadis_decision_traces',
    sql: `
      CREATE TABLE IF NOT EXISTS cadis_decision_traces (
        id SERIAL PRIMARY KEY,
        trace_id VARCHAR(255) NOT NULL,
        decision_id VARCHAR(255),
        step_number INTEGER,
        step_description TEXT,
        input_data JSONB,
        output_data JSONB,
        processing_time INTEGER,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (decision_id) REFERENCES cadis_decisions(decision_id)
      );
    `
  },
  {
    name: 'cadis_integrations',
    sql: `
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
    `
  },
  {
    name: 'cadis_memory',
    sql: `
      CREATE TABLE IF NOT EXISTS cadis_memory (
        id SERIAL PRIMARY KEY,
        memory_id VARCHAR(255) UNIQUE NOT NULL,
        memory_type VARCHAR(100),
        content TEXT,
        context JSONB,
        importance_score DECIMAL(3,2) DEFAULT 0.5,
        access_count INTEGER DEFAULT 0,
        last_accessed TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE
      );
    `
  }
];

async function initializeTables() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Creating CADIS tables...\n');
    
    for (const table of tables) {
      console.log(`   Creating ${table.name}...`);
      
      try {
        await client.query(table.sql);
        console.log(`   ✅ ${table.name} created successfully`);
      } catch (error) {
        if (error.code === '42P07') { // relation already exists
          console.log(`   ℹ️ ${table.name} already exists`);
        } else {
          console.log(`   ❌ Error creating ${table.name}:`, error.message);
        }
      }
    }
    
    console.log('\n🎯 Inserting initial data...');
    
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
      try {
        await client.query(
          `INSERT INTO cadis_capabilities (name, description, category, confidence_level) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (name) DO NOTHING`,
          [capability.name, capability.description, capability.category, 0.8]
        );
      } catch (error) {
        console.log(`   ⚠️ Error inserting capability ${capability.name}:`, error.message);
      }
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
      try {
        await client.query(
          `INSERT INTO cadis_agents (name, type, description, capabilities, performance_score, principle_alignment_score) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (name) DO NOTHING`,
          [agent.name, agent.type, agent.description, agent.capabilities, 0.7, 0.6]
        );
      } catch (error) {
        console.log(`   ⚠️ Error inserting agent ${agent.name}:`, error.message);
      }
    }
    
    // Insert initial integrations
    const initialIntegrations = [
      {
        name: 'Claude API',
        description: 'Anthropic Claude AI model integration',
        api_key_env_var: 'CLAUDE_API_KEY',
        base_url: 'https://api.anthropic.com',
        capabilities: ['text-generation', 'code-analysis', 'reasoning']
      },
      {
        name: 'OpenAI API',
        description: 'OpenAI GPT model integration',
        api_key_env_var: 'OPENAI_API_KEY',
        base_url: 'https://api.openai.com',
        capabilities: ['text-generation', 'code-generation', 'analysis']
      },
      {
        name: 'ElevenLabs API',
        description: 'ElevenLabs voice synthesis integration',
        api_key_env_var: 'ELEVEN_LABS_API_KEY',
        base_url: 'https://api.elevenlabs.io',
        capabilities: ['voice-synthesis', 'audio-generation']
      }
    ];
    
    for (const integration of initialIntegrations) {
      try {
        await client.query(
          `INSERT INTO cadis_integrations (name, description, api_key_env_var, base_url, capabilities) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (name) DO NOTHING`,
          [integration.name, integration.description, integration.api_key_env_var, integration.base_url, integration.capabilities]
        );
      } catch (error) {
        console.log(`   ⚠️ Error inserting integration ${integration.name}:`, error.message);
      }
    }
    
    console.log('\n✅ CADIS database initialization complete!');
    console.log('\n📊 Summary:');
    
    // Get counts
    const capabilitiesCount = await client.query('SELECT COUNT(*) FROM cadis_capabilities');
    const agentsCount = await client.query('SELECT COUNT(*) FROM cadis_agents');
    const integrationsCount = await client.query('SELECT COUNT(*) FROM cadis_integrations');
    
    console.log(`   📋 Capabilities: ${capabilitiesCount.rows[0].count}`);
    console.log(`   🤖 Agents: ${agentsCount.rows[0].count}`);
    console.log(`   🔌 Integrations: ${integrationsCount.rows[0].count}`);
    console.log(`   🗄️ Tables: ${tables.length} created/verified`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await initializeTables();
    console.log('\n🎉 CADIS is ready to evolve!');
  } catch (error) {
    console.error('\n💥 Initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
