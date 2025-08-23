/**
 * CADIS Integrations Hub Service
 * 
 * Central hub for all API integrations - like Zapier but for CADIS
 * Automatically manages services, documentation, and 24/7 operations
 * Stores all integrations in database with embedded functionality
 */

import DatabaseService from './database.service';

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'service';
  provider: string;
  baseUrl: string;
  authentication: {
    type: 'api-key' | 'oauth' | 'basic' | 'bearer';
    credentials: Record<string, string>;
  };
  capabilities: string[];
  endpoints: IntegrationEndpoint[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  status: 'active' | 'inactive' | 'testing' | 'deprecated';
  healthCheck: {
    url: string;
    method: string;
    expectedStatus: number;
    lastCheck: Date;
    isHealthy: boolean;
  };
  documentation: {
    description: string;
    usageExamples: string[];
    errorCodes: Record<string, string>;
    changelog: string[];
  };
  metrics: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    lastUsed: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IntegrationEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters: EndpointParameter[];
  responseSchema: any;
  examples: {
    request: any;
    response: any;
  };
}

interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export class CADISIntegrationsHub {
  private static instance: CADISIntegrationsHub;
  private databaseService: DatabaseService;
  private integrations: Map<string, Integration> = new Map();

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.initializeIntegrationsHub();
  }

  public static getInstance(): CADISIntegrationsHub {
    if (!CADISIntegrationsHub.instance) {
      CADISIntegrationsHub.instance = new CADISIntegrationsHub();
    }
    return CADISIntegrationsHub.instance;
  }

  /**
   * Initialize integrations hub and load existing integrations
   */
  private async initializeIntegrationsHub(): Promise<void> {
    console.log('🔌 Initializing CADIS Integrations Hub...');
    
    try {
      await this.createIntegrationsTable();
      await this.loadExistingIntegrations();
      await this.startHealthMonitoring();
      
      console.log(`✅ Integrations Hub initialized with ${this.integrations.size} integrations`);
    } catch (error) {
      console.error('❌ Failed to initialize Integrations Hub:', error);
    }
  }

  /**
   * Create integrations database table
   */
  private async createIntegrationsTable(): Promise<void> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS cadis_integrations (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          provider VARCHAR(255) NOT NULL,
          base_url TEXT,
          authentication JSONB,
          capabilities JSONB,
          endpoints JSONB,
          rate_limits JSONB,
          status VARCHAR(50) DEFAULT 'active',
          health_check JSONB,
          documentation JSONB,
          metrics JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_cadis_integrations_provider ON cadis_integrations(provider);
        CREATE INDEX IF NOT EXISTS idx_cadis_integrations_status ON cadis_integrations(status);
        CREATE INDEX IF NOT EXISTS idx_cadis_integrations_type ON cadis_integrations(type);
      `);
      
      console.log('✅ Integrations table created/verified');
    } finally {
      client.release();
    }
  }

  /**
   * Add new integration to the hub
   */
  async addIntegration(integrationData: Partial<Integration>): Promise<string> {
    console.log(`🔌 Adding integration: ${integrationData.name}`);
    
    const integration: Integration = {
      id: integrationData.id || `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: integrationData.name || 'Unknown Integration',
      type: integrationData.type || 'api',
      provider: integrationData.provider || 'Unknown Provider',
      baseUrl: integrationData.baseUrl || '',
      authentication: integrationData.authentication || { type: 'api-key', credentials: {} },
      capabilities: integrationData.capabilities || [],
      endpoints: integrationData.endpoints || [],
      rateLimits: integrationData.rateLimits || {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      status: integrationData.status || 'testing',
      healthCheck: integrationData.healthCheck || {
        url: integrationData.baseUrl + '/health',
        method: 'GET',
        expectedStatus: 200,
        lastCheck: new Date(),
        isHealthy: false
      },
      documentation: integrationData.documentation || {
        description: 'Auto-generated integration',
        usageExamples: [],
        errorCodes: {},
        changelog: []
      },
      metrics: integrationData.metrics || {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        lastUsed: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in database
    await this.storeIntegration(integration);
    
    // Store in memory
    this.integrations.set(integration.id, integration);
    
    // Perform initial health check
    await this.performHealthCheck(integration.id);
    
    console.log(`✅ Integration added: ${integration.name} (${integration.id})`);
    return integration.id;
  }

  /**
   * Auto-detect and add integration from API usage
   */
  async autoDetectIntegration(apiCall: {
    url: string;
    method: string;
    headers: Record<string, string>;
    response: any;
  }): Promise<string | null> {
    console.log(`🔍 Auto-detecting integration from: ${apiCall.url}`);
    
    try {
      // Parse URL to extract provider info
      const urlObj = new URL(apiCall.url);
      const provider = this.detectProvider(urlObj.hostname);
      const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
      
      // Check if integration already exists
      const existingIntegration = Array.from(this.integrations.values())
        .find(integration => integration.baseUrl === baseUrl);
        
      if (existingIntegration) {
        console.log(`✅ Integration already exists: ${existingIntegration.name}`);
        return existingIntegration.id;
      }
      
      // Create new integration
      const integrationData: Partial<Integration> = {
        name: `${provider} API`,
        type: 'api',
        provider: provider,
        baseUrl: baseUrl,
        authentication: this.detectAuthType(apiCall.headers),
        capabilities: this.detectCapabilities(apiCall.url, apiCall.response),
        endpoints: [{
          id: `endpoint_${Date.now()}`,
          name: urlObj.pathname.split('/').pop() || 'unknown',
          method: apiCall.method as any,
          path: urlObj.pathname,
          description: `Auto-detected endpoint for ${provider}`,
          parameters: [],
          responseSchema: this.generateSchema(apiCall.response),
          examples: {
            request: { url: apiCall.url, method: apiCall.method },
            response: apiCall.response
          }
        }],
        documentation: {
          description: `Auto-detected integration for ${provider} API`,
          usageExamples: [`${apiCall.method} ${apiCall.url}`],
          errorCodes: {},
          changelog: [`Auto-detected on ${new Date().toISOString()}`]
        }
      };
      
      return await this.addIntegration(integrationData);
      
    } catch (error) {
      console.error('❌ Failed to auto-detect integration:', error);
      return null;
    }
  }

  /**
   * Get integration by ID or provider
   */
  async getIntegration(identifier: string): Promise<Integration | null> {
    // Try by ID first
    if (this.integrations.has(identifier)) {
      return this.integrations.get(identifier)!;
    }
    
    // Try by provider name
    const integration = Array.from(this.integrations.values())
      .find(integration => 
        integration.provider.toLowerCase() === identifier.toLowerCase() ||
        integration.name.toLowerCase().includes(identifier.toLowerCase())
      );
      
    return integration || null;
  }

  /**
   * Execute API call through integration
   */
  async executeIntegrationCall(
    integrationId: string, 
    endpointName: string, 
    parameters: Record<string, any>
  ): Promise<any> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }
    
    const endpoint = integration.endpoints.find(ep => ep.name === endpointName);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointName}`);
    }
    
    console.log(`🔌 Executing ${integration.name} -> ${endpoint.name}`);
    
    try {
      // Build request
      const url = integration.baseUrl + endpoint.path;
      const headers = this.buildHeaders(integration.authentication);
      
      // Make request
      const startTime = Date.now();
      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: endpoint.method !== 'GET' ? JSON.stringify(parameters) : undefined
      });
      
      const responseTime = Date.now() - startTime;
      const responseData = await response.json();
      
      // Update metrics
      await this.updateMetrics(integration.id, response.ok, responseTime);
      
      console.log(`✅ ${integration.name} call completed (${responseTime}ms)`);
      return responseData;
      
    } catch (error) {
      await this.updateMetrics(integration.id, false, 0);
      console.error(`❌ ${integration.name} call failed:`, error);
      throw error;
    }
  }

  /**
   * Generate API documentation for all integrations
   */
  async generateAPIDocumentation(): Promise<string> {
    console.log('📚 Generating API documentation...');
    
    let documentation = `# CADIS Integrations Hub API Documentation\n\n`;
    documentation += `Generated: ${new Date().toISOString()}\n`;
    documentation += `Total Integrations: ${this.integrations.size}\n\n`;
    
    for (const integration of this.integrations.values()) {
      documentation += `## ${integration.name}\n\n`;
      documentation += `**Provider**: ${integration.provider}\n`;
      documentation += `**Type**: ${integration.type}\n`;
      documentation += `**Status**: ${integration.status}\n`;
      documentation += `**Base URL**: ${integration.baseUrl}\n\n`;
      
      documentation += `**Description**: ${integration.documentation.description}\n\n`;
      
      if (integration.capabilities.length > 0) {
        documentation += `**Capabilities**:\n`;
        integration.capabilities.forEach(cap => {
          documentation += `- ${cap}\n`;
        });
        documentation += `\n`;
      }
      
      documentation += `**Endpoints**:\n\n`;
      integration.endpoints.forEach(endpoint => {
        documentation += `### ${endpoint.method} ${endpoint.path}\n\n`;
        documentation += `${endpoint.description}\n\n`;
        
        if (endpoint.parameters.length > 0) {
          documentation += `**Parameters**:\n`;
          endpoint.parameters.forEach(param => {
            documentation += `- \`${param.name}\` (${param.type}${param.required ? ', required' : ''}): ${param.description}\n`;
          });
          documentation += `\n`;
        }
        
        documentation += `**Example Request**:\n`;
        documentation += `\`\`\`json\n${JSON.stringify(endpoint.examples.request, null, 2)}\n\`\`\`\n\n`;
        
        documentation += `**Example Response**:\n`;
        documentation += `\`\`\`json\n${JSON.stringify(endpoint.examples.response, null, 2)}\n\`\`\`\n\n`;
      });
      
      documentation += `---\n\n`;
    }
    
    return documentation;
  }

  /**
   * Get integration hub status and metrics
   */
  async getHubStatus(): Promise<any> {
    const activeIntegrations = Array.from(this.integrations.values()).filter(i => i.status === 'active');
    const healthyIntegrations = activeIntegrations.filter(i => i.healthCheck.isHealthy);
    
    return {
      totalIntegrations: this.integrations.size,
      activeIntegrations: activeIntegrations.length,
      healthyIntegrations: healthyIntegrations.length,
      healthRate: activeIntegrations.length > 0 ? (healthyIntegrations.length / activeIntegrations.length) : 0,
      integrations: Array.from(this.integrations.values()).map(integration => ({
        id: integration.id,
        name: integration.name,
        provider: integration.provider,
        status: integration.status,
        isHealthy: integration.healthCheck.isHealthy,
        totalRequests: integration.metrics.totalRequests,
        successRate: integration.metrics.successRate,
        lastUsed: integration.metrics.lastUsed
      }))
    };
  }

  // Helper methods
  private detectProvider(hostname: string): string {
    const providers = {
      'api.reonomy.com': 'Reonomy',
      'api.propertyradar.com': 'PropertyRadar',
      'api.bland.ai': 'Bland.ai',
      'api.elevenlabs.io': 'ElevenLabs',
      'api.openai.com': 'OpenAI',
      'api.anthropic.com': 'Anthropic',
      'api.vercel.com': 'Vercel',
      'api.github.com': 'GitHub'
    };
    
    return providers[hostname] || hostname.split('.')[0].toUpperCase();
  }

  private detectAuthType(headers: Record<string, string>): Integration['authentication'] {
    if (headers['Authorization']?.startsWith('Bearer ')) {
      return { type: 'bearer', credentials: {} };
    } else if (headers['Authorization']?.startsWith('Basic ')) {
      return { type: 'basic', credentials: {} };
    } else if (headers['x-api-key'] || headers['X-API-Key']) {
      return { type: 'api-key', credentials: {} };
    }
    
    return { type: 'api-key', credentials: {} };
  }

  private detectCapabilities(url: string, response: any): string[] {
    const capabilities: string[] = [];
    
    if (url.includes('search') || url.includes('query')) {
      capabilities.push('search');
    }
    if (url.includes('create') || url.includes('post')) {
      capabilities.push('create');
    }
    if (url.includes('update') || url.includes('put')) {
      capabilities.push('update');
    }
    if (url.includes('delete')) {
      capabilities.push('delete');
    }
    if (response && typeof response === 'object') {
      capabilities.push('json-response');
    }
    
    return capabilities;
  }

  private generateSchema(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return { type: typeof data };
    }
    
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.generateSchema(data[0]) : { type: 'any' }
      };
    }
    
    const schema: any = { type: 'object', properties: {} };
    
    for (const [key, value] of Object.entries(data)) {
      schema.properties[key] = this.generateSchema(value);
    }
    
    return schema;
  }

  private buildHeaders(auth: Integration['authentication']): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Note: In production, credentials would be retrieved securely
    // This is a placeholder for the authentication logic
    
    return headers;
  }

  private async storeIntegration(integration: Integration): Promise<void> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      await client.query(`
        INSERT INTO cadis_integrations (
          id, name, type, provider, base_url, authentication, capabilities,
          endpoints, rate_limits, status, health_check, documentation, metrics,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          name = $2, type = $3, provider = $4, base_url = $5,
          authentication = $6, capabilities = $7, endpoints = $8,
          rate_limits = $9, status = $10, health_check = $11,
          documentation = $12, metrics = $13, updated_at = $15
      `, [
        integration.id, integration.name, integration.type, integration.provider,
        integration.baseUrl, JSON.stringify(integration.authentication),
        JSON.stringify(integration.capabilities), JSON.stringify(integration.endpoints),
        JSON.stringify(integration.rateLimits), integration.status,
        JSON.stringify(integration.healthCheck), JSON.stringify(integration.documentation),
        JSON.stringify(integration.metrics), integration.createdAt, integration.updatedAt
      ]);
    } finally {
      client.release();
    }
  }

  private async loadExistingIntegrations(): Promise<void> {
    const client = await this.databaseService.getPoolClient();
    
    try {
      const result = await client.query('SELECT * FROM cadis_integrations WHERE status != $1', ['deprecated']);
      
      result.rows.forEach(row => {
        const integration: Integration = {
          id: row.id,
          name: row.name,
          type: row.type,
          provider: row.provider,
          baseUrl: row.base_url,
          authentication: row.authentication,
          capabilities: row.capabilities,
          endpoints: row.endpoints,
          rateLimits: row.rate_limits,
          status: row.status,
          healthCheck: row.health_check,
          documentation: row.documentation,
          metrics: row.metrics,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        
        this.integrations.set(integration.id, integration);
      });
      
      console.log(`📚 Loaded ${result.rows.length} existing integrations`);
    } finally {
      client.release();
    }
  }

  private async performHealthCheck(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;
    
    try {
      const response = await fetch(integration.healthCheck.url, {
        method: integration.healthCheck.method,
        timeout: 5000
      });
      
      const isHealthy = response.status === integration.healthCheck.expectedStatus;
      
      // Update health status
      integration.healthCheck.lastCheck = new Date();
      integration.healthCheck.isHealthy = isHealthy;
      
      await this.storeIntegration(integration);
      
      return isHealthy;
    } catch (error) {
      integration.healthCheck.isHealthy = false;
      integration.healthCheck.lastCheck = new Date();
      await this.storeIntegration(integration);
      return false;
    }
  }

  private async updateMetrics(integrationId: string, success: boolean, responseTime: number): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return;
    
    integration.metrics.totalRequests++;
    integration.metrics.lastUsed = new Date();
    
    if (success) {
      const currentAvg = integration.metrics.averageResponseTime;
      const totalRequests = integration.metrics.totalRequests;
      integration.metrics.averageResponseTime = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
    }
    
    // Calculate success rate
    const successfulRequests = Math.round(integration.metrics.totalRequests * integration.metrics.successRate);
    integration.metrics.successRate = success 
      ? (successfulRequests + 1) / integration.metrics.totalRequests
      : successfulRequests / integration.metrics.totalRequests;
    
    await this.storeIntegration(integration);
  }

  private async startHealthMonitoring(): Promise<void> {
    // Perform health checks every 5 minutes
    setInterval(async () => {
      console.log('🏥 Performing health checks...');
      
      for (const integration of this.integrations.values()) {
        if (integration.status === 'active') {
          await this.performHealthCheck(integration.id);
        }
      }
    }, 5 * 60 * 1000);
  }
}

export default CADISIntegrationsHub;
