import { GitHubProject } from './github.service';
import { LeadershipVideo } from './portfolio.service';
import { ProjectVideoLink } from './project-linking.service';

export interface VideoProjectSuggestion {
  videoId: string;
  projectId: string;
  videoTitle: string;
  projectTitle: string;
  relevanceScore: number; // 1-10
  linkType: ProjectVideoLink['linkType'];
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface SuggestionFilters {
  minRelevanceScore?: number;
  projectCategories?: string[];
  videoTypes?: string[];
  excludeExistingLinks?: boolean;
}

class VideoProjectSuggestionService {
  private static instance: VideoProjectSuggestionService;

  private constructor() {}

  static getInstance(): VideoProjectSuggestionService {
    if (!VideoProjectSuggestionService.instance) {
      VideoProjectSuggestionService.instance = new VideoProjectSuggestionService();
    }
    return VideoProjectSuggestionService.instance;
  }

  /**
   * Generate video-project link suggestions
   */
  async generateSuggestions(
    videos: LeadershipVideo[],
    projects: GitHubProject[],
    existingLinks: ProjectVideoLink[] = [],
    filters: SuggestionFilters = {}
  ): Promise<VideoProjectSuggestion[]> {
    const suggestions: VideoProjectSuggestion[] = [];
    
    // Filter videos and projects based on criteria
    const filteredVideos = this.filterVideos(videos, filters);
    const filteredProjects = this.filterProjects(projects, filters);
    
    console.log(`🔍 Analyzing ${filteredVideos.length} videos against ${filteredProjects.length} projects...`);

    for (const video of filteredVideos) {
      for (const project of filteredProjects) {
        // Skip if already linked
        if (filters.excludeExistingLinks && this.isAlreadyLinked(video.id, project.id, existingLinks)) {
          continue;
        }

        const suggestion = this.analyzePair(video, project);
        
        // Only include suggestions above minimum relevance score
        if (suggestion.relevanceScore >= (filters.minRelevanceScore || 5)) {
          suggestions.push(suggestion);
        }
      }
    }

    // Sort by relevance score (highest first) and limit to reasonable number
    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50); // Limit to top 50 suggestions
  }

  /**
   * Get suggestions for a specific video
   */
  async getSuggestionsForVideo(
    video: LeadershipVideo,
    projects: GitHubProject[],
    existingLinks: ProjectVideoLink[] = []
  ): Promise<VideoProjectSuggestion[]> {
    return this.generateSuggestions([video], projects, existingLinks, {
      excludeExistingLinks: true,
      minRelevanceScore: 4
    });
  }

  /**
   * Get suggestions for a specific project
   */
  async getSuggestionsForProject(
    project: GitHubProject,
    videos: LeadershipVideo[],
    existingLinks: ProjectVideoLink[] = []
  ): Promise<VideoProjectSuggestion[]> {
    return this.generateSuggestions(videos, [project], existingLinks, {
      excludeExistingLinks: true,
      minRelevanceScore: 4
    });
  }

  /**
   * Analyze a video-project pair for compatibility
   */
  private analyzePair(video: LeadershipVideo, project: GitHubProject): VideoProjectSuggestion {
    let score = 0;
    const reasons: string[] = [];

    // 1. Technology Stack Matching (30% weight)
    const techScore = this.analyzeTechStackMatch(video, project);
    if (techScore > 0) {
      score += techScore * 3;
      if (techScore >= 3) {
        reasons.push(`Strong tech stack alignment (${techScore}/10)`);
      } else {
        reasons.push(`Some tech stack overlap (${techScore}/10)`);
      }
    }

    // 2. Topic/Category Alignment (25% weight)
    const topicScore = this.analyzeTopicAlignment(video, project);
    if (topicScore > 0) {
      score += topicScore * 2.5;
      if (topicScore >= 3) {
        reasons.push(`High topic relevance (${topicScore}/10)`);
      } else {
        reasons.push(`Related topics (${topicScore}/10)`);
      }
    }

    // 3. Description/Content Keywords (20% weight)
    const keywordScore = this.analyzeKeywordMatch(video, project);
    if (keywordScore > 0) {
      score += keywordScore * 2;
      if (keywordScore >= 3) {
        reasons.push(`Strong content keywords match (${keywordScore}/10)`);
      } else {
        reasons.push(`Some content similarity (${keywordScore}/10)`);
      }
    }

    // 4. Project Architecture Complexity (15% weight)
    const complexityScore = this.analyzeComplexityMatch(video, project);
    if (complexityScore > 0) {
      score += complexityScore * 1.5;
      reasons.push(`Architecture complexity match (${complexityScore}/10)`);
    }

    // 5. Video Type Appropriateness (10% weight)
    const typeScore = this.analyzeVideoTypeRelevance(video, project);
    score += typeScore * 1;
    if (typeScore >= 5) {
      reasons.push(`Appropriate video type for project`);
    }

    // Normalize score to 1-10 range
    const finalScore = Math.min(10, Math.max(1, Math.round(score)));

    // Determine link type based on video type and content
    const linkType = this.determineLinkType(video, project, finalScore);

    // Determine confidence level
    const confidence = this.determineConfidence(finalScore, reasons.length);

    return {
      videoId: video.id,
      projectId: project.id,
      videoTitle: video.title,
      projectTitle: project.title,
      relevanceScore: finalScore,
      linkType,
      reasons,
      confidence
    };
  }

  /**
   * Analyze technology stack matching between video and project
   */
  private analyzeTechStackMatch(video: LeadershipVideo, project: GitHubProject): number {
    let score = 0;
    
    // Extract tech keywords from video content
    const videoTechKeywords = this.extractTechKeywords(
      `${video.title} ${video.description} ${video.keyMoments?.map(m => m.description).join(' ') || ''}`
    );

    // Check direct matches with project tech stack
    for (const tech of project.techStack) {
      if (videoTechKeywords.some(keyword => 
        keyword.toLowerCase().includes(tech.toLowerCase()) || 
        tech.toLowerCase().includes(keyword.toLowerCase())
      )) {
        score += 2;
      }
    }

    // Check language match
    if (project.language && videoTechKeywords.some(keyword =>
      keyword.toLowerCase() === project.language.toLowerCase()
    )) {
      score += 3;
    }

    return Math.min(10, score);
  }

  /**
   * Analyze topic and category alignment
   */
  private analyzeTopicAlignment(video: LeadershipVideo, project: GitHubProject): number {
    let score = 0;

    // Video type to project category mapping
    const typeMapping: Record<string, string[]> = {
      'architecture': ['architecture', 'systems'],
      'technical': ['ai', 'systems', 'architecture'],
      'leadership': ['leadership', 'systems'],
      'mentoring': ['leadership', 'systems']
    };

    const relevantCategories = typeMapping[video.type] || [];
    if (relevantCategories.includes(project.category)) {
      score += 5;
    }

    // Check project topics alignment
    if (project.topics) {
      const videoKeywords = this.extractKeywords(video.title + ' ' + video.description);
      for (const topic of project.topics) {
        if (videoKeywords.some(keyword => 
          keyword.toLowerCase().includes(topic.toLowerCase()) ||
          topic.toLowerCase().includes(keyword.toLowerCase())
        )) {
          score += 1;
        }
      }
    }

    return Math.min(10, score);
  }

  /**
   * Analyze keyword matching between video and project content
   */
  private analyzeKeywordMatch(video: LeadershipVideo, project: GitHubProject): number {
    const videoText = `${video.title} ${video.description}`.toLowerCase();
    const projectText = `${project.title} ${project.description}`.toLowerCase();

    // Key architecture and development terms
    const importantKeywords = [
      'scalable', 'microservices', 'api', 'database', 'performance',
      'architecture', 'design', 'system', 'implementation', 'optimization',
      'security', 'deployment', 'integration', 'testing', 'monitoring'
    ];

    let score = 0;
    let matches = 0;

    for (const keyword of importantKeywords) {
      if (videoText.includes(keyword) && projectText.includes(keyword)) {
        score += 2;
        matches++;
      }
    }

    // Bonus for multiple matches
    if (matches >= 3) score += 2;

    return Math.min(10, score);
  }

  /**
   * Analyze if video complexity matches project complexity
   */
  private analyzeComplexityMatch(video: LeadershipVideo, project: GitHubProject): number {
    const projectComplexity = this.assessProjectComplexity(project);
    const videoComplexity = this.assessVideoComplexity(video);

    // Perfect match gets highest score
    if (Math.abs(projectComplexity - videoComplexity) <= 1) {
      return 8;
    }
    // Close match gets good score
    if (Math.abs(projectComplexity - videoComplexity) <= 2) {
      return 5;
    }
    // Distant match gets lower score
    return 2;
  }

  /**
   * Analyze how appropriate the video type is for the project
   */
  private analyzeVideoTypeRelevance(video: LeadershipVideo, project: GitHubProject): number {
    // Architecture videos are good for architecture/systems projects
    if (video.type === 'architecture' && ['architecture', 'systems'].includes(project.category)) {
      return 8;
    }
    
    // Technical videos are good for technical projects
    if (video.type === 'technical' && ['ai', 'systems', 'architecture'].includes(project.category)) {
      return 7;
    }

    // Leadership videos can be relevant for any project type
    if (video.type === 'leadership') {
      return 5;
    }

    // Mentoring videos are moderately relevant
    if (video.type === 'mentoring') {
      return 4;
    }

    return 3;
  }

  /**
   * Determine appropriate link type based on analysis
   */
  private determineLinkType(
    video: LeadershipVideo, 
    project: GitHubProject, 
    score: number
  ): ProjectVideoLink['linkType'] {
    if (video.type === 'architecture' || video.title.toLowerCase().includes('architecture')) {
      return 'architecture-review';
    }
    
    if (video.type === 'technical' || score >= 8) {
      return 'technical-discussion';
    }

    if (video.type === 'mentoring') {
      return 'mentoring-session';
    }

    return 'planning';
  }

  /**
   * Determine confidence level based on score and evidence
   */
  private determineConfidence(score: number, reasonCount: number): 'high' | 'medium' | 'low' {
    if (score >= 8 && reasonCount >= 3) return 'high';
    if (score >= 6 && reasonCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Helper methods
   */
  private filterVideos(videos: LeadershipVideo[], filters: SuggestionFilters): LeadershipVideo[] {
    return videos.filter(video => {
      if (filters.videoTypes && !filters.videoTypes.includes(video.type)) {
        return false;
      }
      return true;
    });
  }

  private filterProjects(projects: GitHubProject[], filters: SuggestionFilters): GitHubProject[] {
    return projects.filter(project => {
      if (filters.projectCategories && !filters.projectCategories.includes(project.category)) {
        return false;
      }
      return true;
    });
  }

  private isAlreadyLinked(videoId: string, projectId: string, existingLinks: ProjectVideoLink[]): boolean {
    return existingLinks.some(link => 
      link.videoId === videoId && link.projectId === projectId
    );
  }

  private extractTechKeywords(text: string): string[] {
    const techTerms = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'react', 'vue', 'angular',
      'node', 'express', 'fastapi', 'django', 'flask', 'docker', 'kubernetes', 'aws', 'azure',
      'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'kafka', 'microservices',
      'api', 'rest', 'graphql', 'websocket', 'grpc'
    ];

    return techTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
  }

  private assessProjectComplexity(project: GitHubProject): number {
    let complexity = 5; // Base complexity

    // Tech stack size indicates complexity
    complexity += Math.min(3, project.techStack.length);

    // Stars indicate popularity/complexity
    if (project.stars > 10) complexity += 1;
    if (project.stars > 50) complexity += 1;

    // Recent activity indicates ongoing complexity
    const lastUpdate = new Date(project.lastUpdated);
    const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld < 1) complexity += 1;

    return Math.min(10, complexity);
  }

  private assessVideoComplexity(video: LeadershipVideo): number {
    let complexity = 5; // Base complexity

    // Architecture videos tend to be more complex
    if (video.type === 'architecture') complexity += 2;
    if (video.type === 'technical') complexity += 1;

    // More key moments might indicate complexity
    if (video.keyMoments && video.keyMoments.length > 3) complexity += 1;

    // Multiple participants might indicate complex discussions
    if (video.participants && video.participants.length > 2) complexity += 1;

    return Math.min(10, complexity);
  }
}

export default VideoProjectSuggestionService; 