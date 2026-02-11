# Tablet Visual Guide - Architecture Drawings

## What to Draw on Your Tablet

This guide shows you EXACTLY what to draw on your tablet while explaining the architecture.

---

## Drawing 1: High-Level System Architecture

### When to Use
During introduction and architecture overview (first 2 minutes)

### What to Draw

```
┌─────────────────────────────────────────────────────────┐
│                        USER                              │
│                    (Web Browser)                         │
└───────────────┬─────────────────────────────────────────┘
                │
                │ HTTP Request
                │ POST /api/stores
                ▼
┌───────────────────────────────────────────────────────┐
│              BACKEND API                               │
│          (Node.js + Express)                          │
│                                                        │
│  ┌──────────────────────────────────────────┐        │
│  │  Controllers → Services → Models          │        │
│  └──────────────────────────────────────────┘        │
└───────────────┬───────────────────┬───────────────────┘
                │                    │
                │ Write               │ Read
                ▼                    ▼
┌───────────────────────────────────────────────────────┐
│            POSTGRESQL DATABASE                         │
│         (Source of Truth)                             │
│                                                        │
│  ┌─────────┐  ┌───────────┐  ┌──────────────┐      │
│  │ stores  │  │  users    │  │ store_events │      │
│  └─────────┘  └───────────┘  └──────────────┘      │
└───────────────┬───────────────────────────────────────┘
                │
                │ Poll every 5s
                │ "Any status=provisioning?"
                ▼
┌───────────────────────────────────────────────────────┐
│           ORCHESTRATOR                                 │
│      (Reconciliation Loop)                            │
│                                                        │
│  ┌──────────────────────────────────────────┐        │
│  │  1. Find pending stores                   │        │
│  │  2. Create K8s resources                  │        │
│  │  3. Wait for ready                        │        │
│  │  4. Update status                         │        │
│  └──────────────────────────────────────────┘        │
└───────────────┬───────────────────────────────────────┘
                │
                │ kubectl apply
                │ helm install
                ▼
┌───────────────────────────────────────────────────────┐
│         KUBERNETES CLUSTER                            │
│                                                        │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Namespace 1    │  │  Namespace 2    │           │
│  │  (Store A)      │  │  (Store B)      │           │
│  │                 │  │                 │           │
│  │  WordPress      │  │  WordPress      │           │
│  │  MySQL          │  │  MySQL          │           │
│  └─────────────────┘  └─────────────────┘           │
└───────────────────────────────────────────────────────┘
```

### Drawing Instructions (Step-by-Step)

**Step 1:** Draw USER box at top
- Label: "USER (Web Browser)"
- Use a rectangle

**Step 2:** Draw arrow down with label "HTTP Request"

**Step 3:** Draw BACKEND API box
- Label: "BACKEND API (Node.js + Express)"
- Inside: smaller box with "Controllers → Services → Models"

**Step 4:** Draw arrow to DATABASE
- Two arrows: one labeled "Write", one labeled "Read"

**Step 5:** Draw DATABASE box
- Label: "POSTGRESQL DATABASE (Source of Truth)"
- Inside: three small boxes "stores", "users", "store_events"

**Step 6:** Draw arrow down from DATABASE to ORCHESTRATOR
- Label: "Poll every 5s: Any status=provisioning?"

**Step 7:** Draw ORCHESTRATOR box
- Inside: list the 4 steps
- Use numbered list (1-4)

**Step 8:** Draw arrow to KUBERNETES
- Label: "kubectl apply, helm install"

**Step 9:** Draw KUBERNETES box
- Inside: two namespace boxes side by side
- Each with "WordPress" and "MySQL" inside

### What to Say While Drawing

**While drawing USER:**
"Users interact through a web browser, sending HTTP requests."

**While drawing BACKEND API:**
"The backend API handles all requests. It's built with Node.js and follows MVC pattern - controllers, services, models."

**While drawing DATABASE:**
"PostgreSQL is our source of truth. Everything goes through the database. Three main tables: stores, users, and events for logging."

**While drawing ORCHESTRATOR:**
"The orchestrator polls the database every 5 seconds looking for pending stores. It's a reconciliation loop - classic Kubernetes control plane pattern."

**While drawing KUBERNETES:**
"Finally, Kubernetes runs the actual stores. Each store gets its own namespace - complete isolation."

---

## Drawing 2: Request Flow (API to Kubernetes)

### When to Use
During live demo when explaining what happens after API request

### What to Draw

```
TIME ────────────────────────────────────►

t=0s    User sends POST /api/stores
        │
        ▼
        ┌─────────────────────────────┐
        │ Backend Receives Request    │
        │ - Validate input            │
        │ - Check user limit          │
        └─────────────────────────────┘
                │
                ▼
t=0.1s  ┌─────────────────────────────┐
        │ Database Transaction        │
        │ BEGIN                       │
        │   INSERT INTO stores        │
        │   INSERT INTO store_events  │
        │ COMMIT                      │
        └─────────────────────────────┘
                │
                ▼
t=0.2s  ┌─────────────────────────────┐
        │ Return Response to User     │
        │ status: "provisioning"      │
        │ namespace: "store-xyz-123"  │
        └─────────────────────────────┘

        [Database now has pending store]

t=5s    Orchestrator polls database
        │
        ▼
        ┌─────────────────────────────┐
        │ Find Pending Stores         │
        │ SELECT * FROM stores        │
        │ WHERE status='provisioning' │
        └─────────────────────────────┘
                │
                ▼
t=5.1s  ┌─────────────────────────────┐
        │ Acquire Lock                │
        │ pg_try_advisory_lock()      │
        └─────────────────────────────┘
                │
                ▼
t=5.2s  ┌─────────────────────────────┐
        │ Create Kubernetes Resources │
        │ 1. Namespace                │
        │ 2. Resource Quota           │
        │ 3. Helm Install             │
        └─────────────────────────────┘
                │
                ▼
t=5.5s  ┌─────────────────────────────┐
        │ Kubernetes Working...       │
        │ - Pull images               │
        │ - Create pods               │
        │ - Mount storage             │
        └─────────────────────────────┘
                │
                ▼
t=180s  ┌─────────────────────────────┐
        │ Pods Running!               │
        │ Orchestrator Detects        │
        └─────────────────────────────┘
                │
                ▼
t=180s  ┌─────────────────────────────┐
        │ Update Database             │
        │ UPDATE stores               │
        │ SET status='ready'          │
        └─────────────────────────────┘
                │
                ▼
t=180s  Store Ready! ✓
```

### Drawing Instructions

**Step 1:** Draw horizontal timeline at top
- Arrow pointing right with label "TIME"

**Step 2:** Draw boxes vertically, one below the other
- Each box represents a step
- Label with timestamp on the left (t=0s, t=0.1s, etc.)

**Step 3:** Connect boxes with arrows
- Vertical arrows between boxes

**Step 4:** Add details inside each box
- Use bullet points for sub-steps

### What to Say While Drawing

**While drawing t=0s to t=0.2s:**
"The entire API response takes only 200 milliseconds. We validate, write to database in a transaction, and immediately return. We don't wait for Kubernetes."

**While drawing t=5s:**
"Five seconds later, the orchestrator wakes up and polls the database. This is the reconciliation loop."

**While drawing t=5.2s:**
"It acquires a distributed lock so multiple orchestrators don't conflict, then creates all the Kubernetes resources."

**While drawing t=180s:**
"About 3 minutes later, pods are running. Orchestrator detects this and updates the database. The user sees status change from 'provisioning' to 'ready'."

---

## Drawing 3: Database Schema

### When to Use
When discussing technical deep dive or answering questions about data model

### What to Draw

```
┌──────────────────────────────────────┐
│           STORES TABLE               │
├──────────────────────────────────────┤
│ id                 UUID PK            │
│ name               VARCHAR(255)       │
│ engine             VARCHAR(50)        │
│ status             VARCHAR(50)  ◄─── indexed!
│ namespace          VARCHAR(255) UNIQUE│
│ urls               JSONB              │
│ user_id            VARCHAR(255) ◄─── indexed!
│ idempotency_key    VARCHAR(255)       │
│ created_at         TIMESTAMP          │
│ updated_at         TIMESTAMP          │
└──────────────────────────────────────┘
           │
           │ Foreign Key
           │
           ▼
┌──────────────────────────────────────┐
│       STORE_EVENTS TABLE             │
├──────────────────────────────────────┤
│ id                 UUID PK            │
│ store_id           UUID FK            │
│ event_type         VARCHAR(50)        │
│ message            TEXT                │
│ metadata           JSONB              │
│ created_at         TIMESTAMP          │
└──────────────────────────────────────┘

Example Data:

STORES:
┌──────────┬──────────┬────────┬──────────────┬────────────┐
│ id       │ name     │ engine │ status       │ namespace  │
├──────────┼──────────┼────────┼──────────────┼────────────┤
│ abc-123  │ TechShop │ woo    │ provisioning │ store-t... │
│ def-456  │ Fashion  │ woo    │ ready        │ store-f... │
│ ghi-789  │ Gadgets  │ medusa │ ready        │ store-g... │
└──────────┴──────────┴────────┴──────────────┴────────────┘

STORE_EVENTS:
┌──────────┬─────────────┬───────────┬─────────────────┐
│ store_id │ event_type  │ message   │ created_at      │
├──────────┼─────────────┼───────────┼─────────────────┤
│ abc-123  │ created     │ Initiated │ 2024-01-01 10:00│
│ abc-123  │ provisioning│ K8s start │ 2024-01-01 10:05│
│ abc-123  │ ready       │ Complete  │ 2024-01-01 10:08│
└──────────┴─────────────┴───────────┴─────────────────┘
```

### What to Say While Drawing

"Two main tables: stores and store_events. Stores table has the current state, events table has the history. Notice status and user_id are indexed for fast queries. URLs is JSONB for flexibility. Idempotency key enables safe retries."

---

## Drawing 4: Kubernetes Resources Per Store

### When to Use
When showing kubectl get all output, explain what each resource does

### What to Draw

```
NAMESPACE: store-techshop-abc123
├─ Resource Quota
│  ├─ CPU: 2 cores max
│  ├─ Memory: 4GB max
│  └─ Storage: 20GB max
│
├─ Deployment: techshop (WordPress)
│  ├─ ReplicaSet: techshop-5d8f7
│  │  ├─ Pod: techshop-5d8f7-abc
│  │  ├─ Pod: techshop-5d8f7-def
│  │  └─ Pod: techshop-5d8f7-ghi
│  └─ Strategy: RollingUpdate
│
├─ StatefulSet: techshop-mysql
│  └─ Pod: techshop-mysql-0
│     └─ PVC: mysql-data-techshop-mysql-0 (10GB)
│
├─ Services
│  ├─ techshop (ClusterIP: 10.96.1.1:80)
│  └─ techshop-mysql (ClusterIP: None:3306)
│
└─ Ingress: techshop
   └─ Route: techshop.domain.com → techshop:80

DATA FLOW:
Internet → Ingress → Service → Pod → Container
```

### What to Say While Drawing

"Every store gets this complete set of resources. Resource quotas prevent one store from consuming all cluster resources. WordPress uses a Deployment with 3 replicas for availability. MySQL uses a StatefulSet for stable identity and storage. Services provide networking, and Ingress exposes it externally."

---

## Drawing 5: Distributed Locking

### When to Use
When explaining how multiple orchestrators work together

### What to Draw

```
SCENARIO: 3 Orchestrators Running

t=0s    Database has 2 pending stores

t=5s    All 3 orchestrators poll simultaneously
        │
        ├─ Orchestrator 1 ─┐
        ├─ Orchestrator 2 ─┼─► SELECT * FROM stores
        └─ Orchestrator 3 ─┘    WHERE status='provisioning'
                │
                ├─ All find: Store A, Store B
                │
                ▼
        Try to acquire lock
                │
        ┌───────┴──────┬──────────┐
        │              │           │
        Orch 1         Orch 2     Orch 3
        │              │           │
        pg_try_advisory_lock(123456)
        │              │           │
        ▼              ▼           ▼
    SUCCESS!        FAIL        FAIL
    (acquired)     (locked)    (locked)
        │              │           │
        ▼              ▼           ▼
    Provisions    Skips cycle  Skips cycle
    Store A       Returns      Returns
        │
        ▼
    Releases lock
        │
        ▼
    Another cycle starts...
```

### What to Say While Drawing

"When multiple orchestrators run, they all find the same pending stores. But only one can acquire the PostgreSQL advisory lock. The others skip that cycle and try again in 5 seconds. This prevents duplicate work and race conditions."

---

## Drawing 6: Idempotency Example

### When to Use
When showing idempotency code feature

### What to Draw

```
REQUEST 1:
┌────────────────────────────────────────────┐
│ POST /api/stores                           │
│ Headers: idempotency-key: abc-xyz-123     │
│ Body: {name: "MyStore", engine: "woo"}    │
└────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ Check Database:                            │
│ SELECT * FROM stores                       │
│ WHERE idempotency_key = 'abc-xyz-123'     │
│                                            │
│ Result: Empty ✓                            │
└────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ Create Store                               │
│ INSERT INTO stores (id, name, ...)         │
│ VALUES ('store-123', 'MyStore', ...)       │
│                                            │
│ Response: {id: store-123, status: prov...} │
└────────────────────────────────────────────┘

═══════════════════════════════════════════

REQUEST 2 (Duplicate - network retry):
┌────────────────────────────────────────────┐
│ POST /api/stores                           │
│ Headers: idempotency-key: abc-xyz-123     │
│ Body: {name: "MyStore", engine: "woo"}    │
└────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ Check Database:                            │
│ SELECT * FROM stores                       │
│ WHERE idempotency_key = 'abc-xyz-123'     │
│                                            │
│ Result: Found store-123! ✓                │
└────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ Return Existing Store                      │
│ (No INSERT, no duplicate)                  │
│                                            │
│ Response: {id: store-123, status: ready}   │
└────────────────────────────────────────────┘

Result: Same response, NO duplicate store created!
```

### What to Say While Drawing

"First request creates the store and saves the idempotency key. Second request with the same key returns the existing store instead of creating a duplicate. This is critical for unreliable networks where clients retry."

---

## Drawing 7: Security - Helm Injection Prevention

### When to Use
When discussing security features

### What to Draw

```
❌ VULNERABLE CODE (Don't do this!):

User Input: storeName = "MyStore; rm -rf /"

Command Built:
helm install mystore --set storeName="MyStore; rm -rf /"
                                            ▲
                                            │
                                    Shell interprets this!

Result: Executes: rm -rf /
        YOUR SERVER IS DELETED!

═══════════════════════════════════════════

✅ SECURE CODE (What we do):

User Input: storeName = "MyStore; rm -rf /"

Step 1: Sanitize
storeName = sanitize(storeName)
         → "MyStore-rm-rf-"

Step 2: Write to YAML file
values.yaml:
  storeName: "MyStore-rm-rf-"

Step 3: Use file
helm install mystore -f values.yaml

Result: Safe! YAML escapes everything properly.
        No command injection possible.
```

### What to Say While Drawing

"Never pass user input directly to shell commands. We sanitize first, then write to a YAML file. Helm reads the file safely with proper escaping. This prevents injection attacks."

---

## Drawing 8: Full Data Flow (End-to-End)

### When to Use
For comprehensive explanation or Q&A

### What to Draw

```
┌─────────┐
│  USER   │ "I want a store"
└────┬────┘
     │ 1. POST /api/stores {name: "Shop"}
     ▼
┌──────────────┐
│ BACKEND API  │ 2. Validate, Check limits
└──────┬───────┘
       │ 3. Write to DB
       ▼
┌──────────────┐
│  POSTGRES    │ Store: {id: 123, status: provisioning}
└──────┬───────┘
       │ 4. Poll (5s later)
       ▼
┌──────────────┐
│ ORCHESTRATOR │ 5. Find pending store
└──────┬───────┘
       │ 6. Create resources
       ▼
┌──────────────────────────────────────────┐
│         KUBERNETES CLUSTER               │
│                                          │
│  7. Create Namespace: store-shop-123     │
│     │                                    │
│     ▼                                    │
│  8. Apply ResourceQuota                  │
│     │                                    │
│     ▼                                    │
│  9. Helm Install Chart                   │
│     │                                    │
│     ▼                                    │
│  ┌─────────────────────────────────┐    │
│  │ NAMESPACE: store-shop-123       │    │
│  │                                 │    │
│  │  ┌──────────┐  ┌────────────┐  │    │
│  │  │WordPress │  │   MySQL    │  │    │
│  │  │ (3 pods) │  │ (1 pod)    │  │    │
│  │  └─────┬────┘  └──────┬─────┘  │    │
│  │        │               │         │    │
│  │        └───────┬───────┘         │    │
│  │                │                 │    │
│  │           ┌────▼─────┐           │    │
│  │           │ Service  │           │    │
│  │           └────┬─────┘           │    │
│  │                │                 │    │
│  │           ┌────▼─────┐           │    │
│  │           │ Ingress  │           │    │
│  │           └────┬─────┘           │    │
│  └────────────────┼─────────────────┘    │
└───────────────────┼──────────────────────┘
                    │ 10. Expose URL
                    │
┌───────────────────▼──────────────────────┐
│         shop.yourdomain.com              │
│         (Public Internet)                │
└──────────────────────────────────────────┘
                    │ 11. Pods ready!
                    ▼
┌──────────────┐
│ ORCHESTRATOR │ 12. Detect ready
└──────┬───────┘
       │ 13. Update DB
       ▼
┌──────────────┐
│  POSTGRES    │ Store: {id: 123, status: ready}
└──────┬───────┘
       │ 14. User refreshes page
       ▼
┌─────────┐
│  USER   │ "My store is ready!" ✓
└─────────┘
```

### What to Say While Drawing

"This is the complete flow: User requests, API validates and writes to database, orchestrator polls and provisions to Kubernetes, Kubernetes creates all resources, orchestrator detects completion and updates database, user sees ready status. The database is always the source of truth."

---

## Tips for Drawing on Tablet

### Tools to Use
- **iPad:** Notability, GoodNotes, Procreate
- **Android:** Squid, Concepts
- **Windows:** OneNote, Whiteboard app

### Drawing Tips

1. **Use Colors:**
   - Blue for components (boxes)
   - Green for successful flows (arrows)
   - Red for errors or security issues
   - Orange for important notes

2. **Keep It Simple:**
   - Don't draw every detail
   - Focus on the concept
   - Clean lines, clear labels

3. **Draw As You Talk:**
   - Don't draw everything before
   - Build the diagram while explaining
   - Keeps audience engaged

4. **Use Arrows Liberally:**
   - Show data flow direction
   - Label arrows with actions
   - "Write", "Read", "Create", "Update"

5. **Erase and Redraw If Needed:**
   - Don't worry about mistakes
   - Technical founders understand
   - Shows thinking process

### Practice Before Demo

1. Draw each diagram 3-4 times
2. Time yourself (2 min per diagram max)
3. Practice talking while drawing
4. Make sure labels are readable

---

## What NOT to Draw

Don't draw these (too complex for live demo):
- Internal code structure (class diagrams)
- Complete database ERD with all relationships
- Detailed Kubernetes architecture
- Network packet flows

Keep it high-level and conceptual!

---

## Backup: If Drawing Doesn't Work

Have these ready as images on your computer:
1. Screenshot of architecture
2. kubectl get all output
3. Database schema diagram
4. Code snippets

But drawing live is MUCH more engaging!

---

Good luck with your demo, Shruti! The drawings will make your explanation much clearer and more memorable for technical founders.
