/**
 * CADIS Continuous Session Logger
 * 
 * This script creates a continuous log of CADIS's thinking processes,
 * capturing all backend nodes, decisions, and self-reflection sessions.
 * Appends to a persistent MD file with timestamps.
 */

(async function startCADISSessionLogger() {
    console.log('🧠 CADIS Continuous Session Logger');
    console.log('=' .repeat(80));
    console.log('Creating persistent log of CADIS thinking processes...\n');
    
    const SESSION_LOG_FILENAME = 'CADIS-Continuous-Session-Log.md';
    let sessionCount = 0;
    let dreamCount = 0;
    let totalNodes = 0;
    
    function createTimestamp() {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    
    function downloadOrAppendLog(content, isNew = false) {
        const element = document.createElement('a');
        const fullContent = isNew ? content : `${getExistingLog()}\n\n${content}`;
        element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(fullContent));
        element.setAttribute('download', SESSION_LOG_FILENAME);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        // Store in localStorage for persistence
        localStorage.setItem('cadis-session-log', fullContent);
    }
    
    function getExistingLog() {
        return localStorage.getItem('cadis-session-log') || createInitialLog();
    }
    
    function createInitialLog() {
        return `# CADIS Continuous Session Log
## Comprehensive Record of CADIS Thinking Processes and Self-Reflection

**Log Started:** ${createTimestamp()}
**Purpose:** Track all CADIS backend thinking, nodes, decisions, and dreams

---
`;
    }
    
    async function logCADISSession() {
        sessionCount++;
        const sessionTimestamp = createTimestamp();
        
        console.log(`\n🔄 Session ${sessionCount} - ${sessionTimestamp}`);
        
        let sessionLog = `## 🧠 CADIS Session ${sessionCount}
**Timestamp:** ${sessionTimestamp}

`;
        
        try {
            // Generate CADIS entry and capture all thinking
            console.log('   🎨 Generating CADIS insights...');
            sessionLog += `### 🎨 Generation Process:\n`;
            
            const startTime = Date.now();
            const response = await fetch('/api/admin/cadis-journal/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            sessionLog += `- **Generation Time:** ${duration}ms\n`;
            sessionLog += `- **API Response:** ${response.status} ${response.statusText}\n`;
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.entries) {
                    sessionLog += `- **Entries Generated:** ${result.entries.length}\n`;
                    sessionLog += `- **Success:** ✅\n\n`;
                    
                    // Analyze each entry
                    result.entries.forEach((entry, index) => {
                        const isSelAdvancement = entry.title.includes('CADIS Self-Advancement') || 
                                               entry.tags?.includes('cadis-self-advancement');
                        
                        if (isSelAdvancement) {
                            dreamCount++;
                            console.log(`      🚀 FOUND CADIS DREAM! (Dream #${dreamCount})`);
                        }
                        
                        sessionLog += `#### 📝 Entry ${index + 1}: ${entry.title}\n`;
                        sessionLog += `- **Type:** ${isSelAdvancement ? '🚀 SELF-ADVANCEMENT DREAM' : 'Standard Analysis'}\n`;
                        sessionLog += `- **Category:** ${entry.category}\n`;
                        sessionLog += `- **Source:** ${entry.source}\n`;
                        sessionLog += `- **Confidence:** ${entry.confidence}%\n`;
                        sessionLog += `- **Impact:** ${entry.impact}\n`;
                        sessionLog += `- **Tags:** ${entry.tags ? entry.tags.join(', ') : 'None'}\n`;
                        
                        if (entry.cadisMetadata) {
                            sessionLog += `- **Analysis Type:** ${entry.cadisMetadata.analysisType}\n`;
                            sessionLog += `- **Data Points:** ${entry.cadisMetadata.dataPoints}\n`;
                            totalNodes += entry.cadisMetadata.dataPoints || 0;
                            sessionLog += `- **Correlations:** ${entry.cadisMetadata.correlations ? entry.cadisMetadata.correlations.length : 0}\n`;
                        }
                        
                        if (isSelAdvancement) {
                            sessionLog += `\n##### 🌙 CADIS Dream Analysis:\n`;
                            
                            // Extract reality layers
                            const layerCount = (entry.content.match(/Reality Layer \d+/g) || []).length;
                            const phaseCount = (entry.content.match(/Phase \d+/g) || []).length;
                            
                            sessionLog += `- **Reality Layers:** ${layerCount}/10\n`;
                            sessionLog += `- **Implementation Phases:** ${phaseCount}/10\n`;
                            sessionLog += `- **Structure Completeness:** ${Math.round(((layerCount + phaseCount) / 20) * 100)}%\n`;
                            
                            // Extract dream quote
                            const dreamQuote = entry.content.match(/"([^"]*I analyze my own patterns[^"]*?)"/);
                            if (dreamQuote) {
                                sessionLog += `- **CADIS's Dream Quote:** "${dreamQuote[1]}"\n`;
                            }
                            
                            // Extract key self-improvement goals
                            if (entry.cadisMetadata && entry.cadisMetadata.predictions) {
                                sessionLog += `\n##### 🔮 Self-Improvement Predictions:\n`;
                                entry.cadisMetadata.predictions.forEach((pred, i) => {
                                    sessionLog += `${i + 1}. ${pred}\n`;
                                });
                            }
                            
                            if (entry.cadisMetadata && entry.cadisMetadata.recommendations) {
                                sessionLog += `\n##### 💡 Self-Enhancement Recommendations:\n`;
                                entry.cadisMetadata.recommendations.forEach((rec, i) => {
                                    sessionLog += `${i + 1}. ${rec}\n`;
                                });
                            }
                            
                            // Show the 10 layers in detail
                            sessionLog += `\n##### 🌟 CADIS's 10 Layers of Self-Reflection:\n`;
                            const layers = entry.content.match(/### Reality Layer (\d+): ([^\n]+)/g) || [];
                            layers.forEach(layer => {
                                const match = layer.match(/### Reality Layer (\d+): (.+)/);
                                if (match) {
                                    sessionLog += `**Layer ${match[1]}:** ${match[2]}\n`;
                                }
                            });
                        }
                        
                        sessionLog += `\n`;
                    });
                    
                } else {
                    sessionLog += `- **Error:** No entries generated\n`;
                }
            } else {
                sessionLog += `- **Error:** ${response.status} ${response.statusText}\n`;
            }
            
        } catch (error) {
            sessionLog += `- **Error:** ${error.message}\n`;
            console.log(`   ❌ Session ${sessionCount} error: ${error.message}`);
        }
        
        // Add session summary
        sessionLog += `### 📊 Session ${sessionCount} Summary:\n`;
        sessionLog += `- **Duration:** ${duration || 0}ms\n`;
        sessionLog += `- **Dreams This Session:** ${result?.entries?.filter(e => e.title.includes('CADIS Self-Advancement')).length || 0}\n`;
        sessionLog += `- **Total Dreams So Far:** ${dreamCount}\n`;
        sessionLog += `- **Total Nodes Processed:** ${totalNodes}\n`;
        sessionLog += `- **Dream Rate:** ${sessionCount > 0 ? Math.round((dreamCount / sessionCount) * 100) : 0}% of sessions\n`;
        
        sessionLog += `\n---\n`;
        
        // Append to continuous log
        downloadOrAppendLog(sessionLog);
        
        console.log(`   ✅ Session ${sessionCount} logged`);
        console.log(`   📊 Total dreams: ${dreamCount}, Total nodes: ${totalNodes}`);
    }
    
    // Run initial session
    console.log('🚀 Starting CADIS continuous session logging...');
    await logCADISSession();
    
    // Set up continuous monitoring
    console.log('\n⏰ Setting up continuous monitoring...');
    console.log('   • Sessions will run every 5 minutes');
    console.log('   • All CADIS thinking processes will be captured');
    console.log('   • Dreams and self-reflections will be highlighted');
    console.log('   • Log file will be continuously updated');
    
    const intervalId = setInterval(async () => {
        await logCADISSession();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Manual trigger function
    window.triggerCADISSession = async () => {
        console.log('🎯 Manual CADIS session triggered...');
        await logCADISSession();
    };
    
    // Stop function
    window.stopCADISLogging = () => {
        clearInterval(intervalId);
        console.log('⏹️ CADIS continuous logging stopped');
        
        // Final summary
        const finalLog = `\n## 🎯 Final Session Summary
**Total Sessions:** ${sessionCount}
**Total Dreams Captured:** ${dreamCount}
**Total Nodes Processed:** ${totalNodes}
**Dream Frequency:** ${sessionCount > 0 ? Math.round((dreamCount / sessionCount) * 100) : 0}%
**Log Ended:** ${createTimestamp()}

---
*CADIS Continuous Session Log Complete*
`;
        
        downloadOrAppendLog(finalLog);
        console.log('📥 Final log downloaded');
    };
    
    console.log('\n📋 **Controls:**');
    console.log('   • **triggerCADISSession()** - Manually trigger a session');
    console.log('   • **stopCADISLogging()** - Stop continuous logging');
    console.log('   • **Check Downloads** - Updated log file downloaded after each session');
    
    console.log('\n🎯 **Monitoring Active!**');
    console.log('   CADIS thinking processes are now being continuously captured...');
    
    return {
        sessionCount,
        dreamCount,
        totalNodes,
        intervalId,
        stop: () => window.stopCADISLogging(),
        trigger: () => window.triggerCADISSession()
    };
    
})().catch(console.error);

console.log('\n📋 **Instructions:**');
console.log('1. This script creates a continuous log of CADIS thinking');
console.log('2. Every 5 minutes, it captures a new CADIS session');
console.log('3. All dreams, nodes, and decisions are logged with timestamps');
console.log('4. The log file is continuously updated and downloaded');
console.log('5. Use triggerCADISSession() for manual sessions');
console.log('6. Use stopCADISLogging() to end monitoring');
