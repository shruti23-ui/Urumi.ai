#!/bin/bash

# AWS Deployment Script for Store Platform
# Target AWS Instance: 51.20.42.151
# Created: February 13, 2026

set -e

echo "=================================="
echo "Store Platform AWS Deployment"
echo "Target IP: 51.20.42.151"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

AWS_IP="51.20.42.151"
NAMESPACE="store-platform"

echo -e "${GREEN}Step 1: Checking prerequisites...${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Installing...${NC}"
    sudo snap install kubectl --classic || sudo apt-get install -y kubectl
fi

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}helm not found. Installing...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}Step 2: Building Docker images...${NC}"

# Build backend
echo "Building backend image..."
cd backend
docker build -t shrutipriya31/store-platform-backend:latest .
cd ..

# Build frontend
echo "Building frontend image..."
cd frontend
docker build -t shrutipriya31/store-platform-frontend:latest .
cd ..

# Build orchestrator
echo "Building orchestrator image..."
cd orchestrator
docker build -t shrutipriya31/store-platform-orchestrator:latest .
cd ..

echo -e "${GREEN}Step 3: Importing images to k3s...${NC}"

# Import images to k3s
sudo docker save shrutipriya31/store-platform-backend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-frontend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-orchestrator:latest | sudo k3s ctr images import -

echo -e "${GREEN}Step 4: Deploying with Helm...${NC}"

# Create namespace if it doesn't exist
sudo kubectl create namespace $NAMESPACE --dry-run=client -o yaml | sudo kubectl apply -f -

# Deploy platform
helm upgrade --install store-platform ./helm-charts/platform \
  -f helm-charts/platform/values-vps.yaml \
  --namespace $NAMESPACE \
  --wait \
  --timeout 10m

echo -e "${GREEN}Step 5: Checking deployment status...${NC}"

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
sudo kubectl wait --for=condition=ready pod -l app=platform-api -n $NAMESPACE --timeout=5m || true
sudo kubectl wait --for=condition=ready pod -l app=platform-dashboard -n $NAMESPACE --timeout=5m || true
sudo kubectl wait --for=condition=ready pod -l app=platform-orchestrator -n $NAMESPACE --timeout=5m || true

# Show pod status
echo -e "\n${YELLOW}Pod Status:${NC}"
sudo kubectl get pods -n $NAMESPACE

# Show services
echo -e "\n${YELLOW}Services:${NC}"
sudo kubectl get svc -n $NAMESPACE

# Get NodePort
NODEPORT=$(sudo kubectl get svc -n $NAMESPACE platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')

echo -e "\n${GREEN}=================================="
echo "Deployment Complete!"
echo "=================================="
echo -e "${NC}"
echo "Platform Dashboard: http://${AWS_IP}:${NODEPORT}/"
echo "API Endpoint: http://${AWS_IP}:${NODEPORT}/api/stores"
echo ""
echo "To check status:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -f -n $NAMESPACE deployment/platform-api"
echo ""
echo "To test:"
echo "  curl http://${AWS_IP}:${NODEPORT}/health"
echo "  curl http://${AWS_IP}:${NODEPORT}/api/stores"
echo ""
