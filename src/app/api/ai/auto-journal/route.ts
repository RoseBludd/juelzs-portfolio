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
    const { content, files = [], currentDate = new Date().toISOString() } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters long' },
        { status: 400 }
      );
    }

    const todayFormatted = new Date(currentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const aiPrompt = `
You are an expert engineering journal assistant. Based on the content provided, automatically generate ALL the journal entry fields optimally for ${todayFormatted}.

CONTENT TO ANALYZE:
${content}

${files.length > 0 ? `FILES PROVIDED: ${files.map((f: any) => f.name || f.url || f).join(', ')}` : ''}

Generate a complete, professional journal entry with these fields:

1. OPTIMAL TITLE: Create a clear, descriptive title that captures the essence
2. CATEGORY: Choose the best fit from: architecture, decision, reflection, planning, problem-solving, milestone
3. PROJECT DETECTION: Analyze content to detect which project this relates to (sales-jobs, portfolio, etc.)
4. SMART TAGS: Generate relevant technical and contextual tags
5. ASSESSMENT SCORES: Auto-assess difficulty (1-10) and impact (1-10) based on technical complexity and business value
6. NEXT STEPS: Extract or infer logical next steps from the content
7. KEY LEARNINGS: Identify important insights or lessons
8. RESOURCES: ONLY include actual, real resources that are:
   - Specific URLs mentioned in the content
   - Named tools/services referenced (e.g., "AWS S3", "DocuSign API", "PostgreSQL")  
   - Documentation links if explicitly mentioned
   - Leave EMPTY array [] if no specific resources are identified
   - NEVER use placeholder text like "Resource 1" or "Tool 1"

Respond in JSON format:
{
  "optimizedEntry": {
    "title": "Generated optimal title",
    "category": "best_category",
    "projectId": "detected_project_or_null",
    "projectName": "detected_project_name_or_empty",
    "tags": ["technical-tag1", "context-tag2", "domain-tag3"],
    "content": "${content}",
    "metadata": {
      "difficulty": 7,
      "impact": 8,
      "learnings": ["Key insight 1", "Key insight 2"],
      "nextSteps": ["Action 1", "Action 2"],
      "resources": []
    }
  },
  "aiAnalysis": {
    "confidence": 85,
    "reasoning": "Why this categorization and scoring makes sense",
    "suggestedImprovements": ["How to make this entry even better"],
    "templateRecommendation": "Which template would enhance this entry"
  },
  "autoApply": true
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
            content: `You are an expert engineering journal assistant specialized in automatically generating optimal journal entries. You understand software engineering, architecture decisions, project management, and technical documentation. Always provide professional, actionable insights. Today is ${todayFormatted}.`
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
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
      // Clean the AI content of potential control characters
      const cleanedContent = aiContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI content:', aiContent);
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const cleanedMatch = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          analysis = JSON.parse(cleanedMatch);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
          return NextResponse.json(
            { error: 'Failed to parse AI analysis' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to parse AI analysis' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      ...analysis,
      metadata: {
        model: 'gpt-4',
        processingTime: Date.now(),
        generatedDate: currentDate
      }
    });

  } catch (error) {
    console.error('Auto journal generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate journal entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
