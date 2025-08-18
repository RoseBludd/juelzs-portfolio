#!/usr/bin/env node

/**
 * Set up CADIS Journal system and generate initial insights
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

async function setupCADISJournal() {
  console.log('🧠 Setting up CADIS Journal System...\n');
  
  if (!process.env.VIBEZS_DB) {
    console.error('❌ VIBEZS_DB environment variable not found');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('📊 Creating CADIS journal table...');
      
      // Create CADIS journal entries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_journal_entries (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(50) NOT NULL,
          source VARCHAR(50) NOT NULL,
          source_id VARCHAR(255),
          confidence INTEGER DEFAULT 50,
          impact VARCHAR(20) DEFAULT 'medium',
          tags JSONB DEFAULT '[]',
          related_entities JSONB DEFAULT '{}',
          cadis_metadata JSONB DEFAULT '{}',
          is_private BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ CADIS journal table created');
      
      // Check existing data
      const existingEntries = await client.query('SELECT COUNT(*) FROM cadis_journal_entries');
      console.log(`📝 Existing CADIS entries: ${existingEntries.rows[0].count}`);
      
      // Generate sample CADIS entry if none exist
      if (parseInt(existingEntries.rows[0].count) === 0) {
        console.log('🧠 Generating initial CADIS insight...');
        
        const moduleCount = await client.query('SELECT COUNT(*) FROM module_registry');
        const journalCount = await client.query('SELECT COUNT(*) FROM journal_entries');
        
        const sampleEntry = {
          id: `cadis_initial_${Date.now()}`,
          title: 'CADIS System Initialization - Ecosystem Analysis',
          content: `
# CADIS Intelligence System Activated

## Initial Ecosystem Scan Complete

CADIS has successfully connected to the development ecosystem and performed an initial analysis.

## Current System State
- **Module Registry**: ${moduleCount.rows[0].count} modules detected
- **Journal Entries**: ${journalCount.rows[0].count} human journal entries
- **Database Tables**: ${await getTableCount(client)} tables in ecosystem
- **CADIS Status**: ✅ Online and analyzing

## Intelligence Capabilities Activated
- 🧠 **Pattern Recognition**: Analyzing developer and module patterns
- 📊 **Performance Monitoring**: Tracking system health and bottlenecks  
- 🔮 **Predictive Analysis**: DreamState integration for future insights
- 🏗️ **Architecture Evolution**: Monitoring system growth and optimization

## Initial Observations
The ecosystem shows signs of active development with a robust module registry and structured journal system. CADIS will continue monitoring and generating insights based on:

1. **Developer Activity**: Task completion, performance metrics, code quality
2. **Module Evolution**: New additions, usage patterns, dependency analysis
3. **Repository Health**: Commit patterns, code quality, architecture decisions
4. **System Performance**: Resource utilization, bottlenecks, optimization opportunities

## Next Steps
CADIS will automatically generate insights as the ecosystem evolves. Key focus areas:
- Monitor developer productivity trends
- Track module adoption and usage patterns
- Identify system optimization opportunities
- Predict future development needs

---
*CADIS Intelligence System - Autonomous ecosystem analysis and insight generation*
          `.trim(),
          category: 'system-evolution',
          source: 'cadis-memory',
          confidence: 95,
          impact: 'high',
          tags: JSON.stringify(['initialization', 'ecosystem', 'analysis']),
          related_entities: JSON.stringify({}),
          cadis_metadata: JSON.stringify({
            analysisType: 'initial-ecosystem-scan',
            dataPoints: 3,
            correlations: ['module-growth', 'journal-activity'],
            recommendations: [
              'Continue monitoring developer patterns',
              'Track module adoption rates',
              'Analyze system performance trends'
            ]
          }),
          is_private: false,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await client.query(`
          INSERT INTO cadis_journal_entries (
            id, title, content, category, source, confidence, impact,
            tags, related_entities, cadis_metadata, is_private, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          sampleEntry.id,
          sampleEntry.title,
          sampleEntry.content,
          sampleEntry.category,
          sampleEntry.source,
          sampleEntry.confidence,
          sampleEntry.impact,
          sampleEntry.tags,
          sampleEntry.related_entities,
          sampleEntry.cadis_metadata,
          sampleEntry.is_private,
          sampleEntry.created_at,
          sampleEntry.updated_at
        ]);
        
        console.log('✅ Initial CADIS insight generated');
      }
      
      console.log('\n🎯 CADIS Journal Setup Complete!');
      console.log('📋 Next steps:');
      console.log('1. Visit /admin/cadis-journal to view CADIS insights');
      console.log('2. Click "Generate Insights" to create new analysis');
      console.log('3. CADIS will automatically track ecosystem changes');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ CADIS journal setup failed:', error);
  } finally {
    await pool.end();
  }
}

async function getTableCount(client) {
  try {
    const result = await client.query(`
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return result.rows[0].count;
  } catch (error) {
    return 'unknown';
  }
}

setupCADISJournal();
