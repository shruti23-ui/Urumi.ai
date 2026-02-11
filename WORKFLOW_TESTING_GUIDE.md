# Visual Workflow Testing Guide

## System Architecture (What Talks to What)

```
┌─────────────┐
│   Browser   │ <-- You interact here
└──────┬──────┘
       │ http://localhost:5173
       ↓
┌─────────────┐
│  Frontend   │ <-- Shows the website
│  (Port 5173)│
└──────┬──────┘
       │ Makes API calls
       ↓
┌─────────────┐
│   Backend   │ <-- Handles requests
│  (Port 3001)│
└──────┬──────┘
       │ Saves data
       ↓
┌─────────────┐      ┌──────────────┐
│ PostgreSQL  │ <--> │ Orchestrator │ <-- Creates stores
│  Database   │      │ (Port 3002)  │
└─────────────┘      └──────┬───────┘
                            │ Talks to
                            ↓
                     ┌──────────────┐
                     │  Kubernetes  │ <-- Runs stores
                     │   Cluster    │
                     └──────────────┘
```

---

## Workflow 1: Starting the System

### Step-by-Step with Expected Output

#### Window 1: Start Backend
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev
```

**Watch for these logs in order:**
```
1. [timestamp] Starting Platform API...
2. [timestamp] Connecting to database...
3. [timestamp] Database connection successful ✅
4. [timestamp] Running database migrations...
5. [timestamp] Migrations completed ✅
6. [timestamp] Platform API started on port 3001 ✅
7. [timestamp] Press Ctrl+C to stop
```

**Status:** Backend is READY when you see all ✅

---

#### Window 2: Start Orchestrator
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev
```

**Watch for these logs in order:**
```
1. [timestamp] Store Platform Orchestrator starting...
2. [timestamp] Connecting to database...
3. [timestamp] Database connection successful ✅
4. [timestamp] Kubernetes client initialized ✅
5. [timestamp] Starting reconciliation loop...
6. [timestamp] Reconciliation loop running (every 5 seconds)
```

**Status:** Orchestrator is READY when you see "Reconciliation loop running"

---

#### Window 3: Start Frontend
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev
```

**Watch for these logs:**
```
1. [timestamp] VITE v5.x.x ready in XXX ms
2. [timestamp]
3. [timestamp] ➜  Local:   http://localhost:5173/
4. [timestamp] ➜  Network: use --host to expose
5. [timestamp] ➜  press h + enter to show help
```

**Status:** Frontend is READY when you see the Local URL

---

## Workflow 2: Creating a Store (End-to-End)

### Visual Timeline

```
TIME    | COMPONENT      | WHAT HAPPENS
--------|----------------|----------------------------------
T+0s    | Browser        | User fills form and clicks "Create"
        |                |
T+0s    | Frontend       | Sends POST request to backend
        |                |
T+1s    | Backend        | Validates request
        |                | Saves to database (status=provisioning)
        |                | Returns response to frontend
        |                |
T+2s    | Frontend       | Shows "Status: Provisioning"
        |                |
T+5s    | Orchestrator   | Polls database, finds new store
        |                | Logs: "Found store to provision"
        |                |
T+10s   | Orchestrator   | Creates Kubernetes namespace
        |                | Logs: "Creating namespace: store-xxx"
        |                |
T+15s   | Kubernetes     | Namespace created
        |                |
T+20s   | Orchestrator   | Installs Helm chart
        |                | Logs: "Installing Helm chart..."
        |                |
T+30s   | Kubernetes     | Starts creating pods
        |                | - WordPress pod
        |                | - MySQL pod
        |                |
T+60s   | Kubernetes     | Pulling container images...
        |                |
T+120s  | Kubernetes     | Containers starting...
        |                |
T+180s  | Kubernetes     | MySQL ready ✅
        |                |
T+240s  | Kubernetes     | WordPress ready ✅
        |                |
T+250s  | Orchestrator   | Detects all pods running
        |                | Updates database (status=ready)
        |                | Logs: "Store is now ready!"
        |                |
T+255s  | Frontend       | Auto-refresh shows "Status: Ready"
        |                |
T+260s  | Browser        | User clicks store URL
        |                | WordPress setup page opens! 🎉
```

---

## Workflow 3: Testing Each Component

### Test A: Backend Only

**Terminal Window:**
```bash
# Test health
curl http://localhost:3001/health

# Expected output:
{"status":"healthy","timestamp":"2024-...","uptime":123}
```

```bash
# Test create store
curl -X POST http://localhost:3001/api/stores ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"QuickTest\",\"engine\":\"woocommerce\"}"

# Expected output:
{
  "id": "abc123...",
  "name": "QuickTest",
  "engine": "woocommerce",
  "status": "provisioning",
  "createdAt": "2024-..."
}
```

```bash
# Test list stores
curl http://localhost:3001/api/stores

# Expected output:
[
  {
    "id": "abc123...",
    "name": "QuickTest",
    "status": "provisioning",
    ...
  }
]
```

**Backend Window Logs:**
```
POST /api/stores 201 - Store created: QuickTest
GET /api/stores 200 - Returned 1 store(s)
```

---

### Test B: Orchestrator Working

**Orchestrator Window Logs to Watch:**

```
[T+0s]  Reconciliation tick - checking for stores...
[T+0s]  Found 1 store(s) to process
[T+1s]  Processing store: QuickTest (status: provisioning)
[T+2s]  Creating namespace: store-quicktest-abc123
[T+3s]  Namespace created successfully
[T+4s]  Installing Helm chart for WooCommerce...
[T+5s]  Helm install command: helm install ...
[T+180s] Waiting for pods to be ready...
[T+240s] All pods ready!
[T+241s] Updating store status to 'ready'
[T+242s] Store QuickTest is now ready!
[T+242s] URL: http://quicktest.local.stores.dev
```

**Verify in Kubernetes:**
```bash
# Check namespace was created
kubectl get namespaces | findstr store-

# Expected output:
store-quicktest-abc123    Active   4m

# Check pods are running
kubectl get pods -n store-quicktest-abc123

# Expected output:
NAME                          READY   STATUS    RESTARTS   AGE
mysql-0                       1/1     Running   0          3m
wordpress-12345-abcde         1/1     Running   0          3m
```

---

### Test C: Frontend UI

**Browser Steps:**

1. **Open** http://localhost:5173
   - ✅ Page loads (no errors in console)
   - ✅ See header: "E-commerce Store Provisioning Platform"
   - ✅ See form with fields: Store Name, Engine, Create button

2. **Fill Form**
   - Store Name: "UITestShop"
   - Engine: Select "WooCommerce"
   - Click "Create Store"

3. **Watch Frontend**
   - ✅ Button shows "Creating..."
   - ✅ New row appears in table
   - ✅ Status shows "Provisioning" (yellow)
   - ✅ Page auto-refreshes every 5 seconds

4. **Wait 2-5 minutes**
   - ✅ Status changes to "Ready" (green)
   - ✅ URL appears: `http://uitestshop.local.stores.dev`
   - ✅ "Delete" button appears

5. **Click URL** (if you set up /etc/hosts)
   - ✅ WordPress setup page loads

6. **Click Delete**
   - ✅ Confirmation dialog appears
   - ✅ After confirm, row disappears

---

## Workflow 4: Troubleshooting by Component

### Problem: Backend won't start

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Fix:**
```bash
# Find what's using port 3001
netstat -ano | findstr :3001

# Output example:
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Try starting backend again
npm run dev
```

---

### Problem: "Cannot connect to database"

**Symptoms in backend logs:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Database connection failed
```

**Fix:**
```bash
# Check if PostgreSQL is running
docker ps | findstr postgres

# If not found, start it
docker run -d --name postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=store_platform ^
  -p 5432:5432 ^
  postgres:16

# Wait 10 seconds, then restart backend
timeout 10
cd backend
npm run dev
```

---

### Problem: Orchestrator can't connect to Kubernetes

**Symptoms in orchestrator logs:**
```
Error: Unable to connect to Kubernetes cluster
Kubernetes client initialization failed
```

**Fix:**
```bash
# Check Kubernetes is running
kubectl get nodes

# If error, check Docker Desktop
# Settings > Kubernetes > Enable Kubernetes

# Restart orchestrator
cd orchestrator
npm run dev
```

---

### Problem: Store stuck in "Provisioning"

**Check orchestrator logs for:**

```
Installing Helm chart...
Error: chart not found
```

**Or:**

```
Waiting for pods...
(stays here forever)
```

**Debug steps:**

```bash
# 1. Find the namespace
kubectl get namespaces | findstr store-

# 2. Check what's in the namespace
kubectl get all -n store-xxx-xxx

# 3. Check pod status
kubectl get pods -n store-xxx-xxx

# 4. If pod is not Running, describe it
kubectl describe pod <pod-name> -n store-xxx-xxx

# 5. Check events
kubectl get events -n store-xxx-xxx --sort-by='.lastTimestamp'
```

**Common issues:**

- **ImagePullBackOff:** Kubernetes can't download image
- **CrashLoopBackOff:** Container keeps crashing
- **Pending:** Not enough resources

**Manual cleanup:**
```bash
# Delete the stuck store
kubectl delete namespace store-xxx-xxx --force --grace-period=0

# Delete from database (in backend window)
# Stop backend (Ctrl+C)
# Start PostgreSQL shell:
docker exec -it postgres psql -U postgres -d store_platform

# In PostgreSQL:
DELETE FROM stores WHERE name = 'StoreName';
\q

# Restart backend
npm run dev
```

---

## Workflow 5: Complete Demo Sequence

### Pre-Demo Setup (5 minutes before)

```bash
# 1. Start Docker Desktop (if not running)

# 2. Check prerequisites
docker ps
kubectl get nodes

# 3. Start PostgreSQL (if needed)
docker ps | findstr postgres

# 4. Open 3 Command Prompt windows

# Window 1:
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev

# Window 2:
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev

# Window 3:
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev

# 5. Open browser to http://localhost:5173
```

---

### Demo Script (7 minutes)

**Minute 0-1: Introduction**
> "This is a Kubernetes-based platform that provisions WooCommerce stores on-demand."

**Minute 1-2: Show Architecture**
> "We have three components:"
- Show Backend window (API)
- Show Orchestrator window (Kubernetes controller)
- Show Frontend browser (UI)

**Minute 2-3: Create Store**
> "Let's create a store called 'DemoStore'"
- Fill form in browser
- Click Create
- Show backend log: "Store created"
- Show orchestrator log: "Found store to provision"

**Minute 3-4: Show Kubernetes**
> "The orchestrator is now creating Kubernetes resources"

```bash
# Open 4th window
kubectl get namespaces | findstr store-
kubectl get pods -n store-demostore-xxx
```

> "Each store gets its own isolated namespace with WordPress and MySQL"

**Minute 4-6: Wait for Ready**
> "This typically takes 2-5 minutes. Let me speed this up..."

- Show orchestrator logs scrolling
- Show frontend auto-refreshing
- Point out status changing

**Minute 6-7: Show Result**
> "Store is now ready!"

- Show "Ready" status in browser
- Show store URL
- Show Kubernetes pods running

```bash
kubectl get pods -n store-demostore-xxx
```

> "Now the user can access their store and set up WooCommerce"

**Minute 7: Cleanup**
> "When done, users can delete stores with one click"

- Click Delete in browser
- Show orchestrator: "Cleaning up store"
- Show namespace disappearing

```bash
kubectl get namespaces | findstr store-
```

---

## Quick Reference: All Commands in Order

```bash
# 1. Prerequisites
docker ps
kubectl get nodes
docker ps | findstr postgres

# 2. Start services (3 windows)
cd backend && npm run dev
cd orchestrator && npm run dev
cd frontend && npm run dev

# 3. Test backend
curl http://localhost:3001/health
curl http://localhost:3001/api/stores

# 4. Open browser
start http://localhost:5173

# 5. Create store in UI
# (manual: fill form, click create)

# 6. Monitor Kubernetes
kubectl get namespaces | findstr store-
kubectl get pods --all-namespaces | findstr store-

# 7. Watch orchestrator
# (logs in orchestrator window)

# 8. Verify store ready
kubectl get pods -n store-xxx-xxx
kubectl get ingress -n store-xxx-xxx

# 9. Delete store in UI
# (manual: click delete button)

# 10. Verify cleanup
kubectl get namespaces | findstr store-
```

---

## Success Checklist

### System Started ✅
- [ ] Docker Desktop running
- [ ] Kubernetes nodes ready (`kubectl get nodes`)
- [ ] PostgreSQL container running
- [ ] Backend showing "Platform API started"
- [ ] Orchestrator showing "Reconciliation loop running"
- [ ] Frontend showing "Local: http://localhost:5173"
- [ ] Browser can access http://localhost:5173

### Store Created ✅
- [ ] Form submission successful
- [ ] Backend logged "Store created"
- [ ] Orchestrator logged "Found store to provision"
- [ ] Kubernetes namespace created
- [ ] Pods are running
- [ ] Status changed to "Ready" in UI
- [ ] Store URL is accessible

### Store Deleted ✅
- [ ] Delete button clicked
- [ ] Backend logged "Store deleted"
- [ ] Orchestrator logged "Cleaning up"
- [ ] Namespace no longer exists
- [ ] Store removed from UI list

---

**🎉 You're now ready to test and demo the complete system!**

**Next Steps:**
1. Print this guide
2. Follow "Workflow 5: Complete Demo Sequence"
3. Use troubleshooting section if issues arise
4. Keep terminal windows arranged side-by-side to see logs

**Estimated total testing time:** 15-20 minutes
**Estimated demo time:** 7-10 minutes
