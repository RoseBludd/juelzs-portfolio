#!/usr/bin/env node
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function analyzeCursorChats() {
  console.log('💬 CADIS Cursor Chat Analysis\n');
  console.log('Analyzing 134 cursor chats for developer insights\n');
  
  try {
    // Set SSL configuration for both connections
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    // Connect to SUPABASE_DB where cursor chats are stored
    const supabasePool = new Pool({ 
      connectionString: process.env.SUPABASE_DB,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000
    });
    
    // Connect to VIBEZS_DB to get developer info  
    const vibezPool = new Pool({ 
      connectionString: process.env.VIBEZS_DB,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000
    });
    
    const supabaseClient = await supabasePool.connect();
    const vibezClient = await vibezPool.connect();
    
    try {
      // Get our active developers
      const activeDevelopers = await vibezClient.query(`
        SELECT id, name, email, role
        FROM developers 
        WHERE status = 'active' 
        AND (
          name ILIKE '%alfredo%' 
          OR email = 'estopaceadrian@gmail.com'
          OR name ILIKE '%enrique%'
        )
        ORDER BY name
      `);
      
      console.log(`👥 Active Developers to Analyze: ${activeDevelopers.rows.length}`);
      activeDevelopers.rows.forEach(dev => {
        console.log(`   🧑‍💻 ${dev.name} (${dev.email}) - ID: ${dev.id}`);
      });
      
      console.log('\n💬 CADIS Cursor Chat Analysis:');
      console.log('=' .repeat(60));
      
      for (const developer of activeDevelopers.rows) {
        console.log(`\n👤 ${developer.name} - Cursor Chat Analysis`);
        console.log('-' .repeat(45));
        
        // Get cursor chats for this developer
        const cursorChats = await supabaseClient.query(`
          SELECT 
            cc.*,
            LENGTH(cc.content) as content_length
          FROM cursor_chats cc
          WHERE cc.developer_id::text = $1::text
          ORDER BY cc.created_at DESC
        `, [developer.id]);
        
        console.log(`💬 Cursor Chats Found: ${cursorChats.rows.length}`);
        
        if (cursorChats.rows.length > 0) {
          // Analyze chat patterns
          let totalContentLength = 0;
          let problemSolvingChats = 0;
          let learningIndicatorChats = 0;
          let technicalDiscussions = 0;
          let codeReviewChats = 0;
          
          const projectContexts = new Set();
          const chatTopics = new Set();
          const recentChats = [];
          
          cursorChats.rows.forEach(chat => {
            totalContentLength += chat.content_length || 0;
            
            const content = (chat.content || '').toLowerCase();
            const title = (chat.title || '').toLowerCase();
            
            // Analyze chat patterns
            if (content.includes('error') || content.includes('bug') || content.includes('fix') || 
                content.includes('debug') || title.includes('fix')) {
              problemSolvingChats++;
            }
            
            if (content.includes('how to') || content.includes('learn') || content.includes('understand') ||
                content.includes('explain') || content.includes('what is')) {
              learningIndicatorChats++;
            }
            
            if (content.includes('component') || content.includes('function') || content.includes('api') ||
                content.includes('database') || content.includes('service')) {
              technicalDiscussions++;
            }
            
            if (content.includes('review') || content.includes('refactor') || content.includes('optimize') ||
                content.includes('improve') || title.includes('update')) {
              codeReviewChats++;
            }
            
            if (chat.project_context) projectContexts.add(chat.project_context);
            if (chat.tags && Array.isArray(chat.tags)) {
              chat.tags.forEach(tag => chatTopics.add(tag));
            }
            
            // Track recent activity (last 30 days)
            const daysSince = (Date.now() - new Date(chat.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince <= 30) {
              recentChats.push(chat);
            }
          });
          
          const avgContentLength = Math.round(totalContentLength / cursorChats.rows.length);
          const problemSolvingRate = Math.round((problemSolvingChats / cursorChats.rows.length) * 100);
          const learningRate = Math.round((learningIndicatorChats / cursorChats.rows.length) * 100);
          const technicalRate = Math.round((technicalDiscussions / cursorChats.rows.length) * 100);
          
          console.log(`📊 Chat Analysis Metrics:`);
          console.log(`   Total Chats: ${cursorChats.rows.length}`);
          console.log(`   Recent Chats (30 days): ${recentChats.length}`);
          console.log(`   Average Content Length: ${avgContentLength} chars`);
          console.log(`   Project Contexts: ${Array.from(projectContexts).join(', ')}`);
          
          console.log(`\n🧠 Problem-Solving Analysis:`);
          console.log(`   Problem-Solving Chats: ${problemSolvingChats} (${problemSolvingRate}%)`);
          console.log(`   Learning Indicator Chats: ${learningIndicatorChats} (${learningRate}%)`);
          console.log(`   Technical Discussions: ${technicalDiscussions} (${technicalRate}%)`);
          console.log(`   Code Review Chats: ${codeReviewChats}`);
          
          // Show recent chat examples
          console.log(`\n💬 Recent Chat Examples:`);
          recentChats.slice(0, 3).forEach((chat, i) => {
            console.log(`   ${i + 1}. ${chat.title}`);
            console.log(`      Content: ${chat.content_length} chars`);
            console.log(`      Project: ${chat.project_context || 'General'}`);
            console.log(`      Date: ${new Date(chat.created_at).toLocaleDateString()}`);
          });
          
          // Calculate CADIS cursor intelligence scores
          const collaborationScore = Math.min(100, 
            (problemSolvingChats * 15) + 
            (technicalDiscussions * 10) + 
            (cursorChats.rows.length * 5)
          );
          
          const independenceLevel = Math.min(100,
            100 - (learningIndicatorChats * 8) + (problemSolvingChats * 5)
          );
          
          const engagementScore = Math.min(100,
            (recentChats.length * 10) + 
            (avgContentLength / 10) +
            (Array.from(projectContexts).length * 15)
          );
          
          console.log(`\n📊 CADIS Cursor Intelligence Scores:`);
          console.log(`   Collaboration Score: ${Math.round(collaborationScore)}/100`);
          console.log(`   Independence Level: ${Math.round(independenceLevel)}/100`);
          console.log(`   Engagement Score: ${Math.round(engagementScore)}/100`);
          
          // Generate coaching insights based on cursor patterns
          const cursorInsights = [];
          const cursorStrengths = [];
          
          if (problemSolvingRate >= 30) cursorStrengths.push('Strong problem-solving approach');
          if (technicalRate >= 50) cursorStrengths.push('Good technical discussion engagement');
          if (recentChats.length >= 10) cursorStrengths.push('Active cursor usage for development');
          if (avgContentLength >= 200) cursorStrengths.push('Detailed technical conversations');
          
          if (learningRate >= 40) cursorInsights.push('High learning dependency - encourage more independent research');
          if (problemSolvingRate < 20) cursorInsights.push('Increase problem-solving discussions with cursor');
          if (recentChats.length < 5) cursorInsights.push('More active cursor usage recommended');
          if (avgContentLength < 100) cursorInsights.push('More detailed technical discussions needed');
          
          console.log(`\n💪 Cursor Chat Strengths:`);
          if (cursorStrengths.length > 0) {
            cursorStrengths.forEach(strength => console.log(`   ✅ ${strength}`));
          } else {
            console.log(`   📝 Building cursor chat engagement`);
          }
          
          console.log(`\n🎯 Cursor Chat Coaching:`);
          if (cursorInsights.length > 0) {
            cursorInsights.forEach(insight => console.log(`   💡 ${insight}`));
          } else {
            console.log(`   🌟 Excellent cursor chat patterns`);
          }
          
        } else {
          console.log(`   ❌ No cursor chats found for ${developer.name}`);
          console.log(`   🎯 Coaching: Encourage cursor usage for problem-solving and learning`);
        }
      }
      
      // Overall team cursor analysis
      console.log('\n🏆 Team Cursor Chat Intelligence:');
      console.log('=' .repeat(50));
      
      const totalTeamChats = await supabaseClient.query(`
        SELECT 
          COUNT(*) as total_chats,
          COUNT(DISTINCT developer_id) as developers_with_chats,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_chats,
          AVG(LENGTH(content)) as avg_content_length
        FROM cursor_chats
        WHERE developer_id::text = ANY($1)
      `, [activeDevelopers.rows.map(d => d.id)]);
      
      const teamChatStats = totalTeamChats.rows[0];
      console.log(`📊 Team Cursor Chat Metrics:`);
      console.log(`   Total Team Chats: ${teamChatStats.total_chats || 0}`);
      console.log(`   Developers Using Cursor: ${teamChatStats.developers_with_chats || 0}/${activeDevelopers.rows.length}`);
      console.log(`   Recent Team Chats (30 days): ${teamChatStats.recent_chats || 0}`);
      console.log(`   Team Avg Content Length: ${Math.round(teamChatStats.avg_content_length || 0)} chars`);
      
      const cursorUsageRate = Math.round(((teamChatStats.developers_with_chats || 0) / activeDevelopers.rows.length) * 100);
      console.log(`   Cursor Usage Rate: ${cursorUsageRate}%`);
      
      console.log('\n✅ CADIS Cursor Chat Analysis Complete!');
      console.log('🎯 Found comprehensive cursor chat data for developer coaching');
      
    } finally {
      supabaseClient.release();
      vibezClient.release();
      await supabasePool.end();
      await vibezPool.end();
    }
    
  } catch (error) {
    console.error('❌ Error analyzing cursor chats:', error);
  }
}

analyzeCursorChats();
