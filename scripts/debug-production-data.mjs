import { chromium } from 'playwright';

const LOCAL_URL = 'http://localhost:3000';
const PRODUCTION_URL = 'https://juelzs-portfolio-4iflygbt2-juelzs-projects.vercel.app';

async function debugPage(url, pageName) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log(`\n🔍 Debugging ${pageName} at ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check for specific content elements
    const results = await page.evaluate(() => {
      const results = {};
      
      // Leadership page checks
      if (window.location.pathname === '/leadership') {
        const videoCards = document.querySelectorAll('[key^="s3-"], [key^="manual-"]');
        const analysisToggles = document.querySelectorAll('[class*="analysis"]');
        results.videoCount = videoCards.length;
        results.analysisCount = analysisToggles.length;
        results.videos = Array.from(videoCards).map(card => ({
          id: card.getAttribute('key'),
          title: card.querySelector('h3')?.textContent?.trim(),
          hasAnalysis: card.querySelector('[class*="analysis"]') !== null
        }));
      }
      
      // Projects page checks  
      if (window.location.pathname === '/projects') {
        const projectCards = document.querySelectorAll('[class*="card"]');
        const stats = document.querySelectorAll('[class*="text-3xl"]');
        results.projectCount = projectCards.length;
        results.stats = Array.from(stats).map(stat => stat.textContent?.trim()).filter(Boolean);
        results.projects = Array.from(projectCards).slice(0, 3).map(card => ({
          title: card.querySelector('h3')?.textContent?.trim(),
          description: card.querySelector('p')?.textContent?.trim()?.substring(0, 50)
        }));
      }
      
      // Home page checks
      if (window.location.pathname === '/') {
        const videoSections = document.querySelectorAll('[class*="video"]');
        const projectSections = document.querySelectorAll('[class*="project"]');
        results.videoSections = videoSections.length;
        results.projectSections = projectSections.length;
      }
      
      return results;
    });
    
    console.log(`📊 Results:`, JSON.stringify(results, null, 2));
    
    // Check console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });
    
    // Wait a bit for any async operations
    await page.waitForTimeout(3000);
    
    if (logs.length > 0) {
      console.log(`❌ Console Errors:`, logs);
    }
    
  } catch (error) {
    console.error(`❌ Error debugging ${pageName}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function runDebug() {
  console.log('🚀 Starting Production Data Debug\n');
  
  // Test local first
  await debugPage(`${LOCAL_URL}/leadership`, 'Local Leadership');
  await debugPage(`${LOCAL_URL}/projects`, 'Local Projects');
  
  // Test production
  await debugPage(`${PRODUCTION_URL}/leadership`, 'Production Leadership');
  await debugPage(`${PRODUCTION_URL}/projects`, 'Production Projects');
  
  console.log('\n✅ Debug complete');
}

runDebug().catch(console.error); 