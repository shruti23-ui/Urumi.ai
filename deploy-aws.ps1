# Simple AWS Deployment Script
param()

$AWS_IP = "51.20.42.151"
$SSH_KEY = "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem"

Write-Host "Deploying to AWS: $AWS_IP" -ForegroundColor Cyan

# Test connection
Write-Host "`n[1/4] Testing connection..." -ForegroundColor Yellow
$testResult = ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$AWS_IP "echo OK"
if ($testResult -ne "OK") {
    Write-Host "ERROR: Cannot connect to AWS" -ForegroundColor Red
    exit 1
}
Write-Host "Connected successfully!" -ForegroundColor Green

# Install prerequisites
Write-Host "`n[2/4] Installing prerequisites..." -ForegroundColor Yellow
ssh -i $SSH_KEY ubuntu@$AWS_IP 'bash -s' @'
# Install k3s
if ! command -v k3s >/dev/null 2>&1; then
    echo "Installing k3s..."
    curl -sfL https://get.k3s.io | sh -
fi

# Install Helm
if ! command -v helm >/dev/null 2>&1; then
    echo "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Install Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "Installing Docker..."
    sudo apt-get update -qq
    sudo apt-get install -y docker.io
    sudo systemctl enable docker
    sudo systemctl start docker
fi

echo "Prerequisites ready"
'@

Write-Host "Prerequisites installed!" -ForegroundColor Green

# Clone/update repository
Write-Host "`n[3/4] Setting up repository..." -ForegroundColor Yellow
ssh -i $SSH_KEY ubuntu@$AWS_IP 'bash -s' @'
if [ -d "Urumi.ai" ]; then
    cd Urumi.ai && git pull origin main
else
    git clone https://github.com/shruti23-ui/Urumi.ai.git
fi
echo "Repository ready"
'@

Write-Host "Repository updated!" -ForegroundColor Green

# Deploy platform
Write-Host "`n[4/4] Deploying platform (this takes 5-10 minutes)..." -ForegroundColor Yellow
ssh -i $SSH_KEY ubuntu@$AWS_IP 'bash -s' @'
cd Urumi.ai
chmod +x deploy-to-aws-new.sh
./deploy-to-aws-new.sh
'@

# Get access URL
Write-Host "`nGetting access URL..." -ForegroundColor Yellow
$nodePort = ssh -i $SSH_KEY ubuntu@$AWS_IP "sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null"

if ($nodePort) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nPlatform URL: http://$AWS_IP`:$nodePort/" -ForegroundColor Cyan
    Write-Host "API URL:      http://$AWS_IP`:$nodePort/api/stores" -ForegroundColor Cyan

    Write-Host "`nCreating Urumi Clothing Store..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "http://$AWS_IP`:$nodePort/api/stores" -Method POST `
            -ContentType "application/json" `
            -Body (@{name="Urumi Clothing"; engine="woocommerce"} | ConvertTo-Json) `
            -TimeoutSec 30 | Out-Null
        Write-Host "Store creation initiated! Check dashboard." -ForegroundColor Green
    } catch {
        Write-Host "Note: Create store manually from dashboard" -ForegroundColor Yellow
    }

    Write-Host "`nAccess from any device: http://$AWS_IP`:$nodePort/" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Could not get NodePort" -ForegroundColor Red
}
'@
