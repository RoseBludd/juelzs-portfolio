import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// POST - Analyze thumbnail with GPT Vision
export async function POST(request: NextRequest) {
  try {
    const { image, videoKey, timeStamp, context } = await request.json();

    if (!image || !videoKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'image and videoKey are required' 
      }, { status: 400 });
    }

    console.log(`🔍 [${videoKey}] GPT Vision analyzing thumbnail at ${timeStamp}s...`);

    const prompt = `You are analyzing a video thumbnail for a leadership/technical video. 

Rate this thumbnail from 0-100 based on:
- Visual Quality: Clear, well-lit, good contrast, not blurry or dark
- Content Relevance: Shows people, faces, or meaningful content (not just blank screens)
- Professional Appearance: Suitable for a leadership portfolio
- Composition: Well-framed, centered, visually appealing
- Technical Meeting Context: Appropriate for coaching/technical discussion videos

Give ONLY a number between 0-100. No explanation needed.

Scoring guidelines:
- 90-100: Excellent - Clear faces, good lighting, professional appearance
- 70-89: Good - Visible content, adequate quality, some minor issues
- 50-69: Average - Usable but has quality/content issues
- 30-49: Poor - Dark, blurry, or mostly empty screen
- 0-29: Unusable - Black screen, error, or completely unclear

Just respond with the number score.`;

    const openai = getOpenAIClient();
    if (!openai) {
      console.warn(`⚠️ [${videoKey}] OPENAI_API_KEY not set; returning fallback score`);
      return NextResponse.json({ success: true, score: 50, raw_response: 'fallback-no-openai' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "low" // Use low detail for faster processing
              }
            }
          ]
        }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const scoreText = response.choices[0]?.message?.content?.trim();
    const score = parseFloat(scoreText || '0');

    if (isNaN(score) || score < 0 || score > 100) {
      console.warn(`⚠️ [${videoKey}] Invalid GPT Vision score: "${scoreText}", using fallback`);
      return NextResponse.json({
        success: true,
        score: 50,
        raw_response: scoreText
      });
    }

    console.log(`✅ [${videoKey}] GPT Vision score: ${score}/100 at ${timeStamp}s`);

    return NextResponse.json({
      success: true,
      score,
      raw_response: scoreText
    });

  } catch (error) {
    console.error('❌ GPT Vision analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'GPT Vision analysis failed',
      score: 50 // Fallback score
    }, { status: 500 });
  }
} 