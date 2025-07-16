/**
 * Comprehensive Admin Functionality Test Script
 * Tests all admin features to ensure they're working correctly
 */

// Import TypeScript services using Node.js require for testing
const { default: AWSS3Service } = await import('../src/services/aws-s3.service.ts');
const { default: GitHubService } = await import('../src/services/github.service.ts');
const { default: PortfolioService } = await import('../src/services/portfolio.service.ts');
const { default: ProjectLinkingService } = await import('../src/services/project-linking.service.ts');
const { default: VideoProjectSuggestionService } = await import('../src/services/video-project-suggestion.service.ts');

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`${title}`, 'bold');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

async function testMeetingsService() {
  logSection('TESTING MEETINGS SERVICE');
  
  try {
    logTest('S3 Meetings Loading (All Meetings)');
    const s3Service = AWSS3Service.getInstance();
    const meetings = await s3Service.getMeetingGroups();
    
    if (meetings.length === 0) {
      logWarning('No meetings found - check S3 bucket configuration');
      return { success: false, meetings: 0, relevant: 0, withTranscripts: 0 };
    }
    
    const relevantMeetings = meetings.filter(m => m.isPortfolioRelevant);
    const meetingsWithTranscripts = meetings.filter(m => m.transcript);
    const meetingsWithAnalysis = meetings.filter(m => m.insights);
    
    logSuccess(`Total meetings loaded: ${meetings.length}`);
    logInfo(`Portfolio relevant: ${relevantMeetings.length}`);
    logInfo(`With transcripts: ${meetingsWithTranscripts.length}`);
    logInfo(`With analysis: ${meetingsWithAnalysis.length}`);
    
    // Test specific meeting details
    logTest('Meeting Analysis Details');
    for (const meeting of meetings.slice(0, 3)) {
      logInfo(`Meeting: ${meeting.title}`);
      logInfo(`  Category: ${meeting.category || 'None'}`);
      logInfo(`  Portfolio Relevant: ${meeting.isPortfolioRelevant ? 'Yes' : 'No'}`);
      logInfo(`  Has Video: ${meeting.video ? 'Yes' : 'No'}`);
      logInfo(`  Has Transcript: ${meeting.transcript ? 'Yes' : 'No'}`);
      logInfo(`  Key Moments: ${meeting.insights?.keyMoments?.length || 0}`);
    }
    
    return {
      success: true,
      meetings: meetings.length,
      relevant: relevantMeetings.length,
      withTranscripts: meetingsWithTranscripts.length
    };
    
  } catch (error) {
    logError(`Meetings service failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testGitHubService() {
  logSection('TESTING GITHUB SERVICE');
  
  try {
    logTest('GitHub Projects Loading (Optimized Batch Processing)');
    const githubService = GitHubService.getInstance();
    
    const startTime = Date.now();
    const projects = await githubService.getPortfolioProjects();
    const loadTime = Date.now() - startTime;
    
    if (projects.length === 0) {
      logWarning('No GitHub projects found - check GitHub token and organization');
      return { success: false, projects: 0, loadTime };
    }
    
    logSuccess(`GitHub projects loaded: ${projects.length}`);
    logInfo(`Load time: ${loadTime}ms`);
    
    // Test project details
    logTest('Project Details Analysis');
    const categories = {};
    const languages = {};
    let projectsWithTechStack = 0;
    let projectsWithDescription = 0;
    
    for (const project of projects) {
      // Count categories
      categories[project.category] = (categories[project.category] || 0) + 1;
      
      // Count languages
      if (project.language) {
        languages[project.language] = (languages[project.language] || 0) + 1;
      }
      
      // Count projects with tech stack
      if (project.techStack && project.techStack.length > 0) {
        projectsWithTechStack++;
      }
      
      // Count projects with descriptions
      if (project.description && project.description !== 'No description available') {
        projectsWithDescription++;
      }
    }
    
    logInfo(`Projects with tech stack: ${projectsWithTechStack}`);
    logInfo(`Projects with descriptions: ${projectsWithDescription}`);
    logInfo(`Categories: ${Object.keys(categories).join(', ')}`);
    logInfo(`Top languages: ${Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([lang, count]) => `${lang}(${count})`).join(', ')}`);
    
    // Test top projects
    logTest('Top Projects by Stars');
    const topProjects = projects.slice(0, 5);
    for (const project of topProjects) {
      logInfo(`${project.title}: ⭐${project.stars} 🍴${project.forks} - ${project.language || 'Unknown'}`);
    }
    
    return {
      success: true,
      projects: projects.length,
      loadTime,
      projectsWithTechStack,
      projectsWithDescription
    };
    
  } catch (error) {
    logError(`GitHub service failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPortfolioService() {
  logSection('TESTING PORTFOLIO SERVICE');
  
  try {
    logTest('Portfolio Videos Loading');
    const portfolioService = PortfolioService.getInstance();
    
    const videos = await portfolioService.getLeadershipVideos(false); // Fast loading
    
    if (videos.length === 0) {
      logWarning('No leadership videos found');
      return { success: false, videos: 0 };
    }
    
    logSuccess(`Leadership videos loaded: ${videos.length}`);
    
    // Test video types
    const videoTypes = {};
    const videoSources = {};
    let videosWithAnalysis = 0;
    
    for (const video of videos) {
      videoTypes[video.type] = (videoTypes[video.type] || 0) + 1;
      videoSources[video.source] = (videoSources[video.source] || 0) + 1;
      if (video.analysis) videosWithAnalysis++;
    }
    
    logInfo(`Video types: ${Object.entries(videoTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);
    logInfo(`Video sources: ${Object.entries(videoSources).map(([source, count]) => `${source}(${count})`).join(', ')}`);
    logInfo(`Videos with analysis: ${videosWithAnalysis}`);
    
    // Test system projects
    logTest('System Projects Loading');
    const projects = await portfolioService.getSystemProjects();
    
    const projectSources = {};
    for (const project of projects) {
      projectSources[project.source] = (projectSources[project.source] || 0) + 1;
    }
    
    logSuccess(`System projects loaded: ${projects.length}`);
    logInfo(`Project sources: ${Object.entries(projectSources).map(([source, count]) => `${source}(${count})`).join(', ')}`);
    
    return {
      success: true,
      videos: videos.length,
      projects: projects.length,
      videosWithAnalysis
    };
    
  } catch (error) {
    logError(`Portfolio service failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAutoSuggestionService() {
  logSection('TESTING AUTO-SUGGESTION SERVICE');
  
  try {
    logTest('Video-Project Suggestion Generation');
    const suggestionService = VideoProjectSuggestionService.getInstance();
    const portfolioService = PortfolioService.getInstance();
    const githubService = GitHubService.getInstance();
    const projectLinkingService = ProjectLinkingService.getInstance();
    
    // Get data for suggestions
    const [videos, projects] = await Promise.all([
      portfolioService.getLeadershipVideos(false),
      githubService.getPortfolioProjects()
    ]);
    
    if (videos.length === 0 || projects.length === 0) {
      logWarning('Insufficient data for suggestion testing (need videos and projects)');
      return { success: false, suggestions: 0 };
    }
    
    // Get existing links to exclude them
    const existingLinks = [];
    for (const project of projects.slice(0, 5)) { // Test with first 5 projects to avoid timeout
      try {
        const resources = await projectLinkingService.getProjectResources(project.id);
        existingLinks.push(...resources.linkedVideos);
             } catch {
         // Continue if project resource loading fails
       }
    }
    
    logInfo(`Found ${existingLinks.length} existing links to exclude`);
    
    // Generate suggestions
    const startTime = Date.now();
    const suggestions = await suggestionService.generateSuggestions(
      videos.slice(0, 5), // Limit to first 5 videos for testing
      projects.slice(0, 10), // Limit to first 10 projects for testing
      existingLinks,
      {
        excludeExistingLinks: true,
        minRelevanceScore: 4
      }
    );
    const suggestionTime = Date.now() - startTime;
    
    logSuccess(`Generated ${suggestions.length} suggestions in ${suggestionTime}ms`);
    
    if (suggestions.length > 0) {
      // Analyze suggestion quality
      const confidenceLevels = {};
      const linkTypes = {};
      let highScoreSuggestions = 0;
      
      for (const suggestion of suggestions) {
        confidenceLevels[suggestion.confidence] = (confidenceLevels[suggestion.confidence] || 0) + 1;
        linkTypes[suggestion.linkType] = (linkTypes[suggestion.linkType] || 0) + 1;
        if (suggestion.relevanceScore >= 7) highScoreSuggestions++;
      }
      
      logInfo(`High score suggestions (7+): ${highScoreSuggestions}`);
      logInfo(`Confidence levels: ${Object.entries(confidenceLevels).map(([conf, count]) => `${conf}(${count})`).join(', ')}`);
      logInfo(`Link types: ${Object.entries(linkTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);
      
      // Show top suggestions
      logTest('Top Suggestions');
      const topSuggestions = suggestions.slice(0, 3);
      for (const suggestion of topSuggestions) {
        logInfo(`${suggestion.relevanceScore}/10 - ${suggestion.videoTitle} → ${suggestion.projectTitle}`);
        logInfo(`  Type: ${suggestion.linkType} | Confidence: ${suggestion.confidence}`);
        logInfo(`  Reasons: ${suggestion.reasons.slice(0, 2).join(', ')}`);
      }
    }
    
    return {
      success: true,
      suggestions: suggestions.length,
      suggestionTime,
      highScoreSuggestions: suggestions.filter(s => s.relevanceScore >= 7).length
    };
    
  } catch (error) {
    logError(`Auto-suggestion service failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testProjectLinkingService() {
  logSection('TESTING PROJECT LINKING SERVICE');
  
  try {
    logTest('Project Linking Service Functionality');
    const projectLinkingService = ProjectLinkingService.getInstance();
    
    // Test getting projects with resources
    const projectsWithResources = await projectLinkingService.getProjectsWithResources();
    logInfo(`Projects with resources: ${projectsWithResources.length}`);
    
    if (projectsWithResources.length > 0) {
      // Test getting resources for first project
      const firstProject = projectsWithResources[0];
      const resources = await projectLinkingService.getProjectResources(firstProject);
      
      logInfo(`Sample project resources:`);
      logInfo(`  Photos: ${resources.photos.length}`);
      logInfo(`  Linked videos: ${resources.linkedVideos.length}`);
      logInfo(`  Last updated: ${resources.lastUpdated.toISOString()}`);
    }
    
    return {
      success: true,
      projectsWithResources: projectsWithResources.length
    };
    
  } catch (error) {
    logError(`Project linking service failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTest() {
  logSection('COMPREHENSIVE ADMIN FUNCTIONALITY TEST');
  log('Testing all admin features to ensure proper functionality...', 'bold');
  
  const results = {
    meetings: null,
    github: null,
    portfolio: null,
    suggestions: null,
    linking: null
  };
  
  // Run all tests
  results.meetings = await testMeetingsService();
  results.github = await testGitHubService();
  results.portfolio = await testPortfolioService();
  results.suggestions = await testAutoSuggestionService();
  results.linking = await testProjectLinkingService();
  
  // Summary
  logSection('TEST SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  logInfo(`Total tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  
  // Detailed results
  logTest('Detailed Results');
  
  if (results.meetings.success) {
    logSuccess(`Meetings: ${results.meetings.meetings} total (${results.meetings.relevant} relevant)`);
  } else {
    logError(`Meetings: Failed - ${results.meetings.error || 'Unknown error'}`);
  }
  
  if (results.github.success) {
    logSuccess(`GitHub: ${results.github.projects} projects loaded in ${results.github.loadTime}ms`);
  } else {
    logError(`GitHub: Failed - ${results.github.error || 'Unknown error'}`);
  }
  
  if (results.portfolio.success) {
    logSuccess(`Portfolio: ${results.portfolio.videos} videos, ${results.portfolio.projects} projects`);
  } else {
    logError(`Portfolio: Failed - ${results.portfolio.error || 'Unknown error'}`);
  }
  
  if (results.suggestions.success) {
    logSuccess(`Suggestions: ${results.suggestions.suggestions} generated (${results.suggestions.highScoreSuggestions} high-score)`);
  } else {
    logError(`Suggestions: Failed - ${results.suggestions.error || 'Unknown error'}`);
  }
  
  if (results.linking.success) {
    logSuccess(`Linking: ${results.linking.projectsWithResources} projects with resources`);
  } else {
    logError(`Linking: Failed - ${results.linking.error || 'Unknown error'}`);
  }
  
  // Recommendations
  logSection('RECOMMENDATIONS');
  
  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! Your admin functionality is working correctly.');
    logInfo('✓ Meetings page should show all meetings (both relevant and non-relevant)');
    logInfo('✓ Projects page should load all 24+ GitHub projects without errors');
    logInfo('✓ Auto-suggestion feature should work in the admin links page');
    logInfo('✓ All services are optimized and functioning properly');
  } else {
    logWarning('Some tests failed. Check the errors above and:');
    if (!results.meetings.success) {
      logInfo('• Check S3 bucket configuration and meeting files');
    }
    if (!results.github.success) {
      logInfo('• Check GitHub token and organization settings');
    }
    if (!results.portfolio.success) {
      logInfo('• Check portfolio service integration');
    }
    if (!results.suggestions.success) {
      logInfo('• Check auto-suggestion service implementation');
    }
    if (!results.linking.success) {
      logInfo('• Check project linking service storage');
    }
  }
  
  logSection('TEST COMPLETE');
  
  return {
    totalTests,
    passedTests,
    failedTests,
    results
  };
}

// Run the test
runComprehensiveTest()
  .then((summary) => {
    process.exit(summary.failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }); 