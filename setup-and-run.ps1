# Setup and Run Script for Recipe ETL
# This script helps you set up and run the recipe database ETL

Write-Host "🚀 Recipe Database ETL Setup" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check .env file
if (Test-Path .env) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "   Creating .env template..." -ForegroundColor Yellow
    @"
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Image API Keys (OPTIONAL - but recommended)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
PEXELS_API_KEY=your-pexels-api-key
PIXABAY_API_KEY=your-pixabay-api-key
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "   ✅ Created .env template. Please fill in your values!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Open .env file" -ForegroundColor White
    Write-Host "   2. Add your Supabase URL and Service Role Key" -ForegroundColor White
    Write-Host "   3. (Optional) Add image API keys" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Check if env vars are set
$envContent = Get-Content .env -Raw
if ($envContent -match "SUPABASE_URL=https://your-project" -or $envContent -notmatch "SUPABASE_URL=") {
    Write-Host "⚠️  SUPABASE_URL not configured in .env" -ForegroundColor Yellow
    Write-Host "   Please update .env with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Setup Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  DATABASE MIGRATION (Manual Step Required)" -ForegroundColor Yellow
Write-Host "   - Go to Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "   - Copy contents of: supabase/migrations/001_create_recipes.sql" -ForegroundColor White
Write-Host "   - Paste and Run in SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  RUN ETL (This script will do it)" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣  DEPLOY EDGE FUNCTION (Manual Step Required)" -ForegroundColor Yellow
Write-Host "   - Go to Supabase Dashboard → Edge Functions" -ForegroundColor White
Write-Host "   - Create function: search-by-ingredients" -ForegroundColor White
Write-Host "   - Copy code from: supabase/functions/search-by-ingredients/index.ts" -ForegroundColor White
Write-Host ""

$response = Read-Host "Have you completed Step 1 (Database Migration)? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host ""
    Write-Host "⏸️  Please complete the database migration first!" -ForegroundColor Yellow
    Write-Host "   See SETUP_GUIDE.md for detailed instructions" -ForegroundColor White
    exit 0
}

Write-Host ""
Write-Host "🚀 Running ETL in sample mode..." -ForegroundColor Cyan
Write-Host ""

# Run ETL
node etl/seed_recipes.js --sample

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ETL completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify recipes in Supabase Dashboard → Table Editor" -ForegroundColor White
    Write-Host "   2. Deploy Edge Function (see Step 3 above)" -ForegroundColor White
    Write-Host "   3. Test your frontend - recipes should now load!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ ETL failed. Check the error messages above." -ForegroundColor Red
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   - Database migration not run" -ForegroundColor White
    Write-Host "   - Incorrect SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host "   - Network connectivity issues" -ForegroundColor White
    Write-Host ""
}

