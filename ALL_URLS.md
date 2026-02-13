# All URLs - Store Platform Access Guide

**Generated:** February 13, 2026
**Environment:** AWS EC2 Production (51.20.42.151)
**Status:** ✅ FULLY OPERATIONAL

---

## 🌐 AWS Production URLs - WORKING LINKS

### ✅ Platform API
```
http://51.20.42.151:30395/health              # Health check
http://51.20.42.151:30395/api/stores          # List all stores
http://51.20.42.151:30395/api/stores/{id}     # Get specific store
```
**Status:** ✅ LIVE and operational

### ✅ Urumi Clothing Store
```
Store Homepage:  http://51.20.42.151:30232/
Shop Products:   http://51.20.42.151:30232/shop/
Shopping Cart:   http://51.20.42.151:30232/cart/
Checkout:        http://51.20.42.151:30232/checkout/
Admin Panel:     http://51.20.42.151:30232/wp-admin
```

**Admin Credentials:**
- Username: `admin`
- Password: `Admin@123!`

**Status:** ✅ LIVE - WordPress + WooCommerce running

---

## ⚠️ IMPORTANT: Enable Browser Access

**Current Issue:** AWS Security Group is blocking NodePort range

**Fix:** Add this rule in AWS Console:
1. Go to **EC2** → **Security Groups** → **launch-wizard-2**
2. **Edit Inbound Rules** → **Add Rule**
3. Configure:
   - Type: **Custom TCP**
   - Port Range: **30000-32767**
   - Source: **0.0.0.0/0**
   - Description: **Kubernetes NodePort Services**
4. **Save Rules**

**After adding this rule, all URLs above will work from any device!**

---

## 📱 Test URLs (After Security Group Fix)

### From Desktop/Laptop:
```
Store:  http://51.20.42.151:30232/
API:    http://51.20.42.151:30395/health
Admin:  http://51.20.42.151:30232/wp-admin
```

### From Mobile Phone:
Open your phone browser and enter:
```
http://51.20.42.151:30232/
```

### From Tablet:
Open tablet browser and enter:
```
http://51.20.42.151:30232/
```

---

## 🔍 Verify Deployment (Via SSH)

SSH into AWS and test internally:
```bash
ssh -i "C:\Users\hp\OneDrive\Desktop\store-platform-key.pem" ubuntu@51.20.42.151

# Test API
curl http://localhost:30395/health

# Test Store
curl -I http://localhost:30232/

# List stores
curl http://localhost:30395/api/stores
```

**All tests should return HTTP 200 OK**

---

## 🎯 Quick Actions

### Check Platform Status
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
sudo kubectl get pods -n store-platform
sudo kubectl get svc -n store-platform
```

### Check Urumi Store Status
```bash
sudo kubectl get pods -n store-urumi-clothing-04f87684
sudo kubectl get svc -n store-urumi-clothing-04f87684
```

### Create Another Store
```bash
curl -X POST http://51.20.42.151:30395/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"Fashion Boutique","engine":"woocommerce"}'
```

---

## 📊 Current Deployment

### Platform Services
| Service | Type | Port | URL |
|---------|------|------|-----|
| Platform API | NodePort | 30395 | http://51.20.42.151:30395 |
| PostgreSQL | ClusterIP | 5432 | Internal only |

### Active Stores
| Store Name | Type | Port | URL | Status |
|------------|------|------|-----|--------|
| Urumi Clothing | NodePort | 30232 | http://51.20.42.151:30232 | ✅ Ready |

---

## 🛍️ Using Urumi Clothing Store

### Customer Flow:
1. Visit: http://51.20.42.151:30232/
2. Browse products (add products via admin first)
3. Add items to cart
4. Proceed to checkout: http://51.20.42.151:30232/checkout/
5. Fill billing details
6. Select "Cash on Delivery"
7. Place order

### Admin Flow:
1. Login: http://51.20.42.151:30232/wp-admin
2. Add Products: **Products** → **Add New**
3. View Orders: **WooCommerce** → **Orders**
4. Configure Settings: **WooCommerce** → **Settings**

---

## 📦 Add Sample Products

### Via WooCommerce Admin:
1. Login to http://51.20.42.151:30232/wp-admin
2. Go to **Products** → **Add New**
3. Add product details:
   - Product name
   - Regular price (e.g., ₹2500)
   - Description
   - Category
   - Product image
4. Click **Publish**

### Via Automated Script (SSH):
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
cd Urumi.ai

# Update namespace
STORE_NS="store-urumi-clothing-04f87684"
sed -i "s/NAMESPACE=.*/NAMESPACE=\"$STORE_NS\"/" setup-fashion-store.sh

# Run setup (adds 5 products with images)
chmod +x setup-fashion-store.sh
./setup-fashion-store.sh
```

---

## 🔧 Management Commands

### API Commands
```bash
# List all stores
curl http://51.20.42.151:30395/api/stores

# Get specific store
curl http://51.20.42.151:30395/api/stores/{STORE_ID}

# Create new store
curl -X POST http://51.20.42.151:30395/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"Electronics Store","engine":"woocommerce"}'

# Delete store
curl -X DELETE http://51.20.42.151:30395/api/stores/{STORE_ID}
```

### Kubernetes Commands
```bash
# View all pods
sudo kubectl get pods -A

# View orchestrator logs
sudo kubectl logs -f -n store-platform deployment/platform-orchestrator

# View store logs
sudo kubectl logs -f -n store-urumi-clothing-04f87684 deployment/urumi-clothing

# Restart API
sudo kubectl rollout restart deployment/platform-api -n store-platform
```

---

## 🎥 Demo Video URLs

Use these URLs for your demonstration:

1. **Show API Health:**
   ```
   http://51.20.42.151:30395/health
   ```

2. **Show Store List:**
   ```
   http://51.20.42.151:30395/api/stores
   ```

3. **Show Store Homepage:**
   ```
   http://51.20.42.151:30232/
   ```

4. **Show Admin Panel:**
   ```
   http://51.20.42.151:30232/wp-admin
   Login: admin / Admin@123!
   ```

5. **Show WooCommerce Dashboard:**
   - Products section
   - Orders section
   - Settings

6. **Create Store Live:**
   ```bash
   curl -X POST http://51.20.42.151:30395/api/stores \
     -H "Content-Type: application/json" \
     -d '{"name":"Live Demo Store","engine":"woocommerce"}'
   ```

---

## 🚨 Troubleshooting

### URLs Return Connection Timeout
**Issue:** Security Group not configured
**Fix:** Add NodePort range (30000-32767) to inbound rules

### Store Shows "Establishing Database Connection"
**Issue:** WordPress URL misconfigured
**Fix:**
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
sudo kubectl exec -n store-urumi-clothing-04f87684 deploy/urumi-clothing -c wp-setup -- \
  wp option update siteurl 'http://51.20.42.151:30232' --allow-root
sudo kubectl exec -n store-urumi-clothing-04f87684 deploy/urumi-clothing -c wp-setup -- \
  wp option update home 'http://51.20.42.151:30232' --allow-root
```

### API Not Responding
**Check:**
```bash
sudo kubectl get pods -n store-platform
sudo kubectl logs -n store-platform deployment/platform-api
```

---

## ✅ Quick Summary

**Platform Status:** ✅ OPERATIONAL
**Urumi Store Status:** ✅ LIVE
**Action Needed:** Add Security Group rule (port 30000-32767)

**Working URLs (after Security Group fix):**
- Store: http://51.20.42.151:30232/
- Admin: http://51.20.42.151:30232/wp-admin
- API: http://51.20.42.151:30395/api/stores

**Everything is deployed and ready - just add the Security Group rule to access from your browser!** 🚀
