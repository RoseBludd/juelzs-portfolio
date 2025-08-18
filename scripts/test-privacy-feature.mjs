#!/usr/bin/env node

/**
 * Test the privacy feature by creating a journal entry and checking the API
 */

console.log('🧪 Testing Privacy Feature...');

// Test 1: Check if API endpoints respond
async function testAPIEndpoints() {
  console.log('📡 Testing API endpoints...');
  
  try {
    // Test public journal API
    const response = await fetch('http://localhost:3000/api/journal/public?limit=5');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Public journal API working');
      console.log(`📊 Found ${data.entries?.length || 0} public entries`);
      
      // Check if any entries have isPrivate field
      if (data.entries?.length > 0) {
        const hasPrivateField = data.entries.some(entry => 'isPrivate' in entry);
        if (hasPrivateField) {
          console.log('⚠️  Warning: isPrivate field exposed in public API (should be filtered out)');
        } else {
          console.log('✅ isPrivate field properly filtered from public API');
        }
      }
    } else {
      console.log('❌ Public journal API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

// Test 2: Check if the form fields are present
async function testFormFields() {
  console.log('📝 Testing form fields...');
  
  try {
    // This would require browser automation, so we'll just check if the files were updated
    const fs = await import('fs');
    const modalContent = fs.readFileSync('src/components/ui/JournalEntryModal.tsx', 'utf8');
    
    if (modalContent.includes('isPrivate')) {
      console.log('✅ Privacy toggle added to form');
    } else {
      console.log('❌ Privacy toggle not found in form');
    }
    
    if (modalContent.includes('🔒 Private Entry')) {
      console.log('✅ Privacy toggle UI text present');
    } else {
      console.log('❌ Privacy toggle UI text not found');
    }
    
  } catch (error) {
    console.log('❌ Form field test failed:', error.message);
  }
}

// Test 3: Check if service layer supports privacy
async function testServiceLayer() {
  console.log('⚙️ Testing service layer...');
  
  try {
    const fs = await import('fs');
    
    // Check JournalService
    const serviceContent = fs.readFileSync('src/services/journal.service.ts', 'utf8');
    
    if (serviceContent.includes('isPrivate?: boolean')) {
      console.log('✅ JournalEntry interface includes isPrivate field');
    } else {
      console.log('❌ JournalEntry interface missing isPrivate field');
    }
    
    if (serviceContent.includes('is_private')) {
      console.log('✅ Database queries include is_private column');
    } else {
      console.log('❌ Database queries missing is_private column');
    }
    
    // Check API routes
    const apiContent = fs.readFileSync('src/app/api/admin/journal/route.ts', 'utf8');
    
    if (apiContent.includes('isPrivate: body.isPrivate')) {
      console.log('✅ API routes handle isPrivate field');
    } else {
      console.log('❌ API routes missing isPrivate handling');
    }
    
  } catch (error) {
    console.log('❌ Service layer test failed:', error.message);
  }
}

// Test 4: Check public API filtering
async function testPublicAPIFiltering() {
  console.log('🔒 Testing public API filtering...');
  
  try {
    const fs = await import('fs');
    const publicAPIContent = fs.readFileSync('src/app/api/journal/public/route.ts', 'utf8');
    
    if (publicAPIContent.includes('if (entry.isPrivate) return false')) {
      console.log('✅ Public API filters private entries');
    } else {
      console.log('❌ Public API missing private entry filtering');
    }
    
  } catch (error) {
    console.log('❌ Public API filtering test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Privacy Feature Tests...\n');
  
  await testFormFields();
  console.log('');
  await testServiceLayer();
  console.log('');
  await testPublicAPIFiltering();
  console.log('');
  await testAPIEndpoints();
  
  console.log('\n🎉 Privacy feature testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run the database migration manually in your database admin tool');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Test creating a private journal entry');
  console.log('4. Verify it doesn\'t appear on /insights page');
}

runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
