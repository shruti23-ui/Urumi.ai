#!/bin/bash
# Simple AWS Deployment Script for 51.20.42.151

set -e

AWS_IP="51.20.42.151"
echo "===================================="
echo "Deploying to AWS: $AWS_IP"
echo "===================================="

echo ""
echo "[1/4] Installing prerequisites..."

# Install k3s
if ! command -v k3s >/dev/null 2>&1; then
    echo "Installing k3s..."
    curl -sfL https://get.k3s.io | sh -
    sleep 5
else
    echo "k3s already installed"
fi

# Install Helm
if ! command -v helm >/dev/null 2>&1; then
    echo "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
else
    echo "Helm already installed"
fi

# Install Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "Installing Docker..."
    sudo apt-get update -qq
    sudo apt-get install -y docker.io
    sudo systemctl enable docker
    sudo systemctl start docker
else
    echo "Docker already installed"
fi

echo ""
echo "[2/4] Setting up repository..."
if [ -d "Urumi.ai" ]; then
    cd Urumi.ai
    git pull origin main
    cd ..
else
    git clone https://github.com/shruti23-ui/Urumi.ai.git
fi

echo ""
echo "[3/4] Building Docker images..."
cd Urumi.ai

# Build backend
echo "Building backend..."
cd backend
sudo docker build -t shrutipriya31/store-platform-backend:latest .
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
sudo docker build -t shrutipriya31/store-platform-frontend:latest .
cd ..

# Build orchestrator
echo "Building orchestrator..."
cd orchestrator
sudo docker build -t shrutipriya31/store-platform-orchestrator:latest .
cd ..

echo ""
echo "[4/4] Deploying to Kubernetes..."

# Import images
sudo docker save shrutipriya31/store-platform-backend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-frontend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-orchestrator:latest | sudo k3s ctr images import -

# Deploy with Helm
helm upgrade --install store-platform ./helm-charts/platform \
  -f helm-charts/platform/values-vps.yaml \
  --namespace store-platform \
  --create-namespace \
  --wait \
  --timeout 10m

echo ""
echo "Waiting for pods to be ready..."
sleep 30
sudo kubectl wait --for=condition=ready pod -l app=platform-api -n store-platform --timeout=5m || true
sudo kubectl wait --for=condition=ready pod -l app=platform-dashboard -n store-platform --timeout=5m || true

# Get NodePort
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')

echo ""
echo "===================================="
echo "DEPLOYMENT COMPLETE!"
echo "===================================="
echo ""
echo "Platform URL: http://$AWS_IP:$NODEPORT/"
echo "API URL: http://$AWS_IP:$NODEPORT/api/stores"
echo ""
echo "Creating Urumi Clothing Store..."

# Create store via API
curl -X POST "http://$AWS_IP:$NODEPORT/api/stores" \
  -H "Content-Type: application/json" \
  -d '{"name":"Urumi Clothing","engine":"woocommerce"}' \
  || echo "Store will be created via dashboard"

echo ""
echo "Access from ANY device:"
echo "http://$AWS_IP:$NODEPORT/"
echo ""
