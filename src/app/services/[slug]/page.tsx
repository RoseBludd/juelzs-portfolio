import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

interface ServiceDetail {
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  pricing?: string;
  deliveryModel: string[];
  whatYouGet: string[];
  process: { step: string; description: string }[];
  deliverables: string[];
  idealFor: string[];
  travelRequired?: boolean;
  onSiteDetails?: string;
}

const serviceDetails: Record<string, ServiceDetail> = {
  'consultation': {
    title: 'AI Strategy Session',
    subtitle: 'Quick consultation to align your AI vision with technical reality',
    description: 'A focused session to understand your AI goals, assess current capabilities, and create a clear roadmap for implementation. Perfect for executives and technical leaders who need strategic direction without a full commitment.',
    duration: '1-2 hours',
    pricing: '$200-300',
    deliveryModel: ['Remote via video call'],
    whatYouGet: [
      'Assessment of current technical capabilities',
      'Gap analysis for AI implementation',
      'Strategic roadmap with prioritized next steps',
      'Technology stack recommendations',
      'Resource planning guidance',
      'Follow-up summary document'
    ],
    process: [
      { step: 'Discovery Call', description: 'Understand your business goals and current technical landscape' },
      { step: 'Quick Assessment', description: 'Evaluate existing systems and team capabilities' },
      { step: 'Strategy Discussion', description: 'Discuss AI opportunities and implementation approaches' },
      { step: 'Roadmap Creation', description: 'Create prioritized action plan with timelines' },
      { step: 'Documentation', description: 'Provide written summary and recommendations' }
    ],
    deliverables: [
      'Strategic AI roadmap document',
      'Technology recommendations',
      'Resource planning guide',
      'Next steps action plan'
    ],
    idealFor: [
      'CTOs and technical executives',
      'Product managers exploring AI',
      'Startups planning AI integration',
      'Teams needing direction validation'
    ]
  },
  'architecture-review': {
    title: 'Architecture Review',
    subtitle: 'Deep technical assessment of your system architecture',
    description: 'Comprehensive analysis of your system architecture, identifying strengths, weaknesses, and optimization opportunities. I&apos;ll examine your codebase, infrastructure, and design patterns to provide actionable recommendations for improvement.',
    duration: '2-3 hours',
    pricing: '$300-450',
    deliveryModel: ['Remote with screen sharing', 'Access to codebase required'],
    whatYouGet: [
      'Complete architecture assessment',
      'Code quality evaluation',
      'Performance bottleneck identification',
      'Security vulnerability analysis',
      'Scalability assessment',
      'Detailed improvement roadmap'
    ],
    process: [
      { step: 'Codebase Review', description: 'Examine system architecture, design patterns, and code quality' },
      { step: 'Infrastructure Analysis', description: 'Assess deployment, scaling, and operational aspects' },
      { step: 'Performance Evaluation', description: 'Identify bottlenecks and optimization opportunities' },
      { step: 'Security Assessment', description: 'Review security practices and potential vulnerabilities' },
      { step: 'Report Generation', description: 'Create comprehensive report with prioritized recommendations' }
    ],
    deliverables: [
      'Architecture assessment report',
      'Code quality analysis',
      'Performance optimization plan',
      'Security recommendations',
      'Prioritized improvement roadmap'
    ],
    idealFor: [
      'Teams with existing systems',
      'Pre-acquisition technical due diligence',
      'Performance optimization needs',
      'Security compliance requirements'
    ]
  },
  'technical-audit': {
    title: 'Technical Audit & Assessment',
    subtitle: 'Comprehensive technical evaluation of your entire stack',
    description: 'An in-depth technical audit covering your entire technology stack, development processes, and team practices. This comprehensive assessment identifies risks, opportunities, and provides a detailed roadmap for technical excellence.',
    duration: '3-5 days',
    pricing: '$1,200-2,000',
    deliveryModel: ['Remote assessment', 'Team interviews', 'Documentation review'],
    whatYouGet: [
      'Complete technology stack audit',
      'Development process assessment',
      'Team capability evaluation',
      'Risk assessment and mitigation',
      'Performance optimization plan',
      'Long-term technology roadmap'
    ],
    process: [
      { step: 'Scope Definition', description: 'Define audit scope and access requirements' },
      { step: 'Technical Review', description: 'Comprehensive review of codebase, infrastructure, and architecture' },
      { step: 'Process Assessment', description: 'Evaluate development workflows, CI/CD, and deployment practices' },
      { step: 'Team Interviews', description: 'Interview key team members to understand challenges and workflows' },
      { step: 'Risk Analysis', description: 'Identify technical debt, security risks, and operational issues' },
      { step: 'Report Creation', description: 'Create comprehensive audit report with actionable recommendations' }
    ],
    deliverables: [
      'Comprehensive technical audit report',
      'Risk assessment and mitigation plan',
      'Performance optimization roadmap',
      'Process improvement recommendations',
      'Technology modernization plan',
      'Executive summary for leadership'
    ],
    idealFor: [
      'Growing companies needing technical assessment',
      'Pre-funding technical due diligence',
      'Legacy system modernization planning',
      'New technical leadership onboarding'
    ]
  },
  'leadership-coaching': {
    title: 'Technical Leadership Coaching',
    subtitle: 'One-on-one coaching for technical leaders',
    description: 'Personalized coaching for technical leaders to develop management skills, architectural thinking, and team leadership capabilities. Focused on transitioning from individual contributor to effective technical leader.',
    duration: '2-4 weeks',
    pricing: '$1,500-3,000',
    deliveryModel: ['Weekly 1-on-1 sessions', 'Remote or hybrid', 'Between-session support'],
    whatYouGet: [
      'Personalized leadership assessment',
      'Weekly coaching sessions',
      'Leadership framework development',
      'Communication skills enhancement',
      'Technical decision-making guidance',
      'Career growth planning'
    ],
    process: [
      { step: 'Leadership Assessment', description: 'Evaluate current leadership style and challenges' },
      { step: 'Goal Setting', description: 'Define specific leadership development objectives' },
      { step: 'Weekly Sessions', description: '1-hour weekly coaching sessions with action items' },
      { step: 'Practice Implementation', description: 'Apply learnings with real team scenarios' },
      { step: 'Progress Review', description: 'Regular assessment of growth and goal achievement' },
      { step: 'Long-term Planning', description: 'Create ongoing development plan' }
    ],
    deliverables: [
      'Personal leadership assessment',
      'Leadership development plan',
      'Communication framework',
      'Decision-making processes',
      'Team management strategies',
      'Career growth roadmap'
    ],
    idealFor: [
      'Senior developers becoming tech leads',
      'New engineering managers',
      'CTOs building leadership skills',
      'Technical leaders facing team challenges'
    ]
  },
  'ai-implementation': {
    title: 'AI Strategy & Implementation',
    subtitle: 'Comprehensive AI strategy with team options',
    description: 'Complete AI strategy development from opportunity identification to implementation roadmap. I provide strategy, architecture, and proof-of-concepts - NEVER direct implementation. You choose: use your team, build an AI team (recommended), or hire my premium AI specialists.',
    duration: '1-2 weeks',
    pricing: '$2,500-5,000',
    deliveryModel: ['Strategy + POC only', 'Strategy + build your AI team (recommended)', 'Strategy + my premium AI specialists (expensive)'],
    travelRequired: true,
    onSiteDetails: 'On-site presence recommended for stakeholder alignment and team coordination',
    whatYouGet: [
      'Comprehensive AI strategy',
      'Use case identification and prioritization',
      'Technical implementation plan',
      'Proof-of-concept development',
      'Team training and knowledge transfer',
      'ROI analysis and business case'
    ],
    process: [
      { step: 'Business Assessment', description: 'Understand business goals and identify AI opportunities' },
      { step: 'Technical Planning', description: 'Design AI architecture and implementation approach' },
      { step: 'Proof of Concept', description: 'Build working prototype to validate approach' },
      { step: 'Implementation Plan', description: 'Create detailed roadmap for full implementation' },
      { step: 'Team Training', description: 'Transfer knowledge and train internal team' },
      { step: 'Launch Support', description: 'Support initial deployment and optimization' }
    ],
    deliverables: [
      'AI strategy document',
      'Technical architecture plan',
      'Working proof-of-concept',
      'Implementation roadmap',
      'Team training materials',
      'ROI analysis and business case'
    ],
    idealFor: [
      'Companies ready to implement AI',
      'Teams with AI budget and executive support',
      'Organizations needing technical AI expertise',
      'Businesses requiring competitive AI advantage'
    ]
  },
  'system-design': {
    title: 'System Design Consultation',
    subtitle: 'Strategic system architecture design with team options',
    description: 'Collaborative system design and architecture planning for new products or major overhauls. I design the architecture, create technical roadmaps, and provide guidance - NEVER direct implementation. You choose: use your team, build a development team (recommended), or hire my premium developers.',
    duration: '1-2 weeks',
    pricing: '$2,000-4,000',
    deliveryModel: ['Architecture design only', 'Design + build your development team (recommended)', 'Design + my premium developers (expensive)'],
    travelRequired: false,
    onSiteDetails: 'On-site workshops available for complex architecture sessions and team coordination',
    whatYouGet: [
      'Complete system architecture design',
      'Technology stack recommendations',
      'Scalability planning',
      'Performance optimization strategy',
      'Implementation guidance',
      'Risk mitigation planning'
    ],
    process: [
      { step: 'Requirements Gathering', description: 'Understand business requirements and technical constraints' },
      { step: 'Architecture Design', description: 'Design system architecture with scalability and maintainability' },
      { step: 'Technology Selection', description: 'Choose optimal technology stack for requirements' },
      { step: 'Documentation Creation', description: 'Create comprehensive system design documentation' },
      { step: 'Implementation Planning', description: 'Develop phased implementation approach' },
      { step: 'Team Handoff', description: 'Transfer knowledge and support initial implementation' }
    ],
    deliverables: [
      'System architecture documentation',
      'Technology stack recommendations',
      'Implementation roadmap',
      'Performance benchmarks',
      'Scalability planning guide',
      'Risk assessment and mitigation plan'
    ],
    idealFor: [
      'Startups building new products',
      'Companies planning system overhauls',
      'Teams needing architecture expertise',
      'Organizations planning for scale'
    ]
  },
  'team-coaching': {
    title: 'Team Coaching & Development',
    subtitle: 'Transform your team&apos;s technical capabilities and culture',
    description: 'Comprehensive team development program to elevate technical skills, improve processes, and build a culture of excellence. This immersive engagement transforms how your team thinks about architecture, quality, and collaboration.',
    duration: '4-6 weeks',
    pricing: '$4,000-6,000',
    deliveryModel: ['On-site preferred', 'Hybrid model available', 'Embedded team integration'],
    travelRequired: true,
    onSiteDetails: 'On-site presence essential for team integration and culture transformation. Client covers travel, accommodation, and meals.',
    whatYouGet: [
      'Team skill assessment and development',
      'Process optimization and automation',
      'Code quality and architecture training',
      'Mentoring and knowledge transfer',
      'Culture transformation guidance',
      'Long-term development roadmap'
    ],
    process: [
      { step: 'Team Assessment', description: 'Evaluate current team skills, processes, and challenges' },
      { step: 'Process Optimization', description: 'Improve development workflows and automation' },
      { step: 'Skills Development', description: 'Hands-on training in architecture and best practices' },
      { step: 'Mentoring Program', description: 'Individual mentoring for key team members' },
      { step: 'Culture Building', description: 'Establish practices for continuous improvement' },
      { step: 'Sustainability Planning', description: 'Create plan for ongoing growth and development' }
    ],
    deliverables: [
      'Team capability assessment',
      'Optimized development processes',
      'Training materials and documentation',
      'Mentoring framework',
      'Quality standards and practices',
      'Long-term development roadmap'
    ],
    idealFor: [
      'Growing engineering teams',
      'Teams struggling with quality or velocity',
      'Organizations planning technical transformation',
      'Companies investing in team excellence'
    ]
  },
  'code-review': {
    title: 'Code Review Session',
    subtitle: 'Focused code analysis with actionable improvements',
    description: 'Get expert feedback on specific code sections, identify potential issues, and learn best practices through detailed review and discussion. Perfect for validating approaches or getting a second opinion on critical code.',
    duration: '1 hour',
    pricing: '$150-200',
    deliveryModel: ['Remote screen sharing session', 'Code repository access'],
    whatYouGet: [
      'Line-by-line code analysis',
      'Best practices recommendations',
      'Performance optimization suggestions',
      'Security vulnerability identification',
      'Refactoring opportunities',
      'Written summary with action items'
    ],
    process: [
      { step: 'Code Submission', description: 'Share specific code sections or repository access' },
      { step: 'Initial Review', description: 'Preliminary analysis of code structure and patterns' },
      { step: 'Live Session', description: 'Interactive review with real-time feedback and discussion' },
      { step: 'Recommendations', description: 'Specific improvement suggestions and next steps' },
      { step: 'Follow-up', description: 'Written summary with prioritized action items' }
    ],
    deliverables: [
      'Detailed code review notes',
      'Best practices checklist',
      'Refactoring recommendations',
      'Security assessment',
      'Performance improvement suggestions',
      'Action plan with priorities'
    ],
    idealFor: [
      'Developers seeking expert feedback',
      'Code validation before production',
      'Learning best practices',
      'Performance optimization needs'
    ]
  },
  'performance-optimization': {
    title: 'Performance Optimization',
    subtitle: 'Rapid identification and resolution of performance bottlenecks',
    description: 'Quick but thorough analysis of application performance issues with immediate optimization recommendations. Focus on identifying the highest-impact improvements for faster, more efficient systems.',
    duration: '2-3 hours',
    pricing: '$350-450',
    deliveryModel: ['Remote analysis', 'Performance monitoring setup', 'Live optimization session'],
    whatYouGet: [
      'Performance bottleneck identification',
      'Database query optimization',
      'Frontend performance analysis',
      'Memory and CPU usage review',
      'Caching strategy recommendations',
      'Implementation guidance'
    ],
    process: [
      { step: 'Performance Audit', description: 'Analyze current system performance and identify bottlenecks' },
      { step: 'Monitoring Setup', description: 'Install performance monitoring tools if needed' },
      { step: 'Optimization Planning', description: 'Prioritize improvements by impact and effort' },
      { step: 'Quick Wins Implementation', description: 'Implement immediate performance improvements' },
      { step: 'Long-term Strategy', description: 'Create plan for ongoing performance optimization' }
    ],
    deliverables: [
      'Performance analysis report',
      'Optimization recommendations',
      'Implementation guide',
      'Monitoring setup documentation',
      'Performance benchmark results',
      'Long-term improvement roadmap'
    ],
    idealFor: [
      'Applications with performance issues',
      'Pre-launch performance validation',
      'High-traffic system optimization',
      'Cost reduction through efficiency'
    ]
  },
  'database-review': {
    title: 'Database Architecture Review',
    subtitle: 'Specialized database design and optimization assessment',
    description: 'Comprehensive review of database architecture, schema design, query performance, and optimization strategies. Focused on ensuring your data layer can scale efficiently and securely.',
    duration: '1-2 days',
    pricing: '$800-1,200',
    deliveryModel: ['Remote database analysis', 'Schema review', 'Performance testing'],
    whatYouGet: [
      'Database schema analysis',
      'Query performance optimization',
      'Indexing strategy review',
      'Scaling recommendations',
      'Security assessment',
      'Backup and recovery planning'
    ],
    process: [
      { step: 'Schema Analysis', description: 'Review database design, relationships, and normalization' },
      { step: 'Query Performance', description: 'Analyze slow queries and optimization opportunities' },
      { step: 'Indexing Review', description: 'Evaluate current indexes and recommend improvements' },
      { step: 'Scaling Assessment', description: 'Plan for growth and identify scaling bottlenecks' },
      { step: 'Security Review', description: 'Assess security practices and compliance requirements' },
      { step: 'Optimization Plan', description: 'Create prioritized improvement roadmap' }
    ],
    deliverables: [
      'Database architecture assessment',
      'Query optimization report',
      'Indexing strategy plan',
      'Scaling roadmap',
      'Security recommendations',
      'Performance benchmark results'
    ],
    idealFor: [
      'Applications with database performance issues',
      'Growing systems needing scaling strategy',
      'Legacy database modernization',
      'New database architecture validation'
    ]
  },
  'cicd-setup': {
    title: 'CI/CD Pipeline Setup',
    subtitle: 'Complete pipeline setup with team training options',
    description: 'Design and implement comprehensive CI/CD pipelines with automated testing and deployment. I handle the initial setup and training - ongoing maintenance by your team, a team I help you build, or my premium DevOps specialists.',
    duration: '3-5 days',
    pricing: '$1,500-2,500',
    deliveryModel: ['Setup + training only', 'Setup + build your DevOps team (recommended)', 'Setup + my premium DevOps specialists (expensive)'],
    whatYouGet: [
      'Complete CI/CD pipeline setup',
      'Automated testing integration',
      'Deployment automation',
      'Environment management',
      'Monitoring and alerting',
      'Team training and documentation'
    ],
    process: [
      { step: 'Requirements Analysis', description: 'Understand current workflow and deployment needs' },
      { step: 'Pipeline Design', description: 'Design CI/CD architecture and tool selection' },
      { step: 'Implementation', description: 'Set up automated testing and deployment pipelines' },
      { step: 'Environment Setup', description: 'Configure staging and production environments' },
      { step: 'Team Training', description: 'Train team on new workflow and troubleshooting' },
      { step: 'Documentation', description: 'Create comprehensive process documentation' }
    ],
    deliverables: [
      'Complete CI/CD pipeline',
      'Automated test suite integration',
      'Deployment scripts and configuration',
      'Environment management setup',
      'Team training materials',
      'Process documentation'
    ],
    idealFor: [
      'Teams with manual deployment processes',
      'Growing development teams',
      'Quality and reliability improvement',
      'DevOps transformation initiatives'
    ]
  },
  'legacy-modernization': {
    title: 'Legacy System Modernization',
    subtitle: 'Strategic transformation planning with team options',
    description: 'Comprehensive planning and strategic roadmap for modernizing legacy systems. I provide strategy, architecture, and guidance - NEVER direct implementation. You choose: use your team, build a new team (recommended), or hire my premium team.',
    duration: '2-4 weeks',
    pricing: '$5,000-8,000',
    deliveryModel: ['Strategic planning only', 'Planning + build your permanent team (recommended)', 'Planning + my premium team (expensive)'],
    travelRequired: true,
    onSiteDetails: 'On-site presence recommended for legacy system assessment and stakeholder alignment',
    whatYouGet: [
      'Legacy system assessment and analysis',
      'Complete modernization strategy and roadmap',
      'Risk mitigation and phased migration plan',
      'Technology stack recommendations',
      'Implementation timeline and milestones',
      'Optional: Team building and training plan'
    ],
    process: [
      { step: 'Legacy Assessment', description: 'Comprehensive analysis of current systems, dependencies, and technical debt' },
      { step: 'Modernization Strategy', description: 'Create detailed transformation roadmap with technology recommendations' },
      { step: 'Risk & Migration Planning', description: 'Design phased approach with risk mitigation and business continuity' },
      { step: 'Implementation Planning', description: 'Create detailed implementation timeline and resource requirements' },
      { step: 'Team Strategy (Optional)', description: 'Design team building plan or coordinate with my contracted developers' },
      { step: 'Handoff & Support', description: 'Transfer complete plan and provide initial implementation guidance' }
    ],
    deliverables: [
      'Legacy system analysis report',
      'Complete modernization roadmap and architecture',
      'Risk assessment and mitigation plan',
      'Technology migration strategy',
      'Implementation timeline and resource plan',
      'Optional: Team building strategy or contracted team coordination'
    ],
    idealFor: [
      'Organizations with legacy technical debt',
      'Companies planning digital transformation',
      'Systems requiring modernization for growth',
      'Teams needing strategic planning (not implementation)',
      'Companies wanting to build or augment development teams'
    ]
  },
  'remote-team-management': {
    title: 'Remote Team Management Consulting',
    subtitle: 'Building and optimizing distributed technical teams',
    description: 'Strategic guidance for building, managing, and optimizing remote technical teams across multiple time zones. Based on experience managing 10+ developers internationally, focusing on productivity, culture, and scalable processes.',
    duration: '1-3 weeks',
    pricing: '$3,000-5,000',
    deliveryModel: ['Remote consulting', 'Team interviews', 'Process design'],
    whatYouGet: [
      'Remote team assessment',
      'Communication strategy optimization',
      'Process and workflow design',
      'Cultural alignment framework',
      'Performance management system',
      'Tool and technology recommendations'
    ],
    process: [
      { step: 'Team Assessment', description: 'Evaluate current remote team dynamics and challenges' },
      { step: 'Process Analysis', description: 'Review communication, collaboration, and development processes' },
      { step: 'Strategy Development', description: 'Design optimized remote team management approach' },
      { step: 'Implementation Planning', description: 'Create rollout plan for new processes and tools' },
      { step: 'Team Training', description: 'Train managers and team members on new approaches' },
      { step: 'Optimization Support', description: 'Support implementation and continuous improvement' }
    ],
    deliverables: [
      'Remote team assessment report',
      'Communication strategy framework',
      'Process and workflow documentation',
      'Performance management system',
      'Tool recommendations and setup',
      'Manager training materials'
    ],
    idealFor: [
      'Companies transitioning to remote work',
      'Growing distributed technical teams',
      'Organizations with remote productivity challenges',
      'Teams spanning multiple time zones'
    ]
  },
  'team-building': {
    title: 'Build Your Permanent Team',
    subtitle: 'Complete team building and training program (RECOMMENDED)',
    description: 'I help you build, hire, and train your own development team - you keep them permanently. This comprehensive program includes recruitment strategy, technical interviews, onboarding, and training to ensure your new team can execute on the architectural vision.',
    duration: '2-6 weeks',
    pricing: '$8,000-15,000',
    deliveryModel: ['Recruitment strategy', 'Interview process design', 'Team training program', 'Remote or on-site options'],
    travelRequired: false,
    onSiteDetails: 'On-site training available for initial team integration and culture building',
    whatYouGet: [
      'Complete recruitment strategy and job descriptions',
      'Technical interview process and evaluation criteria',
      'Candidate sourcing and screening support',
      'Team onboarding and training program',
      'Architecture and development standards documentation',
      'Long-term team development roadmap'
    ],
    process: [
      { step: 'Requirements Planning', description: 'Define team structure, roles, and technical requirements' },
      { step: 'Recruitment Strategy', description: 'Create job descriptions, sourcing strategy, and interview process' },
      { step: 'Candidate Screening', description: 'Support candidate evaluation and technical interviews' },
      { step: 'Team Onboarding', description: 'Design comprehensive onboarding program for new hires' },
      { step: 'Training Program', description: 'Deliver architectural thinking and development standards training' },
      { step: 'Team Integration', description: 'Support team integration and establish ongoing development practices' }
    ],
    deliverables: [
      'Complete recruitment strategy and documentation',
      'Technical interview process and evaluation tools',
      'Team onboarding program and materials',
      'Architecture and coding standards documentation',
      'Training curriculum and development roadmap',
      'Team management and growth framework'
    ],
    idealFor: [
      'Companies ready to invest in permanent talent',
      'Organizations needing long-term technical capacity',
      'Teams requiring architectural expertise building',
      'Companies preferring owned vs. contracted resources'
    ]
  },
  'contracted-team': {
    title: 'Use My Premium Team',
    subtitle: 'Hire experienced team for implementation (expensive option)',
    description: 'Hire my experienced team of developers and specialists for direct implementation work. This is the premium option with proven expertise but higher costs. Best for companies that need immediate results and have the budget for premium talent.',
    duration: 'Project-based',
    pricing: '$150-200/hr + management',
    deliveryModel: ['Dedicated team assignment', 'Project-based engagement', 'Remote or hybrid available'],
    travelRequired: false,
    onSiteDetails: 'On-site work available for complex integrations and stakeholder coordination',
    whatYouGet: [
      'Experienced development team assignment',
      'Project management and coordination',
      'Direct implementation and delivery',
      'Quality assurance and testing',
      'Documentation and knowledge transfer',
      'Ongoing support and maintenance options'
    ],
    process: [
      { step: 'Project Scoping', description: 'Define project requirements, timeline, and resource needs' },
      { step: 'Team Assignment', description: 'Assign optimal team members based on technology and experience' },
      { step: 'Implementation Planning', description: 'Create detailed implementation plan and milestone schedule' },
      { step: 'Development Execution', description: 'Execute development work with regular progress updates' },
      { step: 'Quality Assurance', description: 'Comprehensive testing and quality validation' },
      { step: 'Delivery & Handoff', description: 'Complete delivery with documentation and knowledge transfer' }
    ],
    deliverables: [
      'Complete implemented solution',
      'Comprehensive documentation',
      'Testing and quality assurance reports',
      'Knowledge transfer and training materials',
      'Source code and deployment assets',
      'Ongoing support options and recommendations'
    ],
    idealFor: [
      'Companies with substantial budgets for premium talent',
      'Organizations needing immediate implementation capacity',
      'Complex projects requiring proven expertise',
      'Teams preferring fully managed implementation'
    ]
  }
};

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = serviceDetails[slug];

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {service.title}
          </h1>
          <p className="text-xl text-gray-400 mb-6">
            {service.subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
              {service.duration}
            </span>
            {service.pricing && (
              <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                {service.pricing}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Overview</h2>
          <p className="text-gray-400 leading-relaxed">
            {service.description}
          </p>
        </Card>

        {/* What You Get */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">What You Get</h2>
          <ul className="space-y-3">
            {service.whatYouGet.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-400 mr-3 mt-1">✓</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Process */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Process</h2>
          <div className="space-y-4">
            {service.process.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{step.step}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Deliverables */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Deliverables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {service.deliverables.map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="text-blue-400 mr-3">📄</span>
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card>
            <h2 className="text-xl font-bold mb-4 text-white">Delivery Model</h2>
            <ul className="space-y-2">
              {service.deliveryModel.map((model, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-purple-400 mr-3">🔹</span>
                  <span className="text-gray-300">{model}</span>
                </li>
              ))}
            </ul>
            {service.travelRequired && service.onSiteDetails && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>On-Site Option:</strong> {service.onSiteDetails}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-bold mb-4 text-white">Ideal For</h2>
            <ul className="space-y-2">
              {service.idealFor.map((item, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-400 mr-3">👥</span>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/20 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-6">
            Let&apos;s discuss how this service can help solve your specific challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/contact" size="lg">
              Schedule Consultation
            </Button>
            <Button href="/services" variant="outline" size="lg">
              View All Services
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 