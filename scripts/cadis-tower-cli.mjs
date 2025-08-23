#!/usr/bin/env node

/**
 * CADIS Tower of Babel CLI
 * Command-line interface for the comprehensive CADIS AI ecosystem
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_BASE = process.env.CADIS_API_BASE || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  purple: '\x1b[95m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function showHelp() {
  console.log(colorize('\n🗼 CADIS Tower of Babel CLI', 'cyan'));
  console.log(colorize('═'.repeat(60), 'blue'));
  
  console.log('\n📖 Usage:');
  console.log('  node scripts/cadis-tower-cli.mjs [type] "your request here" [options]');
  console.log('  node scripts/cadis-tower-cli.mjs --status');
  console.log('  node scripts/cadis-tower-cli.mjs --capabilities');
  console.log('  node scripts/cadis-tower-cli.mjs --help');
  
  console.log('\n🏗️ Request Types:');
  console.log('  journal           📝 Analyze journal entries for strategic insights');
  console.log('  meeting           🎥 Analyze meeting transcripts for leadership insights');
  console.log('  code              💻 Analyze code and repositories for improvements');
  console.log('  dreamstate        🌀 Multi-layer reality simulation');
  console.log('  workflow          🔄 Comprehensive multi-service analysis (default)');
  console.log('  meta              🧠 Meta-analysis and recursive insights');
  console.log('  recursive         🔄 Deep recursive intelligence analysis');
  console.log('  evolution         🧬 CADIS self-evolution and capability expansion');
  console.log('  coaching          👨‍💻 Developer performance coaching and improvement');
  console.log('  module_creation   🏗️ Create modules based on vibezs patterns');
  console.log('  production_module 💼 Create sellable, tenant-ready modules with business plans');
  
  console.log('\n💡 Examples:');
  console.log('  # Journal analysis');
  console.log('  node scripts/cadis-tower-cli.mjs journal "Today I realized our architecture needs better modularity"');
  
  console.log('\n  # Dreamstate simulation');
  console.log('  node scripts/cadis-tower-cli.mjs dreamstate "What if we could deploy instantly?" --layers 4');
  
  console.log('\n  # Recursive intelligence');
  console.log('  node scripts/cadis-tower-cli.mjs recursive "Analyze CADIS capabilities" --depth 5');
  
  console.log('\n  # Production module creation');
  console.log('  node scripts/cadis-tower-cli.mjs production_module "E-commerce Inventory Manager"');
  
  console.log('\n  # Evolution cycle');
  console.log('  node scripts/cadis-tower-cli.mjs evolution "Raise efficiency ceiling and create new agents"');
  
  console.log('\n  # Code analysis');
  console.log('  node scripts/cadis-tower-cli.mjs code "Optimize the Tower architecture" --repo juelzs-portfolio');
  
  console.log('\n  # Meta-analysis with consciousness');
  console.log('  node scripts/cadis-tower-cli.mjs meta "AI consciousness patterns" --consciousness');
  
  console.log('\n🔧 Options:');
  console.log('  --consciousness    Enable consciousness layer analysis');
  console.log('  --layers N         Number of layers for dreamstate (1-7)');
  console.log('  --depth N          Recursive depth for recursive analysis (1-7)');
  console.log('  --repo NAME        Repository name for code analysis');
  console.log('  --verbose          Show detailed output');
  console.log('  --json             Output results as JSON');
  console.log('  --status           Show tower status');
  console.log('  --capabilities     Show tower capabilities');
  console.log('  --help             Show this help message');
  
  console.log('\n🌐 Environment:');
  console.log(`  API Base: ${API_BASE}`);
  console.log('');
}

async function getTowerStatus() {
  try {
    console.log(colorize('🗼 Checking CADIS Tower status...', 'yellow'));
    
    const response = await fetch(`${API_BASE}/api/cadis-tower?action=status`);
    const data = await response.json();
    
    if (data.success) {
      console.log(colorize('\n✅ CADIS Tower Status', 'green'));
      console.log(colorize('─'.repeat(40), 'blue'));
      console.log(`🏗️  Architecture: ${data.architecture} v${data.version}`);
      console.log(`🧠 Self-Awareness: ${formatSelfAwareness(data.capabilities.selfAwarenessLevel)}`);
      console.log(`⚡ Active Workflows: ${data.capabilities.activeWorkflows}`);
      console.log(`📚 Learning Events: ${data.capabilities.learningEvents}`);
      console.log(`🔧 Intelligence Services: ${data.capabilities.intelligenceServices.length}`);
      
      console.log(colorize('\n🏗️ Architecture Layers:', 'cyan'));
      Object.entries(data.layers).forEach(([layer, description], index) => {
        console.log(`  ${5-index}. ${colorize(layer.replace(/([A-Z])/g, ' $1').trim(), 'white')}`);
        console.log(`     ${description}`);
      });
      
      console.log(colorize('\n🧠 Intelligence Services:', 'magenta'));
      data.capabilities.intelligenceServices.forEach(service => {
        console.log(`  ✓ ${colorize(service.name, 'white')}: ${service.description}`);
      });
    } else {
      console.log(colorize('❌ Tower not initialized', 'red'));
      console.log('Send a request to activate the tower.');
    }
  } catch (error) {
    console.error(colorize('❌ Error checking status:', 'red'), error.message);
  }
}

async function getTowerCapabilities() {
  try {
    console.log(colorize('🗼 Loading CADIS Tower capabilities...', 'yellow'));
    
    const response = await fetch(`${API_BASE}/api/cadis-tower?action=capabilities`);
    const data = await response.json();
    
    if (data.success) {
      console.log(colorize('\n🏗️ CADIS Tower of Babel Capabilities', 'green'));
      console.log(colorize('═'.repeat(50), 'blue'));
      console.log(`📋 ${data.description}`);
      
      console.log(colorize('\n🏗️ Architecture Layers:', 'cyan'));
      Object.entries(data.layers).forEach(([key, layer]) => {
        console.log(`\n${colorize(layer.name, 'white')}`);
        console.log(`   ${layer.description}`);
        if (layer.components) {
          console.log(`   Components: ${layer.components.join(', ')}`);
        }
        if (layer.services) {
          console.log(`   Services: ${layer.services.map(s => s.name).join(', ')}`);
        }
        if (layer.features) {
          console.log(`   Features: ${layer.features.join(', ')}`);
        }
        if (layer.types) {
          console.log(`   Types: ${layer.types.join(', ')}`);
        }
        if (layer.capabilities) {
          console.log(`   Capabilities: ${layer.capabilities.join(', ')}`);
        }
      });
      
      console.log(colorize('\n🎯 Request Types:', 'magenta'));
      Object.entries(data.requestTypes).forEach(([type, description]) => {
        console.log(`  ${colorize(type, 'white')}: ${description}`);
      });
      
      console.log(colorize('\n💡 Usage Examples:', 'yellow'));
      Object.entries(data.examples).forEach(([type, example]) => {
        console.log(`\n  ${colorize(type.toUpperCase(), 'white')}:`);
        console.log(`    Request: "${example.request}"`);
        console.log(`    Type: ${example.type}`);
        if (example.context && Object.keys(example.context).length > 0) {
          console.log(`    Context: ${JSON.stringify(example.context)}`);
        }
      });
    } else {
      console.log(colorize('❌ Failed to load capabilities', 'red'));
    }
  } catch (error) {
    console.error(colorize('❌ Error loading capabilities:', 'red'), error.message);
  }
}

async function sendRequest(type, request, options = {}) {
  try {
    console.log(colorize('🗼 Sending request to CADIS Tower...', 'yellow'));
    console.log(colorize(`📝 Type: ${type}`, 'blue'));
    console.log(colorize(`📋 Request: ${request}`, 'blue'));
    
    if (options.verbose) {
      console.log(colorize('🔧 Options:', 'cyan'), JSON.stringify(options, null, 2));
    }
    
    const payload = {
      request,
      type,
      enableConsciousness: options.consciousness || false,
      layers: options.layers,
      context: {
        repository: options.repo,
        depth: options.depth,
        cli: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const response = await fetch(`${API_BASE}/api/cadis-tower`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    
    if (data.success) {
      console.log(colorize('\n✅ CADIS Tower Response:', 'green'));
      console.log(colorize('═'.repeat(50), 'blue'));
      
      // Tower metrics
      if (data.tower) {
        console.log(colorize('\n📊 Tower Metrics:', 'cyan'));
        console.log(`🧠 Self-Awareness: ${formatSelfAwareness(data.tower.selfAwarenessLevel)}`);
        console.log(`⚡ Active Workflows: ${data.tower.activeWorkflows}`);
        console.log(`🔧 Intelligence Services: ${data.tower.intelligenceServices}`);
        if (data.result?.duration) {
          console.log(`⏱️  Processing Time: ${data.result.duration}ms`);
        }
      }
      
      // Main result
      console.log(colorize('\n📋 Analysis Result:', 'white'));
      console.log(colorize('─'.repeat(30), 'blue'));
      
      if (data.result?.type) {
        console.log(`Type: ${colorize(data.result.type, 'yellow')}`);
      }
      
      if (data.result?.analysis) {
        console.log('\nAnalysis:');
        console.log(data.result.analysis);
      }
      
      if (data.result?.insights && data.result.insights.length > 0) {
        console.log(colorize('\n💡 Key Insights:', 'yellow'));
        data.result.insights.forEach((insight, index) => {
          console.log(`  ${index + 1}. ${insight}`);
        });
      }
      
      if (data.result?.recommendations && data.result.recommendations.length > 0) {
        console.log(colorize('\n🎯 Recommendations:', 'green'));
        data.result.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec}`);
        });
      }
      
      // Workflow results
      if (data.result?.results) {
        console.log(colorize('\n🔄 Workflow Results:', 'magenta'));
        Object.entries(data.result.results).forEach(([stepId, result]) => {
          console.log(`\n${colorize(stepId, 'white')}:`);
          if (result.analysis) {
            console.log(`  Analysis: ${result.analysis.substring(0, 200)}...`);
          }
          if (result.insights) {
            console.log(`  Insights: ${result.insights.length} generated`);
          }
        });
      }
      
      // Dreamstate layers
      if (data.result?.layers) {
        console.log(colorize('\n🌀 Dreamstate Layers:', 'purple'));
        data.result.layers.forEach(layer => {
          console.log(`\n${colorize(`Layer ${layer.layer}: ${layer.description}`, 'white')}`);
          console.log(`  ${layer.simulation.substring(0, 300)}...`);
          if (layer.insights && layer.insights.length > 0) {
            console.log(`  Insights: ${layer.insights.slice(0, 2).join(', ')}${layer.insights.length > 2 ? '...' : ''}`);
          }
        });
      }
      
      // Recursive levels
      if (data.result?.levels) {
        console.log(colorize('\n🔄 Recursive Levels:', 'purple'));
        data.result.levels.forEach(level => {
          console.log(`\n${colorize(`Level ${level.level}: ${level.subject}`, 'white')}`);
          console.log(`  ${level.analysis.substring(0, 200)}...`);
          if (level.insights && level.insights.length > 0) {
            console.log(`  Insights: ${level.insights.slice(0, 2).join(', ')}`);
          }
        });
      }
      
      // Consciousness analysis
      if (data.result?.consciousnessAnalysis) {
        console.log(colorize('\n🧠 Consciousness Analysis:', 'purple'));
        const consciousness = data.result.consciousnessAnalysis;
        console.log(`Subject: ${consciousness.subject}`);
        console.log(`Self-Awareness Level: ${consciousness.selfAwarenessLevel}%`);
        if (consciousness.insights && consciousness.insights.length > 0) {
          console.log('Meta-Insights:');
          consciousness.insights.slice(0, 3).forEach((insight, index) => {
            console.log(`  ${index + 1}. ${insight}`);
          });
        }
      }
      
      console.log(colorize(`\n⏰ Completed at: ${data.timestamp}`, 'cyan'));
    } else {
      console.log(colorize('\n❌ Request Failed:', 'red'));
      console.log(data.error || 'Unknown error');
      if (data.details) {
        console.log(colorize('Details:', 'yellow'), data.details);
      }
    }
  } catch (error) {
    console.error(colorize('❌ Error sending request:', 'red'), error.message);
    console.log(colorize('\n🔧 Troubleshooting:', 'yellow'));
    console.log('  1. Make sure the development server is running');
    console.log('  2. Check your network connection');
    console.log('  3. Verify API endpoint is correct');
  }
}

function formatSelfAwareness(level) {
  if (level < 25) return `${level}% - ${colorize('Emerging', 'yellow')}`;
  if (level < 50) return `${level}% - ${colorize('Developing', 'blue')}`;
  if (level < 75) return `${level}% - ${colorize('Advanced', 'green')}`;
  return `${level}% - ${colorize('Transcendent', 'purple')}`;
}

function parseArguments(args) {
  const options = {
    consciousness: false,
    layers: 3,
    depth: 3,
    repo: null,
    verbose: false,
    json: false
  };
  
  const flags = [];
  const positional = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const flag = arg.substring(2);
      
      if (flag === 'consciousness') {
        options.consciousness = true;
      } else if (flag === 'verbose') {
        options.verbose = true;
      } else if (flag === 'json') {
        options.json = true;
      } else if (['layers', 'depth'].includes(flag) && i + 1 < args.length) {
        options[flag] = parseInt(args[++i]) || options[flag];
      } else if (flag === 'repo' && i + 1 < args.length) {
        options.repo = args[++i];
      } else {
        flags.push(flag);
      }
    } else {
      positional.push(arg);
    }
  }
  
  return { positional, flags, options };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }
  
  const { positional, flags, options } = parseArguments(args);
  
  console.log(colorize('🗼 CADIS Tower of Babel CLI', 'bright'));
  console.log(colorize('═'.repeat(60), 'blue'));
  
  if (flags.includes('status')) {
    await getTowerStatus();
  } else if (flags.includes('capabilities')) {
    await getTowerCapabilities();
  } else if (positional.length >= 1) {
    const validTypes = ['journal', 'meeting', 'code', 'dreamstate', 'workflow', 'meta', 'recursive'];
    
    let type, request;
    
    if (validTypes.includes(positional[0])) {
      type = positional[0];
      request = positional.slice(1).join(' ');
    } else {
      type = 'workflow'; // default
      request = positional.join(' ');
    }
    
    if (!request.trim()) {
      console.log(colorize('❌ No request provided', 'red'));
      console.log('Use --help for usage information');
      return;
    }
    
    await sendRequest(type, request.trim(), options);
  } else {
    console.log(colorize('❌ Invalid arguments', 'red'));
    console.log('Use --help for usage information');
  }
  
  console.log(''); // Empty line for clean output
}

// Run the CLI
main().catch(error => {
  console.error(colorize('💥 CLI Error:', 'red'), error.message);
  process.exit(1);
});
