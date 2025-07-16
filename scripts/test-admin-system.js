#!/usr/bin/env node

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = 'TheWorldIsYours'; // Admin password from .env
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

class AdminTester {
  constructor() {
    this.cookies = '';
    this.testResults = [];
  }

  log(message, color = COLORS.RESET) {
    console.log(`${color}${message}${COLORS.RESET}`);
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies,
          ...options.headers
        }
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          // Store cookies for session management
          if (res.headers['set-cookie']) {
            this.cookies = res.headers['set-cookie'].join('; ');
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            cookies: res.headers['set-cookie']
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async runTest(testName, testFn) {
    try {
      this.log(`\n🧪 Testing: ${testName}`, COLORS.BLUE);
      const result = await testFn();
      this.testResults.push({ name: testName, passed: true, result });
      this.log(`✅ PASS: ${testName}`, COLORS.GREEN);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      this.log(`❌ FAIL: ${testName} - ${error.message}`, COLORS.RED);
      throw error;
    }
  }

  async testLoginPage() {
    return this.runTest('Admin Login Page Access', async () => {
      const response = await this.makeRequest('/admin/login');
      
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      
      if (!response.body.includes('Portfolio Admin')) {
        throw new Error('Login page content not found');
      }
      
      return 'Login page loads correctly';
    });
  }

  async testUnauthenticatedAdminAccess() {
    return this.runTest('Unauthenticated Admin Access Blocked', async () => {
      const response = await this.makeRequest('/admin');
      
      // Should redirect to login (302/307) or be forbidden (403)
      if (![302, 307, 403].includes(response.statusCode)) {
        throw new Error(`Expected redirect or 403, got ${response.statusCode}`);
      }
      
      return 'Unauthenticated access properly blocked';
    });
  }

  async testAdminLogin() {
    return this.runTest('Admin Authentication', async () => {
      const response = await this.makeRequest('/api/admin/login', {
        method: 'POST',
        body: { password: ADMIN_PASSWORD }
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Login failed with status ${response.statusCode}: ${response.body}`);
      }
      
      const result = JSON.parse(response.body);
      if (!result.success) {
        throw new Error(`Login failed: ${result.error}`);
      }
      
      if (!response.cookies || !response.cookies.some(c => c.includes('admin-auth'))) {
        throw new Error('Authentication cookie not set');
      }
      
      return 'Authentication successful';
    });
  }

  async testAdminDashboard() {
    return this.runTest('Admin Dashboard Access', async () => {
      const response = await this.makeRequest('/admin');
      
      if (response.statusCode !== 200) {
        throw new Error(`Dashboard access failed: ${response.statusCode}`);
      }
      
      const expectedElements = [
        'Portfolio Admin Dashboard',
        'Total Projects',
        'Leadership Videos',
        'Meeting Recordings',
        'Portfolio Relevant',
        'Quick Actions'
      ];
      
      for (const element of expectedElements) {
        if (!response.body.includes(element)) {
          throw new Error(`Dashboard missing element: ${element}`);
        }
      }
      
      return 'Dashboard loads with all expected elements';
    });
  }

  async testMeetingsPage() {
    return this.runTest('Meetings Management Page', async () => {
      const response = await this.makeRequest('/admin/meetings');
      
      if (response.statusCode !== 200) {
        throw new Error(`Meetings page failed: ${response.statusCode}`);
      }
      
      // Check for meetings page content
      if (!response.body.includes('Meeting Management') && !response.body.includes('meeting')) {
        throw new Error('Meetings page content not found');
      }
      
      return 'Meetings page loads correctly';
    });
  }

  async testApiEndpoints() {
    const endpoints = [
      {
        path: '/api/admin/meetings/toggle',
        method: 'POST',
        body: { meetingId: 'test-meeting', portfolioRelevant: true },
        description: 'Meeting Toggle API'
      },
      {
        path: '/api/admin/meetings/link',
        method: 'GET',
        description: 'Meeting Links API'
      }
    ];

    for (const endpoint of endpoints) {
      await this.runTest(`API: ${endpoint.description}`, async () => {
        const response = await this.makeRequest(endpoint.path, {
          method: endpoint.method,
          body: endpoint.body
        });
        
        // Allow 200 (success) or 400 (validation error) or 404 (not found) - just not 500
        if (response.statusCode >= 500) {
          throw new Error(`Server error: ${response.statusCode}`);
        }
        
        return `API endpoint responsive (${response.statusCode})`;
      });
    }
  }

  async testNavigation() {
    return this.runTest('Admin Navigation', async () => {
      const navPages = [
        '/admin',
        '/admin/meetings'
      ];
      
      const results = [];
      for (const page of navPages) {
        const response = await this.makeRequest(page);
        if (response.statusCode !== 200) {
          throw new Error(`Navigation to ${page} failed: ${response.statusCode}`);
        }
        results.push(`${page}: OK`);
      }
      
      return `All navigation pages accessible: ${results.join(', ')}`;
    });
  }

  async testLogout() {
    return this.runTest('Admin Logout', async () => {
      const response = await this.makeRequest('/api/admin/logout', {
        method: 'POST'
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Logout failed: ${response.statusCode}`);
      }
      
      const result = JSON.parse(response.body);
      if (!result.success) {
        throw new Error('Logout response not successful');
      }
      
      // Clear our stored cookies
      this.cookies = '';
      
      return 'Logout successful';
    });
  }

  async testPostLogoutAccess() {
    return this.runTest('Post-Logout Access Control', async () => {
      const response = await this.makeRequest('/admin');
      
      // Should redirect to login after logout
      if (![302, 307, 403].includes(response.statusCode)) {
        throw new Error(`Expected redirect after logout, got ${response.statusCode}`);
      }
      
      return 'Access properly restricted after logout';
    });
  }

  async checkServerHealth() {
    return this.runTest('Server Health Check', async () => {
      const response = await this.makeRequest('/');
      
      if (response.statusCode !== 200) {
        throw new Error(`Server not responding: ${response.statusCode}`);
      }
      
      return 'Server is healthy';
    });
  }

  async runAllTests() {
    this.log(`\n${COLORS.BOLD}🚀 Starting Admin System Comprehensive Test Suite${COLORS.RESET}`);
    this.log(`${COLORS.BLUE}Target: ${BASE_URL}${COLORS.RESET}`);
    this.log(`${COLORS.YELLOW}Password: ${ADMIN_PASSWORD}${COLORS.RESET}\n`);

    try {
      // Phase 1: Basic server and page access
      this.log(`\n${COLORS.BOLD}📋 Phase 1: Basic Access Tests${COLORS.RESET}`);
      await this.checkServerHealth();
      await this.testLoginPage();
      await this.testUnauthenticatedAdminAccess();

      // Phase 2: Authentication flow
      this.log(`\n${COLORS.BOLD}🔐 Phase 2: Authentication Tests${COLORS.RESET}`);
      await this.testAdminLogin();
      await this.testAdminDashboard();

      // Phase 3: Admin functionality
      this.log(`\n${COLORS.BOLD}⚙️ Phase 3: Admin Functionality Tests${COLORS.RESET}`);
      await this.testMeetingsPage();
      await this.testNavigation();
      await this.testApiEndpoints();

      // Phase 4: Session management
      this.log(`\n${COLORS.BOLD}🔄 Phase 4: Session Management Tests${COLORS.RESET}`);
      await this.testLogout();
      await this.testPostLogoutAccess();

    } catch (error) {
      this.log(`\n${COLORS.RED}Test suite stopped due to critical failure: ${error.message}${COLORS.RESET}`);
    }

    this.generateReport();
  }

  generateReport() {
    this.log(`\n${COLORS.BOLD}📊 TEST REPORT${COLORS.RESET}`);
    this.log(`${'='.repeat(50)}`);
    
    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    this.log(`Total Tests: ${total}`);
    this.log(`Passed: ${passed}`, COLORS.GREEN);
    this.log(`Failed: ${total - passed}`, COLORS.RED);
    this.log(`Success Rate: ${percentage}%`, percentage >= 90 ? COLORS.GREEN : COLORS.YELLOW);
    
    this.log(`\n${COLORS.BOLD}DETAILED RESULTS:${COLORS.RESET}`);
    this.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      const color = test.passed ? COLORS.GREEN : COLORS.RED;
      this.log(`${status} ${test.name}`, color);
      if (!test.passed) {
        this.log(`   Error: ${test.error}`, COLORS.RED);
      }
    });
    
    if (percentage >= 90) {
      this.log(`\n${COLORS.GREEN}${COLORS.BOLD}🎉 ADMIN SYSTEM FULLY OPERATIONAL!${COLORS.RESET}`);
    } else if (percentage >= 70) {
      this.log(`\n${COLORS.YELLOW}${COLORS.BOLD}⚠️ ADMIN SYSTEM MOSTLY WORKING - MINOR ISSUES${COLORS.RESET}`);
    } else {
      this.log(`\n${COLORS.RED}${COLORS.BOLD}🚨 ADMIN SYSTEM HAS SIGNIFICANT ISSUES${COLORS.RESET}`);
    }
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new AdminTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AdminTester; 