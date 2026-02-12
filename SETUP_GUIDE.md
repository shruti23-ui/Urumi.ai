# Complete Setup Guide - WooCommerce Store Platform

This guide will help you run the entire Kubernetes Store Provisioning Platform locally on your Windows machine.

## Overview

The platform consists of:
- **Backend API** (Node.js/Express) - Store management REST API
- **Frontend Dashboard** (React/Vite) - Web UI for managing stores
- **Orchestrator** (Node.js) - Kubernetes reconciliation loop for provisioning
- **PostgreSQL** - Platform database
- **Helm Charts** - WooCommerce store templates

## Prerequisites

### Required Software

1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - Enable Kubernetes in Docker Desktop settings
   - OR use Kind/Minikube (see below)

2. **Node.js 20+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

3. **kubectl**
   - Usually comes with Docker Desktop
   - Verify: `kubectl version --client`

4. **Helm 3**
   - Download: https://helm.sh/docs/intro/install/
   - Verify: `helm version`

5. **Kind (Optional - for local K8s cluster)**
   - Install: `choco install kind` or download from https://kind.sigs.k8s.io/
   - Verify: `kind version`

6. **Git**
   - Download: https://git-scm.com/download/win
   - Verify: `git --version`

## Step 1: Set Up Local Kubernetes Cluster

### Option A: Using Kind (Recommended for this project)

```powershell
# Create Kind cluster with the provided config
kind create cluster --name store-platform --config kind-config.yaml

# Verify cluster is running
kubectl cluster-info --context kind-store-platform

# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=90s
```

### Option B: Using Docker Desktop Kubernetes

```powershell
# Enable Kubernetes in Docker Desktop settings

# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=90s
```

## Step 2: Install Dependencies

```powershell
# Install all dependencies for all services
npm install

# Navigate to each service and install
cd backend
npm install
cd ..

cd frontend
npm install
cd ..

cd orchestrator
npm install
cd ..
```

## Step 3: Set Up Environment Variables

### Backend

```powershell
# Copy example env file
cp backend\.env.example backend\.env
```

Edit `backend\.env`:
```env
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_platform
DB_USER=postgres
DB_PASSWORD=postgres

# Kubernetes (update with your actual path)
KUBECONFIG=C:\Users\YourUsername\.kube\config
PLATFORM_NAMESPACE=store-platform

# Rate Limiting
MAX_STORES_PER_USER=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Store defaults
DEFAULT_DOMAIN_SUFFIX=.local.stores.dev

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Orchestrator

```powershell
# Copy example env file
cp orchestrator\.env.example orchestrator\.env
```

Edit `orchestrator\.env`:
```env
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_platform
DB_USER=postgres
DB_PASSWORD=postgres

# Kubernetes (update with your actual path)
KUBECONFIG=C:\Users\YourUsername\.kube\config
PLATFORM_NAMESPACE=store-platform

# Orchestrator settings
POLL_INTERVAL_MS=5000
HELM_RELEASE_TIMEOUT=600
DEFAULT_DOMAIN_SUFFIX=.local.stores.dev
```

### Frontend

```powershell
# Copy example env file
cp frontend\.env.example frontend\.env
```

Edit `frontend\.env`:
```env
# For local development
VITE_API_URL=http://localhost:3001/api
```

## Step 4: Set Up PostgreSQL Database

### Option A: Using Docker (Recommended)

```powershell
# Run PostgreSQL in Docker
docker run -d `
  --name store-platform-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=store_platform `
  -p 5432:5432 `
  postgres:15-alpine

# Wait a few seconds for PostgreSQL to start
Start-Sleep -Seconds 5
```

### Option B: Using Local PostgreSQL Installation

If you have PostgreSQL installed locally:
1. Create a database named `store_platform`
2. Use user `postgres` with password `postgres` (or update .env files)

## Step 5: Initialize Database Schema

```powershell
# Connect to PostgreSQL and run migrations
# Using docker exec if using Docker PostgreSQL
docker exec -i store-platform-postgres psql -U postgres -d store_platform < backend\migrations\001_initial_schema.sql

# OR if using local PostgreSQL
psql -U postgres -d store_platform -f backend\migrations\001_initial_schema.sql
```

Verify tables were created:
```powershell
docker exec -it store-platform-postgres psql -U postgres -d store_platform -c "\dt"
```

You should see: `stores` and `store_events` tables.

## Step 6: Set Up Kubernetes RBAC

The orchestrator needs permissions to create namespaces and deploy Helm charts:

```powershell
# Create the store-platform namespace
kubectl create namespace store-platform

# Apply RBAC configuration
kubectl apply -f k8s\rbac\orchestrator-rbac.yaml

# Verify service account was created
kubectl get serviceaccount -n store-platform
```

## Step 7: Run the Application

Open **3 separate terminal windows**:

### Terminal 1: Backend API

```powershell
cd backend
npm run dev
```

You should see:
```
Server listening on port 3001
Database connected successfully
```

### Terminal 2: Orchestrator

```powershell
cd orchestrator
npm run dev
```

You should see:
```
Orchestrator starting...
Reconciliation loop started
```

### Terminal 3: Frontend Dashboard

```powershell
cd frontend
npm run dev
```

You should see:
```
Local: http://localhost:5173/
```

## Step 8: Access the Dashboard

1. Open browser: http://localhost:5173
2. You should see the Store Platform Dashboard
3. Click "Create New Store"
4. Enter a store name (e.g., "My Test Store")
5. Select "WooCommerce" as the engine
6. Click "Create Store"

## Step 9: Monitor Store Provisioning

### Watch the orchestrator logs
In the orchestrator terminal, you'll see:
```
Processing store: <store-id>
Creating namespace: store-mytest-<id>
Installing Helm chart...
Store provisioning completed
```

### Check Kubernetes resources
```powershell
# List all store namespaces
kubectl get namespaces | findstr store-

# Check pods in a specific store namespace
kubectl get pods -n store-mytest-<id>

# Watch pod status
kubectl get pods -n store-mytest-<id> --watch
```

## Step 10: Access Your WooCommerce Store

Once the store status changes to "Ready" in the dashboard:

1. The dashboard will show the store URL (format: `http://<node-ip>:<nodeport>`)
2. Click on the URL to access your WooCommerce store
3. Default admin credentials:
   - URL: `http://<node-ip>:<nodeport>/wp-admin`
   - Username: `admin`
   - Password: `Admin@123!`

## Troubleshooting

### Backend won't start - Database connection error

```powershell
# Check if PostgreSQL is running
docker ps | findstr postgres

# Check PostgreSQL logs
docker logs store-platform-postgres

# Test connection
docker exec -it store-platform-postgres psql -U postgres -c "SELECT version();"
```

### Orchestrator fails with RBAC errors

```powershell
# Re-apply RBAC
kubectl delete -f k8s\rbac\orchestrator-rbac.yaml
kubectl apply -f k8s\rbac\orchestrator-rbac.yaml

# Check if service account exists
kubectl get serviceaccount store-orchestrator -n store-platform
```

### Store stuck in "Provisioning" status

```powershell
# Check orchestrator logs for errors
# In the orchestrator terminal window

# Check Helm releases
helm list -A

# Check specific store namespace
kubectl get all -n store-<name>-<id>

# Check pod logs
kubectl logs -n store-<name>-<id> <pod-name>

# Describe pod for events
kubectl describe pod -n store-<name>-<id> <pod-name>
```

### Helm install fails

```powershell
# Check if Helm can access the cluster
helm list

# Verify Helm chart exists
ls orchestrator\helm-charts\woocommerce-store

# Check orchestrator has correct HELM_CHARTS_PATH
# Should be: ./helm-charts (relative to orchestrator directory)
```

### Store pods in CrashLoopBackOff

```powershell
# Get pod name
kubectl get pods -n store-<name>-<id>

# Check logs
kubectl logs -n store-<name>-<id> <pod-name>

# Check events
kubectl get events -n store-<name>-<id> --sort-by='.lastTimestamp'

# Common issues:
# 1. MySQL not ready - wait longer
# 2. PVC not bound - check storage class
# 3. Image pull errors - check image names
```

### Frontend shows CORS errors

Update `backend\.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

Restart the backend.

### Cannot access WooCommerce store URL

```powershell
# Get the NodePort
kubectl get svc -n store-<name>-<id>

# Get node IP
kubectl get nodes -o wide

# For Kind cluster, use localhost
# For Docker Desktop, use localhost
# For Minikube, use: minikube ip

# Test connection
curl http://localhost:<nodeport>
```

## Testing the Complete Flow

### Create a store and place an order:

1. **Create Store**
   - Dashboard → Create New Store
   - Name: "Demo Fashion Store"
   - Engine: WooCommerce
   - Wait ~2-3 minutes for "Ready" status

2. **Access Store**
   - Click the store URL from dashboard
   - You should see WordPress with WooCommerce
   - Pre-configured with 3 sample products

3. **Place Order**
   - Browse the storefront
   - Add product to cart
   - Go to checkout
   - Fill in billing details (any test data)
   - Select "Cash on Delivery" payment
   - Place order

4. **Verify Order**
   - Go to WP Admin: `http://<store-url>/wp-admin`
   - Login: admin / Admin@123!
   - Navigate to WooCommerce → Orders
   - Your order should be listed

5. **Delete Store**
   - Dashboard → Delete Store button
   - Wait 30-60 seconds
   - Store and all resources removed

## Production Deployment (VPS with k3s)

For production deployment on a VPS:

1. **Install k3s on VPS**
```bash
curl -sfL https://get.k3s.io | sh -
```

2. **Build and push Docker images**
```bash
# Build images
docker build -t <your-registry>/platform-api:latest ./backend
docker build -t <your-registry>/platform-orchestrator:latest ./orchestrator
docker build -t <your-registry>/platform-dashboard:latest ./frontend

# Push to registry
docker push <your-registry>/platform-api:latest
docker push <your-registry>/platform-orchestrator:latest
docker push <your-registry>/platform-dashboard:latest
```

3. **Deploy using Helm**
```bash
# Copy your VPS IP
export VPS_IP=<your-vps-ip>

# Deploy platform
helm upgrade --install store-platform ./helm-charts/platform \
  -f helm-charts/platform/values-local.yaml \
  --set api.image.repository=<your-registry>/platform-api \
  --set orchestrator.image.repository=<your-registry>/platform-orchestrator \
  --set dashboard.image.repository=<your-registry>/platform-dashboard \
  --set ingress.additionalHosts[0]=$VPS_IP \
  --set ingress.allowIPAccess=true \
  --create-namespace
```

4. **Access dashboard**
```
http://<VPS_IP>:31107
```

## Clean Up

### Remove all stores
```powershell
# List all store namespaces
kubectl get namespaces | findstr store-

# Delete each store namespace
kubectl delete namespace store-<name>-<id>
```

### Stop services
Press `Ctrl+C` in each terminal window (backend, orchestrator, frontend)

### Remove PostgreSQL
```powershell
docker stop store-platform-postgres
docker rm store-platform-postgres
```

### Delete Kind cluster
```powershell
kind delete cluster --name store-platform
```

## Next Steps

1. Review the code to understand the architecture
2. Explore Helm charts in `orchestrator/helm-charts/woocommerce-store`
3. Try creating multiple stores concurrently
4. Test the rate limiting (try creating 11 stores)
5. Check the database to see stored metadata
6. Customize WooCommerce configuration in Helm chart

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs in all three terminal windows
3. Check Kubernetes events: `kubectl get events -A --sort-by='.lastTimestamp'`
4. Verify all prerequisites are installed correctly

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    User (Browser)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   Dashboard   │ (React - Port 5173)
              │   (Frontend)  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  Backend API  │ (Express - Port 3001)
              └───┬───────┬───┘
                  │       │
         ┌────────┘       └────────┐
         ▼                         ▼
  ┌──────────┐            ┌────────────────┐
  │PostgreSQL│            │  Orchestrator  │
  │  (DB)    │◄───────────┤ (Reconciler)   │
  └──────────┘            └────────┬───────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   Kubernetes    │
                          │   (via Helm)    │
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐    ┌─────────┐   ┌─────────┐
              │ Store 1 │    │ Store 2 │   │ Store N │
              │(WooCom) │    │(WooCom) │   │(WooCom) │
              └─────────┘    └─────────┘   └─────────┘
```

Good luck with your Urumi AI internship submission!
