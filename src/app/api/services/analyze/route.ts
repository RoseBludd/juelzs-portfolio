import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface ServiceDefinition {
  title: string;
  description: string;
  duration: string;
  pricing: string;
  type: string;
  keywords: string[];
  tier: 'quick-start' | 'professional' | 'enterprise';
}

const availableServices: ServiceDefinition[] = [
  {
    title: 'AI Strategy Session',
    description: 'Quick consultation on integrating AI into your architecture and development process.',
    duration: '1-2 hours',
    pricing: '$200-300',
    type: 'consultation',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'automation', 'quick consultation'],
    tier: 'quick-start'
  },
  {
    title: 'Code Review Session',
    description: 'Focused review of specific code sections with actionable feedback and best practices guidance.',
    duration: '1 hour',
    pricing: '$150-200',
    type: 'code-review',
    keywords: ['code review', 'code quality', 'best practices', 'debugging', 'quick review'],
    tier: 'quick-start'
  },
  {
    title: 'Performance Optimization',
    description: 'Quick assessment and optimization of application performance bottlenecks.',
    duration: '2-3 hours',
    pricing: '$350-450',
    type: 'performance-optimization',
    keywords: ['slow', 'performance', 'optimization', 'bottleneck', 'speed', 'latency'],
    tier: 'quick-start'
  },
  {
    title: 'Architecture Review',
    description: 'Deep dive into your system architecture with actionable recommendations and performance optimization strategies.',
    duration: '2-3 hours',
    pricing: '$300-450',
    type: 'architecture-review',
    keywords: ['architecture', 'system design', 'scalability', 'monolith', 'microservices'],
    tier: 'professional'
  },
  {
    title: 'Database Architecture Review',
    description: 'Specialized review of database design, queries, and optimization strategies.',
    duration: '1-2 days',
    pricing: '$800-1,200',
    type: 'database-review',
    keywords: ['database', 'sql', 'queries', 'optimization', 'data modeling'],
    tier: 'professional'
  },
  {
    title: 'CI/CD Pipeline Setup',
    description: 'Complete CI/CD pipeline design and implementation with automated testing and deployment.',
    duration: '3-5 days',
    pricing: '$1,500-2,500',
    type: 'cicd-setup',
    keywords: ['deployment', 'ci/cd', 'automation', 'testing', 'pipeline', 'devops'],
    tier: 'professional'
  },
  {
    title: 'Technical Audit & Assessment',
    description: 'Comprehensive codebase and infrastructure audit with detailed improvement roadmap.',
    duration: '3-5 days',
    pricing: '$1,200-2,000',
    type: 'technical-audit',
    keywords: ['audit', 'assessment', 'codebase review', 'infrastructure', 'roadmap'],
    tier: 'professional'
  },
  {
    title: 'Technical Leadership Coaching',
    description: 'One-on-one coaching for technical leads to develop leadership skills and team management capabilities.',
    duration: '2-4 weeks',
    pricing: '$1,500-3,000',
    type: 'leadership-coaching',
    keywords: ['leadership', 'coaching', 'management', 'team lead', 'skills development'],
    tier: 'professional'
  },
  {
    title: 'AI Strategy & Implementation',
    description: 'Comprehensive AI integration planning with hands-on implementation guidance and ROI analysis.',
    duration: '1-2 weeks',
    pricing: '$2,500-5,000',
    type: 'ai-implementation',
    keywords: ['ai implementation', 'ai strategy', 'machine learning', 'automation', 'comprehensive'],
    tier: 'enterprise'
  },
  {
    title: 'System Design Consultation',
    description: 'Strategic guidance on designing scalable, modular systems from the ground up with future-proofing.',
    duration: '1-2 weeks',
    pricing: '$2,000-4,000',
    type: 'system-design',
    keywords: ['system design', 'scalable', 'modular', 'greenfield', 'new system'],
    tier: 'enterprise'
  },
  {
    title: 'Team Coaching & Development',
    description: 'Hands-on coaching to help your team think in systems and scale their architectural thinking.',
    duration: '4-6 weeks',
    pricing: '$4,000-6,000',
    type: 'team-coaching',
    keywords: ['team coaching', 'team development', 'architecture training', 'systems thinking'],
    tier: 'enterprise'
  },
  {
    title: 'Legacy System Modernization',
    description: 'Strategic planning and execution for modernizing legacy systems with minimal business disruption.',
    duration: '2-4 weeks',
    pricing: '$5,000-8,000',
    type: 'legacy-modernization',
    keywords: ['legacy', 'modernization', 'migration', 'old system', 'outdated'],
    tier: 'enterprise'
  },
  {
    title: 'Build Your Permanent Team',
    description: 'I help you build, hire, and train your own development team - you keep them permanently (RECOMMENDED).',
    duration: '2-6 weeks',
    pricing: '$8,000-15,000',
    type: 'team-building',
    keywords: ['hire team', 'build team', 'permanent team', 'recruitment', 'team building'],
    tier: 'enterprise'
  },
  {
    title: 'Remote Team Management',
    description: 'Consulting on building and managing distributed technical teams across multiple time zones.',
    duration: '1-3 weeks',
    pricing: '$3,000-5,000',
    type: 'remote-team-management',
    keywords: ['remote team', 'distributed team', 'management', 'time zones', 'remote work'],
    tier: 'enterprise'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const prompt = `
You are a technical consulting expert analyzing a client's needs to recommend the most appropriate services.

Client's description: "${description}"

Available services:
${availableServices.map(service => `
- ${service.title} (${service.tier})
  Type: ${service.type}
  Duration: ${service.duration}
  Pricing: ${service.pricing}
  Description: ${service.description}
  Keywords: ${service.keywords.join(', ')}
`).join('')}

Based on the client's description, recommend:
1. A PRIMARY service that best fits their immediate needs
2. An ALTERNATIVE service that could be more comprehensive or a different approach

Consider:
- Budget constraints (people often prefer cheaper options initially)
- Scope of their problem
- Urgency indicated
- Technical complexity mentioned
- Team size/situation

Respond in this exact JSON format:
{
  "primary": {
    "service": "exact service type from list",
    "title": "exact service title",
    "description": "exact service description",
    "pricing": "exact pricing from service",
    "duration": "exact duration from service",
    "reasoning": "2-3 sentences explaining why this is perfect for their specific situation",
    "type": "exact service type"
  },
  "alternative": {
    "service": "exact service type from list",
    "title": "exact service title", 
    "description": "exact service description",
    "pricing": "exact pricing from service",
    "duration": "exact duration from service",
    "reasoning": "2-3 sentences explaining why they might consider this instead (usually more comprehensive or addressing root causes)",
    "type": "exact service type"
  }
}`;

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({
        error: 'OpenAI not configured',
        suggestion: 'Set OPENAI_API_KEY or contact support',
      }, { status: 503 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical consultant who analyzes client needs and recommends appropriate services. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    try {
      const recommendation = JSON.parse(responseText);
      
      // Validate the response structure
      if (!recommendation.primary || !recommendation.alternative) {
        throw new Error('Invalid recommendation structure');
      }

      return NextResponse.json({ recommendation });
         } catch {
       console.error('Failed to parse AI response:', responseText);
       throw new Error('Invalid response format from AI');
     }

  } catch (error) {
    console.error('Service analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze your needs. Please try again or contact me directly.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 