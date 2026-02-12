# 🎬 **5-Minute Demo Video Script - Complete Beginner's Guide**

---

## **📋 Pre-Demo Preparation Checklist**

### **What to Have Ready:**

**Local Setup:**
- ✅ Docker Desktop running
- ✅ All services started (backend, orchestrator, frontend)
- ✅ Browser with tabs ready: http://localhost:5173
- ✅ 1-2 test stores already created (to save time)

**AWS Setup:**
- ✅ AWS dashboard: http://13.51.146.246:31107
- ✅ "Clothing Store" ready with products
- ✅ Store URL: http://13.51.146.246:32353

**Tools:**
- ✅ VS Code with project open
- ✅ Terminal/PowerShell windows ready
- ✅ Browser tabs organized
- ✅ Screen recording software (OBS Studio, Loom, or Windows Game Bar)

---

## **🎥 5-Minute Video Script**

### **Recording Setup:**
- **Resolution:** 1080p (1920x1080)
- **Audio:** Clear microphone, quiet room
- **Practice:** Read through script 2-3 times before recording
- **Pace:** Speak clearly but confidently, don't rush

---

## **📝 DETAILED SCRIPT WITH TIMESTAMPS**

---

### **[00:00 - 00:30] INTRODUCTION (30 seconds)**

**What to Show:** Dashboard on screen (AWS or local)

**Script:**
```
"Hi, I'm [Your Name]. I've built a multi-tenant Kubernetes platform that
automatically provisions WooCommerce stores. In this demo, I'll show you
the complete system architecture, how it handles isolation and security,
scaling strategies, and abuse prevention mechanisms. Let's dive in."
```

**Actions:**
- Show AWS dashboard: http://13.51.146.246:31107
- Briefly pan across existing stores

---

### **[00:30 - 01:30] SYSTEM DESIGN & COMPONENTS (60 seconds)**

**What to Show:** Architecture diagram or VS Code with code structure

**Script:**
```
"The platform has four main components:

1. React Dashboard - where users create and manage stores
2. Node.js Backend API - handles requests, validates input, and stores
   metadata in PostgreSQL
3. Orchestrator - continuously polls the database for new stores and
   provisions them using Helm charts on Kubernetes
4. PostgreSQL Database - stores all store metadata, events, and audit logs

The flow is simple: User clicks 'Create Store' → API validates and saves
to database → Orchestrator detects new store → Provisions Kubernetes
resources via Helm → Updates status to 'Ready'.

Each store gets its own Kubernetes namespace with WordPress, WooCommerce,
and MySQL - completely isolated from other stores."
```

**Actions:**
- Show VS Code file structure (5 seconds):
  ```
  C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\
  ├── backend/
  ├── frontend/
  ├── orchestrator/
  └── orchestrator/helm-charts/
  ```
- Open `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\` (5 seconds)
  - Show `Chart.yaml` - Helm chart definition
  - Show `values.yaml` - Configuration values
  - Show `templates/` folder - Kubernetes manifests
- Show diagram or draw quick architecture:
  ```
  [Dashboard] → [API] → [Database] ← [Orchestrator] → [Kubernetes]
                                                              ↓
                                                        [Store Namespaces]
  ```

---

### **[01:30 - 02:45] END-TO-END FLOW DEMO (75 seconds)**

**What to Show:** AWS Dashboard + Store Creation

**Script:**
```
"Let me demonstrate the complete workflow. I'm on the AWS deployment
running on EC2 with k3s. I'll create a new store called 'Demo Store'."

[Click Create Store, enter name, click button]

"The platform is now provisioning the store. Let me show what's happening
behind the scenes..."

[Switch to terminal/kubectl]

"A new namespace was created with resource quotas - maximum 2 CPU cores
and 4GB RAM per store to prevent resource exhaustion. The orchestrator is
now deploying WordPress, MySQL, and configuring networking."

[Switch back to dashboard, click Refresh]

"The store is now READY. Here's the URL. Let me access it as a customer."

[Open store URL, add product to cart, checkout]

"I'm adding a product, checking out with Cash on Delivery, and placing
the order."

[Show order confirmation]

"Order placed successfully. Let me verify it in the admin panel."

[Show WooCommerce admin with order]

"Perfect! The order is recorded. Now let's test cleanup."

[Click Delete Store in dashboard]

"When I delete a store, Helm uninstalls the release and deletes the
namespace, which cascades to remove all resources - deployments, services,
PVCs, secrets. Everything is cleaned up automatically."
```

**Actions:**
1. Dashboard: http://13.51.146.246:31107
2. Create store: "DemoStore"
3. Terminal: `kubectl get ns | grep store-demo` (5 sec)
4. Terminal: `kubectl describe quota -n store-demostore-xxx` (5 sec)
5. Dashboard: Click Refresh → Show READY
6. Open store: http://13.51.146.246:XXXXX
7. Quick add to cart → checkout (15 sec)
8. Show admin order (5 sec)
9. Delete store from dashboard (5 sec)

---

### **[02:45 - 03:30] ISOLATION, SECURITY & RELIABILITY (45 seconds)**

**What to Show:** Terminal with kubectl commands

**Script:**
```
"Let me explain the security and isolation model.

[Show namespace list]

Each store runs in its own Kubernetes namespace. This provides network
isolation, resource quotas, and separate RBAC policies.

[Show secrets]

Secrets are auto-generated per store - each MySQL instance has unique
credentials stored in Kubernetes Secrets, never hardcoded.

[Show RBAC]

The orchestrator uses RBAC with least privilege - it can only create
resources in store namespaces, not the platform namespace.

[Show code - idempotency]

The system is idempotent - if provisioning fails midway, the orchestrator
can retry safely using correlation IDs. All events are logged for auditing."
```

**Actions:**
```bash
# Terminal commands (show quickly):
kubectl get ns | grep store-                     # (3 sec)
kubectl get secrets -n store-clothing-store-xxx  # (3 sec)
kubectl get clusterrole orchestrator-role -o yaml | head -20  # (5 sec)
```
- Show VS Code: `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\services\reconciler.ts` - idempotency logic (5 sec)
  - **Line 15-30:** Shows correlation ID tracking
  - **Line 45-60:** Shows retry logic with exponential backoff
- Show VS Code: `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\models\storeEvent.ts` - audit trail (3 sec)
  - Shows event logging structure

---

### **[03:30 - 04:00] HORIZONTAL SCALING (30 seconds)**

**What to Show:** Kubernetes deployments + code

**Script:**
```
"The platform is designed for horizontal scaling.

[Show deployments]

The API and dashboard both run with 2 replicas for high availability.
To scale, I just increase replicas - they're stateless.

[Show orchestrator]

The orchestrator uses optimistic locking on database rows to prevent
race conditions when scaling to multiple replicas.

[Show resource quotas]

Each namespace has resource quotas. To scale provisioning throughput,
I'd deploy multiple orchestrator replicas and optimize the Helm install
timeout. The bottleneck is Helm chart installation time, not the
orchestrator itself.

PostgreSQL could be replaced with managed RDS for better scaling, and
store databases could use MySQL Operator for automated management."
```

**Actions:**
```bash
kubectl get deploy -n store-platform  # Show replicas (5 sec)
```
- Show code: `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\services\reconciler.ts` - polling logic (3 sec)
  - **Line 65-80:** Shows adaptive polling mechanism
- Show code: `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values.yaml` - resource quotas (3 sec)
  - **Line 25-35:** Shows CPU/Memory limits
  - **Line 40-50:** Shows storage quotas

---

### **[04:00 - 04:30] ABUSE PREVENTION (30 seconds)**

**What to Show:** Code + configuration

**Script:**
```
"Abuse prevention is built into multiple layers.

[Show rate limiting code]

The API has rate limiting - 100 requests per 15 minutes globally, and
5 store creations per hour per user to prevent spam.

[Show resource quotas]

Each store namespace has hard limits - 2 CPU, 4GB RAM, 20GB storage.
A single store can't consume all cluster resources.

[Show orchestrator timeout]

Helm installations timeout after 10 minutes. If a store fails to provision,
it's marked as 'failed' and doesn't block other stores.

[Show audit logs]

Every action is logged with user ID, correlation ID, and timestamp for
security auditing and forensics."
```

**Actions:**
- Show `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\middleware\rateLimiter.ts` (8 sec)
  - **Line 10-20:** Global rate limiter (100 req/15min)
  - **Line 30-40:** Create store rate limiter (5 stores/hour)
- Show `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\config\database.ts` - store_events table (5 sec)
  - **Line 150-180:** Shows event logging for audit trail
- Show namespace quota: `kubectl describe quota -n store-clothing-store-xxx` (5 sec)

---

### **[04:30 - 05:00] LOCAL-TO-PRODUCTION & CONCLUSION (30 seconds)**

**What to Show:** VS Code with Helm values files + both deployments

**Script:**
```
"Finally, the local-to-production story.

[Show Helm values files]

The same Helm charts deploy everywhere. Local uses values-local.yaml
with host paths for storage. Production uses values-prod.yaml with
cloud PVCs and public ingress.

[Show both dashboards side-by-side]

Here's the local deployment on Docker Desktop, and here's AWS with k3s -
same code, different configuration.

Upgrades are handled through Helm - 'helm upgrade' with new values.
Rollback is 'helm rollback' - one command.

[Show final dashboard]

This platform automates store provisioning, enforces isolation and resource
limits, includes security best practices, scales horizontally, and prevents
abuse. It's production-ready and deployable anywhere Kubernetes runs.

Thank you for watching!"
```

**Actions:**
- Show VS Code: `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values.yaml` (3 sec)
  - **Top of file:** Base values for all environments
  - Mention: `values-local.yaml` for local, `values-prod.yaml` for AWS
  - **Line 5-15:** Image settings
  - **Line 20-30:** Resource limits
  - **Line 35-45:** Storage configuration
- Show local dashboard: http://localhost:5173 (3 sec)
- Show AWS dashboard: http://13.51.146.246:31107 (3 sec)
- End on AWS dashboard with stores visible

---

## **🎬 ALTERNATE: SIMPLER 5-MINUTE SCRIPT (If Above is Too Technical)**

---

### **SIMPLIFIED VERSION - For Non-Technical Audience**

**[00:00-00:20] Introduction**
```
"I built a platform that automatically creates online stores.
Watch me create a store, place an order, and delete it - all automated."
```

**[00:20-01:00] Create Store Demo**
```
"I'm on AWS. Click 'Create Store', enter name, click create.
Done. The platform is building it right now."
```

**[01:00-02:00] Show Provisioning**
```
"Behind the scenes, it's creating a private space in Kubernetes,
installing WordPress and WooCommerce, setting up a database,
and configuring networking. Status changes to READY."
```

**[02:00-03:00] Place Order**
```
"Here's the store. Let me shop as a customer. Add to cart,
checkout, place order. Order confirmed. Now let's check
the admin panel - there it is!"
```

**[03:00-03:45] Technical Features**
```
"Each store is isolated with resource limits. Secrets are
auto-generated. The orchestrator handles failures gracefully.
Everything is logged for security."
```

**[03:45-04:30] Security & Scaling**
```
"Rate limiting prevents spam. Resource quotas prevent one store
from using too many resources. The API scales horizontally for
high traffic. I can run this locally or on AWS with the same code."
```

**[04:30-05:00] Conclusion**
```
"This platform automates everything - infrastructure, deployment,
cleanup. It's secure, scalable, and production-ready. Thanks!"
```

---

## **📸 WHAT TO SHOW IN EACH SECTION - VISUAL GUIDE**

### **Section 1: Introduction**
- **Screen:** AWS Dashboard (http://13.51.146.246:31107)
- **Highlight:** Existing stores with READY status

### **Section 2: Architecture**
- **Screen:** Split screen or quick cuts:
  - VS Code file tree
  - Architecture diagram (draw or pre-made)
  - Code snippets

### **Section 3: End-to-End Flow**
- **Screen Recording Sequence:**
  1. Dashboard (Create Store button)
  2. Enter "DemoStore"
  3. Click Create
  4. Terminal: `kubectl get pods -n store-demostore-xxx -w`
  5. Dashboard: Refresh to show READY
  6. Browser: Open store URL
  7. Add product → Cart → Checkout → Place Order
  8. Admin: Show order
  9. Dashboard: Delete store

### **Section 4: Security & Isolation**
- **Terminal Commands:**
  ```bash
  kubectl get ns | grep store-
  kubectl get secrets -n store-clothing-store-c593a283
  kubectl describe resourcequota -n store-clothing-store-c593a283
  kubectl get clusterrole orchestrator-role -o yaml
  ```

### **Section 5: Scaling**
- **Terminal:**
  ```bash
  kubectl get deploy -n store-platform
  kubectl scale deploy platform-api --replicas=3 -n store-platform
  ```

### **Section 6: Abuse Prevention**
- **VS Code Files:**
  - `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\middleware\rateLimiter.ts`
  - `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\k8s\provisioner.ts` (timeout logic - Line 200-220)

### **Section 7: Local vs AWS**
- **Split Screen:**
  - Left: http://localhost:5173
  - Right: http://13.51.146.246:31107

---

## **🛠️ PRE-RECORDING SETUP CHECKLIST**

### **AWS Environment:**
```bash
# SSH into EC2
ssh -i store-platform-key.pem ubuntu@13.51.146.246

# Verify everything running
kubectl get pods -n store-platform
kubectl get stores -n store-platform  # Should show Clothing Store

# Have terminal ready
```

### **Local Environment:**
```powershell
# Start all services in 3 terminals:

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Orchestrator
cd orchestrator
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev

# Wait for http://localhost:5173 to be accessible
```

### **Browser Tabs (Open before recording):**
1. AWS Dashboard: http://13.51.146.246:31107
2. AWS Store: http://13.51.146.246:32353
3. Local Dashboard: http://localhost:5173
4. GitHub Repository (optional, for code walkthrough)

### **VS Code (Have these files open in tabs):**
1. `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\Chart.yaml`
2. `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\middleware\rateLimiter.ts`
3. `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\services\reconciler.ts`
4. `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\models\storeEvent.ts`
5. `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values.yaml`
6. `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\deployment.yaml`

---

## **🎯 TIPS FOR SUCCESSFUL RECORDING**

### **Before Recording:**
1. ✅ **Practice the script 3 times** without recording
2. ✅ **Close unnecessary applications** (Slack, email, notifications)
3. ✅ **Use "Do Not Disturb" mode** on Windows
4. ✅ **Check microphone levels** - record 10-second test
5. ✅ **Clear browser history/tabs** - only show what's needed
6. ✅ **Set browser zoom to 100%** for readability
7. ✅ **Use incognito mode** to avoid extensions/bookmarks showing

### **During Recording:**
1. ✅ **Speak clearly and confidently** - imagine explaining to a friend
2. ✅ **Don't rush** - 5 minutes is plenty of time
3. ✅ **Pause between sections** - easier to edit later
4. ✅ **If you make a mistake** - pause, restart that section
5. ✅ **Show, don't just tell** - demonstrate while explaining
6. ✅ **Use cursor to highlight** what you're talking about

### **After Recording:**
1. ✅ **Watch the full video** - check audio/video quality
2. ✅ **Edit out long pauses** or mistakes
3. ✅ **Add titles/captions** for each section (optional but nice)
4. ✅ **Export in MP4 format** (widely compatible)
5. ✅ **Keep file size under 100MB** if possible

---

## **📊 TIME BREAKDOWN GUIDE**

| Section | Time | Content |
|---------|------|---------|
| **Introduction** | 0:00-0:30 | Who you are, what you built |
| **Architecture** | 0:30-1:30 | Components, flow diagram |
| **Live Demo** | 1:30-2:45 | Create→Provision→Order→Delete |
| **Security** | 2:45-3:30 | Isolation, RBAC, secrets |
| **Scaling** | 3:30-4:00 | Horizontal scaling strategy |
| **Abuse Prevention** | 4:00-4:30 | Rate limits, quotas, logging |
| **Deployment** | 4:30-4:50 | Local vs AWS, Helm values |
| **Conclusion** | 4:50-5:00 | Summary, thank you |

---

## **🎥 RECOMMENDED RECORDING SOFTWARE**

### **Windows:**
1. **OBS Studio** (Free, professional)
   - Download: https://obsproject.com
   - Settings: 1920x1080, 30 FPS, MP4 format

2. **Windows Game Bar** (Built-in, simple)
   - Press `Win + G` to start
   - Click record button

3. **Loom** (Free tier, browser-based)
   - https://loom.com
   - Easy to use, automatic upload

### **Recommended:** OBS Studio for quality, Windows Game Bar for speed

---

## **✅ FINAL CHECKLIST BEFORE RECORDING**

- [ ] All services running (local or AWS or both)
- [ ] Browser tabs organized and ready
- [ ] VS Code open with relevant files
- [ ] Terminal windows ready with commands
- [ ] Microphone tested
- [ ] Recording software configured (1080p, MP4)
- [ ] Notifications disabled
- [ ] Script practiced 2-3 times
- [ ] Backup plan if demo fails (screenshots ready)

---

## **🚀 QUICK START COMMANDS FOR DEMO**

### **AWS Demo Commands:**
```bash
# SSH to EC2
ssh -i /c/Users/hp/OneDrive/Desktop/store-platform-key.pem ubuntu@13.51.146.246

# Show platform pods
sudo kubectl get pods -n store-platform

# Show existing stores
sudo kubectl get ns | grep store-

# Show resource quota (replace with actual namespace)
sudo kubectl describe resourcequota -n store-clothing-store-c593a283

# Show secrets
sudo kubectl get secrets -n store-clothing-store-c593a283

# Show RBAC
sudo kubectl get clusterrole orchestrator-role -o yaml | head -30
```

### **Local Demo Commands:**
```powershell
# Start backend (Terminal 1)
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev

# Start orchestrator (Terminal 2)
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev

# Start frontend (Terminal 3)
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev

# Access stores (separate PowerShell)
.\ACCESS_TESTSTORE.ps1
.\ACCESS_POWERSHELLTEST.ps1
```

---

## **💡 BONUS TIPS**

### **If Something Goes Wrong During Recording:**
1. **Don't panic!** - Pause, take a breath
2. **Have screenshots ready** - show them if live demo fails
3. **Explain what SHOULD happen** - show code/config as proof
4. **Use local deployment as backup** - if AWS is down
5. **Edit it out later** - you can cut and re-record sections

### **To Make Video More Professional:**
1. **Use a second monitor** - one for recording, one for script
2. **Hide desktop icons** - clean desktop looks better
3. **Use a simple background** - or blur it
4. **Zoom in on important parts** - especially code/terminal
5. **Add background music** (optional, very low volume)

---

## **📁 COMPLETE FILE REFERENCE GUIDE**

### **Files to Show in Demo - Organized by Topic**

#### **1. System Architecture & Components**

**File Structure Overview:**
```
C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\
├── backend\                          # Node.js API
│   ├── src\
│   │   ├── index.ts                  # Main entry point, CORS setup
│   │   ├── config\database.ts        # Database config, migrations, audit logging
│   │   ├── controllers\storeController.ts  # Store CRUD endpoints
│   │   ├── middleware\rateLimiter.ts # Rate limiting logic
│   │   ├── models\storeEvent.ts      # Event logging for audit trail
│   │   └── services\storeService.ts  # Business logic
│   └── package.json
│
├── frontend\                         # React Dashboard
│   ├── src\
│   │   ├── App.tsx                   # Main React component
│   │   ├── components\StoreCard.tsx  # Store display component
│   │   └── services\api.ts           # API client
│   └── package.json
│
├── orchestrator\                     # Kubernetes Orchestrator
│   ├── src\
│   │   ├── index.ts                  # Main reconciliation loop
│   │   ├── services\reconciler.ts    # Idempotency, retry logic
│   │   └── k8s\provisioner.ts        # Helm installation, timeout handling
│   ├── helm-charts\
│   │   └── woocommerce-store\        # Helm chart for stores
│   │       ├── Chart.yaml            # Helm chart metadata
│   │       ├── values.yaml           # Default configuration
│   │       └── templates\            # Kubernetes manifests
│   │           ├── deployment.yaml   # WordPress deployment
│   │           ├── service.yaml      # Service definition
│   │           ├── ingress.yaml      # Ingress routing
│   │           ├── mysql-statefulset.yaml  # MySQL database
│   │           ├── secrets.yaml      # Secret generation
│   │           └── resourcequota.yaml # Resource limits
│   └── package.json
│
├── DEMO_VIDEO_SCRIPT.md             # This file!
├── README.md                         # Project documentation
└── AWS_DEPLOYMENT_GUIDE.md          # AWS deployment steps
```

---

#### **2. Files for Security & Isolation Demo**

**Rate Limiting:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\middleware\rateLimiter.ts`
- **Lines to Show:** 10-40
- **What to Highlight:** Global limiter (100 req/15min), Store creation limiter (5/hour)

**Secret Management:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\secrets.yaml`
- **Lines to Show:** 1-20
- **What to Highlight:** Auto-generated MySQL passwords, no hardcoded secrets

**RBAC Configuration:**
- **File:** Terminal command: `kubectl get clusterrole orchestrator-role -o yaml`
- **What to Highlight:** Limited permissions, can only create in store namespaces

**Resource Quotas:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\resourcequota.yaml`
- **Lines to Show:** Entire file
- **What to Highlight:** CPU: 2 cores, Memory: 4GB, Storage: 20GB limits

---

#### **3. Files for Reliability & Idempotency Demo**

**Reconciliation Loop:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\services\reconciler.ts`
- **Lines to Show:** 15-80
- **What to Highlight:**
  - Line 15-30: Correlation ID tracking
  - Line 45-60: Retry logic with exponential backoff
  - Line 65-80: Adaptive polling

**Audit Trail:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\models\storeEvent.ts`
- **Lines to Show:** 1-50
- **What to Highlight:** Event types, user tracking, timestamp logging

**Database Initialization:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\config\database.ts`
- **Lines to Show:** 150-200
- **What to Highlight:** Migration system, schema versioning

---

#### **4. Files for Horizontal Scaling Demo**

**API Deployment (High Availability):**
- **Terminal:** `kubectl get deploy -n store-platform`
- **What to Show:** platform-api with 2 replicas

**Orchestrator Polling:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\index.ts`
- **Lines to Show:** 15-50
- **What to Highlight:** Polling mechanism, can run multiple replicas

**Resource Configuration:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values.yaml`
- **Lines to Show:**
  - Line 5-15: Replica count
  - Line 20-35: Resource requests/limits
  - Line 40-55: Storage configuration

---

#### **5. Files for Abuse Prevention Demo**

**Rate Limiter Implementation:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend\src\middleware\rateLimiter.ts`
- **Lines to Show:** Entire file (it's short)
- **What to Highlight:**
  - `globalRateLimiter`: 100 requests per 15 minutes
  - `createStoreRateLimiter`: 5 store creations per hour

**Timeout Handling:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\k8s\provisioner.ts`
- **Lines to Show:** 200-220
- **What to Highlight:** Helm install timeout (10 minutes)

**Resource Quotas:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\resourcequota.yaml`
- **Terminal:** `kubectl describe resourcequota -n store-clothing-store-c593a283`

---

#### **6. Files for Local-to-Production Demo**

**Helm Values (Main):**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values.yaml`
- **What to Highlight:** Base configuration for all environments

**Local Configuration (if you have it):**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values-local.yaml`
- **What to Highlight:** Local-specific settings (hostPath, local domains)

**Production Configuration (if you have it):**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values-prod.yaml`
- **What to Highlight:** AWS-specific settings (cloud PVCs, public ingress)

**Deployment Guide:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\AWS_DEPLOYMENT_GUIDE.md`
- **What to Highlight:** Step-by-step AWS deployment process

---

#### **7. Files for Helm Chart Demo**

**Chart Metadata:**
- **File:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\Chart.yaml`
- **What to Show:** Chart name, version, description

**Kubernetes Templates:**
- **Deployment:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\deployment.yaml`
- **Service:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\service.yaml`
- **Ingress:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\ingress.yaml`
- **MySQL:** `C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\mysql-statefulset.yaml`

---

## **🎯 QUICK OPEN COMMANDS FOR VS CODE**

Press `Ctrl + P` in VS Code and paste these one at a time:

```
orchestrator\helm-charts\woocommerce-store\Chart.yaml
backend\src\middleware\rateLimiter.ts
orchestrator\src\services\reconciler.ts
backend\src\models\storeEvent.ts
orchestrator\helm-charts\woocommerce-store\values.yaml
orchestrator\helm-charts\woocommerce-store\templates\deployment.yaml
orchestrator\src\k8s\provisioner.ts
backend\src\config\database.ts
```

---

**You're ready to create an amazing demo video! Good luck!** 🎬✨
