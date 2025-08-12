import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  // Check admin authentication
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, projectId, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const aiPrompt = `
You are an expert engineering journal assistant. Analyze this journal entry and suggest the most appropriate template/category and any improvements.

Entry Details:
- Title: ${title}
- Content: ${content}
- Project: ${projectId || 'None specified'}
- Tags: ${tags?.join(', ') || 'None'}

Available Templates/Categories:
1. "architecture" - Architecture Decision Record (ADR) - For design decisions, system architecture changes
2. "decision" - General Decision - For any important project or technical decisions
3. "reflection" - Reflection - For retrospectives, code review insights, learning notes
4. "planning" - Planning - For ideas, future features, roadmap planning
5. "problem-solving" - Problem Solving - For team issues, performance investigations, debugging
6. "milestone" - Milestone - For project achievements, milestone reflections

Analyze the content and determine:
1. Which template/category best fits this entry
2. Suggested improvements to make it more structured
3. Additional tags that would be helpful
4. Whether this should be converted to use a specific template
5. AUTOMATICALLY assess difficulty and impact based on content

For difficulty (1-10): Consider technical complexity, time investment, skill requirements, dependencies
For impact (1-10): Consider business value, team effect, user impact, long-term consequences

Respond in JSON format:
{
  "suggestedCategory": "category_name",
  "templateRecommendation": {
    "shouldUseTemplate": true/false,
    "templateName": "specific_template_name",
    "reason": "why this template would be helpful"
  },
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "improvements": [
    "suggestion 1",
    "suggestion 2"
  ],
  "structureAnalysis": {
    "hasContext": true/false,
    "hasDecision": true/false,
    "hasConsequences": true/false,
    "hasNextSteps": true/false,
    "hasEvidence": true/false
  },
  "autoScoring": {
    "difficulty": {
      "score": 7,
      "reasoning": "High technical complexity with multiple dependencies"
    },
    "impact": {
      "score": 8,
      "reasoning": "Affects entire team workflow and user experience"
    },
    "confidence": 85,
    "shouldAutoApply": true
  }
}`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at categorizing and improving engineering journal entries. Provide practical, actionable suggestions.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse AI response
    let analysis;
    try {
      analysis = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI categorization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      analysis,
      metadata: {
        model: 'gpt-4',
        processingTime: Date.now()
      }
    });

  } catch (error) {
    console.error('AI categorization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to categorize entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
