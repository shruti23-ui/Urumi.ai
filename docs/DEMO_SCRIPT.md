# Demo Video Script

This script covers all requirements from the assessment.

## Introduction (30 seconds)

"Hi, I'm demonstrating a Kubernetes-based store provisioning platform that allows users to create and manage WooCommerce stores through a web dashboard. The system runs on local Kubernetes using Kind, but can deploy to production VPS with k3s using the same Helm charts."

## 1. System Design & Implementation (3-4 minutes)

### Architecture Overview

"Let me show you the architecture:"

**Open [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md)**

"The platform has four main components:

1. **Platform API** - REST API built with Express that handles store CRUD operations
2. **Orchestrator** - A controller that watches the database and provisions stores using Helm
3. **Dashboard** - React frontend where users manage their stores
4. **PostgreSQL** - Stores metadata about each store

Let me show you the code structure:"

```bash
ls -la
cd backend/src
ls -la controllers services models
cd ../../orchestrator/src
ls -la services k8s
```

"The backend API validates requests, enforces rate limits, and stores records in PostgreSQL. The orchestrator polls the database every 5 seconds, finds stores with 'provisioning' status, creates a namespace, applies resource quotas, and installs the Helm chart."

### End-to-End Flow

**Open diagram or whiteboard**

"Here's the complete flow:
1. User creates store via dashboard
2. API saves record with status 'provisioning'
3. Orchestrator polls database, finds new store
4. Creates namespace `store-myshop-abc123`
5. Applies resource quotas (max 2 CPU, 4Gi RAM)
6. Installs WooCommerce Helm chart (WordPress + MySQL)
7. Waits for pods to be ready
8. Updates status to 'ready' with ingress URL
9. User accesses store"

**Show actual code:**
```bash
# Show orchestrator reconcile logic
cat orchestrator/src/services/reconciler.ts | head -50

# Show Helm chart
ls helm-charts/woocommerce-store/
cat helm-charts/woocommerce-store/values.yaml
```

## 2. Live Demo (5-6 minutes)

### Platform is Running

```bash
kubectl get pods -n store-platform
kubectl get all -n store-platform
```

"You can see the platform components:
- PostgreSQL (database)
- platform-api (2 replicas)
- platform-orchestrator
- platform-dashboard (2 replicas)"

### Create Store

**Open dashboard:** http://platform.local.stores.dev

"Let me create a new store called 'Demo Shop'."

*Fill form and click create*

"The request hits the API, which saves it to PostgreSQL."

**Show API logs:**
```bash
kubectl logs -n store-platform deployment/platform-api --tail=20 -f
```

"You can see the store creation request logged."

**Show orchestrator logs:**
```bash
kubectl logs -n store-platform deployment/platform-orchestrator --tail=30 -f
```

"The orchestrator found the new store and is provisioning it. It's creating the namespace, applying quotas, and installing the Helm chart."

**Show namespace being created:**
```bash
kubectl get namespaces | grep store-
kubectl get all -n <store-namespace>
```

"You can see:
- MySQL pod starting
- WordPress pod waiting for MySQL
- PVCs for persistent storage
- Services for internal communication
- Ingress for external access"

**Wait for store to be ready** (speed up video if needed)

"After about 2-3 minutes, the store is ready."

### Access Store

**Click store URL in dashboard**

"The store is accessible via ingress. Let me complete the WordPress setup."

*Complete WordPress wizard - speed up video*

*Install WooCommerce plugin - speed up video*

### Place Order

"Now let me add a product and place an order to demonstrate it's a fully functional store."

*Add product*
*Go to storefront*
*Add to cart*
*Checkout with COD*
*Complete order*

**Show order in admin:**

"Perfect! The order is recorded in WooCommerce admin. This proves the store is fully functional."

### Delete Store

**Go back to dashboard**

"Now let me delete the store to show cleanup."

*Click delete button*

**Show namespace being deleted:**
```bash
kubectl get namespace <store-namespace>
# Shows terminating
watch kubectl get namespace <store-namespace>
# Eventually disappears
```

"All resources are cleanly removed - pods, services, PVCs, ingress, secrets."

## 3. Isolation, Resources, Reliability (3-4 minutes)

### Isolation

**Show namespace:**
```bash
kubectl get namespace <store-namespace> -o yaml
```

"Each store gets its own namespace with labels for management."

**Show resource quota:**
```bash
kubectl get resourcequota -n <store-namespace> -o yaml
```

"Resource quotas prevent one store from consuming all cluster resources:
- Max 2 CPU request, 4 CPU limit
- Max 4Gi RAM request, 8Gi RAM limit
- Max 5 PVCs, 20Gi total storage"

**Show limit range:**
```bash
kubectl get limitrange -n <store-namespace> -o yaml
```

"Limit ranges set defaults for containers:
- Default 100m CPU, 128Mi RAM
- Max 2 CPU, 2Gi RAM per container"

**Show PVCs:**
```bash
kubectl get pvc -n <store-namespace>
```

"Persistent storage ensures data survives pod restarts."

**Show secrets:**
```bash
kubectl get secrets -n <store-namespace>
kubectl describe secret <mysql-secret> -n <store-namespace>
```

"Secrets are isolated per store - MySQL passwords are unique."

### Requests/Limits and Guardrails

**Show pod resource configuration:**
```bash
kubectl get pod <wordpress-pod> -n <store-namespace> -o yaml | grep -A 10 resources
```

"Every pod has requests and limits configured. This ensures:
- Scheduler knows resource requirements
- QoS guarantees (burstable or guaranteed)
- No resource exhaustion"

**Show platform-level quotas:**
```bash
cat helm-charts/platform/values.yaml | grep -A 5 resources
```

"Platform components also have limits - API, orchestrator, dashboard all have proper resource configuration."

### Idempotency and Failure Handling

**Show orchestrator code:**
```bash
cat orchestrator/src/k8s/provisioner.ts | grep -A 10 "namespaceExists"
```

"The orchestrator checks if resources exist before creating:
- If namespace exists, skip creation
- If Helm release exists, skip installation
- This makes provisioning idempotent - safe to retry"

**Show failure handling:**
```bash
cat orchestrator/src/services/reconciler.ts | grep -A 15 "catch"
```

"If provisioning fails:
- Error is caught and logged
- Store status set to 'failed' with error message
- Other stores continue processing
- User can delete and retry"

**Show event log:**
```bash
kubectl exec -it postgres-0 -n store-platform -- psql -U postgres -d store_platform -c "SELECT * FROM store_events WHERE store_id='<id>' ORDER BY created_at DESC LIMIT 10;"
```

"All actions are logged for audit trail:
- Store created
- Namespace created
- Helm installed
- Store ready
- Store deleted"

### Cleanup Guarantees

"When a store is deleted:
1. Status set to 'deleting'
2. Orchestrator deletes entire namespace
3. Kubernetes cascading delete removes all resources
4. Database record removed only after namespace is gone
5. Orphaned resources can be manually cleaned"

**Show cleanup code:**
```bash
cat orchestrator/src/services/reconciler.ts | grep -A 20 "reconcileDeleting"
```

## 4. Security Posture (2-3 minutes)

### Secret Handling

**Show secrets management:**
```bash
# Platform secrets
kubectl get secret postgres-secret -n store-platform -o yaml

# Store secrets
kubectl get secret <mysql-secret> -n <store-namespace> -o yaml
```

"Secrets are:
- Stored in Kubernetes Secret objects (base64 encoded)
- Not hardcoded in source code
- Generated per-store for isolation
- Can be integrated with external secret managers (Vault, Sealed Secrets)"

**Show environment variable injection:**
```bash
cat helm-charts/platform/templates/platform-deployments.yaml | grep -A 5 "secretKeyRef"
```

"Secrets injected as environment variables, not in config files."

### RBAC / Least Privilege

**Show service account:**
```bash
kubectl get serviceaccount -n store-platform
kubectl describe serviceaccount store-orchestrator -n store-platform
```

**Show ClusterRole:**
```bash
kubectl get clusterrole store-orchestrator -o yaml
```

"The orchestrator service account has minimal permissions:
- Create/read/update/delete: namespaces, pods, services, deployments, ingresses
- Only what's needed for store provisioning
- No access to kube-system or other sensitive namespaces"

**Show ClusterRoleBinding:**
```bash
kubectl get clusterrolebinding store-orchestrator -o yaml
```

"Service account bound to ClusterRole via ClusterRoleBinding."

### What's Exposed Publicly vs Internal

**Show ingress:**
```bash
kubectl get ingress --all-namespaces
```

"Publicly exposed via Ingress:
- Platform dashboard (http://platform.local.stores.dev)
- Each store (http://storename.local.stores.dev)

Internal-only (ClusterIP services):
- PostgreSQL
- Platform API (proxied by dashboard nginx)
- MySQL per store
- Orchestrator (no service, just runs)"

### Container Hardening

**Show Dockerfile:**
```bash
cat backend/Dockerfile
```

"Container security:
- Use official base images (node:20-alpine)
- Run as non-root user (nodejs:1001)
- Minimal attack surface (alpine, only production deps)
- No shell in production images"

**Show pod security context:**
```bash
cat helm-charts/woocommerce-store/templates/wordpress-deployment.yaml | grep -A 5 securityContext
```

"Pods run with:
- fsGroup for volume permissions
- Non-root where possible
- Read-only root filesystem (where applicable)"

## 5. Horizontal Scaling Plan (2-3 minutes)

### What Scales Horizontally

**Show current replicas:**
```bash
kubectl get deployments -n store-platform
```

"Currently:
- API: 2 replicas (stateless, can scale to N)
- Dashboard: 2 replicas (static files, can scale to N)
- Orchestrator: 1 replica (can run multiple with database locking)
- PostgreSQL: 1 replica (stateful, use managed DB for prod)"

**Scale API:**
```bash
kubectl scale deployment platform-api --replicas=5 -n store-platform
kubectl get pods -n store-platform -l app=platform-api
```

"API scales horizontally because:
- Stateless (no local state)
- Database connection pool
- Load balanced by service"

**Scale dashboard:**
```bash
kubectl scale deployment platform-dashboard --replicas=5 -n store-platform
```

"Dashboard scales because it's just static files served by NGINX."

### Provisioning Throughput

"Current provisioning is sequential (one store at a time):
- Orchestrator processes stores one by one
- Average: 2-5 minutes per store
- Throughput: ~12-30 stores per hour

To increase throughput:
1. **Worker pool** - Process N stores concurrently
2. **Multiple orchestrators** - Shard by store ID
3. **Kubernetes Jobs** - One Job per store (better parallelism)
4. **Faster Helm** - Pre-pull images, use faster storage"

**Show code for future enhancement:**
```bash
cat docs/SYSTEM_DESIGN.md | grep -A 10 "Sequential Store Provisioning"
```

### Stateful Constraints

"Stateful components that don't scale:
- PostgreSQL: Single StatefulSet (use RDS/Cloud SQL for prod)
- MySQL per store: Single pod (WooCommerce limitation)
- PVCs: ReadWriteOnce (single node)

For multi-node clusters:
- Use ReadWriteMany storage for shared PVCs
- Or use managed databases
- Or accept single-pod MySQL constraint"

## 6. Abuse Prevention (2-3 minutes)

### Rate Limiting / Quotas

**Show rate limiter code:**
```bash
cat backend/src/middleware/rateLimiter.ts
```

"Rate limits:
- Global: 100 requests per 15 min per IP
- Store creation: 10 requests per 15 min per IP
- Implemented with express-rate-limit"

**Show per-user quota:**
```bash
cat backend/src/controllers/storeController.ts | grep -A 5 "MAX_STORES_PER_USER"
```

"Users limited to 10 stores (configurable via env var)."

**Test rate limit:**
*Make multiple rapid requests via dashboard or curl*

"After 10 requests, you get a 429 error."

### Blast-Radius Controls

**Show resource quotas:**
```bash
kubectl get resourcequota -n <store-namespace> -o yaml
```

"Per-store resource quotas prevent:
- CPU exhaustion (max 2 CPU)
- Memory exhaustion (max 4Gi)
- Storage exhaustion (max 20Gi)
- PVC proliferation (max 5 PVCs)"

**Show Helm timeout:**
```bash
cat orchestrator/src/k8s/provisioner.ts | grep -A 3 "timeout"
```

"Helm installs timeout after 10 minutes to prevent hanging."

### Audit Trail / Logging

**Show event log:**
```bash
kubectl exec -it postgres-0 -n store-platform -- psql -U postgres -d store_platform -c "SELECT store_id, event_type, message, created_at FROM store_events ORDER BY created_at DESC LIMIT 20;"
```

"All actions logged:
- Who created what store
- When it was created
- Status changes
- Errors
- Deletions

This provides:
- Accountability
- Debugging info
- Usage analytics
- Security audit trail"

## 7. Local-to-VPS Production Story (3-4 minutes)

### Differences Between Local and Prod

**Show values files:**
```bash
# Local values
cat helm-charts/platform/values-local.yaml

# Production values
cat helm-charts/platform/values-prod.yaml
```

"Key differences:
- **Domain**: `.local.stores.dev` → `.yourdomain.com`
- **TLS**: Disabled → Enabled (cert-manager)
- **Storage class**: `standard` → `local-path`
- **Replicas**: Lower → Higher
- **Resources**: Smaller → Larger
- **Image pull policy**: IfNotPresent → Always"

**Show WooCommerce store values:**
```bash
diff helm-charts/woocommerce-store/values-local.yaml helm-charts/woocommerce-store/values-prod.yaml
```

### Ingress Strategy

"Local ingress:
- NGINX Ingress Controller
- HTTP only
- /etc/hosts for DNS

Production ingress:
- k3s Traefik (default) or NGINX
- HTTPS with Let's Encrypt
- Real DNS (A records)
- cert-manager for TLS automation"

### Domains Strategy

"Local:
- Wildcard: `*.local.stores.dev` in /etc/hosts
- No DNS server needed

Production:
- Wildcard DNS: `*.yourdomain.com A <VPS-IP>`
- Automatic subdomain routing
- Optional: Custom domains per store"

### Storage Strategy

"Local:
- Kind uses local path storage
- Storage class: `standard`
- PVs backed by host filesystem

Production:
- k3s uses local-path provisioner
- Storage class: `local-path`
- Or use external storage (Longhorn, Ceph, cloud storage)"

### Secrets Strategy

"Local:
- Helm values contain secrets (dev only!)
- Kubernetes Secrets

Production:
- External secrets manager (Vault, AWS Secrets Manager)
- Or Sealed Secrets (encrypted in git)
- Or Kubernetes native with encryption at rest
- NEVER commit secrets to git"

### Upgrade/Rollback Approach

**Show Helm upgrade:**
```bash
# Upgrade platform
helm upgrade store-platform ./helm-charts/platform \
  --values ./helm-charts/platform/values-prod.yaml \
  --set api.image.tag=v1.1.0

# Check history
helm history store-platform -n store-platform

# Rollback
helm rollback store-platform -n store-platform
```

"Helm provides:
- Version control for releases
- Rollback to previous version
- Upgrade strategy (rolling update)
- Atomic deployments (all or nothing)"

### Production Deployment Demo

"To deploy on a VPS:

1. Install k3s:
   ```bash
   curl -sfL https://get.k3s.io | sh -
   ```

2. Copy kubeconfig and set VPS IP

3. Push images to registry or copy to VPS

4. Update values-prod.yaml with your domain

5. Deploy:
   ```bash
   helm install store-platform ./helm-charts/platform \
     --values ./helm-charts/platform/values-prod.yaml
   ```

6. Configure DNS: `platform.yourdomain.com A <VPS-IP>`

7. Access: https://platform.yourdomain.com

Same code, same charts, just different values!"

## Conclusion (30 seconds)

"To summarize:
- The platform provisions isolated WooCommerce stores on Kubernetes
- Users manage stores via web dashboard
- Each store gets dedicated namespace with resource quotas
- Strong security with RBAC, secrets management, and container hardening
- Scales horizontally for API and dashboard
- Same Helm charts for local and production
- Complete with rate limiting, audit logging, and abuse prevention

The system is production-ready for small to medium scale. For larger scale, implement the enhancements outlined in the system design document.

Thank you for watching!"

## Time Budget

- Introduction: 0:30
- System design: 3:00
- Live demo: 5:00
- Isolation/resources: 3:00
- Security: 2:30
- Scaling: 2:30
- Abuse prevention: 2:00
- Local-to-prod: 3:00
- Conclusion: 0:30

**Total: ~22 minutes**

Adjust based on depth needed. Can speed up WordPress setup and order placement with video editing.
