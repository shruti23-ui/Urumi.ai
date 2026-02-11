# MedusaJS Store Helm Chart (Stub)

This is a **stub implementation** to demonstrate the architecture supports multiple store engines.

## Status

🚧 **Not Implemented** - Placeholder only

The WooCommerce store is fully implemented and ready to use. MedusaJS support can be added following the same pattern:

1. Define deployment templates in `templates/`
2. Configure Postgres + Redis dependencies
3. Set up Medusa backend + admin + storefront
4. Configure ingress routing
5. Add to orchestrator provisioning logic

## What's Needed

To fully implement MedusaJS:

1. **Medusa Backend Deployment**
   - Container: `medusajs/medusa`
   - Environment: Database URL, Redis URL, JWT secret
   - Ports: 9000 (API)

2. **Medusa Admin Deployment**
   - Container: Separate admin UI or bundled
   - Ports: 7000 (Admin)

3. **Storefront Deployment**
   - Container: Next.js storefront
   - Ports: 8000 (Storefront)

4. **Dependencies**
   - PostgreSQL (similar to WooCommerce)
   - Redis (for caching and queues)

5. **Ingress Rules**
   - `/` → Storefront
   - `/admin` → Admin UI
   - `/store` → API

## Example Architecture

```
┌─────────────────┐
│  Medusa Store   │
│   Namespace     │
├─────────────────┤
│                 │
│  Storefront Pod │ (:8000)
│  Admin Pod      │ (:7000)
│  Backend Pod    │ (:9000)
│                 │
│  PostgreSQL Pod │ (:5432)
│  Redis Pod      │ (:6379)
│                 │
│  Ingress        │
└─────────────────┘
```

## Why Not Implemented?

The assignment allows implementing **either** WooCommerce or Medusa fully, with the other stubbed. WooCommerce was chosen because:

1. More widely known
2. Simpler deployment (single WordPress container vs. multi-service Medusa)
3. Easier to demonstrate end-to-end order flow

However, the **architecture is ready** for Medusa:
- Orchestrator supports multiple engines via Helm charts
- Database schema has `engine` field
- Dashboard has engine selector
- Just needs the Helm chart implementation

## Adding Medusa Support

1. Implement deployment templates (see `../woocommerce-store/templates/` as reference)
2. Test chart installation: `helm install test-medusa . --set storeId=test`
3. Update orchestrator if needed (should work as-is)
4. Update frontend to enable Medusa option
5. Test end-to-end order flow

Estimated effort: 4-6 hours for experienced Kubernetes/Medusa developer.
