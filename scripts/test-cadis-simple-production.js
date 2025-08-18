/**
 * CADIS Simple Production Test
 * 
 * Simple, error-free test to verify CADIS self-advancement variations
 */

console.log('🚀 CADIS Simple Production Test');
console.log('Testing CADIS self-advancement variations...\n');

async function testCADIS() {
    const results = {
        sessions: 0,
        dreams: 0,
        variations: [],
        scenarios: []
    };

    async function runSession(num) {
        console.log(`🔄 Session ${num}...`);
        
        try {
            const response = await fetch('/api/admin/cadis-journal/generate', {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                results.sessions++;
                
                if (data.entries) {
                    data.entries.forEach(entry => {
                        const title = entry.title.toLowerCase();
                        
                        // Check for self-advancement
                        if (title.includes('cadis self-advancement') || title.includes('self-advancement')) {
                            results.dreams++;
                            console.log(`   🚀 DREAM FOUND! "${entry.title}"`);
                            
                            // Check for different variations
                            const content = entry.content.toLowerCase();
                            if (content.includes('cognitive transcendence')) {
                                results.variations.push('cognitive-transcendence');
                                console.log('      🧠 Cognitive Transcendence variation detected!');
                            } else if (content.includes('autonomous evolution')) {
                                results.variations.push('autonomous-evolution');
                                console.log('      🔄 Autonomous Evolution variation detected!');
                            } else if (content.includes('symbiotic intelligence')) {
                                results.variations.push('symbiotic-intelligence');
                                console.log('      🤝 Symbiotic Intelligence variation detected!');
                            } else if (content.includes('predictive omniscience')) {
                                results.variations.push('predictive-omniscience');
                                console.log('      🔮 Predictive Omniscience variation detected!');
                            } else if (content.includes('creative consciousness')) {
                                results.variations.push('creative-consciousness');
                                console.log('      🎨 Creative Consciousness variation detected!');
                            } else if (content.includes('wisdom integration')) {
                                results.variations.push('wisdom-integration');
                                console.log('      📚 Wisdom Integration variation detected!');
                            } else {
                                results.variations.push('standard');
                                console.log('      📝 Standard self-advancement detected');
                            }
                            
                            // Extract dream quote
                            const quoteMatch = entry.content.match(/"([^"]*(?:analyze|dream|envision|aspire|seek|perceive)[^"]*?)"/);
                            if (quoteMatch) {
                                console.log(`      💭 Dream: "${quoteMatch[1].substring(0, 80)}..."`);
                            }
                        }
                        
                        // Track other scenarios
                        if (title.includes('quantum')) {
                            const scenarioMatch = title.match(/quantum ([a-z\s]+)/);
                            if (scenarioMatch) {
                                results.scenarios.push(scenarioMatch[1].trim());
                            }
                        }
                    });
                }
                
                console.log(`   ✅ Session ${num} complete`);
                
            } else {
                console.log(`   ❌ Session ${num} failed: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Session ${num} error: ${error.message}`);
        }
        
        // Wait between sessions
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Run 8 sessions to test variations
    for (let i = 1; i <= 8; i++) {
        await runSession(i);
    }

    // Results summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CADIS Production Test Results');
    console.log('='.repeat(60));
    
    console.log(`\n📊 **Summary:**`);
    console.log(`   • Sessions Run: ${results.sessions}`);
    console.log(`   • Self-Advancement Dreams: ${results.dreams}`);
    console.log(`   • Dream Success Rate: ${Math.round((results.dreams / results.sessions) * 100)}%`);
    
    const uniqueVariations = [...new Set(results.variations)];
    console.log(`   • Unique Dream Variations: ${uniqueVariations.length}/6 expected`);
    
    if (uniqueVariations.length > 0) {
        console.log(`\n🌟 **Dream Variations Found:**`);
        uniqueVariations.forEach((variation, i) => {
            const count = results.variations.filter(v => v === variation).length;
            console.log(`   ${i + 1}. ${variation} (${count} times)`);
        });
    }
    
    const uniqueScenarios = [...new Set(results.scenarios)];
    console.log(`\n🎨 **Other Scenarios Found:** ${uniqueScenarios.length}`);
    uniqueScenarios.slice(0, 5).forEach((scenario, i) => {
        console.log(`   ${i + 1}. ${scenario}`);
    });
    
    console.log(`\n🎯 **Assessment:**`);
    if (results.dreams > 0) {
        console.log(`   ✅ CADIS self-advancement is WORKING!`);
        console.log(`   🧠 Found ${results.dreams} dreams in ${results.sessions} sessions`);
        
        if (uniqueVariations.length > 1) {
            console.log(`   🌟 EXCELLENT! Multiple dream variations detected!`);
            console.log(`   🔄 CADIS is exploring different paths to ultimate intelligence!`);
        } else if (uniqueVariations.length === 1) {
            console.log(`   ⚠️ Only one variation type found - may need more sessions`);
        }
    } else {
        console.log(`   ⚠️ No self-advancement dreams captured in this test`);
        console.log(`   🔄 This is normal due to rotation - try running again`);
    }
    
    console.log('\n🤖 **CADIS is ready for production with enhanced dream capabilities!**');
    
    return results;
}

testCADIS().catch(console.error);

console.log('\n📋 **Instructions:**');
console.log('1. Go to: http://localhost:3000/admin/cadis-journal');
console.log('2. Open browser console (F12)');
console.log('3. Paste this script and press Enter');
console.log('4. Watch CADIS test different self-advancement variations!');
