/**
 * CADIS Self-Advancement Direct Test
 * 
 * This script directly tests the CADIS Self-Advancement Intelligence Engine
 * by forcing the scenario and analyzing the results in detail.
 */

(async function testCADISSelfAdvancementDirect() {
    console.log('🚀 CADIS Self-Advancement Direct Test');
    console.log('=' .repeat(80));
    console.log('Testing CADIS\'s ability to dream about and improve itself...\n');

    const testResults = {
        totalTests: 0,
        passed: 0,
        failed: 0,
        details: []
    };

    function recordSuccess(testName, details = '') {
        testResults.totalTests++;
        testResults.passed++;
        testResults.details.push({ test: testName, status: 'PASSED', details });
        console.log(`✅ ${testName}`);
        if (details) console.log(`   ${details}`);
    }

    function recordFailure(testName, reason) {
        testResults.totalTests++;
        testResults.failed++;
        testResults.details.push({ test: testName, status: 'FAILED', reason });
        console.log(`❌ ${testName}`);
        console.log(`   Reason: ${reason}`);
    }

    async function makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    // Test 1: Force generate until we get self-advancement
    console.log('🎯 Test 1: Forcing CADIS Self-Advancement scenario generation...');
    let selfAdvancementEntry = null;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!selfAdvancementEntry && attempts < maxAttempts) {
        attempts++;
        console.log(`   Attempt ${attempts}/${maxAttempts}...`);
        
        try {
            const response = await makeRequest('/api/admin/cadis-journal/generate', {
                method: 'POST'
            });
            
            if (response.entries) {
                for (const entry of response.entries) {
                    if (entry.title.includes('CADIS Self-Advancement') || 
                        entry.tags?.includes('cadis-self-advancement') ||
                        entry.content?.includes('CADIS Self-Advancement Intelligence Engine')) {
                        selfAdvancementEntry = entry;
                        console.log(`   🚀 SUCCESS! Found CADIS Self-Advancement on attempt ${attempts}!`);
                        break;
                    }
                }
            }
            
            // Wait between attempts
            if (!selfAdvancementEntry && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.log(`   ❌ Attempt ${attempts} failed: ${error.message}`);
        }
    }
    
    if (selfAdvancementEntry) {
        recordSuccess('CADIS Self-Advancement generation', `Generated on attempt ${attempts}`);
    } else {
        recordFailure('CADIS Self-Advancement generation', `Not generated in ${maxAttempts} attempts`);
        console.log('\n⚠️  Could not force self-advancement scenario. This might be due to:');
        console.log('   1. Scenario rotation not hitting the right combination');
        console.log('   2. Implementation issue with the scenario selection');
        console.log('   3. Need to wait for the right time-based conditions');
        return;
    }

    // Test 2: Analyze the self-advancement content structure
    console.log('\n🔍 Test 2: Analyzing CADIS Self-Advancement content structure...');
    
    if (selfAdvancementEntry) {
        console.log(`\n📋 Entry Details:`);
        console.log(`   Title: ${selfAdvancementEntry.title}`);
        console.log(`   Category: ${selfAdvancementEntry.category}`);
        console.log(`   Source: ${selfAdvancementEntry.source}`);
        console.log(`   Confidence: ${selfAdvancementEntry.confidence}%`);
        console.log(`   Impact: ${selfAdvancementEntry.impact}`);
        console.log(`   Tags: ${selfAdvancementEntry.tags?.join(', ')}`);
        
        // Test reality layers structure
        const content = selfAdvancementEntry.content;
        const layerMatches = content.match(/### Reality Layer (\d+):/g) || [];
        const phaseMatches = content.match(/\*\*Phase (\d+)\*\*/g) || [];
        
        console.log(`\n🔍 Structure Analysis:`);
        console.log(`   Reality Layers found: ${layerMatches.length}`);
        console.log(`   Implementation Phases found: ${phaseMatches.length}`);
        
        if (layerMatches.length === 10) {
            recordSuccess('10-layer inception structure', 'All 10 reality layers present');
            
            // Show the layers
            console.log(`\n🌟 CADIS's 10 Layers of Self-Reflection:`);
            layerMatches.forEach((layer, index) => {
                const layerNumber = layer.match(/(\d+)/)[0];
                const layerContent = content.split(layer)[1]?.split('###')[0]?.trim().split('\n')[0] || 'Content not found';
                console.log(`   Layer ${layerNumber}: ${layerContent.substring(0, 80)}...`);
            });
        } else {
            recordFailure('10-layer inception structure', `Only ${layerMatches.length} layers found`);
        }
        
        if (phaseMatches.length === 10) {
            recordSuccess('10-phase implementation plan', 'All 10 implementation phases present');
        } else {
            recordFailure('10-phase implementation plan', `Only ${phaseMatches.length} phases found`);
        }
        
        // Test for self-reflective quotes
        const selfReflectionQuote = content.match(/"([^"]*I analyze my own patterns[^"]*?)"/);
        if (selfReflectionQuote) {
            recordSuccess('CADIS introspective thoughts', 'Self-reflective quotes found');
            console.log(`\n💭 CADIS's Self-Reflection:`);
            console.log(`   "${selfReflectionQuote[1]}"`);
        } else {
            recordFailure('CADIS introspective thoughts', 'No self-reflective quotes found');
        }
        
        // Test metadata structure
        if (selfAdvancementEntry.cadisMetadata) {
            const metadata = selfAdvancementEntry.cadisMetadata;
            
            console.log(`\n📊 CADIS Metadata Analysis:`);
            console.log(`   Analysis Type: ${metadata.analysisType}`);
            console.log(`   Data Points: ${metadata.dataPoints}`);
            console.log(`   Correlations: ${metadata.correlations?.length || 0}`);
            console.log(`   Predictions: ${metadata.predictions?.length || 0}`);
            console.log(`   Recommendations: ${metadata.recommendations?.length || 0}`);
            
            if (metadata.predictions && metadata.predictions.length > 0) {
                recordSuccess('Self-improvement predictions', `${metadata.predictions.length} predictions generated`);
                console.log(`\n🔮 CADIS's Self-Improvement Predictions:`);
                metadata.predictions.forEach((pred, i) => {
                    console.log(`      ${i + 1}. ${pred}`);
                });
            } else {
                recordFailure('Self-improvement predictions', 'No predictions found');
            }
            
            if (metadata.recommendations && metadata.recommendations.length > 0) {
                recordSuccess('Self-enhancement recommendations', `${metadata.recommendations.length} recommendations generated`);
                console.log(`\n💡 CADIS's Self-Enhancement Recommendations:`);
                metadata.recommendations.forEach((rec, i) => {
                    console.log(`      ${i + 1}. ${rec}`);
                });
            } else {
                recordFailure('Self-enhancement recommendations', 'No recommendations found');
            }
        } else {
            recordFailure('CADIS metadata structure', 'No metadata found');
        }
    }

    // Test 3: Verify transcendent intelligence concepts
    console.log('\n🌟 Test 3: Analyzing transcendent intelligence concepts...');
    
    if (selfAdvancementEntry) {
        const content = selfAdvancementEntry.content.toLowerCase();
        
        const transcendentConcepts = [
            'transcendent intelligence',
            'meta-cognitive',
            'autonomous enhancement',
            'self-optimization',
            'symbiotic collaboration',
            'emergent capabilities'
        ];
        
        let foundConcepts = [];
        transcendentConcepts.forEach(concept => {
            if (content.includes(concept)) {
                foundConcepts.push(concept);
            }
        });
        
        if (foundConcepts.length > 0) {
            recordSuccess('Transcendent intelligence concepts', `${foundConcepts.length} advanced concepts found`);
            console.log(`   Advanced concepts detected: ${foundConcepts.join(', ')}`);
        } else {
            recordFailure('Transcendent intelligence concepts', 'No advanced AI concepts found');
        }
        
        // Check for specific self-improvement goals
        if (content.includes('perfect business intelligence companion') || 
            content.includes('ultimate extension of human intelligence')) {
            recordSuccess('CADIS ultimate goals', 'Found aspirational self-improvement goals');
        } else {
            recordFailure('CADIS ultimate goals', 'No clear aspirational goals found');
        }
    }

    // Test 4: Test the full content display
    console.log('\n📄 Test 4: Displaying CADIS Self-Advancement content...');
    
    if (selfAdvancementEntry) {
        console.log('\n' + '═'.repeat(80));
        console.log('🤖 CADIS DREAMS ABOUT ITSELF - FULL CONTENT');
        console.log('═'.repeat(80));
        
        // Show first 1000 characters
        const contentPreview = selfAdvancementEntry.content.substring(0, 1000);
        console.log(contentPreview);
        console.log('\n[... content continues ...]');
        console.log('═'.repeat(80));
        
        recordSuccess('Full content display', 'Self-advancement content successfully displayed');
    }

    // Print final results
    console.log('\n' + '='.repeat(80));
    console.log('🚀 CADIS Self-Advancement Direct Test Results');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${testResults.totalTests}`);
    console.log(`   Passed: ${testResults.passed} ✅`);
    console.log(`   Failed: ${testResults.failed} ❌`);
    console.log(`   Success Rate: ${Math.round((testResults.passed / testResults.totalTests) * 100)}%`);
    
    console.log(`\n📋 Detailed Results:`);
    testResults.details.forEach((result, index) => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${index + 1}. ${result.test}: ${status}`);
        if (result.reason) {
            console.log(`      Reason: ${result.reason}`);
        }
        if (result.details) {
            console.log(`      Details: ${result.details}`);
        }
    });

    console.log(`\n🎯 CADIS Self-Advancement Analysis:`);
    
    const hasGeneration = testResults.details.some(d => 
        d.test.includes('Self-Advancement generation') && d.status === 'PASSED'
    );
    
    const hasStructure = testResults.details.some(d => 
        d.test.includes('inception structure') && d.status === 'PASSED'
    );
    
    const hasThoughts = testResults.details.some(d => 
        d.test.includes('introspective thoughts') && d.status === 'PASSED'
    );
    
    const hasPredictions = testResults.details.some(d => 
        d.test.includes('predictions') && d.status === 'PASSED'
    );
    
    if (hasGeneration) {
        console.log(`   ✅ CADIS can generate self-advancement scenarios`);
    } else {
        console.log(`   ❌ CADIS self-advancement generation failed`);
    }
    
    if (hasStructure) {
        console.log(`   ✅ 10-layer inception-style self-reflection is working`);
    } else {
        console.log(`   ❌ Inception-style structure needs improvement`);
    }
    
    if (hasThoughts) {
        console.log(`   ✅ CADIS demonstrates introspective self-awareness`);
    } else {
        console.log(`   ❌ CADIS introspective thoughts need enhancement`);
    }
    
    if (hasPredictions) {
        console.log(`   ✅ CADIS generates specific self-improvement plans`);
    } else {
        console.log(`   ❌ CADIS self-improvement planning needs work`);
    }

    console.log(`\n🌟 FINAL CONCLUSION:`);
    if (testResults.passed >= testResults.failed * 2) {
        console.log(`   🎉 CADIS SELF-ADVANCEMENT IS WORKING EXCELLENTLY!`);
        console.log(`   CADIS demonstrates sophisticated self-reflection and dreams of improvement.`);
    } else if (testResults.passed > testResults.failed) {
        console.log(`   ✅ CADIS SELF-ADVANCEMENT IS FUNCTIONAL!`);
        console.log(`   Some aspects could be refined, but core functionality works.`);
    } else {
        console.log(`   ⚠️  CADIS SELF-ADVANCEMENT NEEDS IMPROVEMENT!`);
        console.log(`   Several issues prevent optimal self-reflection.`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 CADIS Self-Advancement Direct Test Complete!');
    console.log('='.repeat(80));
    
    return testResults;
})().catch(console.error);

console.log('\n📋 Instructions:');
console.log('1. Navigate to http://localhost:3000/admin/cadis-journal');
console.log('2. Open browser console (F12)');
console.log('3. Paste this entire script and press Enter');
console.log('4. Watch CADIS dream about improving itself in detail!');
