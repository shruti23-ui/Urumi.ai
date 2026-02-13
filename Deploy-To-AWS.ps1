# PowerShell Script to Deploy Store Platform to AWS
# Target: 51.20.42.151
# Date: February 13, 2026

$ErrorActionPreference = "Stop"

$AWS_IP = "51.20.42.151"
$SSH_KEY = "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem"
$REPO_PATH = "Urumi.ai"

Write-Host "=================================="  -ForegroundColor Green
Write-Host "Store Platform AWS Deployment"  -ForegroundColor Green
Write-Host "Target: $AWS_IP"  -ForegroundColor Green
Write-Host "=================================="  -ForegroundColor Green
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "ERROR: SSH key not found at: $SSH_KEY" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Testing SSH connection..." -ForegroundColor Yellow
try {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$AWS_IP "echo 'Connection successful'"
    Write-Host "✓ SSH connection OK" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Cannot connect to AWS instance. Check:" -ForegroundColor Red
    Write-Host "  1. Security Group allows SSH (port 22) from your IP" -ForegroundColor Yellow
    Write-Host "  2. Instance is running" -ForegroundColor Yellow
    Write-Host "  3. SSH key has correct permissions" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking prerequisites on AWS..." -ForegroundColor Yellow

# Check if k3s is installed
$k3sInstalled = ssh -i $SSH_KEY ubuntu@$AWS_IP "command -v k3s > /dev/null 2>&1 && echo 'yes' || echo 'no'"
if ($k3sInstalled -eq "no") {
    Write-Host "Installing k3s..." -ForegroundColor Cyan
    ssh -i $SSH_KEY ubuntu@$AWS_IP "curl -sfL https://get.k3s.io | sh -"
    Write-Host "✓ k3s installed" -ForegroundColor Green
} else {
    Write-Host "✓ k3s already installed" -ForegroundColor Green
}

# Check if Helm is installed
$helmInstalled = ssh -i $SSH_KEY ubuntu@$AWS_IP "command -v helm > /dev/null 2>&1 && echo 'yes' || echo 'no'"
if ($helmInstalled -eq "no") {
    Write-Host "Installing Helm..." -ForegroundColor Cyan
    ssh -i $SSH_KEY ubuntu@$AWS_IP "curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
    Write-Host "✓ Helm installed" -ForegroundColor Green
} else {
    Write-Host "✓ Helm already installed" -ForegroundColor Green
}

# Check if Docker is installed
$dockerInstalled = ssh -i $SSH_KEY ubuntu@$AWS_IP "command -v docker > /dev/null 2>&1 && echo 'yes' || echo 'no'"
if ($dockerInstalled -eq "no") {
    Write-Host "Installing Docker..." -ForegroundColor Cyan
    ssh -i $SSH_KEY ubuntu@$AWS_IP "sudo apt-get update && sudo apt-get install -y docker.io && sudo systemctl enable docker && sudo systemctl start docker"
    Write-Host "✓ Docker installed" -ForegroundColor Green
} else {
    Write-Host "✓ Docker already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Cloning/Updating repository..." -ForegroundColor Yellow

# Check if repo exists
$repoExists = ssh -i $SSH_KEY ubuntu@$AWS_IP "test -d $REPO_PATH && echo 'yes' || echo 'no'"
if ($repoExists -eq "yes") {
    Write-Host "Pulling latest changes..." -ForegroundColor Cyan
    ssh -i $SSH_KEY ubuntu@$AWS_IP "cd $REPO_PATH && git pull origin main"
    Write-Host "✓ Repository updated" -ForegroundColor Green
} else {
    Write-Host "Cloning repository..." -ForegroundColor Cyan
    ssh -i $SSH_KEY ubuntu@$AWS_IP "git clone https://github.com/shruti23-ui/Urumi.ai.git"
    Write-Host "✓ Repository cloned" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Deploying platform..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes..." -ForegroundColor Cyan

# Run deployment script
ssh -i $SSH_KEY ubuntu@$AWS_IP "cd $REPO_PATH && chmod +x deploy-to-aws-new.sh && ./deploy-to-aws-new.sh"

Write-Host ""
Write-Host "Step 5: Getting access URLs..." -ForegroundColor Yellow

# Get NodePort
$nodePort = ssh -i $SSH_KEY ubuntu@$AWS_IP "sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null"

if ($nodePort) {
    Write-Host ""
    Write-Host "=================================="  -ForegroundColor Green
    Write-Host "Deployment Successful!"  -ForegroundColor Green
    Write-Host "=================================="  -ForegroundColor Green
    Write-Host ""
    Write-Host "Platform Dashboard:" -ForegroundColor Yellow
    Write-Host "  http://$AWS_IP`:$nodePort/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "API Endpoint:" -ForegroundColor Yellow
    Write-Host "  http://$AWS_IP`:$nodePort/api/stores" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Health Check:" -ForegroundColor Yellow
    Write-Host "  http://$AWS_IP`:$nodePort/health" -ForegroundColor Cyan
    Write-Host ""

    # Test health endpoint
    Write-Host "Testing health endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://$AWS_IP`:$nodePort/health" -Method GET -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Platform is healthy and responding!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Platform deployed but health check failed. It may still be starting up." -ForegroundColor Yellow
        Write-Host "Wait 1-2 minutes and try accessing the URLs above." -ForegroundColor Yellow
    }
} else {
    Write-Host "Deployment completed but NodePort not found." -ForegroundColor Yellow
    Write-Host "Run this command to check status:" -ForegroundColor Yellow
    Write-Host "  ssh -i $SSH_KEY ubuntu@$AWS_IP 'sudo kubectl get pods -n store-platform'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "To check logs:" -ForegroundColor Yellow
Write-Host "  ssh -i $SSH_KEY ubuntu@$AWS_IP" -ForegroundColor Cyan
Write-Host "  sudo kubectl logs -f -n store-platform deployment/platform-orchestrator" -ForegroundColor Cyan
Write-Host ""
