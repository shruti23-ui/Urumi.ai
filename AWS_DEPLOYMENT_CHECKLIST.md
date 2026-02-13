# AWS Deployment Checklist - 51.20.42.151

**Date:** February 13, 2026
**Instance ID:** i-0178816a57cdd0462
**Public IP:** 51.20.42.151
**Region:** eu-north-1 (Stockholm)
**Instance Type:** c7i-flex.large

---

## ✅ Pre-Deployment Checklist

### 1. AWS Security Group Configuration

- [ ] **Port 22 (SSH)** - Allow from your IP
  - Current: ✅ Configured (0.0.0.0/0)
  - Action: Recommended to restrict to your IP only

- [ ] **Port 80 (HTTP)** - Allow from anywhere
  - Current: ✅ Configured (0.0.0.0/0)

- [ ] **Port 443 (HTTPS)** - Allow from anywhere
  - Current: ✅ Configured (0.0.0.0/0)

- [ ] **Port 3001** - Backend API (Optional, for direct access)
  - Current: ✅ Configured (0.0.0.0/0)

- [ ] **Port 3000-4000** - Store services range
  - Current: ✅ Configured (0.0.0.0/0)

- [ ] **Port 30000-32767** - Kubernetes NodePort range ⚠️ **REQUIRED**
  - Current: ❌ **NOT CONFIGURED**
  - **Action Required:** Add this rule in AWS Console
  - Type: Custom TCP
  - Port Range: 30000-32767
  - Source: 0.0.0.0/0
  - Description: Kubernetes NodePort Services

### 2. Local Prerequisites

- [ ] SSH key available at: `C:\Users\hp\OneDrive\Desktop\store-platform-key.pem`
- [ ] Git repository cloned locally
- [ ] Latest code committed and pushed to GitHub
- [ ] PowerShell with administrator access (for deployment script)

---

## 🚀 Deployment Steps

### Option A: Automated Deployment from Windows (Recommended)

#### Step 1: Configure Security Group
```
AWS Console → EC2 → Security Groups → launch-wizard-2
Add Inbound Rule:
  Type: Custom TCP
  Port Range: 30000-32767
  Source: 0.0.0.0/0
```

- [ ] Security group updated

#### Step 2: Run PowerShell Deployment Script
```powershell
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1
.\Deploy-To-AWS.ps1
```

- [ ] Script completed successfully
- [ ] All prerequisites installed (k3s, Helm, Docker)
- [ ] Repository cloned/updated
- [ ] Docker images built
- [ ] Platform deployed
- [ ] NodePort retrieved

#### Step 3: Verify Deployment
```powershell
# Test health endpoint (replace XXXXX with actual NodePort)
curl http://51.20.42.151:XXXXX/health

# Test API
curl http://51.20.42.151:XXXXX/api/stores
```

- [ ] Health check returns 200 OK
- [ ] API returns store list (may be empty)
- [ ] Dashboard loads in browser

---

### Option B: Manual Deployment via SSH

#### Step 1: SSH into Instance
```bash
ssh -i "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem" ubuntu@51.20.42.151
```

- [ ] Successfully connected via SSH

#### Step 2: Install Prerequisites
```bash
# Install k3s
curl -sfL https://get.k3s.io | sh -
sudo k3s kubectl get nodes

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

- [ ] k3s installed and running
- [ ] Helm installed
- [ ] Docker installed and running

#### Step 3: Clone Repository
```bash
git clone https://github.com/shruti23-ui/Urumi.ai.git
cd Urumi.ai
```

- [ ] Repository cloned

#### Step 4: Deploy Platform
```bash
chmod +x deploy-to-aws-new.sh
./deploy-to-aws-new.sh
```

- [ ] Deployment script completed
- [ ] All pods running
- [ ] Services created
- [ ] NodePort assigned

---

## 🔍 Post-Deployment Verification

### Check Pod Status
```bash
sudo kubectl get pods -n store-platform
```

**Expected:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
platform-api-xxxxxxxxx-xxxxx           1/1     Running   0          2m
platform-api-xxxxxxxxx-xxxxx           1/1     Running   0          2m
platform-dashboard-xxxxxxxxx-xxxxx     1/1     Running   0          2m
platform-orchestrator-xxxxxxxxx-xxxxx  1/1     Running   0          2m
postgres-0                              1/1     Running   0          2m
```

- [ ] All pods in Running state
- [ ] No CrashLoopBackOff errors
- [ ] 2 API replicas running
- [ ] 1 Dashboard replica running
- [ ] 1 Orchestrator replica running
- [ ] 1 PostgreSQL pod running

### Check Services
```bash
sudo kubectl get svc -n store-platform
```

- [ ] platform-api service (ClusterIP)
- [ ] platform-dashboard service (NodePort)
- [ ] postgres service (ClusterIP)

### Get Access URLs
```bash
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')
echo "Dashboard: http://51.20.42.151:${NODEPORT}/"
echo "API: http://51.20.42.151:${NODEPORT}/api/stores"
```

- [ ] NodePort retrieved (30000-32767 range)
- [ ] URLs documented

### Test Endpoints
```bash
# Health check
curl http://51.20.42.151:${NODEPORT}/health

# API stores endpoint
curl http://51.20.42.151:${NODEPORT}/api/stores

# Dashboard (should return HTML)
curl -I http://51.20.42.151:${NODEPORT}/
```

- [ ] `/health` returns 200 with JSON
- [ ] `/api/stores` returns 200 with store list
- [ ] Dashboard returns 200 with HTML

---

## 🏪 Create Test Store

### Via Dashboard
1. Open: `http://51.20.42.151:[NODEPORT]/`
2. Enter store name: "Test Store"
3. Select engine: WooCommerce
4. Click "Create Store"
5. Wait for status: "ready"

- [ ] Dashboard loads correctly
- [ ] Form submission works
- [ ] Store appears in list
- [ ] Status changes to "ready"

### Via API
```bash
curl -X POST http://51.20.42.151:${NODEPORT}/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Store", "engine": "woocommerce"}'
```

- [ ] Store creation accepted (202)
- [ ] Correlation ID returned
- [ ] Store appears in list

### Monitor Store Creation
```bash
# Watch orchestrator logs
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# Watch namespaces
sudo kubectl get namespaces --watch
```

- [ ] New namespace created (store-test-store-xxxxx)
- [ ] Helm release deployed
- [ ] Store pods running
- [ ] Store service created with NodePort

### Access Created Store
```bash
# Find store namespace
sudo kubectl get namespaces | grep store-test

# Get store service
STORE_NS="store-test-store-xxxxx"
STORE_PORT=$(sudo kubectl get svc -n $STORE_NS -o jsonpath='{.items[0].spec.ports[0].nodePort}')

echo "Store URL: http://51.20.42.151:${STORE_PORT}/"
```

- [ ] Store namespace found
- [ ] Store NodePort retrieved
- [ ] Store accessible via browser
- [ ] WordPress/WooCommerce loads correctly

### Test Store Admin
```
URL: http://51.20.42.151:[STORE_PORT]/wp-admin
Username: admin
Password: Admin@123!
```

- [ ] WP Admin loads
- [ ] Login successful
- [ ] WooCommerce dashboard visible
- [ ] Can create products

---

## 📊 System Health Checks

### Resource Usage
```bash
# Node resources
sudo kubectl top nodes

# Pod resources
sudo kubectl top pods -n store-platform
```

- [ ] CPU usage < 80%
- [ ] Memory usage < 80%
- [ ] Disk space available

### Database Connectivity
```bash
# Connect to PostgreSQL
POSTGRES_POD=$(sudo kubectl get pods -n store-platform -l app=postgres -o jsonpath='{.items[0].metadata.name}')
sudo kubectl exec -it -n store-platform $POSTGRES_POD -- psql -U postgres -d storeplatform

# Check stores table
SELECT id, name, engine, status FROM stores;
\q
```

- [ ] Can connect to database
- [ ] Stores table exists
- [ ] Test store record present

### Logs Review
```bash
# API logs (check for errors)
sudo kubectl logs -n store-platform deployment/platform-api --tail=100

# Orchestrator logs (check store creation)
sudo kubectl logs -n store-platform deployment/platform-orchestrator --tail=100

# Dashboard logs
sudo kubectl logs -n store-platform deployment/platform-dashboard --tail=100
```

- [ ] No critical errors in logs
- [ ] API requests logged correctly
- [ ] Store creation events logged

---

## 🎯 Features Testing

### Platform Dashboard Features
- [ ] List stores
- [ ] Create new store (WooCommerce)
- [ ] Medusa option disabled with "Coming in Round 2" message
- [ ] Delete store
- [ ] Auto-refresh every 5 seconds
- [ ] Status updates (deploying → ready)

### API Endpoints
- [ ] `GET /api/stores` - List all stores
- [ ] `POST /api/stores` - Create store
- [ ] `GET /api/stores/{id}` - Get store details
- [ ] `DELETE /api/stores/{id}` - Delete store
- [ ] `GET /health` - Health check
- [ ] `GET /health/live` - Liveness probe
- [ ] `GET /health/ready` - Readiness probe

### Store Features
- [ ] WordPress loads
- [ ] WooCommerce installed and activated
- [ ] Can create products
- [ ] Can add products to cart
- [ ] Checkout page works
- [ ] Cash on Delivery payment available
- [ ] Can place orders
- [ ] Orders visible in WooCommerce admin

### Multi-tenancy
- [ ] Each store in separate namespace
- [ ] Each store has own WordPress instance
- [ ] Each store has own MySQL database
- [ ] Resource isolation between stores
- [ ] Can delete store without affecting others

---

## 🐛 Troubleshooting Checks

### If Dashboard Shows 502 Bad Gateway
```bash
# Restart API
sudo kubectl rollout restart deployment/platform-api -n store-platform
sudo kubectl rollout status deployment/platform-api -n store-platform

# Check health
curl http://51.20.42.151:${NODEPORT}/health
```

- [ ] API restarted successfully
- [ ] Health check passes

### If Store Creation Fails
```bash
# Check orchestrator logs
sudo kubectl logs -n store-platform deployment/platform-orchestrator --tail=100

# Check RBAC permissions
sudo kubectl auth can-i create namespace --as=system:serviceaccount:store-platform:platform-orchestrator
sudo kubectl auth can-i create deployment --namespace=default --as=system:serviceaccount:store-platform:platform-orchestrator
```

- [ ] Logs show specific error
- [ ] RBAC permissions granted

### If Store Shows Database Error
```bash
# Find store namespace
STORE_NS="store-xxx"
MYSQL_POD=$(sudo kubectl get pods -n $STORE_NS -l app=*-mysql -o jsonpath='{.items[0].metadata.name}')
STORE_PORT=$(sudo kubectl get svc -n $STORE_NS -o jsonpath='{.items[0].spec.ports[0].nodePort}')

# Fix WordPress URL
sudo kubectl exec -n $STORE_NS $MYSQL_POD -- mysql -u root woocommerce -e \
  "UPDATE wp_options SET option_value='http://51.20.42.151:$STORE_PORT' WHERE option_name IN ('siteurl', 'home');"
```

- [ ] WordPress URL updated
- [ ] Store loads correctly

---

## 📝 Documentation Updates

### Update URLs Document
- [ ] Add AWS production URLs to ALL_URLS.md
- [ ] Document NodePort for platform
- [ ] Document test store URLs
- [ ] Update access instructions

### Record Deployment Details
```
Platform NodePort: _______
Test Store NodePort: _______
Deployment Date: February 13, 2026
Deployment Time: _______
```

### Create README for Submission
- [ ] Overview of platform
- [ ] Architecture diagram reference
- [ ] Deployment instructions
- [ ] Access URLs for demo
- [ ] Admin credentials
- [ ] Known limitations
- [ ] Future enhancements (Medusa in Round 2)

---

## 🎥 Demo Preparation

### Demo Script
1. **Show Platform Dashboard** (1 min)
   - [ ] Dashboard loads
   - [ ] Show existing stores
   - [ ] Point out Medusa disabled

2. **Create New Store** (3 min)
   - [ ] Fill form: "Demo Fashion Store"
   - [ ] Click Create
   - [ ] Show deploying status
   - [ ] Terminal: Watch orchestrator logs
   - [ ] Status changes to ready

3. **Access Store** (2 min)
   - [ ] Click store URL
   - [ ] Show WooCommerce homepage
   - [ ] Browse shop (empty)

4. **Add Products** (3 min)
   - [ ] SSH to AWS
   - [ ] Run setup script
   - [ ] Refresh browser
   - [ ] Show 5 products with images

5. **Place Order** (3 min)
   - [ ] Add product to cart
   - [ ] Proceed to checkout
   - [ ] Fill billing details
   - [ ] Select Cash on Delivery
   - [ ] Place order
   - [ ] Show confirmation

6. **Verify in Admin** (2 min)
   - [ ] Login to wp-admin
   - [ ] Navigate to WooCommerce → Orders
   - [ ] Show order details
   - [ ] Show products, inventory

7. **Show Multi-tenancy** (2 min)
   - [ ] Back to dashboard
   - [ ] Show multiple stores
   - [ ] Explain namespace isolation
   - [ ] Show resource separation

8. **Delete Store** (2 min)
   - [ ] Click Delete
   - [ ] Confirm deletion
   - [ ] Show deleting status
   - [ ] Terminal: Watch namespace deletion

### Record URLs for Demo
```
Platform: http://51.20.42.151:_______/
Test Store: http://51.20.42.151:_______/
Admin: http://51.20.42.151:_______/wp-admin
```

---

## ✅ Final Checklist

### Pre-Submission
- [ ] All code committed and pushed to GitHub
- [ ] README.md updated with AWS deployment info
- [ ] ALL_URLS.md updated with production URLs
- [ ] Security group properly configured
- [ ] Platform deployed and tested
- [ ] Test store created and functional
- [ ] Demo video recorded
- [ ] Architecture document reviewed
- [ ] Known issues documented

### Submission Package
- [ ] GitHub repository URL
- [ ] AWS instance access details
- [ ] Platform dashboard URL
- [ ] Demo store URL
- [ ] Admin credentials
- [ ] Demo video file/link
- [ ] Architecture document
- [ ] README with setup instructions

---

## 📞 Quick Commands Reference

```bash
# SSH to AWS
ssh -i "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem" ubuntu@51.20.42.151

# Check platform status
sudo kubectl get all -n store-platform

# Get access URL
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')
echo "http://51.20.42.151:${NODEPORT}/"

# Watch logs
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# List stores via API
curl http://51.20.42.151:${NODEPORT}/api/stores

# Create store
curl -X POST http://51.20.42.151:${NODEPORT}/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name": "My Store", "engine": "woocommerce"}'

# Restart platform
sudo kubectl rollout restart deployment -n store-platform
```

---

**Status:** Ready for deployment
**Next Action:** Configure Security Group NodePort range (30000-32767)
**Then:** Run Deploy-To-AWS.ps1 script
