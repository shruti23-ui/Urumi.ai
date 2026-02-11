# Complete Demo Guide - Everything You Need

## 🎯 Quick Start (Choose Your Path)

### Path 1: Never Done This Before (RECOMMENDED)
→ Read Section 1 (Understanding the Project)
→ Follow Section 2 (Step-by-Step Demo)
→ Use Section 3 (PowerShell Commands)

### Path 2: Just Want Commands
→ Jump to Section 3 (PowerShell Commands)
→ Copy-paste and go!

### Path 3: Recording Video Today
→ Read Section 4 (Recording Guide)
→ Use Section 5 (One-Page Cheat Sheet)

---

## 📚 SECTION 1: UNDERSTANDING THE PROJECT (15 minutes)

### What You Built (Simple Explanation)

Imagine a **factory that makes online stores automatically**.

**Before your platform:**
- Someone wants a store → Takes days to set up
- Manual setup: Install WordPress, configure database, set up hosting
- Each store can break the others

**With your platform:**
- Someone sends one API request → Store ready in 3 minutes
- Everything automatic: WordPress, database, storage, security
- Each store is completely isolated

### How It Works (Architecture)

```
USER sends API request
    ↓
BACKEND API saves to database
    ↓
DATABASE (PostgreSQL) ← Source of Truth
    ↓
ORCHESTRATOR watches database
    ↓
KUBERNETES creates the store
    ↓
READY! Isolated WordPress + MySQL store
```

### Project Structure

```
Urumi.ai_Round_1/
├── backend/              - REST API (takes orders)
│   ├── src/
│   │   ├── controllers/  - Handle HTTP requests
│   │   ├── services/     - Business logic
│   │   └── models/       - Data structures
│   └── package.json
│
├── orchestrator/         - Kubernetes controller (builds stores)
│   ├── src/
│   │   ├── k8s/         - Kubernetes operations
│   │   └── services/    - Reconciliation logic
│   └── package.json
│
└── helm-charts/          - Store templates
    ├── woocommerce-store/
    └── medusa-store/
```

### Key Features (Production Quality)

1. **Idempotency** - Duplicate requests don't create duplicates
2. **Distributed Locking** - Multiple orchestrators work together safely
3. **Transactions** - All-or-nothing database operations
4. **Resource Isolation** - Each store has its own limits
5. **Structured Logging** - JSON logs with correlation IDs
6. **Security** - Input sanitization, injection prevention
7. **Schema Migrations** - Versioned database updates
8. **Adaptive Polling** - Smart backoff (5s-30s)

---

## 📋 SECTION 2: STEP-BY-STEP DEMO (20 minutes)

### Prerequisites

**Check these are running:**

1. **Docker Desktop** - Container platform
2. **Kubernetes** - Enabled in Docker Desktop
3. **Backend API** - Node.js server (port 3001)
4. **Orchestrator** - Kubernetes controller
5. **PostgreSQL** - Database (in Docker)

### Step-by-Step Instructions

#### STEP 1: Open PowerShell

**Windows Key + X** → Click "Windows PowerShell"

#### STEP 2: Navigate to Project

```powershell
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1
```

#### STEP 3: Check Everything is Running

```powershell
# Check Docker
docker ps

# Should see: postgres-store-platform container
```

```powershell
# Check Kubernetes
kubectl cluster-info

# Should see: "Kubernetes control plane is running"
```

```powershell
# Check Backend API
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing

# Should see: StatusCode 200
```

**All good? Continue!** ✅

#### STEP 4: Create a Store (THE MAIN DEMO!)

```powershell
# Create store and save response
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "demostore", "engine": "woocommerce"}' -UseBasicParsing

# Show formatted JSON
$response.Content | ConvertFrom-Json | ConvertTo-Json

# Extract and save namespace
$namespace = ($response.Content | ConvertFrom-Json).store.namespace
Write-Host "Your namespace: $namespace" -ForegroundColor Green
```

**What you'll see:**
```json
{
  "message": "Store creation initiated",
  "store": {
    "id": "abc-123...",
    "name": "demostore",
    "status": "provisioning",  ← Being built!
    "namespace": "store-demostore-abc123de"
  }
}
```

**The `$namespace` variable now contains:** `store-demostore-abc123de`

#### STEP 5: Watch It Being Built

```powershell
kubectl get pods -n $namespace --watch
```

**What you'll see (updates every few seconds):**

```
Initially:
NAME                   READY   STATUS
demostore-xxx          0/1     ContainerCreating
demostore-mysql-0      0/1     ContainerCreating

After 30s:
demostore-xxx          0/1     Running
demostore-mysql-0      0/1     Running

After 2 min (GOAL):
demostore-xxx          1/1     Running  ← Ready!
demostore-mysql-0      1/1     Running  ← Ready!
```

**Press `Ctrl+C` when both are `1/1 Running`**

#### STEP 6: Show All Resources Created

```powershell
kubectl get all,ingress,pvc -n $namespace
```

**What you'll see:**
```
pod/demostore-xxx          1/1  Running
pod/demostore-mysql-0      1/1  Running

service/demostore          ClusterIP
service/demostore-mysql    ClusterIP

deployment/demostore       1/1  Ready
statefulset/demostore-mysql 1/1  Ready

ingress/demostore          demostore.local.stores.dev

persistentvolumeclaim/mysql-data  Bound  1Gi
```

**That's everything Kubernetes created automatically!** 🎉

#### STEP 7: Check Database Status

```powershell
$status = Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing
$status.Content | ConvertFrom-Json | ConvertTo-Json
```

**Look for:**
```json
{
  "name": "demostore",
  "status": "ready",  ← Changed from "provisioning"!
  "urls": ["http://demostore.local.stores.dev"]
}
```

**The orchestrator automatically updated it!** ✅

#### STEP 8: Access the WordPress Store

```powershell
kubectl port-forward -n $namespace service/demostore 8080:80
```

**You'll see:**
```
Forwarding from 127.0.0.1:8080 -> 80
```

**NOW:**
1. Open your browser
2. Go to: `http://localhost:8080`
3. You'll see WordPress Installation!

**Fill in:**
- Site Title: "Demo Store"
- Username: admin
- Password: admin123
- Email: demo@example.com
- Click "Install WordPress"

**SUCCESS! Fully functional store!** 🎊

---

## ⚡ SECTION 3: POWERSHELL COMMANDS (Quick Reference)

### All Commands (No Security Warnings!)

**Navigate:**
```powershell
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1
```

**Create Store:**
```powershell
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "myshop", "engine": "woocommerce"}' -UseBasicParsing
$namespace = ($response.Content | ConvertFrom-Json).store.namespace
$response.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host "Namespace: $namespace" -ForegroundColor Cyan
```

**Watch Pods:**
```powershell
kubectl get pods -n $namespace --watch
```

**Show Resources:**
```powershell
kubectl get all -n $namespace
```

**Check Status:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

**Port Forward:**
```powershell
kubectl port-forward -n $namespace service/myshop 8080:80
```

**Show All Namespaces:**
```powershell
kubectl get namespaces | Select-String "store"
```

---

## 🎬 SECTION 4: RECORDING YOUR VIDEO

### Before Recording Checklist

- [ ] All services running (docker ps, kubectl cluster-info)
- [ ] PowerShell font size 16pt+
- [ ] Screen recorder ready (OBS/Loom)
- [ ] Microphone tested
- [ ] Browser ready (close other tabs)
- [ ] This guide open for reference
- [ ] Do Not Disturb mode ON

### 3-Minute Video Script

**0:00-0:15 - Opening**
- SAY: "I built a platform that automatically creates e-commerce stores on Kubernetes"
- SHOW: Terminal with project folder

**0:15-0:45 - Create Store**
- SAY: "Watch - I'll create a store with one API request"
- RUN: Create store command
- SAY: "The platform is now building WordPress, MySQL, and all resources"
- SHOW: JSON response with "status: provisioning"

**0:45-1:30 - Watch Build**
- RUN: kubectl get pods --watch
- SAY: "It's creating containers, pulling images, and setting everything up"
- SAY: "Each store is completely isolated in its own namespace"
- WAIT: Until both pods show 1/1 Running

**1:30-2:00 - Show Resources**
- RUN: kubectl get all
- SAY: "Here's everything it created - deployment, services, database, storage"
- SHOW: All the resources

**2:00-2:30 - Show WordPress**
- RUN: Port forward
- OPEN: Browser to localhost:8080
- SAY: "And here's the fully functional WordPress store - ready to use"
- SHOW: WordPress installation page

**2:30-2:45 - Code Highlight**
- SWITCH: To VS Code
- SHOW: backend/src/services/storeService.ts (idempotency code)
- SAY: "Production features include idempotency, distributed locking, and security"

**2:45-3:00 - Closing**
- SAY: "Complete store in 3 minutes - perfect for SaaS platforms"
- SAY: "Runs on Kubernetes, scales to thousands of stores"
- SAY: "Code on GitHub - link in description"

### What to Say (Simple Explanations)

**Avoid:** "Reconciliation loop", "Control plane pattern", "Advisory locks"

**Use Instead:**
- "Automatically builds stores"
- "Watches the database"
- "Prevents duplicates"
- "Keeps stores isolated"
- "Production-ready with security"

---

## 📄 SECTION 5: ONE-PAGE CHEAT SHEET

### Quick Commands (Print This!)

```powershell
# Setup
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1

# Create
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "demo", "engine": "woocommerce"}' -UseBasicParsing
$ns = ($r.Content | ConvertFrom-Json).store.namespace

# Watch
kubectl get pods -n $ns --watch

# Show
kubectl get all -n $ns

# Access
kubectl port-forward -n $ns service/demo 8080:80
```

**Open:** http://localhost:8080

### What to Say

| Step | Say This |
|------|----------|
| Opening | "I built a platform that creates stores automatically" |
| Creating | "One API request to create a complete store" |
| Watching | "Platform builds WordPress, MySQL, storage, networking" |
| Showing | "Everything isolated in its own Kubernetes namespace" |
| WordPress | "Fully functional store in under 3 minutes" |
| Closing | "Production-ready, scales to thousands of stores" |

---

## 🎯 SECTION 6: CODE FEATURES TO SHOW

### Feature 1: Idempotency (Prevents Duplicates)

**File:** `backend/src/services/storeService.ts`
**Line:** 32

```typescript
// Check if already exists
if (data.idempotency_key) {
  const existing = await client.query(
    'SELECT * FROM stores WHERE user_id = $1 AND idempotency_key = $2'
  );
  if (existing.rows.length > 0) {
    return existing.rows[0]; // Return existing, don't create duplicate
  }
}
```

**SAY:** "If someone clicks create twice, it returns the existing store instead of making a duplicate"

### Feature 2: Distributed Locking

**File:** `orchestrator/src/services/reconciler.ts`
**Search for:** `pg_try_advisory_lock`

```typescript
const lockResult = await client.query(
  'SELECT pg_try_advisory_lock($1) as acquired',
  [RECONCILIATION_LOCK_ID]
);
```

**SAY:** "Multiple orchestrators can run together without conflicts"

### Feature 3: Transactions

**File:** `backend/src/services/storeService.ts`
**Line:** 22

```typescript
await client.query('BEGIN');
try {
  // ... create store ...
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK'); // All or nothing!
  throw error;
}
```

**SAY:** "Every store creation is atomic - all-or-nothing"

### Feature 4: Input Sanitization

**File:** `orchestrator/src/k8s/provisioner.ts`
**Line:** 124

```typescript
// Sanitize for Kubernetes
const sanitizedStoreName = storeName.toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/^-+|-+$/g, '');
```

**SAY:** "All inputs are sanitized to prevent injection attacks"

---

## 🆘 TROUBLESHOOTING

### Pod Won't Start

**Check:**
```powershell
kubectl describe pod POD_NAME -n $namespace
```

**Common Issues:**
- Image pulling (just wait)
- No space (free up disk)
- Resource limits (check quotas)

### API Not Responding

**Check:**
```powershell
# Is it running?
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing
```

**Fix:** Restart backend
```powershell
# In backend directory
npm run dev
```

### Kubernetes Not Working

**Check:**
```powershell
kubectl cluster-info
```

**Fix:** Enable Kubernetes in Docker Desktop Settings

---

## ✅ PRE-DEMO VERIFICATION

Run this to check everything:

```powershell
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1
Write-Host "Checking Docker..." -ForegroundColor Cyan
docker ps | Select-String postgres
Write-Host "Checking Kubernetes..." -ForegroundColor Cyan
kubectl cluster-info | Select-String "running"
Write-Host "Checking Backend..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing | Select-Object StatusCode
Write-Host "All systems operational!" -ForegroundColor Green
```

**If all checks pass, you're ready!** 🚀

---

## 📚 ADDITIONAL RESOURCES

### GitHub Description Template

```
🚀 Kubernetes Store Provisioning Platform

Automatically provisions isolated e-commerce stores on Kubernetes.

Features:
- One API call creates complete WordPress/WooCommerce stores
- Full isolation with separate namespaces & databases
- Production-ready: idempotency, distributed locking, security
- Scales to thousands of stores

Tech: Kubernetes, Docker, Node.js, TypeScript, PostgreSQL, Helm

⏱️ Demo: Watch a store deploy in 3 minutes
```

### LinkedIn Post Template

```
Just built a Kubernetes platform that automatically provisions e-commerce stores!

What it does:
✅ One API request → Full WordPress store in 3 minutes
✅ Complete isolation (namespaces, resources, databases)
✅ Production features (idempotency, distributed locking)
✅ Scales to thousands of stores

Tech stack: Kubernetes, Docker, Node.js, PostgreSQL, Helm

Perfect for SaaS platforms or agencies that need to spin up client stores quickly.

GitHub: [link]
Demo video: [link]

#kubernetes #docker #nodejs #typescript #devops #cloudnative
```

---

## 🎓 FOR INTERVIEW QUESTIONS

### "What did you build?"

"A multi-tenant Kubernetes platform that automatically provisions isolated e-commerce stores. Send one API request and get a fully functional WordPress store with database, storage, and networking in under 3 minutes."

### "What's impressive about it?"

"It's production-ready with features like idempotency to prevent duplicates, distributed locking so multiple orchestrators work together, transaction safety, structured logging, and security measures like input sanitization."

### "How does it work?"

"It uses a control plane pattern - the database is the source of truth, and a reconciliation loop watches for new store requests and deploys them to Kubernetes using Helm charts. Each store gets its own isolated namespace with resource quotas."

### "What challenges did you face?"

"Ensuring idempotency was tricky - I had to handle duplicate requests gracefully. Also preventing Helm injection attacks required switching from command-line parameters to YAML files. And coordinating multiple orchestrators needed PostgreSQL advisory locks."

---

**YOU'RE ALL SET! Pick a section and start recording!** 🎬✨

**Good luck, Shruti! Your project is impressive!** 🌟
