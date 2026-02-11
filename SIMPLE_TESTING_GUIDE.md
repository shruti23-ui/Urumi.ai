# Simple Testing Guide - For Beginners

This guide will help you test every part of your system step by step. No coding knowledge required!

---

## ⚠️ IMPORTANT: PowerShell vs Command Prompt

**You have TWO options for running commands:**

### Option A: Command Prompt (Recommended - Easier)
- Press `Windows Key + R`
- Type `cmd`
- Press Enter
- Commands work as shown in this guide

### Option B: PowerShell (What you're using now)
- Blue terminal window
- Some commands are DIFFERENT
- Look for **"PowerShell version"** in this guide

**💡 TIP: If you see errors like "Cannot bind parameter", you're in PowerShell!**

---

## What This System Does

Your system has 3 main parts:
1. **Frontend** - The website users see (runs on http://localhost:5173)
2. **Backend** - Handles requests from website (runs on http://localhost:3001)
3. **Orchestrator** - Creates stores in Kubernetes (runs on http://localhost:3002)

---

## Before You Start

### Step 0: Check if Docker & Kubernetes are Running

**Command Prompt version:**
```bash
docker ps
```

**PowerShell version:**
```powershell
docker ps
```
(Same command works in both!)

**Expected Result:** Should show a table with columns like CONTAINER ID, IMAGE, etc.

**If it fails:** Open Docker Desktop application and wait for it to start.

---

## Part 1: Test Database (PostgreSQL)

### What it does: Stores all your data

### Test Command:

**Command Prompt version:**
```bash
docker ps | findstr postgres
```

**PowerShell version:**
```powershell
docker ps | Select-String postgres
```

**Expected Result:** Should show a line with "postgres" in it

**What this means:** Your database is running ✅

### Troubleshoot if not working:

**Command Prompt version:**
```bash
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=store_platform -p 5432:5432 postgres:16
```

**PowerShell version:**
```powershell
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=store_platform -p 5432:5432 postgres:16
```
(Same command works in both!)

---

## Part 2: Test Backend API

### What it does: Handles creating, listing, and deleting stores

### Step 1: Start Backend

Open a new Command Prompt window:

```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev
```

**Expected Result:** You should see:
```
Platform API started on port 3001
Database connection successful
```

**Keep this window open!**

### Step 2: Test Backend Health

Open another window (Command Prompt or PowerShell):

**Command Prompt version:**
```bash
curl http://localhost:3001/health
```

**PowerShell version:**
```powershell
curl.exe http://localhost:3001/health
```
(Note: Use `curl.exe` in PowerShell!)

**Expected Result:**
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 10
}
```

**What this means:** Backend is working ✅

### Step 3: Test Creating a Store (Backend Only)

**Command Prompt version:**
```bash
curl -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d "{\"name\":\"TestStore\",\"engine\":\"woocommerce\"}"
```

**PowerShell version:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"TestStore","engine":"woocommerce"}'
```

**OR PowerShell with curl.exe:**
```powershell
curl.exe -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d '{\"name\":\"TestStore\",\"engine\":\"woocommerce\"}'
```

**Expected Result:**
```json
{
  "id": "abc123...",
  "name": "TestStore",
  "engine": "woocommerce",
  "status": "provisioning"
}
```

**What this means:** Backend can create store records ✅

### Step 4: Test Listing Stores

**Command Prompt version:**
```bash
curl http://localhost:3001/api/stores
```

**PowerShell version:**
```powershell
curl.exe http://localhost:3001/api/stores
```

**OR PowerShell with Invoke-RestMethod:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stores"
```

**Expected Result:** Should show array of stores including "TestStore"

**What this means:** Backend can list stores ✅

---

## Part 3: Test Orchestrator

### What it does: Actually creates the Kubernetes resources for stores

### Step 1: Start Orchestrator

Open a new Command Prompt window:

```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev
```

**Expected Result:** You should see:
```
Store Platform Orchestrator starting...
Database connection successful
Starting reconciliation loop...
Reconciling store: TestStore...
Creating namespace and resources...
```

**Keep this window open!**

### Step 2: Watch the Orchestrator Work

Just watch the orchestrator window. You should see logs like:

```
Reconciling store: TestStore (status: provisioning)
Creating namespace: store-teststore-abc123
Installing Helm chart for WooCommerce...
Store TestStore is now ready!
```

**What this means:** Orchestrator is working ✅

### Step 3: Verify in Kubernetes

Open another window:

**Command Prompt version:**
```bash
kubectl get namespaces | findstr store-
```

**PowerShell version:**
```powershell
kubectl get namespaces | Select-String store-
```

**Expected Result:** Should show namespace like `store-teststore-abc123`

**What this means:** Kubernetes resources were created ✅

### Step 4: Check if Store Pods are Running

**Both Command Prompt and PowerShell:**
```bash
kubectl get pods -n store-teststore-abc123
```
(Replace `store-teststore-abc123` with actual namespace from previous step)

**Expected Result:** Should show pods with STATUS "Running"

**What this means:** Your store is actually running ✅

---

## Part 4: Test Frontend (Website)

### What it does: Provides the visual interface for users

### Step 1: Start Frontend

Open a new Command Prompt window:

```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev
```

**Expected Result:** You should see:
```
Local: http://localhost:5173/
```

**Keep this window open!**

### Step 2: Open in Browser

1. Open your web browser (Chrome, Firefox, Edge)
2. Go to: http://localhost:5173

**Expected Result:** You should see a webpage with title "E-commerce Store Provisioning Platform"

**What this means:** Frontend is working ✅

### Step 3: Test Creating Store from UI

1. In the website, fill in:
   - **Store Name:** MyTestStore
   - **Engine:** WooCommerce
2. Click "Create Store" button

**Expected Result:**
- Status should show "Provisioning"
- After 2-5 minutes, status changes to "Ready"
- You'll see a URL like `http://myteststore.local.stores.dev`

**What this means:** Full system working end-to-end ✅

---

## Part 5: Complete Workflow Test

### Test the Full User Journey

#### Step 1: Create a Store

In browser at http://localhost:5173:
- Enter Store Name: "DemoShop"
- Select Engine: "WooCommerce"
- Click "Create Store"
- Wait for status to become "Ready" (2-5 minutes)

#### Step 2: Watch Each Component

**Backend Window:** Should log:
```
POST /api/stores - Store created: DemoShop
```

**Orchestrator Window:** Should log:
```
Reconciling store: DemoShop
Creating namespace: store-demoshop-xyz789
Installing Helm chart...
Store DemoShop is now ready!
```

**Frontend Browser:** Should update status from "Provisioning" → "Ready"

#### Step 3: Verify Store is Actually Running

**Both Command Prompt and PowerShell:**
```bash
kubectl get pods -n store-demoshop-xyz789
```

**Expected Result:** All pods should be "Running"

#### Step 4: Check Store URL Works

**Both Command Prompt and PowerShell:**
```bash
kubectl get ingress -n store-demoshop-xyz789
```

**Expected Result:** Should show an ingress with HOST like `demoshop.local.stores.dev`

#### Step 5: Delete the Store

In browser:
- Click "Delete" button next to DemoShop
- Confirm deletion

**Backend Window:** Should log:
```
DELETE /api/stores/... - Store deleted
```

**Orchestrator Window:** Should log:
```
Cleaning up store: DemoShop
Deleting namespace: store-demoshop-xyz789
Store DemoShop cleanup complete
```

**Frontend Browser:** Store should disappear from list

#### Step 6: Verify Cleanup

**Command Prompt version:**
```bash
kubectl get namespaces | findstr store-demoshop
```

**PowerShell version:**
```powershell
kubectl get namespaces | Select-String store-demoshop
```

**Expected Result:** Should return nothing (namespace deleted)

---

## Quick Health Check Commands

Run these anytime to check if everything is working:

### Check Database
**Command Prompt:**
```bash
docker ps | findstr postgres
```
**PowerShell:**
```powershell
docker ps | Select-String postgres
```

### Check Backend
**Command Prompt:**
```bash
curl http://localhost:3001/health
```
**PowerShell:**
```powershell
curl.exe http://localhost:3001/health
```

### Check Orchestrator
**Command Prompt:**
```bash
curl http://localhost:3002/health
```
**PowerShell:**
```powershell
curl.exe http://localhost:3002/health
```

### Check Frontend
**Command Prompt:**
```bash
curl http://localhost:5173
```
**PowerShell:**
```powershell
curl.exe http://localhost:5173
```

### Check Kubernetes
**Both Command Prompt and PowerShell:**
```bash
kubectl get nodes
```

### Check All Store Namespaces
**Command Prompt:**
```bash
kubectl get namespaces | findstr store-
```
**PowerShell:**
```powershell
kubectl get namespaces | Select-String store-
```

### Check All Pods in a Store
**Both Command Prompt and PowerShell:**
```bash
kubectl get pods -n <namespace-name>
```

---

## Common Issues and Fixes

### Issue: "Port already in use"

**Command Prompt version:**
```bash
# Backend port 3001
netstat -ano | findstr :3001
taskkill /PID <number> /F

# Orchestrator port 3002
netstat -ano | findstr :3002
taskkill /PID <number> /F

# Frontend port 5173
netstat -ano | findstr :5173
taskkill /PID <number> /F
```

**PowerShell version:**
```powershell
# Backend port 3001
netstat -ano | Select-String :3001
Stop-Process -Id <number> -Force

# Orchestrator port 3002
netstat -ano | Select-String :3002
Stop-Process -Id <number> -Force

# Frontend port 5173
netstat -ano | Select-String :5173
Stop-Process -Id <number> -Force
```

### Issue: "Cannot connect to database"

**Both Command Prompt and PowerShell:**
```bash
docker restart postgres
```

### Issue: "Kubernetes not available"

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Click "Reset Kubernetes Cluster"
4. Wait 2-3 minutes
5. Verify: `kubectl get nodes` (works in both)

### Issue: "Store stuck in Provisioning"

Check orchestrator logs in the orchestrator window for errors.

Or check Kubernetes (works in both):
```bash
kubectl get events -n <store-namespace> --sort-by='.lastTimestamp'
```

---

## Testing Checklist

Use this checklist to verify everything works:

### Infrastructure
- [ ] Docker is running (`docker ps` works)
- [ ] Kubernetes is running (`kubectl get nodes` works)
- [ ] PostgreSQL is running (`docker ps | findstr postgres`)

### Backend
- [ ] Backend started (`npm run dev` in backend folder)
- [ ] Health check works (`curl.exe` in PowerShell or `curl` in Command Prompt)
- [ ] Can create store via API (use `Invoke-RestMethod` in PowerShell)
- [ ] Can list stores via API (`curl.exe` in PowerShell or `curl` in Command Prompt)

### Orchestrator
- [ ] Orchestrator started (`npm run dev` in orchestrator folder)
- [ ] Logs show "reconciliation loop starting"
- [ ] Creates Kubernetes namespaces
- [ ] Installs Helm charts successfully

### Frontend
- [ ] Frontend started (`npm run dev` in frontend folder)
- [ ] Browser loads http://localhost:5173
- [ ] Can see "Create Store" form
- [ ] Can create store from UI
- [ ] Status updates in real-time

### End-to-End
- [ ] Create store from UI
- [ ] Watch status change from Provisioning → Ready
- [ ] Verify namespace created (`kubectl get ns`)
- [ ] Verify pods running (`kubectl get pods -n <namespace>`)
- [ ] Delete store from UI
- [ ] Verify namespace deleted

---

## Performance Metrics

### Typical Timings:
- **Backend startup:** 3-5 seconds
- **Orchestrator startup:** 3-5 seconds
- **Frontend startup:** 5-10 seconds
- **Store provisioning:** 2-5 minutes
- **Store deletion:** 30-60 seconds

### Resource Usage:
- **Backend:** ~100MB RAM
- **Orchestrator:** ~150MB RAM
- **Frontend:** ~50MB RAM
- **Each Store:** ~500MB RAM (WordPress + MySQL)

---

## Demo Script

**For showing to others:**

1. **Start everything:** Backend → Orchestrator → Frontend (3 separate windows)

2. **Open browser:** http://localhost:5173

3. **Say:** "This platform allows you to create WooCommerce stores on-demand"

4. **Create store:**
   - Name: "ProductionDemo"
   - Engine: WooCommerce
   - Click Create

5. **Show backend logs:** "Backend received request"

6. **Show orchestrator logs:** "Creating Kubernetes resources"

7. **Show Kubernetes:**

   **Command Prompt:**
   ```bash
   kubectl get namespaces | findstr store-
   kubectl get pods -n <namespace>
   ```

   **PowerShell:**
   ```powershell
   kubectl get namespaces | Select-String store-
   kubectl get pods -n <namespace>
   ```

8. **Wait for Ready status** (refresh browser)

9. **Show final state:** "Store is running with its own database and resources"

10. **Delete store:** Show cleanup in orchestrator logs

11. **Verify deletion:**

    **Command Prompt:**
    ```bash
    kubectl get namespaces | findstr store-
    ```

    **PowerShell:**
    ```powershell
    kubectl get namespaces | Select-String store-
    ```

**Total demo time:** 5-7 minutes

---

## Summary

You now know how to:
✅ Start all components
✅ Test each part individually
✅ Test the complete workflow
✅ Verify everything in Kubernetes
✅ Troubleshoot common issues
✅ Run a live demo

**Remember:** Keep 3 terminal windows open (Command Prompt OR PowerShell):
1. Backend (`backend` folder)
2. Orchestrator (`orchestrator` folder)
3. Frontend (`frontend` folder)

And watch the logs to see everything working!

---

## 📝 Quick Command Reference

### PowerShell Users - Remember These Differences:

| Task | Command Prompt | PowerShell |
|------|----------------|------------|
| Filter output | `\| findstr text` | `\| Select-String text` |
| Use curl | `curl <url>` | `curl.exe <url>` |
| POST request | `curl -X POST ...` | `Invoke-RestMethod -Method POST ...` |
| Kill process | `taskkill /PID <num> /F` | `Stop-Process -Id <num> -Force` |
| Most other commands | Same | Same |

**💡 TIP:** For simplicity, use Command Prompt (`cmd`) instead of PowerShell for testing!
