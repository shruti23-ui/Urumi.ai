# Quick Deployment Guide - Urumi Store Platform

## Deploy to AWS (51.20.42.151)

### Step 1: SSH into AWS
```bash
ssh -i "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem" ubuntu@51.20.42.151
```

### Step 2: Run Deployment Script
```bash
# Copy the deploy-simple.sh script or run these commands:
curl -sfL https://raw.githubusercontent.com/shruti23-ui/Urumi.ai/main/deploy-to-aws-new.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**OR manually:**

```bash
# Install k3s
curl -sfL https://get.k3s.io | sh -

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Clone repo
git clone https://github.com/shruti23-ui/Urumi.ai.git
cd Urumi.ai

# Run deployment
chmod +x deploy-to-aws-new.sh
./deploy-to-aws-new.sh
```

### Step 3: Get Your URLs
```bash
# Get NodePort
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')

echo "Platform: http://51.20.42.151:$NODEPORT/"
echo "API: http://51.20.42.151:$NODEPORT/api/stores"
```

### Step 4: Create Urumi Clothing Store

**Option A - Via Dashboard:**
1. Open: `http://51.20.42.151:[NODEPORT]/`
2. Enter name: "Urumi Clothing"
3. Select: WooCommerce
4. Click "Create Store"

**Option B - Via API:**
```bash
curl -X POST "http://51.20.42.151:$NODEPORT/api/stores" \
  -H "Content-Type: application/json" \
  -d '{"name":"Urumi Clothing","engine":"woocommerce"}'
```

### Step 5: Access Your Store
Wait 2-3 minutes, then:
```bash
# Get store URL
sudo kubectl get svc -A | grep urumi-clothing
```

Your store will be at: `http://51.20.42.151:[STORE_PORT]/`

---

## Quick Commands

```bash
# Check platform status
sudo kubectl get pods -n store-platform

# Check all stores
sudo kubectl get namespaces | grep store-

# View logs
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# Get all URLs
sudo kubectl get svc -A | grep NodePort
```

---

## Troubleshooting

**Can't SSH?**
- Check Security Group allows port 22
- Verify instance is running in AWS Console

**Platform not accessible?**
- Add Security Group rule: Port Range 30000-32767, Source: 0.0.0.0/0

**Store creation fails?**
- Check: `sudo kubectl logs -f -n store-platform deployment/platform-orchestrator`

---

## Your URLs

Once deployed, access from ANY device:

- **Platform Dashboard**: `http://51.20.42.151:[NODEPORT]/`
- **Urumi Store**: `http://51.20.42.151:[STORE_PORT]/`
- **Store Admin**: `http://51.20.42.151:[STORE_PORT]/wp-admin`
  - Username: `admin`
  - Password: `Admin@123!`

Replace `[NODEPORT]` and `[STORE_PORT]` with actual port numbers from deployment.
