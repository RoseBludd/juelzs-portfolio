#!/usr/bin/env pwsh

# Deploy to Vercel with Environment Sync
# This script syncs environment variables and deploys the application to Vercel

param(
    [switch]$SkipEnvSync,
    [switch]$Production = $true,
    [switch]$Preview = $false
)

Write-Host "🚀 Starting Vercel deployment process..." -ForegroundColor Green

# Check if vercel CLI is available
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI!" -ForegroundColor Red
        exit 1
    }
}

# Sync environment variables first (unless skipped)
if (-not $SkipEnvSync) {
    Write-Host "`n📋 Step 1: Syncing environment variables..." -ForegroundColor Blue
    
    if (Test-Path ".env") {
        $envSyncConfirm = Read-Host "🤔 Sync environment variables from .env to Vercel? (Y/n)"
        if ($envSyncConfirm -ne "n" -and $envSyncConfirm -ne "N") {
            .\scripts\sync-env-to-vercel.ps1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Environment sync failed! Continue anyway? (y/N)" -ForegroundColor Yellow
                $continueConfirm = Read-Host
                if ($continueConfirm -ne "y" -and $continueConfirm -ne "Y") {
                    exit 1
                }
            }
        }
    } else {
        Write-Host "⚠️  No .env file found. Skipping environment sync." -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping environment variable sync (--SkipEnvSync flag used)" -ForegroundColor Yellow
}

# Determine deployment type
$deploymentType = if ($Preview) { "preview" } else { "production" }
Write-Host "`n🚀 Step 2: Deploying to Vercel ($deploymentType)..." -ForegroundColor Blue

# Build and deploy
try {
    Write-Host "📦 Building and deploying application..." -ForegroundColor Cyan
    
    if ($Preview) {
        # Deploy to preview
        $deployOutput = vercel --yes 2>&1
    } else {
        # Deploy to production
        $deployOutput = vercel --prod --yes 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        
        # Extract deployment URL from output
        $deploymentUrl = $deployOutput | Where-Object { $_ -match "https://.*\.vercel\.app" } | Select-Object -Last 1
        if ($deploymentUrl) {
            $deploymentUrl = $deploymentUrl.Trim()
            Write-Host "🌐 Deployment URL: $deploymentUrl" -ForegroundColor Cyan
            
            # Open in browser
            $openBrowser = Read-Host "🌍 Open deployment in browser? (Y/n)"
            if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
                Start-Process $deploymentUrl
            }
        }
        
        Write-Host "`n📊 Deployment Summary:" -ForegroundColor Blue
        Write-Host "  📦 Type: $deploymentType" -ForegroundColor White
        Write-Host "  ✅ Status: Success" -ForegroundColor Green
        if ($deploymentUrl) {
            Write-Host "  🌐 URL: $deploymentUrl" -ForegroundColor Cyan
        }
        Write-Host "  💻 Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Deployment error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deployment process complete!" -ForegroundColor Green
Write-Host "💡 Monitor your deployment at: https://vercel.com/dashboard" -ForegroundColor Cyan 