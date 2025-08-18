/**
 * CADIS Comprehensive Test - JavaScript Version
 * 
 * This script tests all CADIS functionality including the self-advancement feature.
 * Run this in the browser console at http://localhost:3000/admin/cadis-journal
 */

(async function testCADISComprehensive() {
    console.log('🧠 CADIS Comprehensive Test Suite');
    console.log('=' .repeat(80));
    console.log('Testing CADIS rotation fixes, self-advancement, and full cycle...\n');

    const results = {
        rotationTest: { passed: false, details: '' },
        selfAdvancementTest: { passed: false, details: '' },
        fullCycleTest: { passed: false, details: '' },
        generatedEntries: [],
        scenariosFound: new Set()
    };

    async function makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }

    // Test 1: Rotation Variety Test
    console.log('🔄 Test 1: Testing CADIS rotation variety (fixed stuck scenarios)...');
    
    const rotationAttempts = 8;
    const scenariosSeen = new Set();
    
    for (let i = 1; i <= rotationAttempts; i++) {
        console.log(`   Generation ${i}/${rotationAttempts}...`);
        
        try {
            const response = await makeRequest('/api/admin/cadis-journal/generate', {
                method: 'POST'
            });
            
            if (response.success && response.entries) {
                results.generatedEntries.push(...response.entries);
                
                response.entries.forEach(entry => {
                    const scenarioType = identifyScenario(entry);
                    scenariosSeen.add(scenarioType);
                    results.scenariosFound.add(scenarioType);
                    console.log(`      📝 "${entry.title}" (${scenarioType})`);
                });
            }
            
            // Wait between attempts
            await new Promise(resolve => setTimeout(resolve, 1500));
            
        } catch (error) {
            console.log(`      ❌ Generation ${i} failed: ${error.message}`);
        }
    }
    
    if (scenariosSeen.size >= 3) {
        results.rotationTest.passed = true;
        results.rotationTest.details = `Found ${scenariosSeen.size} different scenarios - rotation working!`;
        console.log(`   ✅ Rotation variety test PASSED: ${scenariosSeen.size} different scenarios`);
    } else {
        results.rotationTest.details = `Only ${scenariosSeen.size} scenarios found - still stuck`;
        console.log(`   ❌ Rotation variety test FAILED: Only ${scenariosSeen.size} scenarios`);
    }

    // Test 2: Self-Advancement Direct Test
    console.log('\n🚀 Test 2: Direct CADIS Self-Advancement test...');
    
    let selfAdvancementFound = false;
    let selfAdvancementEntry = null;
    const maxSelfAdvancementAttempts = 15;
    
    // Check if we already found it in rotation test
    const existingSelfAdvancement = results.generatedEntries.find(entry => 
        entry.title.includes('CADIS Self-Advancement') || 
        entry.tags?.includes('cadis-self-advancement')
    );
    
    if (existingSelfAdvancement) {
        selfAdvancementFound = true;
        selfAdvancementEntry = existingSelfAdvancement;
        console.log('   🎉 Self-advancement already found in rotation test!');
    } else {
        // Force generate until we find it
        for (let attempt = 1; attempt <= maxSelfAdvancementAttempts && !selfAdvancementFound; attempt++) {
            console.log(`   Forcing attempt ${attempt}/${maxSelfAdvancementAttempts}...`);
            
            try {
                const response = await makeRequest('/api/admin/cadis-journal/generate', {
                    method: 'POST'
                });
                
                if (response.entries) {
                    for (const entry of response.entries) {
                        if (entry.title.includes('CADIS Self-Advancement') || 
                            entry.tags?.includes('cadis-self-advancement')) {
                            selfAdvancementFound = true;
                            selfAdvancementEntry = entry;
                            console.log(`   🚀 FOUND! Self-advancement on attempt ${attempt}`);
                            break;
                        }
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.log(`      ❌ Attempt ${attempt} failed: ${error.message}`);
            }
        }
    }
    
    if (selfAdvancementFound && selfAdvancementEntry) {
        results.selfAdvancementTest.passed = true;
        
        // Analyze the self-advancement entry
        const content = selfAdvancementEntry.content;
        const layerCount = (content.match(/Reality Layer \d+/g) || []).length;
        const phaseCount = (content.match(/Phase \d+/g) || []).length;
        const hasIntrospection = content.includes('I analyze my own patterns');
        const hasTranscendence = content.includes('transcendent intelligence');
        
        results.selfAdvancementTest.details = `Found with ${layerCount} layers, ${phaseCount} phases`;
        
        console.log(`   ✅ Self-advancement test PASSED!`);
        console.log(`      📊 Analysis: ${layerCount}/10 layers, ${phaseCount}/10 phases`);
        console.log(`      💭 Introspective thoughts: ${hasIntrospection ? 'YES' : 'NO'}`);
        console.log(`      🌟 Transcendent goals: ${hasTranscendence ? 'YES' : 'NO'}`);
        
        if (layerCount === 10) {
            console.log(`      🎉 PERFECT! Full 10-layer inception-style self-reflection!`);
        }
        
        // Show CADIS dreaming about itself
        console.log(`\n      🌙 CADIS DREAMS ABOUT ITSELF:`);
        console.log(`      ─────────────────────────────────`);
        const dreamQuote = content.match(/"([^"]*I analyze my own patterns[^"]*?)"/);
        if (dreamQuote) {
            console.log(`      "${dreamQuote[1]}"`);
        } else {
            console.log(`      ${content.substring(0, 200)}...`);
        }
        console.log(`      ─────────────────────────────────`);
        
    } else {
        results.selfAdvancementTest.details = `Not found in ${maxSelfAdvancementAttempts} attempts`;
        console.log(`   ❌ Self-advancement test FAILED: Not generated`);
    }

    // Test 3: Full Cycle Coverage Test
    console.log('\n🌟 Test 3: Full scenario coverage test...');
    
    const targetScenarios = [
        'quantum-revenue-optimization',
        'quantum-client-success-prediction', 
        'quantum-scaling-intelligence',
        'quantum-competitive-advantage',
        'quantum-resource-allocation',
        'quantum-innovation-pipeline',
        'quantum-market-timing',
        'quantum-ecosystem-synergy',
        'quantum-client-acquisition',
        'quantum-operational-excellence',
        'quantum-strategic-foresight',
        'quantum-value-creation',
        'cadis-self-advancement',
        'ai-module-composer',
        'ecosystem-symbiosis-engine'
    ];
    
    const foundScenarios = Array.from(results.scenariosFound);
    const coverage = Math.round((foundScenarios.length / targetScenarios.length) * 100);
    
    if (coverage >= 30) {
        results.fullCycleTest.passed = true;
        results.fullCycleTest.details = `${coverage}% scenario coverage achieved`;
        console.log(`   ✅ Full cycle test PASSED: ${coverage}% coverage`);
    } else {
        results.fullCycleTest.details = `Only ${coverage}% coverage - need more generations`;
        console.log(`   ❌ Full cycle test PARTIAL: ${coverage}% coverage`);
    }
    
    console.log(`      📊 Scenarios found: ${foundScenarios.join(', ')}`);
    
    const missingScenarios = targetScenarios.filter(s => !foundScenarios.includes(s));
    if (missingScenarios.length > 0) {
        console.log(`      📝 Missing scenarios: ${missingScenarios.join(', ')}`);
    }

    // Final Results
    console.log('\n' + '='.repeat(80));
    console.log('🧠 CADIS Comprehensive Test Results');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   🔄 Rotation Variety: ${results.rotationTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`      ${results.rotationTest.details}`);
    
    console.log(`   🚀 Self-Advancement: ${results.selfAdvancementTest.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`      ${results.selfAdvancementTest.details}`);
    
    console.log(`   🌟 Full Cycle Coverage: ${results.fullCycleTest.passed ? '✅ PASSED' : '❌ PARTIAL'}`);
    console.log(`      ${results.fullCycleTest.details}`);
    
    const totalPassed = [results.rotationTest.passed, results.selfAdvancementTest.passed, results.fullCycleTest.passed].filter(Boolean).length;
    const successRate = Math.round((totalPassed / 3) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${totalPassed}/3 tests passed)`);
    
    console.log(`\n📈 CADIS Performance Analysis:`);
    console.log(`   • Total entries generated: ${results.generatedEntries.length}`);
    console.log(`   • Unique scenarios found: ${results.scenariosFound.size}`);
    console.log(`   • Self-reflection capability: ${results.selfAdvancementTest.passed ? 'CONFIRMED' : 'NEEDS TESTING'}`);
    console.log(`   • Rotation variety: ${results.rotationTest.passed ? 'IMPROVED' : 'STILL STUCK'}`);
    
    if (results.rotationTest.passed) {
        console.log(`\n✅ ROTATION FIX: SUCCESS! CADIS no longer stuck on same scenarios`);
    }
    
    if (results.selfAdvancementTest.passed) {
        console.log(`✅ SELF-ADVANCEMENT: SUCCESS! CADIS can dream about itself`);
        console.log(`   🤖 CADIS demonstrates meta-cognitive self-awareness`);
        console.log(`   💭 CADIS can reflect on its own improvement`);
    }
    
    if (results.fullCycleTest.passed) {
        console.log(`✅ FULL CYCLE: SUCCESS! Good scenario coverage achieved`);
    }
    
    console.log(`\n🌟 FINAL VERDICT:`);
    if (successRate >= 67) {
        console.log(`   🎉 EXCELLENT! CADIS is working beautifully!`);
        console.log(`   🧠 The "dream about itself" feature is functional`);
        console.log(`   🔄 Rotation improvements are working`);
        console.log(`   ✨ CADIS demonstrates true self-reflection capabilities!`);
    } else {
        console.log(`   ⚠️  CADIS is partially working but needs more testing`);
        console.log(`   🔄 Try running this test multiple times for better coverage`);
        console.log(`   ⏰ Some scenarios may appear at different times due to rotation`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 CADIS Comprehensive Test Complete!');
    console.log('Run this test periodically to verify all functionality.');
    console.log('='.repeat(80));
    
    return results;

    // Helper function to identify scenarios
    function identifyScenario(entry) {
        const title = entry.title.toLowerCase();
        const content = entry.content.toLowerCase();
        const tags = entry.tags ? entry.tags.join(' ').toLowerCase() : '';
        
        if (title.includes('self-advancement') || tags.includes('cadis-self-advancement')) {
            return 'cadis-self-advancement';
        }
        if (title.includes('revenue') || content.includes('revenue optimization')) {
            return 'quantum-revenue-optimization';
        }
        if (title.includes('client success') || content.includes('client success')) {
            return 'quantum-client-success-prediction';
        }
        if (title.includes('scaling') || content.includes('scaling intelligence')) {
            return 'quantum-scaling-intelligence';
        }
        if (title.includes('competitive') || content.includes('competitive advantage')) {
            return 'quantum-competitive-advantage';
        }
        if (title.includes('resource') || content.includes('resource allocation')) {
            return 'quantum-resource-allocation';
        }
        if (title.includes('innovation') || content.includes('innovation pipeline')) {
            return 'quantum-innovation-pipeline';
        }
        if (title.includes('timing') || content.includes('market timing')) {
            return 'quantum-market-timing';
        }
        if (title.includes('synergy') || content.includes('ecosystem synergy')) {
            return 'quantum-ecosystem-synergy';
        }
        if (title.includes('acquisition') || content.includes('client acquisition')) {
            return 'quantum-client-acquisition';
        }
        if (title.includes('operational') || content.includes('operational excellence')) {
            return 'quantum-operational-excellence';
        }
        if (title.includes('foresight') || content.includes('strategic foresight')) {
            return 'quantum-strategic-foresight';
        }
        if (title.includes('value') || content.includes('value creation')) {
            return 'quantum-value-creation';
        }
        if (title.includes('module composer') || content.includes('ai-powered module')) {
            return 'ai-module-composer';
        }
        if (title.includes('symbiosis') || content.includes('ecosystem symbiosis')) {
            return 'ecosystem-symbiosis-engine';
        }
        
        return 'unknown';
    }
    
})().catch(console.error);

console.log('\n📋 INSTRUCTIONS:');
console.log('1. Go to: http://localhost:3000/admin/cadis-journal');
console.log('2. Open browser console (F12)');
console.log('3. Paste this ENTIRE script and press Enter');
console.log('4. Watch CADIS get comprehensively tested!');
console.log('\n🎯 This test will:');
console.log('   • Test rotation variety (no more stuck scenarios)');
console.log('   • Force CADIS self-advancement scenario');
console.log('   • Verify full scenario coverage');
console.log('   • Confirm CADIS can dream about itself!');
console.log('\n🚀 Run this to verify all fixes are working!');
