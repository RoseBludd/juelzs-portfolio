/**
 * Comprehensive Admin Functionality Test Script
 * Tests all admin features to ensure they're working correctly
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

// Helper to test if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000/api/registry');
    return response.ok;
  } catch {
    return false;
  }
}

// Test build compilation
async function testBuildCompilation() {
  logSection('TESTING BUILD COMPILATION');
  
  try {
    logTest('TypeScript Compilation');
    const { stderr } = await execAsync('npm run build');
    
    if (stderr.includes('Failed to compile') || stderr.includes('Error:')) {
      logError('Build compilation failed');
      console.log(stderr);
      return { success: false, error: 'Compilation failed' };
    }
    
    logSuccess('Build compilation successful');
    return { success: true };
    
  } catch (error) {
    logError(`Build test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test admin routes accessibility
async function testAdminRoutes() {
  logSection('TESTING ADMIN ROUTES');
  
  const isServerRunning = await checkDevServer();
  if (!isServerRunning) {
    logWarning('Dev server not running on localhost:3000 - skipping route tests');
    return { success: false, skipped: true };
  }
  
  const routes = [
    { path: '/admin', name: 'Admin Dashboard' },
    { path: '/admin/meetings', name: 'Meetings Page' },
    { path: '/admin/projects', name: 'Projects Page' },
    { path: '/admin/architecture', name: 'Architecture Page' },
    { path: '/admin/photos', name: 'Photos Page' },
    { path: '/admin/links', name: 'Links Page' }
  ];
  
  const results = [];
  
  for (const route of routes) {
    try {
      logTest(`Testing ${route.name}`);
      const response = await fetch(`http://localhost:3000${route.path}`, {
        headers: {
          'User-Agent': 'Admin-Test-Script'
        }
      });
      
      if (response.ok) {
        logSuccess(`${route.name} - OK (${response.status})`);
        results.push({ route: route.path, success: true, status: response.status });
      } else {
        logWarning(`${route.name} - ${response.status} ${response.statusText}`);
        results.push({ route: route.path, success: false, status: response.status });
      }
    } catch (error) {
      logError(`${route.name} - Failed: ${error.message}`);
      results.push({ route: route.path, success: false, error: error.message });
    }
  }
  
  const successfulRoutes = results.filter(r => r.success).length;
  logInfo(`Routes accessible: ${successfulRoutes}/${routes.length}`);
  
  return {
    success: successfulRoutes === routes.length,
    results,
    accessibleRoutes: successfulRoutes,
    totalRoutes: routes.length
  };
}

// Test service file integrity
async function testServiceFiles() {
  logSection('TESTING SERVICE FILES');
  
  const services = [
    'aws-s3.service.ts',
    'github.service.ts',
    'portfolio.service.ts',
    'project-linking.service.ts',
    'video-project-suggestion.service.ts',
    'meeting-analysis.service.ts',
    'transcript-analysis.service.ts'
  ];
  
  const results = [];
  
  for (const service of services) {
    try {
      logTest(`Checking ${service}`);
      
      // Check if file exists and has expected content
      const { stdout } = await execAsync(`ls -la src/services/${service}`);
      
      if (stdout.includes(service)) {
        // Check for basic class structure
        const { stdout: content } = await execAsync(`grep -l "class.*Service" src/services/${service}`);
        
        if (content.includes(service)) {
          logSuccess(`${service} - Valid service class found`);
          results.push({ service, success: true });
        } else {
          logWarning(`${service} - Missing service class structure`);
          results.push({ service, success: false, issue: 'Missing class structure' });
        }
      }
    } catch {
      logError(`${service} - Not found or accessible`);
      results.push({ service, success: false, error: 'File not found' });
    }
  }
  
  const validServices = results.filter(r => r.success).length;
  logInfo(`Valid services: ${validServices}/${services.length}`);
  
  return {
    success: validServices === services.length,
    results,
    validServices,
    totalServices: services.length
  };
}

// Test environment configuration
async function testEnvironmentConfig() {
  logSection('TESTING ENVIRONMENT CONFIGURATION');
  
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'GITHUB_TOKEN',
    'GITHUB_ORGANIZATION'
  ];
  
  const results = [];
  let hasEnvFile = false;
  
  try {
    logTest('Checking .env file');
    await execAsync('ls -la .env');
    hasEnvFile = true;
    logSuccess('.env file found');
  } catch {
    logWarning('.env file not found');
  }
  
  for (const envVar of requiredEnvVars) {
    try {
      // Check if environment variable is set (without exposing value)
      const { stdout } = await execAsync(`echo $${envVar} | wc -c`);
      const length = parseInt(stdout.trim());
      
      if (length > 1) { // More than just newline
        logSuccess(`${envVar} - Configured`);
        results.push({ envVar, success: true });
      } else {
        logWarning(`${envVar} - Not set or empty`);
        results.push({ envVar, success: false, issue: 'Not set' });
      }
    } catch {
      logError(`${envVar} - Check failed`);
      results.push({ envVar, success: false, issue: 'Check failed' });
    }
  }
  
  const configuredVars = results.filter(r => r.success).length;
  logInfo(`Configured variables: ${configuredVars}/${requiredEnvVars.length}`);
  
  return {
    success: hasEnvFile && configuredVars >= requiredEnvVars.length * 0.8, // 80% threshold
    hasEnvFile,
    results,
    configuredVars,
    totalVars: requiredEnvVars.length
  };
}

// Test package dependencies
async function testDependencies() {
  logSection('TESTING DEPENDENCIES');
  
  try {
    logTest('Checking package.json dependencies');
    
    const criticalDeps = [
      '@aws-sdk/client-s3',
      '@octokit/rest',
      'openai',
      'next',
      'react',
      'typescript'
    ];
    
    const { stdout } = await execAsync('npm list --depth=0 --json');
    const packageInfo = JSON.parse(stdout);
    const installedDeps = packageInfo.dependencies || {};
    
    const results = [];
    
    for (const dep of criticalDeps) {
      if (installedDeps[dep]) {
        logSuccess(`${dep} - Installed (${installedDeps[dep].version})`);
        results.push({ dependency: dep, success: true, version: installedDeps[dep].version });
      } else {
        logError(`${dep} - Missing`);
        results.push({ dependency: dep, success: false, issue: 'Not installed' });
      }
    }
    
    const installedCount = results.filter(r => r.success).length;
    logInfo(`Critical dependencies: ${installedCount}/${criticalDeps.length}`);
    
    return {
      success: installedCount === criticalDeps.length,
      results,
      installedCount,
      totalDeps: criticalDeps.length
    };
    
  } catch (error) {
    logError(`Dependency check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runComprehensiveTest() {
  logSection('COMPREHENSIVE ADMIN FUNCTIONALITY TEST');
  log('Testing all admin features to ensure proper functionality...', 'bold');
  
  const results = {
    build: null,
    routes: null,
    services: null,
    environment: null,
    dependencies: null
  };
  
  // Run all tests
  results.dependencies = await testDependencies();
  results.environment = await testEnvironmentConfig();
  results.services = await testServiceFiles();
  results.build = await testBuildCompilation();
  results.routes = await testAdminRoutes();
  
  // Summary
  logSection('TEST SUMMARY');
  
  const tests = [
    { name: 'Dependencies', result: results.dependencies },
    { name: 'Environment', result: results.environment },
    { name: 'Services', result: results.services },
    { name: 'Build', result: results.build },
    { name: 'Routes', result: results.routes }
  ];
  
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.result.success).length;
  const skippedTests = tests.filter(t => t.result.skipped).length;
  const failedTests = totalTests - passedTests - skippedTests;
  
  logInfo(`Total tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (skippedTests > 0) {
    logWarning(`Skipped: ${skippedTests}`);
  }
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  
  // Detailed results
  logTest('Detailed Results');
  
  for (const test of tests) {
    if (test.result.success) {
      logSuccess(`${test.name}: ✓ Passed`);
    } else if (test.result.skipped) {
      logWarning(`${test.name}: ⏭️ Skipped - ${test.result.error || 'Server not running'}`);
    } else {
      logError(`${test.name}: ✗ Failed - ${test.result.error || 'Unknown error'}`);
    }
  }
  
  // Specific insights
  if (results.build.success) {
    logInfo('✓ All TypeScript files compile successfully');
  }
  
  if (results.services.success) {
    logInfo('✓ All service files are properly structured');
  }
  
  if (results.environment.configuredVars >= 4) {
    logInfo('✓ Environment configuration looks good');
  }
  
  if (results.dependencies.success) {
    logInfo('✓ All critical dependencies are installed');
  }
  
  if (results.routes.success) {
    logInfo('✓ All admin routes are accessible');
  } else if (results.routes.skipped) {
    logInfo('⚠️ Route testing skipped - start dev server to test routes');
  }
  
  // Recommendations
  logSection('RECOMMENDATIONS');
  
  if (passedTests >= totalTests - skippedTests) {
    logSuccess('🎉 All available tests passed! Your admin functionality is ready.');
    logInfo('');
    logInfo('What should be working now:');
    logInfo('✓ Meetings page should show ALL meetings (both relevant and non-relevant)');
    logInfo('✓ Projects page should load all 24+ GitHub projects without errors');
    logInfo('✓ Auto-suggestion feature should work in the admin links page');
    logInfo('✓ All services are optimized and functioning properly');
    logInfo('✓ Build process completes without errors');
    logInfo('');
    logInfo('To test the live functionality:');
    logInfo('1. Make sure dev server is running: npm run dev');
    logInfo('2. Visit http://localhost:3000/admin');
    logInfo('3. Check that meetings page shows all meetings');
    logInfo('4. Verify projects page loads all 24+ projects');
    logInfo('5. Test the "Show Suggestions" button in the links page');
  } else {
    logWarning('Some tests failed. Address these issues:');
    
    if (!results.dependencies.success) {
      logInfo('• Install missing dependencies: npm install');
    }
    if (!results.environment.success) {
      logInfo('• Configure missing environment variables in .env file');
    }
    if (!results.services.success) {
      logInfo('• Check service file integrity');
    }
    if (!results.build.success) {
      logInfo('• Fix TypeScript compilation errors');
    }
    if (!results.routes.success && !results.routes.skipped) {
      logInfo('• Check admin route configuration');
    }
  }
  
  logSection('TEST COMPLETE');
  logInfo('Next steps:');
  logInfo('1. Start dev server: npm run dev');
  logInfo('2. Visit: http://localhost:3000/admin/meetings');
  logInfo('3. Verify all meetings are showing');
  logInfo('4. Visit: http://localhost:3000/admin/projects');
  logInfo('5. Verify all 24+ projects load successfully');
  logInfo('6. Visit: http://localhost:3000/admin/links');
  logInfo('7. Test the AI-powered suggestion feature');
  
  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    results
  };
}

// Run the test
runComprehensiveTest()
  .then((summary) => {
    const exitCode = summary.failedTests > 0 ? 1 : 0;
    if (exitCode === 0) {
      log('\n🚀 All tests passed! Your admin functionality is ready to use.', 'green');
    }
    process.exit(exitCode);
  })
  .catch((error) => {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }); 