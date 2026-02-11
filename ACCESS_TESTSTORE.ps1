# Quick access to TestStore
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Accessing TestStore WooCommerce Site" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Store will be available at: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop when you're done" -ForegroundColor Yellow
Write-Host ""

kubectl port-forward -n store-teststore-8f5d2fcb service/teststore 8080:80
