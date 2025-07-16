import OpenAI from 'openai';

export interface LeadershipAnalysis {
  overallRating: number; // 1-10
  strengths: string[];
  areasForImprovement: string[];
  standoutMoments: string[];
  communicationStyle: {
    clarity: number;
    engagement: number;
    empathy: number;
    decisiveness: number;
  };
  leadershipQualities: {
    technicalGuidance: number;
    teamBuilding: number;
    problemSolving: number;
    visionCasting: number;
  };
  keyInsights: string[];
  recommendations: string[];
  summary: string;
}

export interface MeetingContext {
  id: string;
  title: string;
  transcript: string;
  participants: string[];
  duration: string;
  type: 'architecture' | 'leadership' | 'mentoring' | 'technical';
  dateRecorded: string;
}

class MeetingAnalysisService {
  private static instance: MeetingAnalysisService | undefined;
  private openai: OpenAI | null = null;
  private apiKeyValid: boolean = false;
  private apiKeyChecked: boolean = false;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔍 MeetingAnalysisService constructor called');
    console.log(`🔑 API Key present: ${!!apiKey}`);
    console.log(`🔑 API Key length: ${apiKey?.length || 0}`);
    console.log(`🔑 API Key starts with: ${apiKey?.substring(0, 15)}...`);
    
    if (!apiKey) {
      console.warn('❌ OPENAI_API_KEY not found in environment variables.');
      this.openai = null;
      this.apiKeyValid = false;
      this.apiKeyChecked = true;
    } else {
      console.log('✅ OPENAI_API_KEY found, initializing OpenAI client...');
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      // Assume valid initially - will validate on first use
      this.apiKeyValid = true;
      this.apiKeyChecked = false;
    }
  }

  public static getInstance(): MeetingAnalysisService {
    if (!MeetingAnalysisService.instance) {
      MeetingAnalysisService.instance = new MeetingAnalysisService();
    }
    return MeetingAnalysisService.instance;
  }

  /**
   * Reset the singleton instance (for testing/development)
   */
  public static resetInstance(): void {
    console.log('🔄 Resetting MeetingAnalysisService instance');
    MeetingAnalysisService.instance = undefined;
  }

  /**
   * Check if OpenAI API is available
   */
  isApiAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Validate API key (non-blocking)
   */
  private async validateApiKey(): Promise<boolean> {
    if (this.apiKeyChecked) {
      return this.apiKeyValid;
    }

    if (!this.openai) {
      this.apiKeyChecked = true;
      return false;
    }

    try {
      // Simple test with a basic completion
      await Promise.race([
        this.openai.chat.completions.create({
          model: 'gpt-4o-mini', // Use the cheaper model for validation
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
          temperature: 0
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Validation timeout')), 5000))
      ]);

      console.log('✅ OpenAI API key validation successful');
      this.apiKeyValid = true;
      this.apiKeyChecked = true;
      return true;
    } catch (error) {
      console.warn('❌ OpenAI API key validation failed:', error instanceof Error ? error.message : 'Unknown error');
      this.apiKeyValid = false;
      this.apiKeyChecked = true;
      return false;
    }
  }

  /**
   * Analyze a meeting transcript for leadership performance
   */
  async analyzeMeetingLeadership(context: MeetingContext): Promise<LeadershipAnalysis | null> {
    // Return null immediately if API is not available
    if (!this.isApiAvailable()) {
      console.log(`❌ OpenAI API not available for analysis: ${context.title}`);
      return null;
    }

    try {
      console.log(`📊 Analyzing meeting transcript with OpenAI...`);
      console.log(`Meeting: ${context.title}`);
      console.log(`Duration: ${context.duration}`);
      console.log(`🔑 API Available: ${this.isApiAvailable()}`);
      
      const startTime = Date.now();
      const prompt = this.buildAnalysisPrompt(context);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini', // Use the more reliable model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Analysis took: ${duration}ms`);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log(`❌ No content returned from OpenAI for: ${context.title}`);
        return null;
      }

      try {
        const analysis = JSON.parse(content) as LeadershipAnalysis;
        
        // Validate the analysis has required fields
        if (!analysis.overallRating || !analysis.strengths || !analysis.areasForImprovement) {
          console.log(`❌ Invalid analysis structure for: ${context.title}`);
          return null;
        }
        
        console.log(`✅ Successfully analyzed: ${context.title} - Rating: ${analysis.overallRating}/10`);
        return analysis;
        
      } catch (parseError) {
        console.error(`❌ Error parsing analysis JSON for ${context.title}:`, parseError);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error during analysis for ${context.title}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Analyze multiple meetings to identify patterns and growth
   */
  async analyzeLeadershipTrends(contexts: MeetingContext[]): Promise<{
    overallTrends: {
      strengths: string[];
      growthAreas: string[];
      patterns: string[];
    };
    individualAnalyses: LeadershipAnalysis[];
    recommendations: string[];
  } | null> {
    const analyses = await Promise.all(
      contexts.map(context => this.analyzeMeetingLeadership(context))
    );

    // Filter out null analyses
    const validAnalyses = analyses.filter((analysis): analysis is LeadershipAnalysis => analysis !== null);

    // Return null if no valid analyses or API not available
    if (validAnalyses.length === 0 || !this.isApiAvailable()) {
      console.log('❌ No valid analyses available for trends analysis');
      return null;
    }

    const trendsPrompt = this.buildTrendsAnalysisPrompt(contexts, validAnalyses);
    
    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior leadership development coach analyzing patterns across multiple meeting performances.
            Identify trends, growth trajectories, and provide strategic recommendations for leadership development.
            Focus on technical leadership, systems thinking, and team development capabilities.`
          },
          {
            role: 'user',
            content: trendsPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const trends = JSON.parse(response.choices[0].message.content!);
      
      return {
        overallTrends: trends.overallTrends,
        individualAnalyses: validAnalyses,
        recommendations: trends.recommendations
      };
      
    } catch (error) {
      console.error('❌ Error analyzing leadership trends:', error);
      return null; // Return null instead of fallback
    }
  }

  /**
   * Get specific coaching recommendations based on analysis
   */
  async getCoachingRecommendations(analysis: LeadershipAnalysis): Promise<string[] | null> {
    // Return null if API is not available
    if (!this.isApiAvailable()) {
      console.log('❌ OpenAI API not available for coaching recommendations');
      return null;
    }

    const prompt = `Based on this leadership analysis, provide 5 specific, actionable coaching recommendations:
    
    Strengths: ${analysis.strengths.join(', ')}
    Areas for Improvement: ${analysis.areasForImprovement.join(', ')}
    Communication Scores: Clarity=${analysis.communicationStyle.clarity}, Engagement=${analysis.communicationStyle.engagement}
    Leadership Scores: Technical=${analysis.leadershipQualities.technicalGuidance}, Team Building=${analysis.leadershipQualities.teamBuilding}
    
    Provide recommendations that are:
    1. Specific and actionable
    2. Based on the person's existing strengths
    3. Focused on technical leadership growth
    4. Practical for implementation`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a technical leadership coach providing specific, actionable recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      const recommendations = response.choices[0].message.content!
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 10);

      return recommendations;
      
    } catch (error) {
      console.error('❌ Error generating coaching recommendations:', error);
      return null; // Return null instead of fallback
    }
  }

  private buildAnalysisPrompt(context: MeetingContext): string {
    return `Analyze this meeting transcript to showcase JUSTIN'S leadership skills and capabilities:

**Meeting Context:**
- Title: ${context.title}
- Type: ${context.type}
- Duration: ${context.duration}
- Participants: ${context.participants.join(', ')}
- Date: ${context.dateRecorded}

**ANALYSIS GOAL: This analysis will be used to showcase Justin's leadership capabilities to potential clients and employers. Focus on highlighting his strengths, decision-making abilities, technical expertise, and leadership impact.**

**Transcript:**
${context.transcript}

**Analysis Framework:**
Analyze JUSTIN'S leadership performance to highlight his professional capabilities. Provide a comprehensive skills showcase in JSON format:

{
  "overallRating": <7-10 score - focus on showcasing Justin's strong performance>,
  "strengths": [<highlight Justin's specific leadership strengths and capabilities>],
  "areasForImprovement": [<frame as growth opportunities and advanced skill development>],
  "standoutMoments": [<specific examples of Justin's exceptional leadership, technical decisions, or team guidance>],
  "communicationStyle": {
    "clarity": <7-10 score - showcase communication skills>,
    "engagement": <7-10 score - highlight team engagement>,
    "empathy": <7-10 score - show people-focused leadership>,
    "decisiveness": <7-10 score - demonstrate decision-making capability>
  },
  "leadershipQualities": {
    "technicalGuidance": <8-10 score - highlight technical expertise>,
    "teamBuilding": <7-10 score - show team development skills>,
    "problemSolving": <8-10 score - showcase analytical and solution-oriented thinking>,
    "visionCasting": <7-10 score - demonstrate strategic thinking>
  },
  "keyInsights": [<positive insights about Justin's leadership approach and impact>],
  "recommendations": [<frame as advanced skill development and leadership expansion opportunities>],
  "summary": "<compelling summary that positions Justin as a skilled technical leader and valuable team asset>"
}

**CRITICAL INSTRUCTIONS:**
1. All scores should reflect professional competency (7-10 range)
2. Frame "areas for improvement" as "advanced development opportunities"
3. Focus on specific examples of leadership impact and technical decision-making
4. Highlight problem-solving approach and team guidance
5. Showcase communication effectiveness and strategic thinking
6. Present Justin as a skilled leader worth working with**`;
  }

  private buildTrendsAnalysisPrompt(contexts: MeetingContext[], analyses: LeadershipAnalysis[]): string {
    const summaries = analyses.map((analysis, index) => {
      const context = contexts[index];
      return `${context.title} (${context.type}): Overall ${analysis.overallRating}/10, Strengths: ${analysis.strengths.slice(0, 2).join(', ')}`;
    }).join('\n');

    return `Analyze these leadership performance patterns across multiple meetings:

**Meeting Summaries:**
${summaries}

**Detailed Analyses:**
${JSON.stringify(analyses, null, 2)}

Please provide trend analysis in JSON format:

{
  "overallTrends": {
    "strengths": [<consistent strengths across meetings>],
    "growthAreas": [<areas needing development>],
    "patterns": [<behavioral patterns observed>]
  },
  "recommendations": [<strategic recommendations for leadership development>]
}`;
  }

  private validateAndStructureAnalysis(analysis: Partial<LeadershipAnalysis> & Record<string, unknown>): LeadershipAnalysis {
    return {
      overallRating: Math.min(10, Math.max(1, analysis.overallRating || 7)),
      strengths: analysis.strengths || ['Technical expertise', 'Clear communication'],
      areasForImprovement: analysis.areasForImprovement || ['Active listening', 'Delegation'],
      standoutMoments: analysis.standoutMoments || ['Effective problem-solving'],
      communicationStyle: {
        clarity: Math.min(10, Math.max(1, analysis.communicationStyle?.clarity || 7)),
        engagement: Math.min(10, Math.max(1, analysis.communicationStyle?.engagement || 7)),
        empathy: Math.min(10, Math.max(1, analysis.communicationStyle?.empathy || 7)),
        decisiveness: Math.min(10, Math.max(1, analysis.communicationStyle?.decisiveness || 7))
      },
      leadershipQualities: {
        technicalGuidance: Math.min(10, Math.max(1, analysis.leadershipQualities?.technicalGuidance || 8)),
        teamBuilding: Math.min(10, Math.max(1, analysis.leadershipQualities?.teamBuilding || 6)),
        problemSolving: Math.min(10, Math.max(1, analysis.leadershipQualities?.problemSolving || 8)),
        visionCasting: Math.min(10, Math.max(1, analysis.leadershipQualities?.visionCasting || 7))
      },
      keyInsights: analysis.keyInsights || ['Strong technical background', 'Systems thinking approach'],
      recommendations: analysis.recommendations || ['Focus on team engagement', 'Develop coaching skills'],
      summary: analysis.summary || 'Demonstrates strong technical leadership with opportunities for growth in team dynamics.'
    };
  }
}

export default MeetingAnalysisService; 