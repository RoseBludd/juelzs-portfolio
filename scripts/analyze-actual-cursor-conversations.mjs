#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function analyzeActualCursorConversations() {
  console.log('🔍 Analyzing ACTUAL Cursor Conversations - Content Deep Dive\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
    await vibezClient.connect();
    
    try {
      console.log('📊 Step 1: Getting sample cursor conversations...');
      
      // Get actual cursor chat conversations to analyze
      const conversations = await vibezClient.query(`
        SELECT 
          cc.id, cc.title, cc.filename, cc.content, cc.tags, cc.project_context,
          cc.created_at, cc.file_size,
          d.name as developer_name, d.email as developer_email
        FROM cursor_chats cc
        JOIN developers d ON cc.developer_id = d.id
        WHERE d.status = 'active'
        AND cc.content IS NOT NULL
        AND LENGTH(cc.content) > 1000
        ORDER BY cc.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Found ${conversations.rows.length} detailed conversations to analyze\n`);
      
      conversations.rows.forEach((chat, index) => {
        console.log(`\n🔍 CONVERSATION ${index + 1}: "${chat.title}"`);
        console.log(`👤 Developer: ${chat.developer_name} (${chat.developer_email})`);
        console.log(`📁 File: ${chat.filename}`);
        console.log(`📅 Date: ${new Date(chat.created_at).toLocaleDateString()}`);
        console.log(`📏 Size: ${chat.content.length.toLocaleString()} characters`);
        console.log(`🏷️ Tags: ${chat.tags || 'None'}`);
        console.log(`📋 Context: ${chat.project_context || 'None'}`);
        
        // Analyze the actual conversation content
        const content = chat.content;
        
        console.log(`\n💬 CONVERSATION ANALYSIS:`);
        
        // Extract conversation structure
        const userMessages = content.match(/(\*\*User\*\*|\*\*Human\*\*|User:|Human:)(.*?)(?=(\*\*Assistant\*\*|\*\*Cursor\*\*|Assistant:|Cursor:)|$)/gs) || [];
        const assistantMessages = content.match(/(\*\*Assistant\*\*|\*\*Cursor\*\*|Assistant:|Cursor:)(.*?)(?=(\*\*User\*\*|\*\*Human\*\*|User:|Human:)|$)/gs) || [];
        
        console.log(`   📝 User messages: ${userMessages.length}`);
        console.log(`   🤖 AI responses: ${assistantMessages.length}`);
        console.log(`   💬 Total exchanges: ${Math.max(userMessages.length, assistantMessages.length)}`);
        
        // Analyze conversation quality and patterns
        const lowerContent = content.toLowerCase();
        
        // Developer behavior analysis
        const developerPatterns = {
          'Asks specific questions': /\b(how do i|how can i|what is|why does|where should|when to)\b/g.test(lowerContent),
          'Provides context': /\b(i'm trying to|i want to|i need to|my goal is)\b/g.test(lowerContent),
          'Shows code examples': /```|`[^`]+`|\bcode\b|\bfunction\b|\bclass\b/g.test(lowerContent),
          'Describes errors': /\berror\b|\bfail\b|\bissue\b|\bproblem\b|\bbug\b/g.test(lowerContent),
          'Iterates on solutions': /\btry\b|\bchange\b|\bmodify\b|\bupdate\b|\bfix\b/g.test(lowerContent),
          'Asks for explanations': /\bwhy\b|\bhow does this work\b|\bexplain\b|\bwhat does this do\b/g.test(lowerContent)
        };
        
        // AI assistance quality analysis
        const aiPatterns = {
          'Provides code solutions': /```[\s\S]*?```/g.test(content),
          'Gives explanations': /\bthis works by\b|\bthe reason is\b|\bthis means\b/g.test(lowerContent),
          'Offers alternatives': /\balternatively\b|\byou could also\b|\banother way\b/g.test(lowerContent),
          'Asks clarifying questions': /\bcan you\b|\bdo you want\b|\bwhich\b|\bwould you prefer\b/g.test(lowerContent),
          'Provides best practices': /\bbest practice\b|\brecommended\b|\bshould\b|\bavoid\b/g.test(lowerContent),
          'Includes documentation': /\bdocumentation\b|\bapi reference\b|\bofficial docs\b/g.test(lowerContent)
        };
        
        // Technical depth analysis
        const technicalTopics = {
          'React/Frontend': /\breact\b|\bcomponent\b|\bjsx\b|\bstate\b|\bprops\b|\bhook\b/g.test(lowerContent),
          'Backend/API': /\bapi\b|\bendpoint\b|\bserver\b|\broute\b|\bmiddleware\b|\bauth\b/g.test(lowerContent),
          'Database': /\bdatabase\b|\bsql\b|\bquery\b|\btable\b|\bschema\b|\bmigration\b/g.test(lowerContent),
          'TypeScript': /\btypescript\b|\binterface\b|\btype\b|\bgeneric\b/g.test(lowerContent),
          'Testing': /\btest\b|\bspec\b|\bjest\b|\bcypress\b|\bmock\b/g.test(lowerContent),
          'DevOps/Deploy': /\bdeploy\b|\bbuild\b|\bci\b|\bcd\b|\bdocker\b|\bvercel\b/g.test(lowerContent)
        };
        
        // Problem-solving approach analysis
        const problemSolvingApproach = {
          'Systematic debugging': /\bstep by step\b|\bfirst\b.*\bthen\b|\bcheck\b.*\bthen\b/g.test(lowerContent),
          'Research-oriented': /\blook up\b|\bcheck documentation\b|\bsearch for\b/g.test(lowerContent),
          'Experimental': /\btry this\b|\blet's see\b|\bexperiment\b|\btest\b/g.test(lowerContent),
          'Collaborative': /\bwhat do you think\b|\bshould we\b|\blet's work together\b/g.test(lowerContent)
        };
        
        console.log(`\n🧑‍💻 DEVELOPER BEHAVIOR:`);
        Object.entries(developerPatterns).forEach(([pattern, detected]) => {
          console.log(`   ${detected ? '✅' : '❌'} ${pattern}`);
        });
        
        console.log(`\n🤖 AI ASSISTANCE QUALITY:`);
        Object.entries(aiPatterns).forEach(([pattern, detected]) => {
          console.log(`   ${detected ? '✅' : '❌'} ${pattern}`);
        });
        
        console.log(`\n🔧 TECHNICAL TOPICS COVERED:`);
        Object.entries(technicalTopics).forEach(([topic, detected]) => {
          console.log(`   ${detected ? '✅' : '❌'} ${topic}`);
        });
        
        console.log(`\n🧠 PROBLEM-SOLVING APPROACH:`);
        Object.entries(problemSolvingApproach).forEach(([approach, detected]) => {
          console.log(`   ${detected ? '✅' : '❌'} ${approach}`);
        });
        
        // Extract specific examples from conversation
        console.log(`\n📋 CONVERSATION INSIGHTS:`);
        
        // Find user questions
        const questions = content.match(/\b(how do i|how can i|what is|why does|where should|when to)[^?.!]*[?.!]/gi) || [];
        if (questions.length > 0) {
          console.log(`   ❓ Sample questions asked:`);
          questions.slice(0, 3).forEach(q => {
            console.log(`     • "${q.trim()}"`);
          });
        }
        
        // Find code blocks
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        console.log(`   💻 Code examples shared: ${codeBlocks.length}`);
        
        // Find error mentions
        const errors = content.match(/error[^.!?]*[.!?]/gi) || [];
        if (errors.length > 0) {
          console.log(`   🚨 Error discussions: ${errors.length}`);
          console.log(`     Example: "${errors[0].trim().substring(0, 100)}..."`);
        }
        
        // Calculate conversation quality score
        const developerScore = Object.values(developerPatterns).filter(Boolean).length;
        const aiScore = Object.values(aiPatterns).filter(Boolean).length;
        const technicalScore = Object.values(technicalTopics).filter(Boolean).length;
        const approachScore = Object.values(problemSolvingApproach).filter(Boolean).length;
        
        const totalScore = Math.round(((developerScore + aiScore + technicalScore + approachScore) / 20) * 100);
        
        console.log(`\n🎯 CONVERSATION QUALITY SCORE: ${totalScore}/100`);
        console.log(`   Developer engagement: ${developerScore}/6`);
        console.log(`   AI assistance quality: ${aiScore}/6`);
        console.log(`   Technical depth: ${technicalScore}/6`);
        console.log(`   Problem-solving approach: ${approachScore}/4`);
        
        if (totalScore >= 80) {
          console.log(`   ✅ EXCELLENT conversation quality - highly productive interaction`);
        } else if (totalScore >= 60) {
          console.log(`   🔶 GOOD conversation quality - effective interaction`);
        } else if (totalScore >= 40) {
          console.log(`   ⚠️ MODERATE conversation quality - room for improvement`);
        } else {
          console.log(`   ❌ POOR conversation quality - needs better engagement`);
        }
        
        // Show a snippet of actual conversation
        console.log(`\n📜 CONVERSATION SNIPPET (first 500 chars):`);
        console.log(`"${content.substring(0, 500).replace(/\n/g, ' ').trim()}..."`);
        
        console.log(`\n${'='.repeat(80)}`);
      });
      
      console.log(`\n📊 Step 2: Aggregate conversation analysis...\n`);
      
      // Aggregate analysis across all conversations
      const aggregateAnalysis = await vibezClient.query(`
        SELECT 
          d.name, d.email,
          COUNT(cc.id) as total_conversations,
          AVG(LENGTH(cc.content)) as avg_conversation_length,
          SUM(CASE WHEN cc.content ILIKE '%how do i%' OR cc.content ILIKE '%how can i%' THEN 1 ELSE 0 END) as question_asking_conversations,
          SUM(CASE WHEN cc.content ILIKE '%error%' OR cc.content ILIKE '%issue%' OR cc.content ILIKE '%problem%' THEN 1 ELSE 0 END) as problem_solving_conversations,
          SUM(CASE WHEN cc.content LIKE '%\`\`\`%' THEN 1 ELSE 0 END) as code_sharing_conversations,
          SUM(CASE WHEN cc.content ILIKE '%explain%' OR cc.content ILIKE '%why%' THEN 1 ELSE 0 END) as learning_conversations,
          MAX(cc.created_at) as latest_conversation
        FROM developers d
        LEFT JOIN cursor_chats cc ON cc.developer_id = d.id
        WHERE d.status = 'active'
        AND cc.content IS NOT NULL
        GROUP BY d.id, d.name, d.email
        ORDER BY total_conversations DESC
      `);
      
      console.log(`👥 DEVELOPER CONVERSATION PATTERNS:\n`);
      
      aggregateAnalysis.rows.forEach(dev => {
        const totalConvs = parseInt(dev.total_conversations) || 0;
        if (totalConvs > 0) {
          const questionRate = Math.round((dev.question_asking_conversations / totalConvs) * 100);
          const problemRate = Math.round((dev.problem_solving_conversations / totalConvs) * 100);
          const codeRate = Math.round((dev.code_sharing_conversations / totalConvs) * 100);
          const learningRate = Math.round((dev.learning_conversations / totalConvs) * 100);
          
          console.log(`🧑‍💻 ${dev.name} (${dev.email}):`);
          console.log(`   📊 Total conversations: ${totalConvs}`);
          console.log(`   📝 Avg conversation length: ${Math.round(dev.avg_conversation_length).toLocaleString()} characters`);
          console.log(`   ❓ Question-asking rate: ${questionRate}% (${dev.question_asking_conversations} conversations)`);
          console.log(`   🔧 Problem-solving rate: ${problemRate}% (${dev.problem_solving_conversations} conversations)`);
          console.log(`   💻 Code-sharing rate: ${codeRate}% (${dev.code_sharing_conversations} conversations)`);
          console.log(`   📚 Learning rate: ${learningRate}% (${dev.learning_conversations} conversations)`);
          console.log(`   🕐 Latest conversation: ${new Date(dev.latest_conversation).toLocaleDateString()}`);
          
          // Calculate engagement quality
          const engagementScore = Math.round((questionRate + problemRate + codeRate + learningRate) / 4);
          console.log(`   🎯 Cursor Engagement Score: ${engagementScore}/100`);
          
          if (engagementScore >= 80) {
            console.log(`   ✅ EXCELLENT cursor usage - highly engaged and productive`);
          } else if (engagementScore >= 60) {
            console.log(`   🔶 GOOD cursor usage - well engaged`);
          } else if (engagementScore >= 40) {
            console.log(`   ⚠️ MODERATE cursor usage - could be more engaged`);
          } else {
            console.log(`   ❌ POOR cursor usage - needs improvement in engagement`);
          }
          
          console.log(``);
        }
      });
      
    } finally {
      await vibezClient.end();
    }
    
    console.log('\n🎉 ACTUAL Cursor Conversation Analysis Complete!');
    console.log('\n🎯 Key Findings:');
    console.log('✅ CADIS now analyzes real conversation content, not just statistics');
    console.log('✅ Tracks developer question-asking patterns and learning approach');
    console.log('✅ Evaluates AI assistance quality and technical depth');
    console.log('✅ Identifies problem-solving methodologies and collaboration patterns');
    console.log('✅ Provides conversation quality scores and engagement metrics');
    console.log('✅ Analyzes actual developer-AI interactions for coaching insights');
    
  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  }
}

analyzeActualCursorConversations();
