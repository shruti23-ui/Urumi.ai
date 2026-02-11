# 5-Minute Technical Demo Script

## Perfect for: Quick technical presentations, hackathon demos, initial founder pitches

---

## Part 1: Introduction (45 seconds)

### Opening

"Hi, I'm Shruti, a CSE student and software developer. I built a multi-tenant Kubernetes platform that automates e-commerce store provisioning."

### The Problem

"Traditional store setup takes hours: install WordPress, configure MySQL, set up hosting, configure domains. Each store can interfere with others. No isolation."

### The Solution

"My platform does it in 3 minutes with one API call. Complete isolation using Kubernetes namespaces, production-ready with idempotency and distributed locking, scales horizontally."

### Architecture Overview (Quick)

"Three components: Backend API writes to PostgreSQL, Orchestrator polls database and provisions to Kubernetes using Helm charts. Classic control plane pattern - database is source of truth."

**[While talking, draw on tablet: USER → API → DATABASE → ORCHESTRATOR → KUBERNETES]**

---

## Part 2: Live Demo (2 minutes 30 seconds)

### Step 1: Create Store (20 seconds)

**Type:**
```powershell
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "techstore", "engine": "woocommerce"}' -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Say:**
"One API request creates a store. Notice status is 'provisioning' - the orchestrator will pick this up within 5 seconds."

**Point out:**
- Unique namespace: `store-techstore-abc123de`
- Correlation ID for distributed tracing

---

### Step 2: Watch Kubernetes (1 minute 30 seconds)

**Type:**
```powershell
$namespace = ($response.Content | ConvertFrom-Json).store.namespace
kubectl get pods -n $namespace --watch
```

**Say while watching:**
"The orchestrator just:
1. Created isolated Kubernetes namespace
2. Applied resource quotas - 2 CPU cores, 4GB RAM limit
3. Deployed Helm chart with WordPress and MySQL StatefulSet

Each store is completely isolated - separate networking, resources, persistent storage."

**When pods start running:**
"Both pods running - WordPress with 3 replicas for HA, MySQL with persistent volume."

**Press Ctrl+C**

---

### Step 3: Show Resources (20 seconds)

**Type:**
```powershell
kubectl get all,ingress,pvc -n $namespace
```

**Say:**
"Deployment manages WordPress, StatefulSet manages MySQL with stable storage, Services for networking, Ingress for external access. All created automatically from Helm templates."

---

### Step 4: Database Updated (15 seconds)

**Type:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

**Say:**
"Status changed to 'ready' automatically. Orchestrator detected pods healthy and updated PostgreSQL. No manual intervention."

---

### Step 5: Access Store (15 seconds)

**Type:**
```powershell
kubectl port-forward -n $namespace service/techstore 8080:80
```

**Open browser:** http://localhost:8080

**Say:**
"Fully functional WordPress installation page. In production, accessible via Ingress with automatic TLS from cert-manager."

---

## Part 3: Key Production Feature - Idempotency (1 minute 30 seconds)

### Show Code

**Open:** `backend/src/services/storeService.ts` (line 32)

**Say:**
"This is production-grade code, not a toy project. Let me show you one critical feature: idempotency."

### Code Walkthrough

```typescript
if (data.idempotency_key) {
  const existing = await client.query(
    'SELECT * FROM stores WHERE user_id = $1 AND idempotency_key = $2',
    [data.user_id, data.idempotency_key]
  );

  if (existing.rows.length > 0) {
    await client.query('COMMIT');
    return existing.rows[0]; // Return existing, don't create duplicate
  }
}
```

**Explain:**
"Clients send an idempotency key with requests. If the network fails and they retry with the same key, we return the existing store instead of creating a duplicate."

### Why This Matters

**Say:**
"In distributed systems, networks are unreliable. Clients retry failed requests. Without idempotency, you'd create duplicate stores, waste resources, confuse users."

### Draw on Tablet (Quick)

```
Request 1: idempotency-key: abc-123
  → Creates store-001

Request 2: SAME key: abc-123 (network retry)
  → Returns existing store-001
  → No duplicate created ✓
```

**Say:**
"Same request twice produces the same result. This is idempotency - a fundamental property for reliable distributed systems."

### Other Production Features (Mention Briefly)

**Say:**
"We also have:
- Distributed locking with PostgreSQL advisory locks - multiple orchestrators coordinate
- Database transactions - atomic store creation
- Input sanitization - prevents injection attacks
- Structured logging - JSON logs with correlation IDs for debugging"

---

## Part 4: Technical Highlights (30 seconds)

### Architecture Decisions

**Say:**
"Key architectural choices:

**Control Plane Pattern** - Kubernetes itself uses this. Database is source of truth, reconciliation loop syncs reality to desired state.

**PostgreSQL** - Advisory locks enable distributed coordination, JSONB for flexible schemas, transactions for atomicity.

**Helm Charts** - Infrastructure as code, parameterized templates, version control for Kubernetes resources.

**Namespace Isolation** - Each store in separate namespace with resource quotas, prevents noisy neighbor problems."

---

## Part 5: Scaling & Close (15 seconds)

### Performance

**Say:**
"Single orchestrator provisions one store at a time, about 20 stores per hour. Scale horizontally - run 5 orchestrators, provision 100 stores per hour. Distributed locking prevents conflicts."

### Closing

**Say:**
"Complete store in 3 minutes, production-ready features, scales horizontally, runs on any Kubernetes cluster. Perfect for SaaS platforms or agencies. Code is on GitHub. Happy to discuss implementation details or answer questions."

---

## Timing Breakdown

| Section | Time | Cumulative |
|---------|------|------------|
| Introduction | 0:45 | 0:45 |
| Create Store | 0:20 | 1:05 |
| Watch Kubernetes | 1:30 | 2:35 |
| Show Resources | 0:20 | 2:55 |
| Database Status | 0:15 | 3:10 |
| Access Store | 0:15 | 3:25 |
| Idempotency Code | 1:30 | 4:55 |
| Technical Highlights | 0:30 | 5:25 |
| Closing | 0:15 | 5:40 |
| **Buffer** | 0:20 | **6:00** |

Target: 5-6 minutes with buffer for questions

---

## What to Have Ready

### Terminal Setup
- PowerShell with large font (16pt)
- Commands pre-typed in notepad for quick copy-paste
- Two terminal windows: one for commands, one for watching pods

### Code Editor
- VS Code open to `backend/src/services/storeService.ts`
- Line 32 (idempotency check) visible
- Syntax highlighting enabled

### Browser
- Tab open ready for http://localhost:8080
- Other tabs closed for clean demo

### Tablet
- Drawing app open with blank canvas
- Stylus ready
- High-level architecture pre-drawn (optional - or draw live)

### Services Running
- Docker Desktop running
- Kubernetes enabled
- PostgreSQL container running
- Backend API running (port 3001)
- Orchestrator running

---

## Pre-Demo Checklist

Run these to verify everything works:

```powershell
# Navigate
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1

# Check Docker
docker ps | Select-String postgres

# Check Kubernetes
kubectl cluster-info

# Check Backend
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing

# Test create (optional - delete after)
$test = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "test123", "engine": "woocommerce"}' -UseBasicParsing
$test.Content | ConvertFrom-Json | ConvertTo-Json
```

If all pass, you're ready!

---

## Questions Technical Founders Might Ask

### Q: Why Kubernetes and not serverless?

**A:** "Kubernetes provides stateful workloads - MySQL needs persistent storage and stable networking. Serverless is great for stateless APIs but doesn't fit database workloads well. That said, we could add Knative for serverless WordPress scaling."

---

### Q: How do you handle secrets?

**A:** "Currently using Kubernetes Secrets. Production would use HashiCorp Vault or sealed-secrets for encryption at rest. Each store gets its own database credentials generated automatically."

---

### Q: What about costs at scale?

**A:** "Resource quotas per store - 2 CPU cores, 4GB RAM max. With spot instances on AWS, roughly $10-15 per store per month. Can optimize with vertical pod autoscaling and bin packing for better resource utilization."

---

### Q: Security compliance?

**A:** "Network policies isolate stores, resource quotas prevent DoS, input sanitization prevents injection, audit logs track all API calls. Ready for SOC2 with additional access controls and encryption at rest."

---

### Q: What happens if orchestrator crashes?

**A:** "Database is source of truth. New orchestrator starts, polls database, sees pending stores, continues provisioning. Stateless orchestrator design enables easy recovery."

---

### Q: How do you handle upgrades?

**A:** "Helm charts enable rolling updates. Run `helm upgrade` with new chart version, Kubernetes rolls out changes with zero downtime. Can test on dev store first, then production rollout."

---

## Tips for Delivery

### Be Confident
You built something genuinely impressive. Own it.

### Know Your Audience
Technical founders want depth. Don't oversimplify, but explain clearly.

### Live Demo is King
Working software is more impressive than slides. The demo sells itself.

### Show, Don't Tell
"Let me show you the code" > "We have idempotency"

### Admit What You Don't Know
"That's a great question, I'd need to research that" is better than making something up.

### Practice Timing
Run through this 3-4 times before presenting. Know exactly where you are at 2 min, 3 min, 4 min.

### Have Backup Plan
If Kubernetes is slow, show code while waiting. If demo breaks, explain architecture on tablet.

### Energy and Enthusiasm
You're excited about distributed systems and cloud-native architecture. Let it show!

---

## Alternative: If Demo Breaks

### Fallback Presentation (No Live Demo)

**Show pre-recorded demo video:** 2 minutes

**Show architecture on tablet:** 1 minute

**Code walkthrough:** 2 minutes
- Idempotency code
- Distributed locking code
- Transaction code

**Total:** 5 minutes without live demo

---

## After Demo: Next Steps

### If Founders Are Interested

**Have ready:**
- GitHub repo link
- Architecture diagram PDF
- Technical documentation
- Contact info (email, LinkedIn)

### Offer to Discuss
- Custom features they need
- Integration with their systems
- Deployment strategies
- Cost optimization

---

## Remember

You're a CSE student who built a production-grade distributed system. That's impressive. Most engineers with years of experience haven't built something this comprehensive.

**You got this, Shruti!** 🚀

Good luck!
