# Architecture Diagrams

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet / User                              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NGINX Ingress Controller                        │
│                  (Routes based on Host header)                       │
└─────────────┬──────────────────────────────┬────────────────────────┘
              │                               │
              │ platform.local.stores.dev     │ storename.local.stores.dev
              ▼                               ▼
┌─────────────────────────────┐   ┌──────────────────────────────────┐
│   Platform Namespace        │   │   Store Namespace                │
│   (store-platform)          │   │   (store-myshop-abc123)          │
├─────────────────────────────┤   ├──────────────────────────────────┤
│                             │   │                                  │
│  ┌─────────────────────┐   │   │  ┌─────────────────────────┐    │
│  │   Dashboard         │   │   │  │   WordPress Pod          │    │
│  │   (React/NGINX)     │   │   │  │   - WooCommerce          │    │
│  └──────────┬──────────┘   │   │  └──────────┬──────────────┘    │
│             │ /api          │   │             │                    │
│             ▼               │   │             │ mysql://           │
│  ┌─────────────────────┐   │   │             ▼                    │
│  │   API               │   │   │  ┌─────────────────────────┐    │
│  │   (Express)         │   │   │  │   MySQL Pod              │    │
│  └──────────┬──────────┘   │   │  └─────────────────────────┘    │
│             │               │   │             │                    │
│             │ pg://         │   │             │ PVC                │
│             ▼               │   │             ▼                    │
│  ┌─────────────────────┐   │   │  ┌─────────────────────────┐    │
│  │   PostgreSQL        │   │   │  │   PersistentVolume       │    │
│  │   (Metadata)        │   │   │  │   (MySQL Data)           │    │
│  └──────────▲──────────┘   │   │  └─────────────────────────┘    │
│             │               │   │                                  │
│             │ Polls         │   │  ┌─────────────────────────┐    │
│  ┌──────────┴──────────┐   │   │  │   PersistentVolume       │    │
│  │   Orchestrator      │───┼───┼─▶│   (WordPress Files)      │    │
│  │   (Reconciler)      │   │   │  └─────────────────────────┘    │
│  └─────────────────────┘   │   │                                  │
│             │               │   │  ┌─────────────────────────┐    │
│             │ kubectl/helm  │   │  │   Secret                 │    │
│             └───────────────┼───┼─▶│   (MySQL Credentials)    │    │
│                             │   │  └─────────────────────────┘    │
│                             │   │                                  │
│                             │   │  ┌─────────────────────────┐    │
│                             │   │  │   ResourceQuota          │    │
│                             │   │  │   (CPU/RAM/Storage)      │    │
│                             │   │  └─────────────────────────┘    │
└─────────────────────────────┘   └──────────────────────────────────┘
```

## Provisioning Flow Sequence

```
User          Dashboard       API         PostgreSQL    Orchestrator    Kubernetes
 │                │            │               │              │              │
 │  1. Create     │            │               │              │              │
 │   Store Form   │            │               │              │              │
 ├────────────────▶            │               │              │              │
 │                │            │               │              │              │
 │                │ 2. POST    │               │              │              │
 │                │  /api/stores              │              │              │
 │                ├────────────▶               │              │              │
 │                │            │               │              │              │
 │                │            │ 3. INSERT     │              │              │
 │                │            │  (status=     │              │              │
 │                │            │   provisioning)              │              │
 │                │            ├───────────────▶              │              │
 │                │            │               │              │              │
 │                │ 4. Return  │               │              │              │
 │                │   Store    │               │              │              │
 │                │   Object   │               │              │              │
 │                │◀────────────               │              │              │
 │                │            │               │              │              │
 │  5. Show       │            │               │              │              │
 │   "Provisioning"            │               │              │              │
 │◀────────────────            │               │              │              │
 │                │            │               │              │              │
 │                │            │               │ 6. SELECT    │              │
 │                │            │               │  (status=    │              │
 │                │            │               │   provisioning)             │
 │                │            │               │◀──────────────              │
 │                │            │               │              │              │
 │                │            │               │ 7. Found     │              │
 │                │            │               │   Store      │              │
 │                │            │               ├──────────────▶              │
 │                │            │               │              │              │
 │                │            │               │              │ 8. Create    │
 │                │            │               │              │  Namespace   │
 │                │            │               │              ├──────────────▶
 │                │            │               │              │              │
 │                │            │               │              │ 9. Apply     │
 │                │            │               │              │  Quotas      │
 │                │            │               │              ├──────────────▶
 │                │            │               │              │              │
 │                │            │               │              │ 10. Helm     │
 │                │            │               │              │   Install    │
 │                │            │               │              ├──────────────▶
 │                │            │               │              │              │
 │                │            │               │              │ 11. Deploy   │
 │                │            │               │              │   MySQL      │
 │                │            │               │              │◀──────────────
 │                │            │               │              │              │
 │                │            │               │              │ 12. Deploy   │
 │                │            │               │              │   WordPress  │
 │                │            │               │              │◀──────────────
 │                │            │               │              │              │
 │                │            │               │              │ 13. Create   │
 │                │            │               │              │   Ingress    │
 │                │            │               │              │◀──────────────
 │                │            │               │              │              │
 │                │            │               │              │ 14. Pods     │
 │                │            │               │              │   Ready?     │
 │                │            │               │              ├──────────────▶
 │                │            │               │              │              │
 │                │            │               │ 15. UPDATE   │              │
 │                │            │               │  (status=    │              │
 │                │            │               │   ready)     │              │
 │                │            │               │◀──────────────              │
 │                │            │               │              │              │
 │                │ 16. GET    │               │              │              │
 │                │  /api/stores              │              │              │
 │                ├────────────▶               │              │              │
 │                │            │               │              │              │
 │                │            │ 17. SELECT    │              │              │
 │                │            ├───────────────▶              │              │
 │                │            │               │              │              │
 │                │ 18. Return │               │              │              │
 │                │   Stores   │               │              │              │
 │                │   (READY)  │               │              │              │
 │                │◀────────────               │              │              │
 │                │            │               │              │              │
 │  19. Show      │            │               │              │              │
 │   "Ready"      │            │               │              │              │
 │   with URL     │            │               │              │              │
 │◀────────────────            │               │              │              │
```

## Component Interactions

```
┌───────────────────────────────────────────────────────────────┐
│                     Dashboard (React)                          │
│                                                                │
│  - Display stores list                                         │
│  - Create store form                                           │
│  - Delete store button                                         │
│  - Auto-refresh every 5s                                       │
└────────────────────────┬──────────────────────────────────────┘
                         │ REST API
                         │ (GET /api/stores)
                         │ (POST /api/stores)
                         │ (DELETE /api/stores/:id)
                         ▼
┌───────────────────────────────────────────────────────────────┐
│                    Platform API (Express)                      │
│                                                                │
│  Routes:                                                       │
│  - GET /health                                                 │
│  - GET /api/stores                                             │
│  - GET /api/stores/:id                                         │
│  - POST /api/stores                                            │
│  - DELETE /api/stores/:id                                      │
│  - GET /api/stores/:id/events                                 │
│                                                                │
│  Middleware:                                                   │
│  - Rate limiter (global + create store)                        │
│  - Request validator                                           │
│  - Helmet (security headers)                                   │
│  - CORS                                                        │
│                                                                │
│  Controllers:                                                  │
│  - storeController.createStore()                               │
│  - storeController.getStores()                                 │
│  - storeController.deleteStore()                               │
│                                                                │
│  Services:                                                     │
│  - storeService.createStore() → INSERT                         │
│  - storeService.getStores() → SELECT                           │
│  - storeService.updateStoreStatus() → UPDATE                   │
│  - storeService.deleteStore() → UPDATE status='deleting'       │
│  - storeService.addEvent() → INSERT event log                  │
└────────────────────────┬──────────────────────────────────────┘
                         │ PostgreSQL
                         │ (Connection Pool)
                         ▼
┌───────────────────────────────────────────────────────────────┐
│                   PostgreSQL (Metadata DB)                     │
│                                                                │
│  Tables:                                                       │
│  - stores (id, name, engine, status, namespace, urls, ...)    │
│  - store_events (id, store_id, event_type, message, ...)      │
│                                                                │
│  Indexes:                                                      │
│  - idx_stores_user_id                                          │
│  - idx_stores_status                                           │
│  - idx_store_events_store_id                                   │
└────────────────────────▲──────────────────────────────────────┘
                         │ Polls every 5s
                         │ (SELECT WHERE status='provisioning')
                         │ (SELECT WHERE status='deleting')
                         │
┌────────────────────────┴──────────────────────────────────────┐
│               Orchestrator (Reconciliation Loop)               │
│                                                                │
│  Main Loop:                                                    │
│  1. Query DB for provisioning stores                           │
│  2. For each store:                                            │
│     a. Check if namespace exists                               │
│     b. Create namespace if needed                              │
│     c. Apply ResourceQuota + LimitRange                        │
│     d. Helm install WooCommerce chart                          │
│     e. Wait for pods to be ready                               │
│     f. Get ingress URLs                                        │
│     g. Update store status to 'ready'                          │
│  3. Query DB for deleting stores                               │
│  4. For each store:                                            │
│     a. Delete namespace                                        │
│     b. Wait for namespace deletion                             │
│     c. Delete store record from DB                             │
│  5. Sleep 5s, repeat                                           │
│                                                                │
│  Components:                                                   │
│  - reconciler.reconcile()                                      │
│  - provisioner.createNamespace()                               │
│  - provisioner.createResourceQuota()                           │
│  - provisioner.helmInstall()                                   │
│  - provisioner.checkDeploymentReady()                          │
│  - provisioner.deleteNamespace()                               │
└────────────────────────┬──────────────────────────────────────┘
                         │ Kubernetes API
                         │ kubectl / @kubernetes/client-node
                         │ helm CLI
                         ▼
┌───────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Store Namespace (store-myshop-abc123)               │    │
│  │                                                       │    │
│  │  Resources Created by Helm Chart:                    │    │
│  │  - Secret (MySQL credentials)                        │    │
│  │  - PVC (mysql-data, wordpress-data)                  │    │
│  │  - Deployment (MySQL)                                │    │
│  │  - Deployment (WordPress)                            │    │
│  │  - Service (MySQL, ClusterIP)                        │    │
│  │  - Service (WordPress, ClusterIP)                    │    │
│  │  - Ingress (storename.local.stores.dev → WordPress) │    │
│  │  - ResourceQuota (max CPU, RAM, storage)            │    │
│  │  - LimitRange (default/max per container)           │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Resource Hierarchy

```
Kubernetes Cluster
│
├── Namespace: store-platform (Platform)
│   ├── ServiceAccount: store-orchestrator
│   ├── ClusterRole: store-orchestrator (cluster-wide)
│   ├── ClusterRoleBinding: store-orchestrator
│   │
│   ├── Secret: postgres-secret
│   │
│   ├── StatefulSet: postgres
│   │   └── Pod: postgres-0
│   │       └── PVC: postgres-storage-postgres-0
│   │
│   ├── Service: postgres (ClusterIP:5432)
│   │
│   ├── Deployment: platform-api (replicas: 2)
│   │   ├── Pod: platform-api-xxx
│   │   └── Pod: platform-api-yyy
│   │
│   ├── Service: platform-api (ClusterIP:3001)
│   │
│   ├── Deployment: platform-orchestrator (replicas: 1)
│   │   └── Pod: platform-orchestrator-xxx
│   │
│   ├── Deployment: platform-dashboard (replicas: 2)
│   │   ├── Pod: platform-dashboard-xxx
│   │   └── Pod: platform-dashboard-yyy
│   │
│   ├── Service: platform-dashboard (ClusterIP:80)
│   │
│   └── Ingress: platform-ingress
│       └── Rule: platform.local.stores.dev → platform-dashboard:80
│
├── Namespace: store-myshop-abc123 (Store #1)
│   ├── ResourceQuota: store-quota
│   │   └── Limits: 2 CPU, 4Gi RAM, 5 PVCs, 20Gi storage
│   │
│   ├── LimitRange: store-limits
│   │   └── Defaults: 100m CPU, 128Mi RAM per container
│   │
│   ├── Secret: abc123-mysql-secret
│   │
│   ├── PVC: abc123-mysql-pvc (5Gi)
│   ├── PVC: abc123-wordpress-pvc (5Gi)
│   │
│   ├── Deployment: abc123-mysql (replicas: 1)
│   │   └── Pod: abc123-mysql-xxx
│   │       └── VolumeMount: /var/lib/mysql → abc123-mysql-pvc
│   │
│   ├── Service: abc123-mysql (ClusterIP:3306)
│   │
│   ├── Deployment: abc123-wordpress (replicas: 1)
│   │   └── Pod: abc123-wordpress-xxx
│   │       ├── VolumeMount: /var/www/html → abc123-wordpress-pvc
│   │       └── Env: WORDPRESS_DB_HOST=abc123-mysql:3306
│   │
│   ├── Service: abc123-wordpress (ClusterIP:80)
│   │
│   └── Ingress: abc123-ingress
│       └── Rule: myshop.local.stores.dev → abc123-wordpress:80
│
└── Namespace: store-teststore-def456 (Store #2)
    └── [Same structure as Store #1]
```

## Data Model

```
┌─────────────────────────────────────────────────────────────┐
│  stores                                                      │
├─────────────────────────────────────────────────────────────┤
│  id                VARCHAR(36) PRIMARY KEY                   │
│  name              VARCHAR(255) NOT NULL                     │
│  engine            VARCHAR(50) NOT NULL  ('woocommerce'/'medusa')│
│  status            VARCHAR(50) NOT NULL  ('provisioning'/'ready'/'failed'/'deleting')│
│  namespace         VARCHAR(255) UNIQUE NOT NULL              │
│  urls              TEXT (JSON array of URLs)                 │
│  created_at        TIMESTAMP DEFAULT NOW()                   │
│  updated_at        TIMESTAMP DEFAULT NOW()                   │
│  user_id           VARCHAR(255) DEFAULT 'default-user'       │
│  error_message     TEXT                                      │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ 1:N
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  store_events                                                │
├─────────────────────────────────────────────────────────────┤
│  id                SERIAL PRIMARY KEY                        │
│  store_id          VARCHAR(36) REFERENCES stores(id)         │
│  event_type        VARCHAR(100) NOT NULL                     │
│  message           TEXT                                      │
│  created_at        TIMESTAMP DEFAULT NOW()                   │
└─────────────────────────────────────────────────────────────┘

Event Types:
- created
- namespace_created
- helm_installed
- provisioning_failed
- store_ready
- deleting
- namespace_deleted
```

## Deployment Strategy

```
Local Development (Kind/k3d/Minikube)
├── Build: docker build -t platform-api:latest ./backend
├── Load: kind load docker-image platform-api:latest
├── Deploy: helm install -f values-local.yaml
└── Access: http://platform.local.stores.dev (via /etc/hosts)

Production (VPS with k3s)
├── Build: docker build -t registry.io/platform-api:v1.0 ./backend
├── Push: docker push registry.io/platform-api:v1.0
├── Deploy: helm install -f values-prod.yaml
└── Access: https://platform.yourdomain.com (via DNS + TLS)

Differences (values file only):
- Domain: .local.stores.dev → .yourdomain.com
- TLS: false → true (cert-manager)
- Storage: standard → local-path
- Replicas: 1-2 → 2-3
- Resources: lower → higher
- Image pull policy: IfNotPresent → Always
```

## Security Layers

```
┌───────────────────────────────────────────────────────────────┐
│  Layer 1: Network (Ingress)                                   │
│  - Only dashboard and store URLs exposed                      │
│  - API, database, orchestrator are internal                   │
│  - Optional: NetworkPolicy for deny-by-default                │
└───────────────────────────────────────────────────────────────┘
                         │
┌───────────────────────────────────────────────────────────────┐
│  Layer 2: Authentication & Authorization                       │
│  - (Future) User authentication (JWT/OAuth)                   │
│  - RBAC: Orchestrator service account with minimal perms      │
│  - Per-user store limits (max 10 stores)                      │
└───────────────────────────────────────────────────────────────┘
                         │
┌───────────────────────────────────────────────────────────────┐
│  Layer 3: Rate Limiting                                        │
│  - Global: 100 req/15min per IP                               │
│  - Create store: 10 req/15min per IP                          │
└───────────────────────────────────────────────────────────────┘
                         │
┌───────────────────────────────────────────────────────────────┐
│  Layer 4: Resource Isolation                                   │
│  - Namespace per store                                         │
│  - ResourceQuota (CPU, RAM, storage)                          │
│  - LimitRange (per-container limits)                          │
│  - Separate Secrets                                           │
└───────────────────────────────────────────────────────────────┘
                         │
┌───────────────────────────────────────────────────────────────┐
│  Layer 5: Container Security                                   │
│  - Run as non-root user                                        │
│  - Official base images                                        │
│  - Read-only root filesystem (where possible)                 │
│  - fsGroup for volume permissions                             │
└───────────────────────────────────────────────────────────────┘
                         │
┌───────────────────────────────────────────────────────────────┐
│  Layer 6: Secrets Management                                   │
│  - Kubernetes Secrets (base64 encoded)                        │
│  - Environment variable injection                             │
│  - No secrets in source code                                  │
│  - (Prod) External secret manager (Vault, Sealed Secrets)    │
└───────────────────────────────────────────────────────────────┘
```

## Scaling Architecture

```
Before Scaling (Local)
┌──────────────────────────────┐
│  API (2 replicas)            │
│  Dashboard (2 replicas)      │
│  Orchestrator (1 replica)    │
│  PostgreSQL (1 replica)      │
└──────────────────────────────┘

After Scaling (Production)
┌──────────────────────────────┐
│  API (5+ replicas)           │  ← Horizontal scaling
│  Dashboard (5+ replicas)     │  ← Horizontal scaling
│  Orchestrator (2 replicas)   │  ← Can scale with locking
│  PostgreSQL → RDS/Cloud SQL  │  ← Managed database
└──────────────────────────────┘

Store-level Scaling (Future)
┌──────────────────────────────┐
│  WordPress (2+ replicas)     │  ← Needs shared storage
│  MySQL (1 replica)           │  ← Single-master constraint
│  Redis (for session)         │  ← Shared session store
└──────────────────────────────┘
```

This architecture provides a solid foundation for a production Kubernetes store provisioning platform with clear separation of concerns, strong isolation, and room for future enhancements.
