import { NextRequest, NextResponse } from 'next/server';
import { createCADISAgent, getCADISAgent } from '@/services/cadis-background-agent.service';

// Initialize CADIS Agent with environment configuration
const initializeAgent = () => {
  const config = {
    githubToken: process.env.GITHUB_TOKEN || '',
    vercelToken: process.env.VERCEL_TOKEN || '',
    railwayToken: process.env.RAILWAY_TOKEN || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    elevenLabsApiKey: process.env.ELEVEN_LABS_API_KEY || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    s3Config: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || ''
    }
  };

  return createCADISAgent(config);
};

export async function POST(request: NextRequest) {
  console.log('🤖 CADIS Agent API called');
  
  try {
    const body = await request.json();
    const { action, request: userRequest, context } = body;

    if (!userRequest) {
      return NextResponse.json({
        error: 'Request is required',
        success: false
      }, { status: 400 });
    }

    // Initialize or get existing agent
    const agent = initializeAgent();

    let result: string;

    switch (action) {
      case 'handle_request':
        result = await agent.handleRequest(userRequest, context);
        break;
      
      case 'add_action':
        const jobId = agent.addActionBusJob(context?.type || 'generic', context);
        result = `Action queued with ID: ${jobId}`;
        break;
      
      case 'status':
        const status = agent.getStatus();
        return NextResponse.json({
          success: true,
          status,
          message: 'CADIS Agent is running with evolution capabilities'
        });

      case 'generate_audio':
        const { text, voice } = context || {};
        if (!text) {
          return NextResponse.json({
            error: 'Text is required for audio generation'
          }, { status: 400 });
        }
        result = await agent.generateAudio(text, voice) || 'Audio generation failed';
        break;

      case 'analyze_cross_repo':
        const crossRepoAnalysis = await agent.analyzeCrossRepositoryPatterns();
        return NextResponse.json({
          success: true,
          analysis: crossRepoAnalysis,
          message: 'Cross-repository analysis completed'
        });

      case 'create_developer_agent':
        const { developerEmail } = context || {};
        if (!developerEmail) {
          return NextResponse.json({
            error: 'Developer email is required'
          }, { status: 400 });
        }
        result = await agent.createDeveloperCoachingAgent(developerEmail) || 'Failed to create developer agent';
        break;

      case 'create_module_agent':
        result = await agent.createModuleCreationAgent() || 'Failed to create module agent';
        break;
      
      default:
        result = await agent.handleRequest(userRequest, context);
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ CADIS Agent API error:', error);
    return NextResponse.json({
      error: 'CADIS Agent processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get agent status
    const agent = getCADISAgent();
    const status = agent.getStatus();

    return NextResponse.json({
      success: true,
      agent: 'CADIS Background Agent',
      version: '1.0.0',
      status,
      capabilities: [
        'Multi-AI model analysis (GPT-5, Claude Opus, Gemini Pro)',
        'Direct repository modifications',
        'Support ticket handling',
        'Project adjustments',
        'Feature requests',
        'Bug fixes',
        'Automated deployments',
        'Action bus processing',
        'Audio generation (ElevenLabs)',
        'Cross-repository pattern analysis',
        'Specialized agent creation',
        'Developer coaching agents',
        'Module creation agents',
        'Dynamic efficiency ceiling adjustment',
        'Autonomous capability expansion'
      ],
      models: {
        gpt5: 'gpt-5-2025-08-07',
        claude: 'claude-opus-4-1-20250805',
        gemini: 'gemini-2.5-pro'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Agent not initialized',
      message: 'Send a POST request to initialize the agent'
    });
  }
}
