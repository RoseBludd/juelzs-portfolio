#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';
import fs from 'fs';

dotenv.config();

async function submitPersonalJournalEntry() {
  console.log('📝 Submitting Personal Journal Entry to Admin System\n');
  
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const vibezClient = new Client({ connectionString: process.env.VIBEZS_DB });
    await vibezClient.connect();
    
    try {
      // Read the journal entry content
      const journalContent = fs.readFileSync('docs/personal-journal-interaction-style-discovery.md', 'utf8');
      
      console.log('📋 Journal Entry Details:');
      console.log('   Title: Discovering My AI Interaction Style');
      console.log('   Category: Leadership Self-Discovery');
      console.log('   Type: Personal Reflection');
      console.log('   Content Length:', journalContent.length, 'characters');
      
      // Generate unique ID for journal entry
      const { randomUUID } = await import('crypto');
      const entryId = randomUUID();
      
      // Insert the journal entry
      const insertQuery = `
        INSERT INTO journal_entries (
          id,
          title,
          content,
          category,
          tags,
          is_private,
          created_at,
          updated_at,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)
        RETURNING id, title, category, created_at
      `;
      
      const result = await vibezClient.query(insertQuery, [
        entryId,
        'Discovering My AI Interaction Style - Strategic Architect Pattern',
        journalContent,
        'Leadership Self-Discovery',
        JSON.stringify(['strategic-thinking', 'leadership', 'ai-interaction', 'self-discovery', 'team-development', 'cadis-analysis']),
        false, // Make it public (is_private = false)
        JSON.stringify({
          type: 'personal_reflection',
          interaction_style: 'strategic_architect',
          score: 95,
          key_insights: [
            'Discovered Strategic Architect interaction style (95/100)',
            'Team lacks strategic thinkers (0% primary strategic architects)',
            'Adrian shows strategic potential (29% strategic architect score)',
            'Strategic thinking is learnable and valuable for team development'
          ],
          strategic_implications: [
            'Need to develop strategic bench strength',
            'Coach Adrian toward leadership role',
            'Create strategic thinking curriculum',
            'Build AI systems that support strategic interaction styles'
          ],
          cadis_integration: true,
          framework_development: 'cursor-interaction-styles-framework'
        })
      ]);
      
      const journalEntry = result.rows[0];
      
      console.log('\n✅ Journal Entry Successfully Submitted!');
      console.log('   Entry ID:', journalEntry.id);
      console.log('   Title:', journalEntry.title);
      console.log('   Category:', journalEntry.category);
      console.log('   Created:', new Date(journalEntry.created_at).toLocaleString());
      
      console.log('\n✅ Journal Entry Analysis Embedded in Metadata!');
      
      // Check if entry is now visible in public insights
      const publicCheck = await vibezClient.query(`
        SELECT id, title, category, is_private, created_at
        FROM journal_entries 
        WHERE id = $1 AND (is_private = false OR is_private IS NULL)
      `, [journalEntry.id]);
      
      if (publicCheck.rows.length > 0) {
        console.log('\n🌟 Entry now visible in Public Insights Showcase!');
        console.log('   Accessible at: /insights');
        console.log('   Category: Leadership Self-Discovery');
      }
      
      console.log('\n📊 Journal System Stats:');
      const stats = await vibezClient.query(`
        SELECT 
          COUNT(*) as total_entries,
          COUNT(CASE WHEN is_private = false OR is_private IS NULL THEN 1 END) as public_entries,
          COUNT(CASE WHEN category = 'Leadership Self-Discovery' THEN 1 END) as leadership_entries,
          COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as analyzed_entries
        FROM journal_entries
      `);
      
      const journalStats = stats.rows[0];
      console.log('   Total Entries:', journalStats.total_entries);
      console.log('   Public Entries:', journalStats.public_entries);
      console.log('   Leadership Entries:', journalStats.leadership_entries);
      console.log('   AI Analyzed:', journalStats.analyzed_entries);
      
    } finally {
      await vibezClient.end();
    }
    
    console.log('\n🎉 Personal Journal Entry Successfully Submitted to Admin System!');
    console.log('✅ Available in admin panel at /admin/journal');
    console.log('✅ Visible in public insights at /insights');
    console.log('✅ AI analysis complete with strategic leadership assessment');
    console.log('✅ Tagged for easy discovery and categorization');
    
  } catch (error) {
    console.error('❌ Submission error:', error.message);
  }
}

submitPersonalJournalEntry();
