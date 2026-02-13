# Urumi Store Platform - Deployment Status

**AWS Instance:** 51.20.42.151
**Instance ID:** i-0178816a57cdd0462
**Date:** February 13, 2026
**Status:** 🔄 DEPLOYING

---

## ✅ Completed Steps

1. ✅ **AWS Instance Running** - EC2 instance active
2. ✅ **SSH Access Configured** - Successfully connected
3. ✅ **Docker Installed** - Pre-installed on instance
4. ✅ **k3s Installed** - v1.34.3+k3s3 running
5. ✅ **Helm Installed** - v3.20.0 ready
6. ✅ **Repository Cloned** - Latest code pulled from GitHub
7. 🔄 **Platform Deployment** - In progress (5-10 minutes)

---

## 🔄 Current Status

**Deploying components:**
- Backend API (2 replicas)
- Frontend Dashboard (2 replicas)
- Orchestrator (1 replica)
- PostgreSQL Database
- Ingress Controller

**What's happening:**
1. Building Docker images (backend, frontend, orchestrator)
2. Importing images to k3s cluster
3. Deploying with Helm charts
4. Creating Kubernetes resources
5. Waiting for pods to be ready

---

## 📱 Your URLs (Available After Deployment)

### Platform Dashboard
```
http://51.20.42.151:[NODEPORT]/
```
*Access from any device: phone, tablet, laptop*

### API Endpoint
```
http://51.20.42.151:[NODEPORT]/api/stores
```

### Health Check
```
http://51.20.42.151:[NODEPORT]/health
```

---

## 🏪 Next Steps

Once deployment completes:

### 1. Get Access URL
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')
echo "http://51.20.42.151:$NODEPORT/"
```

### 2. Create Urumi Clothing Store

**Via Dashboard:**
1. Open `http://51.20.42.151:[NODEPORT]/`
2. Enter name: "Urumi Clothing"
3. Select engine: WooCommerce
4. Click "Create Store"
5. Wait 2-3 minutes for "ready" status

**Via API:**
```bash
curl -X POST "http://51.20.42.151:$NODEPORT/api/stores" \
  -H "Content-Type: application/json" \
  -d '{"name":"Urumi Clothing","engine":"woocommerce"}'
```

### 3. Access Your Store
```bash
# Find store port
sudo kubectl get svc -A | grep urumi-clothing

# Your store URL
http://51.20.42.151:[STORE_PORT]/
```

### 4. Login to Admin
```
URL: http://51.20.42.151:[STORE_PORT]/wp-admin
Username: admin
Password: Admin@123!
```

---

## 🎨 Add Products

### Option 1: Via WooCommerce Admin
1. Login to wp-admin
2. Go to Products → Add New
3. Add product details, price, images
4. Click Publish

### Option 2: Use Setup Script (SSH)
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
cd Urumi.ai

# Find store namespace
STORE_NS=$(sudo kubectl get ns | grep urumi-clothing | awk '{print $1}')

# Update script with namespace
sed -i "s/NAMESPACE=.*/NAMESPACE=\"$STORE_NS\"/" setup-fashion-store.sh

# Run setup (adds 5 fashion products)
chmod +x setup-fashion-store.sh
./setup-fashion-store.sh
```

---

## 🔍 Monitoring Deployment

### Check Pod Status
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
sudo kubectl get pods -n store-platform
```

**Expected:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
platform-api-xxxxx                     1/1     Running   0          2m
platform-api-xxxxx                     1/1     Running   0          2m
platform-dashboard-xxxxx               1/1     Running   0          2m
platform-orchestrator-xxxxx            1/1     Running   0          2m
postgres-0                              1/1     Running   0          2m
```

### View Logs
```bash
# Orchestrator (store creation)
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# API logs
sudo kubectl logs -f -n store-platform deployment/platform-api

# Dashboard logs
sudo kubectl logs -f -n store-platform deployment/platform-dashboard
```

---

## ⚙️ Configuration Applied

### Helm Values (values-vps.yaml)
- **Instance IP:** 51.20.42.151
- **Domain Suffix:** .51.20.42.151.nip.io
- **API Replicas:** 2
- **Dashboard Replicas:** 2
- **Orchestrator Replicas:** 1
- **Storage:** local-path (20Gi)

### Backend CORS
- Allowed origins include: 51.20.42.151
- Supports NodePort access
- Allows requests without origin (mobile apps)

### Security Group
- ✅ Port 22 (SSH)
- ✅ Port 80 (HTTP)
- ✅ Port 443 (HTTPS)
- ✅ Port 3000-4000 (Store services)
- ⚠️ Port 30000-32767 (NodePort) - **ADD THIS IF NOT PRESENT**

---

## 🚨 If Deployment Fails

### Check Deployment Status
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
cd Urumi.ai
sudo kubectl get pods -n store-platform
sudo kubectl logs -n store-platform deployment/platform-api
```

### Common Issues

**Pods in CrashLoopBackOff:**
```bash
# Check logs
sudo kubectl logs -n store-platform <pod-name>

# Restart deployment
sudo kubectl rollout restart deployment/platform-api -n store-platform
```

**ImagePullBackOff:**
```bash
# Re-import images
cd Urumi.ai
sudo docker save shrutipriya31/store-platform-backend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-frontend:latest | sudo k3s ctr images import -
sudo docker save shrutipriya31/store-platform-orchestrator:latest | sudo k3s ctr images import -
```

**Can't Access Dashboard:**
- Check Security Group has NodePort range (30000-32767) open
- Verify pods are running: `sudo kubectl get pods -n store-platform`
- Test health: `curl http://localhost:$NODEPORT/health` (from AWS SSH)

---

## 📊 System Requirements Met

- ✅ **CPU:** c7i-flex.large instance
- ✅ **Memory:** Sufficient for platform + multiple stores
- ✅ **Storage:** EBS volume with local-path provisioner
- ✅ **Network:** Public IP with security groups
- ✅ **Kubernetes:** k3s (lightweight K8s)
- ✅ **Container Runtime:** Docker + containerd

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ All 5 platform pods in "Running" state
2. ✅ Health endpoint returns 200 OK
3. ✅ Dashboard loads in browser
4. ✅ Can create stores via UI
5. ✅ Stores deploy successfully
6. ✅ WooCommerce accessible
7. ✅ Can place orders

---

## 📱 Access from Devices

Once deployed, you can access from:

- **Desktop/Laptop:** Open browser → http://51.20.42.151:[NODEPORT]/
- **Mobile Phone:** Open browser → http://51.20.42.151:[NODEPORT]/
- **Tablet:** Open browser → http://51.20.42.151:[NODEPORT]/
- **Any device on internet:** Same URL works globally

**No VPN or special network needed** - it's publicly accessible!

---

## ⏱️ Estimated Timeline

- **Platform Deployment:** 5-10 minutes
- **Store Creation:** 2-3 minutes per store
- **Product Setup:** 1-2 minutes with script
- **Total:** ~15 minutes for complete setup

---

**Last Updated:** Deployment in progress...
**Check Status:** Run deployment monitoring commands above
