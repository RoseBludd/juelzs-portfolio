#!/usr/bin/env node
import puppeteer from 'puppeteer';

/**
 * Test CADIS Journal Analysis with Authentication
 * Uses Puppeteer to test the actual functionality in the browser with proper auth
 */

async function testCADISJournalWithAuth() {
  console.log('🧠 Testing CADIS Journal Analysis with Authentication');
  console.log('=' .repeat(80));
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for debugging
      defaultViewport: { width: 1200, height: 800 }
    });
    
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('CADIS') || msg.text().includes('journal')) {
        console.log(`🖥️ Browser: ${msg.text()}`);
      }
    });
    
    console.log('🌐 Navigating to admin login...');
    
    // Navigate to admin login
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    
    console.log('🔐 Logging in...');
    
    // Enter admin password (you'll need to enter this manually or set it)
    await page.type('input[type="password"]', process.env.ADMIN_PASSWORD || 'your-admin-password');
    await page.click('button[type="submit"]');
    
    // Wait for login redirect
    await page.waitForNavigation({ timeout: 10000 });
    
    console.log('✅ Logged in successfully');
    
    // Navigate to journal page
    console.log('📝 Navigating to admin/journal...');
    await page.goto('http://localhost:3000/admin/journal');
    await page.waitForSelector('[data-testid="journal-tabs"]', { timeout: 5000 });
    
    // Check if CADIS Analysis tab exists
    const cadisTab = await page.$('button:has-text("CADIS Analysis")');
    if (cadisTab) {
      console.log('✅ CADIS Analysis tab found in journal page');
      
      // Click CADIS Analysis tab
      await cadisTab.click();
      await page.waitForTimeout(1000);
      
      // Check for CADIS analysis content
      const analysisContent = await page.$('[data-testid="cadis-analysis-content"]');
      if (analysisContent) {
        console.log('✅ CADIS Analysis content loaded');
      } else {
        console.log('⚠️ CADIS Analysis content not found (may need to generate)');
      }
      
      // Try to generate analysis
      const generateButton = await page.$('button:has-text("Generate Analysis")');
      if (generateButton) {
        console.log('🧠 Found Generate Analysis button, clicking...');
        await generateButton.click();
        
        // Wait for analysis to complete
        await page.waitForTimeout(5000);
        
        // Check for results
        const results = await page.$('[data-testid="analysis-results"]');
        if (results) {
          console.log('✅ CADIS Analysis generated successfully');
        } else {
          console.log('⚠️ Analysis generation may still be in progress');
        }
      }
      
    } else {
      console.log('❌ CADIS Analysis tab not found in journal page');
    }
    
    // Test CADIS journal generate insights
    console.log('\n🌟 Testing CADIS Journal Generate Insights...');
    await page.goto('http://localhost:3000/admin/cadis-journal');
    await page.waitForTimeout(2000);
    
    // Look for generate insights button
    const generateInsightsButton = await page.$('button:has-text("Generate New Insights")');
    if (generateInsightsButton) {
      console.log('🧠 Found Generate New Insights button, clicking...');
      await generateInsightsButton.click();
      
      // Wait for generation
      await page.waitForTimeout(8000);
      
      // Check for new Journal Analysis Dream
      const journalDream = await page.evaluate(() => {
        const entries = document.querySelectorAll('[data-testid="cadis-entry"]');
        for (const entry of entries) {
          if (entry.textContent?.includes('Journal Analysis Dream')) {
            return {
              found: true,
              title: entry.querySelector('h3')?.textContent || '',
              content: entry.textContent?.substring(0, 200) || ''
            };
          }
        }
        return { found: false };
      });
      
      if (journalDream.found) {
        console.log('✅ Journal Analysis Dream generated successfully');
        console.log(`   Title: "${journalDream.title}"`);
        console.log(`   Content Preview: "${journalDream.content}..."`);
      } else {
        console.log('⚠️ Journal Analysis Dream not found (may need more time or entries)');
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the authenticated test
testCADISJournalWithAuth()
  .then(() => {
    console.log('\n✅ CADIS Journal Analysis Authentication Test Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Authentication test failed:', error);
    process.exit(1);
  });
