# Complete AWS Deployment Script for Urumi Store Platform
# Target: 51.20.42.151
# This script deploys the entire platform and creates the Urumi Clothing Store

$ErrorActionPreference = "Stop"
$AWS_IP = "51.20.42.151"
$SSH_KEY = "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  URUMI STORE PLATFORM - AWS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "  Target: $AWS_IP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test Connection
Write-Host "[1/6] Testing AWS connection..." -ForegroundColor Yellow
try {
    $result = ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$AWS_IP "echo 'Connected'"
    if ($result -eq "Connected") {
        Write-Host "✓ SSH connection successful" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Cannot connect to AWS. Please check:" -ForegroundColor Red
    Write-Host "  1. Instance is running in AWS Console" -ForegroundColor Yellow
    Write-Host "  2. Security Group allows SSH (port 22)" -ForegroundColor Yellow
    Write-Host "  3. Your IP is whitelisted" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/6] Installing prerequisites on AWS..." -ForegroundColor Yellow

# Install k3s
Write-Host "  → Installing k3s (Kubernetes)..." -ForegroundColor Cyan
ssh -i $SSH_KEY ubuntu@$AWS_IP @"
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | sh -
    echo 'k3s installed'
else
    echo 'k3s already installed'
fi
"@

# Install Helm
Write-Host "  → Installing Helm..." -ForegroundColor Cyan
ssh -i $SSH_KEY ubuntu@$AWS_IP @"
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    echo 'Helm installed'
else
    echo 'Helm already installed'
fi
"@

# Install Docker
Write-Host "  → Installing Docker..." -ForegroundColor Cyan
ssh -i $SSH_KEY ubuntu@$AWS_IP @"
if ! command -v docker &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker.io
    sudo systemctl enable docker
    sudo systemctl start docker
    echo 'Docker installed'
else
    echo 'Docker already installed'
fi
"@

Write-Host "✓ Prerequisites installed" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Cloning/Updating repository..." -ForegroundColor Yellow

ssh -i $SSH_KEY ubuntu@$AWS_IP @"
if [ -d 'Urumi.ai' ]; then
    cd Urumi.ai
    git pull origin main
    echo 'Repository updated'
else
    git clone https://github.com/shruti23-ui/Urumi.ai.git
    echo 'Repository cloned'
fi
"@

Write-Host "✓ Repository ready" -ForegroundColor Green

Write-Host ""
Write-Host "[4/6] Building and deploying platform..." -ForegroundColor Yellow
Write-Host "  This will take 5-10 minutes..." -ForegroundColor Cyan

ssh -i $SSH_KEY ubuntu@$AWS_IP @"
cd Urumi.ai
chmod +x deploy-to-aws-new.sh
./deploy-to-aws-new.sh
"@

Write-Host "✓ Platform deployed" -ForegroundColor Green

Write-Host ""
Write-Host "[5/6] Getting access URLs..." -ForegroundColor Yellow

$nodePort = ssh -i $SSH_KEY ubuntu@$AWS_IP "sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null"

if ($nodePort) {
    Write-Host "✓ Platform is accessible" -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  PLATFORM DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 ACCESS FROM ANY DEVICE:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Dashboard: http://$AWS_IP`:$nodePort/" -ForegroundColor Yellow
    Write-Host "  API:       http://$AWS_IP`:$nodePort/api/stores" -ForegroundColor Yellow
    Write-Host ""

    # Test platform health
    Write-Host "[6/6] Creating Urumi Clothing Store..." -ForegroundColor Yellow

    try {
        $response = Invoke-RestMethod -Uri "http://$AWS_IP`:$nodePort/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Urumi Clothing","engine":"woocommerce"}' -TimeoutSec 30

        Write-Host "✓ Store creation initiated" -ForegroundColor Green
        Write-Host ""
        Write-Host "⏳ Waiting for store to be ready (2-3 minutes)..." -ForegroundColor Cyan

        # Wait and check store status
        $maxAttempts = 40
        $attempt = 0
        $storeReady = $false

        while ($attempt -lt $maxAttempts -and -not $storeReady) {
            Start-Sleep -Seconds 5
            $attempt++

            try {
                $stores = Invoke-RestMethod -Uri "http://$AWS_IP`:$nodePort/api/stores" -Method GET -TimeoutSec 10
                $urumiStore = $stores.stores | Where-Object { $_.name -eq "Urumi Clothing" }

                if ($urumiStore -and $urumiStore.status -eq "ready") {
                    $storeReady = $true
                    $storeUrls = $urumiStore.urls | ConvertFrom-Json

                    Write-Host ""
                    Write-Host "================================================" -ForegroundColor Green
                    Write-Host "  🎉 URUMI CLOTHING STORE IS LIVE!" -ForegroundColor Green
                    Write-Host "================================================" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "🛍️  STORE URL (Access from ANY device):" -ForegroundColor Cyan
                    Write-Host "   $($storeUrls[0])" -ForegroundColor Yellow
                    Write-Host ""
                    Write-Host "🔐 ADMIN LOGIN:" -ForegroundColor Cyan
                    Write-Host "   URL:      $($storeUrls[0])/wp-admin" -ForegroundColor Yellow
                    Write-Host "   Username: admin" -ForegroundColor Yellow
                    Write-Host "   Password: Admin@123!" -ForegroundColor Yellow
                    Write-Host ""
                    Write-Host "📱 TEST ON YOUR DEVICES:" -ForegroundColor Cyan
                    Write-Host "   • Open on phone: $($storeUrls[0])" -ForegroundColor White
                    Write-Host "   • Open on tablet: $($storeUrls[0])" -ForegroundColor White
                    Write-Host "   • Open on laptop: $($storeUrls[0])" -ForegroundColor White
                    Write-Host ""

                } elseif ($urumiStore) {
                    Write-Host "   Status: $($urumiStore.status) - waiting... ($attempt/40)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "   Checking... ($attempt/40)" -ForegroundColor Gray
            }
        }

        if (-not $storeReady) {
            Write-Host ""
            Write-Host "⚠️  Store is still deploying. Check status:" -ForegroundColor Yellow
            Write-Host "   http://$AWS_IP`:$nodePort/" -ForegroundColor Cyan
        }

    } catch {
        Write-Host "⚠️  Store creation queued. Check dashboard:" -ForegroundColor Yellow
        Write-Host "   http://$AWS_IP`:$nodePort/" -ForegroundColor Cyan
    }

} else {
    Write-Host "⚠️  Platform deployed but NodePort not detected" -ForegroundColor Yellow
    Write-Host "Check status manually:" -ForegroundColor Yellow
    Write-Host "  ssh -i $SSH_KEY ubuntu@$AWS_IP 'sudo kubectl get svc -n store-platform'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open dashboard: http://$AWS_IP`:$nodePort/" -ForegroundColor White
Write-Host "2. Access Urumi store from the dashboard" -ForegroundColor White
Write-Host "3. Add products via WooCommerce admin" -ForegroundColor White
Write-Host "4. Test on mobile devices" -ForegroundColor White
Write-Host ""
