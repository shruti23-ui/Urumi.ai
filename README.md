# Kubernetes Store Provisioning Platform

A production-ready platform for provisioning and managing WooCommerce and MedusaJS ecommerce stores on Kubernetes. Built with Helm for local development (Kind/k3d/Minikube) and production deployment (k3s on VPS).

## Documentation

**Start Here:**
1. **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Verification checklist, what's changed, testing guide
2. **[DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** - Phase-by-phase development plan (Phase 0-5)
3. **[QUICKSTART.md](QUICKSTART.md)** - Quick local setup guide

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Production Setup (VPS/k3s)](#production-setup-vpsk3s)
- [Creating and Testing a Store](#creating-and-testing-a-store)
- [Architecture Details](#architecture-details)
- [Security](#security)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Architecture

The platform consists of:

1. **Platform API** - REST API for store management (Node.js/Express)
2. **Orchestrator** - Kubernetes controller that provisions stores using Helm
3. **Dashboard** - React web UI for users to manage stores
4. **PostgreSQL** - Platform database for store metadata
5. **Store Helm Charts** - Templates for WooCommerce and MedusaJS stores

### Flow

```
User (Dashboard) → API → Database → Orchestrator → Kubernetes (Helm) → Store Pods
```

1. User creates store via Dashboard
2. API saves store record with status "provisioning"
3. Orchestrator polls database, finds new store
4. Orchestrator creates namespace, applies resource quotas, installs Helm chart
5. Store pods start, readiness checks pass
6. Orchestrator updates status to "ready" with URLs
7. User accesses store via Ingress

## Features

- **Multi-store isolation** - Each store in its own namespace with resource quotas
- **WooCommerce support** - Full WordPress + WooCommerce + MySQL stack
- **MedusaJS support** - Ready for implementation (architecture supports it)
- **Persistent storage** - Database and application data persisted
- **Ingress routing** - HTTP access with stable URLs
- **Health checks** - Liveness and readiness probes
- **Clean teardown** - Delete store removes all resources
- **Abuse prevention** - Rate limiting, per-user quotas, resource limits
- **RBAC** - Least privilege access for orchestrator
- **Local to prod** - Same Helm charts, different values files

## Prerequisites

### Local Development
- Docker Desktop or similar
- Kubernetes cluster (Kind, k3d, or Minikube)
- kubectl configured
- Helm 3.x
- Node.js 20+ (for local development)
- npm or yarn

### Production (VPS)
- VPS with k3s installed
- kubectl configured to access k3s
- Helm 3.x
- Domain name with DNS configured
- (Optional) cert-manager for TLS

## Local Setup

### Step 1: Create Local Kubernetes Cluster

**Using Kind:**
```bash
kind create cluster --name store-platform

# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

**Using k3d:**
```bash
k3d cluster create store-platform --port "80:80@loadbalancer" --port "443:443@loadbalancer"
```

**Using Minikube:**
```bash
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
```

### Step 2: Configure Local DNS

Add these entries to your `/etc/hosts` file (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```
127.0.0.1 platform.local.stores.dev
127.0.0.1 teststore.local.stores.dev
127.0.0.1 myshop.local.stores.dev
```

### Step 3: Build Docker Images

```bash
# Build backend API
cd backend
docker build -t platform-api:latest .

# Build orchestrator
cd ../orchestrator
docker build -t platform-orchestrator:latest .

# Build dashboard
cd ../frontend
docker build -t platform-dashboard:latest .
```

**For Kind, load images into cluster:**
```bash
kind load docker-image platform-api:latest --name store-platform
kind load docker-image platform-orchestrator:latest --name store-platform
kind load docker-image platform-dashboard:latest --name store-platform
```

### Step 4: Deploy Platform

```bash
# Deploy platform components
helm install store-platform ./helm-charts/platform \
  --values ./helm-charts/platform/values-local.yaml \
  --create-namespace

# Wait for platform to be ready
kubectl wait --namespace store-platform \
  --for=condition=ready pod \
  --selector=app=platform-api \
  --timeout=300s
```

### Step 5: Verify Installation

```bash
# Check all pods are running
kubectl get pods -n store-platform

# Check ingress
kubectl get ingress -n store-platform

# Access dashboard
open http://platform.local.stores.dev
```

## Production Setup (VPS/k3s)

### Step 1: Install k3s on VPS

```bash
# On your VPS
curl -sfL https://get.k3s.io | sh -

# Copy kubeconfig to local machine
scp root@your-vps:/etc/rancher/k3s/k3s.yaml ~/.kube/config-vps

# Edit kubeconfig and replace 127.0.0.1 with your VPS IP
sed -i 's/127.0.0.1/YOUR_VPS_IP/g' ~/.kube/config-vps

# Set KUBECONFIG
export KUBECONFIG=~/.kube/config-vps
```

### Step 2: Configure DNS

Point your domain to your VPS IP:
```
platform.yourdomain.com  A  YOUR_VPS_IP
*.yourdomain.com         A  YOUR_VPS_IP
```

### Step 3: (Optional) Install cert-manager for TLS

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

### Step 4: Build and Push Images

```bash
# Tag and push to your container registry
docker tag platform-api:latest your-registry/platform-api:latest
docker tag platform-orchestrator:latest your-registry/platform-orchestrator:latest
docker tag platform-dashboard:latest your-registry/platform-dashboard:latest

docker push your-registry/platform-api:latest
docker push your-registry/platform-orchestrator:latest
docker push your-registry/platform-dashboard:latest
```

Or copy images directly to VPS:
```bash
docker save platform-api:latest | ssh root@your-vps 'ctr -n k8s.io image import -'
docker save platform-orchestrator:latest | ssh root@your-vps 'ctr -n k8s.io image import -'
docker save platform-dashboard:latest | ssh root@your-vps 'ctr -n k8s.io image import -'
```

### Step 5: Update Production Values

Edit `helm-charts/platform/values-prod.yaml`:
```yaml
ingress:
  host: "platform.yourdomain.com"

api:
  env:
    DEFAULT_DOMAIN_SUFFIX: ".yourdomain.com"

orchestrator:
  env:
    DEFAULT_DOMAIN_SUFFIX: ".yourdomain.com"
```

### Step 6: Deploy to Production

```bash
helm install store-platform ./helm-charts/platform \
  --values ./helm-charts/platform/values-prod.yaml \
  --create-namespace
```

### Step 7: Verify Production Deployment

```bash
kubectl get pods -n store-platform
kubectl get ingress -n store-platform

# Access dashboard
open https://platform.yourdomain.com
```

## Creating and Testing a Store

### Step 1: Create Store via Dashboard

1. Open dashboard: `http://platform.local.stores.dev` (local) or `https://platform.yourdomain.com` (prod)
2. Fill in the form:
   - **Store Name**: "Test Store"
   - **Engine**: "WooCommerce"
3. Click "Create Store"
4. Wait for status to change from "PROVISIONING" to "READY" (2-5 minutes)

### Step 2: Access Store

Once ready, click the store URL shown in the dashboard.

### Step 3: Complete WooCommerce Setup

1. Open the store URL
2. Follow WordPress installation wizard:
   - Choose language
   - Create admin user
   - Set site title
3. WordPress will install automatically
4. Install WooCommerce plugin:
   - Go to Plugins → Add New
   - Search "WooCommerce"
   - Install and activate

### Step 4: Add a Product

1. Go to WooCommerce → Products → Add New
2. Add product details:
   - Name: "Test Product"
   - Price: $10
   - Mark as "In Stock"
3. Click "Publish"

### Step 5: Test Order Flow

1. Open storefront (your store URL)
2. Add product to cart
3. Go to checkout
4. Fill in details
5. Choose "Cash on Delivery" as payment method
6. Place order
7. Verify order in WooCommerce admin (WooCommerce → Orders)

**Order flow is complete if you can see the order in admin!**

### Step 6: Delete Store

1. Go back to platform dashboard
2. Click "Delete Store"
3. Confirm deletion
4. Store and all resources will be cleaned up

## Architecture Details

### Component Responsibilities

**Platform API (port 3001)**
- Exposes REST endpoints for store CRUD
- Validates requests, enforces rate limits
- Stores metadata in PostgreSQL
- Tracks store status and events

**Orchestrator**
- Polls database every 5 seconds for pending stores
- Creates Kubernetes namespace with resource quotas
- Installs Helm chart for store engine
- Monitors deployment readiness
- Updates store status and URLs
- Handles store deletion and cleanup

**Dashboard (port 80/443)**
- React SPA served by NGINX
- Auto-refreshes store list every 5 seconds
- Displays store status, URLs, events
- Proxies API calls to backend

**PostgreSQL**
- Stores store records (id, name, engine, status, namespace, urls, timestamps)
- Stores event log for audit trail
- Indexed for fast queries

### Store Isolation

Each store gets:
- **Dedicated namespace** (e.g., `store-myshop-a1b2c3d4`)
- **Resource quota**: max 2 CPU, 4Gi RAM, 5 PVCs, 20Gi storage
- **Limit range**: default 100m CPU / 128Mi RAM per container, max 2 CPU / 2Gi RAM
- **Network policy** (optional): deny-by-default with explicit allows
- **Secrets**: isolated MySQL credentials

### Idempotency

- Orchestrator checks if namespace exists before creating
- Helm installs are idempotent (use `--wait` flag)
- If orchestrator restarts mid-provisioning, it recovers by checking existing resources
- Store creation requests are safe to retry (unique namespace prevents duplicates)

### Failure Handling

- If Helm install fails, status is set to "failed" with error message
- Failed stores don't block other provisioning
- User can delete failed store and try again
- Orchestrator logs all errors for debugging

## Security

### Secrets Management

- **Database passwords** stored in Kubernetes Secrets (not hardcoded)
- **MySQL passwords** generated per-store, stored in Secret
- **No secrets in source code** (use `.env` files, not committed)

### RBAC

Orchestrator service account has:
- Cluster-level permissions for namespace/deployment/ingress management
- Least privilege (no unnecessary access)
- Defined in ClusterRole and ClusterRoleBinding

```yaml
apiGroups: ["", "apps", "networking.k8s.io", "rbac.authorization.k8s.io"]
resources: [namespaces, pods, services, deployments, ingresses, secrets, etc.]
verbs: [get, list, watch, create, update, patch, delete]
```

### Container Security

- Run containers as non-root where possible
- Use official images (WordPress, MySQL, Postgres, NGINX)
- Set resource limits to prevent resource exhaustion
- Use `fsGroup` for volume permissions

### Abuse Prevention

1. **Rate limiting**:
   - Global: 100 requests per 15 minutes per IP
   - Store creation: 10 requests per 15 minutes per IP
2. **Per-user quotas**:
   - Max 10 stores per user (configurable via `MAX_STORES_PER_USER`)
3. **Resource quotas**:
   - Max 2 CPU, 4Gi RAM per store namespace
   - Max 5 PVCs, 20Gi storage per store
4. **Timeout**:
   - Helm install timeout: 10 minutes (prevents hanging)
5. **Audit log**:
   - All store events logged to database (created, provisioning_failed, deleted, etc.)

### Network Security

Optional: Add Network Policies to deny-by-default and explicitly allow:
- Store pods can talk to MySQL
- MySQL can only be accessed by store pods
- External access via Ingress only

## Scaling

### Horizontal Scaling

**What scales:**
- API: Increase replicas (already 2 in local, 3 in prod)
- Dashboard: Increase replicas (already 2 in local, 3 in prod)
- Orchestrator: Can run 2+ replicas (uses database locking to prevent conflicts)

**What doesn't scale horizontally:**
- PostgreSQL: Single StatefulSet (use managed DB for prod)
- MySQL per store: Single replica (WooCommerce doesn't support multi-master)

**How to scale:**
```bash
# Scale API to 5 replicas
kubectl scale deployment platform-api --replicas=5 -n store-platform

# Scale dashboard to 5 replicas
kubectl scale deployment platform-dashboard --replicas=5 -n store-platform
```

### Provisioning Throughput

- Orchestrator processes stores sequentially (one at a time)
- Average provisioning time: 2-5 minutes per store
- To increase throughput:
  - Run multiple orchestrator replicas
  - Implement worker pool pattern (process N stores concurrently)
  - Use Kubernetes Jobs instead of polling loop

### Stateful Constraints

- PostgreSQL is stateful (use managed DB for prod: RDS, Cloud SQL, etc.)
- MySQL per store is stateful (PVC required)
- PVCs are ReadWriteOnce (single node only)
- For multi-node clusters, ensure stores can schedule on any node

## Local to Production Changes

What changes between local and prod via Helm values:

| Aspect | Local | Production |
|--------|-------|------------|
| Ingress host | `*.local.stores.dev` | `*.yourdomain.com` |
| TLS | Disabled | Enabled (cert-manager) |
| Storage class | `standard` | `local-path` |
| Replicas | 1-2 | 2-3 |
| Resources | Lower requests/limits | Higher requests/limits |
| Image pull policy | IfNotPresent | Always |
| Secrets | Generated | Managed (external secrets) |
| Database | In-cluster Postgres | Managed DB (optional) |

**No code changes required!** Just use different values file:
```bash
# Local
helm install -f values-local.yaml

# Prod
helm install -f values-prod.yaml
```

## Troubleshooting

### Store stuck in "Provisioning"

```bash
# Check orchestrator logs
kubectl logs -n store-platform deployment/platform-orchestrator

# Check store namespace
kubectl get all -n <store-namespace>

# Check store pods
kubectl describe pod <pod-name> -n <store-namespace>

# Check Helm release
helm list -n <store-namespace>
```

### Can't access dashboard

```bash
# Check ingress
kubectl get ingress -n store-platform

# Check dashboard pods
kubectl get pods -n store-platform -l app=platform-dashboard

# Check /etc/hosts has correct entry
cat /etc/hosts | grep platform.local.stores.dev
```

### Database connection errors

```bash
# Check postgres pod
kubectl get pods -n store-platform -l app=postgres

# Check database secret
kubectl get secret postgres-secret -n store-platform -o yaml

# Check API logs
kubectl logs -n store-platform deployment/platform-api
```

### Store won't delete

```bash
# Check orchestrator is running
kubectl get pods -n store-platform -l app=platform-orchestrator

# Manually delete namespace if stuck
kubectl delete namespace <store-namespace> --grace-period=0 --force

# Delete store record from database
kubectl exec -it postgres-0 -n store-platform -- psql -U postgres -d store_platform -c "DELETE FROM stores WHERE id='<store-id>';"
```

### Images not found in Kind

```bash
# Load images into Kind cluster
kind load docker-image platform-api:latest --name store-platform
kind load docker-image platform-orchestrator:latest --name store-platform
kind load docker-image platform-dashboard:latest --name store-platform
```

## Upgrade and Rollback

### Upgrading the Platform

```bash
# Upgrade with new image tags
helm upgrade store-platform ./helm-charts/platform \
  --values ./helm-charts/platform/values-prod.yaml \
  --set api.image.tag=v1.1.0 \
  --set orchestrator.image.tag=v1.1.0 \
  --set dashboard.image.tag=v1.1.0
```

### Rolling Back

```bash
# List releases
helm history store-platform -n store-platform

# Rollback to previous version
helm rollback store-platform -n store-platform

# Rollback to specific revision
helm rollback store-platform 2 -n store-platform
```

## Monitoring (Future Enhancement)

Recommended additions:
- Prometheus for metrics (store count, provisioning duration, failures)
- Grafana for dashboards
- Alertmanager for alerts (provisioning failures, high error rates)
- Loki for log aggregation

## License

MIT

## Support

For issues and questions, open an issue on GitHub.
