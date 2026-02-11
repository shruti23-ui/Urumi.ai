# Technical Demo Script for Founders

## Introduction (30 seconds)

**Who You Are:**
"Hi, I'm Shruti, a CSE student and software developer. I built a multi-tenant Kubernetes platform that automates e-commerce store provisioning."

**The Problem:**
"Setting up isolated e-commerce environments is time-consuming. Manual WordPress setup, database configuration, resource isolation - it takes hours or days."

**The Solution:**
"My platform does it in 3 minutes with one API call. Complete isolation, production-ready features, scales to thousands of stores."

---

## System Architecture Overview (1 minute)

**High-Level Architecture:**

"This is a control plane pattern with three main components:

1. **Backend API** - REST API built with Node.js/Express, PostgreSQL for state management
2. **Orchestrator** - Reconciliation loop that watches the database and provisions to Kubernetes
3. **Kubernetes Cluster** - Runs isolated store instances with Helm charts

The database is the source of truth. The orchestrator continuously reconciles desired state with actual state."

**Why This Architecture:**
- Decoupled components - API doesn't need Kubernetes access
- Reliable - Database survives API/orchestrator restarts
- Scalable - Multiple orchestrators can run concurrently with distributed locking
- Observable - All state changes logged to database

---

## Live Demo (3-4 minutes)

### Part 1: Create Store (30 seconds)

**Say:**
"Watch me create a store with one API request."

**Type:**
```powershell
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "techstore", "engine": "woocommerce"}' -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

**Explain the Response:**
"Notice the status is 'provisioning'. The API has written this to PostgreSQL. The orchestrator will pick it up within 5 seconds."

**Point Out:**
- Unique namespace generation: `store-techstore-abc123de`
- Correlation ID for tracing
- Idempotency key support

---

### Part 2: Watch Kubernetes Build (2 minutes)

**Type:**
```powershell
$namespace = ($response.Content | ConvertFrom-Json).store.namespace
kubectl get pods -n $namespace --watch
```

**Explain While It Runs:**

"The orchestrator just:
1. Created an isolated Kubernetes namespace
2. Applied resource quotas - 2 CPU cores, 4GB RAM, 20GB storage
3. Deployed Helm chart with WordPress and MySQL
4. Each store is completely isolated - separate network, resources, data

This uses StatefulSets for MySQL with persistent storage, and Deployments for WordPress with 3 replicas for high availability."

**When Pods Start:**
"See ContainerCreating? Kubernetes is pulling images. In production, we'd use a private registry with pre-pulled images for faster startup."

**When Pods Are Running:**
"Both pods running. The orchestrator is now checking deployment readiness before updating the database status."

Press Ctrl+C

---

### Part 3: Show Infrastructure (30 seconds)

**Type:**
```powershell
kubectl get all,ingress,pvc -n $namespace
```

**Explain:**
"Here's everything Kubernetes created automatically:

- **Pods**: WordPress (3 replicas) + MySQL (1 StatefulSet)
- **Services**: ClusterIP for internal communication
- **Deployment**: Manages WordPress pods with rolling updates
- **StatefulSet**: Manages MySQL with stable network identity
- **Ingress**: External routing - production would use cert-manager for TLS
- **PVC**: 10GB persistent volume for MySQL data

All templated with Helm, parameterized by store name, customizable resource limits."

---

### Part 4: Database State Sync (20 seconds)

**Type:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

**Point Out:**
"Status changed to 'ready' automatically. The orchestrator detected all pods healthy and updated PostgreSQL. No manual intervention."

---

### Part 5: Access The Store (30 seconds)

**Type:**
```powershell
kubectl port-forward -n $namespace service/techstore 8080:80
```

**Open Browser:** http://localhost:8080

**Say:**
"Fully functional WordPress. In production, this would be accessible via Ingress at techstore.yourdomain.com with automatic TLS."

---

## Technical Deep Dive (2 minutes)

### Production-Grade Features

#### 1. Idempotency (Show Code)

**File:** `backend/src/services/storeService.ts:32`

```typescript
if (data.idempotency_key) {
  const existing = await client.query(
    'SELECT * FROM stores WHERE user_id = $1 AND idempotency_key = $2',
    [data.user_id, data.idempotency_key]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0]; // Return existing, don't duplicate
  }
}
```

**Explain:**
"Clients can retry requests safely. Same idempotency key returns the existing store, prevents duplicates. Critical for unreliable networks."

---

#### 2. Distributed Locking

**File:** `orchestrator/src/services/reconciler.ts`

```typescript
const lockResult = await client.query(
  'SELECT pg_try_advisory_lock($1) as acquired',
  [RECONCILIATION_LOCK_ID]
);
if (!lockResult.rows[0].acquired) {
  return; // Another orchestrator is working
}
```

**Explain:**
"PostgreSQL advisory locks enable multiple orchestrator instances. Only one provisions at a time, others skip. Enables horizontal scaling without race conditions."

---

#### 3. Database Transactions

**File:** `backend/src/services/storeService.ts:22`

```typescript
await client.query('BEGIN');
try {
  // Insert store
  // Insert event log
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

**Explain:**
"Atomic operations. Store creation and event logging succeed together or fail together. No partial state."

---

#### 4. Security: Input Sanitization

**File:** `orchestrator/src/k8s/provisioner.ts:124`

```typescript
const sanitizedStoreName = storeName.toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/^-+|-+$/g, '');
```

**Explain:**
"All inputs sanitized before Kubernetes API calls. Prevents injection attacks. Helm values passed via YAML files, not command-line arguments, preventing shell injection."

---

#### 5. Structured Logging

**Show logs:**
```json
{
  "level": "info",
  "message": "Store provisioning completed",
  "storeId": "abc-123",
  "correlationId": "xyz-789",
  "namespace": "store-techstore-abc123de",
  "duration": 142000
}
```

**Explain:**
"JSON logs with correlation IDs. Track requests across services. Essential for debugging distributed systems."

---

## Technical Architecture Details

### Database Schema

**Stores Table:**
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  engine VARCHAR(50) NOT NULL, -- woocommerce | medusa
  status VARCHAR(50) NOT NULL, -- provisioning | ready | failed
  namespace VARCHAR(255) UNIQUE NOT NULL,
  urls JSONB,
  user_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_status ON stores(status);
CREATE INDEX idx_user_id ON stores(user_id);
```

**Why This Design:**
- UUID primary keys - distributed-safe
- Status field indexed - fast orchestrator queries
- JSONB urls - flexible for multiple ingress endpoints
- Idempotency key - client-side deduplication

---

### Reconciliation Loop Logic

**Pseudocode:**
```
Every 5-30 seconds (adaptive backoff):
1. Acquire distributed lock
2. SELECT * FROM stores WHERE status = 'provisioning' LIMIT 1
3. If found:
   a. Create namespace in Kubernetes
   b. Apply resource quotas
   c. Install Helm chart
   d. Wait for pods ready
   e. Update status = 'ready'
4. Release lock
5. Backoff: No work? Increase interval. Work found? Reset to 5s.
```

**Why Polling Not Webhooks:**
- Simpler - no webhook infrastructure
- Reliable - survives API restarts
- Database is source of truth
- Adaptive polling reduces load

---

### Helm Chart Structure

**woocommerce-store/values.yaml:**
```yaml
storeName: ""
resources:
  wordpress:
    limits:
      cpu: "1000m"
      memory: "1Gi"
  mysql:
    limits:
      cpu: "500m"
      memory: "512Mi"
storage:
  size: "10Gi"
```

**Why Helm:**
- Parameterized templates
- Version control for infrastructure
- Easy upgrades with `helm upgrade`
- Rollback capability

---

## Scaling and Performance

### Current Capacity

**Single Orchestrator:**
- Provisions 1 store at a time
- ~2-3 minutes per store
- ~20 stores/hour

**Multiple Orchestrators:**
- 5 instances = ~100 stores/hour
- Distributed locking prevents conflicts
- Horizontal scaling without code changes

### Bottlenecks

1. **Image Pull Time** - Solved with private registry + image pre-caching
2. **Storage Provisioning** - Use pre-provisioned PVs or fast CSI drivers
3. **Database Connections** - Connection pooling (already implemented)

### Production Optimizations

- Pre-warm namespaces with quotas
- Use init containers for faster startup
- Implement priority queues (premium users first)
- Add webhook notifications (Slack, email)

---

## Error Handling and Observability

### Failure Scenarios

**Scenario 1: Helm Install Fails**
- Orchestrator logs error to `store_events` table
- Status updated to `failed`
- User sees error message in UI
- Admin can retry or investigate

**Scenario 2: Database Connection Lost**
- Connection pool retries automatically
- Orchestrator skips cycle, logs error
- Resumes when database recovers

**Scenario 3: Kubernetes API Unavailable**
- Orchestrator backs off exponentially
- Stores remain in `provisioning` state
- Automatically resumes when K8s recovers

### Monitoring

**Metrics to Track:**
- Provisioning success rate
- Average provisioning time
- Stores by status (provisioning/ready/failed)
- Database query latency
- Kubernetes API latency

**Tools:**
- Prometheus for metrics
- Grafana for dashboards
- Loki for log aggregation
- Jaeger for distributed tracing (with correlation IDs)

---

## Security Considerations

### Implemented

1. **Input Sanitization** - All user inputs validated and sanitized
2. **SQL Injection Prevention** - Parameterized queries only
3. **Rate Limiting** - 5 store creates per minute per user
4. **Resource Quotas** - Prevent resource exhaustion
5. **Namespace Isolation** - Network policies between stores
6. **Helm Injection Prevention** - YAML files, not CLI args

### Production Additions

1. **Authentication** - JWT tokens, OAuth2
2. **Authorization** - RBAC for multi-tenancy
3. **Secrets Management** - Vault or sealed-secrets
4. **Network Policies** - Deny all by default
5. **Pod Security Policies** - Non-root containers
6. **TLS** - cert-manager for automatic certificates
7. **Audit Logging** - All API calls logged

---

## Tech Stack Justification

### Why Node.js/TypeScript?
- Fast development velocity
- Excellent async I/O for database and Kubernetes API calls
- Strong typing with TypeScript catches errors early
- Large ecosystem (Kubernetes client, Helm SDK)

### Why PostgreSQL?
- Advisory locks for distributed coordination
- JSON support for flexible schemas
- Battle-tested reliability
- ACID transactions

### Why Kubernetes?
- Industry standard for container orchestration
- Built-in features: health checks, rolling updates, auto-restart
- Declarative infrastructure
- Cloud-agnostic

### Why Helm?
- Parameterized templates
- Community charts available
- Version control for infrastructure
- Easy rollbacks

---

## Future Enhancements

### Short Term (1-2 months)
1. WebSocket events for real-time provisioning status
2. Store templates (pre-configured themes/plugins)
3. Automatic backups to S3
4. Custom domain support

### Medium Term (3-6 months)
1. Multi-region deployment
2. Auto-scaling (scale stores based on traffic)
3. Cost tracking per store
4. Marketplace for themes/plugins

### Long Term (6-12 months)
1. Serverless store instances (Knative)
2. Edge deployment (CDN integration)
3. AI-powered store optimization
4. White-label platform for agencies

---

## Business Value

### For SaaS Platforms
- Launch stores for customers in minutes
- Complete isolation - one customer issue doesn't affect others
- Predictable costs with resource quotas
- Easy to scale from 10 to 10,000 stores

### For Agencies
- Rapid client onboarding
- Consistent infrastructure across clients
- Easy maintenance and updates
- Focus on design/marketing, not DevOps

### Cost Analysis

**Traditional Approach:**
- 2-4 hours manual setup per store
- Developer cost: $50-100/hour
- Total: $100-400 per store

**This Platform:**
- 3 minutes automated setup
- Developer cost: $0 (automated)
- Infrastructure cost: $5-20/month per store
- ROI: Massive at scale

---

## Questions Technical Founders Ask

### Q: Why not serverless (Lambda, Cloud Run)?
**A:** Kubernetes provides:
- Stateful workloads (MySQL)
- Long-running processes
- More control over networking and storage
- But yes, we could add Knative for serverless WordPress

### Q: How do you handle database migrations?
**A:**
- Schema versioning with migration files
- Blue-green deployment for zero downtime
- Automated rollback on migration failure

### Q: What about vendor lock-in?
**A:**
- Pure Kubernetes - runs anywhere (AWS, GCP, Azure, on-prem)
- PostgreSQL - open source
- Helm charts - portable
- Only cloud-specific part: storage (use CSI for portability)

### Q: Security compliance (SOC2, GDPR)?
**A:**
- Audit logs - all API calls tracked
- Data encryption - at rest and in transit
- Data isolation - separate namespace/database per store
- Right to deletion - delete store = delete all data
- Access controls - RBAC ready

### Q: How do you prevent noisy neighbor problems?
**A:**
- Resource quotas per namespace
- Kubernetes limits on CPU/memory
- Network policies for isolation
- Quality of Service classes (burstable, guaranteed)

---

## Closing (30 seconds)

**Summary:**
"To recap: Production-ready Kubernetes platform for automated e-commerce provisioning. Idempotent API, distributed orchestration, complete isolation, scales horizontally. Built in TypeScript, PostgreSQL, Kubernetes, Helm. Ready for SaaS or agency use cases."

**Call to Action:**
"The code is on GitHub. I'm open to feedback, contributions, or discussing how this could be adapted for specific use cases."

**Your Contact:**
"I'm Shruti, CSE student passionate about distributed systems and cloud-native architectures. Let's connect!"

---

## Demo Timing

| Section | Time |
|---------|------|
| Introduction | 0:30 |
| Architecture Overview | 1:00 |
| Live Demo | 4:00 |
| Technical Deep Dive | 2:00 |
| Q&A | 2:30 |
| **Total** | **10:00** |

**3-Minute Version:** Intro + Live Demo only
**5-Minute Version:** Intro + Live Demo + 1 Code Feature
**10-Minute Version:** Everything above

---

## Tips for Delivery

1. **Be Confident** - You built something impressive
2. **Know Your Audience** - Technical founders want depth, not hype
3. **Show, Don't Tell** - Live demo is more powerful than slides
4. **Admit Limitations** - "This doesn't handle X yet" is honest and shows awareness
5. **Be Ready for Questions** - Technical founders will dig deep
6. **Emphasize Learning** - As a student, this shows initiative and skill

Good luck Shruti! You've built something genuinely impressive.
