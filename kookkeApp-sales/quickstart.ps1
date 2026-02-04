#!/usr/bin/env powershell
# Kookee Sales App - Quick Start Script
# Run this from the workspace root

Write-Host "🚀 Kookee Sales Route Guidance App - Quick Start" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📦 Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($?) {
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not installed. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
$npmVersion = npm --version
if ($?) {
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check Expo CLI
$expoVersion = expo --version 2>$null
if ($?) {
    Write-Host "✓ Expo CLI: $expoVersion" -ForegroundColor Green
} else {
    Write-Host "⚠ Expo CLI not installed. Installing..." -ForegroundColor Yellow
    npm install -g expo-cli
}

Write-Host ""
Write-Host "📂 Setting up workspace..." -ForegroundColor Yellow

# Install root dependencies
Write-Host "  Installing root dependencies..." -ForegroundColor Cyan
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Root dependencies failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Root dependencies installed" -ForegroundColor Green

# Install mobile dependencies
Write-Host "  Installing mobile app dependencies..." -ForegroundColor Cyan
Push-Location mobile
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Mobile dependencies failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  ✓ Mobile app dependencies installed" -ForegroundColor Green
Pop-Location

# Check database
Write-Host ""
Write-Host "📊 Checking database setup..." -ForegroundColor Yellow
if (Test-Path "database/schema.sql") {
    Write-Host "✓ Database schema found at database/schema.sql" -ForegroundColor Green
    Write-Host ""
    Write-Host "  To set up PostgreSQL backend, run:" -ForegroundColor Cyan
    Write-Host "    createdb kookee_sales" -ForegroundColor Cyan
    Write-Host "    psql kookee_sales < database/schema.sql" -ForegroundColor Cyan
} else {
    Write-Host "✗ Database schema not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  • Startup Guide:      STARTUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "  • Development Plan:   DEVELOPMENT_ROADMAP.md" -ForegroundColor Cyan
Write-Host "  • Schema Reference:   database/SCHEMA.md" -ForegroundColor Cyan
Write-Host "  • Agent Prompts:      agent prompts.txt" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎮 Ready to start development!" -ForegroundColor Green
Write-Host ""
Write-Host "Quick commands:" -ForegroundColor Yellow
Write-Host "  Start dev server:     cd mobile && npm start" -ForegroundColor Cyan
Write-Host "  Run on Android:       cd mobile && npm run android" -ForegroundColor Cyan
Write-Host "  Run on iOS:           cd mobile && npm run ios" -ForegroundColor Cyan
Write-Host "  Run on web:           cd mobile && npm run web" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Read STARTUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "  2. Build backend (Spring Boot) or mock API endpoints" -ForegroundColor Cyan
Write-Host "  3. Implement login screen in mobile/App.tsx" -ForegroundColor Cyan
Write-Host "  4. Connect database initialization on app startup" -ForegroundColor Cyan
Write-Host "  5. Start expo dev server and test on emulator/device" -ForegroundColor Cyan
Write-Host ""
