import AWSS3Service from './aws-s3.service';
import GitHubService from './github.service';
import MeetingAnalysisService, { LeadershipAnalysis } from './meeting-analysis.service';

export interface SystemProject {
  id: string;
  title: string;
  description: string;
  role: string;
  techStack: string[];
  architectureDiagram?: string;
  videoUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  uniqueDecisions: string[];
  category: 'ai' | 'architecture' | 'leadership' | 'systems';
  stars?: number;
  forks?: number;
  lastUpdated?: string;
  topics?: string[];
  language?: string;
  createdAt?: string;
  source: 'manual' | 'github' | 'hybrid';
}

export interface LeadershipVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  type: 'architecture' | 'leadership' | 'technical' | 'mentoring';
  keyMoments: {
    timestamp: string;
    description: string;
    type: 'architecture' | 'leadership' | 'technical' | 'mentoring';
  }[];
  participants: string[];
  dateRecorded: string;
  transcript?: string;
  recap?: string;
  analysis?: LeadershipAnalysis; // Added analysis data
  source: 'manual' | 's3';
}

export interface PhilosophyContent {
  id: string;
  title: string;
  content: string;
  category: 'ai-modularity' | 'systems-design' | 'coaching' | 'product-architecture';
  publishDate: string;
  readTime: string;
}

interface SyncStatus {
  lastSync: Date;
  githubProjects: number;
  s3Meetings: number;
  errors: string[];
}

class PortfolioService {
  private static instance: PortfolioService;
  private s3Service: AWSS3Service;
  private githubService: GitHubService;
  private analysisService: MeetingAnalysisService;
  private syncStatus: SyncStatus = {
    lastSync: new Date(),
    githubProjects: 0,
    s3Meetings: 0,
    errors: []
  };
  
  // Add caching for filtered videos
  private filteredVideosCache: {
    videos: LeadershipVideo[];
    timestamp: number;
    ttl: number; // 30 minutes
  } | null = null;

  private constructor() {
    this.s3Service = AWSS3Service.getInstance();
    this.githubService = GitHubService.getInstance();
    this.analysisService = MeetingAnalysisService.getInstance();
  }

  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  /**
   * Get all system projects (merged from manual and GitHub)
   */
  async getSystemProjects(): Promise<SystemProject[]> {
    try {
      const [manualProjects, githubProjects] = await Promise.all([
        this.getManualProjects(),
        this.getGithubProjects()
      ]);

      // Merge projects, prioritizing manual entries
      const allProjects = [...manualProjects, ...githubProjects];
      
      // Remove duplicates (prefer manual over GitHub)
      const uniqueProjects = this.deduplicateProjects(allProjects);
      
      return uniqueProjects.sort((a, b) => {
        // Sort by source (manual first), then by stars/priority
        if (a.source === 'manual' && b.source !== 'manual') return -1;
        if (b.source === 'manual' && a.source !== 'manual') return 1;
        return (b.stars || 0) - (a.stars || 0);
      });
    } catch (error) {
      console.error('Error fetching system projects:', error);
      this.syncStatus.errors.push(`Error fetching projects: ${error}`);
      return this.getManualProjects(); // Fallback to manual projects
    }
  }

  /**
   * Get manual/static projects
   */
  private async getManualProjects(): Promise<SystemProject[]> {
    return [
      {
        id: 'manual-1',
        title: 'AI-Driven Modular Architecture',
        description: 'Intelligent system that adapts its architecture based on usage patterns and performance metrics.',
        role: 'Lead Systems Architect',
        techStack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'],
        uniqueDecisions: [
          'Implemented self-healing architecture patterns',
          'Created AI-driven scaling algorithms',
          'Designed modular plugin system for extensibility'
        ],
        category: 'ai',
        githubUrl: '',
        videoUrl: '',
        source: 'manual'
      },
      {
        id: 'manual-2',
        title: 'Scalable Microservices Platform',
        description: 'Enterprise-grade microservices platform with intelligent routing and auto-scaling.',
        role: 'Technical Lead & Architect',
        techStack: ['Docker', 'Kubernetes', 'Go', 'PostgreSQL', 'Redis'],
        uniqueDecisions: [
          'Implemented intelligent service mesh',
          'Created auto-scaling algorithms',
          'Designed fault-tolerant communication patterns'
        ],
        category: 'architecture',
        githubUrl: '',
        videoUrl: '',
        source: 'manual'
      },
      {
        id: 'manual-3',
        title: 'Real-time Data Processing Pipeline',
        description: 'High-throughput data pipeline with ML-driven anomaly detection and intelligent routing.',
        role: 'Principal Engineer & Architect',
        techStack: ['Apache Kafka', 'Python', 'TensorFlow', 'Elasticsearch', 'Grafana'],
        uniqueDecisions: [
          'Built stream processing with adaptive batching',
          'Implemented ML-based anomaly detection in real-time',
          'Created intelligent data partitioning strategies'
        ],
        category: 'ai',
        githubUrl: '',
        videoUrl: '',
        source: 'manual'
      }
    ];
  }

  /**
   * Get GitHub projects
   */
  private async getGithubProjects(): Promise<SystemProject[]> {
    try {
      const githubProjects = await this.githubService.getPortfolioProjects();
      
      return githubProjects.map(project => ({
        id: `github-${project.id}`,
        title: project.title,
        description: project.description,
        role: project.role,
        techStack: project.techStack,
        uniqueDecisions: project.uniqueDecisions,
        category: project.category,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        stars: project.stars,
        forks: project.forks,
        lastUpdated: project.lastUpdated,
        topics: project.topics,
        language: project.language,
        createdAt: project.createdAt,
        source: 'github' as const
      }));
    } catch (error) {
      console.error('Error fetching GitHub projects:', error);
      this.syncStatus.errors.push(`GitHub sync error: ${error}`);
      return [];
    }
  }

  /**
   * Deduplicate projects based on title similarity
   */
  private deduplicateProjects(projects: SystemProject[]): SystemProject[] {
    const seen = new Set<string>();
    const result: SystemProject[] = [];

    for (const project of projects) {
      const key = project.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(project);
      } else {
        // If we have both manual and GitHub version, merge them
        const existingIndex = result.findIndex(p => 
          p.title.toLowerCase().replace(/[^a-z0-9]/g, '') === key
        );
        
        if (existingIndex !== -1 && result[existingIndex].source === 'manual' && project.source === 'github') {
          // Merge GitHub data into manual project
          result[existingIndex] = {
            ...result[existingIndex],
            githubUrl: project.githubUrl,
            liveUrl: project.liveUrl || result[existingIndex].liveUrl,
            stars: project.stars,
            forks: project.forks,
            lastUpdated: project.lastUpdated,
            topics: project.topics,
            language: project.language,
            source: 'hybrid'
          };
        }
      }
    }

    return result;
  }

  async getSystemById(id: string): Promise<SystemProject | null> {
    const systems = await this.getSystemProjects();
    return systems.find(system => system.id === id) || null;
  }

  /**
   * Get leadership videos (merged from manual and S3)
   */
  async getLeadershipVideos(includeAnalysis: boolean = false): Promise<LeadershipVideo[]> {
    try {
      const [manualVideos, s3Videos] = await Promise.all([
        this.getManualVideos(),
        this.getS3Videos(includeAnalysis)
      ]);

      const allVideos = [...manualVideos, ...s3Videos];
      
      return allVideos.sort((a, b) => 
        new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime()
      );
    } catch (error) {
      console.error('Error fetching leadership videos:', error);
      this.syncStatus.errors.push(`Error fetching videos: ${error}`);
      return this.getManualVideos(); // Fallback to manual videos
    }
  }

  /**
   * Get manual/static videos
   */
  private async getManualVideos(): Promise<LeadershipVideo[]> {
    return [
      {
        id: 'manual-video-1',
        title: 'Architecture Review Session',
        description: 'Deep dive into modular architecture principles and team collaboration.',
        videoUrl: '', // Will be populated later
        duration: '45:30',
        type: 'architecture',
        keyMoments: [
          {
            timestamp: '5:20',
            description: 'Discussing modular design principles',
            type: 'architecture'
          },
          {
            timestamp: '15:45',
            description: 'Code review and mentoring session',
            type: 'mentoring'
          },
          {
            timestamp: '28:10',
            description: 'Strategic decision making process',
            type: 'leadership'
          }
        ],
        participants: ['Juelzs', 'Team'],
        dateRecorded: '2024-01-15',
        source: 'manual'
      }
    ];
  }

  /**
   * Get S3 videos with enhanced transcript analysis and leadership performance analysis
   */
  private async getS3Videos(includeAnalysis: boolean = false): Promise<LeadershipVideo[]> {
    try {
      const meetingGroups = await this.s3Service.getMeetingGroups();
      
      const videos: LeadershipVideo[] = [];
      
      for (const group of meetingGroups) {
        if (!group.isPortfolioRelevant) continue;
        
        // Use insights from transcript analysis if available
        const insights = group.insights;
        
        // Get recap summary for description if available
        let description = insights?.description || `${group.category?.replace('-', ' ')} with ${group.participants.join(', ')}`;
        
        // If we have a recap file, use its content as description
        if (group.recap) {
          try {
            const recapContent = await this.s3Service.getFileContent(group.recap.s3Key);
            if (recapContent && recapContent.length > 50) {
              // Extract first paragraph or first 200 characters as description
              const firstParagraph = recapContent.split('\n').find(line => line.trim().length > 20);
              if (firstParagraph) {
                description = firstParagraph.trim().substring(0, 200) + (firstParagraph.length > 200 ? '...' : '');
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not load recap for ${group.title}:`, error);
          }
        }
        
        const video: LeadershipVideo = {
          id: `s3-${group.id}`,
          title: group.title,
          description,
          videoUrl: group.video?.url || '',
          duration: insights?.duration || '0:00',
          type: this.mapCategoryToType(group.category),
          keyMoments: insights?.keyMoments?.map(moment => ({
            timestamp: moment.timestamp,
            description: moment.description,
            type: moment.type === 'decision' ? 'leadership' : moment.type as 'architecture' | 'leadership' | 'technical' | 'mentoring'
          })) || [],
          participants: group.participants,
          dateRecorded: group.dateRecorded,
          transcript: group.transcript ? 'Available' : undefined,
          recap: group.recap ? 'Available' : undefined,
          source: 's3' as const
        };

        // Only add leadership analysis if requested and transcript is available
        if (includeAnalysis && group.transcript) {
          try {
            // First check for cached analysis
            console.log(`🔍 Checking for cached analysis: ${group.title}`);
            let analysis = await this.s3Service.getCachedAnalysis(group.id);
            
            if (analysis) {
              console.log(`✅ Using cached analysis for: ${group.title} - Rating: ${analysis.overallRating}/10`);
              video.analysis = analysis;
            } else {
              // No cached analysis, run new analysis
              const transcriptContent = await this.s3Service.getFileContent(group.transcript.s3Key);
              
              if (transcriptContent && transcriptContent.length > 100) {
                console.log(`🔍 Running new AI analysis for: ${group.title}`);
                
                // Perform analysis without timeout to ensure completion
                analysis = await this.analysisService.analyzeMeetingLeadership({
                  id: group.id,
                  title: group.title,
                  transcript: transcriptContent,
                  participants: group.participants,
                  duration: insights?.duration || '0:00',
                  type: this.mapCategoryToType(group.category),
                  dateRecorded: group.dateRecorded
                });
                
                if (analysis) {
                  video.analysis = analysis;
                  console.log(`✅ New analysis completed for: ${group.title} - Overall Rating: ${analysis.overallRating}/10`);
                  
                  // Store analysis in S3 for future use
                  console.log(`💾 Caching analysis for: ${group.title}`);
                  await this.s3Service.storeAnalysisResult(group.id, analysis);
                } else {
                  console.log(`⚠️ Analysis returned null for: ${group.title} - OpenAI may be unavailable`);
                }
              }
            }
          } catch (error) {
            console.error(`❌ Error analyzing leadership for ${group.title}:`, error instanceof Error ? error.message : 'Unknown error');
            // Continue without analysis
          }
        }

        videos.push(video);
      }
      
      return videos;
    } catch (error) {
      console.error('Error fetching S3 videos:', error);
      this.syncStatus.errors.push(`S3 sync error: ${error}`);
      return [];
    }
  }

  async getLeadershipVideoById(id: string): Promise<LeadershipVideo | null> {
    // For individual video pages, include analysis
    const videos = await this.getLeadershipVideos(true);
    return videos.find(video => video.id === id) || null;
  }

  /**
   * Get video transcript content
   */
  async getVideoTranscript(id: string): Promise<string> {
    if (id.startsWith('s3-')) {
      const groupId = id.replace('s3-', '');
      const group = await this.s3Service.getMeetingGroupById(groupId);
      
      if (group?.transcript) {
        return await this.s3Service.getFileContent(group.transcript.s3Key);
      }
    }
    
    return '';
  }

  /**
   * Get video recap content
   */
  async getVideoRecap(id: string): Promise<string> {
    if (id.startsWith('s3-')) {
      const groupId = id.replace('s3-', '');
      const group = await this.s3Service.getMeetingGroupById(groupId);
      
      if (group?.recap) {
        return await this.s3Service.getFileContent(group.recap.s3Key);
      }
    }
    
    return '';
  }

  /**
   * Philosophy content (keeping original implementation)
   */
  async getPhilosophyContent(): Promise<PhilosophyContent[]> {
    return [
      {
        id: '1',
        title: 'AI Modularity: Building Intelligence That Scales',
        content: `
# AI Modularity: Building Intelligence That Scales

## The Foundation of Intelligent Systems

In my years of building systems, I've learned that the most powerful architectures are those that can adapt, learn, and evolve. This isn't just about writing clean code—it's about creating systems that think.

## Core Principles

### 1. Modular Intelligence
Every AI component should be self-contained yet interconnected. Think of it like building with intelligent LEGO blocks—each piece has its own purpose but can combine to create something greater.

### 2. Systems-First Design
Before writing a single line of code, I design the system architecture. This means understanding data flows, identifying bottlenecks, and planning for scale from day one.

### 3. Progressive Enhancement
Start with a solid foundation and build up. Each layer should enhance the previous one without breaking existing functionality.

## Building Teams That Build Systems

The best architectures come from teams that understand the big picture. I believe in:

- **Collaborative Architecture**: Every team member should understand the system's core principles
- **Continuous Learning**: Systems evolve, and so should the team
- **Documentation as Communication**: Architecture decisions should be clear and accessible

## The Future of Modular AI

We're moving toward a world where systems can reconfigure themselves based on demand. This requires:

1. **Intelligent Monitoring**: Systems that understand their own performance
2. **Adaptive Scaling**: Components that can grow or shrink based on need
3. **Self-Healing Architecture**: Systems that can recover from failures automatically

This is the future I'm building toward—systems that don't just run, but think.
        `,
        category: 'ai-modularity',
        publishDate: '2024-01-01',
        readTime: '8 min read'
      },
      {
        id: '2',
        title: 'Coaching Developers to Think in Systems',
        content: `
# Coaching Developers to Think in Systems

## Beyond Code: Building Architectural Thinkers

The best developers I've worked with don't just write code—they understand how their code fits into the bigger picture. My approach to coaching focuses on developing this systems mindset.

## The Coaching Framework

### 1. Start with Context
Before diving into implementation, I help developers understand:
- What problem are we solving?
- Who are we solving it for?
- How does this fit into the larger system?

### 2. Design Before Code
We spend time on architecture diagrams, data flow discussions, and interface design before writing any implementation code.

### 3. Iterative Feedback
Regular code reviews that focus not just on syntax, but on architectural decisions and system implications.

## Building Confidence Through Understanding

The goal isn't just to complete tickets—it's to build developers who can:
- Make informed architectural decisions
- Understand the ripple effects of their changes
- Communicate technical concepts clearly
- Scale their thinking with the system

## Real-World Application

In my sessions with developers, we don't just review code. We discuss:
- Why certain patterns were chosen
- How to handle edge cases
- What happens when the system scales
- How to maintain modularity as complexity grows

This approach creates developers who become architectural partners, not just implementers.
        `,
        category: 'coaching',
        publishDate: '2024-01-15',
        readTime: '6 min read'
      }
    ];
  }

  async getPhilosophyById(id: string): Promise<PhilosophyContent | null> {
    const content = await this.getPhilosophyContent();
    return content.find(item => item.id === id) || null;
  }

  /**
   * Get leadership analysis for a specific video
   */
  async getVideoAnalysis(id: string): Promise<LeadershipAnalysis | null> {
    const video = await this.getLeadershipVideoById(id);
    return video?.analysis || null;
  }

  /**
   * Get leadership trends across all analyzed videos
   */
  async getLeadershipTrends(): Promise<{
    overallTrends: {
      strengths: string[];
      growthAreas: string[];
      patterns: string[];
    };
    individualAnalyses: LeadershipAnalysis[];
    recommendations: string[];
  } | null> {
    try {
      // For trends analysis, we need the full analysis data
      const videos = await this.getLeadershipVideos(true);
      const videosWithAnalysis = videos.filter(v => v.analysis);
      
      if (videosWithAnalysis.length === 0) {
        return null;
      }

             const analyses = videosWithAnalysis.map(v => v.analysis!);
      
      return {
        overallTrends: {
          strengths: this.extractCommonStrengths(analyses),
          growthAreas: this.extractCommonGrowthAreas(analyses),
          patterns: this.identifyPatterns(analyses)
        },
        individualAnalyses: analyses,
        recommendations: this.generateTrendRecommendations(analyses)
      };
    } catch (error) {
      console.error('Error analyzing leadership trends:', error);
      return null;
    }
  }

  /**
   * Clear the filtered videos cache
   */
  clearFilteredVideosCache(): void {
    console.log('🧹 Clearing filtered videos cache');
    this.filteredVideosCache = null;
  }

  /**
   * Force re-analysis of a specific video (bypasses cache)
   */
  async reanalyzeVideo(id: string): Promise<LeadershipAnalysis | null> {
    if (!id.startsWith('s3-')) {
      return null;
    }

    const groupId = id.replace('s3-', '');
    const group = await this.s3Service.getMeetingGroupById(groupId);
    
    if (!group?.transcript) {
      return null;
    }

    try {
      console.log(`🔄 Force re-analyzing: ${group.title}`);
      const transcriptContent = await this.s3Service.getFileContent(group.transcript.s3Key);
      
      const analysis = await this.analysisService.analyzeMeetingLeadership({
        id: group.id,
        title: group.title,
        transcript: transcriptContent,
        participants: group.participants,
        duration: group.insights?.duration || '0:00',
        type: this.mapCategoryToType(group.category),
        dateRecorded: group.dateRecorded
      });

      // Store new analysis result to update cache
      if (analysis) {
        console.log(`💾 Updating cached analysis for: ${group.title}`);
        await this.s3Service.storeAnalysisResult(group.id, analysis);
        
        // Clear filtered videos cache since analysis may have changed ratings
        this.clearFilteredVideosCache();
      }

      return analysis;
    } catch (error) {
      console.error('Error re-analyzing video:', error);
      return null;
    }
  }

  // Helper methods for analysis
  private mapCategoryToType(category?: string): 'architecture' | 'leadership' | 'mentoring' | 'technical' {
    switch (category) {
      case 'architecture-review':
        return 'architecture';
      case 'leadership-moment':
        return 'leadership';
      case 'mentoring-session':
        return 'mentoring';
      case 'technical-discussion':
        return 'technical';
      default:
        return 'technical';
    }
  }

  private inferVideoType(video: LeadershipVideo): 'architecture' | 'leadership' | 'mentoring' | 'technical' {
    // Analyze key moments to determine primary type
    const typeCounts = video.keyMoments.reduce((acc, moment) => {
      acc[moment.type] = (acc[moment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0];
    return primaryType as 'architecture' | 'leadership' | 'mentoring' | 'technical' || 'technical';
  }

  private extractCommonStrengths(analyses: LeadershipAnalysis[]): string[] {
    const strengthCounts = analyses.reduce((acc, analysis) => {
      analysis.strengths.forEach(strength => {
        acc[strength] = (acc[strength] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(strengthCounts)
      .filter(([, count]) => count >= Math.max(2, analyses.length * 0.5))
      .sort(([,a], [,b]) => b - a)
      .map(([strength]) => strength)
      .slice(0, 5);
  }

  private extractCommonGrowthAreas(analyses: LeadershipAnalysis[]): string[] {
    const growthCounts = analyses.reduce((acc, analysis) => {
      analysis.areasForImprovement.forEach(area => {
        acc[area] = (acc[area] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(growthCounts)
      .filter(([, count]) => count >= Math.max(2, analyses.length * 0.3))
      .sort(([,a], [,b]) => b - a)
      .map(([area]) => area)
      .slice(0, 5);
  }

  private identifyPatterns(analyses: LeadershipAnalysis[]): string[] {
    const patterns = [];
    
    // Check for consistent high technical scores
    const avgTechnical = analyses.reduce((sum, a) => sum + a.leadershipQualities.technicalGuidance, 0) / analyses.length;
    if (avgTechnical >= 8) {
      patterns.push('Consistently strong technical leadership');
    }

    // Check for communication trends
    const avgClarity = analyses.reduce((sum, a) => sum + a.communicationStyle.clarity, 0) / analyses.length;
    if (avgClarity >= 8) {
      patterns.push('Clear and effective communication');
    }

    // Check for growth in team building
    const teamScores = analyses.map(a => a.leadershipQualities.teamBuilding);
    if (teamScores.length >= 3) {
      const trend = teamScores.slice(-3).reduce((sum, score, idx) => sum + score * (idx + 1), 0) / 6;
      if (trend > teamScores[0]) {
        patterns.push('Growing team building capabilities');
      }
    }

    return patterns;
  }

  private generateTrendRecommendations(analyses: LeadershipAnalysis[]): string[] {
    const recommendations = [];
    
    // Check average scores for recommendations
    const avgEngagement = analyses.reduce((sum, a) => sum + a.communicationStyle.engagement, 0) / analyses.length;
    if (avgEngagement < 7) {
      recommendations.push('Focus on increasing team engagement through more interactive discussions');
    }

    const avgTeamBuilding = analyses.reduce((sum, a) => sum + a.leadershipQualities.teamBuilding, 0) / analyses.length;
    if (avgTeamBuilding < 7) {
      recommendations.push('Develop stronger team building and collaborative leadership skills');
    }

    const avgEmpathy = analyses.reduce((sum, a) => sum + a.communicationStyle.empathy, 0) / analyses.length;
    if (avgEmpathy < 7) {
      recommendations.push('Practice active listening and empathetic communication');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Sync data from external sources
   */
  async syncExternalData(): Promise<SyncStatus> {
    const syncStart = new Date();
    const errors: string[] = [];

    try {
      // Sync GitHub projects
      const githubProjects = await this.githubService.getPortfolioProjects();
      
      // Sync S3 meetings
      const s3Meetings = await this.s3Service.getMeetingGroups();

      this.syncStatus = {
        lastSync: syncStart,
        githubProjects: githubProjects.length,
        s3Meetings: s3Meetings.length,
        errors
      };

      console.log(`Sync completed: ${githubProjects.length} GitHub projects, ${s3Meetings.length} S3 meetings`);
    } catch (error) {
      errors.push(`Sync error: ${error}`);
      console.error('Sync failed:', error);
    }

    return this.syncStatus;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Utility methods
   */
  async getFeatureProjects(): Promise<SystemProject[]> {
    const projects = await this.getSystemProjects();
    return projects.slice(0, 6); // Return top 6 featured projects
  }

  /**
   * Get latest leadership videos for home page (without analysis for fast loading)
   */
  async getLatestLeadershipVideos(): Promise<LeadershipVideo[]> {
    console.log('🏠 Loading latest videos for home page (without analysis for fast loading)');
    const videos = await this.getLeadershipVideos(false); // No analysis for home page
    return videos.slice(0, 4); // Return latest 4 videos
  }

  /**
   * Get leadership videos with full analysis (for leadership page)
   */
  async getLeadershipVideosWithAnalysis(): Promise<LeadershipVideo[]> {
    console.log('📊 Loading videos with full analysis');
    
    // Check cache first
    const now = Date.now();
    if (this.filteredVideosCache && 
        (now - this.filteredVideosCache.timestamp) < (30 * 60 * 1000)) { // 30 minutes TTL
      console.log('🎯 Using cached filtered videos');
      return this.filteredVideosCache.videos;
    }
    
    console.log('🔄 Cache miss or expired, fetching fresh video data');
    const videos = await this.getLeadershipVideos(true); // Include analysis
    
    // Lower threshold from 7 to 5 to show more videos (user reported missing videos)
    const ratingThreshold = 5;
    
    // Filter to only show videos with analysis ratings >= threshold
    const filteredVideos = videos.filter(video => {
      if (!video.analysis) {
        console.log(`🚫 Filtering out video "${video.title}" - no analysis available`);
        return false; // Exclude videos without analysis
      }
      
      const rating = video.analysis.overallRating;
      const shouldShowVideo = rating >= ratingThreshold;
      
      if (!shouldShowVideo) {
        console.log(`🚫 Filtering out video "${video.title}" with rating ${rating}/10 (below ${ratingThreshold}/10 threshold)`);
      } else {
        console.log(`✅ Including video "${video.title}" with rating ${rating}/10`);
      }
      
      return shouldShowVideo;
    });
    
    // Cache the filtered results
    this.filteredVideosCache = {
      videos: filteredVideos,
      timestamp: now,
      ttl: 30 * 60 * 1000 // 30 minutes
    };
    
    console.log(`✅ Showing ${filteredVideos.length} videos with ratings >= ${ratingThreshold}/10 (filtered from ${videos.length} total)`);
    console.log(`💾 Cached filtered results for 30 minutes`);
    
    return filteredVideos;
  }

  /**
   * Get GitHub language statistics
   */
  async getLanguageStats() {
    try {
      return await this.githubService.getOverallLanguageStats();
    } catch (error) {
      console.error('Error fetching language stats:', error);
      return {};
    }
  }

  /**
   * Get meeting categories with counts
   */
  async getMeetingCategories() {
    try {
      return await this.s3Service.getMeetingCategories();
    } catch (error) {
      console.error('Error fetching meeting categories:', error);
      return [];
    }
  }

  /**
   * Get meetings by category
   */
  async getMeetingsByCategory(category: string) {
    try {
      return await this.s3Service.getMeetingsByCategory(category);
    } catch (error) {
      console.error('Error fetching meetings by category:', error);
      return [];
    }
  }
}

export default PortfolioService; 