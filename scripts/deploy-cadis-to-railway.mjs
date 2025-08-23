#!/usr/bin/env node

/**
 * Deploy CADIS Background Agent to Railway
 * This script helps deploy the CADIS agent as an independent service on Railway
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🚂 Deploying CADIS Background Agent to Railway...\n');

try {
  // Check if Railway CLI is installed
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI is installed');
  } catch (error) {
    console.log('❌ Railway CLI not found. Installing...');
    console.log('Please install Railway CLI: npm install -g @railway/cli');
    console.log('Then run: railway login');
    process.exit(1);
  }

  // Check if logged in to Railway
  try {
    execSync('railway whoami', { stdio: 'pipe' });
    console.log('✅ Logged in to Railway');
  } catch (error) {
    console.log('❌ Not logged in to Railway. Please run: railway login');
    process.exit(1);
  }

  // Create Railway project
  console.log('\n🏗️ Setting up Railway project...');
  
  // Check if project already exists
  let projectExists = false;
  try {
    execSync('railway status', { stdio: 'pipe' });
    projectExists = true;
    console.log('✅ Railway project already exists');
  } catch (error) {
    console.log('📝 Creating new Railway project...');
    execSync('railway init cadis-background-agent', { stdio: 'inherit' });
    console.log('✅ Railway project created');
  }

  // Set environment variables
  console.log('\n🔧 Setting up environment variables...');
  
  const envVars = [
    'GITHUB_TOKEN',
    'VERCEL_TOKEN', 
    'RAILWAY_TOKEN',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET'
  ];

  // Read local .env file if it exists
  let localEnv = {};
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        localEnv[key.trim()] = value.trim();
      }
    });
    console.log('✅ Local environment variables loaded');
  } catch (error) {
    console.log('⚠️ No .env.local file found');
  }

  // Set each environment variable
  for (const envVar of envVars) {
    if (localEnv[envVar]) {
      try {
        execSync(`railway variables set ${envVar}="${localEnv[envVar]}"`, { stdio: 'pipe' });
        console.log(`✅ Set ${envVar}`);
      } catch (error) {
        console.log(`⚠️ Failed to set ${envVar}`);
      }
    } else {
      console.log(`⚠️ ${envVar} not found in local environment`);
    }
  }

  // Set Railway-specific variables
  execSync('railway variables set NODE_ENV=production', { stdio: 'pipe' });
  execSync('railway variables set PORT=3000', { stdio: 'pipe' });
  console.log('✅ Railway-specific variables set');

  // Create Dockerfile for Railway deployment
  console.log('\n📦 Creating Dockerfile...');
  const dockerfile = `# CADIS Background Agent Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.mjs ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
`;

  writeFileSync('Dockerfile', dockerfile);
  console.log('✅ Dockerfile created');

  // Create .dockerignore
  const dockerignore = `node_modules
.next
.env*
.git
README.md
scripts/
docs/
*.md
.vercel
.railway
`;

  writeFileSync('.dockerignore', dockerignore);
  console.log('✅ .dockerignore created');

  // Deploy to Railway
  console.log('\n🚀 Deploying to Railway...');
  console.log('This may take a few minutes...\n');
  
  execSync('railway up', { stdio: 'inherit' });
  
  console.log('\n✅ CADIS Background Agent deployed successfully!');
  
  // Get deployment URL
  try {
    const url = execSync('railway domain', { encoding: 'utf8' }).trim();
    console.log(`🌐 Deployment URL: ${url}`);
    console.log(`🤖 CADIS Agent API: ${url}/api/cadis-agent`);
  } catch (error) {
    console.log('⚠️ Could not retrieve deployment URL');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Test the deployed agent at the URL above');
  console.log('2. Update your local CADIS_API_BASE environment variable');
  console.log('3. Configure webhooks if needed for automated operations');
  console.log('4. Monitor logs with: railway logs');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure Railway CLI is installed and you are logged in');
  console.log('2. Check that all environment variables are set correctly');
  console.log('3. Verify your Railway account has sufficient resources');
  console.log('4. Check Railway logs for detailed error information');
  process.exit(1);
}
