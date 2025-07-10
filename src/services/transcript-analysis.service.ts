export interface MeetingCategory {
  type: 'architecture-review' | 'technical-discussion' | 'mentoring-session' | 'code-review' | 'system-design' | 'leadership-moment' | 'skip';
  confidence: number;
  reason: string;
}

export interface KeyMoment {
  timestamp: string;
  description: string;
  type: 'architecture' | 'leadership' | 'technical' | 'mentoring' | 'decision';
  importance: number; // 1-10 scale
}

export interface MeetingInsights {
  category: MeetingCategory;
  keyMoments: KeyMoment[];
  participants: string[];
  technicalTopics: string[];
  decisions: string[];
  duration: string;
  title: string;
  description: string;
  isPortfolioRelevant: boolean;
}

class TranscriptAnalysisService {
  private static instance: TranscriptAnalysisService;

  private constructor() {}

  public static getInstance(): TranscriptAnalysisService {
    if (!TranscriptAnalysisService.instance) {
      TranscriptAnalysisService.instance = new TranscriptAnalysisService();
    }
    return TranscriptAnalysisService.instance;
  }

  /**
   * Analyze transcript content to extract meeting insights
   */
  async analyzeTranscript(transcript: string, filename?: string): Promise<MeetingInsights> {
    // Clean and normalize transcript
    const cleanTranscript = this.cleanTranscript(transcript);
    
    // Extract basic info
    const participants = this.extractParticipants(cleanTranscript);
    const duration = this.estimateDuration(cleanTranscript);
    
    // Categorize the meeting
    const category = this.categorizeMeeting(cleanTranscript, filename);
    
    // If not portfolio relevant, return early
    if (!category || category.type === 'skip') {
      return {
        category: category || { type: 'skip', confidence: 0, reason: 'Not portfolio relevant' },
        keyMoments: [],
        participants,
        technicalTopics: [],
        decisions: [],
        duration,
        title: filename || 'Unknown Meeting',
        description: '',
        isPortfolioRelevant: false
      };
    }

    // Extract detailed insights for relevant meetings
    const keyMoments = this.extractKeyMoments(cleanTranscript);
    const technicalTopics = this.extractTechnicalTopics(cleanTranscript);
    const decisions = this.extractDecisions(cleanTranscript);
         const title = this.generateTitle(cleanTranscript, category.type);
    const description = this.generateDescription(cleanTranscript, category.type);

    return {
      category,
      keyMoments,
      participants,
      technicalTopics,
      decisions,
      duration,
      title,
      description,
      isPortfolioRelevant: true
    };
  }

  /**
   * Clean and normalize transcript text
   */
  private cleanTranscript(transcript: string): string {
    return transcript
      .replace(/\[.*?\]/g, '') // Remove timestamps and metadata
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Categorize meeting based on content analysis
   */
  private categorizeMeeting(transcript: string, filename?: string): MeetingCategory | null {
    const lowerTranscript = transcript.toLowerCase();
    const lowerFilename = (filename || '').toLowerCase();

    // Skip patterns - meetings that aren't portfolio relevant
    const skipPatterns = [
      /\b(alignment|standup|stand-up|daily|scrum|administrative|admin|hr|human resources)\b/,
      /\b(budget|financial|planning|schedule|calendar|meeting schedule)\b/,
      /\b(status update|progress report|weekly update|check-in)\b/,
      /\b(birthday|celebration|social|lunch|coffee)\b/
    ];

    // Check if this should be skipped
    for (const pattern of skipPatterns) {
      if (pattern.test(lowerTranscript) || pattern.test(lowerFilename)) {
        return { type: 'skip', confidence: 0.8, reason: 'Administrative or non-technical meeting' };
      }
    }

    // Architecture review patterns
    const archPatterns = [
      /\b(architecture|architectural|system design|design pattern|modular|scalability)\b/,
      /\b(microservices|api design|database design|infrastructure)\b/,
      /\b(technical debt|refactor|performance|optimization)\b/,
      /\b(design decision|architectural decision|system architecture)\b/
    ];

    // Technical discussion patterns
    const techPatterns = [
      /\b(implementation|coding|development|algorithm|data structure)\b/,
      /\b(bug|debugging|troubleshooting|testing|deployment)\b/,
      /\b(framework|library|tool|technology|technical approach)\b/,
      /\b(security|authentication|authorization|encryption)\b/
    ];

    // Mentoring patterns
    const mentorPatterns = [
      /\b(mentoring|coaching|learning|teaching|guidance|career)\b/,
      /\b(code review|best practices|clean code|patterns)\b/,
      /\b(skill development|growth|feedback|improvement)\b/,
      /\b(junior|senior|developer growth|technical skills)\b/
    ];

    // Leadership patterns
    const leadershipPatterns = [
      /\b(leadership|team building|strategy|vision|direction)\b/,
      /\b(decision making|problem solving|conflict resolution)\b/,
      /\b(team dynamics|collaboration|communication|process)\b/,
      /\b(project management|resource allocation|planning)\b/
    ];

    // Code review patterns
    const codeReviewPatterns = [
      /\b(code review|pull request|pr review|merge request)\b/,
      /\b(commit|branch|repository|git|version control)\b/,
      /\b(refactoring|clean up|optimization|readability)\b/
    ];

    // Count matches and determine category
    const scores = {
      'architecture-review': this.countMatches(lowerTranscript, archPatterns),
      'technical-discussion': this.countMatches(lowerTranscript, techPatterns),
      'mentoring-session': this.countMatches(lowerTranscript, mentorPatterns),
      'leadership-moment': this.countMatches(lowerTranscript, leadershipPatterns),
      'code-review': this.countMatches(lowerTranscript, codeReviewPatterns)
    };

    // Find the highest scoring category
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return { type: 'skip', confidence: 0.5, reason: 'No clear technical or leadership content found' };
    }

    const topCategory = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as keyof typeof scores;
    const confidence = Math.min(0.9, maxScore / 10); // Scale confidence

    // Require minimum confidence for inclusion
    if (confidence < 0.3) {
      return { type: 'skip', confidence, reason: 'Low confidence in category assignment' };
    }

    return {
      type: topCategory,
      confidence,
      reason: `Detected ${maxScore} relevant indicators for ${topCategory.replace('-', ' ')}`
    };
  }

  /**
   * Count pattern matches in text
   */
  private countMatches(text: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Extract participants from transcript
   */
  private extractParticipants(transcript: string): string[] {
    const participants = new Set<string>();
    
    // Look for speaker patterns like "John:", "Speaker 1:", etc.
    const speakerPatterns = [
      /^([A-Z][a-zA-Z\s]{1,20}):/gm,
      /\b([A-Z][a-z]+)\s+(?:said|says|mentioned|asked|replied)/g,
      /\b(?:Hi|Hello)\s+([A-Z][a-z]+)/g
    ];

    speakerPatterns.forEach(pattern => {
      const matches = transcript.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].trim();
        if (name.length > 1 && name.length < 20 && !name.includes(' ')) {
          participants.add(name);
        }
      }
    });

    return Array.from(participants).slice(0, 10); // Limit to reasonable number
  }

  /**
   * Extract key moments from transcript
   */
  private extractKeyMoments(transcript: string): KeyMoment[] {
    const moments: KeyMoment[] = [];
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Keywords that indicate important moments
    const importantPhrases = {
      'architecture': /\b(design|architecture|system|pattern|modular|scalable)\b/i,
      'decision': /\b(decide|decision|choose|selected|agreed|conclusion)\b/i,
      'technical': /\b(implement|code|algorithm|performance|optimization|bug)\b/i,
      'leadership': /\b(team|lead|manage|strategy|vision|direction)\b/i,
      'mentoring': /\b(learn|teach|guidance|mentor|coaching|growth)\b/i
    };

    sentences.forEach((sentence, index) => {
      const timestamp = this.generateTimestamp(index, sentences.length);
      
      Object.entries(importantPhrases).forEach(([type, pattern]) => {
                 if (pattern.test(sentence)) {
           const importance = this.calculateImportance(sentence);
           if (importance >= 6) { // Only include high-importance moments
                         moments.push({
               timestamp,
               description: sentence.trim().substring(0, 100) + '...',
               type: type as KeyMoment['type'],
               importance
             });
          }
        }
      });
    });

    // Sort by importance and return top moments
    return moments
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8); // Limit to 8 key moments
  }

  /**
   * Calculate importance score for a sentence
   */
  private calculateImportance(sentence: string): number {
    let score = 5; // Base score

    // Boost for specific keywords
    const highValueWords = [
      'architecture', 'design', 'decision', 'implement', 'solution',
      'strategy', 'approach', 'pattern', 'optimization', 'scalability',
      'leadership', 'mentoring', 'guidance', 'learning', 'growth'
    ];

    highValueWords.forEach(word => {
      if (sentence.toLowerCase().includes(word)) {
        score += 1;
      }
    });

    // Boost for question/answer patterns
    if (/\?/.test(sentence)) score += 1;
    if (/\b(because|since|due to|reason)\b/i.test(sentence)) score += 1;

    return Math.min(10, score);
  }

  /**
   * Generate timestamp for key moments
   */
  private generateTimestamp(index: number, total: number): string {
    const percentage = index / total;
    const minutes = Math.floor(percentage * 45); // Assume max 45 min meetings
    const seconds = Math.floor((percentage * 45 * 60) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Extract technical topics discussed
   */
  private extractTechnicalTopics(transcript: string): string[] {
    const topics = new Set<string>();
    const techTerms = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'AWS', 'Docker',
      'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
      'Microservices', 'Architecture', 'Design Patterns', 'Database', 'Frontend',
      'Backend', 'DevOps', 'CI/CD', 'Testing', 'Security', 'Performance',
      'Scalability', 'Optimization', 'Machine Learning', 'AI', 'Algorithms'
    ];

    techTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(transcript)) {
        topics.add(term);
      }
    });

    return Array.from(topics).slice(0, 10);
  }

  /**
   * Extract decisions made during the meeting
   */
  private extractDecisions(transcript: string): string[] {
    const decisions: string[] = [];
    const decisionPatterns = [
      /(?:decided|agreed|concluded|chose|selected)\s+(?:to|that|on)\s+([^.!?]{10,100})/gi,
      /(?:we will|we'll|going to|plan to)\s+([^.!?]{10,100})/gi,
      /(?:solution|approach|strategy)\s+(?:is|will be)\s+([^.!?]{10,100})/gi
    ];

    decisionPatterns.forEach(pattern => {
      const matches = transcript.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 10) {
          decisions.push(match[1].trim());
        }
      }
    });

    return decisions.slice(0, 5); // Limit to 5 key decisions
  }

  /**
   * Generate title based on content and category
   */
  private generateTitle(transcript: string, category: string): string {
    const categoryTitles = {
      'architecture-review': 'Architecture Review Session',
      'technical-discussion': 'Technical Discussion',
      'mentoring-session': 'Mentoring & Coaching Session',
      'code-review': 'Code Review Session',
      'system-design': 'System Design Discussion',
      'leadership-moment': 'Leadership & Strategy Session'
    };

    const baseTitle = categoryTitles[category as keyof typeof categoryTitles] || 'Technical Session';
    
    // Try to extract specific topic from transcript
    const topics = this.extractTechnicalTopics(transcript);
    if (topics.length > 0) {
      return `${baseTitle}: ${topics.slice(0, 2).join(' & ')}`;
    }

    return baseTitle;
  }

  /**
   * Generate description based on content
   */
  private generateDescription(transcript: string, category: string): string {
    const firstSentences = transcript.split(/[.!?]+/).slice(0, 3).join('. ');
    const summary = firstSentences.length > 200 ? 
      firstSentences.substring(0, 200) + '...' : 
      firstSentences;

    const categoryDescriptions = {
      'architecture-review': 'Deep dive into system architecture, design patterns, and technical decisions.',
      'technical-discussion': 'Technical conversation covering implementation details and problem-solving.',
      'mentoring-session': 'Coaching session focused on professional development and technical guidance.',
      'code-review': 'Code review session with feedback on implementation and best practices.',
      'system-design': 'System design discussion covering scalability and architectural considerations.',
      'leadership-moment': 'Leadership discussion covering strategy, team dynamics, and decision-making.'
    };

    return categoryDescriptions[category as keyof typeof categoryDescriptions] || summary;
  }

  /**
   * Estimate meeting duration from transcript length
   */
  private estimateDuration(transcript: string): string {
    // Rough estimation: ~150 words per minute of speech
    const wordCount = transcript.split(/\s+/).length;
    const estimatedMinutes = Math.round(wordCount / 150);
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes}:00`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
}

export default TranscriptAnalysisService; 