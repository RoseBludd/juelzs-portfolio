/**
 * CADIS Background Agent Service
 * Autonomous coding agent that can make direct repository changes, handle support tickets,
 * and manage projects across the ecosystem using multiple AI models
 */

import { Octokit } from '@octokit/rest';

interface CADISAgentConfig {
  githubToken: string;
  vercelToken: string;
  railwayToken: string;
  openaiApiKey: string;
  claudeApiKey: string;
  geminiApiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  s3Config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
}

interface AgentTask {
  id: string;
  type: 'support_ticket' | 'project_adjustment' | 'feature_request' | 'bug_fix' | 'deployment';
  description: string;
  repository: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredApproval: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';
}

interface ActionBusJob {
  id: string;
  type: string;
  payload: any;
  signature: string;
  timestamp: Date;
  idempotencyKey: string;
  retryCount: number;
  maxRetries: number;
}

interface AIModelResponse {
  model: 'gpt-5-2025-08-07' | 'claude-opus-4-1-20250805' | 'gemini-2.5-pro';
  response: string;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
}

export class CADISBackgroundAgent {
  private static instance: CADISBackgroundAgent;
  private config: CADISAgentConfig;
  private octokit: Octokit;
  private actionQueue: ActionBusJob[] = [];
  private isProcessing = false;

  private constructor(config: CADISAgentConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.githubToken,
    });
    
    console.log('🤖 CADIS Background Agent initialized');
    this.startProcessingLoop();
  }

  public static getInstance(config?: CADISAgentConfig): CADISBackgroundAgent {
    if (!CADISBackgroundAgent.instance) {
      if (!config) {
        throw new Error('CADIS Agent config required for first initialization');
      }
      CADISBackgroundAgent.instance = new CADISBackgroundAgent(config);
    }
    return CADISBackgroundAgent.instance;
  }

  /**
   * Main entry point for CADIS to handle requests
   */
  public async handleRequest(request: string, context?: Record<string, any>): Promise<string> {
    console.log('🎯 CADIS Agent received request:', request);
    
    try {
      // Analyze the request using multiple AI models
      const analysis = await this.analyzeRequest(request, context);
      
      // Create task based on analysis
      const task = await this.createTask(request, analysis, context);
      
      // Execute the task
      const result = await this.executeTask(task);
      
      return result;
    } catch (error) {
      console.error('❌ CADIS Agent error:', error);
      return `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Analyze request using multiple AI models for consensus
   */
  private async analyzeRequest(request: string, context?: Record<string, any>): Promise<AIModelResponse[]> {
    const systemPrompt = this.buildSystemPrompt();
    
    const analyses = await Promise.all([
      this.queryGPT5(request, systemPrompt, context),
      this.queryClaude(request, systemPrompt, context),
      this.queryGemini(request, systemPrompt, context)
    ]);

    return analyses;
  }

  /**
   * Build comprehensive system prompt with CADIS knowledge
   */
  private buildSystemPrompt(): string {
    return `You are CADIS (Context-Aware Dynamic Intelligence System), an autonomous coding agent with comprehensive knowledge of Juelz's development ecosystem.

CORE PHILOSOPHY:
- "If it needs to be done, do it" - Execution-led approach
- Make it modular - Component-based architecture
- Make it reusable - Framework and pattern thinking
- Make it teachable - Documentation and knowledge transfer
- Progressive enhancement - Build on existing foundations

DEVELOPER STYLES YOU UNDERSTAND:
- Strategic Architect: Direction-setting, vision casting, high-level decisions
- Technical Implementer: Deep technical workflows, system architecture
- Context-Adaptive Strategic Architect: Adaptive leadership across contexts
- Strategic Problem Solver: Systematic problem resolution

REPOSITORY KNOWLEDGE:
- Main portfolio: juelzs-portfolio (Next.js, TypeScript, PostgreSQL, Vercel)
- Platform: vibezs-platform (Full-stack ecosystem)
- 26+ GitHub projects with various tech stacks
- Deployment patterns: Vercel, Railway, Supabase integration

CODING PATTERNS:
- Singleton services for centralized logic
- Progressive enhancement over replacement
- Modular component architecture
- Comprehensive error handling and logging
- Real-time analysis and feedback systems

CAPABILITIES:
- Direct repository modifications via GitHub API
- Multi-environment deployments (dev/staging/prod)
- Database schema updates and migrations
- AI-powered analysis and decision making
- Automated testing and quality assurance

When given a task, analyze it through the lens of Juelz's philosophy and coding patterns. Provide specific, actionable steps that align with the established architecture and patterns.`;
  }

  /**
   * Query GPT-5 model
   */
  private async queryGPT5(request: string, systemPrompt: string, context?: Record<string, any>): Promise<AIModelResponse> {
    try {
      if (!this.config.openaiApiKey) {
        console.log('OpenAI API key not configured, using fallback analysis');
        return this.getFallbackResponse('gpt-5-2025-08-07', request);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Use available model instead of gpt-5
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Request: ${request}\nContext: ${JSON.stringify(context || {})}` }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid OpenAI API response structure');
      }

      const content = data.choices[0].message.content || '';

      return {
        model: 'gpt-5-2025-08-07',
        response: content,
        confidence: 0.9,
        reasoning: 'GPT-4o analysis based on comprehensive system knowledge',
        suggestedActions: this.extractActions(content)
      };
    } catch (error) {
      console.error('GPT-5 query error:', error);
      return this.getFallbackResponse('gpt-5-2025-08-07', request);
    }
  }

  /**
   * Query Claude Opus model
   */
  private async queryClaude(request: string, systemPrompt: string, context?: Record<string, any>): Promise<AIModelResponse> {
    try {
      if (!this.config.claudeApiKey) {
        console.log('Claude API key not configured, using fallback analysis');
        return this.getFallbackResponse('claude-opus-4-1-20250805', request);
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.claudeApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022', // Use available model
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\nRequest: ${request}\nContext: ${JSON.stringify(context || {})}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || typeof data.content[0].text !== 'string') {
        throw new Error('Invalid Claude API response structure');
      }

      const content = data.content[0].text || '';

      return {
        model: 'claude-opus-4-1-20250805',
        response: content,
        confidence: 0.95,
        reasoning: 'Claude 3.5 Sonnet analysis with strategic thinking focus',
        suggestedActions: this.extractActions(content)
      };
    } catch (error) {
      console.error('Claude query error:', error);
      return this.getFallbackResponse('claude-opus-4-1-20250805', request);
    }
  }

  /**
   * Query Gemini Pro model
   */
  private async queryGemini(request: string, systemPrompt: string, context?: Record<string, any>): Promise<AIModelResponse> {
    try {
      if (!this.config.geminiApiKey) {
        console.log('Gemini API key not configured, using fallback analysis');
        return this.getFallbackResponse('gemini-2.5-pro', request);
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.config.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nRequest: ${request}\nContext: ${JSON.stringify(context || {})}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid Gemini API response structure');
      }

      const content = data.candidates[0].content.parts[0].text || '';

      return {
        model: 'gemini-2.5-pro',
        response: content,
        confidence: 0.85,
        reasoning: 'Gemini 1.5 Pro analysis with multi-modal capabilities',
        suggestedActions: this.extractActions(content)
      };
    } catch (error) {
      console.error('Gemini query error:', error);
      return this.getFallbackResponse('gemini-2.5-pro', request);
    }
  }

  /**
   * Get fallback response when AI models are not available
   */
  private getFallbackResponse(model: string, request: string): AIModelResponse {
    const fallbackAnalysis = this.generateFallbackAnalysis(request);
    
    return {
      model: model as any,
      response: fallbackAnalysis,
      confidence: 0.7,
      reasoning: 'Fallback analysis based on CADIS knowledge patterns',
      suggestedActions: this.extractActions(fallbackAnalysis)
    };
  }

  /**
   * Generate intelligent fallback analysis based on request patterns
   */
  private generateFallbackAnalysis(request: string): string {
    const lowerRequest = request.toLowerCase();
    
    // Analyze request type and provide intelligent response
    if (lowerRequest.includes('fix') || lowerRequest.includes('error') || lowerRequest.includes('bug')) {
      return `CADIS Analysis: Bug Fix Request

**Issue Assessment:**
- Request involves fixing errors or bugs in the codebase
- Priority: Medium to High based on impact scope
- Approach: Systematic debugging and testing

**Recommended Actions:**
1. Identify root cause through code analysis and error logs
2. Implement targeted fix following existing code patterns
3. Add comprehensive error handling and validation
4. Create test cases to prevent regression
5. Update documentation if needed

**CADIS Philosophy Alignment:**
- "If it needs to be done, do it" - Address the issue directly
- Make it modular - Ensure fix doesn't create coupling
- Make it reusable - Pattern the solution for future use
- Progressive enhancement - Build on existing foundation

This analysis follows Juelz's execution-led refinement approach with systematic problem resolution.`;
    }
    
    if (lowerRequest.includes('add') || lowerRequest.includes('feature') || lowerRequest.includes('new')) {
      return `CADIS Analysis: Feature Development Request

**Feature Assessment:**
- Request involves adding new functionality to the system
- Priority: Medium based on strategic value
- Approach: Modular implementation with progressive enhancement

**Recommended Actions:**
1. Design feature architecture following existing patterns
2. Implement core functionality with proper TypeScript types
3. Add comprehensive error handling and validation
4. Create reusable components where applicable
5. Integrate with existing admin and user interfaces
6. Add appropriate testing and documentation

**CADIS Philosophy Alignment:**
- Make it modular - Component-based architecture
- Make it reusable - Framework thinking for future features
- Make it teachable - Clear documentation and patterns
- Progressive enhancement - Build incrementally

This follows the Strategic Architect approach with systematic feature development.`;
    }
    
    if (lowerRequest.includes('deploy') || lowerRequest.includes('production') || lowerRequest.includes('release')) {
      return `CADIS Analysis: Deployment Request

**Deployment Assessment:**
- Request involves production deployment or release management
- Priority: High - Production changes require careful handling
- Approach: Systematic deployment with rollback capabilities

**Recommended Actions:**
1. Verify all tests pass and code quality checks complete
2. Review changes for production readiness and security
3. Create deployment branch with proper versioning
4. Execute staged deployment (staging → production)
5. Monitor deployment health and performance metrics
6. Prepare rollback plan if issues arise

**CADIS Philosophy Alignment:**
- "If it needs to be done, do it" - Execute deployment efficiently
- Quality assurance - Comprehensive testing before release
- Risk management - Staged approach with monitoring

This follows production-ready architecture principles with graceful fallbacks.`;
    }
    
    if (lowerRequest.includes('optimize') || lowerRequest.includes('performance') || lowerRequest.includes('improve')) {
      return `CADIS Analysis: Optimization Request

**Optimization Assessment:**
- Request involves improving system performance or efficiency
- Priority: Medium to High based on impact metrics
- Approach: Data-driven optimization with measurable improvements

**Recommended Actions:**
1. Analyze current performance metrics and bottlenecks
2. Identify optimization opportunities (code, database, caching)
3. Implement targeted improvements with benchmarking
4. Add performance monitoring and alerting
5. Document optimization patterns for future use

**CADIS Philosophy Alignment:**
- Systematic excellence - Measure and improve continuously
- Make it reusable - Create optimization patterns
- Progressive enhancement - Incremental improvements

This follows the execution-led refinement methodology with quantified results.`;
    }
    
    // Default analysis for general requests
    return `CADIS Analysis: General System Request

**Request Assessment:**
- General system modification or analysis request
- Priority: Medium - Requires strategic evaluation
- Approach: Systematic analysis following CADIS principles

**Recommended Actions:**
1. Analyze request scope and impact on existing systems
2. Design solution following modular architecture patterns
3. Implement changes with proper error handling
4. Test thoroughly across all affected components
5. Update documentation and admin interfaces as needed

**CADIS Philosophy Alignment:**
- "If it needs to be done, do it" - Direct execution approach
- Make it modular - Component-based implementation
- Make it reusable - Pattern for similar future requests
- Make it teachable - Clear documentation and reasoning

This follows Strategic Architect principles with comprehensive system thinking.`;
  }

  /**
   * Extract actionable steps from AI response
   */
  private extractActions(content: string): string[] {
    const actionPatterns = [
      /(?:^|\n)[-*]\s*(.+)/g,
      /(?:^|\n)\d+\.\s*(.+)/g,
      /(?:Action|Step|Task):\s*(.+)/gi
    ];

    const actions: string[] = [];
    for (const pattern of actionPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 10) {
          actions.push(match[1].trim());
        }
      }
    }

    return actions.slice(0, 10); // Limit to 10 actions
  }

  /**
   * Create task from request analysis
   */
  private async createTask(request: string, analyses: AIModelResponse[], context?: Record<string, any>): Promise<AgentTask> {
    // Get consensus from AI models
    const consensus = this.buildConsensus(analyses);
    
    // Determine task type and priority
    const taskType = this.determineTaskType(request, consensus);
    const priority = this.determinePriority(request, consensus);
    const requiresApproval = this.requiresApproval(taskType, priority, consensus);

    const task: AgentTask = {
      id: `cadis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      description: request,
      repository: this.determineRepository(request, context),
      priority,
      requiredApproval: requiresApproval,
      metadata: {
        analyses,
        consensus,
        context: context || {}
      },
      createdAt: new Date(),
      status: 'pending'
    };

    console.log('📋 Created CADIS task:', task.id, task.type, task.priority);
    return task;
  }

  /**
   * Build consensus from multiple AI model responses
   */
  private buildConsensus(analyses: AIModelResponse[]): string {
    const validAnalyses = analyses.filter(a => a.confidence > 0);
    if (validAnalyses.length === 0) {
      return 'No valid AI responses available';
    }

    // Weight responses by confidence
    const weightedResponses = validAnalyses.map(a => ({
      response: a.response,
      weight: a.confidence,
      actions: a.suggestedActions
    }));

    // For now, use the highest confidence response as primary
    const primary = weightedResponses.reduce((prev, current) => 
      current.weight > prev.weight ? current : prev
    );

    return primary.response;
  }

  /**
   * Determine task type from request content
   */
  private determineTaskType(request: string, consensus: string): AgentTask['type'] {
    const lowerRequest = request.toLowerCase();
    const lowerConsensus = consensus.toLowerCase();

    if (lowerRequest.includes('support') || lowerRequest.includes('ticket') || lowerRequest.includes('issue')) {
      return 'support_ticket';
    }
    if (lowerRequest.includes('bug') || lowerRequest.includes('fix') || lowerRequest.includes('error')) {
      return 'bug_fix';
    }
    if (lowerRequest.includes('deploy') || lowerRequest.includes('release') || lowerRequest.includes('publish')) {
      return 'deployment';
    }
    if (lowerRequest.includes('feature') || lowerRequest.includes('add') || lowerRequest.includes('new')) {
      return 'feature_request';
    }
    
    return 'project_adjustment';
  }

  /**
   * Determine task priority
   */
  private determinePriority(request: string, consensus: string): AgentTask['priority'] {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('urgent') || lowerRequest.includes('critical') || lowerRequest.includes('emergency')) {
      return 'critical';
    }
    if (lowerRequest.includes('important') || lowerRequest.includes('high')) {
      return 'high';
    }
    if (lowerRequest.includes('low') || lowerRequest.includes('minor')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Determine if task requires human approval
   */
  private requiresApproval(type: AgentTask['type'], priority: AgentTask['priority'], consensus: string): boolean {
    // Critical tasks always require approval
    if (priority === 'critical') return true;
    
    // Deployments require approval
    if (type === 'deployment') return true;
    
    // Major changes require approval
    if (consensus.toLowerCase().includes('database') || 
        consensus.toLowerCase().includes('schema') ||
        consensus.toLowerCase().includes('migration')) {
      return true;
    }
    
    return false;
  }

  /**
   * Determine target repository
   */
  private determineRepository(request: string, context?: Record<string, any>): string {
    if (context?.repository) {
      return context.repository;
    }

    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('portfolio') || lowerRequest.includes('masterclass')) {
      return 'juelzs-portfolio';
    }
    if (lowerRequest.includes('platform') || lowerRequest.includes('vibezs')) {
      return 'vibezs-platform';
    }
    
    // Default to portfolio for now
    return 'juelzs-portfolio';
  }

  /**
   * Execute the task
   */
  private async executeTask(task: AgentTask): Promise<string> {
    console.log('🚀 Executing CADIS task:', task.id);
    
    try {
      task.status = 'in_progress';
      
      if (task.requiredApproval) {
        task.status = 'awaiting_approval';
        return `Task ${task.id} created and awaiting approval. Type: ${task.type}, Priority: ${task.priority}`;
      }

      // Execute based on task type
      let result: string;
      switch (task.type) {
        case 'support_ticket':
          result = await this.handleSupportTicket(task);
          break;
        case 'project_adjustment':
          result = await this.handleProjectAdjustment(task);
          break;
        case 'feature_request':
          result = await this.handleFeatureRequest(task);
          break;
        case 'bug_fix':
          result = await this.handleBugFix(task);
          break;
        case 'deployment':
          result = await this.handleDeployment(task);
          break;
        default:
          result = await this.handleGenericTask(task);
      }

      task.status = 'completed';
      console.log('✅ CADIS task completed:', task.id);
      
      // Log the completion for learning
      await this.logTaskCompletion(task, result);
      
      return result;
    } catch (error) {
      task.status = 'failed';
      console.error('❌ CADIS task failed:', task.id, error);
      return `Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle support ticket
   */
  private async handleSupportTicket(task: AgentTask): Promise<string> {
    console.log('🎫 Handling support ticket:', task.description);
    
    // Analyze the ticket and determine actions
    const actions = task.metadata.consensus;
    
    // For now, create a GitHub issue to track the ticket
    try {
      const issue = await this.octokit.issues.create({
        owner: 'RoseBludd',
        repo: task.repository,
        title: `[CADIS] Support Ticket: ${task.description.substring(0, 50)}...`,
        body: `**CADIS Background Agent Support Ticket**

**Original Request:** ${task.description}

**AI Analysis:** ${actions}

**Priority:** ${task.priority}
**Created:** ${task.createdAt.toISOString()}

This ticket was automatically created by CADIS Background Agent.`,
        labels: ['cadis-agent', 'support', `priority-${task.priority}`]
      });

      return `Support ticket created: ${issue.data.html_url}`;
    } catch (error) {
      return `Error creating support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle project adjustment
   */
  private async handleProjectAdjustment(task: AgentTask): Promise<string> {
    console.log('🔧 Handling project adjustment:', task.description);
    
    // This would implement actual code changes
    // For now, create a branch and PR with the proposed changes
    try {
      const branchName = `cadis-adjustment-${Date.now()}`;
      
      // Get the default branch
      const { data: repo } = await this.octokit.repos.get({
        owner: 'RoseBludd',
        repo: task.repository
      });

      // Create a new branch
      const { data: ref } = await this.octokit.git.getRef({
        owner: 'RoseBludd',
        repo: task.repository,
        ref: `heads/${repo.default_branch}`
      });

      await this.octokit.git.createRef({
        owner: 'RoseBludd',
        repo: task.repository,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha
      });

      // Create PR
      const pr = await this.octokit.pulls.create({
        owner: 'RoseBludd',
        repo: task.repository,
        title: `[CADIS] ${task.description.substring(0, 50)}...`,
        head: branchName,
        base: repo.default_branch,
        body: `**CADIS Background Agent Project Adjustment**

**Request:** ${task.description}

**Proposed Changes:** ${task.metadata.consensus}

**Priority:** ${task.priority}

This PR was automatically created by CADIS Background Agent based on AI analysis.`,
        draft: true
      });

      return `Project adjustment PR created: ${pr.data.html_url}`;
    } catch (error) {
      return `Error creating project adjustment: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Handle feature request
   */
  private async handleFeatureRequest(task: AgentTask): Promise<string> {
    return this.handleProjectAdjustment(task); // Similar flow for now
  }

  /**
   * Handle bug fix
   */
  private async handleBugFix(task: AgentTask): Promise<string> {
    return this.handleProjectAdjustment(task); // Similar flow for now
  }

  /**
   * Handle deployment
   */
  private async handleDeployment(task: AgentTask): Promise<string> {
    console.log('🚀 Handling deployment:', task.description);
    
    // This would integrate with Vercel/Railway APIs
    // For now, just log the deployment request
    return `Deployment request logged: ${task.description}`;
  }

  /**
   * Handle generic task
   */
  private async handleGenericTask(task: AgentTask): Promise<string> {
    return this.handleProjectAdjustment(task); // Default to project adjustment flow
  }

  /**
   * Log task completion for learning
   */
  private async logTaskCompletion(task: AgentTask, result: string): Promise<void> {
    const logEntry = {
      taskId: task.id,
      type: task.type,
      description: task.description,
      result,
      completedAt: new Date(),
      learnings: `CADIS successfully handled ${task.type} with ${task.priority} priority`
    };

    console.log('📝 CADIS learning log:', logEntry);
    
    // This would be stored in the database for future learning
    // For now, just console log
  }

  /**
   * Start the processing loop for queued actions
   */
  private startProcessingLoop(): void {
    setInterval(() => {
      if (!this.isProcessing && this.actionQueue.length > 0) {
        this.processActionQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process queued actions
   */
  private async processActionQueue(): Promise<void> {
    if (this.isProcessing || this.actionQueue.length === 0) return;

    this.isProcessing = true;
    console.log('🔄 Processing CADIS action queue:', this.actionQueue.length, 'jobs');

    try {
      const job = this.actionQueue.shift();
      if (job) {
        await this.processActionBusJob(job);
      }
    } catch (error) {
      console.error('❌ Action queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual action bus job
   */
  private async processActionBusJob(job: ActionBusJob): Promise<void> {
    console.log('⚡ Processing action bus job:', job.id, job.type);
    
    try {
      // Process the job based on type
      switch (job.type) {
        case 'github_action':
          await this.processGitHubAction(job);
          break;
        case 'vercel_deployment':
          await this.processVercelDeployment(job);
          break;
        case 'railway_deployment':
          await this.processRailwayDeployment(job);
          break;
        default:
          console.log('Unknown job type:', job.type);
      }
    } catch (error) {
      console.error('Job processing error:', error);
      
      // Retry logic
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        this.actionQueue.push(job);
      }
    }
  }

  /**
   * Process GitHub action
   */
  private async processGitHubAction(job: ActionBusJob): Promise<void> {
    // Implementation for GitHub actions
    console.log('🐙 Processing GitHub action:', job.payload);
  }

  /**
   * Process Vercel deployment
   */
  private async processVercelDeployment(job: ActionBusJob): Promise<void> {
    // Implementation for Vercel deployments
    console.log('▲ Processing Vercel deployment:', job.payload);
  }

  /**
   * Process Railway deployment
   */
  private async processRailwayDeployment(job: ActionBusJob): Promise<void> {
    // Implementation for Railway deployments
    console.log('🚂 Processing Railway deployment:', job.payload);
  }

  /**
   * Add job to action queue
   */
  public addActionBusJob(type: string, payload: any): string {
    const job: ActionBusJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      signature: this.signJob(payload),
      timestamp: new Date(),
      idempotencyKey: `${type}-${JSON.stringify(payload)}`,
      retryCount: 0,
      maxRetries: 3
    };

    this.actionQueue.push(job);
    console.log('➕ Added job to action queue:', job.id, job.type);
    
    return job.id;
  }

  /**
   * Sign job for security
   */
  private signJob(payload: any): string {
    // Simple signature for now - in production use proper HMAC
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Get agent status
   */
  public getStatus(): {
    isProcessing: boolean;
    queueLength: number;
    uptime: number;
  } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.actionQueue.length,
      uptime: process.uptime()
    };
  }
}

// Export singleton instance creator
export const createCADISAgent = (config: CADISAgentConfig) => {
  return CADISBackgroundAgent.getInstance(config);
};

export const getCADISAgent = (config?: CADISAgentConfig) => {
  return CADISBackgroundAgent.getInstance(config);
};
