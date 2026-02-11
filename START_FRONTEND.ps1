# Frontend Startup Script
# This script will properly start the frontend on port 5173

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Frontend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend"

# Check if port 5173 is in use
Write-Host "Checking if port 5173 is available..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($portCheck) {
    Write-Host "Port 5173 is in use. Attempting to free it..." -ForegroundColor Red
    $pid = $portCheck.OwningProcess
    Write-Host "Killing process $pid..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Port 5173 freed!" -ForegroundColor Green
} else {
    Write-Host "Port 5173 is available!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
Write-Host ""

# Start the frontend
npm run dev
