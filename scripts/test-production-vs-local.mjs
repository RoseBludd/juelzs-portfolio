#!/usr/bin/env node

// Use Node.js built-in fetch (Node 18+)

const LOCAL_URL = 'http://localhost:3000';
const PRODUCTION_URL = 'https://juelzs-portfolio-4iflygbt2-juelzs-projects.vercel.app';

async function testPage(url, pageName) {
  try {
    console.log(`\n🧪 Testing ${pageName} at ${url}...`);
    
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Portfolio-Test-Bot/1.0'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ${pageName}: HTTP ${response.status} - ${response.statusText}`);
      return false;
    }
    
    const html = await response.text();
    
    // Check for common issues
    if (html.includes('Application error')) {
      console.log(`❌ ${pageName}: Application error detected`);
      return false;
    }
    
    if (html.includes('Internal Server Error')) {
      console.log(`❌ ${pageName}: Internal server error detected`);
      return false;
    }
    
    // Check for content loading
    const hasReact = html.includes('__NEXT_DATA__'); // Next.js app loaded
    
    console.log(`✅ ${pageName}: Loaded successfully`);
    console.log(`   📊 Content size: ${Math.round(html.length / 1024)}KB`);
    console.log(`   🔧 React app: ${hasReact ? 'Yes' : 'No'}`);
    
    // Page-specific checks
    if (pageName.includes('Projects')) {
      const hasProjectsContent = html.includes('Real Production Systems') || 
                                 html.includes('Active Projects') ||
                                 html.includes('AI Systems');
      console.log(`   🏗️ Projects content: ${hasProjectsContent ? 'Found' : 'Missing'}`);
    }
    
    if (pageName.includes('Leadership')) {
      const hasLeadershipContent = html.includes('Leadership in Action') || 
                                   html.includes('coaching') ||
                                   html.includes('video');
      console.log(`   👥 Leadership content: ${hasLeadershipContent ? 'Found' : 'Missing'}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ ${pageName}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Portfolio Production vs Local Test\n');
  console.log('=' .repeat(60));
  
  const tests = [
    // Local tests
    { url: `${LOCAL_URL}/projects`, name: 'Local Projects' },
    { url: `${LOCAL_URL}/leadership`, name: 'Local Leadership' },
    { url: `${LOCAL_URL}`, name: 'Local Home' },
    
    // Production tests  
    { url: `${PRODUCTION_URL}/projects`, name: 'Production Projects' },
    { url: `${PRODUCTION_URL}/leadership`, name: 'Production Leadership' },
    { url: `${PRODUCTION_URL}`, name: 'Production Home' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const success = await testPage(test.url, test.name);
    results.push({ ...test, success });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const localTests = results.filter(r => r.name.includes('Local'));
  const prodTests = results.filter(r => r.name.includes('Production'));
  
  console.log(`\n🏠 Local Environment:`);
  localTests.forEach(test => {
    console.log(`   ${test.success ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\n🌍 Production Environment:`);
  prodTests.forEach(test => {
    console.log(`   ${test.success ? '✅' : '❌'} ${test.name}`);
  });
  
  const allPassed = results.every(r => r.success);
  const localPassed = localTests.every(r => r.success);
  const prodPassed = prodTests.every(r => r.success);
  
  console.log(`\n🎯 Results:`);
  console.log(`   Local: ${localPassed ? '✅ All Good' : '❌ Issues Found'}`);
  console.log(`   Production: ${prodPassed ? '✅ All Good' : '❌ Issues Found'}`);
  console.log(`   Overall: ${allPassed ? '🎉 Perfect!' : '⚠️ Needs Attention'}`);
  
  if (!allPassed) {
    console.log(`\n🔧 Failed tests need investigation.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 Portfolio is working perfectly in both environments!`);
  }
}

// Verify fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ Node.js 18+ is required for built-in fetch support');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}); 