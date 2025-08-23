/**
 * Conversation Analysis Automation Service
 * Automatically analyzes uploaded conversations and generates Strategic Architect Masterclass data
 */

interface ConversationAnalysisResult {
  keyMoments: string[];
  evolutionPhases: Array<{
    phase: string;
    focus: string;
    strategicIntensity: number;
  }>;
  strategicScore: number;
  alignmentScore: number;
  conversationType: string;
  focusArea: string;
}

export class ConversationAnalysisAutomationService {
  
  /**
   * Automatically analyze a conversation and generate Strategic Architect Masterclass data
   */
  static async analyzeConversation(content: string, title: string, conversationId: string): Promise<ConversationAnalysisResult> {
    console.log(`🤖 Auto-analyzing conversation: ${title}`);
    
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // Extract key moments using pattern recognition
    const keyMoments = this.extractKeyMoments(content);
    
    // Generate evolution phases based on conversation flow
    const evolutionPhases = this.generateEvolutionPhases(content, title);
    
    // Calculate strategic and alignment scores
    const strategicScore = this.calculateStrategicScore(content);
    const alignmentScore = this.calculateAlignmentScore(content);
    
    // Determine conversation type and focus area
    const { conversationType, focusArea } = this.classifyConversation(content, title);
    
    console.log(`✅ Analysis complete: ${strategicScore}/100 strategic, ${alignmentScore}/100 alignment`);
    
    return {
      keyMoments,
      evolutionPhases,
      strategicScore,
      alignmentScore,
      conversationType,
      focusArea
    };
  }
  
  /**
   * Extract key strategic moments from conversation content
   */
  private static extractKeyMoments(content: string): string[] {
    const lines = content.split('\n');
    const keyMoments: string[] = [];
    
    // Patterns that indicate strategic moments
    const strategicPatterns = [
      /\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm)\b.*$/i,
      /^.*\b(what about|should also|make sure|scope|expand|improve|enhance|better|optimize)\b.*$/i,
      /^.*\b(understand|explain|real issue|root cause|gap|missing|problem|issue)\b.*$/i,
      /^.*\b(framework|pattern|approach|methodology|strategy|philosophy|principle)\b.*$/i,
      /^.*\b(system|architecture|integration|overall|comprehensive|end-to-end)\b.*$/i
    ];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip very short lines, markdown headers, and technical details
      if (trimmedLine.length < 20 || trimmedLine.startsWith('#') || trimmedLine.startsWith('**')) {
        continue;
      }
      
      // Check if line matches strategic patterns
      for (const pattern of strategicPatterns) {
        if (pattern.test(trimmedLine)) {
          // Clean up the line and add to key moments
          const cleanedLine = trimmedLine
            .replace(/^\*\*User\*\*\s*/, '')
            .replace(/^\*\*Cursor\*\*\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (cleanedLine.length > 15 && cleanedLine.length < 200) {
            keyMoments.push(cleanedLine);
            break; // Only match first pattern per line
          }
        }
      }
      
      // Stop after finding 6 key moments
      if (keyMoments.length >= 6) break;
    }
    
    // If we didn't find enough strategic moments, extract from user messages
    if (keyMoments.length < 3) {
      const userMessages = content.match(/\*\*User\*\*\s*\n(.*?)(?=\*\*Cursor\*\*|\*\*User\*\*|$)/gs) || [];
      
      for (const message of userMessages.slice(0, 6)) {
        const cleanMessage = message
          .replace(/\*\*User\*\*\s*\n/, '')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanMessage.length > 20 && cleanMessage.length < 200) {
          keyMoments.push(cleanMessage);
        }
        
        if (keyMoments.length >= 6) break;
      }
    }
    
    return keyMoments.slice(0, 6);
  }
  
  /**
   * Generate evolution phases based on conversation flow
   */
  private static generateEvolutionPhases(content: string, title: string): Array<{phase: string, focus: string, strategicIntensity: number}> {
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // Default phases that work for most conversations
    const phases = [];
    
    if (lowerContent.includes('understand') || lowerContent.includes('analyze') || lowerContent.includes('what')) {
      phases.push({
        phase: 'Understanding & Analysis',
        focus: 'Problem identification and requirement analysis',
        strategicIntensity: Math.floor(Math.random() * 10) + 85
      });
    }
    
    if (lowerContent.includes('implement') || lowerContent.includes('create') || lowerContent.includes('build')) {
      phases.push({
        phase: 'Implementation & Development',
        focus: 'Technical implementation and system development',
        strategicIntensity: Math.floor(Math.random() * 10) + 80
      });
    }
    
    if (lowerContent.includes('optimize') || lowerContent.includes('improve') || lowerContent.includes('enhance')) {
      phases.push({
        phase: 'Optimization & Enhancement',
        focus: 'Performance optimization and feature enhancement',
        strategicIntensity: Math.floor(Math.random() * 10) + 88
      });
    }
    
    if (lowerContent.includes('integrate') || lowerContent.includes('connect') || lowerContent.includes('system')) {
      phases.push({
        phase: 'System Integration',
        focus: 'Integration with existing systems and deployment',
        strategicIntensity: Math.floor(Math.random() * 10) + 82
      });
    }
    
    // Ensure we have at least 3 phases
    if (phases.length < 3) {
      phases.push(
        {
          phase: 'Strategic Planning',
          focus: 'High-level strategic direction and planning',
          strategicIntensity: 90
        },
        {
          phase: 'Execution & Implementation',
          focus: 'Tactical execution and implementation details',
          strategicIntensity: 85
        },
        {
          phase: 'Quality & Refinement',
          focus: 'Quality assurance and iterative refinement',
          strategicIntensity: 88
        }
      );
    }
    
    return phases.slice(0, 4); // Return max 4 phases
  }
  
  /**
   * Calculate strategic score based on content analysis
   */
  private static calculateStrategicScore(content: string): number {
    const lowerContent = content.toLowerCase();
    
    // Count strategic patterns
    const strategicPatterns = {
      directionGiving: (lowerContent.match(/\b(proceed|implement|ensure|make sure|analyze|optimize|verify|confirm|create|build|fix|solve|execute|run|test|check|update|add|remove|delete|modify|change)\b/g) || []).length,
      systemThinking: (lowerContent.match(/\b(ecosystem|integration|overall|comprehensive|end-to-end|system|architecture|cadis|developer|team|database|service|module|component|framework|infrastructure)\b/g) || []).length,
      qualityControl: (lowerContent.match(/\b(verify|confirm|test|validate|check|quality|proper|right|should|correct|working|functional|operational|ready|complete|finished)\b/g) || []).length,
      problemDiagnosis: (lowerContent.match(/\b(what do|why|understand|explain|real issue|root cause|gap|missing|optimize|problem|issue|error|bug|wrong|broken|not working)\b/g) || []).length,
      metaAnalysis: (lowerContent.match(/\b(analyze.*conversation|define.*styles|framework|pattern|understand.*difference|meta|think|approach|methodology|strategy|philosophy|principle)\b/g) || []).length
    };
    
    const totalPatterns = Object.values(strategicPatterns).reduce((sum, count) => sum + count, 0);
    const contentLength = content.length;
    
    // Calculate density-based score
    const patternDensity = (totalPatterns / (contentLength / 1000)); // patterns per 1000 characters
    let score = Math.min(100, Math.max(65, Math.round(patternDensity * 8 + 65)));
    
    // Bonus for high-value patterns
    if (strategicPatterns.directionGiving > 10) score += 5;
    if (strategicPatterns.systemThinking > 5) score += 5;
    if (strategicPatterns.metaAnalysis > 2) score += 8;
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate alignment score based on philosophical principles
   */
  private static calculateAlignmentScore(content: string): number {
    const lowerContent = content.toLowerCase();
    
    const alignmentPatterns = {
      execution: (lowerContent.match(/\b(proceed|implement|build|create|fix|solve|execute|action|do it|make sure|ensure|verify|confirm|run|test|check|analyze|optimize|go ahead|start|begin|complete|finish|handle|process|setup|configure|deploy)\b/g) || []).length,
      modularity: (lowerContent.match(/\b(modular|component|service|singleton|module|reusable|separate|individual|independent|isolated|architecture|system|structure|organize|clean|maintainable)\b/g) || []).length,
      reusability: (lowerContent.match(/\b(reusable|framework|pattern|template|systematic|scale|standard|consistent|library|utility|helper|common|shared|generic|flexible|adaptable)\b/g) || []).length,
      teachability: (lowerContent.match(/\b(document|explain|understand|framework|define|teach|learn|analyze|study|review|examine|investigate|explore|discover|insight|knowledge|comprehend|clarify)\b/g) || []).length,
      progressiveEnhancement: (lowerContent.match(/\b(enhance|improve|upgrade|build on|add to|progressive|expand|extend|optimize|refine|evolve|advance|develop|grow|scale|iterate|better|enhancement)\b/g) || []).length
    };
    
    const totalPatterns = Object.values(alignmentPatterns).reduce((sum, count) => sum + count, 0);
    const contentLength = content.length;
    
    // Calculate density-based score
    const patternDensity = (totalPatterns / (contentLength / 1000)); // patterns per 1000 characters
    let score = Math.min(100, Math.max(70, Math.round(patternDensity * 6 + 70)));
    
    // Bonus for balanced alignment across principles
    const principleCount = Object.values(alignmentPatterns).filter(count => count > 0).length;
    if (principleCount >= 4) score += 10;
    if (principleCount >= 3) score += 5;
    
    return Math.min(100, score);
  }
  
  /**
   * Classify conversation type and focus area
   */
  private static classifyConversation(content: string, title: string): { conversationType: string, focusArea: string } {
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    let conversationType = 'strategic-conversation';
    let focusArea = 'Strategic conversation';
    
    // Classify based on title and content patterns
    if (lowerTitle.includes('cadis') || lowerContent.includes('cadis')) {
      conversationType = 'cadis-analysis';
      focusArea = 'CADIS system development';
    } else if (lowerTitle.includes('debug') || lowerTitle.includes('fix') || lowerTitle.includes('issue') || lowerTitle.includes('problem')) {
      conversationType = 'problem-solving';
      focusArea = 'Technical problem-solving';
    } else if (lowerTitle.includes('game') || lowerContent.includes('game development')) {
      conversationType = 'game-development';
      focusArea = 'Game development strategy';
    } else if (lowerTitle.includes('analysis') || lowerTitle.includes('understand') || lowerTitle.includes('segment')) {
      conversationType = 'strategic-analysis';
      focusArea = 'Strategic analysis & learning';
    } else if (lowerTitle.includes('integration') || lowerContent.includes('integrate')) {
      conversationType = 'system-integration';
      focusArea = 'System integration';
    } else if (lowerTitle.includes('architecture') || lowerContent.includes('architecture')) {
      conversationType = 'system-architecture';
      focusArea = 'System architecture design';
    }
    
    return { conversationType, focusArea };
  }
}
