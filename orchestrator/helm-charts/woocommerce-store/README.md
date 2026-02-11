# WooCommerce Store Helm Chart

This Helm chart deploys a complete WooCommerce store with WordPress and MySQL on Kubernetes.

## Quick Start

### Local Development

```bash
helm install mystore . -f values-local.yaml \
  --set storeName=mystore \
  --set storeId=abc123 \
  --set ingress.host=mystore.local.stores.dev
```

### Production (VPS/k3s)

```bash
helm install mystore . -f values-prod.yaml \
  --set storeName=mystore \
  --set storeId=abc123 \
  --set ingress.host=mystore.example.com \
  --set mysql.auth.password=$(openssl rand -base64 32) \
  --set mysql.auth.rootPassword=$(openssl rand -base64 32)
```

## Values Files

### values.yaml
Default values (used as base for local and prod)

### values-local.yaml
Local development configuration:
- Single replica
- Local storage (standard)
- No TLS
- Debug enabled
- .local.stores.dev domain

### values-prod.yaml
Production configuration:
- 3 replicas (HA)
- Production storage (longhorn or cloud provider)
- TLS with cert-manager
- Debug disabled
- Real domain
- Resource limits for production
- Security contexts (non-root)
- Pod disruption budget
- Horizontal pod autoscaling
- Monitoring annotations

## Configuration

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `storeName` | Store name (DNS-safe) | `mystore` |
| `storeId` | Unique store ID | `abc123` |
| `ingress.host` | Domain name | `mystore.example.com` |

### MySQL Passwords

**Local:** Hardcoded for convenience
```yaml
mysql.auth.password: woocommerce123
mysql.auth.rootPassword: root123
```

**Production:** Set via command line or sealed-secrets
```bash
--set mysql.auth.password=$(openssl rand -base64 32)
--set mysql.auth.rootPassword=$(openssl rand -base64 32)
```

### Storage Classes

**Local:**
- `standard` (Kubernetes default)
- `hostPath` for local clusters

**Production:**
- `longhorn` (k3s default)
- `gp2` or `gp3` (AWS EBS)
- `pd-standard` or `pd-ssd` (GCP)
- `azure-disk` (Azure)

## Ingress Configuration

### Local with /etc/hosts

```bash
# Add to /etc/hosts
127.0.0.1 mystore.local.stores.dev
```

### Production with cert-manager

1. Install cert-manager:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. Create ClusterIssuer:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

3. Deploy chart with TLS enabled (already configured in values-prod.yaml)

## Resource Quotas

### Local
- WordPress: 1 CPU, 1GB RAM
- MySQL: 500m CPU, 512MB RAM

### Production
- WordPress: 2 CPU, 2GB RAM (per pod, 3 replicas)
- MySQL: 2 CPU, 2GB RAM

## Upgrading

```bash
# Local
helm upgrade mystore . -f values-local.yaml

# Production
helm upgrade mystore . -f values-prod.yaml
```

## Rollback

```bash
helm rollback mystore
```

## Uninstalling

```bash
helm uninstall mystore
```

Note: PVCs are not automatically deleted. To delete:
```bash
kubectl delete pvc -l app.kubernetes.io/instance=mystore
```

## Monitoring

Production deployments include Prometheus annotations:
```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "80"
prometheus.io/path: "/metrics"
```

## Backup

Production values include backup configuration:
- Daily backups at 2 AM
- Retention: 30 days

Backup implementation requires Velero or similar tool.

## Security

### Production Security Features

1. **Non-root containers**
   ```yaml
   securityContext:
     runAsUser: 1000
     fsGroup: 1000
   ```

2. **TLS encryption**
   - Enforced via Ingress annotations
   - Automatic cert-manager integration

3. **Secret management**
   - Use sealed-secrets or Vault
   - Never commit passwords to Git

4. **Network policies** (recommended)
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: mystore-netpol
   spec:
     podSelector:
       matchLabels:
         app: mystore
     policyTypes:
     - Ingress
     ingress:
     - from:
       - podSelector:
           matchLabels:
             app.kubernetes.io/name: ingress-nginx
   ```

## Troubleshooting

### Pods not starting

```bash
kubectl get pods -n store-mystore-abc123
kubectl describe pod <pod-name> -n store-mystore-abc123
kubectl logs <pod-name> -n store-mystore-abc123
```

### Database connection issues

```bash
kubectl exec -it <wordpress-pod> -n store-mystore-abc123 -- wp db check
```

### Ingress not working

```bash
kubectl get ingress -n store-mystore-abc123
kubectl describe ingress mystore -n store-mystore-abc123
```

## Support

For issues, see:
- Main README.md
- docs/TROUBLESHOOTING.md
- GitHub Issues
