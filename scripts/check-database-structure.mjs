#!/usr/bin/env node

/**
 * Database Structure Analysis Script
 * 
 * Checks what tables, indexes, and data already exist in the database
 * to understand the current state before making changes
 */

import { DatabaseService } from '../src/services/database.service.js';

console.log('🗄️ Database Structure Analysis');
console.log('='.repeat(60));

class DatabaseAnalyzer {
  constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  async analyzeDatabase() {
    console.log('\n📊 ANALYZING CURRENT DATABASE STRUCTURE');
    console.log('-'.repeat(50));

    try {
      // Get all tables
      const tables = await this.getAllTables();
      console.log(`\n📋 Found ${tables.length} tables:`);
      
      const cadisRelated = [];
      const traceRelated = [];
      const otherTables = [];

      tables.forEach(table => {
        if (table.includes('cadis')) {
          cadisRelated.push(table);
        } else if (table.includes('trace') || table.includes('tbl_trace')) {
          traceRelated.push(table);
        } else {
          otherTables.push(table);
        }
      });

      if (cadisRelated.length > 0) {
        console.log(`\n🧠 CADIS-related tables (${cadisRelated.length}):`);
        for (const table of cadisRelated) {
          const count = await this.getTableRowCount(table);
          const structure = await this.getTableStructure(table);
          console.log(`   ✅ ${table}: ${count} rows, ${structure.length} columns`);
        }
      }

      if (traceRelated.length > 0) {
        console.log(`\n📊 Trace-related tables (${traceRelated.length}):`);
        for (const table of traceRelated) {
          const count = await this.getTableRowCount(table);
          const structure = await this.getTableStructure(table);
          console.log(`   ✅ ${table}: ${count} rows, ${structure.length} columns`);
        }
      }

      console.log(`\n📦 Other tables (${otherTables.length}):`);
      otherTables.slice(0, 10).forEach(table => {
        console.log(`   • ${table}`);
      });
      if (otherTables.length > 10) {
        console.log(`   ... and ${otherTables.length - 10} more`);
      }

      // Analyze CADIS tables in detail
      await this.analyzeCadisTablesDetail(cadisRelated);
      
      // Analyze trace tables in detail
      await this.analyzeTraceTablesDetail(traceRelated);

      // Check for missing essential tables
      await this.checkMissingTables(cadisRelated, traceRelated);

      return {
        totalTables: tables.length,
        cadisRelated,
        traceRelated,
        otherTables
      };

    } catch (error) {
      console.error('❌ Error analyzing database:', error);
      throw error;
    }
  }

  async getAllTables() {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      return result.rows.map(row => row.table_name);
    } finally {
      client.release();
    }
  }

  async getTableRowCount(tableName) {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 'Error';
    } finally {
      client.release();
    }
  }

  async getTableStructure(tableName) {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  async analyzeCadisTablesDetail(cadisRelated) {
    if (cadisRelated.length === 0) {
      console.log('\n🔍 No CADIS tables found');
      return;
    }

    console.log('\n\n🧠 DETAILED CADIS TABLES ANALYSIS');
    console.log('-'.repeat(50));

    for (const table of cadisRelated) {
      console.log(`\n📋 Table: ${table}`);
      
      const structure = await this.getTableStructure(table);
      const count = await this.getTableRowCount(table);
      
      console.log(`   📊 Rows: ${count}`);
      console.log(`   🏗️ Structure (${structure.length} columns):`);
      
      structure.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`      • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });

      // Get sample data if table has rows
      if (count > 0 && count !== 'Error') {
        const sampleData = await this.getSampleData(table);
        if (sampleData.length > 0) {
          console.log(`   📄 Sample data (first row):`);
          Object.entries(sampleData[0]).forEach(([key, value]) => {
            const displayValue = typeof value === 'string' && value.length > 50 
              ? value.substring(0, 50) + '...' 
              : value;
            console.log(`      ${key}: ${displayValue}`);
          });
        }
      }
    }
  }

  async analyzeTraceTablesDetail(traceRelated) {
    if (traceRelated.length === 0) {
      console.log('\n🔍 No trace tables found');
      return;
    }

    console.log('\n\n📊 DETAILED TRACE TABLES ANALYSIS');
    console.log('-'.repeat(50));

    for (const table of traceRelated) {
      console.log(`\n📋 Table: ${table}`);
      
      const structure = await this.getTableStructure(table);
      const count = await this.getTableRowCount(table);
      
      console.log(`   📊 Rows: ${count}`);
      console.log(`   🏗️ Structure (${structure.length} columns):`);
      
      structure.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`      • ${col.column_name}: ${col.data_type} ${nullable}`);
      });

      // Check for recent traces
      if (count > 0 && count !== 'Error') {
        const recentTraces = await this.getRecentTraces(table);
        if (recentTraces > 0) {
          console.log(`   ⏰ Recent traces (last 24h): ${recentTraces}`);
        }
      }
    }
  }

  async getSampleData(tableName) {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query(`SELECT * FROM "${tableName}" LIMIT 1`);
      return result.rows;
    } catch (error) {
      return [];
    } finally {
      client.release();
    }
  }

  async getRecentTraces(tableName) {
    const client = await this.databaseService.getPoolClient();
    
    try {
      // Try different timestamp column names
      const timestampColumns = ['created_at', 'timestamp', 'start_time'];
      
      for (const col of timestampColumns) {
        try {
          const result = await client.query(`
            SELECT COUNT(*) as count 
            FROM "${tableName}" 
            WHERE "${col}" > NOW() - INTERVAL '24 hours'
          `);
          return parseInt(result.rows[0].count);
        } catch (error) {
          // Column doesn't exist, try next one
          continue;
        }
      }
      return 0;
    } catch (error) {
      return 0;
    } finally {
      client.release();
    }
  }

  async checkMissingTables(cadisRelated, traceRelated) {
    console.log('\n\n🔍 CHECKING FOR MISSING ESSENTIAL TABLES');
    console.log('-'.repeat(50));

    const expectedCadisTables = [
      'cadis_memory',
      'cadis_decisions', 
      'cadis_trace_archive',
      'cadis_cross_repo_patterns'
    ];

    const expectedTraceTables = [
      'tbl_trace_archive', // vibezs-style
      'trace_archive'      // alternative naming
    ];

    console.log('\n🧠 CADIS Tables Status:');
    expectedCadisTables.forEach(table => {
      const exists = cadisRelated.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });

    console.log('\n📊 Trace Tables Status:');
    expectedTraceTables.forEach(table => {
      const exists = traceRelated.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });

    // Check if we have any decision/memory storage
    const hasDecisionStorage = cadisRelated.some(table => 
      table.includes('decision') || table.includes('memory')
    );

    const hasTraceStorage = traceRelated.length > 0;

    console.log('\n📋 STORAGE CAPABILITIES:');
    console.log(`   ${hasDecisionStorage ? '✅' : '❌'} Decision Storage: ${hasDecisionStorage ? 'AVAILABLE' : 'MISSING'}`);
    console.log(`   ${hasTraceStorage ? '✅' : '❌'} Trace Storage: ${hasTraceStorage ? 'AVAILABLE' : 'MISSING'}`);

    return {
      hasDecisionStorage,
      hasTraceStorage,
      missingCadisTables: expectedCadisTables.filter(table => !cadisRelated.includes(table)),
      missingTraceTables: expectedTraceTables.filter(table => !traceRelated.includes(table))
    };
  }

  async generateRecommendations(analysis) {
    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(50));

    const recommendations = [];

    if (analysis.missingCadisTables.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Create missing CADIS tables',
        details: `Missing: ${analysis.missingCadisTables.join(', ')}`,
        reason: 'Required for decision tracking and memory storage'
      });
    }

    if (analysis.missingTraceTables.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Create trace storage tables',
        details: `Missing: ${analysis.missingTraceTables.join(', ')}`,
        reason: 'Required for operation traceability'
      });
    }

    if (!analysis.hasDecisionStorage) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Implement decision storage system',
        details: 'No decision tracking capability found',
        reason: 'Essential for CADIS operation and learning'
      });
    }

    if (recommendations.length === 0) {
      console.log('✅ Database structure looks good! All essential tables are present.');
      recommendations.push({
        priority: 'INFO',
        action: 'Proceed with scenario execution',
        details: 'Database is ready for CADIS operations',
        reason: 'All required tables and structures are in place'
      });
    }

    recommendations.forEach((rec, i) => {
      const priorityIcon = rec.priority === 'CRITICAL' ? '🚨' : 
                          rec.priority === 'HIGH' ? '⚠️' : 
                          rec.priority === 'MEDIUM' ? '🔶' : '💡';
      
      console.log(`\n${i + 1}. ${priorityIcon} ${rec.priority}: ${rec.action}`);
      console.log(`   Details: ${rec.details}`);
      console.log(`   Reason: ${rec.reason}`);
    });

    return recommendations;
  }
}

// Main execution
async function runDatabaseAnalysis() {
  console.log('🚀 Starting Database Structure Analysis...\n');

  const analyzer = new DatabaseAnalyzer();
  
  try {
    const analysis = await analyzer.analyzeDatabase();
    const missingTables = await analyzer.checkMissingTables(analysis.cadisRelated, analysis.traceRelated);
    const recommendations = await analyzer.generateRecommendations(missingTables);

    console.log('\n\n📋 ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tables: ${analysis.totalTables}`);
    console.log(`🧠 CADIS Tables: ${analysis.cadisRelated.length}`);
    console.log(`📊 Trace Tables: ${analysis.traceRelated.length}`);
    console.log(`📦 Other Tables: ${analysis.otherTables.length}`);
    console.log(`💡 Recommendations: ${recommendations.length}`);

    console.log('\n🎯 NEXT STEPS:');
    if (recommendations.some(r => r.priority === 'CRITICAL' || r.priority === 'HIGH')) {
      console.log('   1. Address critical/high priority recommendations');
      console.log('   2. Initialize missing CADIS tables');
      console.log('   3. Proceed with scenario execution');
    } else {
      console.log('   1. Database is ready for CADIS operations');
      console.log('   2. Proceed with real scenario execution');
      console.log('   3. Monitor decision and trace storage');
    }

    return { analysis, missingTables, recommendations };

  } catch (error) {
    console.error('❌ Database analysis failed:', error);
    throw error;
  }
}

// Run the analysis
runDatabaseAnalysis().catch(console.error);
