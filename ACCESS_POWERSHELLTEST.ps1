# Quick access to PowerShellTest
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Accessing PowerShellTest WooCommerce Site" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Store will be available at: http://localhost:8081" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop when you're done" -ForegroundColor Yellow
Write-Host ""

kubectl port-forward -n store-powershelltest-740f852d service/powershelltest 8081:80
