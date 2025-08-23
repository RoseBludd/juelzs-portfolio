import { NextRequest, NextResponse } from 'next/server';
import { Client, Pool, PoolClient } from 'pg';
import fs from 'fs';

// Development singleton client; production pooled clients
declare global {
  var __VIB_PG_CLIENT: Client | undefined;
  var __VIB_PG_POOL: Pool | undefined;
}

async function getDbClient(): Promise<{ client: Client | PoolClient; release: () => Promise<void> }> {
  const connectionString = process.env.VIBEZS_DB as string;
  const ssl = { rejectUnauthorized: false } as const;
  if (process.env.NODE_ENV !== 'production') {
    if (!global.__VIB_PG_CLIENT) {
      global.__VIB_PG_CLIENT = new Client({ connectionString, ssl });
      await global.__VIB_PG_CLIENT.connect();
    }
    return { client: global.__VIB_PG_CLIENT, release: async () => {} };
  }
  if (!global.__VIB_PG_POOL) {
    global.__VIB_PG_POOL = new Pool({ connectionString, ssl, max: 10 });
  }
  const pooledClient = await global.__VIB_PG_POOL.connect();
  return { client: pooledClient, release: async () => { pooledClient.release(); } };
}

export async function GET(request: NextRequest) {
  console.log('🔍 Fetching available conversations for Strategic Architect Masterclass');
  
  try {
    // Built-in conversations (file-based)
    const builtInConversations = [
      {
        id: 'cadis-developer',
        title: '🧠 CADIS Developer Intelligence',
        description: '1.85M chars • Strategic direction-setting • 90% context preservation • 90/100 strategic score',
        source: 'database',
        isEnabled: true,
        createdAt: new Date('2025-08-18'),
        totalCharacters: 1851698,
        strategicScore: 90,
        alignmentScore: 98
      },
      {
        id: 'image-display-issues',
        title: '🔧 Image Display Issues',
        description: '3.45M chars • Technical problem-solving • 100% context preservation • 93/100 alignment score',
        source: 'file_system',
        isEnabled: true,
        createdAt: new Date('2025-08-18'),
        totalCharacters: 3450182,
        strategicScore: 85,
        alignmentScore: 93
      },
      {
        id: 'genius-game-development',
        title: '🎮 Genius Game Development',
        description: '85K chars • Progressive enhancement • 100% context preservation • 88/100 strategic score',
        source: 'file_system',
        isEnabled: true,
        createdAt: new Date('2025-08-20'),
        totalCharacters: 85000,
        strategicScore: 88,
        alignmentScore: 95
      },
      {
        id: 'understanding-information-segments',
        title: '📚 Understanding Information Segments',
        description: '4.6M chars • Learning architecture design • 100% context preservation • 96/100 alignment score',
        source: 'file_system',
        isEnabled: true,
        createdAt: new Date('2025-08-22'),
        totalCharacters: 4590679,
        strategicScore: 92,
        alignmentScore: 96
      },
      {
        id: 'overall-analysis-insights',
        title: '🧭 Combined Strategic Intelligence',
        description: 'Combined • Recursive intelligence • 100% context preservation • 98/100 strategic score',
        source: 'combined',
        isEnabled: true,
        createdAt: new Date('2025-08-20'),
        totalCharacters: 2500000,
        strategicScore: 98,
        alignmentScore: 98
      },
      {
        id: 'advanced-strategic-patterns',
        title: '🌟 Advanced Strategic Patterns',
        description: 'Meta-system • Strategic architecture • 100% context preservation • 95/100 strategic score',
        source: 'strategic_placeholder',
        isEnabled: true,
        createdAt: new Date('2025-08-22'),
        totalCharacters: 2500,
        strategicScore: 95,
        alignmentScore: 92
      },
      {
        id: 'reonomy-integration',
        title: '🏢 Reonomy + Property Integration',
        description: 'Data integration • Property enrichment • 100% context preservation • ~92/100 alignment',
        source: 'file_system',
        isEnabled: true,
        createdAt: new Date('2025-08-22'),
        totalCharacters: 1200000,
        strategicScore: 87,
        alignmentScore: 92
      }
    ];

    // Database conversations (uploaded cursor chats)
    const { client, release } = await getDbClient();
    let databaseConversations = [];
    
    try {
      const result = await client.query(`
        SELECT 
          cc.id,
          cc.title,
          cc.content,
          cc.metadata,
          cc.created_at,
          cc.updated_at,
          d.name as developer_name,
          d.role,
          LENGTH(cc.content) as total_characters
        FROM cursor_chats cc
        JOIN developers d ON cc.developer_id = d.id
        WHERE d.role = 'strategic_architect'
        ORDER BY cc.created_at DESC
        LIMIT 10
      `);

      databaseConversations = result.rows.map(row => {
        // Auto-generate strategic and alignment scores based on content analysis
        const content = row.content.toLowerCase();
        const strategicPatterns = (content.match(/\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm|create|build|fix|solve|execute|run|test|check|update|add|remove|delete|modify|change)\b/g) || []).length;
        const alignmentPatterns = (content.match(/\b(modular|component|service|singleton|module|reusable|framework|pattern|template|systematic|scale|standard|consistent|library|utility|helper|common|shared|generic|flexible|adaptable)\b/g) || []).length;
        
        // Calculate scores based on pattern density
        const strategicScore = Math.min(100, Math.max(65, Math.round((strategicPatterns / (row.total_characters / 1000)) * 15 + 65)));
        const alignmentScore = Math.min(100, Math.max(70, Math.round((alignmentPatterns / (row.total_characters / 1000)) * 12 + 70)));

        // Auto-generate emoji and description based on title and content
        let emoji = '💬';
        let focusArea = 'Strategic conversation';
        
        if (row.title.toLowerCase().includes('cadis')) emoji = '🧠';
        else if (row.title.toLowerCase().includes('game')) emoji = '🎮';
        else if (row.title.toLowerCase().includes('debug') || row.title.toLowerCase().includes('fix')) emoji = '🔧';
        else if (row.title.toLowerCase().includes('analysis') || row.title.toLowerCase().includes('understand')) emoji = '📊';
        else if (row.title.toLowerCase().includes('integration')) emoji = '🔗';
        else if (row.title.toLowerCase().includes('architecture')) emoji = '🏗️';
        
        if (content.includes('problem') || content.includes('debug') || content.includes('fix')) focusArea = 'Problem-solving';
        else if (content.includes('architecture') || content.includes('system')) focusArea = 'System architecture';
        else if (content.includes('analysis') || content.includes('understand')) focusArea = 'Strategic analysis';
        else if (content.includes('integration') || content.includes('connect')) focusArea = 'System integration';

        return {
          id: `db-${row.id}`,
          title: `${emoji} ${row.title}`,
          description: `${Math.round(row.total_characters / 1000)}K chars • ${focusArea} • 100% context preservation • ${strategicScore}/100 strategic score`,
          source: 'database',
          isEnabled: true,
          createdAt: row.created_at,
          totalCharacters: row.total_characters,
          strategicScore,
          alignmentScore,
          developerName: row.developer_name,
          role: row.role,
          dbId: row.id
        };
      });

      console.log(`📊 Found ${databaseConversations.length} database conversations`);
      
    } finally {
      await release();
    }

    // Combine and sort all conversations
    const allConversations = [
      ...builtInConversations,
      ...databaseConversations
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`✅ Returning ${allConversations.length} total conversations for masterclass`);

    return NextResponse.json({
      success: true,
      conversations: allConversations,
      totalCount: allConversations.length,
      builtInCount: builtInConversations.length,
      databaseCount: databaseConversations.length
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return NextResponse.json({
      error: 'Failed to fetch conversations',
      details: error instanceof Error ? error.message : 'Unknown error',
      conversations: []
    }, { status: 500 });
  }
}
