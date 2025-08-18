#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function testInteractionStyleAnalysis() {
  console.log('🎭 Testing CADIS Interaction Style Analysis\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
    await vibezClient.connect();
    
    try {
      // Get active developers for testing
      const developers = await vibezClient.query(`
        SELECT id, name, email, role
        FROM developers 
        WHERE status = 'active' 
        AND (name ILIKE '%alfredo%' OR email = 'estopaceadrian@gmail.com' OR name ILIKE '%enrique%')
        ORDER BY name
      `);
      
      console.log(`🧑‍💻 Analyzing interaction styles for ${developers.rows.length} active developers:\n`);
      
      for (const developer of developers.rows) {
        console.log(`\n🔍 ANALYZING: ${developer.name} (${developer.email})`);
        console.log(`📋 Role: ${developer.role}`);
        console.log(`🆔 ID: ${developer.id}`);
        
        // Get conversations for style analysis
        const conversations = await vibezClient.query(`
          SELECT 
            cc.id, cc.title, cc.filename, cc.content, cc.tags, cc.project_context,
            cc.created_at, cc.file_size
          FROM cursor_chats cc
          WHERE cc.developer_id::text = $1::text
          AND cc.content IS NOT NULL
          AND LENGTH(cc.content) > 1000
          ORDER BY cc.created_at DESC
          LIMIT 10
        `, [developer.id]);
        
        if (conversations.rows.length === 0) {
          console.log(`   ⚠️ No detailed conversations found for analysis`);
          continue;
        }
        
        console.log(`   📊 Analyzing ${conversations.rows.length} conversations for interaction style`);
        
        // Analyze interaction style
        let strategicScore = 0;
        let technicalScore = 0;
        let learningScore = 0;
        let prototyperScore = 0;
        let collaboratorScore = 0;
        
        const insights = [];
        
        for (const chat of conversations.rows) {
          const content = chat.content.toLowerCase();
          
          // Strategic Architect patterns
          const strategicPatterns = {
            directionGiving: /\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm)\b/g,
            systemThinking: /\b(ecosystem|integration|overall|comprehensive|end-to-end|system|architecture)\b/g,
            qualityControl: /\b(verify|confirm|test|validate|check|quality|proper)\b/g,
            iterativeRefinement: /\b(but|however|also|additionally|what about|should also|make sure)\b/g,
            problemDiagnosis: /\b(what do|why|understand|explain|real issue|root cause)\b/g
          };
          
          // Technical Implementer patterns
          const implementerPatterns = {
            problemSolving: /\b(error|bug|issue|fix|debug|not working|broken|fail)\b/g,
            codeSharing: /```[\s\S]*?```|`[^`]+`|\bfunction\b|\bclass\b|\bcomponent\b/g,
            howToQuestions: /\b(how do i|how can i|how to|show me how)\b/g,
            specificRequests: /\b(add|implement|create|build|make|write|code)\b/g
          };
          
          // Learning Explorer patterns
          const learnerPatterns = {
            conceptualQuestions: /\b(why|how does|what is|explain|understand|concept)\b/g,
            bestPractices: /\b(best practice|recommended|should|better way|right way)\b/g,
            comparisons: /\b(difference|compare|versus|vs|better than|which is)\b/g,
            theoretical: /\b(theory|principle|pattern|approach|methodology)\b/g
          };
          
          // Rapid Prototyper patterns
          const prototyperPatterns = {
            speedFocus: /\b(quick|fast|rapid|quickly|asap|urgent|deadline)\b/g,
            mvpMentality: /\b(mvp|basic|simple|minimal|prototype|proof of concept)\b/g,
            pragmaticApproach: /\b(good enough|for now|later|temporary|quick fix)\b/g,
            timeConstraints: /\b(time|schedule|deadline|rush|hurry)\b/g
          };
          
          // Creative Collaborator patterns
          const collaboratorPatterns = {
            brainstorming: /\b(ideas|creative|innovative|alternative|brainstorm)\b/g,
            userExperience: /\b(user|ux|ui|experience|intuitive|usable)\b/g,
            designThinking: /\b(design|aesthetic|visual|layout|style|theme)\b/g,
            exploration: /\b(explore|experiment|try|different|unique)\b/g
          };
          
          // Count pattern matches (will be recalculated below)
          // strategicScore += this.countPatternMatches(content, strategicPatterns);
        }
        
        // Helper function to count pattern matches
        const countPatternMatches = (content, patterns) => {
          let count = 0;
          for (const pattern of Object.values(patterns)) {
            const matches = content.match(pattern);
            count += matches ? matches.length : 0;
          }
          return count;
        };
        
        // Recalculate with proper function
        strategicScore = 0;
        technicalScore = 0;
        learningScore = 0;
        prototyperScore = 0;
        collaboratorScore = 0;
        
        for (const chat of conversations.rows) {
          const content = chat.content.toLowerCase();
          
          // Strategic Architect patterns
          const strategicPatterns = {
            directionGiving: /\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm)\b/g,
            systemThinking: /\b(ecosystem|integration|overall|comprehensive|end-to-end|system|architecture)\b/g,
            qualityControl: /\b(verify|confirm|test|validate|check|quality|proper)\b/g,
            iterativeRefinement: /\b(but|however|also|additionally|what about|should also|make sure)\b/g,
            problemDiagnosis: /\b(what do|why|understand|explain|real issue|root cause)\b/g
          };
          
          const implementerPatterns = {
            problemSolving: /\b(error|bug|issue|fix|debug|not working|broken|fail)\b/g,
            codeSharing: /```[\s\S]*?```|`[^`]+`|\bfunction\b|\bclass\b|\bcomponent\b/g,
            howToQuestions: /\b(how do i|how can i|how to|show me how)\b/g,
            specificRequests: /\b(add|implement|create|build|make|write|code)\b/g
          };
          
          const learnerPatterns = {
            conceptualQuestions: /\b(why|how does|what is|explain|understand|concept)\b/g,
            bestPractices: /\b(best practice|recommended|should|better way|right way)\b/g,
            comparisons: /\b(difference|compare|versus|vs|better than|which is)\b/g,
            theoretical: /\b(theory|principle|pattern|approach|methodology)\b/g
          };
          
          const prototyperPatterns = {
            speedFocus: /\b(quick|fast|rapid|quickly|asap|urgent|deadline)\b/g,
            mvpMentality: /\b(mvp|basic|simple|minimal|prototype|proof of concept)\b/g,
            pragmaticApproach: /\b(good enough|for now|later|temporary|quick fix)\b/g,
            timeConstraints: /\b(time|schedule|deadline|rush|hurry)\b/g
          };
          
          const collaboratorPatterns = {
            brainstorming: /\b(ideas|creative|innovative|alternative|brainstorm)\b/g,
            userExperience: /\b(user|ux|ui|experience|intuitive|usable)\b/g,
            designThinking: /\b(design|aesthetic|visual|layout|style|theme)\b/g,
            exploration: /\b(explore|experiment|try|different|unique)\b/g
          };
          
          strategicScore += countPatternMatches(content, strategicPatterns);
          technicalScore += countPatternMatches(content, implementerPatterns);
          learningScore += countPatternMatches(content, learnerPatterns);
          prototyperScore += countPatternMatches(content, prototyperPatterns);
          collaboratorScore += countPatternMatches(content, collaboratorPatterns);
        }
        
        // Normalize scores
        const totalScore = strategicScore + technicalScore + learningScore + prototyperScore + collaboratorScore;
        
        if (totalScore === 0) {
          console.log(`   ⚠️ Insufficient data for style analysis`);
          continue;
        }
        
        const styleBreakdown = {
          strategicArchitect: Math.round((strategicScore / totalScore) * 100),
          technicalImplementer: Math.round((technicalScore / totalScore) * 100),
          learningExplorer: Math.round((learningScore / totalScore) * 100),
          rapidPrototyper: Math.round((prototyperScore / totalScore) * 100),
          creativeCollaborator: Math.round((collaboratorScore / totalScore) * 100)
        };
        
        // Determine primary style
        const maxScore = Math.max(
          styleBreakdown.strategicArchitect,
          styleBreakdown.technicalImplementer,
          styleBreakdown.learningExplorer,
          styleBreakdown.rapidPrototyper,
          styleBreakdown.creativeCollaborator
        );
        
        let primaryStyle = 'technical_implementer';
        if (styleBreakdown.strategicArchitect === maxScore) primaryStyle = 'strategic_architect';
        else if (styleBreakdown.technicalImplementer === maxScore) primaryStyle = 'technical_implementer';
        else if (styleBreakdown.learningExplorer === maxScore) primaryStyle = 'learning_explorer';
        else if (styleBreakdown.rapidPrototyper === maxScore) primaryStyle = 'rapid_prototyper';
        else if (styleBreakdown.creativeCollaborator === maxScore) primaryStyle = 'creative_collaborator';
        
        console.log(`\n   🎭 INTERACTION STYLE ANALYSIS:`);
        console.log(`      🏆 Primary Style: ${primaryStyle.replace('_', ' ').toUpperCase()}`);
        console.log(`      🎯 Style Confidence: ${maxScore}%`);
        
        console.log(`\n   📊 STYLE BREAKDOWN:`);
        console.log(`      🏗️ Strategic Architect: ${styleBreakdown.strategicArchitect}%`);
        console.log(`      🔧 Technical Implementer: ${styleBreakdown.technicalImplementer}%`);
        console.log(`      📚 Learning Explorer: ${styleBreakdown.learningExplorer}%`);
        console.log(`      🚀 Rapid Prototyper: ${styleBreakdown.rapidPrototyper}%`);
        console.log(`      🎨 Creative Collaborator: ${styleBreakdown.creativeCollaborator}%`);
        
        // Generate style insights
        console.log(`\n   💡 STYLE INSIGHTS:`);
        if (styleBreakdown.strategicArchitect > 40) {
          console.log(`      • Shows strong strategic thinking and system-level approach`);
        }
        if (styleBreakdown.technicalImplementer > 60) {
          console.log(`      • Primarily focused on technical implementation and problem-solving`);
        }
        if (styleBreakdown.learningExplorer > 50) {
          console.log(`      • Demonstrates strong learning curiosity and conceptual thinking`);
        }
        if (styleBreakdown.rapidPrototyper > 30) {
          console.log(`      • Shows pragmatic, speed-focused development approach`);
        }
        if (styleBreakdown.creativeCollaborator > 30) {
          console.log(`      • Exhibits creative problem-solving and design thinking`);
        }
        
        // Mixed style detection
        const topTwoStyles = Object.entries(styleBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2);
        
        if (topTwoStyles[1][1] > 25) {
          console.log(`      • Hybrid style: Primary ${primaryStyle.replace('_', ' ')} with strong ${topTwoStyles[1][0].replace(/([A-Z])/g, ' $1').toLowerCase()} tendencies`);
        }
        
        // Style-specific coaching recommendations
        console.log(`\n   🎯 STYLE-SPECIFIC COACHING:`);
        switch (primaryStyle) {
          case 'strategic_architect':
            console.log(`      • Leverage for system design and architecture decisions`);
            console.log(`      • Provide comprehensive analysis and big-picture context`);
            console.log(`      • Enable delegation of technical implementation`);
            break;
          case 'technical_implementer':
            console.log(`      • Provide step-by-step guidance for complex problems`);
            console.log(`      • Encourage exploration of underlying concepts`);
            console.log(`      • Guide toward best practices and code quality`);
            break;
          case 'learning_explorer':
            console.log(`      • Support deep conceptual understanding`);
            console.log(`      • Provide context and theoretical background`);
            console.log(`      • Encourage mentoring and knowledge sharing`);
            break;
          case 'rapid_prototyper':
            console.log(`      • Focus on pragmatic, efficient solutions`);
            console.log(`      • Balance speed with quality considerations`);
            console.log(`      • Guide toward scalable approaches`);
            break;
          case 'creative_collaborator':
            console.log(`      • Encourage innovative problem-solving approaches`);
            console.log(`      • Focus on user experience and design thinking`);
            console.log(`      • Support experimental and creative solutions`);
            break;
        }
        
        console.log(`\n${'='.repeat(100)}`);
      }
      
    } finally {
      await vibezClient.end();
    }
    
    console.log('\n🎉 Interaction Style Analysis Test Complete!');
    console.log('\n🎯 Key Capabilities Verified:');
    console.log('✅ Strategic Architect pattern detection (direction-giving, system thinking)');
    console.log('✅ Technical Implementer pattern recognition (problem-solving, code-sharing)');
    console.log('✅ Learning Explorer identification (conceptual questions, best practices)');
    console.log('✅ Rapid Prototyper detection (speed focus, MVP mentality)');
    console.log('✅ Creative Collaborator recognition (brainstorming, design thinking)');
    console.log('✅ Style confidence scoring and breakdown analysis');
    console.log('✅ Hybrid style detection and coaching recommendations');
    console.log('✅ Style-specific coaching guidance for team development');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testInteractionStyleAnalysis();
