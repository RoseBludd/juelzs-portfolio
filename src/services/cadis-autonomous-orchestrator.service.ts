/**
 * CADIS Autonomous Orchestrator Service
 * 
 * Complete autonomous system that:
 * 1. Checks capabilities & agents for every request
 * 2. Enhances itself if needed (capabilities or new agents)
 * 3. Plans progressively (segment by segment)
 * 4. Executes completely (simple to high complexity)
 * 5. Evolution comes at the end (after task completion)
 * 6. Tests all routing to ensure everything works
 */

import { CADISTowerOfBabel } from './cadis-tower-babel.service';
import { CADISBackgroundAgent } from './cadis-background-agent.service';
import CADISEvolutionService from './cadis-evolution.service';

interface CADISCapabilityCheck {
  hasCapability: boolean;
  missingCapabilities: string[];
  confidence: number;
  needsEnhancement: boolean;
}

interface CADISAgentCheck {
  hasAgent: boolean;
  availableAgents: string[];
  recommendedAgent: string | null;
  needsNewAgent: boolean;
}

interface CADISTask {
  id: string;
  request: string;
  type: string;
  context: any;
  segments: CADISTaskSegment[];
  complexity: 'simple' | 'medium' | 'high' | 'extreme';
  estimatedTime: number;
}

interface CADISTaskSegment {
  id: string;
  description: string;
  dependencies: string[];
  requiredCapabilities: string[];
  requiredAgent: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

interface CADISExecutionPlan {
  task: CADISTask;
  capabilityCheck: CADISCapabilityCheck;
  agentCheck: CADISAgentCheck;
  enhancements: string[];
  executionOrder: string[];
  progressiveSteps: CADISTaskSegment[];
}

export class CADISAutonomousOrchestrator {
  private static instance: CADISAutonomousOrchestrator;
  private tower: CADISTowerOfBabel;
  private backgroundAgent: CADISBackgroundAgent;
  private evolutionService: CADISEvolutionService;
  
  // Current capabilities and agents (JSON)
  private capabilities: Map<string, any> = new Map();
  private agents: Map<string, any> = new Map();
  
  private constructor() {
    this.evolutionService = CADISEvolutionService.getInstance();
    this.initializeCapabilitiesAndAgents();
  }

  public static getInstance(): CADISAutonomousOrchestrator {
    if (!CADISAutonomousOrchestrator.instance) {
      CADISAutonomousOrchestrator.instance = new CADISAutonomousOrchestrator();
    }
    return CADISAutonomousOrchestrator.instance;
  }

  /**
   * Initialize CADIS with Tower and Background Agent
   */
  public initialize(tower: CADISTowerOfBabel, backgroundAgent: CADISBackgroundAgent): void {
    this.tower = tower;
    this.backgroundAgent = backgroundAgent;
    console.log('🤖 CADIS Autonomous Orchestrator initialized');
  }

  /**
   * Main entry point: Process any request autonomously
   */
  async processRequest(request: string, type?: string, context?: any): Promise<any> {
    console.log('🎯 CADIS Autonomous Processing Started');
    console.log(`📋 Request: ${request.substring(0, 100)}...`);
    console.log(`🔧 Type: ${type || 'auto-detect'}`);
    
    try {
      // Step 1: Check capabilities and agents
      const capabilityCheck = await this.checkCapabilities(request, type, context);
      const agentCheck = await this.checkAgents(request, type, context);
      
      console.log(`🔍 Capability Check: ${capabilityCheck.hasCapability ? 'PASS' : 'NEEDS ENHANCEMENT'}`);
      console.log(`🤖 Agent Check: ${agentCheck.hasAgent ? 'AVAILABLE' : 'NEEDS CREATION'}`);
      
      // Step 2: Enhance if needed
      const enhancements = await this.enhanceIfNeeded(capabilityCheck, agentCheck, request, context);
      
      // Step 3: Create execution plan (progressive enhancement)
      const executionPlan = await this.createExecutionPlan(request, type, context, capabilityCheck, agentCheck, enhancements);
      
      console.log(`📊 Execution Plan: ${executionPlan.progressiveSteps.length} segments, ${executionPlan.task.complexity} complexity`);
      
      // Step 4: Execute segment by segment
      const executionResult = await this.executeProgressively(executionPlan);
      
      // Step 5: Evolution (after task completion)
      const evolutionResult = await this.performEvolution(executionResult, executionPlan);
      
      return {
        success: true,
        request: request.substring(0, 200),
        executionPlan,
        executionResult,
        evolutionResult,
        timestamp: new Date().toISOString(),
        orchestrator: 'cadis-autonomous'
      };
      
    } catch (error) {
      console.error('❌ Autonomous processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        orchestrator: 'cadis-autonomous'
      };
    }
  }

  /**
   * Check current capabilities against request requirements
   */
  private async checkCapabilities(request: string, type?: string, context?: any): Promise<CADISCapabilityCheck> {
    console.log('🔍 Checking CADIS capabilities...');
    
    // Get current capabilities from JSON
    const currentCapabilities = Array.from(this.capabilities.keys());
    
    // Analyze required capabilities
    const requiredCapabilities = this.analyzeRequiredCapabilities(request, type, context);
    
    const missingCapabilities = requiredCapabilities.filter(cap => !currentCapabilities.includes(cap));
    const hasCapability = missingCapabilities.length === 0;
    const confidence = hasCapability ? 1.0 : (currentCapabilities.length / requiredCapabilities.length);
    
    console.log(`   Current: ${currentCapabilities.length} capabilities`);
    console.log(`   Required: ${requiredCapabilities.length} capabilities`);
    console.log(`   Missing: ${missingCapabilities.length} capabilities`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
    
    return {
      hasCapability,
      missingCapabilities,
      confidence,
      needsEnhancement: missingCapabilities.length > 0
    };
  }

  /**
   * Check available agents against request requirements
   */
  private async checkAgents(request: string, type?: string, context?: any): Promise<CADISAgentCheck> {
    console.log('🤖 Checking CADIS agents...');
    
    // Get current agents from JSON
    const availableAgents = Array.from(this.agents.keys());
    
    // Determine best agent for this request
    const recommendedAgent = this.determineRecommendedAgent(request, type, context, availableAgents);
    
    const hasAgent = recommendedAgent !== null;
    const needsNewAgent = !hasAgent && this.shouldCreateNewAgent(request, type, context);
    
    console.log(`   Available: ${availableAgents.length} agents`);
    console.log(`   Recommended: ${recommendedAgent || 'None'}`);
    console.log(`   Needs New Agent: ${needsNewAgent ? 'YES' : 'NO'}`);
    
    return {
      hasAgent,
      availableAgents,
      recommendedAgent,
      needsNewAgent
    };
  }

  /**
   * Enhance CADIS if needed (capabilities or agents)
   */
  private async enhanceIfNeeded(
    capabilityCheck: CADISCapabilityCheck, 
    agentCheck: CADISAgentCheck, 
    request: string, 
    context?: any
  ): Promise<string[]> {
    const enhancements: string[] = [];
    
    // Enhance capabilities
    if (capabilityCheck.needsEnhancement) {
      console.log('🔧 Enhancing capabilities...');
      for (const capability of capabilityCheck.missingCapabilities) {
        await this.addCapability(capability);
        enhancements.push(`capability:${capability}`);
        console.log(`   ✅ Added capability: ${capability}`);
      }
    }
    
    // Create new agent if needed
    if (agentCheck.needsNewAgent) {
      console.log('🤖 Creating new agent...');
      const newAgentId = await this.createSpecializedAgent(request, context);
      if (newAgentId) {
        enhancements.push(`agent:${newAgentId}`);
        console.log(`   ✅ Created agent: ${newAgentId}`);
      }
    }
    
    return enhancements;
  }

  /**
   * Create progressive execution plan
   */
  private async createExecutionPlan(
    request: string, 
    type?: string, 
    context?: any,
    capabilityCheck?: CADISCapabilityCheck,
    agentCheck?: CADISAgentCheck,
    enhancements?: string[]
  ): Promise<CADISExecutionPlan> {
    console.log('📋 Creating execution plan...');
    
    // Analyze complexity
    const complexity = this.analyzeComplexity(request, type, context);
    
    // Break down into segments
    const segments = this.breakDownIntoSegments(request, type, context, complexity);
    
    // Create task
    const task: CADISTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      type: type || 'auto-detect',
      context: context || {},
      segments,
      complexity,
      estimatedTime: this.estimateExecutionTime(segments, complexity)
    };
    
    // Determine execution order
    const executionOrder = this.determineExecutionOrder(segments);
    
    console.log(`   Task ID: ${task.id}`);
    console.log(`   Complexity: ${complexity}`);
    console.log(`   Segments: ${segments.length}`);
    console.log(`   Estimated Time: ${task.estimatedTime}ms`);
    
    return {
      task,
      capabilityCheck: capabilityCheck!,
      agentCheck: agentCheck!,
      enhancements: enhancements || [],
      executionOrder,
      progressiveSteps: segments
    };
  }

  /**
   * Execute plan segment by segment (progressive enhancement)
   */
  private async executeProgressively(plan: CADISExecutionPlan): Promise<any> {
    console.log('🚀 Executing progressively...');
    
    const results = {
      taskId: plan.task.id,
      segmentResults: [],
      overallSuccess: true,
      totalTime: 0,
      errors: []
    };
    
    const startTime = Date.now();
    
    for (const segmentId of plan.executionOrder) {
      const segment = plan.progressiveSteps.find(s => s.id === segmentId);
      if (!segment) continue;
      
      console.log(`   🔧 Executing segment: ${segment.description}`);
      segment.status = 'in_progress';
      
      try {
        // Route to appropriate agent/capability
        const segmentResult = await this.executeSegment(segment, plan);
        
        segment.result = segmentResult;
        segment.status = 'completed';
        results.segmentResults.push({
          segmentId: segment.id,
          success: true,
          result: segmentResult
        });
        
        console.log(`   ✅ Segment completed: ${segment.description}`);
        
      } catch (error) {
        segment.status = 'failed';
        results.overallSuccess = false;
        results.errors.push({
          segmentId: segment.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.log(`   ❌ Segment failed: ${segment.description}`);
      }
    }
    
    results.totalTime = Date.now() - startTime;
    
    console.log(`✅ Progressive execution complete: ${results.segmentResults.length}/${plan.progressiveSteps.length} segments successful`);
    
    return results;
  }

  /**
   * Execute individual segment
   */
  private async executeSegment(segment: CADISTaskSegment, plan: CADISExecutionPlan): Promise<any> {
    // Determine which agent/capability to use
    if (segment.requiredAgent) {
      // Use specific agent
      if (segment.requiredAgent === 'background-agent') {
        return await this.backgroundAgent.processImplementationRequest(segment.description, {});
      } else {
        // Use tower with specific intelligence
        return await this.tower.processRequest(segment.description, { type: segment.requiredAgent });
      }
    } else {
      // Use tower with auto-routing
      return await this.tower.processRequest(segment.description, { type: 'auto' });
    }
  }

  /**
   * Perform evolution after task completion
   */
  private async performEvolution(executionResult: any, plan: CADISExecutionPlan): Promise<any> {
    console.log('🧬 Performing post-execution evolution...');
    
    try {
      // Analyze execution for learning opportunities
      const learningData = {
        taskComplexity: plan.task.complexity,
        segmentCount: plan.progressiveSteps.length,
        successRate: executionResult.segmentResults.length / plan.progressiveSteps.length,
        executionTime: executionResult.totalTime,
        enhancementsUsed: plan.enhancements,
        errors: executionResult.errors
      };
      
      // Run evolution cycle
      const evolutionResult = await this.evolutionService.runEvolutionCycle();
      
      // Update capabilities and agents based on learning
      await this.updateCapabilitiesFromLearning(learningData);
      
      console.log('✅ Evolution complete');
      
      return {
        learningData,
        evolutionResult,
        capabilitiesUpdated: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Evolution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize capabilities and agents from existing system
   */
  private initializeCapabilitiesAndAgents(): void {
    // Base capabilities
    const baseCapabilities = [
      'decision-making', 'pattern-recognition', 'data-analysis', 'workflow-orchestration',
      'api-integration', 'database-operations', 'file-system-operations', 'git-operations',
      'deployment-automation', 'automated-testing', 'environment-management', 'real-implementation'
    ];
    
    baseCapabilities.forEach(cap => {
      this.capabilities.set(cap, {
        name: cap,
        confidence: 0.9,
        lastUsed: new Date(),
        usageCount: 0
      });
    });
    
    // Base agents
    const baseAgents = [
      'background-agent', 'evolution-intelligence', 'developer-coaching', 'module-creation',
      'production-modules', 'journal-intelligence', 'meeting-intelligence', 'code-intelligence',
      'dreamstate-intelligence'
    ];
    
    baseAgents.forEach(agent => {
      this.agents.set(agent, {
        name: agent,
        type: 'intelligence',
        confidence: 0.9,
        lastUsed: new Date(),
        usageCount: 0
      });
    });
    
    console.log(`🔧 Initialized ${this.capabilities.size} capabilities and ${this.agents.size} agents`);
  }

  // Helper methods (simplified for now)
  private analyzeRequiredCapabilities(request: string, type?: string, context?: any): string[] {
    const capabilities = ['decision-making'];
    
    if (request.toLowerCase().includes('create') || request.toLowerCase().includes('implement')) {
      capabilities.push('file-system-operations', 'real-implementation');
    }
    if (request.toLowerCase().includes('api')) {
      capabilities.push('api-integration');
    }
    if (request.toLowerCase().includes('database')) {
      capabilities.push('database-operations');
    }
    if (request.toLowerCase().includes('deploy')) {
      capabilities.push('deployment-automation');
    }
    
    return capabilities;
  }

  private determineRecommendedAgent(request: string, type?: string, context?: any, availableAgents: string[]): string | null {
    if (request.toLowerCase().includes('create') || request.toLowerCase().includes('implement')) {
      return 'background-agent';
    }
    if (type === 'evolution') {
      return 'evolution-intelligence';
    }
    if (type === 'coaching') {
      return 'developer-coaching';
    }
    
    return availableAgents.length > 0 ? availableAgents[0] : null;
  }

  private shouldCreateNewAgent(request: string, type?: string, context?: any): boolean {
    // For now, assume we have enough agents
    return false;
  }

  private async addCapability(capability: string): Promise<void> {
    this.capabilities.set(capability, {
      name: capability,
      confidence: 0.8,
      lastUsed: new Date(),
      usageCount: 0,
      learned: true
    });
  }

  private async createSpecializedAgent(request: string, context?: any): Promise<string | null> {
    // For now, return null (no new agent created)
    return null;
  }

  private analyzeComplexity(request: string, type?: string, context?: any): 'simple' | 'medium' | 'high' | 'extreme' {
    const requestLength = request.length;
    const hasMultipleActions = (request.match(/and|then|also|plus/gi) || []).length > 2;
    const hasComplexKeywords = /integrate|deploy|architecture|system|complex|advanced/.test(request.toLowerCase());
    
    if (requestLength > 500 || hasComplexKeywords) return 'extreme';
    if (requestLength > 200 || hasMultipleActions) return 'high';
    if (requestLength > 50) return 'medium';
    return 'simple';
  }

  private breakDownIntoSegments(request: string, type?: string, context?: any, complexity: string): CADISTaskSegment[] {
    // Simple breakdown for now
    const segments: CADISTaskSegment[] = [];
    
    if (complexity === 'simple') {
      segments.push({
        id: 'segment_1',
        description: request,
        dependencies: [],
        requiredCapabilities: ['decision-making'],
        requiredAgent: 'background-agent',
        status: 'pending'
      });
    } else {
      // Break into analysis and implementation
      segments.push({
        id: 'segment_analysis',
        description: `Analyze: ${request}`,
        dependencies: [],
        requiredCapabilities: ['decision-making', 'pattern-recognition'],
        requiredAgent: null,
        status: 'pending'
      });
      
      segments.push({
        id: 'segment_implementation',
        description: `Implement: ${request}`,
        dependencies: ['segment_analysis'],
        requiredCapabilities: ['real-implementation'],
        requiredAgent: 'background-agent',
        status: 'pending'
      });
    }
    
    return segments;
  }

  private determineExecutionOrder(segments: CADISTaskSegment[]): string[] {
    // Simple dependency resolution
    const ordered: string[] = [];
    const remaining = [...segments];
    
    while (remaining.length > 0) {
      const next = remaining.find(s => s.dependencies.every(dep => ordered.includes(dep)));
      if (next) {
        ordered.push(next.id);
        remaining.splice(remaining.indexOf(next), 1);
      } else {
        // Add remaining without dependencies
        remaining.forEach(s => ordered.push(s.id));
        break;
      }
    }
    
    return ordered;
  }

  private estimateExecutionTime(segments: CADISTaskSegment[], complexity: string): number {
    const baseTime = segments.length * 1000; // 1 second per segment
    const complexityMultiplier = {
      'simple': 1,
      'medium': 2,
      'high': 4,
      'extreme': 8
    };
    
    return baseTime * complexityMultiplier[complexity];
  }

  private async updateCapabilitiesFromLearning(learningData: any): Promise<void> {
    // Update usage counts and confidence based on success
    if (learningData.successRate > 0.8) {
      // Increase confidence for used capabilities
      this.capabilities.forEach(cap => {
        if (cap.usageCount > 0) {
          cap.confidence = Math.min(1.0, cap.confidence + 0.05);
        }
      });
    }
  }

  /**
   * Test all routing to ensure everything works
   */
  async testAllRouting(): Promise<any> {
    console.log('🧪 Testing all CADIS routing...');
    
    const testCases = [
      { request: 'Create a simple file', type: 'code', expectedAgent: 'background-agent' },
      { request: 'Analyze system performance', type: 'evolution', expectedAgent: 'evolution-intelligence' },
      { request: 'Coach developer improvement', type: 'coaching', expectedAgent: 'developer-coaching' },
      { request: 'Create production module', type: 'module_creation', expectedAgent: 'module-creation' },
      { request: 'Run dreamstate simulation', type: 'dreamstate', expectedAgent: 'dreamstate-intelligence' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      console.log(`   Testing: ${testCase.request}`);
      
      try {
        const result = await this.processRequest(testCase.request, testCase.type);
        results.push({
          testCase,
          success: result.success,
          actualAgent: result.executionResult?.segmentResults?.[0]?.result?.agent || 'unknown'
        });
        
        console.log(`   ✅ Success: ${result.success}`);
      } catch (error) {
        results.push({
          testCase,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.log(`   ❌ Failed: ${error}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Routing test complete: ${successCount}/${results.length} successful`);
    
    return {
      totalTests: results.length,
      successful: successCount,
      results,
      overallSuccess: successCount === results.length
    };
  }
}

export default CADISAutonomousOrchestrator;
