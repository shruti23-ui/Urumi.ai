# System Design and Tradeoffs

## Architecture Overview

This platform follows a **control plane** pattern where a centralized orchestrator manages the lifecycle of distributed store instances.

### Design Principles

1. **Declarative reconciliation** - User declares desired state (store), orchestrator reconciles to actual state
2. **Namespace isolation** - Each store gets dedicated namespace with resource quotas
3. **Helm-based templating** - Store deployments use Helm for consistency and configurability
4. **Database as source of truth** - PostgreSQL stores desired state, Kubernetes is runtime state
5. **Polling-based reconciliation** - Simple and reliable (vs. webhooks/events)

## Component Design

### 1. Platform API

**Responsibilities:**
- Accept store CRUD requests
- Validate input
- Enforce rate limits and quotas
- Store metadata in PostgreSQL
- Return responses to users

**Technology choices:**
- **Express.js** - Fast, lightweight, battle-tested
- **PostgreSQL** - ACID guarantees, rich query capabilities, good for metadata
- **TypeScript** - Type safety, better DX

**Tradeoffs:**
- ✅ Simple REST API, easy to integrate
- ✅ Stateless, scales horizontally
- ✅ Synchronous responses (fast feedback)
- ❌ No real-time updates (user must poll or use dashboard refresh)
- ❌ No built-in queue (relies on database polling)

### 2. Orchestrator

**Responsibilities:**
- Poll database for pending stores
- Create Kubernetes namespaces
- Apply resource quotas and limit ranges
- Install Helm charts
- Monitor deployment readiness
- Update store status and URLs
- Handle store deletion

**Technology choices:**
- **Node.js + @kubernetes/client-node** - Same stack as API, good k8s library
- **Polling loop (5s interval)** - Simple, no event infrastructure needed
- **Helm CLI via exec** - Mature, stable, full Helm feature set

**Tradeoffs:**
- ✅ Simple polling model, easy to reason about
- ✅ Idempotent (checks existing resources before creating)
- ✅ Failure isolation (one store failure doesn't block others)
- ✅ Can run multiple replicas (though only one processes at a time)
- ❌ Polling adds latency (5s delay)
- ❌ Sequential processing (one store at a time)
- ❌ Helm CLI dependency (could use Helm SDK instead)

**Alternative considered:**
- **Kubernetes Operator (controller-runtime)** - More complex, requires Go, overkill for this use case
- **Event-driven (Kafka/NATS)** - Adds infrastructure complexity, polling is sufficient

### 3. Dashboard

**Responsibilities:**
- Display store list
- Provide create/delete UI
- Show store status and URLs
- Auto-refresh for live updates

**Technology choices:**
- **React** - Component-based, fast, popular
- **Vite** - Fast build tool
- **Axios** - Simple HTTP client
- **No state management library** - Simple useState is enough

**Tradeoffs:**
- ✅ Simple SPA, no server-side rendering needed
- ✅ Auto-refresh via setInterval (simple live updates)
- ✅ Served via NGINX (static files, fast)
- ❌ No WebSocket (polling for updates)
- ❌ No offline support
- ❌ Basic styling (no component library)

### 4. Store Helm Charts

**Responsibilities:**
- Define WooCommerce/Medusa deployment templates
- Configure WordPress + MySQL
- Set up ingress, services, PVCs
- Apply resource limits

**Technology choices:**
- **Helm 3** - De facto standard for Kubernetes packaging
- **Separate values files** - Local vs prod configuration
- **Init containers** - Wait for MySQL before starting WordPress

**Tradeoffs:**
- ✅ Declarative, version-controlled
- ✅ Reusable across environments
- ✅ Built-in templating and values merging
- ✅ Easy rollback with Helm
- ❌ Helm chart complexity (learning curve)
- ❌ No automatic WooCommerce plugin installation (manual step)

## Key Design Decisions

### 1. Polling vs Event-Driven

**Decision:** Polling loop (every 5 seconds)

**Rationale:**
- Simpler implementation (no Kafka, NATS, or k8s watch setup)
- Reliable (no missed events)
- Easy to debug (just check database)
- Sufficient latency for store provisioning (2-5 minutes anyway)

**Tradeoff:** 5 second delay before processing starts

### 2. Database as State Store

**Decision:** PostgreSQL as single source of truth

**Rationale:**
- ACID guarantees (no lost stores)
- Rich queries (filter by status, user, timestamp)
- Audit trail (event log)
- Familiar (SQL)

**Tradeoff:** Orchestrator must sync database state with Kubernetes state

### 3. Namespace-per-Store

**Decision:** Each store gets dedicated namespace

**Rationale:**
- Strong isolation (resource quotas, network policies)
- Easy cleanup (delete namespace = delete all resources)
- Clear ownership (namespace name includes store ID)
- Blast radius control (one store failure doesn't affect others)

**Tradeoff:** More namespaces = more API server load (acceptable at <100 stores)

### 4. Helm for Store Deployment

**Decision:** Use Helm charts for store templates

**Rationale:**
- Templating (values override for local vs prod)
- Packaging (bundle related resources)
- Versioning (Helm releases)
- Rollback (Helm rollback)
- Community standard

**Tradeoff:** Helm dependency in orchestrator (exec calls)

**Alternative considered:**
- **Raw Kubernetes YAML** - Less flexible, harder to parameterize
- **Kustomize** - Good but Helm is more feature-rich

### 5. Sequential Store Provisioning

**Decision:** Process stores one at a time

**Rationale:**
- Simpler implementation (no concurrency issues)
- Predictable behavior
- Easier to debug
- Sufficient for Round 1 requirements

**Tradeoff:** Lower throughput (can only provision one store at a time)

**Future improvement:**
- Worker pool (process N stores concurrently)
- Kubernetes Jobs (one Job per store)

### 6. Local DNS via /etc/hosts

**Decision:** Use `.local.stores.dev` domain suffix and /etc/hosts

**Rationale:**
- No external DNS required
- Works offline
- Fast (no DNS lookup)
- Common for local development

**Tradeoff:** Manual /etc/hosts editing (could use dnsmasq or CoreDNS)

## Reliability Features

### 1. Idempotency

- Orchestrator checks if namespace exists before creating
- Helm installs are idempotent (`--wait` flag)
- Store creation API is idempotent (namespace name is deterministic)

### 2. Failure Handling

- Failed Helm installs set store status to "failed" with error message
- Orchestrator continues processing other stores
- Users can delete failed store and retry

### 3. Cleanup Guarantees

- Deleting store deletes entire namespace (cascading delete)
- Orphaned namespaces can be manually deleted
- Database record deleted only after namespace is gone

### 4. Observability

- Orchestrator logs all actions
- Event log tracks store lifecycle (created, provisioning, ready, failed, deleted)
- API health endpoint for liveness checks

## Scaling Considerations

### What Scales Horizontally

- **API** - Stateless, can run N replicas behind load balancer
- **Dashboard** - Static files, can run N replicas
- **Orchestrator** - Can run N replicas (though only one processes at a time due to polling)

### What Doesn't Scale Horizontally

- **PostgreSQL** - Single StatefulSet (use managed DB for prod)
- **MySQL per store** - Single replica (WooCommerce doesn't support multi-master)

### Scaling Limits

- **Namespace limit** - Kubernetes supports ~5000 namespaces per cluster
- **API server load** - More namespaces = more API calls (use resource caching)
- **Ingress rules** - Ingress controller supports ~1000 rules (use external ingress controller for more)
- **Storage** - PVCs are per-node (ensure sufficient storage per node)

### How to Scale Provisioning Throughput

1. **Worker pool in orchestrator** - Process N stores concurrently
2. **Multiple orchestrator instances** - Shard by store ID or user ID
3. **Kubernetes Jobs** - One Job per store (better parallelism)
4. **Faster Helm installs** - Pre-pull images, use faster storage class

## Production Enhancements

### For VPS Deployment

1. **Managed PostgreSQL** - Use RDS, Cloud SQL, or DigitalOcean Managed DB
2. **External secrets** - Use Sealed Secrets, External Secrets Operator, or Vault
3. **TLS** - Use cert-manager with Let's Encrypt
4. **Monitoring** - Prometheus + Grafana
5. **Logging** - Loki or ELK stack
6. **Backups** - Velero for cluster backups, pg_dump for database
7. **Autoscaling** - HPA for API/dashboard, VPA for resource tuning

### Security Hardening

1. **Network policies** - Deny-by-default, explicit allows
2. **Pod security policies** - Restrict privileged containers
3. **Image scanning** - Trivy or Clair for CVE detection
4. **Secret encryption** - Enable encryption at rest for Secrets
5. **Audit logging** - Enable Kubernetes audit logs
6. **WAF** - Cloudflare or similar for DDoS protection

## Tradeoffs Summary

| Decision | Pro | Con |
|----------|-----|-----|
| Polling loop | Simple, reliable | 5s latency, inefficient at scale |
| PostgreSQL state | ACID, rich queries | Orchestrator must sync with k8s |
| Namespace-per-store | Strong isolation, easy cleanup | More API server load |
| Helm for stores | Templating, versioning, rollback | Helm CLI dependency |
| Sequential provisioning | Simple, predictable | Low throughput |
| No WooCommerce auto-setup | Simpler implementation | Manual plugin install |
| Local /etc/hosts | Works offline, no DNS | Manual editing |
| Node.js stack | Consistent, good libraries | Not the "k8s way" (Go) |

## Future Improvements

1. **Concurrent store provisioning** - Worker pool or Kubernetes Jobs
2. **Real-time updates** - WebSocket or Server-Sent Events
3. **Auto WooCommerce setup** - Init container or Job to install plugin
4. **MedusaJS implementation** - Second store engine
5. **User authentication** - JWT or OAuth
6. **Multi-tenancy** - Separate users, role-based access
7. **Store templates** - Pre-configured themes/plugins
8. **Backup and restore** - Automated backups for stores
9. **Monitoring dashboard** - Prometheus metrics, Grafana dashboards
10. **Custom domains** - Let users bring their own domain

## Conclusion

This architecture prioritizes **simplicity, reliability, and debuggability** over premature optimization. The polling-based reconciliation pattern is easy to understand and sufficient for the use case. Namespace isolation provides strong multi-tenancy guarantees. Helm provides flexibility for local vs production deployment.

The platform is production-ready for small to medium scale (up to 100 stores). For larger scale, consider the enhancements outlined above.
