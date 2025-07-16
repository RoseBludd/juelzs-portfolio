import { Octokit } from '@octokit/rest';
import { format } from 'date-fns';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  languages_url: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  size: number;
  archived: boolean;
  disabled: boolean;
  private: boolean;
}

export interface GitHubProject {
  id: string;
  title: string;
  description: string;
  role: string;
  techStack: string[];
  githubUrl: string;
  liveUrl?: string;
  uniqueDecisions: string[];
  category: 'ai' | 'architecture' | 'leadership' | 'systems';
  stars: number;
  forks: number;
  lastUpdated: string;
  topics: string[];
  language: string;
  createdAt: string;
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

class GitHubService {
  private static instance: GitHubService;
  private octokit: Octokit;
  private username: string;
  private organization: string;

  private constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.username = process.env.GITHUB_USERNAME || 'RoseBludd';
    this.organization = process.env.GITHUB_ORGANIZATION || process.env['GITHUB-ORGANIZATION'] || 'RestoreMastersLLC';
  }

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  /**
   * Get all repositories for the organization
   */
  async getRepositories(): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForOrg({
        org: this.organization,
        type: 'all',
        sort: 'updated',
        per_page: 100,
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        homepage: repo.homepage || null,
        language: repo.language || null,
        languages_url: repo.languages_url,
        topics: repo.topics || [],
        created_at: repo.created_at || new Date().toISOString(),
        updated_at: repo.updated_at || new Date().toISOString(),
        pushed_at: repo.pushed_at || new Date().toISOString(),
        stargazers_count: repo.stargazers_count || 0,
        forks_count: repo.forks_count || 0,
        size: repo.size || 0,
        archived: repo.archived || false,
        disabled: repo.disabled || false,
        private: repo.private || false,
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      return [];
    }
  }

  /**
   * Get language statistics for a repository
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<GitHubLanguageStats> {
    try {
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo,
      });
      return data;
    } catch (error: unknown) {
      // Handle 404 errors gracefully (repo doesn't exist or no access)
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return {}; // Return empty languages object
      }
      console.error('Error fetching repository languages:', error);
      return {};
    }
  }

  /**
   * Get repository README content
   */
  async getRepositoryReadme(owner: string, repo: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo,
      });
      
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    } catch (error: unknown) {
      // Handle 404 errors gracefully (no README or no access)
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return ''; // Return empty README
      }
      console.error('Error fetching repository README:', error);
      return '';
    }
  }

  /**
   * Convert GitHub repositories to portfolio projects
   */
  async getPortfolioProjects(): Promise<GitHubProject[]> {
    const repositories = await this.getRepositories();
    const activeRepos = repositories.filter(repo => !repo.archived && !repo.disabled);
    
    console.log(`Processing ${activeRepos.length} active repositories...`);
    
    // Process repositories in batches to avoid rate limits
    const batchSize = 5;
    const projects: GitHubProject[] = [];
    
    for (let i = 0; i < activeRepos.length; i += batchSize) {
      const batch = activeRepos.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activeRepos.length / batchSize)}...`);
      
      // Process batch in parallel but limit concurrent requests
      const batchProjects = await Promise.all(
        batch.map(async (repo) => {
          try {
            // Get language statistics and README in parallel with error handling
            const [languages, readme] = await Promise.allSettled([
              this.getRepositoryLanguages(this.organization, repo.name),
              this.getRepositoryReadme(this.organization, repo.name)
            ]);

            const repoLanguages = languages.status === 'fulfilled' ? languages.value : {};
            const repoReadme = readme.status === 'fulfilled' ? readme.value : '';
            
            const techStack = Object.keys(repoLanguages).sort((a, b) => repoLanguages[b] - repoLanguages[a]);
            const uniqueDecisions = this.extractUniqueDecisions(repoReadme);

            // Categorize based on topics and language
            const category = this.categorizeProject(repo.topics, repo.language, repo.description);

            // Generate role based on project characteristics
            const role = this.generateRole(repo, techStack);

            return {
              id: repo.id.toString(),
              title: this.formatTitle(repo.name),
              description: repo.description || 'No description available',
              role,
              techStack,
              githubUrl: repo.html_url,
              liveUrl: repo.homepage || undefined,
              uniqueDecisions,
              category,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              lastUpdated: format(new Date(repo.updated_at), 'yyyy-MM-dd'),
              topics: repo.topics,
              language: repo.language || 'Unknown',
              createdAt: format(new Date(repo.created_at), 'yyyy-MM-dd'),
            };
          } catch (error) {
            console.warn(`Failed to process repository ${repo.name}:`, error);
            
            // Return basic project info without detailed data
            return {
              id: repo.id.toString(),
              title: this.formatTitle(repo.name),
              description: repo.description || 'No description available',
              role: 'Developer',
              techStack: repo.language ? [repo.language] : ['Unknown'],
              githubUrl: repo.html_url,
              liveUrl: repo.homepage || undefined,
              uniqueDecisions: [],
              category: this.categorizeProject(repo.topics, repo.language, repo.description),
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              lastUpdated: format(new Date(repo.updated_at), 'yyyy-MM-dd'),
              topics: repo.topics,
              language: repo.language || 'Unknown',
              createdAt: format(new Date(repo.created_at), 'yyyy-MM-dd'),
            };
          }
        })
      );
      
      projects.push(...batchProjects);
      
      // Small delay between batches to be respectful to GitHub API
      if (i + batchSize < activeRepos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully processed ${projects.length} projects`);
    return projects.sort((a, b) => b.stars - a.stars); // Sort by stars descending
  }

  /**
   * Get featured projects (top projects by stars and activity)
   */
  async getFeaturedProjects(): Promise<GitHubProject[]> {
    const projects = await this.getPortfolioProjects();
    
    // Score projects based on stars, forks, and recent activity
    const scoredProjects = projects.map(project => {
      const daysOld = Math.floor((Date.now() - new Date(project.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
      const activityScore = Math.max(0, 365 - daysOld); // Recent activity gets higher score
      const socialScore = project.stars * 2 + project.forks;
      const totalScore = socialScore + activityScore;
      
      return { ...project, score: totalScore };
    });

    return scoredProjects
      .sort((a, b) => b.score - a.score)
      .slice(0, 6); // Return top 6 featured projects
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<GitHubProject | null> {
    const projects = await this.getPortfolioProjects();
    return projects.find(project => project.id === id) || null;
  }

  /**
   * Get overall language statistics across all repositories
   */
  async getOverallLanguageStats(): Promise<GitHubLanguageStats> {
    const repositories = await this.getRepositories();
    const overallStats: GitHubLanguageStats = {};

    for (const repo of repositories) {
      if (repo.archived || repo.disabled) continue;

      const languages = await this.getRepositoryLanguages(this.organization, repo.name);
      
      for (const [language, bytes] of Object.entries(languages)) {
        overallStats[language] = (overallStats[language] || 0) + bytes;
      }
    }

    return overallStats;
  }

  /**
   * Private helper methods
   */
  private formatTitle(repoName: string): string {
    return repoName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private categorizeProject(topics: string[], language: string | null, description: string | null): 'ai' | 'architecture' | 'leadership' | 'systems' {
    const topicsLower = topics.map(t => t.toLowerCase());
    const descLower = (description || '').toLowerCase();
    const langLower = (language || '').toLowerCase();

    // AI-related keywords
    if (topicsLower.some(t => ['ai', 'ml', 'machine-learning', 'tensorflow', 'pytorch', 'neural-network'].includes(t)) ||
        descLower.includes('ai') || descLower.includes('machine learning') || descLower.includes('neural')) {
      return 'ai';
    }

    // Architecture-related keywords
    if (topicsLower.some(t => ['architecture', 'microservices', 'api', 'framework', 'design-patterns'].includes(t)) ||
        descLower.includes('architecture') || descLower.includes('microservices') || descLower.includes('framework')) {
      return 'architecture';
    }

    // Systems-related keywords
    if (topicsLower.some(t => ['infrastructure', 'devops', 'docker', 'kubernetes', 'aws', 'cloud'].includes(t)) ||
        descLower.includes('infrastructure') || descLower.includes('system') || descLower.includes('devops')) {
      return 'systems';
    }

    // Leadership-related keywords
    if (topicsLower.some(t => ['management', 'team', 'collaboration', 'productivity'].includes(t)) ||
        descLower.includes('team') || descLower.includes('collaboration') || descLower.includes('management')) {
      return 'leadership';
    }

    // Default categorization based on language
    if (['go', 'rust', 'c', 'cpp'].includes(langLower)) return 'systems';
    if (['python', 'jupyter notebook'].includes(langLower)) return 'ai';
    if (['javascript', 'typescript', 'react', 'vue'].includes(langLower)) return 'architecture';
    
    return 'systems'; // Default
  }

  private generateRole(repo: GitHubRepository, techStack: string[]): string {
    const hasBackend = techStack.some(tech => ['Go', 'Python', 'Java', 'C#', 'Rust'].includes(tech));
    const hasFrontend = techStack.some(tech => ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular'].includes(tech));
    const hasInfra = techStack.some(tech => ['Dockerfile', 'Shell', 'YAML'].includes(tech));

    if (hasBackend && hasFrontend && hasInfra) {
      return 'Full Stack Engineer & DevOps';
    } else if (hasBackend && hasInfra) {
      return 'Backend Engineer & Systems Architect';
    } else if (hasFrontend && hasBackend) {
      return 'Full Stack Developer';
    } else if (hasBackend) {
      return 'Backend Engineer';
    } else if (hasFrontend) {
      return 'Frontend Developer';
    } else if (hasInfra) {
      return 'DevOps Engineer';
    } else {
      return 'Software Engineer';
    }
  }

  private extractUniqueDecisions(readme: string): string[] {
    const decisions: string[] = [];
    
    // Look for common patterns in README files that indicate unique decisions
    const patterns = [
      /## (?:Architecture|Design|Approach|Implementation|Strategy)[\s\S]*?(?=##|$)/gi,
      /### (?:Key Features|Unique Features|Highlights)[\s\S]*?(?=###|##|$)/gi,
      /(?:Built with|Implemented using|Features)[\s\S]*?(?=\n\n|$)/gi,
    ];

    for (const pattern of patterns) {
      const matches = readme.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Extract bullet points or key phrases
          const lines = match.split('\n').filter(line => 
            line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•')
          );
          
          lines.forEach(line => {
            const cleaned = line.replace(/^[-*•]\s*/, '').trim();
            if (cleaned.length > 10 && cleaned.length < 200) {
              decisions.push(cleaned);
            }
          });
        });
      }
    }

    // If no specific decisions found, generate generic ones based on tech stack
    if (decisions.length === 0) {
      decisions.push('Implemented modern development practices');
      decisions.push('Focused on clean code architecture');
      decisions.push('Prioritized performance and scalability');
    }

    return decisions.slice(0, 5); // Limit to 5 unique decisions
  }
}

export default GitHubService; 