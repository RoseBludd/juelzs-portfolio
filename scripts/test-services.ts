import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

import AWSS3Service from '../src/services/aws-s3.service';
import GitHubService from '../src/services/github.service';
import PortfolioService from '../src/services/portfolio.service';
import TranscriptAnalysisService from '../src/services/transcript-analysis.service';
import InitService from '../src/services/init.service';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

interface EnvDetails {
  [key: string]: {
    exists: boolean;
    length: number;
    preview: string;
  };
}

class ServiceTester {
  private results: TestResult[] = [];
  private s3Service: AWSS3Service;
  private githubService: GitHubService;
  private portfolioService: PortfolioService;
  private transcriptService: TranscriptAnalysisService;
  private initService: InitService;

  constructor() {
    this.s3Service = AWSS3Service.getInstance();
    this.githubService = GitHubService.getInstance();
    this.portfolioService = PortfolioService.getInstance();
    this.transcriptService = TranscriptAnalysisService.getInstance();
    this.initService = InitService.getInstance();
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive service tests...\n');

    // Test environment configuration
    await this.testEnvironmentConfig();
    
    // Test individual services
    await this.testGitHubService();
    await this.testS3Service();
    await this.testTranscriptAnalysis();
    
    // Test integration
    await this.testPortfolioIntegration();
    await this.testInitService();
    
    // Generate report
    this.generateReport();
  }

  /**
   * Test environment configuration
   */
  private async testEnvironmentConfig(): Promise<void> {
    console.log('📋 Testing Environment Configuration...');
    
    const envTests = [
      { name: 'AWS_REGION', value: process.env.AWS_REGION },
      { name: 'AWS_ACCESS_KEY_ID', value: process.env.AWS_ACCESS_KEY_ID },
      { name: 'AWS_SECRET_ACCESS_KEY', value: process.env.AWS_SECRET_ACCESS_KEY },
      { name: 'AWS_S3_BUCKET', value: process.env.AWS_S3_BUCKET },
      { name: 'AWS_S3_MEETINGS_PATH', value: process.env.AWS_S3_MEETINGS_PATH },
      { name: 'GITHUB_TOKEN', value: process.env.GITHUB_TOKEN },
      { name: 'GITHUB_USERNAME', value: process.env.GITHUB_USERNAME }
    ];

    let allEnvPassed = true;
    const envDetails: EnvDetails = {};

    for (const test of envTests) {
      const passed = !!test.value && test.value.length > 0;
      if (!passed) allEnvPassed = false;
      
      envDetails[test.name] = {
        exists: !!test.value,
        length: test.value?.length || 0,
        preview: test.value ? `${test.value.substring(0, 8)}...` : 'undefined'
      };
    }

    this.addResult({
      name: 'Environment Configuration',
      passed: allEnvPassed,
      message: allEnvPassed ? 'All environment variables configured' : 'Missing environment variables',
      duration: 0,
      details: envDetails
    });
  }

  /**
   * Test GitHub service
   */
  private async testGitHubService(): Promise<void> {
    console.log('🐙 Testing GitHub Service...');

    // Test authentication
    await this.runTest('GitHub Authentication', async () => {
      const repos = await this.githubService.getRepositories();
      if (repos.length === 0) {
        throw new Error('No repositories returned - check authentication');
      }
      return { repositoryCount: repos.length, sampleRepo: repos[0]?.name };
    });

    // Test project fetching
    await this.runTest('GitHub Project Fetching', async () => {
      const projects = await this.githubService.getPortfolioProjects();
      return { 
        projectCount: projects.length,
        categories: [...new Set(projects.map(p => p.category))],
        sampleProject: projects[0]?.title
      };
    });

    // Test language stats
    await this.runTest('GitHub Language Stats', async () => {
      const stats = await this.githubService.getOverallLanguageStats();
      const languages = Object.keys(stats);
      return { 
        languageCount: languages.length,
        topLanguages: languages.slice(0, 5),
        totalBytes: Object.values(stats).reduce((a: number, b: number) => a + b, 0)
      };
    });
  }

  /**
   * Test S3 service
   */
  private async testS3Service(): Promise<void> {
    console.log('☁️ Testing S3 Service...');

    // Test S3 connection and file listing
    await this.runTest('S3 File Listing', async () => {
      const files = await this.s3Service.listMeetingFiles();
      return {
        totalFiles: files.length,
        fileTypes: [...new Set(files.map(f => f.type))],
        sampleFiles: files.slice(0, 3).map(f => ({ name: f.filename, type: f.type }))
      };
    });

    // Test meeting grouping and analysis
    await this.runTest('S3 Meeting Analysis', async () => {
      const groups = await this.s3Service.getMeetingGroups();
      const relevantGroups = groups.filter(g => g.isPortfolioRelevant);
      
      return {
        totalMeetings: groups.length,
        portfolioRelevant: relevantGroups.length,
        categories: [...new Set(relevantGroups.map(g => g.category).filter(Boolean))],
        sampleMeeting: relevantGroups[0] ? {
          title: relevantGroups[0].title,
          category: relevantGroups[0].category,
          participants: relevantGroups[0].participants
        } : null
      };
    });

    // Test meeting categories
    await this.runTest('S3 Meeting Categories', async () => {
      const categories = await this.s3Service.getMeetingCategories();
      return { categories };
    });
  }

  /**
   * Test transcript analysis
   */
  private async testTranscriptAnalysis(): Promise<void> {
    console.log('🧠 Testing Transcript Analysis...');

    // Test with sample technical transcript
    await this.runTest('Transcript Analysis - Technical', async () => {
      const sampleTranscript = `
        John: Hi everyone, today we're discussing the architecture for our new microservices platform.
        Sarah: Great! I think we should focus on the API gateway design and how we handle authentication.
        John: Absolutely. We need to decide between OAuth 2.0 and JWT for our authentication strategy.
        Sarah: I've been researching this. JWT seems more scalable for our distributed architecture.
        John: Agreed. Let's also discuss the database design and how we partition our data.
        Sarah: We should implement event sourcing for better auditability and system recovery.
        John: Excellent point. We'll need to consider performance implications and caching strategies.
      `;
      
      const insights = await this.transcriptService.analyzeTranscript(sampleTranscript, 'architecture-review-microservices.txt');
      
      return {
        isRelevant: insights.isPortfolioRelevant,
        category: insights.category.type,
        confidence: insights.category.confidence,
        keyMomentsCount: insights.keyMoments.length,
        technicalTopics: insights.technicalTopics,
        decisions: insights.decisions,
        title: insights.title
      };
    });

    // Test with sample administrative transcript (should be filtered out)
    await this.runTest('Transcript Analysis - Administrative', async () => {
      const adminTranscript = `
        Manager: Good morning everyone, let's start our weekly alignment meeting.
        Employee: Sure, I'll give my status update. This week I worked on the budget planning.
        Manager: Great. How's the timeline looking for the quarterly review?
        Employee: We should be on track. I've scheduled meetings with HR for next week.
        Manager: Perfect. Don't forget the company birthday celebration on Friday.
      `;
      
      const insights = await this.transcriptService.analyzeTranscript(adminTranscript, 'weekly-alignment-meeting.txt');
      
      return {
        isRelevant: insights.isPortfolioRelevant,
        category: insights.category.type,
        reason: insights.category.reason,
        shouldBeFiltered: !insights.isPortfolioRelevant
      };
    });
  }

  /**
   * Test portfolio integration
   */
  private async testPortfolioIntegration(): Promise<void> {
    console.log('🔗 Testing Portfolio Integration...');

    // Test system projects (GitHub + manual)
    await this.runTest('Portfolio System Projects', async () => {
      const projects = await this.portfolioService.getSystemProjects();
      const githubProjects = projects.filter(p => p.source === 'github');
      const manualProjects = projects.filter(p => p.source === 'manual');
      const hybridProjects = projects.filter(p => p.source === 'hybrid');
      
      return {
        totalProjects: projects.length,
        githubProjects: githubProjects.length,
        manualProjects: manualProjects.length,
        hybridProjects: hybridProjects.length,
        categories: [...new Set(projects.map(p => p.category))],
        topProject: projects[0]?.title
      };
    });

    // Test leadership videos (S3 + manual)
    await this.runTest('Portfolio Leadership Videos', async () => {
      const videos = await this.portfolioService.getLeadershipVideos();
      const s3Videos = videos.filter(v => v.source === 's3');
      const manualVideos = videos.filter(v => v.source === 'manual');
      
      return {
        totalVideos: videos.length,
        s3Videos: s3Videos.length,
        manualVideos: manualVideos.length,
        sampleVideo: videos[0] ? {
          title: videos[0].title,
          duration: videos[0].duration,
          keyMomentsCount: videos[0].keyMoments.length
        } : null
      };
    });

    // Test sync functionality
    await this.runTest('Portfolio Sync', async () => {
      const syncResult = await this.portfolioService.syncExternalData();
      return {
        syncStatus: syncResult,
        successful: syncResult.errors.length === 0
      };
    });
  }

  /**
   * Test initialization service
   */
  private async testInitService(): Promise<void> {
    console.log('⚙️ Testing Initialization Service...');

    // Test health check
    await this.runTest('Init Service Health Check', async () => {
      const health = await this.initService.healthCheck();
      return health;
    });

    // Test status
    await this.runTest('Init Service Status', async () => {
      const status = this.initService.getStatus();
      return {
        initialized: status.initialized,
        environment: status.environment,
        syncEnabled: status.config.enableSync
      };
    });
  }

  /**
   * Run a single test
   */
  private async runTest(name: string, testFunction: () => Promise<unknown>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const details = await testFunction();
      const duration = Date.now() - startTime;
      
      this.addResult({
        name,
        passed: true,
        message: 'Test passed successfully',
        duration,
        details
      });
      
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      this.addResult({
        name,
        passed: false,
        message,
        duration,
        details: { error: error instanceof Error ? error.stack : error }
      });
      
      console.log(`  ❌ ${name} (${duration}ms): ${message}`);
    }
  }

  /**
   * Add test result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================\n');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${successRate}%\n`);

    // Failed tests detail
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.message}`);
      });
      console.log('');
    }

    // Key metrics
    console.log('📈 Key Metrics:');
    this.results.forEach(result => {
      if (result.passed && result.details) {
        console.log(`  • ${result.name}:`);
        this.printDetails(result.details, '    ');
      }
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (failedTests.some(t => t.name.includes('GitHub'))) {
      console.log('  • Check GitHub token in .env file');
      console.log('  • Verify token has correct scopes (repo, read:org)');
    }
    
    if (failedTests.some(t => t.name.includes('S3'))) {
      console.log('  • Verify AWS credentials in .env file');
      console.log('  • Check S3 bucket permissions');
      console.log('  • Ensure meeting files exist in S3');
    }
    
    if (failedTests.some(t => t.name.includes('Environment'))) {
      console.log('  • Update .env file with missing variables');
      console.log('  • Restart development server after .env changes');
    }

    console.log('\n🎯 Next Steps:');
    if (successRate === '100.0') {
      console.log('  • All services are working correctly!');
      console.log('  • Portfolio will display live GitHub projects');
      console.log('  • Leadership section will show analyzed S3 meetings');
      console.log('  • Auto-sync is running every 30 minutes');
    } else {
      console.log('  • Fix failed tests before production deployment');
      console.log('  • Re-run tests after making changes');
      console.log('  • Check logs for detailed error information');
    }
  }

  /**
   * Print object details recursively
   */
  private printDetails(obj: any, indent: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(`${indent}${key}:`);
        this.printDetails(value, indent + '  ');
      } else if (Array.isArray(value)) {
        console.log(`${indent}${key}: [${value.length} items]`);
        if (value.length > 0 && value.length <= 3) {
          console.log(`${indent}  ${value.join(', ')}`);
        }
      } else {
        console.log(`${indent}${key}: ${value}`);
      }
    }
  }
}

// Run tests
async function main() {
  const tester = new ServiceTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
} 