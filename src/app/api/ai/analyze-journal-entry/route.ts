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
    const { entry } = body;

    if (!entry || !entry.content) {
      return NextResponse.json(
        { error: 'Journal entry content is required' },
        { status: 400 }
      );
    }

    const aiPrompt = `
You are an expert engineering mentor and leadership coach. Analyze this journal entry and provide comprehensive, constructive feedback focusing on professional growth and engineering excellence.

JOURNAL ENTRY TO ANALYZE:
Title: ${entry.title}
Category: ${entry.category}
Content: ${entry.content}
Difficulty: ${entry.metadata?.difficulty || 'Not specified'}/10
Impact: ${entry.metadata?.impact || 'Not specified'}/10
Key Learnings: ${entry.metadata?.learnings?.join(', ') || 'None specified'}
Next Steps: ${entry.metadata?.nextSteps?.join(', ') || 'None specified'}

Provide analysis in these areas:

1. **DECISION QUALITY**: Evaluate the engineering decisions made, considering:
   - Technical soundness and architectural thinking
   - Risk assessment and mitigation strategies
   - Scalability and maintainability considerations
   - Alternative approaches that could be considered

2. **PROBLEM-SOLVING APPROACH**: Assess the methodology and thinking process:
   - Problem decomposition and analysis depth
   - Research and information gathering
   - Solution evaluation criteria
   - Innovation and creativity in approach

3. **LEADERSHIP & COMMUNICATION**: Analyze leadership qualities demonstrated:
   - Stakeholder consideration and communication
   - Team impact and collaboration approach
   - Documentation and knowledge sharing
   - Strategic thinking and business alignment

4. **LEARNING & GROWTH**: Identify development opportunities:
   - Knowledge gaps to address
   - Skills to develop further
   - Experiences to seek out
   - Best practices to adopt

5. **STRATEGIC IMPACT**: Evaluate broader implications:
   - Business value creation
   - Technical debt implications
   - Team/organizational impact
   - Long-term strategic alignment

Provide specific, actionable feedback that helps improve future engineering decisions and leadership effectiveness.

Respond in JSON format:
{
  "analysis": {
    "decisionQuality": {
      "score": 8,
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"],
      "feedback": "Detailed feedback about decision quality"
    },
    "problemSolving": {
      "score": 7,
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"],
      "feedback": "Detailed feedback about problem-solving approach"
    },
    "leadership": {
      "score": 6,
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"],
      "feedback": "Detailed feedback about leadership qualities"
    },
    "learning": {
      "score": 8,
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"],
      "feedback": "Detailed feedback about learning and growth"
    },
    "strategicImpact": {
      "score": 7,
      "strengths": ["Strength 1", "Strength 2"],
      "improvements": ["Improvement 1", "Improvement 2"],
      "feedback": "Detailed feedback about strategic impact"
    }
  },
  "overallAssessment": {
    "averageScore": 7.2,
    "keyStrengths": ["Overall strength 1", "Overall strength 2"],
    "priorityImprovements": ["Priority improvement 1", "Priority improvement 2"],
    "recommendedActions": ["Action 1", "Action 2"],
    "summary": "Overall summary of the analysis and key takeaways"
  },
  "confidence": 85,
  "analysisDate": "${new Date().toISOString()}"
}`;

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
            content: 'You are an expert engineering mentor and leadership coach specializing in technical decision analysis and professional development.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;

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
      ...analysis 
    });

  } catch (error) {
    console.error('Error analyzing journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to analyze journal entry' },
      { status: 500 }
    );
  }
}
