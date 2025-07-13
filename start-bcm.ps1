# BCM Integration Startup Script
# This script helps you start the BCM analysis system quickly

Write-Host "🛡️ Starting BCM Integration System..." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Check if Python backend is setup
if (-not (Test-Path "python-backend/bcm_env")) {
    Write-Host "⚠️  Python backend not setup. Running setup..." -ForegroundColor Yellow
    Push-Location python-backend
    python setup.py
    Pop-Location
    Write-Host "✅ Python backend setup complete!" -ForegroundColor Green
} else {
    Write-Host "✅ Python backend already configured" -ForegroundColor Green
}

# Check if .env exists
if (-not (Test-Path "python-backend/.env")) {
    Write-Host "⚠️  Please configure python-backend/.env with your API keys" -ForegroundColor Yellow
    Write-Host "   - PINECONE_API_KEY=your_key_here" -ForegroundColor Gray
    Write-Host "   - GROQ_API_KEY=your_key_here" -ForegroundColor Gray
    Write-Host "   - PINECONE_INDEX_NAME=your_index_name" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press any key to continue once configured..." -ForegroundColor Yellow
    Read-Host
}

# Start Python backend
Write-Host "🐍 Starting Python FastAPI backend..." -ForegroundColor Cyan
$pythonJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    & "python-backend/bcm_env/Scripts/python.exe" "python-backend/main.py"
} -ArgumentList (Get-Location)

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Check if backend is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/feeds/status" -TimeoutSec 5
    Write-Host "✅ Python backend running on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Python backend may not be running. Check logs above." -ForegroundColor Yellow
}

# Start Next.js frontend
Write-Host "⚛️  Starting Next.js frontend..." -ForegroundColor Cyan
Write-Host "   The application will be available at http://localhost:3000" -ForegroundColor Gray
Write-Host "   Navigate to Threat Intelligence > BCM Analysis tab" -ForegroundColor Gray
Write-Host ""

# Start Next.js in the same terminal
npm run dev

# Cleanup on exit
Write-Host "🛑 Shutting down services..." -ForegroundColor Red
Stop-Job $pythonJob
Remove-Job $pythonJob
Write-Host "✅ Services stopped" -ForegroundColor Green 