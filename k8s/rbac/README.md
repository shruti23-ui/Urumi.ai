# RBAC Configuration

This directory contains Kubernetes RBAC (Role-Based Access Control) configurations for the store platform.

## Files

### orchestrator-rbac.yaml
RBAC configuration for the store orchestrator service.

**Resources:**
- ServiceAccount: `store-orchestrator`
- ClusterRole: `store-orchestrator`
- ClusterRoleBinding: `store-orchestrator`

## Applying RBAC

### Step 1: Apply RBAC Configuration

```bash
kubectl apply -f k8s/rbac/orchestrator-rbac.yaml
```

### Step 2: Verify ServiceAccount Created

```bash
kubectl get serviceaccount store-orchestrator
```

### Step 3: Verify ClusterRole Created

```bash
kubectl get clusterrole store-orchestrator
```

### Step 4: Verify ClusterRoleBinding Created

```bash
kubectl get clusterrolebinding store-orchestrator
```

### Step 5: Update Orchestrator Deployment

Add the ServiceAccount to your orchestrator deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orchestrator
spec:
  template:
    spec:
      serviceAccountName: store-orchestrator  # Add this line
      containers:
      - name: orchestrator
        image: your-orchestrator-image:latest
```

Or via kubectl:

```bash
kubectl patch deployment orchestrator \
  -p '{"spec":{"template":{"spec":{"serviceAccountName":"store-orchestrator"}}}}'
```

## Permissions Explained

### Cluster-Wide Permissions (ClusterRole)

The orchestrator needs cluster-wide permissions because it creates namespaces and resources across the cluster.

**Namespaces:**
- Create new namespaces for each store
- Delete namespaces when stores are deleted
- List/get namespaces for verification

**Resource Quotas & Limit Ranges:**
- Create quotas to limit resources per store
- Prevent resource exhaustion
- Ensure fair resource allocation

**Deployments & StatefulSets:**
- Create WordPress deployments
- Create MySQL StatefulSets
- Monitor deployment status
- Delete resources on store deletion

**Services & Ingresses:**
- Create ClusterIP services for internal communication
- Create Ingress rules for external access
- Configure routing to store pods

**Secrets:**
- Create database passwords
- Store WooCommerce configuration
- Manage TLS certificates (if applicable)

**PersistentVolumeClaims:**
- Create storage for MySQL data
- Ensure data persistence

**Pods (Read-only):**
- Check pod status for readiness
- Monitor deployment health
- Get logs for debugging

## Security Best Practices

### 1. Least Privilege

The orchestrator only has permissions it actually needs:
- ✅ Can create/delete namespaces
- ✅ Can manage resources within namespaces
- ❌ Cannot modify cluster-wide resources (nodes, storage classes, etc.)
- ❌ Cannot access secrets in other namespaces

### 2. Service Account Isolation

```yaml
serviceAccountName: store-orchestrator
```

The orchestrator runs with its own ServiceAccount, not the default ServiceAccount.

### 3. Namespace-Scoped Operations

While the ClusterRole is cluster-wide, most operations are scoped to specific namespaces:

```javascript
// Orchestrator only operates on store namespaces
const namespace = `store-${storeName}-${storeId}`;
await k8s.createNamespace(namespace);
```

### 4. Read-Only Where Possible

Pods, ReplicaSets, and Events are read-only or create-only:
- Pods: `get, list, watch` (no create/delete)
- Events: `create, patch` (for logging only)

## Testing RBAC

### Test ServiceAccount Permissions

```bash
# Create a test pod using the ServiceAccount
kubectl run rbac-test --image=bitnami/kubectl:latest \
  --serviceaccount=store-orchestrator \
  --command -- sleep infinity

# Exec into the pod
kubectl exec -it rbac-test -- bash

# Test permissions
kubectl get namespaces  # Should work
kubectl create namespace test-store  # Should work
kubectl delete namespace test-store  # Should work

kubectl get nodes  # Should FAIL (not allowed)
kubectl delete node <node-name>  # Should FAIL (not allowed)

# Clean up
kubectl delete pod rbac-test
```

### Check Permissions Programmatically

```bash
# Check if orchestrator can create namespaces
kubectl auth can-i create namespaces \
  --as=system:serviceaccount:default:store-orchestrator

# Check if orchestrator can delete deployments
kubectl auth can-i delete deployments \
  --as=system:serviceaccount:default:store-orchestrator

# Check if orchestrator can delete nodes (should be "no")
kubectl auth can-i delete nodes \
  --as=system:serviceaccount:default:store-orchestrator
```

## Troubleshooting

### Permission Denied Errors

```
Error: namespaces is forbidden: User "system:serviceaccount:default:orchestrator" cannot create resource "namespaces"
```

**Solution:**
1. Verify RBAC is applied:
   ```bash
   kubectl get clusterrolebinding store-orchestrator
   ```

2. Verify ServiceAccount is used:
   ```bash
   kubectl get pod orchestrator -o yaml | grep serviceAccountName
   ```

3. Re-apply RBAC:
   ```bash
   kubectl delete -f k8s/rbac/orchestrator-rbac.yaml
   kubectl apply -f k8s/rbac/orchestrator-rbac.yaml
   ```

4. Restart orchestrator:
   ```bash
   kubectl rollout restart deployment orchestrator
   ```

### ServiceAccount Not Found

```
Error: ServiceAccount "store-orchestrator" not found
```

**Solution:**
```bash
kubectl apply -f k8s/rbac/orchestrator-rbac.yaml
```

### ClusterRoleBinding Not Working

```bash
# Check binding
kubectl get clusterrolebinding store-orchestrator -o yaml

# Verify subject matches ServiceAccount
subjects:
- kind: ServiceAccount
  name: store-orchestrator
  namespace: default  # Must match orchestrator's namespace
```

## Production Considerations

### 1. Use Namespace-Scoped Roles Where Possible

For future enhancements, consider using Role + RoleBinding instead of ClusterRole + ClusterRoleBinding for namespace-scoped operations.

### 2. Audit Logging

Enable Kubernetes audit logging to track orchestrator actions:

```yaml
# kube-apiserver flags
--audit-log-path=/var/log/kubernetes/audit.log
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
```

### 3. Pod Security Policies

Enforce Pod Security Standards:

```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: store-orchestrator-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  runAsUser:
    rule: MustRunAsNonRoot
```

### 4. Network Policies

Restrict orchestrator network access:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: orchestrator-netpol
spec:
  podSelector:
    matchLabels:
      app: orchestrator
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector: {}  # Allow access to all namespaces
    ports:
    - protocol: TCP
      port: 443  # Kubernetes API
  - to:
    - podSelector:
        matchLabels:
          app: postgresql  # Database access
    ports:
    - protocol: TCP
      port: 5432
```

## Upgrading RBAC

When adding new orchestrator features that require additional permissions:

1. Update `orchestrator-rbac.yaml`
2. Apply changes:
   ```bash
   kubectl apply -f k8s/rbac/orchestrator-rbac.yaml
   ```
3. No need to restart orchestrator (permissions take effect immediately)
4. Test new permissions with `kubectl auth can-i`

## Removing RBAC

To remove orchestrator RBAC:

```bash
kubectl delete -f k8s/rbac/orchestrator-rbac.yaml
```

**Warning:** This will break the orchestrator. Only do this if you're removing the platform entirely.

## References

- [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Configure Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
