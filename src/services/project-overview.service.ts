import OpenAI from 'openai';
import GitHubService from './github.service';

export interface ProjectOverview {
  projectId: string;
  systemPurpose: string;
  whatItDoes: string;
  keyFeatures: string[];
  useCase: string;
  targetUsers: string;
  businessValue: string;
  technicalHighlights: string[];
  score: number;
  timestamp: string;
}

class ProjectOverviewService {
  private static instance: ProjectOverviewService;
  private openai: OpenAI;
  private githubService: GitHubService;
  private overviewCache: Map<string, ProjectOverview> = new Map();

  private constructor() {
    console.log('🔍 ProjectOverviewService constructor called');
    
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🔑 API Key present:', !!apiKey);
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for project overview analysis');
    }
    
    console.log('✅ OPENAI_API_KEY found, initializing OpenAI client...');
    this.openai = new OpenAI({ apiKey });
    this.githubService = GitHubService.getInstance();
  }

  public static getInstance(): ProjectOverviewService {
    if (!ProjectOverviewService.instance) {
      ProjectOverviewService.instance = new ProjectOverviewService();
    }
    return ProjectOverviewService.instance;
  }

  /**
   * Generate comprehensive project overview by analyzing code and README
   */
  async analyzeProjectOverview(project: { id: string; name?: string; title: string; description?: string; language?: string; techStack?: string[]; githubUrl?: string; source?: string }): Promise<ProjectOverview | null> {
    try {
      const projectId = project.id || project.name || project.title;
      console.log('🔍 Checking for cached project overview:', project.title);

      // Check cache first
      const cached = this.overviewCache.get(projectId);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('✅ Retrieved cached project overview for:', projectId);
        console.log('📊 Using cached overview for:', project.title, '- Purpose:', cached.systemPurpose.substring(0, 50) + '...');
        return cached;
      }

      console.log('📄 No cached project overview found for:', projectId);
      console.log('🔍 Running new project overview analysis:', project.title);

      const startTime = Date.now();

      // Gather project data
      const projectData = await this.gatherProjectData(project);
      
      // Generate overview using AI
      const overview = await this.generateOverviewWithAI(project, projectData);
      
      const analysisTime = Date.now() - startTime;
      console.log(`⏱️ Project overview analysis took: ${analysisTime}ms`);
      console.log(`✅ New project overview completed for: ${project.title} - Purpose: ${overview.systemPurpose.substring(0, 50)}...`);

      // Cache the result
      console.log('💾 Caching project overview for:', project.title);
      this.overviewCache.set(projectId, overview);

      return overview;

    } catch (error) {
      console.error('❌ Error analyzing project overview:', error);
      return null;
    }
  }

  /**
   * Gather comprehensive project data for analysis
   */
  private async gatherProjectData(project: { title: string; description?: string; language?: string; techStack?: string[]; githubUrl?: string; source?: string }): Promise<string> {
    try {
      const data: string[] = [];

      // Add basic project info
      data.push(`Project: ${project.title}`);
      data.push(`Description: ${project.description || 'No description'}`);
      data.push(`Language: ${project.language || 'Unknown'}`);
      data.push(`Tech Stack: ${project.techStack?.join(', ') || 'Unknown'}`);
      data.push('');

      // Try to get README content
      if (project.githubUrl && project.source === 'github') {
        try {
          const repoPath = project.githubUrl.split('/').slice(-2).join('/');
          const [owner, repo] = repoPath.split('/');
          
          if (owner && repo) {
            const readme = await this.githubService.getRepositoryReadme(owner, repo);
            if (readme) {
              data.push('README Content:');
              data.push(readme.substring(0, 3000)); // Limit to avoid token limits
              data.push('');
            }
          }
        } catch {
          console.log('📝 Could not fetch README for:', project.title);
        }
      }

      return data.join('\n');

    } catch {
      console.error('Error gathering project data for:', project.title);
      return `Project: ${project.title}\nDescription: ${project.description || 'No description available'}`;
    }
  }

  /**
   * Generate project overview using AI analysis
   */
  private async generateOverviewWithAI(project: { id: string; name?: string; title: string; description?: string; language?: string; techStack?: string[]; githubUrl?: string; source?: string }, projectData: string): Promise<ProjectOverview> {
    const prompt = `
Analyze this software project and provide a comprehensive overview that explains what the system is and what it does.

Project Data:
${projectData}

Based on the project information, README content, and structure, provide a detailed analysis in this exact JSON format:

{
  "systemPurpose": "Clear, concise explanation of what this system is designed to do",
  "whatItDoes": "Detailed description of the system's functionality and capabilities",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "useCase": "Primary use case and scenarios where this system would be used",
  "targetUsers": "Who would use this system (developers, businesses, end users, etc.)",
  "businessValue": "The business value and impact this system provides",
  "technicalHighlights": ["Technical strength 1", "Technical strength 2", "Technical strength 3"],
  "score": 8
}

Important guidelines:
- Focus on WHAT the system does, not HOW it's built
- Explain the purpose and value from a user/business perspective
- Make it accessible to both technical and non-technical audiences
- If information is limited, make reasonable inferences based on project name, tech stack, and any available details
- Score should be 1-10 based on project complexity, utility, and apparent quality
- Be specific about features and benefits rather than generic descriptions
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert software analyst who specializes in understanding and explaining software systems. You analyze projects to understand their purpose, functionality, and business value. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      try {
        const analysis = JSON.parse(responseText);
        
        return {
          projectId: project.id || project.name || project.title,
          systemPurpose: analysis.systemPurpose || 'System purpose analysis not available',
          whatItDoes: analysis.whatItDoes || 'Functionality analysis not available',
          keyFeatures: Array.isArray(analysis.keyFeatures) ? analysis.keyFeatures : [],
          useCase: analysis.useCase || 'Use case analysis not available',
          targetUsers: analysis.targetUsers || 'Target user analysis not available',
          businessValue: analysis.businessValue || 'Business value analysis not available',
          technicalHighlights: Array.isArray(analysis.technicalHighlights) ? analysis.technicalHighlights : [],
          score: typeof analysis.score === 'number' ? analysis.score : 5,
          timestamp: new Date().toISOString()
        };

      } catch {
        console.error('Failed to parse overview analysis response:', responseText);
        throw new Error('Invalid JSON response from OpenAI');
      }

    } catch (error) {
      console.error('Error generating project overview with AI:', error);
      
      // Return fallback overview
      return {
        projectId: project.id || project.name || project.title,
        systemPurpose: `${project.title} is a software system built with ${project.language || 'modern technologies'}.`,
        whatItDoes: project.description || 'This system provides functionality to support business operations and user needs.',
        keyFeatures: project.techStack ? project.techStack.slice(0, 4) : ['Modern Architecture', 'Scalable Design'],
        useCase: 'This system addresses specific business needs and provides value to its users.',
        targetUsers: 'Businesses and users who need reliable software solutions',
        businessValue: 'Provides efficiency improvements and streamlined operations',
        technicalHighlights: ['Modern Tech Stack', 'Clean Architecture', 'Scalable Design'],
        score: 6,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if a filename indicates a key project file
   */
  private isKeyFile(filename: string): boolean {
    const keyFiles = [
      'package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml',
      'README.md', 'README.txt', '.env.example', 'tsconfig.json',
      'main.py', 'app.py', 'index.js', 'index.ts', 'server.js', 'server.ts'
    ];
    return keyFiles.some(key => filename.toLowerCase().includes(key.toLowerCase()));
  }

  /**
   * Check if a directory name indicates a key project directory
   */
  private isKeyDirectory(dirname: string): boolean {
    const keyDirs = ['src', 'app', 'lib', 'components', 'services', 'pages', 'api', 'config', 'utils'];
    return keyDirs.includes(dirname.toLowerCase());
  }

  /**
   * Check if cached analysis is still valid (24 hours)
   */
  private isCacheValid(timestamp: string): boolean {
    const age = Date.now() - new Date(timestamp).getTime();
    return age < 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.overviewCache.clear();
    console.log('🧹 Project overview cache cleared');
  }

  /**
   * Get cached overview if available
   */
  getCachedOverview(projectId: string): ProjectOverview | null {
    const cached = this.overviewCache.get(projectId);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached;
    }
    return null;
  }
}

export default ProjectOverviewService; 