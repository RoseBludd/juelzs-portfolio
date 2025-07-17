import OpenAI from 'openai';
import { LeadershipAnalysis } from './meeting-analysis.service';
import AWSS3Service from './aws-s3.service';

export interface OverallLeadershipAnalysis {
  // Executive Summary
  executiveSummary: string;
  overallRating: number; // 1-10
  
  // Core Leadership Profile
  leadershipProfile: {
    primaryStrengths: string[];
    leadershipStyle: string;
    decisionMakingApproach: string;
    communicationEffectiveness: string;
  };
  
  // Quantified Capabilities
  capabilities: {
    technicalLeadership: {
      score: number;
      evidence: string[];
    };
    teamDevelopment: {
      score: number;
      evidence: string[];
    };
    strategicThinking: {
      score: number;
      evidence: string[];
    };
    problemSolving: {
      score: number;
      evidence: string[];
    };
    communication: {
      score: number;
      evidence: string[];
    };
  };
  
  // Performance Insights
  performanceInsights: {
    consistentStrengths: string[];
    growthTrajectory: string[];
    impactfulMoments: string[];
    leadershipEvolution: string;
  };
  
  // Professional Value Proposition
  valueProposition: {
    uniqueDifferentiators: string[];
    idealRoleAlignment: string[];
    organizationalImpact: string[];
    keyResultsAchieved: string[];
  };
  
  // Recommendations for Hiring/Partnership
  recommendations: {
    bestFitScenarios: string[];
    expectedOutcomes: string[];
    collaborationStyle: string;
    teamIntegration: string;
  };
  
  // Supporting Data
  dataPoints: {
    totalSessionsAnalyzed: number;
    averageRating: number;
    timeSpanCovered: string;
    analysisConfidence: number;
    lastUpdated: string;
  };
}

class OverallLeadershipAnalysisService {
  private static instance: OverallLeadershipAnalysisService;
  private openai: OpenAI | null = null;
  private s3Service: AWSS3Service;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
    
    this.s3Service = AWSS3Service.getInstance();
  }

  public static getInstance(): OverallLeadershipAnalysisService {
    if (!OverallLeadershipAnalysisService.instance) {
      OverallLeadershipAnalysisService.instance = new OverallLeadershipAnalysisService();
    }
    return OverallLeadershipAnalysisService.instance;
  }

  /**
   * Check if OpenAI API is available
   */
  private isApiAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate comprehensive overall leadership analysis from all video analyses
   */
  async generateOverallAnalysis(videoAnalyses: LeadershipAnalysis[], videoTitles: string[]): Promise<OverallLeadershipAnalysis | null> {
    if (!this.isApiAvailable()) {
      console.log('❌ OpenAI API not available for overall leadership analysis');
      return null;
    }

    if (videoAnalyses.length === 0) {
      console.log('❌ No video analyses provided for overall analysis');
      return null;
    }

    try {
      console.log(`📊 Generating overall leadership analysis from ${videoAnalyses.length} video analyses`);
      
      const prompt = this.buildOverallAnalysisPrompt(videoAnalyses, videoTitles);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior executive leadership consultant preparing a comprehensive leadership assessment for CEOs, founders, and senior executives considering Justin for technical leadership roles, consulting engagements, or strategic partnerships.

Your analysis will be used for:
- Executive hiring decisions
- Consulting engagement evaluations  
- Strategic partnership considerations
- Board-level leadership assessments
- Technical leadership capability reviews

Focus on quantifiable leadership capabilities, measurable impact, and evidence-based insights that demonstrate Justin's value to organizations. Present Justin as a proven technical leader with demonstrated results.`
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log('❌ No content returned from OpenAI for overall analysis');
        return null;
      }

      const analysis = JSON.parse(content) as OverallLeadershipAnalysis;
      
      // Add metadata
      analysis.dataPoints = {
        ...analysis.dataPoints,
        totalSessionsAnalyzed: videoAnalyses.length,
        averageRating: this.calculateAverageRating(videoAnalyses),
        timeSpanCovered: this.calculateTimeSpan(videoTitles),
        analysisConfidence: this.calculateConfidenceScore(videoAnalyses),
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ Overall leadership analysis generated - Rating: ${analysis.overallRating}/10`);
      return analysis;

    } catch (error) {
      console.error('❌ Error generating overall leadership analysis:', error);
      return null;
    }
  }

  /**
   * Get cached overall analysis or generate new one
   */
  async getOverallAnalysis(videoAnalyses: LeadershipAnalysis[], videoTitles: string[]): Promise<OverallLeadershipAnalysis | null> {
    try {
      // Check for cached analysis first
      const cached = await this.getCachedOverallAnalysis();
      
      if (cached && this.isCacheValid(cached)) {
        console.log('✅ Using cached overall leadership analysis');
        return cached;
      }

      // Generate new analysis if no cache or cache is stale
      console.log('🔄 Generating fresh overall leadership analysis');
      const analysis = await this.generateOverallAnalysis(videoAnalyses, videoTitles);
      
      if (analysis) {
        // Cache the new analysis
        await this.cacheOverallAnalysis(analysis);
      }

      return analysis;
    } catch (error) {
      console.error('❌ Error getting overall analysis:', error);
      return null;
    }
  }

  /**
   * Force refresh of overall analysis (bypasses cache)
   */
  async refreshOverallAnalysis(videoAnalyses: LeadershipAnalysis[], videoTitles: string[]): Promise<OverallLeadershipAnalysis | null> {
    console.log('🔄 Force refreshing overall leadership analysis');
    
    const analysis = await this.generateOverallAnalysis(videoAnalyses, videoTitles);
    
    if (analysis) {
      await this.cacheOverallAnalysis(analysis);
      console.log('✅ Overall analysis refreshed and cached');
    }

    return analysis;
  }

  /**
   * Get cached overall analysis from S3
   */
  private async getCachedOverallAnalysis(): Promise<OverallLeadershipAnalysis | null> {
    try {
      const analysisKey = 'overall-leadership-analysis/overall_analysis.json';
      
      const analysisContent = await this.s3Service.getFileContent(analysisKey);
      
      if (analysisContent) {
        const analysis = JSON.parse(analysisContent) as OverallLeadershipAnalysis;
        console.log('✅ Retrieved cached overall leadership analysis');
        return analysis;
      }
      
      return null;
    } catch {
      console.log('📄 No cached overall analysis found');
      return null;
    }
  }

  /**
   * Cache overall analysis to S3
   */
  private async cacheOverallAnalysis(analysis: OverallLeadershipAnalysis): Promise<void> {
    try {
      await this.s3Service.storeOverallAnalysis(analysis as unknown as Record<string, unknown>);
      console.log('💾 Cached overall leadership analysis to S3');
    } catch (error) {
      console.error('❌ Error caching overall analysis:', error);
    }
  }

  /**
   * Check if cached analysis is still valid (24 hours)
   */
  private isCacheValid(analysis: OverallLeadershipAnalysis): boolean {
    const now = new Date();
    const lastUpdated = new Date(analysis.dataPoints.lastUpdated);
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceUpdate < 24; // Cache valid for 24 hours
  }

  private buildOverallAnalysisPrompt(videoAnalyses: LeadershipAnalysis[], videoTitles: string[]): string {
    const analysisData = videoAnalyses.map((analysis, index) => ({
      title: videoTitles[index] || `Session ${index + 1}`,
      rating: analysis.overallRating,
      strengths: analysis.strengths,
      communicationStyle: analysis.communicationStyle,
      leadershipQualities: analysis.leadershipQualities,
      keyInsights: analysis.keyInsights,
      summary: analysis.summary
    }));

    return `Analyze these ${videoAnalyses.length} leadership session analyses to create a comprehensive executive-level leadership assessment for JUSTIN.

**CONTEXT**: This analysis will be presented to CEOs, founders, and senior executives evaluating Justin for:
- Technical leadership positions
- Strategic consulting engagements  
- Architectural guidance roles
- Team leadership opportunities
- Board advisory positions

**ANALYSIS DATA:**
${JSON.stringify(analysisData, null, 2)}

**COMPREHENSIVE ASSESSMENT REQUIREMENTS:**

Create a thorough executive leadership profile in JSON format:

{
  "executiveSummary": "<2-3 sentence compelling summary that positions Justin as a DISTINCTIVE technical leader. Must include: specific technical achievements, quantifiable leadership impact, unique problem-solving approach, and clear business value. Avoid generic phrases. Examples: 'modular architecture expertise', 'AI-driven solutions', 'team performance improvements', 'strategic decision-making', 'measurable outcomes'. Make it executive-grade and investment-worthy.>",
  "overallRating": <8-10 score reflecting demonstrated leadership capability>,
  
  "leadershipProfile": {
    "primaryStrengths": ["<top 4-5 leadership strengths with SPECIFIC evidence and measurable impact>"],
    "leadershipStyle": "<clear description of leadership approach with specific examples of methodologies and frameworks used>",
    "decisionMakingApproach": "<how Justin approaches complex technical and strategic decisions with specific examples>",
    "communicationEffectiveness": "<assessment of communication skills with specific examples of stakeholder engagement>"
  },
  
  "capabilities": {
    "technicalLeadership": {
      "score": <8-10 based on evidence>,
      "evidence": ["<specific examples of technical leadership impact with measurable outcomes>"]
    },
    "teamDevelopment": {
      "score": <7-10 based on evidence>,
      "evidence": ["<examples of team building and mentoring effectiveness with specific results>"]
    },
    "strategicThinking": {
      "score": <7-10 based on evidence>, 
      "evidence": ["<examples of strategic and architectural thinking with business impact>"]
    },
    "problemSolving": {
      "score": <8-10 based on evidence>,
      "evidence": ["<examples of complex problem resolution with specific methodologies>"]
    },
    "communication": {
      "score": <7-10 based on evidence>,
      "evidence": ["<examples of effective communication and influence with stakeholder outcomes>"]
    }
  },
  
  "performanceInsights": {
    "consistentStrengths": ["<patterns of strength across all sessions with specific examples>"],
    "growthTrajectory": ["<evidence of continuous improvement and learning with specific progression>"],
    "impactfulMoments": ["<standout leadership moments with specific outcomes and business impact>"],
    "leadershipEvolution": "<assessment of leadership development with specific examples of adaptation>"
  },
  
  "valueProposition": {
    "uniqueDifferentiators": ["<what makes Justin SPECIFICALLY distinctive as a technical leader - avoid generic terms>"],
    "idealRoleAlignment": ["<specific types of roles where Justin would excel with reasoning>"],
    "organizationalImpact": ["<specific potential impact on teams and organizations with measurable outcomes>"],
    "keyResultsAchieved": ["<specific measurable outcomes and achievements demonstrated in sessions>"]
  },
  
  "recommendations": {
    "bestFitScenarios": ["<specific organizational contexts where Justin would be most valuable>"],
    "expectedOutcomes": ["<specific measurable results organizations can expect from working with Justin>"],
    "collaborationStyle": "<how Justin specifically works with teams and stakeholders with examples>",
    "teamIntegration": "<how Justin specifically integrates with and elevates existing teams with examples>"
  }
}

**CRITICAL REQUIREMENTS:**
1. All scores should reflect professional excellence (7-10 range)
2. Provide SPECIFIC evidence from the session analyses - no generic statements
3. Focus on MEASURABLE leadership impact and business value
4. Present Justin as an investment-worthy technical leader with UNIQUE capabilities
5. Use executive-level language appropriate for C-suite decision makers
6. Highlight SPECIFIC value proposition and competitive advantages
7. Ground all assessments in CONCRETE examples from the provided data
8. Position for success while maintaining authenticity and credibility
9. EXECUTIVE SUMMARY MUST BE COMPELLING AND SPECIFIC - avoid generic leadership language
10. Include specific technical methodologies, frameworks, and approaches demonstrated**`;
  }

  private calculateAverageRating(analyses: LeadershipAnalysis[]): number {
    const sum = analyses.reduce((acc, analysis) => acc + analysis.overallRating, 0);
    return Math.round((sum / analyses.length) * 10) / 10;
  }

  private calculateTimeSpan(videoTitles: string[]): string {
    // Extract dates from video titles and calculate span
    const dates = videoTitles
      .map(title => {
        const dateMatch = title.match(/2025[_-](\d{2})[_-](\d{2})/);
        if (dateMatch) {
          return new Date(2025, parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]));
        }
        return null;
      })
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());

    if (dates.length >= 2) {
      const start = dates[0]!;
      const end = dates[dates.length - 1]!;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, 2025`;
    }

    return `${dates.length} sessions analyzed`;
  }

  private calculateConfidenceScore(analyses: LeadershipAnalysis[]): number {
    // Higher confidence with more analyses and higher average scores
    const count = analyses.length;
    const avgRating = this.calculateAverageRating(analyses);
    
    const confidence = Math.min(10, (count * 1.5) + (avgRating * 0.5));
    return Math.round(confidence * 10) / 10;
  }
}

export default OverallLeadershipAnalysisService; 