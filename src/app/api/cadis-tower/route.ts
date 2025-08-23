import { NextRequest, NextResponse } from 'next/server';
import { createCADISTower, getCADISTower } from '@/services/cadis-tower-babel.service';
import { getCADISAgent } from '@/services/cadis-background-agent.service';

// Initialize CADIS Tower with comprehensive configuration
const initializeTower = () => {
  const aiModels = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      models: {
        gpt4o: 'gpt-4o',
        gpt4oMini: 'gpt-4o-mini',
        gpt5: 'gpt-5-2025-08-07'
      }
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      models: {
        claude35Sonnet: 'claude-3-5-sonnet-20241022',
        claudeOpus: 'claude-opus-4-1-20250805'
      }
    },
    google: {
      apiKey: process.env.GEMINI_API_KEY || '',
      models: {
        gemini15Pro: 'gemini-1.5-pro',
        gemini25Pro: 'gemini-2.5-pro'
      }
    }
  };

  const dataAccess = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || ''
    },
    github: {
      token: process.env.GITHUB_TOKEN || '',
      owner: 'RoseBludd'
    },
    vercel: {
      token: process.env.VERCEL_TOKEN || '',
      teamId: process.env.VERCEL_TEAM_ID
    },
    railway: {
      token: process.env.RAILWAY_TOKEN || ''
    }
  };

  // Get or create background agent with configuration
  const agentConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    githubToken: process.env.GITHUB_TOKEN || '',
    vercelToken: process.env.VERCEL_TOKEN || '',
    railwayToken: process.env.RAILWAY_TOKEN || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
  
  const backgroundAgent = getCADISAgent(agentConfig);
  
  return createCADISTower({
    aiModels,
    dataAccess,
    backgroundAgent
  });
};

export async function POST(request: NextRequest) {
  console.log('🗼 CADIS Tower API called');
  
  try {
    const body = await request.json();
    const { 
      request: userRequest, 
      type = 'workflow',
      context = {},
      enableConsciousness = false,
      layers = 3
    } = body;

    if (!userRequest) {
      return NextResponse.json({
        error: 'Request is required',
        success: false
      }, { status: 400 });
    }

    // Initialize or get existing tower
    const tower = initializeTower();

    // Process request through the tower
    const result = await tower.processRequest(userRequest, {
      type,
      context: {
        ...context,
        layers: type === 'recursive' ? layers : undefined
      },
      enableConsciousness
    });

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      requestType: type,
      consciousnessEnabled: enableConsciousness
    });

  } catch (error) {
    console.error('❌ CADIS Tower API error:', error);
    return NextResponse.json({
      error: 'CADIS Tower processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // Get comprehensive tower status
      const tower = initializeTower();
      const status = tower.getStatus();

      return NextResponse.json({
        success: true,
        ...status,
        endpoints: {
          process: 'POST /api/cadis-tower',
          status: 'GET /api/cadis-tower?action=status',
          capabilities: 'GET /api/cadis-tower?action=capabilities'
        }
      });
    }

    if (action === 'capabilities') {
      // Get detailed capabilities
      const tower = initializeTower();
      const status = tower.getStatus();

      return NextResponse.json({
        success: true,
        architecture: 'CADIS Tower of Babel',
        description: 'Layered AI ecosystem with comprehensive intelligence capabilities',
        layers: {
          '1_foundation': {
            name: 'Foundation Layer',
            description: 'Core AI models and data access',
            components: ['OpenAI GPT-4o/GPT-5', 'Claude 3.5 Sonnet/Opus', 'Gemini 1.5/2.5 Pro', 'Supabase', 'S3', 'GitHub', 'Vercel', 'Railway']
          },
          '2_intelligence': {
            name: 'Intelligence Layer',
            description: 'Specialized AI services',
            services: status.capabilities.intelligenceServices
          },
          '3_orchestration': {
            name: 'Orchestration Layer',
            description: 'Workflow coordination and task management',
            features: ['Dependency Resolution', 'Parallel Execution', 'Error Handling', 'Result Aggregation']
          },
          '4_interface': {
            name: 'Interface Layer',
            description: 'APIs and user interfaces',
            types: ['Journal Analysis', 'Meeting Analysis', 'Code Analysis', 'Dreamstate Simulation', 'Custom Workflows']
          },
          '5_consciousness': {
            name: 'Consciousness Layer',
            description: 'Meta-analysis and recursive intelligence',
            capabilities: ['Meta-Analysis', 'Recursive Intelligence', 'Self-Awareness', 'Learning History', 'Evolution Tracking']
          }
        },
        requestTypes: {
          journal: 'Analyze journal entries for strategic insights',
          meeting: 'Analyze meeting transcripts for leadership insights',
          code: 'Analyze code and repositories for architectural improvements',
          dreamstate: 'Multi-layer reality simulation for strategic exploration',
          workflow: 'Execute custom workflows across multiple intelligence services',
          meta: 'Perform meta-analysis on any subject',
          recursive: 'Recursive intelligence analysis with configurable depth'
        },
        examples: {
          journal: {
            request: 'Today I realized that our architecture needs to be more modular...',
            type: 'journal',
            context: { entryId: 'entry-123' }
          },
          dreamstate: {
            request: 'What if we could deploy code changes instantly without any downtime?',
            type: 'dreamstate',
            context: { layers: 3 }
          },
          recursive: {
            request: 'Analyze CADIS system capabilities',
            type: 'recursive',
            context: { depth: 4 }
          }
        }
      });
    }

    if (action === 'knowledge') {
      // Get comprehensive knowledge base
      const tower = initializeTower();
      const knowledgeBase = await tower.getKnowledgeBase();

      return NextResponse.json({
        success: true,
        ...knowledgeBase,
        timestamp: new Date().toISOString()
      });
    }

    // Default: return basic info
    return NextResponse.json({
      success: true,
      name: 'CADIS Tower of Babel',
      version: '1.0.0',
      description: 'Layered AI ecosystem with comprehensive intelligence capabilities',
      usage: {
        process: 'POST /api/cadis-tower with { request, type, context, enableConsciousness }',
        status: 'GET /api/cadis-tower?action=status',
        capabilities: 'GET /api/cadis-tower?action=capabilities'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get tower information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
