import OpenAI from 'openai';
import GitHubService, { GitHubProject } from './github.service';

export interface ArchitectureAnalysis {
  overallScore: number; // 1-10
  strengths: string[];
  improvements: string[];
  designPatterns: {
    name: string;
    confidence: number;
    description: string;
  }[];
  bestPractices: {
    modularity: number; // 1-10
    testability: number; // 1-10
    maintainability: number; // 1-10
    scalability: number; // 1-10
    security: number; // 1-10
    performance: number; // 1-10
  };
  codeQuality: {
    structure: number; // 1-10
    documentation: number; // 1-10
    consistency: number; // 1-10
    complexity: number; // 1-10 (lower is better, inverted in scoring)
  };
  frameworksAndLibraries: {
    name: string;
    usage: 'optimal' | 'good' | 'needs-improvement';
    reasoning: string;
  }[];
  architecturalDecisions: string[];
  recommendations: string[];
  technicalDebt: {
    level: 'low' | 'medium' | 'high';
    areas: string[];
    priority: string[];
  };
  summary: string;
}

export interface ProjectContext {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  language: string;
  topics: string[];
  readme?: string;
  packageJson?: string;
  tsconfig?: string;
  projectStructure?: string[];
  keyFiles?: { path: string; content: string; }[];
}

class ArchitectureAnalysisService {
  private static instance: ArchitectureAnalysisService | undefined;
  private openai: OpenAI | null = null;
  private apiKeyValid: boolean = false;
  private apiKeyChecked: boolean = false;
  private githubService: GitHubService;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.githubService = GitHubService.getInstance();
    
    console.log('🏗️ ArchitectureAnalysisService constructor called');
    console.log(`🔑 API Key present: ${!!apiKey}`);
    
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
      this.apiKeyValid = true;
      this.apiKeyChecked = false;
    }
  }

  public static getInstance(): ArchitectureAnalysisService {
    if (!ArchitectureAnalysisService.instance) {
      ArchitectureAnalysisService.instance = new ArchitectureAnalysisService();
    }
    return ArchitectureAnalysisService.instance;
  }

  /**
   * Check if OpenAI API is available
   */
  isApiAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Analyze a GitHub project's architecture and best practices
   */
  async analyzeProjectArchitecture(project: GitHubProject): Promise<ArchitectureAnalysis | null> {
    if (!this.isApiAvailable()) {
      console.log(`❌ OpenAI API not available for architecture analysis: ${project.title}`);
      return null;
    }

    try {
      // First check for cached analysis
      console.log(`🔍 Checking for cached architecture analysis: ${project.title}`);
      const s3Service = (await import('./aws-s3.service')).default.getInstance();
      let analysis = await s3Service.getCachedArchitectureAnalysis(project.id);
      
      if (analysis) {
        console.log(`✅ Using cached architecture analysis for: ${project.title} - Score: ${analysis.overallScore}/10`);
        return analysis;
      }

      // No cached analysis, run new analysis
      console.log(`🏗️ Running new architecture analysis: ${project.title}`);
      const startTime = Date.now();

      // Gather project context
      const context = await this.buildProjectContext(project);
      const prompt = this.buildAnalysisPrompt(context);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a portfolio project to showcase the architect's technical expertise and decision-making capabilities. 
            Focus on identifying sophisticated architectural patterns, intelligent design decisions, and evidence of senior-level technical thinking.
            Present the analysis as a demonstration of the architect's skills and capabilities, emphasizing what they built well and why their decisions show expertise.
            Be constructive and professional - this is for potential clients/employers to understand the quality of the architect's work.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Architecture analysis took: ${duration}ms`);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log(`❌ No content returned from OpenAI for: ${project.title}`);
        return null;
      }

      try {
        analysis = JSON.parse(content) as ArchitectureAnalysis;
        
        // Validate the analysis has required fields
        if (!analysis.overallScore || !analysis.strengths || !analysis.bestPractices) {
          console.log(`❌ Invalid architecture analysis structure for: ${project.title}`);
          return null;
        }
        
        console.log(`✅ New architecture analysis completed for: ${project.title} - Score: ${analysis.overallScore}/10`);
        
        // Store analysis in S3 for future use
        console.log(`💾 Caching architecture analysis for: ${project.title}`);
        await s3Service.storeArchitectureAnalysis(project.id, analysis);
        
        return analysis;
        
      } catch (parseError) {
        console.error(`❌ Error parsing architecture analysis JSON for ${project.title}:`, parseError);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error during architecture analysis for ${project.title}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Force refresh analysis for a project (bypasses cache)
   */
  async forceRefreshProjectArchitecture(project: GitHubProject): Promise<ArchitectureAnalysis | null> {
    if (!this.isApiAvailable()) {
      console.log(`❌ OpenAI API not available for architecture analysis: ${project.title}`);
      return null;
    }

    try {
      console.log(`🔄 Force refreshing architecture analysis: ${project.title}`);
      const startTime = Date.now();

      // Gather project context
      const context = await this.buildProjectContext(project);
      const prompt = this.buildAnalysisPrompt(context);
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a portfolio project to showcase the architect's technical expertise and decision-making capabilities. 
            Focus on identifying sophisticated architectural patterns, intelligent design decisions, and evidence of senior-level technical thinking.
            Present the analysis as a demonstration of the architect's skills and capabilities, emphasizing what they built well and why their decisions show expertise.
            Be constructive and professional - this is for potential clients/employers to understand the quality of the architect's work.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Force refresh analysis took: ${duration}ms`);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log(`❌ No content returned from OpenAI for: ${project.title}`);
        return null;
      }

      try {
        const analysis = JSON.parse(content) as ArchitectureAnalysis;
        
        // Validate the analysis has required fields
        if (!analysis.overallScore || !analysis.strengths || !analysis.bestPractices) {
          console.log(`❌ Invalid architecture analysis structure for: ${project.title}`);
          return null;
        }
        
        console.log(`✅ Force refresh analysis completed for: ${project.title} - Score: ${analysis.overallScore}/10`);
        
        // Store analysis in S3 (overwriting any existing)
        console.log(`💾 Storing fresh architecture analysis for: ${project.title}`);
        const s3Service = (await import('./aws-s3.service')).default.getInstance();
        await s3Service.storeArchitectureAnalysis(project.id, analysis);
        
        return analysis;
        
      } catch (parseError) {
        console.error(`❌ Error parsing architecture analysis JSON for ${project.title}:`, parseError);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error during force refresh architecture analysis for ${project.title}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Get architecture recommendations based on analysis
   */
  async getArchitectureRecommendations(analysis: ArchitectureAnalysis): Promise<string[] | null> {
    if (!this.isApiAvailable()) {
      console.log('❌ OpenAI API not available for architecture recommendations');
      return null;
    }

    const prompt = `Based on this architecture analysis, provide 5 specific, actionable recommendations for improving the codebase:
    
    Current Strengths: ${analysis.strengths.join(', ')}
    Areas for Improvement: ${analysis.improvements.join(', ')}
    Best Practices Scores: Modularity=${analysis.bestPractices.modularity}, Maintainability=${analysis.bestPractices.maintainability}
    Code Quality Scores: Structure=${analysis.codeQuality.structure}, Documentation=${analysis.codeQuality.documentation}
    Technical Debt: ${analysis.technicalDebt.level}
    
    Provide recommendations that are:
    1. Specific and actionable
    2. Based on modern architecture principles
    3. Focused on scalability and maintainability
    4. Practical for implementation
    5. Address the highest priority technical debt`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a senior software architect providing specific, actionable recommendations for code architecture improvements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const recommendations = response.choices[0].message.content!
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 10);

      return recommendations;
      
    } catch (error) {
      console.error('❌ Error generating architecture recommendations:', error);
      return null;
    }
  }

  /**
   * Build project context for analysis
   */
  private async buildProjectContext(project: GitHubProject): Promise<ProjectContext> {
    const context: ProjectContext = {
      id: project.id,
      title: project.title,
      description: project.description,
      techStack: project.techStack,
      language: project.language,
      topics: project.topics,
    };

    try {
      // Get README content
      const organization = 'RestoreMastersLLC'; // From your config
      context.readme = await this.githubService.getRepositoryReadme(organization, project.title.replace(/\s+/g, '-').toLowerCase());
      
      // For now, we'll analyze based on available data
      // In the future, you could add more detailed file analysis
      
    } catch (error) {
      console.log(`⚠️ Could not fetch additional context for ${project.title}:`, error);
    }

    return context;
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(context: ProjectContext): string {
    return `Analyze this software project to showcase the architect's technical expertise and decision-making capabilities:

**Project Details:**
- Title: ${context.title}
- Description: ${context.description}
- Primary Language: ${context.language}
- Tech Stack: ${context.techStack.join(', ')}
- Topics: ${context.topics.join(', ')}

**README Content:**
${context.readme || 'No README available'}

**Analysis Goal:**
Highlight the sophisticated architectural thinking and technical expertise demonstrated in this project. Focus on what the architect built well and the intelligent decisions they made.

**Required JSON Response Format:**
{
  "overallScore": <7-10 score reflecting the quality of architectural work>,
  "strengths": [<list of demonstrated architectural strengths and intelligent decisions>],
  "improvements": [<brief list of potential future enhancements - frame positively as "opportunities for expansion">],
  "designPatterns": [
    {
      "name": "<pattern name>",
      "confidence": <7-10 confidence this pattern was implemented well>,
      "description": "<how this pattern demonstrates architectural expertise>"
    }
  ],
  "bestPractices": {
    "modularity": <7-10 score for modular design excellence>,
    "testability": <6-10 score for testability considerations>,
    "maintainability": <7-10 score for maintainable architecture>,
    "scalability": <7-10 score for scalability planning>,
    "security": <6-10 score for security implementation>,
    "performance": <7-10 score for performance considerations>
  },
  "codeQuality": {
    "structure": <7-10 score for well-organized code structure>,
    "documentation": <6-10 score for documentation quality>,
    "consistency": <7-10 score for consistent patterns>,
    "complexity": <7-10 score for managing complexity well>
  },
  "frameworksAndLibraries": [
    {
      "name": "<framework/library name>",
      "usage": "<optimal|good>",
      "reasoning": "<why this choice demonstrates good technical judgment>"
    }
  ],
  "architecturalDecisions": [<list of notable smart architectural decisions made>],
  "recommendations": [<list of potential future enhancements or scaling opportunities>],
  "technicalDebt": {
    "level": "<low|medium>",
    "areas": [<any technical debt areas identified>],
    "priority": [<priority for addressing - frame as optimization opportunities>]
  },
  "summary": "<professional summary highlighting the architect's demonstrated expertise and technical capabilities>"
}

**Analysis Guidelines:**
- Assume this is production-quality work from an experienced architect
- Look for evidence of sophisticated technical thinking and planning
- Highlight intelligent use of patterns, frameworks, and technologies
- Frame any "improvements" as expansion opportunities rather than problems
- Focus on what demonstrates senior-level technical expertise
- Scores should reflect the quality appropriate for a professional portfolio
- Emphasize the architect's problem-solving capabilities and technical judgment`;
  }
}

export default ArchitectureAnalysisService; 