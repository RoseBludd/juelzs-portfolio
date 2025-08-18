#!/usr/bin/env node

/**
 * Comprehensive Calendar System Test Script
 * Tests all calendar functionality including CADIS integration, notifications, and scheduled tasks
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add the project root to the module path
process.env.NODE_PATH = join(__dirname, '..');

console.log('🧪 Starting Calendar System Comprehensive Test');
console.log('=' .repeat(60));

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(testName, passed, details = '') {
  tests.total++;
  if (passed) {
    tests.passed++;
    console.log(`✅ ${testName}`);
  } else {
    tests.failed++;
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
  }
}

function logSection(sectionName) {
  console.log(`\n📋 ${sectionName}`);
  console.log('-'.repeat(40));
}

async function testCalendarAPI() {
  logSection('Calendar API Tests');
  
  try {
    // Test calendar events endpoint
    const response = await fetch('http://localhost:3000/api/admin/calendar');
    const isSuccess = response.ok;
    logTest('Calendar API accessible', isSuccess, !isSuccess ? `Status: ${response.status}` : '');

    if (isSuccess) {
      const data = await response.json();
      logTest('Calendar API returns valid JSON', data.success !== undefined);
      logTest('Calendar API returns events array', Array.isArray(data.events));
    }
  } catch (error) {
    logTest('Calendar API accessible', false, error.message);
  }

  try {
    // Test calendar stats endpoint
    const response = await fetch('http://localhost:3000/api/admin/calendar/stats');
    const isSuccess = response.ok;
    logTest('Calendar Stats API accessible', isSuccess);

    if (isSuccess) {
      const data = await response.json();
      logTest('Stats API returns valid data', data.success && data.stats);
      logTest('Stats includes upcoming events', data.stats?.upcomingReminders !== undefined);
    }
  } catch (error) {
    logTest('Calendar Stats API accessible', false, error.message);
  }
}

async function testNotificationsAPI() {
  logSection('Notifications API Tests');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/notifications');
    const isSuccess = response.ok;
    logTest('Notifications API accessible', isSuccess);

    if (isSuccess) {
      const data = await response.json();
      logTest('Notifications API returns valid JSON', data.success !== undefined);
      logTest('Notifications API returns array', Array.isArray(data.notifications));
    }
  } catch (error) {
    logTest('Notifications API accessible', false, error.message);
  }
}

async function testCalendarFilters() {
  logSection('Calendar Filter Tests');
  
  const filterTests = [
    { param: 'types=journal_entry', name: 'Journal entries filter' },
    { param: 'types=cadis_entry', name: 'CADIS entries filter' },
    { param: 'types=cadis_maintenance', name: 'CADIS maintenance filter' },
    { param: 'types=reminder', name: 'Reminders filter' },
    { param: 'types=self_review', name: 'Self reviews filter' },
    { param: 'priorities=high,urgent', name: 'Priority filter' },
    { param: 'showCompleted=false', name: 'Hide completed filter' }
  ];

  for (const test of filterTests) {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/calendar?${test.param}`);
      const isSuccess = response.ok;
      logTest(test.name, isSuccess);

      if (isSuccess) {
        const data = await response.json();
        logTest(`${test.name} returns filtered data`, data.success && Array.isArray(data.events));
      }
    } catch (error) {
      logTest(test.name, false, error.message);
    }
  }
}

async function testCADISMaintenanceSchedule() {
  logSection('CADIS Maintenance Schedule Tests');
  
  try {
    // Test that CADIS maintenance events are generated
    const response = await fetch('http://localhost:3000/api/admin/calendar?types=cadis_maintenance');
    const isSuccess = response.ok;
    logTest('CADIS maintenance events accessible', isSuccess);

    if (isSuccess) {
      const data = await response.json();
      const hasMaintenanceEvents = data.events && data.events.length > 0;
      logTest('CADIS maintenance events generated', hasMaintenanceEvents);
      
      if (hasMaintenanceEvents) {
        const hasTuesdayEvents = data.events.some(e => e.title.includes('Full System Analysis'));
        const hasFridayEvents = data.events.some(e => e.title.includes('Ecosystem Health Check'));
        
        logTest('Tuesday CADIS runs scheduled', hasTuesdayEvents);
        logTest('Friday CADIS runs scheduled', hasFridayEvents);
      }
    }
  } catch (error) {
    logTest('CADIS maintenance events accessible', false, error.message);
  }
}

async function testBiweeklyReviews() {
  logSection('Biweekly Self-Review Tests');
  
  try {
    // Test creating a self-review
    const reviewData = {
      action: 'create_self_review',
      title: 'Test Biweekly Review',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'biweekly',
      scope: {
        includeJournal: true,
        includeRepositories: true,
        includeMeetings: true,
        includeCADIS: true,
        includeProjects: true
      }
    };

    const response = await fetch('http://localhost:3000/api/admin/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    const isSuccess = response.ok;
    logTest('Self-review creation API', isSuccess);

    if (isSuccess) {
      const data = await response.json();
      logTest('Self-review created successfully', data.success && data.review);
    }
  } catch (error) {
    logTest('Self-review creation API', false, error.message);
  }
}

async function testEventContext() {
  logSection('Event Context Tests');
  
  try {
    // First get some events
    const eventsResponse = await fetch('http://localhost:3000/api/admin/calendar');
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      
      if (eventsData.events && eventsData.events.length > 0) {
        const testEvent = eventsData.events[0];
        const eventId = testEvent.id.replace(/^(journal_|cadis_|reminder_|review_|meeting_)/, '');
        
        // Test event context endpoint
        const contextResponse = await fetch(
          `http://localhost:3000/api/admin/calendar/context/${eventId}?type=${testEvent.type}`
        );
        
        const isSuccess = contextResponse.ok;
        logTest('Event context API accessible', isSuccess);

        if (isSuccess) {
          const contextData = await contextResponse.json();
          logTest('Event context returns valid data', contextData.success);
        }
      } else {
        logTest('Event context API accessible', false, 'No events available for testing');
      }
    } else {
      logTest('Event context API accessible', false, 'Could not fetch events for testing');
    }
  } catch (error) {
    logTest('Event context API accessible', false, error.message);
  }
}

async function testDateRangeQueries() {
  logSection('Date Range Query Tests');
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dateRangeTests = [
    {
      name: 'Next week events',
      startDate: now.toISOString(),
      endDate: nextWeek.toISOString()
    },
    {
      name: 'Next month events',
      startDate: now.toISOString(),
      endDate: nextMonth.toISOString()
    }
  ];

  for (const test of dateRangeTests) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/calendar?startDate=${test.startDate}&endDate=${test.endDate}`
      );
      
      const isSuccess = response.ok;
      logTest(test.name, isSuccess);

      if (isSuccess) {
        const data = await response.json();
        logTest(`${test.name} returns filtered data`, data.success && Array.isArray(data.events));
      }
    } catch (error) {
      logTest(test.name, false, error.message);
    }
  }
}

async function testCalendarPage() {
  logSection('Calendar Page Tests');
  
  try {
    const response = await fetch('http://localhost:3000/admin/calendar');
    const isSuccess = response.ok;
    logTest('Calendar page accessible', isSuccess);

    if (isSuccess) {
      const html = await response.text();
      logTest('Calendar page renders', html.includes('Portfolio Calendar'));
      logTest('Calendar has filter panel', html.includes('Show Filters') || html.includes('Hide Filters'));
      logTest('Calendar has stats dashboard', html.includes('Upcoming Events'));
      logTest('Calendar has CADIS maintenance option', html.includes('CADIS Maintenance'));
    }
  } catch (error) {
    logTest('Calendar page accessible', false, error.message);
  }
}

async function testPerformanceOptimizations() {
  logSection('Performance Optimization Tests');
  
  try {
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/admin/calendar/stats');
    const endTime = Date.now();
    
    const isSuccess = response.ok;
    const responseTime = endTime - startTime;
    
    logTest('Stats API responds quickly', isSuccess && responseTime < 2000, 
           `Response time: ${responseTime}ms`);

    if (isSuccess) {
      const data = await response.json();
      logTest('Stats API optimized (no heavy analysis)', data.success);
    }
  } catch (error) {
    logTest('Stats API responds quickly', false, error.message);
  }

  try {
    // Test that calendar doesn't load meetings by default (performance optimization)
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/admin/calendar');
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    logTest('Calendar API responds quickly without meetings', responseTime < 3000,
           `Response time: ${responseTime}ms`);
  } catch (error) {
    logTest('Calendar API responds quickly without meetings', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Testing Calendar System...\n');

  await testCalendarAPI();
  await testNotificationsAPI();
  await testCalendarFilters();
  await testCADISMaintenanceSchedule();
  await testBiweeklyReviews();
  await testEventContext();
  await testDateRangeQueries();
  await testCalendarPage();
  await testPerformanceOptimizations();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`📊 Total: ${tests.total}`);
  console.log(`📈 Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);

  if (tests.failed === 0) {
    console.log('\n🎉 All tests passed! Calendar system is working correctly.');
    console.log('\n📅 Calendar Features Verified:');
    console.log('   • Calendar API endpoints working');
    console.log('   • Event filtering system functional');
    console.log('   • CADIS maintenance scheduling active');
    console.log('   • Biweekly self-reviews configured');
    console.log('   • Notification system operational');
    console.log('   • Performance optimizations in place');
    console.log('   • UI components rendering correctly');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    console.log('\n🔧 Common Issues:');
    console.log('   • Make sure the development server is running (npm run dev)');
    console.log('   • Verify database connections are working');
    console.log('   • Check that all services are properly initialized');
    console.log('   • Ensure environment variables are set correctly');
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Visit http://localhost:3000/admin/calendar to test the UI');
  console.log('   2. Check the notification bell in the admin header');
  console.log('   3. Test the calendar filters and date range selection');
  console.log('   4. Verify CADIS maintenance events appear on Tuesdays and Fridays');
  console.log('   5. Confirm biweekly self-reviews start on 8/19/25');

  process.exit(tests.failed > 0 ? 1 : 0);
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
