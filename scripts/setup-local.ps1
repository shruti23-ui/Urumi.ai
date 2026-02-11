# PowerShell script for Windows users
Write-Host "=== Kubernetes Store Platform - Local Setup (Windows) ===" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$commands = @("docker", "kubectl", "helm", "kind")
foreach ($cmd in $commands) {
    if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "Error: $cmd is required but not installed." -ForegroundColor Red
        exit 1
    }
}
Write-Host "All prerequisites found!" -ForegroundColor Green
Write-Host ""

# Create Kind cluster
Write-Host "Creating Kind cluster..." -ForegroundColor Yellow
kind create cluster --name store-platform

Write-Host "Cluster created!" -ForegroundColor Green
Write-Host ""

# Install NGINX Ingress
Write-Host "Installing NGINX Ingress Controller..." -ForegroundColor Yellow
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

Write-Host "Waiting for ingress controller..." -ForegroundColor Yellow
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=90s

Write-Host "Ingress controller ready!" -ForegroundColor Green
Write-Host ""

# Build images
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker build -t platform-api:latest .\backend
docker build -t platform-orchestrator:latest .\orchestrator
docker build -t platform-dashboard:latest .\frontend

Write-Host "Images built!" -ForegroundColor Green
Write-Host ""

# Load images into Kind
Write-Host "Loading images into Kind cluster..." -ForegroundColor Yellow
kind load docker-image platform-api:latest --name store-platform
kind load docker-image platform-orchestrator:latest --name store-platform
kind load docker-image platform-dashboard:latest --name store-platform

Write-Host "Images loaded!" -ForegroundColor Green
Write-Host ""

# Deploy platform
Write-Host "Deploying platform with Helm..." -ForegroundColor Yellow
helm install store-platform .\helm-charts\platform `
  --values .\helm-charts\platform\values-local.yaml `
  --create-namespace

Write-Host "Waiting for platform..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "Platform deployed!" -ForegroundColor Green
Write-Host ""

# Configure hosts file
Write-Host "Configuring hosts file..." -ForegroundColor Yellow
Write-Host "Please add this entry to C:\Windows\System32\drivers\etc\hosts:" -ForegroundColor Cyan
Write-Host "127.0.0.1 platform.local.stores.dev" -ForegroundColor White
Write-Host ""
Write-Host "Run as Administrator to edit hosts file automatically:" -ForegroundColor Yellow
Write-Host 'Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 platform.local.stores.dev"' -ForegroundColor Cyan
Write-Host ""

# Show status
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Platform is running!" -ForegroundColor Green
Write-Host "Dashboard: http://platform.local.stores.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check status:" -ForegroundColor Yellow
Write-Host "  kubectl get pods -n store-platform" -ForegroundColor White
Write-Host ""
Write-Host "To delete cluster:" -ForegroundColor Yellow
Write-Host "  kind delete cluster --name store-platform" -ForegroundColor White
Write-Host ""
