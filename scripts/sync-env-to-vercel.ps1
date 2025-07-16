#!/usr/bin/env pwsh

# Sync Environment Variables to Vercel
# This script reads the local .env file and pushes each variable to Vercel

Write-Host "🚀 Starting environment variable sync to Vercel..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Check if vercel CLI is available
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Please install it first: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Read .env file and process each line
Write-Host "📁 Reading .env file..." -ForegroundColor Blue

$envVars = @()
$lineNumber = 0

Get-Content ".env" | ForEach-Object {
    $lineNumber++
    $line = $_.Trim()
    
    # Skip empty lines and comments
    if ($line -eq "" -or $line.StartsWith("#")) {
        return
    }
    
    # Parse KEY=VALUE format
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or 
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        
        $envVars += @{
            Key = $key
            Value = $value
            Line = $lineNumber
        }
        
        Write-Host "  📝 Found: $key" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  Skipping invalid line $lineNumber`: $line" -ForegroundColor Yellow
    }
}

if ($envVars.Count -eq 0) {
    Write-Host "❌ No environment variables found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Found $($envVars.Count) environment variables" -ForegroundColor Green

# Confirm before proceeding
$confirmation = Read-Host "🤔 Do you want to push these $($envVars.Count) environment variables to Vercel? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Yellow
    exit 0
}

# Push each environment variable to Vercel
Write-Host "🔄 Pushing environment variables to Vercel..." -ForegroundColor Blue

$successCount = 0
$failCount = 0

foreach ($envVar in $envVars) {
    try {
        Write-Host "  🔧 Setting $($envVar.Key)..." -ForegroundColor Cyan
        
        # Use vercel env add command with stdin
        $output = echo $envVar.Value | vercel env add $envVar.Key production --force 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Successfully set $($envVar.Key)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "    ❌ Failed to set $($envVar.Key): $output" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "    ❌ Error setting $($envVar.Key): $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n📋 Summary:" -ForegroundColor Blue
Write-Host "  ✅ Successfully set: $successCount variables" -ForegroundColor Green
Write-Host "  ❌ Failed to set: $failCount variables" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n🎉 All environment variables successfully synced to Vercel!" -ForegroundColor Green
    Write-Host "💡 You can verify them at: https://vercel.com/dashboard" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some environment variables failed to sync. Please check the errors above." -ForegroundColor Yellow
}

Write-Host "`n🚀 Environment sync complete!" -ForegroundColor Green 