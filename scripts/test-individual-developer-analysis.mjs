#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function testIndividualDeveloperAnalysis() {
  console.log('🧠 CADIS Individual Developer Analysis Test\n');
  console.log('Testing individual active developer analysis (strict criteria)\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const pool = new Pool({ connectionString: process.env.VIBEZS_DB });
    const client = await pool.connect();
    
    try {
      // Get active contracted developers (strict criteria)
      console.log('👥 Getting Active Contracted Developers (Strict Criteria):');
      console.log('=' .repeat(60));
      
      const activeDevelopers = await client.query(`
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

      console.log(`📊 Found ${activeDevelopers.rows.length} active contracted developers`);
      
      if (activeDevelopers.rows.length > 3) {
        console.log('⚠️  More than 3 active developers - this might be too broad');
        console.log('🎯 Analyzing top 3 most recently updated developers');
      }

      const developersToAnalyze = activeDevelopers.rows.slice(0, 3); // Limit to top 3
      
      console.log('\n🔍 Developers Selected for Analysis:');
      developersToAnalyze.forEach((dev, i) => {
        console.log(`   ${i + 1}. ${dev.name} (${dev.email})`);
        console.log(`      Role: ${dev.role}`);
        console.log(`      GitHub: ${dev.github_url || 'Not provided'}`);
        console.log(`      Last Updated: ${new Date(dev.updated_at).toLocaleDateString()}`);
      });

      // Analyze each developer individually
      console.log('\n🧠 CADIS Individual Developer Analysis:');
      console.log('=' .repeat(70));

      const individualMetrics = [];

      for (const [index, developer] of developersToAnalyze.entries()) {
        console.log(`\n📊 Developer ${index + 1}: ${developer.name}`);
        console.log('-' .repeat(50));
        
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
        `, [developer.id]);

        const recentModules = await client.query(`
          SELECT COUNT(*) as count
          FROM module_registry mr
          WHERE mr.metadata->>'developer_id' = $1
          AND mr.created_at > NOW() - INTERVAL '30 days'
        `, [developer.id]);

        const totalModules = modules.rows.length;
        const recentCount = parseInt(recentModules.rows[0]?.count || '0');

        console.log(`📦 Module Submissions:`);
        console.log(`   Total Modules: ${totalModules}`);
        console.log(`   Recent Modules (30 days): ${recentCount}`);
        
        if (totalModules === 0) {
          console.log(`   ⚠️  No modules found for ${developer.name} - checking alternative tracking...`);
          
          // Check if modules might be tracked differently
          const alternativeModules = await client.query(`
            SELECT COUNT(*) as count
            FROM module_registry mr
            WHERE mr.file_path ILIKE $1
            OR mr.source_repo ILIKE $2
          `, [`%${developer.name.toLowerCase()}%`, `%${developer.name.toLowerCase()}%`]);
          
          const altCount = parseInt(alternativeModules.rows[0]?.count || '0');
          if (altCount > 0) {
            console.log(`   📝 Found ${altCount} potential modules by name/path matching`);
          }
        } else {
          // Analyze module quality
          const moduleTypes = [...new Set(modules.rows.map(m => m.type))];
          const repositories = [...new Set(modules.rows.map(m => m.source_repo).filter(Boolean))];
          
          let totalCodeLength = 0;
          let modulesWithCode = 0;
          let totalDescLength = 0;
          let qualityScore = 0;
          let modularityScore = 0;
          let documentationScore = 0;
          
          modules.rows.forEach(module => {
            if (module.code_length > 0) {
              totalCodeLength += module.code_length;
              modulesWithCode++;
            }
            if (module.description_length > 0) {
              totalDescLength += module.description_length;
            }
            
            // Quality analysis
            let moduleQuality = 50;
            if (module.description_length > 50) moduleQuality += 15;
            if (module.description_length > 150) moduleQuality += 15;
            if (module.code_length > 100) moduleQuality += 20;
            
            // Modularity analysis
            const desc = (module.description || '').toLowerCase();
            const name = (module.name || '').toLowerCase();
            const code = (module.code_content || '').toLowerCase();
            
            if (desc.includes('component') || name.includes('component')) modularityScore += 20;
            if (code.includes('export') || code.includes('module')) modularityScore += 15;
            if (desc.includes('reusable') || desc.includes('configurable')) modularityScore += 10;
            
            // Documentation analysis
            if (module.description_length > 100) documentationScore += 15;
            if (code.includes('//') || code.includes('/*')) documentationScore += 10;
            if (desc.includes('usage') || desc.includes('example')) documentationScore += 15;
            
            qualityScore += moduleQuality;
          });

          const avgModuleSize = modulesWithCode > 0 ? Math.round(totalCodeLength / modulesWithCode) : 0;
          const avgDescLength = totalModules > 0 ? Math.round(totalDescLength / totalModules) : 0;
          const codeImplementationRate = totalModules > 0 ? Math.round((modulesWithCode / totalModules) * 100) : 0;
          const avgQuality = totalModules > 0 ? Math.round(qualityScore / totalModules) : 0;
          const avgModularity = totalModules > 0 ? Math.round(modularityScore / totalModules) : 0;
          const avgDocumentation = totalModules > 0 ? Math.round(documentationScore / totalModules) : 0;

          console.log(`   Module Types: ${moduleTypes.join(', ')}`);
          console.log(`   Repositories: ${repositories.length} different repos`);
          console.log(`   Avg Module Size: ${avgModuleSize} chars`);
          console.log(`   Code Implementation Rate: ${codeImplementationRate}%`);
          console.log(`   Avg Description Length: ${avgDescLength} chars`);
          
          console.log(`\n🎯 Quality Analysis:`);
          console.log(`   Overall Quality Score: ${avgQuality}/100`);
          console.log(`   Modularity Score: ${avgModularity}/100`);
          console.log(`   Documentation Score: ${avgDocumentation}/100`);
          
          // Check for Loom/Scribe documentation
          const docReferences = await client.query(`
            SELECT 
              COUNT(CASE WHEN description ILIKE '%loom%' OR code_content ILIKE '%loom%' THEN 1 END) as loom_count,
              COUNT(CASE WHEN description ILIKE '%scribe%' OR code_content ILIKE '%scribe%' THEN 1 END) as scribe_count,
              COUNT(CASE WHEN description ILIKE '%video%' OR code_content ILIKE '%video%' THEN 1 END) as video_count
            FROM module_registry mr
            WHERE mr.metadata->>'developer_id' = $1
          `, [developer.id]);

          const docs = docReferences.rows[0];
          const loomVideos = parseInt(docs.loom_count || '0');
          const scribeDocs = parseInt(docs.scribe_count || '0');
          const videoRefs = parseInt(docs.video_count || '0');

          console.log(`\n🎥 Documentation Analysis:`);
          console.log(`   Loom Video References: ${loomVideos}`);
          console.log(`   Scribe Doc References: ${scribeDocs}`);
          console.log(`   Video References: ${videoRefs}`);
          console.log(`   Has Comprehensive Docs: ${(avgDescLength > 150 && (loomVideos > 0 || scribeDocs > 0)) ? 'Yes' : 'No'}`);
          
          // Performance trends
          const recentPerformance = await client.query(`
            SELECT 
              COUNT(*) as recent_count,
              AVG(LENGTH(description)) as recent_avg_desc
            FROM module_registry mr
            WHERE mr.metadata->>'developer_id' = $1
            AND mr.created_at > NOW() - INTERVAL '30 days'
          `, [developer.id]);

          const olderPerformance = await client.query(`
            SELECT 
              COUNT(*) as older_count,
              AVG(LENGTH(description)) as older_avg_desc
            FROM module_registry mr
            WHERE mr.metadata->>'developer_id' = $1
            AND mr.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
          `, [developer.id]);

          const recent = recentPerformance.rows[0];
          const older = olderPerformance.rows[0];
          const recentCountTrend = parseInt(recent.recent_count || '0');
          const olderCountTrend = parseInt(older.older_count || '0');

          let productivityTrend = 'stable';
          if (recentCountTrend > olderCountTrend * 1.2) productivityTrend = 'increasing';
          else if (recentCountTrend < olderCountTrend * 0.8) productivityTrend = 'decreasing';

          console.log(`\n📈 Performance Trends:`);
          console.log(`   Productivity Trend: ${productivityTrend}`);
          console.log(`   Recent vs Previous Period: ${recentCountTrend} vs ${olderCountTrend} modules`);
          
          // Generate individual coaching insights
          const strengths = [];
          const improvementAreas = [];
          const recommendations = [];
          
          // Identify strengths
          if (totalModules >= 10) strengths.push('High productivity - consistent module creation');
          if (avgModularity >= 70) strengths.push('Strong modular design skills');
          if (avgDocumentation >= 70) strengths.push('Good documentation practices');
          if (codeImplementationRate >= 90) strengths.push('Consistent code implementation');
          if (productivityTrend === 'increasing') strengths.push('Improving productivity trend');
          
          // Identify improvement areas
          if (totalModules < 5) improvementAreas.push('Increase module contribution frequency');
          if (avgModularity < 60) improvementAreas.push('Strengthen modular design principles');
          if (avgDocumentation < 60) improvementAreas.push('Enhance documentation practices');
          if (loomVideos === 0 && scribeDocs === 0) improvementAreas.push('Create video/scribe documentation');
          
          // Generate recommendations
          if (avgDocumentation < 60) {
            recommendations.push('Add comprehensive documentation to modules with usage examples');
          }
          if (totalModules < 5) {
            recommendations.push('Increase contribution frequency - aim for 1-2 modules per week');
          }
          if (loomVideos === 0) {
            recommendations.push('Create Loom walkthrough videos for complex modules');
          }
          if (avgModularity < 60) {
            recommendations.push('Focus on modular design patterns and reusable components');
          }
          
          // Calculate overall score
          const overallScore = Math.round(
            (Math.min(totalModules * 8, 80)) * 0.4 + // Productivity (capped at 80)
            (avgQuality) * 0.3 + // Quality
            (avgModularity) * 0.2 + // Modularity
            (avgDocumentation) * 0.1 // Documentation
          );
          
          console.log(`\n💪 Strengths:`);
          if (strengths.length > 0) {
            strengths.forEach(strength => console.log(`   ✅ ${strength}`));
          } else {
            console.log(`   📝 Building foundation - focus on consistency`);
          }
          
          console.log(`\n🎯 Areas for Improvement:`);
          if (improvementAreas.length > 0) {
            improvementAreas.forEach(area => console.log(`   📈 ${area}`));
          } else {
            console.log(`   🌟 Performing well across all areas`);
          }
          
          console.log(`\n🧠 CADIS Individual Coaching Recommendations:`);
          recommendations.forEach(rec => console.log(`   💡 ${rec}`));
          
          console.log(`\n📊 Overall Individual Score: ${overallScore}/100`);
          
          // Store metrics for team analysis
          individualMetrics.push({
            name: developer.name,
            email: developer.email,
            overallScore,
            totalModules,
            recentModules: recentCount,
            avgQuality,
            avgModularity,
            avgDocumentation,
            strengths,
            improvementAreas,
            recommendations,
            coachingPriority: overallScore < 40 ? 'urgent' : overallScore < 60 ? 'high' : overallScore < 80 ? 'medium' : 'low'
          });
        }
      }

      // Team Overview Analysis
      console.log('\n🏆 CADIS Team Overview:');
      console.log('=' .repeat(60));
      
      if (individualMetrics.length > 0) {
        const avgTeamScore = Math.round(individualMetrics.reduce((sum, dev) => sum + dev.overallScore, 0) / individualMetrics.length);
        const topPerformers = individualMetrics.filter(dev => dev.overallScore >= 75);
        const needsAttention = individualMetrics.filter(dev => dev.overallScore < 60);
        
        console.log(`📊 Team Performance Summary:`);
        console.log(`   Active Developers Analyzed: ${individualMetrics.length}`);
        console.log(`   Average Team Score: ${avgTeamScore}/100`);
        console.log(`   Top Performers (75+): ${topPerformers.length}`);
        console.log(`   Need Attention (<60): ${needsAttention.length}`);
        
        console.log(`\n⭐ Top Performers:`);
        topPerformers.forEach(dev => {
          console.log(`   🌟 ${dev.name}: ${dev.overallScore}/100`);
          console.log(`      Modules: ${dev.totalModules}, Recent: ${dev.recentModules}`);
        });
        
        console.log(`\n⚠️  Developers Needing Attention:`);
        needsAttention.forEach(dev => {
          console.log(`   📈 ${dev.name}: ${dev.overallScore}/100 (${dev.coachingPriority} priority)`);
          console.log(`      Top Issue: ${dev.improvementAreas[0] || 'General improvement needed'}`);
        });
        
        console.log(`\n🎯 Team Coaching Priorities:`);
        const allImprovementAreas = individualMetrics.flatMap(dev => dev.improvementAreas);
        const commonIssues = {};
        allImprovementAreas.forEach(issue => {
          commonIssues[issue] = (commonIssues[issue] || 0) + 1;
        });
        
        Object.entries(commonIssues)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([issue, count], i) => {
            console.log(`   ${i + 1}. ${issue} (${count} developers)`);
          });
      } else {
        console.log('⚠️  No individual metrics calculated - developers may not have trackable modules');
      }

      console.log(`\n✅ CADIS Individual Developer Analysis Complete!`);
      console.log(`🎯 Analyzed ${developersToAnalyze.length} active contracted developers individually`);
      console.log(`📊 Generated specific coaching insights for each developer`);
      console.log(`🧠 Provided team-wide coaching priorities based on individual analysis`);

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('❌ Error in individual developer analysis:', error);
  }
}

testIndividualDeveloperAnalysis();
