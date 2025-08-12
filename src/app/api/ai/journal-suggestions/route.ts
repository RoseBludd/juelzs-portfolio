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
    const { entryId, title, content, category, projectId, tags, metadata } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // Create context for AI analysis
    const context = {
      title,
      content,
      category,
      projectId,
      tags: tags || [],
      metadata: metadata || {}
    };

    const aiPrompt = `
You are an experienced software architect and engineering leader. Analyze this journal entry and provide actionable suggestions to help improve the project, architecture, or decision-making process.

Journal Entry Context:
- Title: ${title}
- Category: ${category}
- Project ID: ${projectId || 'None specified'}
- Tags: ${tags?.join(', ') || 'None'}
- Content: ${content}
- Metadata: ${JSON.stringify(metadata || {}, null, 2)}

Based on this entry, provide 2-4 specific, actionable suggestions. For each suggestion, include:

1. Type (one of: architecture, optimization, best-practice, risk-assessment, next-steps)
2. The specific suggestion (2-3 sentences)
3. Reasoning behind the suggestion (1-2 sentences)
4. Confidence level (0-100)
5. Implementation complexity (low, medium, high)
6. Estimated time to implement
7. Relevant resources (optional)

Focus on:
- Architecture improvements and best practices
- Performance optimizations
- Risk mitigation strategies
- Next logical steps for the project
- Learning opportunities
- Process improvements

Respond in JSON format:
{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "suggestion_type",
      "suggestion": "detailed suggestion text",
      "reasoning": "why this suggestion is valuable",
      "confidence": 85,
      "implementationComplexity": "medium",
      "estimatedTimeToImplement": "2-3 days",
      "resources": ["optional array of helpful links or documentation"]
    }
  ]
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
            content: 'You are an expert software architect and engineering consultant. Provide practical, actionable advice based on the journal entry provided.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
    let suggestions;
    try {
      const parsed = JSON.parse(aiContent);
      suggestions = parsed.suggestions || [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI suggestions' },
        { status: 500 }
      );
    }

    // Add unique IDs and timestamps to suggestions
    const enhancedSuggestions = suggestions.map((suggestion: any, index: number) => ({
      ...suggestion,
      id: suggestion.id || `suggestion_${entryId}_${Date.now()}_${index}`,
      createdAt: new Date()
    }));

    return NextResponse.json({ 
      success: true, 
      suggestions: enhancedSuggestions,
      metadata: {
        model: 'gpt-4',
        processingTime: Date.now(),
        entryId
      }
    });

  } catch (error) {
    console.error('AI journal suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate AI suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
