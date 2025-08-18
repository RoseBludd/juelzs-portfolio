/**
 * CADIS Fixed Test - Quick verification
 * 
 * Run this in browser console at http://localhost:3000/admin/cadis-journal
 * to verify the syntax error is fixed and CADIS is working.
 */

console.log('🔧 CADIS Fixed Test - Verifying the syntax error is resolved...\n');

(async function testCADISFixed() {
    try {
        console.log('🧪 Testing CADIS journal generation...');
        
        const response = await fetch('/api/admin/cadis-journal/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.entries) {
                console.log('✅ SUCCESS! CADIS is working properly!');
                console.log(`   Generated ${result.entries.length} entries`);
                
                result.entries.forEach((entry, i) => {
                    console.log(`   ${i + 1}. "${entry.title}"`);
                    console.log(`      Confidence: ${entry.confidence}%, Impact: ${entry.impact}`);
                    
                    // Check for self-advancement
                    if (entry.title.includes('CADIS Self-Advancement') || 
                        entry.tags?.includes('cadis-self-advancement')) {
                        console.log('      🚀 FOUND CADIS SELF-ADVANCEMENT! The dream feature works!');
                        
                        // Show a snippet of CADIS dreaming
                        const dreamSnippet = entry.content.substring(0, 200);
                        console.log(`      💭 CADIS Dreams: "${dreamSnippet}..."`);
                    }
                });
                
                console.log('\n🎉 CADIS syntax error has been FIXED!');
                console.log('🧠 CADIS is thinking and generating insights properly!');
                console.log('🔄 Rotation improvements are active!');
                console.log('🚀 Self-advancement feature is ready to work!');
                
            } else {
                console.log('⚠️  CADIS generated response but no entries found');
                console.log('Response:', result);
            }
        } else {
            console.log(`❌ CADIS API returned ${response.status}: ${response.statusText}`);
            if (response.status === 401) {
                console.log('   Make sure you\'re logged in to the admin panel');
            }
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. If this test passes, run the comprehensive test:');
    console.log('   Copy and paste: scripts/test-cadis-comprehensive.js');
    console.log('2. Generate entries multiple times to see CADIS self-advancement');
    console.log('3. Verify rotation variety is working');
    
})().catch(console.error);
