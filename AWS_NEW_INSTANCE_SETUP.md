# AWS New Instance Setup Guide

**AWS Instance IP:** 51.20.42.151
**Date:** February 13, 2026
**Instance ID:** i-0178816a57cdd0462

---

## 🔐 Security Group Configuration

Based on your screenshot, you have the following inbound rules configured:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 3001 | TCP | 0.0.0.0/0 | Backend API (Direct) |
| 3000-4000 | TCP | 0.0.0.0/0 | Store Services Range |
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |

### Additional Required Ports

You need to add these ports for the platform to work properly:

```
Port Range: 30000-32767
Protocol: TCP
Source: 0.0.0.0/0
Description: Kubernetes NodePort Services
```

**How to add:**
1. Go to EC2 Console → Security Groups
2. Find security group: `launch-wizard-2` (from screenshot)
3. Edit Inbound Rules → Add Rule
4. Type: Custom TCP
5. Port Range: 30000-32767
6. Source: 0.0.0.0/0
7. Description: Kubernetes NodePort Services
8. Save

---

## 🚀 Initial Setup on AWS Instance

### Step 1: SSH into Instance

```bash
# From Windows PowerShell
ssh -i "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem" ubuntu@51.20.42.151
```

### Step 2: Install Prerequisites

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install k3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Wait for k3s to be ready
sudo k3s kubectl get nodes

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Docker
sudo apt-get install -y docker.io
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker
```

### Step 3: Clone Repository

```bash
# Clone your repository
git clone https://github.com/shruti23-ui/Urumi.ai.git
cd Urumi.ai

# Or if already cloned, pull latest changes
cd Urumi.ai
git pull origin main
```

---

## 📦 Deployment Steps

### Option 1: Using Deployment Script (Recommended)

```bash
cd Urumi.ai

# Make script executable
chmod +x deploy-to-aws-new.sh

# Run deployment
./deploy-to-aws-new.sh
```

This script will:
- ✅ Build all Docker images (backend, frontend, orchestrator)
- ✅ Import images to k3s cluster
- ✅ Deploy platform using Helm
- ✅ Wait for pods to be ready
- ✅ Display access URLs

### Option 2: Manual Deployment

```bash
cd Urumi.ai

# 1. Build Docker images
cd backend
sudo docker build -t shrutipriya31/store-platform-backend:latest .
cd ../frontend
sudo docker build -t shrutipriya31/store-platform-frontend:latest .
cd ../orchestrator
sudo docker build -t shrutipriya31/store-platform-orchestrator:latest .
cd ..

# 2. Import to k3s
sudo docker save shrutipriya31/store-platform-backend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-frontend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-orchestrator:latest | sudo k3s ctr images import -

# 3. Deploy with Helm
helm upgrade --install store-platform ./helm-charts/platform \
  -f helm-charts/platform/values-vps.yaml \
  --namespace store-platform \
  --create-namespace \
  --wait \
  --timeout 10m
```

---

## 🔍 Verify Deployment

### Check Pod Status

```bash
sudo kubectl get pods -n store-platform
```

**Expected Output:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
platform-api-xxxxxxxxx-xxxxx           1/1     Running   0          2m
platform-api-xxxxxxxxx-xxxxx           1/1     Running   0          2m
platform-dashboard-xxxxxxxxx-xxxxx     1/1     Running   0          2m
platform-orchestrator-xxxxxxxxx-xxxxx  1/1     Running   0          2m
postgres-0                              1/1     Running   0          2m
```

### Check Services

```bash
sudo kubectl get svc -n store-platform
```

**Expected Output:**
```
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
platform-api         ClusterIP   10.43.xxx.xxx   <none>        3001/TCP         2m
platform-dashboard   NodePort    10.43.xxx.xxx   <none>        80:31XXX/TCP     2m
postgres             ClusterIP   10.43.xxx.xxx   <none>        5432/TCP         2m
```

### Get Access URL

```bash
# Get NodePort number
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')
echo "Access platform at: http://51.20.42.151:${NODEPORT}/"
```

---

## 🌐 Access URLs

Once deployed, your platform will be accessible at:

### Platform Dashboard
```
http://51.20.42.151:[NODEPORT]/
```
(Replace [NODEPORT] with the actual port from `kubectl get svc`)

### API Endpoints
```
http://51.20.42.151:[NODEPORT]/api/stores
http://51.20.42.151:[NODEPORT]/health
```

### Alternative Domain (using nip.io)
```
http://platform.51.20.42.151.nip.io:[NODEPORT]/
```

---

## 🏪 Creating Your First Store

### Via Web Dashboard

1. Open browser: `http://51.20.42.151:[NODEPORT]/`
2. Fill in form:
   - **Store Name:** "My Test Store"
   - **Engine:** WooCommerce
3. Click "Create Store"
4. Wait 2-3 minutes for status to change to "ready"
5. Access store via URL shown in dashboard

### Via API

```bash
# Create store
curl -X POST http://51.20.42.151:[NODEPORT]/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Store",
    "engine": "woocommerce"
  }'

# Check store status
curl http://51.20.42.151:[NODEPORT]/api/stores
```

### Access Created Store

Each store gets its own NodePort. Find it with:

```bash
# List all store namespaces
sudo kubectl get namespaces | grep store-

# Get store service
STORE_NAMESPACE="store-my-test-store-xxxxx"
sudo kubectl get svc -n $STORE_NAMESPACE

# Access store at:
# http://51.20.42.151:[STORE_NODEPORT]/
```

---

## 🔧 Monitoring & Debugging

### View Platform Logs

```bash
# API logs
sudo kubectl logs -f -n store-platform deployment/platform-api

# Orchestrator logs (store creation/deletion)
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# Dashboard logs
sudo kubectl logs -f -n store-platform deployment/platform-dashboard
```

### Check Database

```bash
# Get PostgreSQL pod
POSTGRES_POD=$(sudo kubectl get pods -n store-platform -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Connect to database
sudo kubectl exec -it -n store-platform $POSTGRES_POD -- psql -U postgres -d storeplatform

# List stores
SELECT id, name, engine, status FROM stores;

# Exit
\q
```

### Monitor Store Creation

```bash
# Watch namespaces being created
sudo kubectl get namespaces --watch

# Watch pods across all namespaces
sudo kubectl get pods -A --watch
```

---

## 🐛 Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** API pods not responding

**Fix:**
```bash
# Restart API
sudo kubectl rollout restart deployment/platform-api -n store-platform
sudo kubectl rollout status deployment/platform-api -n store-platform --timeout=2m

# Check health
curl http://51.20.42.151:[NODEPORT]/health
```

### Issue: Can't Access Dashboard

**Cause:** Security group not configured

**Fix:**
1. Check NodePort range (30000-32767) is open in AWS Security Group
2. Verify pod is running: `sudo kubectl get pods -n store-platform`
3. Restart dashboard: `sudo kubectl delete pod -n store-platform -l app=platform-dashboard`

### Issue: Store Creation Fails

**Check orchestrator logs:**
```bash
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator
```

**Common issues:**
- Insufficient resources: Check node capacity
- Image pull errors: Re-import images
- RBAC issues: Check service account permissions

### Issue: Store Shows Database Error

**Fix WordPress URL:**
```bash
STORE_NS="store-xxx"
STORE_PORT=$(sudo kubectl get svc -n $STORE_NS -o jsonpath='{.items[0].spec.ports[0].nodePort}')

# Get MySQL pod
MYSQL_POD=$(sudo kubectl get pods -n $STORE_NS -l app=*-mysql -o jsonpath='{.items[0].metadata.name}')

# Update WordPress URLs
sudo kubectl exec -n $STORE_NS $MYSQL_POD -- mysql -u root woocommerce -e \
  "UPDATE wp_options SET option_value='http://51.20.42.151:$STORE_PORT' WHERE option_name IN ('siteurl', 'home');"
```

---

## 🔄 Update Deployment

When you make code changes and want to redeploy:

```bash
# SSH to AWS
ssh -i "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem" ubuntu@51.20.42.151

cd Urumi.ai

# Pull latest changes
git pull origin main

# Rebuild and redeploy
./deploy-to-aws-new.sh
```

Or for specific component:

```bash
# Update API only
cd backend
sudo docker build -t shrutipriya31/store-platform-backend:latest .
sudo docker save shrutipriya31/store-platform-backend:latest | sudo k3s ctr images import -
sudo kubectl rollout restart deployment/platform-api -n store-platform
cd ..

# Update Dashboard only
cd frontend
sudo docker build -t shrutipriya31/store-platform-frontend:latest .
sudo docker save shrutipriya31/store-platform-frontend:latest | sudo k3s ctr images import -
sudo kubectl rollout restart deployment/platform-dashboard -n store-platform
cd ..

# Update Orchestrator only
cd orchestrator
sudo docker build -t shrutipriya31/store-platform-orchestrator:latest .
sudo docker save shrutipriya31/store-platform-orchestrator:latest | sudo k3s ctr images import -
sudo kubectl rollout restart deployment/platform-orchestrator -n store-platform
cd ..
```

---

## 📋 Quick Reference Commands

```bash
# Check platform status
sudo kubectl get all -n store-platform

# List all stores
curl http://51.20.42.151:[NODEPORT]/api/stores

# Create store
curl -X POST http://51.20.42.151:[NODEPORT]/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name": "Store Name", "engine": "woocommerce"}'

# Delete store
curl -X DELETE http://51.20.42.151:[NODEPORT]/api/stores/{STORE_ID}

# View logs
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# Get shell in pod
sudo kubectl exec -it -n store-platform deployment/platform-api -- /bin/sh

# Port forward for local testing
sudo kubectl port-forward -n store-platform svc/platform-dashboard 8080:80
# Then access: http://localhost:8080/

# Clean restart everything
sudo kubectl delete namespace store-platform
helm install store-platform ./helm-charts/platform -f helm-charts/platform/values-vps.yaml
```

---

## 🎯 Next Steps

1. ✅ Configure AWS Security Group (add NodePort range)
2. ✅ SSH into instance
3. ✅ Install prerequisites (k3s, Helm, Docker)
4. ✅ Clone repository
5. ✅ Run deployment script
6. ✅ Verify pods are running
7. ✅ Access dashboard
8. ✅ Create test store
9. ✅ Verify store is accessible
10. ✅ Add products to store
11. ✅ Test order placement
12. ✅ Record demo video

---

## 📞 Support

If you encounter issues:

1. **Check logs:** `sudo kubectl logs -f -n store-platform deployment/platform-orchestrator`
2. **Verify pods:** `sudo kubectl get pods -n store-platform`
3. **Test health:** `curl http://51.20.42.151:[NODEPORT]/health`
4. **Check security group:** Ensure NodePort range 30000-32767 is open

---

**Instance Details:**
- **Public IP:** 51.20.42.151
- **EC2 ID:** ec2-51-20-42-151
- **Instance ID:** i-0178816a57cdd0462
- **Region:** eu-north-1 (Stockholm)
- **Instance Type:** c7i-flex.large
- **Status:** Running (3/3 checks passed)

Your platform is ready to deploy! 🚀
