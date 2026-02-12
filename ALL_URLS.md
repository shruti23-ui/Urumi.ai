# All URLs - Store Platform Access Guide

**Generated:** February 13, 2026
**Environment:** Kubernetes (Docker Desktop)

---

## 🌐 Platform URLs

### Main Dashboard
```
http://localhost/
```
**Status:** ✅ Working (HTTP 200)
**Description:** Store Platform Dashboard - Create and manage stores

### API Endpoints
```
http://localhost/api/stores          # List all stores
http://localhost/api/stores/{id}     # Get specific store
http://localhost/health              # Health check
http://localhost/health/live         # Liveness probe
http://localhost/health/ready        # Readiness probe
```

### Alternative Access (if localhost doesn't work)
```
http://platform.local.stores.dev/
```
**Note:** Requires adding to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 platform.local.stores.dev
```

---

## 🏪 Active WooCommerce Stores

### Store 1: Clothing
- **Namespace:** `store-clothing-96aa0836`
- **Age:** 25 hours
- **Status:** Active
- **Access Methods:**
  - **Via Ingress:** `http://clothing.local.stores.dev/` (requires hosts file)
  - **ClusterIP:** 10.99.92.107:80 (internal only)
- **Admin:** `http://clothing.local.stores.dev/wp-admin`
- **Credentials:**
  - Username: `admin`
  - Password: `Admin@123!`

**Add to hosts file:**
```
127.0.0.1 clothing.local.stores.dev
```

---

### Store 2: Clothing Store ⭐ (NodePort Available)
- **Namespace:** `store-clothing-store-8517b785`
- **Age:** 158 minutes
- **Status:** Active
- **Access Methods:**
  - **Via NodePort:** `http://localhost:31005/` ✅ **DIRECT ACCESS**
  - **Via Ingress:** `http://clothing-store.local.stores.dev/`
  - **ClusterIP:** 10.103.116.46:80 (internal only)
- **Admin:** `http://localhost:31005/wp-admin`
- **Credentials:**
  - Username: `admin`
  - Password: `Admin@123!`

**⭐ This store has NodePort - can access directly without hosts file!**

---

### Store 3: Demo Store
- **Namespace:** `store-demostore-53342291`
- **Age:** 34 hours
- **Status:** Active
- **Access Methods:**
  - **Via Ingress:** `http://demostore.local.stores.dev/` (requires hosts file)
  - **ClusterIP:** 10.107.146.248:80 (internal only)
- **Admin:** `http://demostore.local.stores.dev/wp-admin`
- **Credentials:**
  - Username: `admin`
  - Password: `Admin@123!`

**Add to hosts file:**
```
127.0.0.1 demostore.local.stores.dev
```

---

### Store 4: My Store
- **Namespace:** `store-mystore-14a1f6a8`
- **Age:** 34 hours
- **Status:** Active
- **Access Methods:**
  - **Via Ingress:** `http://mystore.local.stores.dev/` (requires hosts file)
  - **ClusterIP:** 10.96.136.235:80 (internal only)
- **Admin:** `http://mystore.local.stores.dev/wp-admin`
- **Credentials:**
  - Username: `admin`
  - Password: `Admin@123!`

**Add to hosts file:**
```
127.0.0.1 mystore.local.stores.dev
```

---

### Store 5: PowerShell Test
- **Namespace:** `store-powershelltest-740f852d`
- **Age:** 26 hours
- **Status:** Active
- **Access Methods:**
  - **Via Ingress:** `http://powershelltest.local.stores.dev/`
  - **ClusterIP:** 10.102.187.149:80 (internal only)
- **Admin:** `http://powershelltest.local.stores.dev/wp-admin`
- **Credentials:**
  - Username: `admin`
  - Password: `Admin@123!`

**Add to hosts file:**
```
127.0.0.1 powershelltest.local.stores.dev
```

---

### Store 6: Test Store
- **Namespace:** `store-teststore-8f5d2fcb`
- **Age:** 26 hours
- **Status:** Active
- **Access Methods:**
  - **Via Ingress:** `http://teststore.local.stores.dev/`
  - **ClusterIP:** 10.103.153.81:80 (internal only)
- **Admin:** `http://teststore.local.stores.dev/wp-admin`
- **Credentials:**
  - Username: `admin`
  - Password: `Admin@123!`

**Add to hosts file:**
```
127.0.0.1 teststore.local.stores.dev
```

---

## 🔧 How to Access Stores

### Method 1: NodePort (Easiest - No Setup Required)

Only **Store 2 (Clothing Store)** has NodePort enabled:

```
http://localhost:31005/
```

**Test it now:**
```powershell
curl http://localhost:31005/
```

---

### Method 2: Ingress with Hosts File (Recommended)

**Step 1: Edit hosts file**

Open PowerShell as Administrator:
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

**Step 2: Add these lines:**
```
127.0.0.1 platform.local.stores.dev
127.0.0.1 clothing.local.stores.dev
127.0.0.1 clothing-store.local.stores.dev
127.0.0.1 demostore.local.stores.dev
127.0.0.1 mystore.local.stores.dev
127.0.0.1 powershelltest.local.stores.dev
127.0.0.1 teststore.local.stores.dev
```

**Step 3: Save and close**

**Step 4: Access stores:**
- Platform: `http://platform.local.stores.dev/`
- Clothing: `http://clothing.local.stores.dev/`
- Demo: `http://demostore.local.stores.dev/`
- etc.

---

### Method 3: Port Forwarding (Alternative)

If ingress isn't working, use kubectl port-forward:

```powershell
# Forward Clothing Store
kubectl port-forward -n store-clothing-96aa0836 svc/clothing 8080:80

# Access at:
http://localhost:8080/
```

---

## 📊 Quick Access Table

| Store Name | NodePort URL | Ingress URL | Status |
|------------|--------------|-------------|--------|
| **Platform Dashboard** | `http://localhost/` | `http://platform.local.stores.dev/` | ✅ Active |
| **Clothing Store** | `http://localhost:31005/` | `http://clothing-store.local.stores.dev/` | ✅ Active |
| Clothing | N/A | `http://clothing.local.stores.dev/` | ✅ Active |
| Demo Store | N/A | `http://demostore.local.stores.dev/` | ✅ Active |
| My Store | N/A | `http://mystore.local.stores.dev/` | ✅ Active |
| PowerShell Test | N/A | `http://powershelltest.local.stores.dev/` | ✅ Active |
| Test Store | N/A | `http://teststore.local.stores.dev/` | ✅ Active |

---

## 🎯 For Demo Video - Use These URLs

### 1. Show Dashboard
```
http://localhost/
```
Shows all stores, create new store form, status updates

---

### 2. Access a Working Store (NodePort - Easiest)
```
http://localhost:31005/
```
This is **Clothing Store** - has products, working checkout

---

### 3. Show WooCommerce Admin
```
http://localhost:31005/wp-admin
Username: admin
Password: Admin@123!
```
Show orders, products, WooCommerce settings

---

### 4. Alternative Stores (with hosts file)
```
http://clothing.local.stores.dev/
http://demostore.local.stores.dev/
http://mystore.local.stores.dev/
```

---

## 🔍 Verification Commands

### Check All Services
```powershell
# Platform
kubectl get svc -n store-platform

# All stores
kubectl get svc -A | findstr "store-"

# Ingress rules
kubectl get ingress -A
```

### Test URLs
```powershell
# Dashboard
curl http://localhost/

# API
curl http://localhost/api/stores

# Store (NodePort)
curl http://localhost:31005/
```

### Check Store Status
```powershell
# List all store namespaces
kubectl get namespaces | findstr store-

# Check pods in a store
kubectl get pods -n store-clothing-store-8517b785

# Check service details
kubectl get svc -n store-clothing-store-8517b785 -o wide
```

---

## 🚨 Troubleshooting

### "This site can't be reached" for .local.stores.dev URLs

**Problem:** Hosts file not configured

**Solution:**
1. Open PowerShell as Administrator
2. Run: `notepad C:\Windows\System32\drivers\etc\hosts`
3. Add the entries from Method 2 above
4. Save and close
5. Flush DNS: `ipconfig /flushdns`

---

### Dashboard shows 404

**Problem:** Ingress not routing correctly

**Solutions:**

**Option 1:** Use localhost (should always work)
```
http://localhost/
```

**Option 2:** Restart ingress
```powershell
kubectl rollout restart deployment ingress-nginx-controller -n ingress-nginx
```

**Option 3:** Check ingress status
```powershell
kubectl get ingress -n store-platform
kubectl describe ingress platform-ingress -n store-platform
```

---

### Store shows "Database connection error"

**Problem:** MySQL not ready

**Solution:** Check MySQL pod
```powershell
# Check MySQL status
kubectl get pods -n store-clothing-store-8517b785

# Check logs
kubectl logs -n store-clothing-store-8517b785 clothing-store-mysql-0

# Restart if needed
kubectl delete pod -n store-clothing-store-8517b785 clothing-store-mysql-0
```

---

## 💡 Pro Tips

### 1. Quick Store Access
The **Clothing Store** at `http://localhost:31005/` is the easiest to demo because it has NodePort - no hosts file needed!

### 2. Multiple Browsers
Open different stores in different browser tabs to show multi-tenancy:
- Tab 1: Dashboard (`http://localhost/`)
- Tab 2: Clothing Store (`http://localhost:31005/`)
- Tab 3: Another store (via ingress)

### 3. Show Resource Isolation
```powershell
# Show namespace separation
kubectl get all -n store-clothing-store-8517b785

# Show resource quotas
kubectl describe resourcequota -n store-clothing-store-8517b785
```

### 4. Live Monitoring
```powershell
# Watch store creation in real-time
kubectl get pods -A --watch | findstr store-

# Watch orchestrator logs
kubectl logs -f -n store-platform deployment/platform-orchestrator
```

---

## 🎬 Demo Script URLs

For your video, use this sequence:

### Part 1: Platform Overview (2 minutes)
```
http://localhost/
```
- Show dashboard with 7 stores
- Point out status (ready/failed)
- Show auto-refresh

### Part 2: Create New Store (3 minutes)
```
http://localhost/
```
- Click "Create New Store"
- Name: "Demo Fashion Store"
- Engine: WooCommerce (Medusa is disabled ✅)
- Click Create
- Show orchestrator logs in terminal
- Wait for "Ready" status

### Part 3: Access Store (2 minutes)
```
http://localhost:31005/
```
(or the NodePort of your new store)
- Show WooCommerce storefront
- Show 3 sample products with images
- Add product to cart

### Part 4: Place Order (3 minutes)
```
http://localhost:31005/
```
- Go to checkout
- Fill billing details (any test data)
- Select "Cash on Delivery"
- Place order

### Part 5: Verify in Admin (2 minutes)
```
http://localhost:31005/wp-admin
Username: admin
Password: Admin@123!
```
- Navigate to WooCommerce → Orders
- Show the order you just placed
- Show products, settings

### Part 6: Delete Store (2 minutes)
```
http://localhost/
```
- Click "Delete Store" on one store
- Confirm deletion
- Show it goes to "deleting" status
- In terminal: `kubectl get namespaces | findstr store-`
- Show namespace being removed

---

## 📝 Summary

**Main Access Points:**

1. **Dashboard (Always Use This):**
   ```
   http://localhost/
   ```

2. **Easiest Store to Access:**
   ```
   http://localhost:31005/
   ```
   (Clothing Store - NodePort)

3. **WooCommerce Admin:**
   ```
   http://localhost:31005/wp-admin
   admin / Admin@123!
   ```

**Total Active Resources:**
- 1 Platform Dashboard
- 7 WooCommerce Stores
- 8 Namespaces
- 14+ Running Pods

**Everything is working!** 🎉

Open `http://localhost/` now to see your dashboard!
