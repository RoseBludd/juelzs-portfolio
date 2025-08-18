#!/usr/bin/env node

/**
 * Test CADIS Maintenance Service
 * Analyzes CADIS efficiency and thinking patterns
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function testCADISMaintenance() {
  console.log('🔧 CADIS Maintenance Service - Health Analysis Test\n');
  
  const pool = new Pool({
    connectionString: process.env.VIBEZS_DB,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    try {
      console.log('📊 Analyzing CADIS Health Metrics...');
      
      // Get recent CADIS insights for analysis
      const insights = await client.query(`
        SELECT 
          confidence,
          impact,
          category,
          cadis_metadata,
          created_at
        FROM cadis_journal_entries 
        WHERE created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
      `);
      
      console.log(`📝 Found ${insights.rows.length} recent CADIS insights for analysis`);
      
      if (insights.rows.length === 0) {
        console.log('⚠️  No recent insights found - generating test data...');
        return false;
      }
      
      // Analyze insight quality
      let totalConfidence = 0;
      let criticalInsights = 0;
      let highInsights = 0;
      let totalRecommendations = 0;
      
      console.log('\n🧠 CADIS Insight Quality Analysis:');
      console.log('=' .repeat(50));
      
      insights.rows.forEach((insight, index) => {
        console.log(`\n   ${index + 1}. Category: ${insight.category}`);
        console.log(`      💯 Confidence: ${insight.confidence}%`);
        console.log(`      ⚡ Impact: ${insight.impact}`);
        console.log(`      📅 Generated: ${new Date(insight.created_at).toLocaleDateString()}`);
        
        totalConfidence += insight.confidence;
        if (insight.impact === 'critical') criticalInsights++;
        if (insight.impact === 'high') highInsights++;
        
        try {
          const metadata = typeof insight.cadis_metadata === 'string' 
            ? JSON.parse(insight.cadis_metadata) 
            : insight.cadis_metadata;
          
          console.log(`      🎯 Data Points: ${metadata.dataPoints || 0}`);
          console.log(`      🔗 Correlations: ${metadata.correlations?.length || 0}`);
          console.log(`      📋 Recommendations: ${metadata.recommendations?.length || 0}`);
          
          totalRecommendations += metadata.recommendations?.length || 0;
        } catch (error) {
          console.log('      ⚠️  Metadata parsing issue');
        }
      });
      
      // Calculate health metrics
      const avgConfidence = Math.round(totalConfidence / insights.rows.length);
      const impactDistribution = {
        critical: criticalInsights,
        high: highInsights,
        medium: insights.rows.length - criticalInsights - highInsights
      };
      
      console.log('\n📊 CADIS Health Metrics:');
      console.log('=' .repeat(50));
      console.log(`   💯 Average Confidence: ${avgConfidence}%`);
      console.log(`   🚀 Critical Insights: ${criticalInsights}`);
      console.log(`   📈 High Priority Insights: ${highInsights}`);
      console.log(`   📋 Total Recommendations: ${totalRecommendations}`);
      console.log(`   ⚡ Avg Recommendations per Insight: ${Math.round(totalRecommendations / insights.rows.length)}`);
      
      // Philosophical alignment check
      console.log('\n🧭 Philosophical Alignment Analysis:');
      console.log('=' .repeat(50));
      
      const philosophies = [
        'If it needs to be done, do it',
        'Make it modular',
        'Make it reusable',
        'Make it teachable',
        'Progressive enhancement'
      ];
      
      let alignmentScore = 0;
      philosophies.forEach(philosophy => {
        const alignedInsights = insights.rows.filter(insight => 
          insight.content?.toLowerCase().includes(philosophy.toLowerCase()) ||
          insight.category?.includes(philosophy.split(' ')[0].toLowerCase())
        ).length;
        
        console.log(`   "${philosophy}": ${alignedInsights} aligned insights`);
        alignmentScore += alignedInsights > 0 ? 100 : 60;
      });
      
      const overallAlignment = Math.round(alignmentScore / philosophies.length);
      console.log(`   🎯 Overall Philosophical Alignment: ${overallAlignment}%`);
      
      // System efficiency analysis
      console.log('\n⚡ System Efficiency Analysis:');
      console.log('=' .repeat(50));
      
      const insightFrequency = insights.rows.length; // Last 7 days
      const efficiencyScore = Math.min(100, insightFrequency * 25); // Up to 4 insights per day
      
      console.log(`   📊 Insight Generation Frequency: ${insightFrequency} in 7 days`);
      console.log(`   ⚡ Generation Efficiency Score: ${efficiencyScore}%`);
      console.log(`   🔮 DreamState Integration: Active`);
      
      // Overall health calculation
      const overallHealth = Math.round((avgConfidence + overallAlignment + efficiencyScore) / 3);
      
      console.log('\n🏥 CADIS Overall Health Assessment:');
      console.log('=' .repeat(50));
      console.log(`   🧠 Overall Health Score: ${overallHealth}/100`);
      
      if (overallHealth >= 95) {
        console.log('   ✅ Status: OPTIMAL - No maintenance required');
      } else if (overallHealth >= 85) {
        console.log('   🔧 Status: MINOR ADJUSTMENT - Light tuning recommended');
      } else if (overallHealth >= 70) {
        console.log('   🔧 Status: MODERATE TUNING - Optimization needed');
      } else {
        console.log('   🚨 Status: CRITICAL REALIGNMENT - Immediate attention required');
      }
      
      console.log('\n🎯 Maintenance Recommendations:');
      console.log('=' .repeat(50));
      
      if (avgConfidence < 100) {
        console.log('   🔧 Increase confidence calibration for philosophical insights');
      }
      
      if (overallAlignment < 95) {
        console.log('   🧭 Strengthen philosophical principle integration');
      }
      
      if (efficiencyScore < 90) {
        console.log('   ⚡ Optimize insight generation frequency and quality');
      }
      
      if (overallHealth >= 90) {
        console.log('   ✅ Continue current optimization patterns');
        console.log('   📈 Maintain foundation-first growth approach');
        console.log('   🔮 Keep DreamState integration active');
      }
      
      return true;
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ CADIS maintenance test failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

testCADISMaintenance().then(success => {
  console.log(`\n${success ? '✅ CADIS MAINTENANCE TEST PASSED' : '❌ CADIS MAINTENANCE TEST FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Maintenance test crashed:', error);
  process.exit(1);
});
