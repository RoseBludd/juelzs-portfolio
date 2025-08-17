// This file needs manual conversion to singleton pattern
// Original file: src\app\api\admin\tasks\analyze\route.ts
// Please use getMainDbPool() instead of prisma

import { NextRequest, NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';
import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

// Use centralized main database pool
const pool = getMainDbPool();

// Initialize Anthropic AI
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export const dynamic = "force-dynamic";

// Task analysis schema
const analyzeTaskSchema = z.object({
  description: z.string().min(1, "Description is required")
});

// AI-powered task analysis function
async function analyzeTaskWithAI(description: string) {
  const prompt = `You are an expert software development project manager and technical analyst. Analyze the following task description and provide a structured analysis.

Task Description:
"${description}"

Please analyze this task and respond with ONLY a valid JSON object in the following format:

{
  "title": "string (concise, descriptive title under 50 characters)",
  "optimizedDescription": "string (improved, clearer description)",
  "requirements": ["string array of 3-6 specific technical requirements"],
  "acceptanceCriteria": ["string array of 3-5 testable acceptance criteria"],
  "estimatedTime": number (realistic hours estimate between 5-80)
}

Consider:
- Technical complexity and scope
- Development best practices
- Testing requirements
- Integration needs
- User experience factors
- Maintenance considerations

CRITICAL: Respond with ONLY the raw JSON object. Do not use markdown formatting, code blocks, or any other text. Your response must be valid JSON that can be parsed directly.`;

  try {
    console.log('🤖 Sending task to Claude AI for analysis...');
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic API");
    }

    console.log('✅ Received AI analysis response');
    
    // Clean the response - remove markdown code blocks if present
    let responseText = content.text.trim();
    
    // Remove ```json and ``` if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned response text:', responseText.substring(0, 100) + '...');
    
    const analysis = JSON.parse(responseText);
    
    // Validate the response structure
    if (!analysis.title || !analysis.optimizedDescription || !analysis.requirements || !analysis.acceptanceCriteria || !analysis.estimatedTime) {
      throw new Error("Invalid AI response structure");
    }

    return analysis;

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    // Fallback to basic analysis if AI fails
    console.log('🔄 Falling back to basic analysis...');
    return fallbackAnalysis(description);
  }
}

// Fallback analysis function (original keyword-based approach)
function fallbackAnalysis(description: string) {
  // Extract title from first sentence or first 50 characters
  const title = description.split('\n')[0].split('.')[0].trim().substring(0, 50);
  
  // Generate basic requirements based on keywords
  const requirements = [];
  const acceptanceCriteria = [];
  
  // Look for common patterns
  if (description.toLowerCase().includes('dashboard')) {
    requirements.push('Create responsive dashboard layout');
    requirements.push('Implement data visualization');
    acceptanceCriteria.push('Dashboard loads within 2 seconds');
    acceptanceCriteria.push('All charts and graphs display correctly');
  }
  
  if (description.toLowerCase().includes('api')) {
    requirements.push('Design RESTful API endpoints');
    requirements.push('Implement proper error handling');
    acceptanceCriteria.push('API returns proper HTTP status codes');
    acceptanceCriteria.push('All endpoints properly documented');
  }
  
  if (description.toLowerCase().includes('database')) {
    requirements.push('Design database schema');
    requirements.push('Implement data validation');
    acceptanceCriteria.push('Database migrations run successfully');
    acceptanceCriteria.push('Data integrity maintained');
  }
  
  if (description.toLowerCase().includes('user')) {
    requirements.push('Implement user authentication');
    requirements.push('Create user-friendly interface');
    acceptanceCriteria.push('User can complete tasks without errors');
    acceptanceCriteria.push('Interface follows accessibility standards');
  }
  
  if (description.toLowerCase().includes('test')) {
    requirements.push('Write unit tests');
    requirements.push('Implement integration tests');
    acceptanceCriteria.push('All tests pass');
    acceptanceCriteria.push('Code coverage above 80%');
  }
  
  // Add default requirements if none found
  if (requirements.length === 0) {
    requirements.push('Analyze and understand requirements');
    requirements.push('Implement core functionality');
    requirements.push('Test implementation thoroughly');
  }
  
  if (acceptanceCriteria.length === 0) {
    acceptanceCriteria.push('Implementation meets all requirements');
    acceptanceCriteria.push('Code follows best practices');
    acceptanceCriteria.push('Solution is properly tested');
  }
  
  // Estimate time based on complexity indicators
  let estimatedTime = 20; // Default
  
  if (description.toLowerCase().includes('complex') || description.toLowerCase().includes('advanced')) {
    estimatedTime = 40;
  } else if (description.toLowerCase().includes('simple') || description.toLowerCase().includes('basic')) {
    estimatedTime = 15;
  }
  
  // Adjust based on keywords
  if (description.toLowerCase().includes('integration')) {
    estimatedTime += 10;
  }
  
  if (description.toLowerCase().includes('database')) {
    estimatedTime += 5;
  }
  
  return {
    title: title || 'New Task',
    optimizedDescription: description,
    requirements,
    acceptanceCriteria,
    estimatedTime
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = analyzeTaskSchema.parse(body);

    // Use AI-powered analysis
    const analysis = await analyzeTaskWithAI(validatedData.description);

    return NextResponse.json(analysis, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Task analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze task. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Keep the other methods as stubs for now
export async function GET() {
  return NextResponse.json({
    error: 'GET method not implemented for this endpoint'
  }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'PUT method not implemented for this endpoint'
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'DELETE method not implemented for this endpoint'
  }, { status: 501 });
}
