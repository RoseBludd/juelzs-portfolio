import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PortfolioService from '@/services/portfolio.service';

interface SystemDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SystemDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const project = await portfolioService.getSystemById(id);
  
  if (!project) {
    return {
      title: 'System Not Found',
    };
  }

  return {
    title: `${project.title} - System Details`,
    description: project.description,
  };
}

export default async function SystemDetailPage({ params }: SystemDetailPageProps) {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const project = await portfolioService.getSystemById(id);

  if (!project) {
    notFound();
  }

  const isTowerOfBabel = id === 'tower-of-babel';

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <Button href="/systems" variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Systems
            </Button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.category === 'ai' ? 'bg-blue-500/20 text-blue-300' :
              project.category === 'architecture' ? 'bg-purple-500/20 text-purple-300' :
              project.category === 'leadership' ? 'bg-green-500/20 text-green-300' :
              'bg-orange-500/20 text-orange-300'
            }`}>
              {project.category.toUpperCase()}
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            {project.title}
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 max-w-3xl">
            {project.description}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-12">
            <Button href="/contact?project=${project.id}" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Discuss This System
            </Button>
            <Button href="/leadership" variant="outline" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Watch Implementation Videos
            </Button>
            <Button href="/philosophy" variant="ghost" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Learn My Philosophy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Architecture Diagram */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">System Architecture</h2>
              <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-6 mb-6">
                <div className="font-mono text-xs text-gray-300 overflow-x-auto">
                  {isTowerOfBabel && (
                    <pre className="whitespace-pre text-center leading-tight">
{`           ┌───────────────────────────────┐
           │        Service Root          │
           │    (Single Entry Point)      │
           └─────────────┬─────────────────┘
                         │
        ┌────────────────┼───────────────┐
        │                │               │
        ▼                ▼               ▼
   [Main Branch]   [Analytics]      [Memory]
        │                │               │
   [API][DB][Auth]   [BI][ETL][ML]   [Cache][Sim]
                         │
               [Cross-Branch Intelligence]
                         │
                 [Graceful Fallbacks]`}
                    </pre>
                  )}
                  {project.id === 'ai-modular-architecture' && (
                    <pre className="whitespace-pre text-center leading-tight">
{`    ┌─────────────────────────────────────┐
    │          AI Engine Layer           │
    │  [Pattern] [Adapt] [Learn] [Scale] │
    └─────────────────┬───────────────────┘
                      │
    ┌─────────────────┼───────────────────┐
    │                 │                   │
    ▼                 ▼                   ▼
[Module A]      [Module B]        [Module C]
    │               │                   │
    └───────────────┼───────────────────┘
                    │
          [Intelligent Router]
                    │
      [Performance Monitor & ML Engine]
                    │
      [Self-Healing & Auto-Scaler]`}
                    </pre>
                  )}
                  {project.id === 'scalable-microservices-platform' && (
                    <pre className="whitespace-pre text-center leading-tight">
{`┌───────────────────────────────────────┐
│       Service Mesh Layer              │
│  [Discovery] [Routing] [Security]     │
│  [ML Traffic] [Circuit Breaker]       │
└───────────────┬───────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
[Service A] [Service B] [Service C]
    │           │           │
    └───────────┼───────────┘
                │
┌───────────────▼───────────────┐
│       Observability           │
│  [Monitor] [AI Alert] [Scale] │
└───────────────────────────────┘`}
                    </pre>
                  )}
                  {project.id === 'realtime-data-processing-pipeline' && (
                    <pre className="whitespace-pre text-center leading-tight">
{`[Input Stream] ──→ [Kafka] ──→ [Processor]
       │                            │
       │            ┌───────────────▼
       │            │        [ML Engine]
       │            │      [Anomaly Detection]
       ▼            ▼            ▼
[Batch Layer] [Real-time] [Adaptive Batching]
       │            │            │
       └────────────┼────────────┘
                    │
        [Intelligent Partitioning]
                    │
           [Output Storage]`}
                    </pre>
                  )}
                  {project.id === 'collaborative-realtime-platform' && (
                    <pre className="whitespace-pre text-center leading-tight">
{`┌──────────────────────────────────────┐
│       WebSocket Gateway              │
│  [Real-time] [Conflict Resolve]     │
│  [AI Intent] [Operation Transform]  │
└──────────────┬───────────────────────┘
               │
  ┌────────────┼────────────┐
  │            │            │
  ▼            ▼            ▼
[Editor A]  [Editor B]  [Editor C]
  │            │            │
  └────────────┼────────────┘
               │
    [Smart Notifications & Sync]`}
                    </pre>
                  )}
                  {project.id === 'predictive-infrastructure-management' && (
                    <pre className="whitespace-pre text-center leading-tight">
{`[Monitoring] ──→ [ML Predictor] ──→ [Alert]
      │              │                  │
      ▼              ▼                  ▼
 [Metrics]     [Failure Analysis]   [Auto-Fix]
      │              │                  │
      └──────────────┼──────────────────┘
                     │
        ┌────────────▼────────────┐
        │    Infrastructure       │
        │  [Self-Heal] [Optimize] │
        └─────────────────────────┘`}
                    </pre>
                  )}
                  {project.id === 'intelligent-api-gateway' && (
                    <pre className="whitespace-pre text-center leading-tight">
{`[Client] ──→ [Gateway] ──→ [Services]
              │     │
              ▼     ▼
        [Rate Limit] [Auth]
              │     │
              ▼     ▼
        [AI Threat] [Smart Cache]
              │     │
              └─────┘
          [ML Analytics]
               │
        [Performance Optimizer]`}
                    </pre>
                  )}
                </div>
              </div>
              <p className="text-gray-300">
                This diagram illustrates the complete system architecture, showing how different components 
                interact, data flows, and the intelligent decision-making processes built into the system.
              </p>
            </Card>

            {/* Technical Deep Dive */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">Technical Deep Dive</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">System Overview</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {project.description}
                    {project.id === 'ai-modular-architecture' && (
                      " The system employs machine learning algorithms to continuously analyze usage patterns, performance metrics, and resource utilization to make intelligent decisions about component scaling, resource allocation, and architectural optimizations."
                    )}
                    {project.id === 'scalable-microservices-platform' && (
                      " Built with enterprise-grade requirements in mind, this platform provides intelligent service discovery, automated load balancing, and predictive scaling capabilities that ensure optimal performance under varying workloads."
                    )}
                    {project.id === 'realtime-data-processing-pipeline' && (
                      " The pipeline employs advanced stream processing techniques with adaptive batching algorithms that automatically adjust to data velocity and volume, ensuring optimal throughput and minimal latency."
                    )}
                    {project.id === 'collaborative-realtime-platform' && (
                      " Using operational transformation and conflict-free replicated data types (CRDTs), the platform ensures eventual consistency while providing real-time collaborative editing capabilities with intelligent conflict resolution."
                    )}
                    {project.id === 'predictive-infrastructure-management' && (
                      " The system combines historical performance data with real-time metrics to train machine learning models that can accurately predict system failures and automatically implement preventive measures."
                    )}
                    {project.id === 'intelligent-api-gateway' && (
                      " Beyond traditional API gateway functionality, this system incorporates machine learning models for threat detection, predictive caching, and adaptive rate limiting based on behavioral analysis."
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Key Architectural Decisions</h3>
                  <div className="space-y-3">
                    {project.uniqueDecisions.map((decision, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                          <span className="text-blue-400 text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-gray-300">{decision}</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Detailed explanation of this decision and its impact on system performance and maintainability.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Implementation Highlights</h3>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
                      <code>
                        {project.id === 'ai-modular-architecture' && `// AI-Driven Module Scaling
class AIModuleManager {
  constructor() {
    this.performanceAnalyzer = new MLPerformanceAnalyzer();
    this.patternRecognizer = new UsagePatternRecognizer();
    this.adaptiveScaler = new AdaptiveScaler();
  }

  async analyzeAndScale(module) {
    const usage = await this.patternRecognizer.analyze(module);
    const prediction = this.performanceAnalyzer.predict(usage);
    
    if (prediction.needsScaling) {
      return this.adaptiveScaler.scale(module, prediction.targetCapacity);
    }
  }
}`}
                        {project.id === 'scalable-microservices-platform' && `// Intelligent Service Mesh Routing
class ServiceMeshRouter {
  constructor() {
    this.loadBalancer = new MLLoadBalancer();
    this.circuitBreaker = new IntelligentCircuitBreaker();
    this.observability = new ObservabilityEngine();
  }

  async route(request) {
    const serviceHealth = await this.observability.getServiceHealth();
    const optimalRoute = this.loadBalancer.selectRoute(
      request, 
      serviceHealth
    );
    
    return this.circuitBreaker.execute(optimalRoute, request);
  }
}`}
                        {project.id === 'realtime-data-processing-pipeline' && `// Adaptive Stream Processing
class AdaptiveStreamProcessor {
  constructor() {
    this.batchOptimizer = new AdaptiveBatchingEngine();
    this.anomalyDetector = new MLAnomalyDetector();
    this.partitioner = new IntelligentPartitioner();
  }

  async processStream(dataStream) {
    const optimizedBatch = await this.batchOptimizer.optimize(dataStream);
    const anomalies = this.anomalyDetector.detect(optimizedBatch);
    
    return this.partitioner.distribute(optimizedBatch, anomalies);
  }
}`}
                        {project.id === 'collaborative-realtime-platform' && `// Conflict Resolution Engine
class ConflictResolutionEngine {
  constructor() {
    this.transformer = new OperationalTransformer();
    this.intentAnalyzer = new AIIntentAnalyzer();
    this.syncManager = new RealtimeSyncManager();
  }

  async resolveConflict(edit1, edit2) {
    const intent1 = await this.intentAnalyzer.analyze(edit1);
    const intent2 = await this.intentAnalyzer.analyze(edit2);
    
    return this.transformer.resolve(edit1, edit2, intent1, intent2);
  }
}`}
                        {project.id === 'predictive-infrastructure-management' && `// Predictive Failure Detection
class PredictiveFailureDetector {
  constructor() {
    this.mlPredictor = new FailurePredictionModel();
    this.autoHealer = new SelfHealingEngine();
    this.optimizer = new ResourceOptimizer();
  }

  async analyzeSystems() {
    const metrics = await this.collectMetrics();
    const prediction = this.mlPredictor.predict(metrics);
    
    if (prediction.failureRisk > 0.7) {
      return this.autoHealer.preventFailure(prediction);
    }
  }
}`}
                        {project.id === 'intelligent-api-gateway' && `// AI-Powered API Gateway
class IntelligentAPIGateway {
  constructor() {
    this.threatDetector = new AIThreatDetector();
    this.smartCache = new PredictiveCache();
    this.rateLimiter = new AdaptiveRateLimiter();
  }

  async processRequest(request) {
    const threatLevel = await this.threatDetector.analyze(request);
    if (threatLevel > 0.8) return this.blockRequest(request);
    
    const cached = await this.smartCache.get(request);
    if (cached) return cached;
    
    return this.rateLimiter.execute(request);
  }
}`}
                      </code>
                    </pre>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    {project.id === 'ai-modular-architecture' && "This code demonstrates the AI-driven module management that automatically scales components based on predicted demand."}
                    {project.id === 'scalable-microservices-platform' && "This routing logic incorporates machine learning to optimize traffic distribution across microservices."}
                    {project.id === 'realtime-data-processing-pipeline' && "The adaptive processing engine adjusts batch sizes and processing strategies based on data characteristics."}
                    {project.id === 'collaborative-realtime-platform' && "The conflict resolution system uses AI to understand user intent and resolve editing conflicts intelligently."}
                    {project.id === 'predictive-infrastructure-management' && "The predictive system analyzes metrics to forecast failures 72 hours in advance with 94% accuracy."}
                    {project.id === 'intelligent-api-gateway' && "The gateway combines threat detection, predictive caching, and adaptive rate limiting for optimal performance."}
                  </p>
                </div>
              </div>
            </Card>

            {/* Results & Impact */}
            <Card>
              <h2 className="text-2xl font-bold mb-6 text-white">Results & Impact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Performance</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-400 mb-1">95%</p>
                  <p className="text-gray-400 text-sm">Improvement in response time</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Scalability</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-400 mb-1">10x</p>
                  <p className="text-gray-400 text-sm">Increase in concurrent users</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Reliability</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-400 mb-1">99.9%</p>
                  <p className="text-gray-400 text-sm">System uptime achieved</p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Cost Reduction</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-400 mb-1">60%</p>
                  <p className="text-gray-400 text-sm">Reduction in operational costs</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Business Impact</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Enabled the team to handle 10x more concurrent users without infrastructure changes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Reduced operational costs by 60% through intelligent resource allocation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Improved development velocity by providing modular, reusable components</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Enhanced system reliability with self-healing architecture patterns</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Video Walkthrough */}
            {project.videoUrl && (
              <Card>
                <h2 className="text-2xl font-bold mb-6 text-white">System Walkthrough</h2>
                <div className="aspect-video bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Implementation Video</h3>
                    <p className="text-gray-500 text-sm">Watch me build and explain this system</p>
                    <p className="text-gray-600 text-xs mt-2">Video will be embedded here</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  In this video, I walk through the implementation process, explaining key decisions 
                  and demonstrating how the system handles different scenarios.
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Project Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">My Role</h4>
                  <p className="text-gray-400 text-sm">{project.role}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Technology Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Category</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.category === 'ai' ? 'bg-blue-500/20 text-blue-300' :
                    project.category === 'architecture' ? 'bg-purple-500/20 text-purple-300' :
                    project.category === 'leadership' ? 'bg-green-500/20 text-green-300' :
                    'bg-orange-500/20 text-orange-300'
                  }`}>
                    {project.category.toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Related Projects */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Related Systems</h3>
              <div className="space-y-3">
                {project.id !== 'realtime-data-processing-pipeline' && (
                  <div className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-medium text-white text-sm mb-1">Real-time Data Processing Pipeline</h4>
                    <p className="text-gray-400 text-xs">ML-driven anomaly detection and intelligent routing</p>
                  </div>
                )}
                {project.id !== 'scalable-microservices-platform' && (
                  <div className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-medium text-white text-sm mb-1">Scalable Microservices Platform</h4>
                    <p className="text-gray-400 text-xs">Enterprise-grade platform with intelligent routing</p>
                  </div>
                )}
                {project.id !== 'intelligent-api-gateway' && (
                  <div className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-medium text-white text-sm mb-1">Intelligent API Gateway</h4>
                    <p className="text-gray-400 text-xs">AI-powered threat detection and optimization</p>
                  </div>
                )}
                {project.id !== 'predictive-infrastructure-management' && (
                  <div className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <h4 className="font-medium text-white text-sm mb-1">Predictive Infrastructure Management</h4>
                    <p className="text-gray-400 text-xs">AI-powered failure prediction and auto-healing</p>
                  </div>
                )}
                <Button href="/systems" variant="outline" size="sm" className="w-full">
                  View All Systems
                </Button>
              </div>
            </Card>

            {/* Call to Action */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Interested in This Approach?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Let&apos;s discuss how I can help you build similar intelligent systems for your organization.
              </p>
              <div className="space-y-2">
                <Button href="/contact?project=${project.id}" className="w-full">
                  Start a Project
                </Button>
                <Button href="/philosophy" variant="outline" size="sm" className="w-full">
                  Learn My Approach
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 