# Quick Start Guide

Get the platform running in under 10 minutes!

## Prerequisites

- Docker Desktop running
- 8GB RAM available
- 20GB disk space

## Setup (3 commands)

```bash
# 1. Create Kind cluster with ingress
kind create cluster --name store-platform
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 2. Build and load images
docker build -t platform-api:latest ./backend && \
docker build -t platform-orchestrator:latest ./orchestrator && \
docker build -t platform-dashboard:latest ./frontend && \
kind load docker-image platform-api:latest --name store-platform && \
kind load docker-image platform-orchestrator:latest --name store-platform && \
kind load docker-image platform-dashboard:latest --name store-platform

# 3. Deploy platform
helm install store-platform ./helm-charts/platform \
  --values ./helm-charts/platform/values-local.yaml \
  --create-namespace
```

## Configure DNS

Add to `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows):
```
127.0.0.1 platform.local.stores.dev
```

## Access Dashboard

Open: http://platform.local.stores.dev

## Create Your First Store

1. Enter store name: "My Shop"
2. Select engine: "WooCommerce"
3. Click "Create Store"
4. Wait 2-5 minutes for status to change to "READY"
5. Click the store URL
6. Complete WordPress setup
7. Install WooCommerce plugin
8. Add a product
9. Place a test order

**Done!** You've provisioned a working ecommerce store on Kubernetes!

## What's Happening Behind the Scenes?

1. Dashboard sends request to API
2. API saves store record to PostgreSQL with status "provisioning"
3. Orchestrator polls database every 5s, finds new store
4. Orchestrator creates Kubernetes namespace: `store-myshop-abc123`
5. Orchestrator applies resource quotas (max 2 CPU, 4Gi RAM)
6. Orchestrator installs Helm chart with WordPress + MySQL
7. MySQL pod starts, creates database
8. WordPress pod starts, connects to MySQL
9. Ingress routes traffic to WordPress
10. Orchestrator detects pods are ready
11. Orchestrator updates store status to "ready" with URL
12. Dashboard shows store as ready

## Architecture at a Glance

```
┌─────────────┐
│  Dashboard  │ (React SPA)
│  (Port 80)  │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐      ┌────────────┐
│     API     │─────▶│ PostgreSQL │
│ (Port 3001) │      │ (Metadata) │
└─────────────┘      └────────────┘
                             ▲
                             │ Polls every 5s
                      ┌──────┴──────┐
                      │ Orchestrator │
                      │   (Helm)     │
                      └──────┬───────┘
                             │ Creates
                             ▼
                    ┌─────────────────┐
                    │  Store Namespace │
                    │  - WordPress Pod │
                    │  - MySQL Pod     │
                    │  - PVCs          │
                    │  - Ingress       │
                    └─────────────────┘
```

## Cleanup

```bash
# Delete a store via dashboard "Delete" button, or:
kubectl delete namespace store-myshop-abc123

# Delete entire platform:
helm uninstall store-platform -n store-platform

# Delete cluster:
kind delete cluster --name store-platform
```

## Troubleshooting

**Dashboard not loading?**
- Check `/etc/hosts` has the entry
- Verify pods are running: `kubectl get pods -n store-platform`

**Store stuck in "Provisioning"?**
- Check orchestrator logs: `kubectl logs -n store-platform deployment/platform-orchestrator`
- Check store namespace: `kubectl get all -n store-<name>`

**Images not found?**
- Load images into Kind: `kind load docker-image <image> --name store-platform`

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Read [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) for architecture details
- Deploy to production VPS with k3s (see README)
- Add monitoring with Prometheus + Grafana
- Implement MedusaJS support (architecture ready)

## Need Help?

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Logs from relevant pods
- Output of `kubectl get all -n store-platform`
