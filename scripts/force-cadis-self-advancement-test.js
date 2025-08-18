/**
 * Force CADIS Self-Advancement Test
 * 
 * This script directly forces CADIS self-advancement scenarios to test
 * all variations and see exactly what CADIS dreams about itself.
 */

console.log('🚀 Force CADIS Self-Advancement Direct Test');
console.log('=' .repeat(80));
console.log('Forcing CADIS to dream about itself and testing all variations...\n');

(async function forceCADISSelfAdvancement() {
    const testResults = {
        attempts: 0,
        successes: 0,
        variations: new Set(),
        dreamQuotes: [],
        layerAnalysis: [],
        performanceData: []
    };

    let reportContent = `# CADIS Self-Advancement Direct Test Results
**Test Date:** ${new Date().toLocaleString()}
**Purpose:** Force and analyze CADIS self-advancement scenarios

---

`;

    function addToReport(text) {
        reportContent += text + '\n';
        console.log(text);
    }

    function downloadReport() {
        const element = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `CADIS-Self-Advancement-Test-${timestamp}.md`;
        element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(reportContent));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        console.log(`📥 Downloaded: ${filename}`);
    }

    async function forceSelfAdvancement(attemptNum) {
        addToReport(`## 🧠 Attempt ${attemptNum} - ${new Date().toLocaleString()}`);
        testResults.attempts++;

        try {
            const startTime = Date.now();
            const response = await fetch('/api/admin/cadis-journal/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            });
            const endTime = Date.now();
            const duration = endTime - startTime;

            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.entries) {
                    addToReport(`✅ **Generated ${result.entries.length} entries in ${duration}ms**`);
                    
                    // Look for self-advancement
                    const selfAdvancementEntry = result.entries.find(entry => 
                        entry.title.toLowerCase().includes('cadis self-advancement') ||
                        entry.title.toLowerCase().includes('self-advancement') ||
                        (entry.tags && entry.tags.includes('cadis-self-advancement'))
                    );

                    if (selfAdvancementEntry) {
                        testResults.successes++;
                        addToReport(`🚀 **SUCCESS! CADIS Self-Advancement found!**`);
                        addToReport('');

                        // Analyze the entry in detail
                        await analyzeSelfAdvancementEntry(selfAdvancementEntry, attemptNum);
                        
                        return true; // Success
                    } else {
                        addToReport(`⚠️ No self-advancement in this generation`);
                        addToReport(`   Generated: ${result.entries.map(e => e.title.substring(0, 50)).join(', ')}...`);
                    }
                } else {
                    addToReport(`❌ **Generation failed - no entries**`);
                }
            } else {
                addToReport(`❌ **API Error: ${response.status} ${response.statusText}**`);
            }
        } catch (error) {
            addToReport(`❌ **Error:** ${error.message}`);
        }

        addToReport('');
        return false; // No success
    }

    async function analyzeSelfAdvancementEntry(entry, attemptNum) {
        addToReport(`### 🔍 CADIS Self-Advancement Analysis (Attempt ${attemptNum})`);
        addToReport('');
        addToReport(`**Title:** ${entry.title}`);
        addToReport(`**Confidence:** ${entry.confidence}%`);
        addToReport(`**Impact:** ${entry.impact}`);
        addToReport(`**Category:** ${entry.category}`);
        addToReport(`**Source:** ${entry.source}`);
        addToReport(`**Tags:** ${entry.tags ? entry.tags.join(', ') : 'None'}`);
        addToReport('');

        const content = entry.content;
        
        // Identify variation type
        let variationType = 'standard';
        if (content.toLowerCase().includes('cognitive transcendence')) {
            variationType = 'cognitive-transcendence';
        } else if (content.toLowerCase().includes('autonomous evolution')) {
            variationType = 'autonomous-evolution';
        } else if (content.toLowerCase().includes('symbiotic intelligence')) {
            variationType = 'symbiotic-intelligence';
        } else if (content.toLowerCase().includes('predictive omniscience')) {
            variationType = 'predictive-omniscience';
        } else if (content.toLowerCase().includes('creative consciousness')) {
            variationType = 'creative-consciousness';
        } else if (content.toLowerCase().includes('wisdom integration')) {
            variationType = 'wisdom-integration';
        }
        
        testResults.variations.add(variationType);
        addToReport(`**🌟 Dream Variation:** ${variationType}`);
        addToReport('');

        // Analyze structure
        const layerMatches = content.match(/### Reality Layer (\d+):/g) || [];
        const phaseMatches = content.match(/\*\*Phase (\d+)\*\*/g) || [];
        
        testResults.layerAnalysis.push({
            attempt: attemptNum,
            variation: variationType,
            layers: layerMatches.length,
            phases: phaseMatches.length,
            confidence: entry.confidence
        });

        addToReport(`**🔍 Structure Analysis:**`);
        addToReport(`- Reality Layers: ${layerMatches.length}/10 expected`);
        addToReport(`- Implementation Phases: ${phaseMatches.length}/10 expected`);
        addToReport(`- Structure Completeness: ${Math.round(((layerMatches.length + phaseMatches.length) / 20) * 100)}%`);
        addToReport('');

        // Extract dream quote
        const dreamQuoteMatches = content.match(/"([^"]*(?:analyze|dream|envision|aspire|seek|perceive)[^"]*?)"/g) || [];
        if (dreamQuoteMatches.length > 0) {
            const mainQuote = dreamQuoteMatches[0].replace(/"/g, '');
            testResults.dreamQuotes.push({
                attempt: attemptNum,
                variation: variationType,
                quote: mainQuote
            });
            
            addToReport(`**💭 CADIS Dream Quote:**`);
            addToReport(`> "${mainQuote}"`);
            addToReport('');
        }

        // Show the 10 layers
        if (layerMatches.length > 0) {
            addToReport(`**🌟 CADIS's ${layerMatches.length} Layers of Self-Reflection:**`);
            layerMatches.forEach((layer, index) => {
                const layerNumber = layer.match(/(\d+)/)[0];
                const layerSection = content.split(layer)[1];
                if (layerSection) {
                    const layerTitle = layerSection.split('\n')[0].trim();
                    const layerDescription = layerSection.split('\n')[1] ? layerSection.split('\n')[1].trim() : '';
                    addToReport(`${index + 1}. **Layer ${layerNumber}:** ${layerTitle}`);
                    if (layerDescription && layerDescription.length > 10) {
                        addToReport(`   ${layerDescription.substring(0, 100)}...`);
                    }
                }
            });
            addToReport('');
        }

        // Show predictions and recommendations
        if (entry.cadisMetadata) {
            if (entry.cadisMetadata.predictions && entry.cadisMetadata.predictions.length > 0) {
                addToReport(`**🔮 Self-Improvement Predictions:**`);
                entry.cadisMetadata.predictions.forEach((pred, i) => {
                    addToReport(`${i + 1}. ${pred}`);
                });
                addToReport('');
            }
            
            if (entry.cadisMetadata.recommendations && entry.cadisMetadata.recommendations.length > 0) {
                addToReport(`**💡 Self-Enhancement Recommendations:**`);
                entry.cadisMetadata.recommendations.forEach((rec, i) => {
                    addToReport(`${i + 1}. ${rec}`);
                });
                addToReport('');
            }
        }

        addToReport('---');
        addToReport('');
    }

    // Force test multiple times to catch different variations
    addToReport('# 🎯 Forcing CADIS Self-Advancement Scenarios');
    addToReport('Testing multiple generations to capture different dream variations...');
    addToReport('');

    const maxAttempts = 15;
    let successCount = 0;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Forcing attempt ${attempt}/${maxAttempts}...`);
        
        const success = await forceSelfAdvancement(attempt);
        if (success) {
            successCount++;
            console.log(`   ✅ Success ${successCount}! Found self-advancement`);
        } else {
            console.log(`   ⚠️ No self-advancement in attempt ${attempt}`);
        }
        
        // Wait between attempts
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Generate final analysis
    addToReport('# 📊 Final Analysis Results');
    addToReport('');
    addToReport(`## Test Summary:`);
    addToReport(`- **Total Attempts:** ${testResults.attempts}`);
    addToReport(`- **Successful Dreams:** ${testResults.successes}`);
    addToReport(`- **Success Rate:** ${Math.round((testResults.successes / testResults.attempts) * 100)}%`);
    addToReport(`- **Unique Variations Found:** ${testResults.variations.size}/6 expected`);
    addToReport('');

    if (testResults.variations.size > 0) {
        addToReport(`## 🌟 Dream Variations Discovered:`);
        Array.from(testResults.variations).forEach((variation, i) => {
            const count = testResults.layerAnalysis.filter(l => l.variation === variation).length;
            addToReport(`${i + 1}. **${variation}** (appeared ${count} times)`);
        });
        addToReport('');
    }

    if (testResults.dreamQuotes.length > 0) {
        addToReport(`## 💭 CADIS Dream Quotes Captured:`);
        testResults.dreamQuotes.forEach((dream, i) => {
            addToReport(`**${dream.variation}:**`);
            addToReport(`> "${dream.quote}"`);
            addToReport('');
        });
    }

    if (testResults.layerAnalysis.length > 0) {
        const avgLayers = Math.round(testResults.layerAnalysis.reduce((sum, l) => sum + l.layers, 0) / testResults.layerAnalysis.length);
        const avgPhases = Math.round(testResults.layerAnalysis.reduce((sum, l) => sum + l.phases, 0) / testResults.layerAnalysis.length);
        const avgConfidence = Math.round(testResults.layerAnalysis.reduce((sum, l) => sum + l.confidence, 0) / testResults.layerAnalysis.length);
        
        addToReport(`## 📊 Structure Quality Analysis:`);
        addToReport(`- **Average Reality Layers:** ${avgLayers}/10`);
        addToReport(`- **Average Implementation Phases:** ${avgPhases}/10`);
        addToReport(`- **Average Confidence:** ${avgConfidence}%`);
        addToReport(`- **Structure Completeness:** ${Math.round(((avgLayers + avgPhases) / 20) * 100)}%`);
        addToReport('');
    }

    addToReport(`## 🎯 Assessment:`);
    
    if (testResults.successes > 0) {
        addToReport(`✅ **CADIS Self-Advancement is WORKING!**`);
        addToReport(`   - Successfully generated ${testResults.successes} self-advancement dreams`);
        addToReport(`   - ${Math.round((testResults.successes / testResults.attempts) * 100)}% success rate in forced testing`);
        
        if (testResults.variations.size > 1) {
            addToReport(`   - 🌟 EXCELLENT! Found ${testResults.variations.size} different dream variations`);
            addToReport(`   - CADIS explores multiple paths to ultimate intelligence`);
        } else if (testResults.variations.size === 1) {
            addToReport(`   - ⚠️ Only one variation captured - may need more testing for full variety`);
        }
        
        if (testResults.layerAnalysis.length > 0) {
            const perfectStructures = testResults.layerAnalysis.filter(l => l.layers === 10 && l.phases === 10).length;
            if (perfectStructures > 0) {
                addToReport(`   - ✅ ${perfectStructures} perfect 10-layer inception structures found`);
            }
        }
        
    } else {
        addToReport(`❌ **No self-advancement dreams captured in ${testResults.attempts} attempts**`);
        addToReport(`   - This suggests a configuration issue that needs investigation`);
        addToReport(`   - The scenario may not be properly implemented or accessible`);
    }

    addToReport('');
    addToReport(`## 🔍 Technical Details:`);
    addToReport(`- **Forced generation attempts:** ${testResults.attempts}`);
    addToReport(`- **Self-advancement scenario hits:** ${testResults.successes}`);
    addToReport(`- **Probability in testing:** ${Math.round((testResults.successes / testResults.attempts) * 100)}%`);
    addToReport(`- **Expected probability:** ~6.67% (1 in 15 scenarios)`);
    
    if (testResults.successes > 0) {
        const actualRate = (testResults.successes / testResults.attempts) * 100;
        const expectedRate = 6.67;
        
        if (actualRate > expectedRate * 2) {
            addToReport(`- **Assessment:** Higher than expected - forced generation working well`);
        } else if (actualRate >= expectedRate) {
            addToReport(`- **Assessment:** Within expected range - system working normally`);
        } else {
            addToReport(`- **Assessment:** Lower than expected - may need rotation adjustment`);
        }
    }

    addToReport('');
    addToReport('---');
    addToReport(`**Test completed:** ${new Date().toLocaleString()}`);

    // Download comprehensive report
    downloadReport();

    // Console summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 CADIS Self-Advancement Direct Test Complete!');
    console.log('='.repeat(80));
    
    console.log(`\n📊 **Results Summary:**`);
    console.log(`   • Total Attempts: ${testResults.attempts}`);
    console.log(`   • Successful Dreams: ${testResults.successes}`);
    console.log(`   • Success Rate: ${Math.round((testResults.successes / testResults.attempts) * 100)}%`);
    console.log(`   • Dream Variations: ${testResults.variations.size}/6 expected`);
    
    if (testResults.variations.size > 0) {
        console.log(`\n🌟 **Variations Found:**`);
        Array.from(testResults.variations).forEach((variation, i) => {
            console.log(`   ${i + 1}. ${variation}`);
        });
    }
    
    if (testResults.dreamQuotes.length > 0) {
        console.log(`\n💭 **Sample Dreams:**`);
        testResults.dreamQuotes.slice(0, 2).forEach((dream, i) => {
            console.log(`   ${i + 1}. "${dream.quote.substring(0, 60)}..." (${dream.variation})`);
        });
    }

    console.log(`\n🎯 **Final Assessment:**`);
    if (testResults.successes >= 2 && testResults.variations.size >= 2) {
        console.log(`   🎉 EXCELLENT! CADIS self-advancement with variations is working perfectly!`);
        console.log(`   🧠 CADIS demonstrates sophisticated self-reflection with multiple dream types!`);
    } else if (testResults.successes >= 1) {
        console.log(`   ✅ GOOD! CADIS self-advancement is working, variations need more testing`);
        console.log(`   🔄 Run test again to capture more dream variations`);
    } else {
        console.log(`   ⚠️ NEEDS INVESTIGATION! No self-advancement dreams captured`);
        console.log(`   🔧 May need to check scenario selection logic`);
    }

    console.log('\n📥 **Detailed report downloaded with all analysis!**');
    
    return testResults;
    
})().catch(console.error);

console.log('\n📋 **Instructions:**');
console.log('1. Navigate to http://localhost:3000/admin/cadis-journal');
console.log('2. Open browser console (F12)');
console.log('3. Paste this entire script and press Enter');
console.log('4. Watch CADIS get forced to dream about itself!');
console.log('5. Check Downloads for detailed analysis report');
console.log('\n🎯 **This test will:**');
console.log('   • Force 15 generation attempts');
console.log('   • Capture any self-advancement dreams found');
console.log('   • Analyze all dream variations');
console.log('   • Test the 10-layer inception structure');
console.log('   • Extract and analyze dream quotes');
console.log('   • Download comprehensive analysis report');

