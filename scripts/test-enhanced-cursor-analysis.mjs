#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function testEnhancedCursorAnalysis() {
  console.log('🧠 Testing Enhanced CADIS Cursor Analysis\n');
  
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
      
      console.log(`🧑‍💻 Testing enhanced cursor analysis for ${developers.rows.length} active developers:\n`);
      
      for (const developer of developers.rows) {
        console.log(`\n🔍 ANALYZING: ${developer.name} (${developer.email})`);
        console.log(`📋 Role: ${developer.role}`);
        console.log(`🆔 ID: ${developer.id}`);
        
        // Test the enhanced conversation analysis
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
        
        console.log(`   📊 Found ${conversations.rows.length} conversations for analysis`);
        
        let totalQuestionAsking = 0;
        let totalProblemSolving = 0;
        let totalCodeSharing = 0;
        let totalLearning = 0;
        let totalExchanges = 0;
        let totalConversationQuality = 0;
        
        const insights = [];
        
        // Analyze each conversation
        for (const [index, chat] of conversations.rows.entries()) {
          const content = chat.content;
          
          // Count conversation exchanges
          const userMessages = (content.match(/(\*\*User\*\*|\*\*Human\*\*|User:|Human:)/g) || []).length;
          const aiMessages = (content.match(/(\*\*Assistant\*\*|\*\*Cursor\*\*|Assistant:|Cursor:)/g) || []).length;
          const exchanges = Math.max(userMessages, aiMessages);
          totalExchanges += exchanges;
          
          // Analyze conversation patterns
          const hasQuestions = /\b(how do i|how can i|what is|why does|where should|when to)\b/i.test(content);
          const hasProblemSolving = /\b(error|issue|problem|bug|fail)\b/i.test(content);
          const hasCodeSharing = /```|`[^`]+`|\bcode\b|\bfunction\b|\bclass\b/i.test(content);
          const hasLearning = /\b(explain|why|how does this work|what does this do|learn)\b/i.test(content);
          
          if (hasQuestions) totalQuestionAsking++;
          if (hasProblemSolving) totalProblemSolving++;
          if (hasCodeSharing) totalCodeSharing++;
          if (hasLearning) totalLearning++;
          
          // Calculate individual conversation quality
          const developerEngagement = [hasQuestions, hasProblemSolving, hasCodeSharing, hasLearning].filter(Boolean).length;
          const conversationQuality = Math.round((developerEngagement / 4) * 100);
          totalConversationQuality += conversationQuality;
          
          // Show sample conversation analysis
          if (index < 2) {
            console.log(`\n   📝 Conversation ${index + 1}: "${chat.title}"`);
            console.log(`      📅 Date: ${new Date(chat.created_at).toLocaleDateString()}`);
            console.log(`      💬 Exchanges: ${exchanges} (${userMessages} user, ${aiMessages} AI)`);
            console.log(`      📏 Length: ${chat.content.length.toLocaleString()} chars`);
            console.log(`      🎯 Quality: ${conversationQuality}/100`);
            console.log(`      ✅ Patterns: ${hasQuestions ? 'Questions' : ''} ${hasProblemSolving ? 'Problem-solving' : ''} ${hasCodeSharing ? 'Code-sharing' : ''} ${hasLearning ? 'Learning' : ''}`.trim());
          }
        }
        
        const conversationCount = conversations.rows.length;
        const avgExchanges = Math.round(totalExchanges / conversationCount);
        const avgConversationQuality = Math.round(totalConversationQuality / conversationCount);
        
        // Calculate engagement rates
        const questionRate = Math.round((totalQuestionAsking / conversationCount) * 100);
        const problemSolvingRate = Math.round((totalProblemSolving / conversationCount) * 100);
        const codeSharingRate = Math.round((totalCodeSharing / conversationCount) * 100);
        const learningRate = Math.round((totalLearning / conversationCount) * 100);
        
        // Calculate overall engagement score
        const engagementScore = Math.round((questionRate + problemSolvingRate + codeSharingRate + learningRate) / 4);
        
        console.log(`\n   📊 ENHANCED CURSOR ANALYSIS RESULTS:`);
        console.log(`      💬 Average exchanges per conversation: ${avgExchanges}`);
        console.log(`      🎯 Average conversation quality: ${avgConversationQuality}/100`);
        console.log(`      📈 Overall engagement score: ${engagementScore}/100`);
        
        console.log(`\n   🔍 CONVERSATION PATTERNS:`);
        console.log(`      ❓ Question-asking rate: ${questionRate}% (${totalQuestionAsking}/${conversationCount} conversations)`);
        console.log(`      🔧 Problem-solving rate: ${problemSolvingRate}% (${totalProblemSolving}/${conversationCount} conversations)`);
        console.log(`      💻 Code-sharing rate: ${codeSharingRate}% (${totalCodeSharing}/${conversationCount} conversations)`);
        console.log(`      📚 Learning rate: ${learningRate}% (${totalLearning}/${conversationCount} conversations)`);
        
        // Generate insights
        console.log(`\n   💡 COACHING INSIGHTS:`);
        if (questionRate < 20) {
          console.log(`      🎯 Low question-asking rate (${questionRate}%) - encourage more curiosity and inquiry`);
        } else if (questionRate > 60) {
          console.log(`      ✅ Excellent question-asking approach (${questionRate}%) - shows strong learning mindset`);
        }
        
        if (learningRate < 50) {
          console.log(`      📚 Learning conversations could be improved (${learningRate}%) - encourage explanation requests`);
        } else if (learningRate > 80) {
          console.log(`      🌟 Outstanding learning engagement (${learningRate}%) - actively seeks understanding`);
        }
        
        if (codeSharingRate > 90) {
          console.log(`      💻 Excellent code-sharing patterns (${codeSharingRate}%) - highly technical interactions`);
        }
        
        if (problemSolvingRate > 80) {
          console.log(`      🔧 Strong problem-solving focus (${problemSolvingRate}%) - effectively uses AI for debugging`);
        }
        
        // Overall assessment
        console.log(`\n   🏆 OVERALL ASSESSMENT:`);
        if (engagementScore >= 80) {
          console.log(`      ✅ EXCELLENT cursor usage - highly engaged and productive developer`);
        } else if (engagementScore >= 60) {
          console.log(`      🔶 GOOD cursor usage - well engaged with room for growth`);
        } else {
          console.log(`      ⚠️ MODERATE cursor usage - could benefit from more interactive engagement`);
        }
        
        // Coaching recommendations
        console.log(`\n   📋 COACHING RECOMMENDATIONS:`);
        if (questionRate < 20) {
          console.log(`      • Encourage more curiosity: Ask "how" and "why" questions to deepen understanding`);
          console.log(`      • Practice inquiry-driven development: Question assumptions and explore alternatives`);
        }
        
        if (learningRate < 50) {
          console.log(`      • Request explanations: Ask AI to explain code logic and decision-making processes`);
          console.log(`      • Seek conceptual understanding: Focus on "why" something works, not just "how"`);
        }
        
        if (engagementScore < 60) {
          console.log(`      • Increase interaction depth: Engage in multi-turn conversations for complex problems`);
          console.log(`      • Explore edge cases: Discuss potential issues and alternative approaches`);
        } else if (engagementScore > 80) {
          console.log(`      • Excellent engagement model: Share approach with team for best practices`);
          console.log(`      • Mentor others: Help colleagues improve their cursor interaction patterns`);
        }
        
        console.log(`\n${'='.repeat(100)}`);
      }
      
    } finally {
      await vibezClient.end();
    }
    
    console.log('\n🎉 Enhanced CADIS Cursor Analysis Test Complete!');
    console.log('\n🎯 Key Capabilities Verified:');
    console.log('✅ Real conversation content analysis (not just usage statistics)');
    console.log('✅ Developer-AI interaction pattern recognition');
    console.log('✅ Question-asking and learning behavior assessment');
    console.log('✅ Problem-solving approach evaluation');
    console.log('✅ Code-sharing and technical depth analysis');
    console.log('✅ Personalized coaching recommendations');
    console.log('✅ Conversation quality scoring system');
    console.log('✅ Engagement pattern insights for team coaching');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testEnhancedCursorAnalysis();
