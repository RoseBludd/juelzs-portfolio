import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Sample journal entries with realistic data
const sampleEntries = [
  {
    id: 'journal_arch_001',
    title: 'Migration to Microservices Architecture',
    content: `## Context
Our monolithic application was hitting scalability limits at ~50k concurrent users. Database connections were maxing out, and deploys were taking 45+ minutes with high risk of rollback.

## Decision
Migrated to microservices architecture using Docker containers with API Gateway pattern.

## Implementation Approach
1. **Service Decomposition**: Split by business domain (User Service, Payment Service, Analytics Service)
2. **Data Strategy**: Database per service with event sourcing for consistency
3. **Communication**: REST APIs with async messaging via Kafka
4. **Deployment**: Kubernetes with auto-scaling based on CPU/memory metrics

## Results
- **Performance**: Response times improved from 800ms to 200ms average
- **Scalability**: Now handling 200k+ concurrent users
- **Deployment**: Deploy time reduced to 8 minutes with zero-downtime
- **Development**: Teams can work independently on services

## Challenges Solved
- **Database hotspots** → Service-specific databases
- **Deployment bottlenecks** → Independent service deployments  
- **Team coordination** → Clear service boundaries and APIs

## Key Learnings
- Start with well-defined service boundaries (Domain-Driven Design)
- Invest heavily in monitoring and observability from day one
- Event sourcing adds complexity but provides powerful audit trails
- Container orchestration (K8s) is essential for production microservices`,
    category: 'architecture',
    project_id: 'microservices-migration',
    project_name: 'E-commerce Platform Migration',
    tags: JSON.stringify(['microservices', 'architecture', 'scalability', 'kubernetes', 'performance']),
    architecture_diagrams: JSON.stringify([
      'https://example.com/microservices-diagram.png',
      'https://example.com/data-flow-diagram.png'
    ]),
    related_files: JSON.stringify([
      'https://github.com/example/microservices-config',
      'https://example.com/api-documentation.pdf'
    ]),
    metadata: JSON.stringify({
      difficulty: 8,
      impact: 9,
      learnings: [
        'Domain-Driven Design is crucial for service boundaries',
        'Monitoring and observability must be built-in from start',
        'Event sourcing provides powerful audit capabilities but adds complexity'
      ],
      nextSteps: [
        'Implement service mesh for enhanced security and observability',
        'Add automated performance testing to CI/CD pipeline',
        'Create disaster recovery procedures for distributed system'
      ],
      resources: [
        'https://microservices.io/patterns/',
        'https://kubernetes.io/docs/concepts/'
      ]
    }),
    created_at: new Date('2024-03-15'),
    updated_at: new Date('2024-03-15')
  },
  
  {
    id: 'journal_perf_001',
    title: 'Database Query Optimization Crisis',
    content: `## Problem Discovery
Production alerts started firing at 3 AM - database queries taking 15+ seconds, causing timeouts across the platform. User complaints flooding support channels.

## Root Cause Analysis
**Investigation Process:**
1. **Query Analysis**: Found 3 specific queries consuming 80% of DB resources
2. **Execution Plans**: Missing indexes on frequently joined columns
3. **Data Growth**: Tables had grown 10x in size over 6 months without index optimization
4. **Query Patterns**: N+1 query problems in ORM relationships

## Solution Implementation
### Immediate Fixes (0-2 hours)
- Added missing indexes on user_id, created_at columns
- Implemented query result caching for read-heavy operations
- Added connection pooling to prevent connection exhaustion

### Medium-term Optimizations (1-3 days)  
- Rewrote ORM queries to use explicit JOINs instead of lazy loading
- Implemented database read replicas for analytics queries
- Added query performance monitoring and alerting

### Long-term Architecture (1-2 weeks)
- Implemented database sharding strategy for user data
- Added Redis caching layer for frequently accessed data
- Created automated query performance regression testing

## Results
- **Query Performance**: Average query time reduced from 15s to 150ms
- **System Stability**: Zero database-related incidents in 3 months since fix
- **User Experience**: Page load times improved from 8s to 1.2s
- **Cost Optimization**: Reduced database instance size by 40%

## Prevention Measures
- Automated performance testing in CI/CD pipeline
- Database query review process for all PR merges
- Proactive monitoring with performance degradation alerts
- Regular database maintenance and optimization schedule`,
    category: 'problem-solving',
    project_id: 'performance-optimization',
    project_name: 'Platform Performance Crisis Response',
    tags: JSON.stringify(['performance', 'database', 'optimization', 'crisis-response', 'monitoring']),
    architecture_diagrams: JSON.stringify([]),
    related_files: JSON.stringify([
      'https://example.com/query-optimization-report.pdf',
      'https://github.com/example/db-performance-scripts'
    ]),
    metadata: JSON.stringify({
      difficulty: 7,
      impact: 9,
      learnings: [
        'Proactive monitoring prevents most performance crises',
        'ORM lazy loading can create hidden N+1 query problems',
        'Database indexing strategy must evolve with data growth'
      ],
      nextSteps: [
        'Implement automated query performance regression testing',
        'Create database capacity planning process',
        'Establish database performance review checkpoints'
      ],
      resources: [
        'https://use-the-index-luke.com/',
        'https://explain.depesz.com/'
      ]
    }),
    created_at: new Date('2024-03-10'),
    updated_at: new Date('2024-03-12')
  },

  {
    id: 'journal_ai_001',
    title: 'AI-Driven Code Review System Implementation',
    content: `## Innovation Objective
Reduce code review time while maintaining quality standards. Our team was spending 40% of development time on manual code reviews.

## Solution Architecture
Built an AI-powered code review assistant using GPT-4 and static analysis tools.

### System Components
**1. Code Analysis Pipeline**
- GitHub webhook triggers on PR creation
- Static analysis (ESLint, SonarQube, security scanners)
- AI review using GPT-4 with custom prompts for our coding standards

**2. AI Review Engine**
- Custom prompts for architecture patterns, security, performance
- Context-aware analysis using repository history and patterns
- Integration with existing CI/CD pipeline

**3. Developer Interface**
- Automated PR comments with specific suggestions
- Confidence scoring for AI recommendations
- Easy accept/reject workflow for developers

## Implementation Process
### Phase 1: MVP (2 weeks)
- Basic AI review for common issues (unused variables, security patterns)
- Integration with GitHub PR workflow
- Simple confidence scoring system

### Phase 2: Enhanced Intelligence (4 weeks)
- Custom training on our codebase patterns
- Architecture decision detection and suggestions
- Performance optimization recommendations

### Phase 3: Learning System (6 weeks)
- Feedback loop from developer accept/reject decisions
- Continuous improvement of AI prompts
- Integration with team coding standards documentation

## Results & Metrics
**Developer Productivity:**
- Code review time reduced from 2.5 hours to 45 minutes average
- 85% of routine issues caught automatically
- Developer satisfaction increased (survey: 4.2/5 to 4.7/5)

**Code Quality Improvements:**
- Security vulnerabilities detected: +340% (AI found issues humans missed)
- Performance issues identified: +220%
- Architecture consistency improvements: +180%

**System Performance:**
- AI review completion: 3-5 minutes average
- 92% accuracy on routine issue detection
- 78% developer acceptance rate of AI suggestions

## Challenges & Solutions
**Challenge**: AI false positives annoying developers
**Solution**: Confidence threshold tuning + feedback learning

**Challenge**: Context understanding for complex architectural decisions
**Solution**: Repository-wide context injection + custom training data

**Challenge**: Integration with existing workflows
**Solution**: GitHub Actions integration + Slack notifications`,
    category: 'milestone',
    project_id: 'ai-code-review',
    project_name: 'AI-Enhanced Development Pipeline',
    tags: JSON.stringify(['ai', 'automation', 'code-review', 'productivity', 'machine-learning']),
    architecture_diagrams: JSON.stringify([
      'https://example.com/ai-review-architecture.png'
    ]),
    related_files: JSON.stringify([
      'https://github.com/example/ai-review-engine',
      'https://example.com/ai-prompts-library.md',
      'https://example.com/performance-metrics-dashboard'
    ]),
    metadata: JSON.stringify({
      difficulty: 9,
      impact: 8,
      learnings: [
        'AI augmentation works better than AI replacement for code review',
        'Developer feedback loops are crucial for AI system improvement',
        'Confidence scoring helps developers trust AI recommendations'
      ],
      nextSteps: [
        'Expand AI analysis to include architecture pattern detection',
        'Integrate with IDE for real-time development assistance',
        'Create AI-powered documentation generation from code reviews'
      ],
      resources: [
        'https://openai.com/research/gpt-4',
        'https://github.com/features/actions'
      ]
    }),
    created_at: new Date('2024-03-20'),
    updated_at: new Date('2024-03-22')
  },

  {
    id: 'journal_team_001',
    title: 'Remote Team Coordination Framework',
    content: `## Challenge
Managing a distributed team of 12 engineers across 6 time zones was creating communication bottlenecks and coordination issues.

## Framework Development
Created a structured approach to async-first collaboration while maintaining team cohesion.

### Communication Structure
**1. Async-First Principle**
- All decisions documented in written form first
- 24-hour response window for non-urgent items
- Time zone rotation for critical meetings

**2. Documentation Standards**
- Architecture Decision Records (ADRs) for all major decisions
- Weekly written status updates instead of standups
- Shared knowledge base with search functionality

**3. Coordination Mechanisms**
- Overlap windows: 2-hour daily overlap across all zones
- Handoff protocols between time zone shifts
- Clear escalation paths for urgent issues

## Implementation Results
**Team Productivity:**
- Feature delivery velocity increased 35%
- Code review cycle time reduced from 2 days to 8 hours
- Meeting time reduced by 60% (more focused, better preparation)

**Team Satisfaction:**
- Work-life balance survey: 3.2/5 to 4.6/5
- Team communication effectiveness: 2.8/5 to 4.4/5
- Overall job satisfaction: 3.9/5 to 4.5/5

**Process Improvements:**
- Decision-making speed improved 40%
- Knowledge sharing increased (searchable documentation)
- Onboarding time for new team members reduced by 50%

## Key Framework Components
### 1. Decision Flow Process
- Proposal → Review → Discussion → Decision → Documentation
- Clear ownership and accountability for each decision
- Transparent decision history and reasoning

### 2. Knowledge Management
- Centralized documentation with version control
- Regular knowledge sharing sessions (recorded)
- Cross-training matrix to reduce single points of failure

### 3. Performance & Growth
- Clear individual goal setting and tracking
- Peer feedback systems that work across time zones
- Career development planning with global opportunities

## Scaling Considerations
This framework has been tested with teams up to 15 people and proven effective. Key scaling factors:
- Communication overhead grows quadratically - need sub-team structure
- Decision-making process needs clear hierarchy at larger scales
- Tool standardization becomes critical for global coordination`,
    category: 'reflection',
    project_id: 'remote-team-framework',
    project_name: 'Global Engineering Team Management',
    tags: JSON.stringify(['remote-work', 'team-management', 'communication', 'productivity', 'leadership']),
    architecture_diagrams: JSON.stringify([]),
    related_files: JSON.stringify([
      'https://example.com/team-coordination-playbook.md',
      'https://example.com/decision-framework-template.md'
    ]),
    metadata: JSON.stringify({
      difficulty: 6,
      impact: 8,
      learnings: [
        'Async-first communication scales better than meeting-heavy approaches',
        'Written documentation is crucial for distributed team knowledge sharing',
        'Clear decision ownership prevents analysis paralysis in remote teams'
      ],
      nextSteps: [
        'Create automated workflow for decision tracking',
        'Implement team health metrics dashboard',
        'Develop cross-functional collaboration protocols'
      ],
      resources: [
        'https://about.gitlab.com/company/culture/all-remote/',
        'https://www.notion.so/blog/remote-work-wiki'
      ]
    }),
    created_at: new Date('2024-03-05'),
    updated_at: new Date('2024-03-08')
  },

  {
    id: 'journal_plan_001',
    title: 'Q2 2024 Technical Roadmap Planning',
    content: `## Strategic Planning Session
Comprehensive technical roadmap planning for Q2 2024, balancing innovation, technical debt, and business objectives.

## Planning Methodology
### 1. Current State Assessment
**Technical Debt Analysis:**
- Code complexity metrics: 15% increase over 6 months
- Test coverage: Currently at 78%, target 85%
- Performance bottlenecks: 3 critical, 8 medium priority
- Security vulnerabilities: 2 high, 12 medium (from recent audit)

**Team Capacity Analysis:**
- Available engineering hours: 1,440 hours (12 engineers × 3 months)
- Planned vacation/PTO: -180 hours
- Bug fix allocation: -20% (288 hours)
- Innovation time: 15% (216 hours)
- **Net development capacity: 756 hours**

### 2. Business Alignment
**Revenue Impact Priorities:**
1. **Performance optimization** → +15% user retention (projected $2M revenue impact)
2. **Mobile app feature parity** → +25% mobile engagement (projected $1.5M)
3. **API rate limiting system** → Enterprise customer requirement (projected $3M deals)

**Strategic Initiatives:**
- AI integration across platform (competitive positioning)
- European market expansion (GDPR compliance requirements)
- Platform reliability improvements (99.9% uptime SLA)

## Q2 Roadmap Priorities

### Tier 1: Must-Have (60% of capacity)
**1. Performance Infrastructure Overhaul**
- Database optimization and sharding implementation
- CDN implementation for global performance
- Caching layer optimization
- **Estimated effort:** 280 hours
- **Business impact:** High retention, enterprise readiness

**2. API Rate Limiting & Enterprise Features**
- Advanced rate limiting with customer tiers
- Enterprise dashboard and analytics
- SSO integration (SAML/OAuth)
- **Estimated effort:** 180 hours
- **Business impact:** $3M+ in enterprise deals

### Tier 2: Should-Have (25% of capacity)
**3. Mobile App Feature Parity**
- Offline functionality implementation
- Push notification system
- Advanced mobile analytics
- **Estimated effort:** 150 hours
- **Business impact:** Mobile user growth

### Tier 3: Nice-to-Have (15% of capacity)
**4. AI-Powered User Experience**
- Smart content recommendations
- Automated customer support chatbot
- Predictive analytics dashboard
- **Estimated effort:** 126 hours
- **Business impact:** Innovation positioning

## Risk Assessment & Mitigation
**High Risks:**
1. **Database migration complexity** → Mitigation: Phased rollout with rollback plan
2. **Third-party API dependencies** → Mitigation: Fallback systems and SLA agreements
3. **Team skill gaps in new technologies** → Mitigation: Training budget and external consulting

**Medium Risks:**
1. **Scope creep from business stakeholders** → Mitigation: Clear change request process
2. **Performance degradation during migrations** → Mitigation: Blue-green deployment strategy

## Success Metrics
**Technical KPIs:**
- Page load time: <2 seconds (current: 3.2s)
- API response time: <200ms (current: 350ms)
- System uptime: 99.9% (current: 99.7%)
- Test coverage: 85% (current: 78%)

**Business KPIs:**
- User retention: +15% improvement
- Enterprise customer acquisition: 5+ new customers
- Mobile engagement: +25% session duration
- Revenue impact: $6.5M+ from technical improvements`,
    category: 'planning',
    project_id: 'q2-roadmap-2024',
    project_name: 'Q2 2024 Technical Strategy',
    tags: JSON.stringify(['roadmap', 'planning', 'strategy', 'capacity-planning', 'business-alignment']),
    architecture_diagrams: JSON.stringify([
      'https://example.com/q2-architecture-roadmap.png'
    ]),
    related_files: JSON.stringify([
      'https://example.com/q2-detailed-planning.xlsx',
      'https://example.com/capacity-analysis.pdf',
      'https://example.com/risk-assessment-matrix.pdf'
    ]),
    metadata: JSON.stringify({
      difficulty: 7,
      impact: 9,
      learnings: [
        'Data-driven capacity planning prevents over-commitment',
        'Business impact quantification helps with stakeholder buy-in',
        'Risk assessment upfront saves crisis management later'
      ],
      nextSteps: [
        'Weekly progress reviews with stakeholder updates',
        'Monthly roadmap adjustment based on learnings',
        'Q3 planning preparation starting in May'
      ],
      resources: [
        'https://www.atlassian.com/agile/product-management/roadmaps',
        'https://productplan.com/learn/product-roadmap-templates/'
      ]
    }),
    created_at: new Date('2024-03-25'),
    updated_at: new Date('2024-03-25')
  }
];

// AI suggestions for the entries
const aiSuggestions = [
  // For microservices entry
  {
    journal_entry_id: 'journal_arch_001',
    suggestions: [
      {
        id: 'ai_suggestion_001_1',
        type: 'architecture',
        suggestion: 'Consider implementing Circuit Breaker pattern to handle service failures gracefully and prevent cascade failures across your microservices.',
        reasoning: 'With microservices architecture, individual service failures can cascade. Circuit breakers provide automatic failover and recovery.',
        confidence: 88,
        resources: JSON.stringify(['https://martinfowler.com/bliki/CircuitBreaker.html']),
        implementation_complexity: 'medium',
        estimated_time_to_implement: '1-2 weeks'
      },
      {
        id: 'ai_suggestion_001_2',
        type: 'optimization',
        suggestion: 'Implement distributed tracing to gain visibility into request flows across your microservices architecture.',
        reasoning: 'Complex microservices deployments require end-to-end request tracking for debugging and performance optimization.',
        confidence: 92,
        resources: JSON.stringify(['https://opentracing.io/', 'https://jaegertracing.io/']),
        implementation_complexity: 'medium',
        estimated_time_to_implement: '2-3 weeks'
      }
    ]
  },
  // For performance optimization entry
  {
    journal_entry_id: 'journal_perf_001',
    suggestions: [
      {
        id: 'ai_suggestion_002_1',
        type: 'best-practice',
        suggestion: 'Implement automated query performance regression testing in your CI/CD pipeline to prevent future performance degradations.',
        reasoning: 'Proactive performance testing catches issues before they reach production, preventing crisis situations.',
        confidence: 95,
        resources: JSON.stringify(['https://github.com/ankane/pghero']),
        implementation_complexity: 'high',
        estimated_time_to_implement: '3-4 weeks'
      }
    ]
  },
  // For AI code review entry
  {
    journal_entry_id: 'journal_ai_001',
    suggestions: [
      {
        id: 'ai_suggestion_003_1',
        type: 'next-steps',
        suggestion: 'Extend the AI system to provide architectural guidance during the development phase, not just during code review.',
        reasoning: 'Shift-left approach to AI assistance can prevent architectural issues before they are implemented.',
        confidence: 85,
        resources: JSON.stringify(['https://github.com/github/copilot']),
        implementation_complexity: 'high',
        estimated_time_to_implement: '4-6 weeks'
      }
    ]
  }
];

async function seedJournalData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting journal data seeding...');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        project_id VARCHAR(255),
        project_name VARCHAR(255),
        tags JSONB DEFAULT '[]',
        architecture_diagrams JSONB DEFAULT '[]',
        related_files JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id VARCHAR(255) PRIMARY KEY,
        journal_entry_id VARCHAR(255) REFERENCES journal_entries(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        suggestion TEXT NOT NULL,
        reasoning TEXT NOT NULL,
        confidence INTEGER DEFAULT 50,
        resources JSONB DEFAULT '[]',
        implementation_complexity VARCHAR(20) DEFAULT 'medium',
        estimated_time_to_implement VARCHAR(100),
        implemented BOOLEAN DEFAULT FALSE,
        implemented_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        category VARCHAR(50) DEFAULT 'general',
        status VARCHAR(20) DEFAULT 'pending',
        related_entry_id VARCHAR(255) REFERENCES journal_entries(id) ON DELETE CASCADE,
        next_step_index INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Clear existing data
    await client.query('DELETE FROM ai_suggestions');
    await client.query('DELETE FROM journal_entries');
    
    console.log('📝 Inserting sample journal entries...');
    
    // Insert journal entries
    for (const entry of sampleEntries) {
      await client.query(`
        INSERT INTO journal_entries (
          id, title, content, category, project_id, project_name,
          tags, architecture_diagrams, related_files, metadata,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        entry.id,
        entry.title,
        entry.content,
        entry.category,
        entry.project_id,
        entry.project_name,
        entry.tags,
        entry.architecture_diagrams,
        entry.related_files,
        entry.metadata,
        entry.created_at,
        entry.updated_at
      ]);
      
      console.log(`✅ Inserted: ${entry.title}`);
    }
    
    console.log('🤖 Inserting AI suggestions...');
    
    // Insert AI suggestions
    for (const suggestionGroup of aiSuggestions) {
      for (const suggestion of suggestionGroup.suggestions) {
        await client.query(`
          INSERT INTO ai_suggestions (
            id, journal_entry_id, type, suggestion, reasoning,
            confidence, resources, implementation_complexity,
            estimated_time_to_implement, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `, [
          suggestion.id,
          suggestionGroup.journal_entry_id,
          suggestion.type,
          suggestion.suggestion,
          suggestion.reasoning,
          suggestion.confidence,
          suggestion.resources,
          suggestion.implementation_complexity,
          suggestion.estimated_time_to_implement
        ]);
      }
    }
    
    console.log('🎯 Creating sample reminders...');
    
    // Create some sample reminders from next steps
    const reminders = [
      {
        id: 'reminder_001',
        title: 'Next Step: Implement service mesh for enhanced security',
        description: 'Follow-up action from microservices architecture entry',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'high',
        category: 'next-steps',
        related_entry_id: 'journal_arch_001',
        next_step_index: 0
      },
      {
        id: 'reminder_002',
        title: 'Next Step: Implement automated query performance regression testing',
        description: 'Follow-up action from database optimization entry',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        priority: 'medium',
        category: 'next-steps',
        related_entry_id: 'journal_perf_001',
        next_step_index: 0
      }
    ];
    
    for (const reminder of reminders) {
      await client.query(`
        INSERT INTO reminders (
          id, title, description, due_date, priority, category,
          related_entry_id, next_step_index, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        reminder.id,
        reminder.title,
        reminder.description,
        reminder.due_date,
        reminder.priority,
        reminder.category,
        reminder.related_entry_id,
        reminder.next_step_index
      ]);
    }
    
    console.log('🎉 Journal data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${sampleEntries.length} journal entries created`);
    console.log(`   - ${aiSuggestions.reduce((sum, group) => sum + group.suggestions.length, 0)} AI suggestions created`);
    console.log(`   - ${reminders.length} reminders created`);
    console.log('');
    console.log('🌐 You can now visit:');
    console.log('   - Admin: http://localhost:3000/admin/journal');
    console.log('   - Public: http://localhost:3000/insights');
    
  } catch (error) {
    console.error('❌ Error seeding journal data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedJournalData().catch(console.error);
