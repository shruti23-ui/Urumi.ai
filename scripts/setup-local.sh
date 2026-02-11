#!/bin/bash
set -e

echo "=== Kubernetes Store Platform - Local Setup ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Error: docker is required but not installed."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "Error: kubectl is required but not installed."; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "Error: helm is required but not installed."; exit 1; }
command -v kind >/dev/null 2>&1 || { echo "Warning: kind not found. Install it or use another k8s cluster."; }

echo "All prerequisites found!"
echo ""

# Create Kind cluster
echo "Creating Kind cluster..."
kind create cluster --name store-platform --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF

echo "Cluster created!"
echo ""

# Install NGINX Ingress
echo "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

echo "Ingress controller ready!"
echo ""

# Build images
echo "Building Docker images..."
echo "Building platform-api..."
docker build -t platform-api:latest ./backend

echo "Building platform-orchestrator..."
docker build -t platform-orchestrator:latest ./orchestrator

echo "Building platform-dashboard..."
docker build -t platform-dashboard:latest ./frontend

echo "Images built!"
echo ""

# Load images into Kind
echo "Loading images into Kind cluster..."
kind load docker-image platform-api:latest --name store-platform
kind load docker-image platform-orchestrator:latest --name store-platform
kind load docker-image platform-dashboard:latest --name store-platform

echo "Images loaded!"
echo ""

# Deploy platform
echo "Deploying platform with Helm..."
helm install store-platform ./helm-charts/platform \
  --values ./helm-charts/platform/values-local.yaml \
  --create-namespace

echo "Waiting for platform to be ready..."
kubectl wait --namespace store-platform \
  --for=condition=ready pod \
  --selector=app=postgres \
  --timeout=120s

kubectl wait --namespace store-platform \
  --for=condition=ready pod \
  --selector=app=platform-api \
  --timeout=120s

echo "Platform deployed!"
echo ""

# Configure /etc/hosts
echo "Configuring /etc/hosts..."
echo "Please add these entries to your /etc/hosts file:"
echo ""
echo "127.0.0.1 platform.local.stores.dev"
echo ""
echo "Or run this command (requires sudo):"
echo "echo '127.0.0.1 platform.local.stores.dev' | sudo tee -a /etc/hosts"
echo ""

# Show status
echo "=== Setup Complete! ==="
echo ""
echo "Platform is running!"
echo "Dashboard: http://platform.local.stores.dev"
echo ""
echo "To check status:"
echo "  kubectl get pods -n store-platform"
echo ""
echo "To view logs:"
echo "  kubectl logs -n store-platform deployment/platform-api"
echo "  kubectl logs -n store-platform deployment/platform-orchestrator"
echo ""
echo "To delete cluster:"
echo "  kind delete cluster --name store-platform"
echo ""
