#!/usr/bin/env node

/**
 * CADIS CLI - Command Line Interface for CADIS Background Agent
 * Usage: node scripts/cadis-cli.mjs "your request here"
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_BASE = process.env.CADIS_API_BASE || 'http://localhost:3000';
const CONFIG_FILE = join(__dirname, '..', '.env.local');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function showHelp() {
  console.log(colorize('\n🤖 CADIS CLI - Autonomous Coding Agent', 'cyan'));
  console.log(colorize('═'.repeat(50), 'blue'));
  
  console.log('\n📖 Usage:');
  console.log('  node scripts/cadis-cli.mjs "your request here"');
  console.log('  node scripts/cadis-cli.mjs --status');
  console.log('  node scripts/cadis-cli.mjs --help');
  
  console.log('\n💡 Examples:');
  console.log('  node scripts/cadis-cli.mjs "Fix TypeScript errors in the codebase"');
  console.log('  node scripts/cadis-cli.mjs "Add error handling to the API routes"');
  console.log('  node scripts/cadis-cli.mjs "Deploy latest changes to production"');
  console.log('  node scripts/cadis-cli.mjs "Handle support ticket about slow loading"');
  
  console.log('\n🎯 Request Types:');
  console.log('  • Support Tickets - Handle user issues and bugs');
  console.log('  • Project Adjustments - Modify existing features');
  console.log('  • Feature Requests - Add new functionality');
  console.log('  • Bug Fixes - Resolve code issues');
  console.log('  • Deployments - Manage production releases');
  
  console.log('\n🔧 Options:');
  console.log('  --status    Show CADIS agent status');
  console.log('  --help      Show this help message');
  console.log('  --verbose   Show detailed output');
  console.log('  --repo      Specify target repository');
  console.log('  --priority  Set priority (low, medium, high, critical)');
  
  console.log('\n🌐 Environment:');
  console.log(`  API Base: ${API_BASE}`);
  console.log(`  Config: ${CONFIG_FILE}`);
  console.log('');
}

async function getAgentStatus() {
  try {
    console.log(colorize('📊 Checking CADIS Agent status...', 'yellow'));
    
    const response = await fetch(`${API_BASE}/api/cadis-agent`);
    const data = await response.json();
    
    if (data.success) {
      console.log(colorize('\n✅ CADIS Agent Status', 'green'));
      console.log(colorize('─'.repeat(30), 'blue'));
      console.log(`🤖 Agent: ${data.agent} v${data.version}`);
      console.log(`🔄 Processing: ${data.status?.isProcessing ? colorize('Yes', 'yellow') : colorize('No', 'green')}`);
      console.log(`📋 Queue: ${data.status?.queueLength || 0} jobs`);
      console.log(`⏱️  Uptime: ${Math.round(data.status?.uptime || 0)}s`);
      
      console.log(colorize('\n🧠 AI Models:', 'cyan'));
      console.log(`  • GPT-5: ${data.models?.gpt5 || 'Not configured'}`);
      console.log(`  • Claude: ${data.models?.claude || 'Not configured'}`);
      console.log(`  • Gemini: ${data.models?.gemini || 'Not configured'}`);
      
      console.log(colorize('\n⚡ Capabilities:', 'magenta'));
      data.capabilities?.forEach(cap => {
        console.log(`  ✓ ${cap}`);
      });
    } else {
      console.log(colorize('❌ Agent not initialized', 'red'));
      console.log('Send a request to start the agent.');
    }
  } catch (error) {
    console.error(colorize('❌ Error checking status:', 'red'), error.message);
  }
}

async function sendRequest(request, options = {}) {
  try {
    console.log(colorize('🚀 Sending request to CADIS Agent...', 'yellow'));
    console.log(colorize(`📝 Request: ${request}`, 'blue'));
    
    if (options.verbose) {
      console.log(colorize('🔧 Options:', 'cyan'), JSON.stringify(options, null, 2));
    }
    
    const payload = {
      action: 'handle_request',
      request,
      context: {
        repository: options.repo || 'juelzs-portfolio',
        priority: options.priority || 'medium',
        cli: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const response = await fetch(`${API_BASE}/api/cadis-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(colorize('\n✅ CADIS Response:', 'green'));
      console.log(colorize('─'.repeat(50), 'blue'));
      console.log(data.result);
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

function parseArguments(args) {
  const options = {
    verbose: false,
    repo: null,
    priority: 'medium'
  };
  
  const flags = [];
  const request = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const flag = arg.substring(2);
      
      if (flag === 'verbose') {
        options.verbose = true;
      } else if (flag === 'repo' && i + 1 < args.length) {
        options.repo = args[++i];
      } else if (flag === 'priority' && i + 1 < args.length) {
        options.priority = args[++i];
      } else {
        flags.push(flag);
      }
    } else {
      request.push(arg);
    }
  }
  
  return {
    request: request.join(' '),
    flags,
    options
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }
  
  const { request, flags, options } = parseArguments(args);
  
  console.log(colorize('🤖 CADIS CLI - Autonomous Coding Agent', 'bright'));
  console.log(colorize('═'.repeat(50), 'blue'));
  
  if (flags.includes('status')) {
    await getAgentStatus();
  } else if (request.trim()) {
    await sendRequest(request.trim(), options);
  } else {
    console.log(colorize('❌ No request provided', 'red'));
    console.log('Use --help for usage information');
  }
  
  console.log(''); // Empty line for clean output
}

// Run the CLI
main().catch(error => {
  console.error(colorize('💥 CLI Error:', 'red'), error.message);
  process.exit(1);
});
