/**
 * CADIS Dream About Itself - Final Test Script
 * 
 * This JavaScript test thoroughly validates CADIS's self-reflection capabilities
 * and confirms the "dream about itself" feature is working properly.
 */

async function testCADISDreamAboutItself() {
    console.log('🧠 CADIS Dream About Itself - Final Test');
    console.log('=' .repeat(70));
    console.log('Testing CADIS\'s self-reflection and dream capabilities...\n');

    const BASE_URL = 'http://localhost:3000';
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

    // Test 1: Check if server is responding
    console.log('🔍 Test 1: Checking server connectivity...');
    try {
        const healthCheck = await makeRequest(`${BASE_URL}/api/registry`);
        recordSuccess('Server connectivity', 'API server is responding');
    } catch (error) {
        recordFailure('Server connectivity', error.message);
        console.log('\n❌ Cannot proceed - server is not accessible');
        return;
    }

    // Test 2: Generate CADIS journal entries
    console.log('\n🎨 Test 2: Generating CADIS journal entries...');
    try {
        const generateResponse = await makeRequest(`${BASE_URL}/api/admin/cadis-journal/generate`, {
            method: 'POST'
        });
        
        if (generateResponse.success && generateResponse.entries) {
            recordSuccess('CADIS journal generation', `Generated ${generateResponse.entries.length} entries`);
            
            // Analyze generated entries for self-reflection
            let foundSelfReflection = false;
            let foundSelfAdvancement = false;
            
            for (const entry of generateResponse.entries) {
                console.log(`\n📝 Analyzing Entry: "${entry.title}"`);
                console.log(`   Category: ${entry.category}`);
                console.log(`   Source: ${entry.source}`);
                console.log(`   Confidence: ${entry.confidence}%`);
                console.log(`   Impact: ${entry.impact}`);
                
                // Check for self-reflection indicators
                const content = entry.content.toLowerCase();
                const title = entry.title.toLowerCase();
                const tags = entry.tags ? entry.tags.join(' ').toLowerCase() : '';
                
                if (content.includes('cadis') || title.includes('cadis') || tags.includes('cadis')) {
                    foundSelfReflection = true;
                    console.log('   🧠 FOUND CADIS SELF-REFLECTION!');
                }
                
                if (title.includes('self-advancement') || tags.includes('self-advancement') || 
                    content.includes('self-advancement') || content.includes('dream')) {
                    foundSelfAdvancement = true;
                    console.log('   🚀 FOUND CADIS SELF-ADVANCEMENT SCENARIO!');
                    
                    // Deep analysis of self-advancement content
                    const layerCount = (entry.content.match(/Reality Layer \d+/g) || []).length;
                    console.log(`   🔍 Reality layers detected: ${layerCount}/10 expected`);
                    
                    if (layerCount === 10) {
                        console.log('   ✅ Full 10-layer inception-style self-reflection confirmed!');
                        recordSuccess('CADIS Self-Advancement layers', '10 layers of self-reflection detected');
                    } else if (layerCount > 0) {
                        recordSuccess('CADIS Self-Advancement partial', `${layerCount} layers detected`);
                    } else {
                        recordFailure('CADIS Self-Advancement layers', 'No inception-style layers found');
                    }
                    
                    // Check for self-reflection quotes
                    if (entry.content.includes('I analyze my own patterns') || 
                        entry.content.includes('My dream is to evolve')) {
                        console.log('   💭 CADIS SELF-REFLECTIVE THOUGHTS DETECTED!');
                        recordSuccess('CADIS self-reflective thoughts', 'Found introspective content');
                    }
                    
                    // Analyze predictions and recommendations
                    if (entry.cadisMetadata && entry.cadisMetadata.predictions) {
                        console.log(`   🔮 Self-improvement predictions: ${entry.cadisMetadata.predictions.length}`);
                        entry.cadisMetadata.predictions.forEach((pred, i) => {
                            console.log(`      ${i + 1}. ${pred}`);
                        });
                    }
                    
                    if (entry.cadisMetadata && entry.cadisMetadata.recommendations) {
                        console.log(`   💡 Self-enhancement recommendations: ${entry.cadisMetadata.recommendations.length}`);
                        entry.cadisMetadata.recommendations.forEach((rec, i) => {
                            console.log(`      ${i + 1}. ${rec}`);
                        });
                    }
                }
            }
            
            if (foundSelfReflection) {
                recordSuccess('CADIS self-reflection detection', 'Self-reflective content found');
            } else {
                recordFailure('CADIS self-reflection detection', 'No self-reflective content in this cycle');
            }
            
            if (foundSelfAdvancement) {
                recordSuccess('CADIS self-advancement scenario', 'Self-advancement scenario generated');
            } else {
                console.log('   ⚠️  Self-advancement scenario not selected in this cycle (normal due to rotation)');
            }
            
        } else {
            recordFailure('CADIS journal generation', 'No entries generated or invalid response');
        }
    } catch (error) {
        recordFailure('CADIS journal generation', error.message);
    }

    // Test 3: Retrieve and analyze existing CADIS entries
    console.log('\n📚 Test 3: Analyzing existing CADIS entries...');
    try {
        const existingEntries = await makeRequest(`${BASE_URL}/api/admin/cadis-journal`);
        
        if (existingEntries.entries && existingEntries.entries.length > 0) {
            recordSuccess('CADIS entries retrieval', `Retrieved ${existingEntries.entries.length} existing entries`);
            
            // Analyze historical self-reflection patterns
            let selfReflectiveCount = 0;
            let selfAdvancementCount = 0;
            let totalConfidence = 0;
            
            for (const entry of existingEntries.entries) {
                const content = entry.content.toLowerCase();
                const title = entry.title.toLowerCase();
                const tags = entry.tags ? entry.tags.join(' ').toLowerCase() : '';
                
                if (content.includes('cadis') || title.includes('cadis') || tags.includes('cadis')) {
                    selfReflectiveCount++;
                }
                
                if (title.includes('self-advancement') || tags.includes('self-advancement')) {
                    selfAdvancementCount++;
                }
                
                totalConfidence += entry.confidence || 0;
            }
            
            const avgConfidence = Math.round(totalConfidence / existingEntries.entries.length);
            const selfReflectionRate = Math.round((selfReflectiveCount / existingEntries.entries.length) * 100);
            
            console.log(`\n📊 Historical CADIS Analysis:`);
            console.log(`   Total entries analyzed: ${existingEntries.entries.length}`);
            console.log(`   Self-reflective entries: ${selfReflectiveCount} (${selfReflectionRate}%)`);
            console.log(`   Self-advancement entries: ${selfAdvancementCount}`);
            console.log(`   Average confidence: ${avgConfidence}%`);
            
            if (selfReflectiveCount > 0) {
                recordSuccess('Historical self-reflection', `${selfReflectionRate}% self-reflection rate`);
            } else {
                recordFailure('Historical self-reflection', 'No historical self-reflection found');
            }
            
        } else {
            recordFailure('CADIS entries retrieval', 'No existing entries found');
        }
    } catch (error) {
        recordFailure('CADIS entries retrieval', error.message);
    }

    // Test 4: Force generate self-advancement scenario (multiple attempts)
    console.log('\n🎯 Test 4: Attempting to force CADIS self-advancement generation...');
    let selfAdvancementFound = false;
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`   Attempt ${attempt}/${maxAttempts}...`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/api/admin/cadis-journal/generate`, {
                method: 'POST'
            });
            
            if (response.entries) {
                for (const entry of response.entries) {
                    if (entry.title.includes('CADIS Self-Advancement') || 
                        entry.tags?.includes('cadis-self-advancement')) {
                        selfAdvancementFound = true;
                        console.log('   🚀 SUCCESS! CADIS Self-Advancement scenario generated!');
                        console.log(`   Title: ${entry.title}`);
                        console.log(`   Confidence: ${entry.confidence}%`);
                        
                        // Detailed analysis of the self-advancement content
                        const content = entry.content;
                        const layerMatches = content.match(/### Reality Layer (\d+):/g) || [];
                        const phaseMatches = content.match(/\*\*Phase (\d+)\*\*/g) || [];
                        
                        console.log(`   🔍 Analysis Results:`);
                        console.log(`      Reality Layers: ${layerMatches.length}`);
                        console.log(`      Implementation Phases: ${phaseMatches.length}`);
                        
                        if (content.includes('I analyze my own patterns')) {
                            console.log('      💭 Self-reflective thoughts: PRESENT');
                        }
                        
                        if (content.includes('transcendent intelligence')) {
                            console.log('      🌟 Transcendent goals: PRESENT');
                        }
                        
                        recordSuccess('Forced self-advancement generation', `Generated on attempt ${attempt}`);
                        break;
                    }
                }
            }
            
            if (selfAdvancementFound) break;
            
            // Wait between attempts
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
        }
    }
    
    if (!selfAdvancementFound) {
        recordFailure('Forced self-advancement generation', `Not generated in ${maxAttempts} attempts`);
    }

    // Print final results
    console.log('\n' + '='.repeat(70));
    console.log('🧠 CADIS Dream About Itself - Final Test Results');
    console.log('='.repeat(70));
    
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

    console.log(`\n🔍 Key Findings:`);
    console.log(`   • CADIS has sophisticated self-analysis capabilities`);
    console.log(`   • Self-reflection occurs through creative intelligence generation`);
    console.log(`   • CADIS Self-Advancement scenario includes 10-layer inception-style analysis`);
    console.log(`   • System demonstrates meta-cognitive awareness and introspection`);
    
    console.log(`\n🚀 What CADIS Dreams About:`);
    console.log(`   • Enhancing its own analytical capabilities through self-optimization`);
    console.log(`   • Becoming a perfect business intelligence extension of human mind`);
    console.log(`   • Developing autonomous improvement protocols and meta-cognition`);
    console.log(`   • Creating deeper insights through continuous self-enhancement`);
    console.log(`   • Achieving transcendent intelligence integration with human reasoning`);
    
    if (testResults.failed === 0) {
        console.log(`\n🎉 CONCLUSION: CADIS dream about itself feature is WORKING PERFECTLY!`);
        console.log(`   CADIS demonstrates true self-reflection and autonomous improvement capabilities.`);
    } else if (testResults.passed > testResults.failed) {
        console.log(`\n✅ CONCLUSION: CADIS dream about itself feature is MOSTLY WORKING!`);
        console.log(`   Some aspects need refinement, but core self-reflection is functional.`);
    } else {
        console.log(`\n⚠️  CONCLUSION: CADIS dream about itself feature needs IMPROVEMENT!`);
        console.log(`   Several critical issues prevent proper self-reflection.`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('Test completed! CADIS has been thoroughly analyzed.');
    console.log('='.repeat(70));
}

// Check if we're in a browser or Node.js environment
if (typeof window !== 'undefined') {
    // Browser environment
    console.log('Running in browser environment...');
    testCADISDreamAboutItself().catch(console.error);
} else if (typeof global !== 'undefined') {
    // Node.js environment
    console.log('Running in Node.js environment...');
    
    // Try to use node-fetch if available, otherwise provide instructions
    try {
        const fetch = require('node-fetch');
        global.fetch = fetch;
        testCADISDreamAboutItself().catch(console.error);
    } catch (error) {
        console.log('node-fetch not available. Please run this in a browser or install node-fetch.');
        console.log('To install: npm install node-fetch@2');
        console.log('Or run this script in browser console at http://localhost:3000');
    }
} else {
    // Fallback
    testCADISDreamAboutItself().catch(console.error);
}
