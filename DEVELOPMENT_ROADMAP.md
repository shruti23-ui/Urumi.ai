# Development Roadmap - System Design Focus

## Executive Summary

This roadmap prioritizes features and improvements that demonstrate **strong system design thinking** while delivering tangible value. It's structured to impress in interviews and serve real production use cases.

---

## Phase 0: Quick Wins (1-2 Days) ⚡

These high-impact, low-effort improvements should be implemented immediately.

### 0.1 Lock Down Engine Validation

**Current Issue:** Medusa is accepted but not implemented, causing failed provisions.

**Implementation:**

```typescript
// backend/src/middleware/validation.ts
const SUPPORTED_ENGINES = ['woocommerce']; // Only these work
const PLANNED_ENGINES = ['medusa'];        // Reject with helpful message

body('engine').custom((value) => {
  if (SUPPORTED_ENGINES.includes(value)) return true;

  if (PLANNED_ENGINES.includes(value)) {
    throw new Error(`Engine '${value}' coming soon! Supported: ${SUPPORTED_ENGINES.join(', ')}`);
  }

  throw new Error(`Invalid engine. Supported: ${SUPPORTED_ENGINES.join(', ')}`);
});
```

**Frontend Update:**

```typescript
// frontend/src/App.tsx
<select value={formData.engine} onChange={handleEngineChange}>
  <option value="woocommerce">WooCommerce</option>
  <option value="medusa" disabled>Medusa (Coming Soon)</option>
</select>
```

**Impact:** Prevents user confusion and failed provisions.

---

### 0.2 Improve Store Name Validation

**Current Issue:** Long names break Kubernetes namespace limit (63 chars).

**Implementation:**

```typescript
body('name').custom((value) => {
  // Check Kubernetes namespace length
  const namespacePrefix = 'store-';
  const sanitizedName = value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const estimatedLength = namespacePrefix.length + sanitizedName.length + 9;

  if (estimatedLength > 63) {
    throw new Error('Store name too long (Kubernetes limit)');
  }

  // Reserved words
  const reserved = ['platform', 'admin', 'api', 'system', 'test'];
  if (reserved.includes(value.toLowerCase())) {
    throw new Error('Store name is reserved');
  }

  return true;
});
```

**Impact:** Prevents namespace creation failures.

---

### 0.3 Replace Alert/Confirm with Toast Notifications

**Current Issue:** Browser alerts are jarring and unprofessional.

**Implementation:**

```bash
cd frontend
npm install react-hot-toast
```

```typescript
// frontend/src/App.tsx
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const handleCreateStore = async () => {
    const toastId = toast.loading('Creating store...');

    try {
      await storeApi.createStore(formData);
      toast.success('Store creation initiated!', { id: toastId });
      fetchStores();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm('Delete store? This cannot be undone.')) return;

    const toastId = toast.loading('Deleting store...');

    try {
      await storeApi.deleteStore(id);
      toast.success('Store deletion initiated', { id: toastId });
      fetchStores();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="app">
      <Toaster position="top-right" />
      {/* ... */}
    </div>
  );
}
```

**Impact:** Professional UX, better error communication.

---

### 0.4 Add Store Events Timeline in Dashboard

**Current Issue:** Users can't see what's happening during provisioning.

**Implementation:**

```typescript
// frontend/src/components/StoreEvents.tsx
interface StoreEventsProps {
  storeId: string;
}

export function StoreEvents({ storeId }: StoreEventsProps) {
  const [events, setEvents] = useState<StoreEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await storeApi.getStoreEvents(storeId);
      setEvents(data);
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  return (
    <div className="store-events">
      <h4>Activity Timeline</h4>
      <div className="timeline">
        {events.map(event => (
          <div key={event.id} className="timeline-item">
            <div className="event-icon">
              {getIconForEvent(event.event_type)}
            </div>
            <div className="event-content">
              <div className="event-type">{formatEventType(event.event_type)}</div>
              <div className="event-message">{event.message}</div>
              <div className="event-time">{formatTime(event.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getIconForEvent(type: string) {
  const icons = {
    'created': '🎉',
    'namespace_created': '📦',
    'helm_installed': '⚙️',
    'store_ready': '✅',
    'provisioning_failed': '❌',
    'deleting': '🗑️'
  };
  return icons[type] || '•';
}
```

**Usage in StoreCard:**

```typescript
<div className="store-card">
  {/* existing content */}

  {expandedStore === store.id && (
    <StoreEvents storeId={store.id} />
  )}

  <button onClick={() => toggleExpanded(store.id)}>
    {expandedStore === store.id ? 'Hide Details' : 'Show Details'}
  </button>
</div>
```

**Impact:** Transparency, debugging, professional feel.

**Effort:** 2-3 hours

---

## Phase 1: User Identity & Multi-Tenancy (2-3 Days) 🔐

### 1.1 Pseudo-Authentication with LocalStorage

**Goal:** Make multi-tenancy visible without full auth infrastructure.

**Implementation:**

```typescript
// frontend/src/utils/userManager.ts
export class UserManager {
  private static USER_KEY = 'store-platform-user-id';

  static getUserId(): string {
    let userId = localStorage.getItem(this.USER_KEY);

    if (!userId) {
      userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.USER_KEY, userId);
    }

    return userId;
  }

  static setUserId(userId: string) {
    localStorage.setItem(this.USER_KEY, userId);
  }

  static clearUserId() {
    localStorage.removeItem(this.USER_KEY);
  }
}

// frontend/src/services/api.ts
import { UserManager } from '../utils/userManager';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user ID to all requests
api.interceptors.request.use(config => {
  config.headers['x-user-id'] = UserManager.getUserId();
  return config;
});
```

**Frontend: Add "User" Indicator:**

```typescript
// frontend/src/App.tsx
function App() {
  const [userId, setUserId] = useState(UserManager.getUserId());

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Store Platform Dashboard</h1>
          <p>Manage your WooCommerce and Medusa stores</p>
        </div>
        <div className="user-indicator">
          <span>User: {userId.substring(0, 8)}...</span>
          <button onClick={() => {
            if (confirm('Switch user? (Demo mode)')) {
              UserManager.clearUserId();
              window.location.reload();
            }
          }}>
            Switch User
          </button>
        </div>
      </header>
      {/* ... */}
    </div>
  );
}
```

**Impact:**
- Demonstrates multi-tenancy in interviews
- Users can test quota limits
- Foundation for real auth

**Effort:** 3-4 hours

---

### 1.2 JWT Authentication (Optional - Production)

**Goal:** Real authentication for production use.

**Implementation:**

```bash
cd backend
npm install jsonwebtoken bcrypt @types/jsonwebtoken @types/bcrypt
```

**Database Migration:**

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Auth Service:**

```typescript
// backend/src/services/authService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  async register(email: string, password: string, name: string) {
    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [userId, email, hash, name]
    );

    return this.generateToken(userId, email);
  }

  async login(email: string, password: string) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user.id, user.email);
  }

  private generateToken(userId: string, email: string) {
    return jwt.sign({ userId, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  }
}
```

**Auth Middleware:**

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  try {
    const payload = authService.verifyToken(token);
    req.headers['x-user-id'] = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};
```

**Routes:**

```typescript
// backend/src/index.ts
import { AuthService } from './services/authService';
import { authenticate } from './middleware/auth';

const authService = new AuthService();

// Public routes
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const token = await authService.register(email, password, name);
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// Protected routes (add authenticate middleware)
app.post('/api/stores', authenticate, createStoreRateLimiter, validateCreateStore,
  storeController.createStore.bind(storeController));

app.get('/api/stores', authenticate, storeController.getStores.bind(storeController));
// ... etc
```

**Frontend Updates:**

```typescript
// frontend/src/services/api.ts
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Impact:** Production-ready authentication

**Effort:** 1 day

---

## Phase 2: Medusa Implementation (3-4 Days) 🛍️

### 2.1 Medusa Helm Chart

**Goal:** Full parity with WooCommerce chart.

**File Structure:**

```
helm-charts/medusa-store/
├── Chart.yaml
├── values.yaml
├── values-local.yaml
├── values-prod.yaml
└── templates/
    ├── postgres-secret.yaml
    ├── postgres-pvc.yaml
    ├── postgres-deployment.yaml
    ├── postgres-service.yaml
    ├── redis-deployment.yaml
    ├── redis-service.yaml
    ├── medusa-backend-deployment.yaml
    ├── medusa-backend-service.yaml
    ├── medusa-admin-deployment.yaml (optional)
    ├── storefront-deployment.yaml (optional)
    └── ingress.yaml
```

**Key Implementation Details:**

```yaml
# helm-charts/medusa-store/values.yaml
medusa:
  backend:
    image: medusajs/medusa:latest
    replicas: 1
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 1000m
        memory: 1Gi

postgres:
  enabled: true
  database: medusa
  user: medusa
  password: medusapass

redis:
  enabled: true
  image: redis:7-alpine

ingress:
  enabled: true
  paths:
    api: /store
    admin: /admin
    storefront: /
```

**Medusa Backend Deployment:**

```yaml
# templates/medusa-backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.storeId }}-medusa-backend
spec:
  replicas: {{ .Values.medusa.backend.replicas }}
  selector:
    matchLabels:
      app: medusa
      component: backend
      store: {{ .Values.storeId }}
  template:
    metadata:
      labels:
        app: medusa
        component: backend
        store: {{ .Values.storeId }}
    spec:
      initContainers:
      - name: wait-for-postgres
        image: busybox:1.36
        command: ['sh', '-c']
        args:
        - |
          until nc -z {{ .Values.storeId }}-postgres 5432; do
            echo "Waiting for PostgreSQL...";
            sleep 2;
          done;
      - name: run-migrations
        image: {{ .Values.medusa.backend.image }}
        command: ['medusa', 'migrations', 'run']
        env:
        - name: DATABASE_URL
          value: "postgres://{{ .Values.postgres.user }}:{{ .Values.postgres.password }}@{{ .Values.storeId }}-postgres:5432/{{ .Values.postgres.database }}"
      containers:
      - name: medusa
        image: {{ .Values.medusa.backend.image }}
        ports:
        - containerPort: 9000
          name: http
        env:
        - name: DATABASE_URL
          value: "postgres://{{ .Values.postgres.user }}:{{ .Values.postgres.password }}@{{ .Values.storeId }}-postgres:5432/{{ .Values.postgres.database }}"
        - name: REDIS_URL
          value: "redis://{{ .Values.storeId }}-redis:6379"
        - name: JWT_SECRET
          value: "supersecret"  # TODO: Use proper secret
        - name: COOKIE_SECRET
          value: "supersecret"  # TODO: Use proper secret
        resources:
          {{- toYaml .Values.medusa.backend.resources | nindent 10 }}
        livenessProbe:
          httpGet:
            path: /health
            port: 9000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 5
```

**Update Validation:**

```typescript
// backend/src/middleware/validation.ts
const SUPPORTED_ENGINES = ['woocommerce', 'medusa']; // Enable medusa
```

**Impact:** Full multi-engine platform

**Effort:** 2-3 days

---

### 2.2 Medusa Seed Data Job

**Goal:** Pre-populate demo products for better UX.

```yaml
# helm-charts/medusa-store/templates/seed-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Values.storeId }}-seed-data
spec:
  template:
    spec:
      restartPolicy: OnFailure
      initContainers:
      - name: wait-for-medusa
        image: busybox:1.36
        command: ['sh', '-c']
        args:
        - |
          until wget -q -O- http://{{ .Values.storeId }}-medusa-backend:9000/health; do
            echo "Waiting for Medusa backend...";
            sleep 5;
          done;
      containers:
      - name: seed
        image: medusajs/medusa:latest
        command: ['medusa', 'seed', '-f', './data/seed.json']
        env:
        - name: DATABASE_URL
          value: "postgres://{{ .Values.postgres.user }}:{{ .Values.postgres.password }}@{{ .Values.storeId }}-postgres:5432/{{ .Values.postgres.database }}"
```

**Effort:** 4 hours

---

## Phase 3: Observability & Metrics (2-3 Days) 📊

### 3.1 Prometheus Metrics

**Goal:** Production-grade observability.

**Installation:**

```bash
cd backend
npm install prom-client
```

**Metrics Service:**

```typescript
// backend/src/services/metricsService.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

export const storeCreationDuration = new promClient.Histogram({
  name: 'store_creation_duration_seconds',
  help: 'Duration of store provisioning in seconds',
  labelNames: ['engine', 'status'],
  buckets: [30, 60, 120, 180, 300, 600],
  registers: [register]
});

export const activeStores = new promClient.Gauge({
  name: 'active_stores_total',
  help: 'Number of active stores',
  labelNames: ['engine', 'status'],
  registers: [register]
});

export const storeCreationErrors = new promClient.Counter({
  name: 'store_creation_errors_total',
  help: 'Total number of store creation errors',
  labelNames: ['engine', 'error_type'],
  registers: [register]
});

export { register };
```

**Middleware:**

```typescript
// backend/src/middleware/metrics.ts
import { httpRequestDuration } from '../services/metricsService';

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });

  next();
};
```

**Endpoint:**

```typescript
// backend/src/index.ts
import { register } from './services/metricsService';
import { metricsMiddleware } from './middleware/metrics';

app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**Orchestrator Metrics:**

```typescript
// orchestrator/src/services/metricsService.ts
// Similar setup, track:
// - Provisioning queue depth
// - Provisioning duration by engine
// - Failed provisions by reason
// - Lock acquisition failures
```

**Grafana Dashboards:**

Create JSON dashboards for:
1. API Performance (request rate, latency, errors)
2. Store Metrics (total stores, provisioning time, failure rate)
3. Database Metrics (connection pool, query duration)

**Impact:** Production monitoring, capacity planning

**Effort:** 1 day

---

### 3.2 Structured Event Tracing

**Goal:** Full request tracing across services.

**OpenTelemetry Integration:**

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

```typescript
// backend/src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'platform-api',
});

sdk.start();
```

**Impact:** Full distributed tracing, debugging production issues

**Effort:** 4-6 hours

---

## Phase 4: Concurrent Provisioning (4-5 Days) ⚡

### 4.1 Design: Worker Pool Pattern

**Current:** Sequential provisioning (1 store at a time)
**Goal:** Process N stores concurrently

**Architecture:**

```
┌─────────────────────────────────────────┐
│         Reconciliation Loop             │
│  (Every 5-30s with adaptive backoff)    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Get N Provisioning  │
        │  Stores (LIMIT 5)    │
        │  with Row Locking    │
        └──────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐         ┌────▼────┐
    │ Worker  │         │ Worker  │
    │   1     │   ...   │   N     │
    └─────────┘         └─────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Update Store Status │
        │  Release Lock        │
        └──────────────────────┘
```

**Implementation:**

```typescript
// orchestrator/src/services/workerPool.ts
import { EventEmitter } from 'events';

interface ProvisioningTask {
  storeId: string;
  name: string;
  engine: string;
  namespace: string;
}

export class WorkerPool extends EventEmitter {
  private maxWorkers: number;
  private activeWorkers = 0;
  private queue: ProvisioningTask[] = [];

  constructor(maxWorkers: number = 5) {
    super();
    this.maxWorkers = maxWorkers;
  }

  async addTask(task: ProvisioningTask) {
    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    while (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const task = this.queue.shift();
      if (!task) break;

      this.activeWorkers++;
      this.provisionStore(task)
        .finally(() => {
          this.activeWorkers--;
          this.processQueue(); // Try to process more
        });
    }
  }

  private async provisionStore(task: ProvisioningTask) {
    try {
      console.log(`[Worker ${this.activeWorkers}] Starting ${task.storeId}`);

      await k8sProvisioner.createNamespace(task.namespace);
      await k8sProvisioner.createResourceQuota(task.namespace);
      await k8sProvisioner.createLimitRange(task.namespace);

      await k8sProvisioner.helmInstall({
        storeId: task.storeId,
        storeName: task.name,
        namespace: task.namespace,
        engine: task.engine,
      });

      // Wait for readiness
      let retries = 60; // 10 minutes max
      while (retries > 0) {
        const ready = await k8sProvisioner.checkDeploymentReady(task.namespace);
        if (ready) {
          const urls = await k8sProvisioner.getStoreUrls(task.namespace);
          await pool.query(
            "UPDATE stores SET status = 'ready', urls = $1 WHERE id = $2",
            [JSON.stringify(urls), task.storeId]
          );

          console.log(`[Worker ${this.activeWorkers}] Completed ${task.storeId}`);
          this.emit('success', task);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s
        retries--;
      }

      throw new Error('Provisioning timeout');
    } catch (error: any) {
      console.error(`[Worker ${this.activeWorkers}] Failed ${task.storeId}:`, error);

      await pool.query(
        "UPDATE stores SET status = 'failed', error_message = $1 WHERE id = $2",
        [error.message, task.storeId]
      );

      this.emit('failure', task, error);
    }
  }

  getStats() {
    return {
      activeWorkers: this.activeWorkers,
      queueLength: this.queue.length,
      utilization: this.activeWorkers / this.maxWorkers
    };
  }
}
```

**Updated Reconciler:**

```typescript
// orchestrator/src/services/reconciler.ts
import { WorkerPool } from './workerPool';

const workerPool = new WorkerPool(5); // 5 concurrent provisions

export class Reconciler {
  async reconcile(): Promise<boolean> {
    const client = await pool.connect();

    try {
      const lockResult = await client.query(
        'SELECT pg_try_advisory_lock($1) as acquired',
        [RECONCILIATION_LOCK_ID]
      );

      if (!lockResult.rows[0].acquired) {
        return false;
      }

      // Get up to 10 pending stores
      const result = await client.query(`
        SELECT * FROM stores
        WHERE status = 'provisioning'
        ORDER BY created_at ASC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return false;
      }

      // Add all to worker pool
      for (const store of result.rows) {
        await workerPool.addTask({
          storeId: store.id,
          name: store.name,
          engine: store.engine,
          namespace: store.namespace
        });
      }

      console.log(`Queued ${result.rows.length} stores. Worker stats:`, workerPool.getStats());

      return true;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [RECONCILIATION_LOCK_ID]);
      client.release();
    }
  }
}
```

**Impact:** 5x throughput improvement (1 store/3min → 5 stores/3min)

**Effort:** 1-2 days

---

### 4.2 Alternative: Kubernetes Jobs Pattern

**Goal:** Kubernetes-native concurrency.

**Architecture:**

```
User creates store
       │
       ▼
API saves to DB
       │
       ▼
Orchestrator detects
       │
       ▼
Creates Kubernetes Job
       │
       ▼
Job provisions store
       │
       ▼
Job updates DB on completion
```

**Implementation:**

```typescript
// orchestrator/src/k8s/jobProvisioner.ts
export class JobProvisioner {
  async createProvisioningJob(store: Store) {
    const jobName = `provision-${store.id.substring(0, 8)}`;

    const job: k8s.V1Job = {
      metadata: {
        name: jobName,
        namespace: 'store-platform',
        labels: {
          'app': 'store-provisioner',
          'store-id': store.id,
        }
      },
      spec: {
        ttlSecondsAfterFinished: 300, // Clean up after 5 minutes
        template: {
          spec: {
            restartPolicy: 'Never',
            serviceAccountName: 'store-orchestrator',
            containers: [{
              name: 'provisioner',
              image: 'platform-orchestrator:latest',
              command: ['node', 'dist/provision-single.js'],
              env: [
                { name: 'STORE_ID', value: store.id },
                { name: 'STORE_NAME', value: store.name },
                { name: 'ENGINE', value: store.engine },
                { name: 'NAMESPACE', value: store.namespace },
                { name: 'DB_HOST', valueFrom: { secretKeyRef: { name: 'postgres-secret', key: 'host' }}},
                // ... other env vars
              ],
              resources: {
                requests: { cpu: '100m', memory: '128Mi' },
                limits: { cpu: '500m', memory: '512Mi' }
              }
            }]
          }
        }
      }
    };

    await batchApi.createNamespacedJob('store-platform', job);

    console.log(`Created provisioning job: ${jobName}`);
  }
}
```

**Single Store Provisioner Script:**

```typescript
// orchestrator/src/provision-single.ts
async function main() {
  const storeId = process.env.STORE_ID!;
  const storeName = process.env.STORE_NAME!;
  const engine = process.env.ENGINE!;
  const namespace = process.env.NAMESPACE!;

  try {
    console.log(`Provisioning store: ${storeId}`);

    await k8sProvisioner.createNamespace(namespace);
    await k8sProvisioner.createResourceQuota(namespace);
    await k8sProvisioner.createLimitRange(namespace);
    await k8sProvisioner.helmInstall({ storeId, storeName, namespace, engine });

    // Wait for ready
    await waitForReady(namespace);

    const urls = await k8sProvisioner.getStoreUrls(namespace);
    await pool.query(
      "UPDATE stores SET status = 'ready', urls = $1 WHERE id = $2",
      [JSON.stringify(urls), storeId]
    );

    console.log(`Store ${storeId} ready!`);
    process.exit(0);
  } catch (error: any) {
    console.error(`Provisioning failed:`, error);

    await pool.query(
      "UPDATE stores SET status = 'failed', error_message = $1 WHERE id = $2",
      [error.message, storeId]
    );

    process.exit(1);
  }
}

main();
```

**Pros:**
- Native Kubernetes pattern
- Built-in retry logic
- No worker pool complexity
- Better resource isolation

**Cons:**
- More complex deployment (need provisioner image)
- Job cleanup required
- Slightly higher overhead

**Impact:** Unlimited concurrency (limited by cluster resources)

**Effort:** 2-3 days

---

## Phase 5: Production Hardening (Ongoing) 🛡️

### 5.1 External Secrets Management

**Options:**
1. **Sealed Secrets** (free, OSS)
2. **External Secrets Operator** (works with AWS/GCP/Azure/Vault)
3. **HashiCorp Vault** (enterprise-grade)

**Recommendation:** External Secrets Operator (flexibility)

**Implementation:**

```bash
# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

**AWS Secrets Manager Example:**

```yaml
# k8s/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: store-platform
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: postgres-credentials
  namespace: store-platform
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: postgres-secret
    creationPolicy: Owner
  data:
  - secretKey: postgres-password
    remoteRef:
      key: /store-platform/postgres
      property: password
```

**Helm Chart Updates:**

```yaml
# helm-charts/platform/values-prod.yaml
postgresql:
  existingSecret: postgres-secret  # Created by External Secrets
  passwordKey: postgres-password

secrets:
  provider: external-secrets
  backend: aws-secrets-manager
```

**Impact:** Production-grade secret management

**Effort:** 4-6 hours

---

### 5.2 Managed Database Migration

**Goal:** Use RDS/Cloud SQL instead of in-cluster Postgres.

**Helm Values:**

```yaml
# helm-charts/platform/values-prod.yaml
postgresql:
  enabled: false  # Don't deploy postgres

externalDatabase:
  enabled: true
  host: my-rds-instance.abc123.us-west-2.rds.amazonaws.com
  port: 5432
  database: store_platform
  existingSecret: rds-credentials
  passwordKey: password
```

**Helm Template Updates:**

```yaml
# helm-charts/platform/templates/platform-deployments.yaml
env:
- name: DB_HOST
  value: {{ if .Values.externalDatabase.enabled }}{{ .Values.externalDatabase.host }}{{ else }}postgres.{{ .Values.namespace }}.svc.cluster.local{{ end }}
- name: DB_PORT
  value: {{ if .Values.externalDatabase.enabled }}{{ .Values.externalDatabase.port | quote }}{{ else }}"5432"{{ end }}
# ... password from secret
```

**Benefits:**
- Automated backups
- High availability (Multi-AZ)
- Read replicas
- Better performance
- Managed upgrades

**Cost:** ~$15-50/month depending on size

**Effort:** 2-3 hours

---

### 5.3 Automatic Store Timeout Detection

**Goal:** Mark stuck provisions as failed.

**Implementation:**

```typescript
// orchestrator/src/services/timeoutDetector.ts
export class TimeoutDetector {
  private readonly TIMEOUT_MINUTES = 15;

  async detectTimedOutStores() {
    const timeoutThreshold = new Date(Date.now() - this.TIMEOUT_MINUTES * 60 * 1000);

    const result = await pool.query(`
      UPDATE stores
      SET status = 'failed',
          error_message = 'Provisioning timeout (>15 minutes)',
          updated_at = CURRENT_TIMESTAMP
      WHERE status = 'provisioning'
        AND created_at < $1
      RETURNING id, name
    `, [timeoutThreshold]);

    for (const store of result.rows) {
      console.log(`Marked store ${store.id} (${store.name}) as failed due to timeout`);

      await pool.query(
        'INSERT INTO store_events (store_id, event_type, message) VALUES ($1, $2, $3)',
        [store.id, 'timeout', 'Provisioning exceeded 15 minute timeout']
      );
    }

    return result.rows.length;
  }
}

// In reconciler
const timeoutDetector = new TimeoutDetector();
await timeoutDetector.detectTimedOutStores();
```

**Impact:** Prevents stuck stores, clear failure state

**Effort:** 1 hour

---

## Summary: Recommended Implementation Order

### Week 1: Quick Wins + User Identity
1. Lock down engine validation (1 hour)
2. Improve name validation (1 hour)
3. Add toast notifications (2 hours)
4. Add store events timeline (3 hours)
5. Pseudo-auth with localStorage (4 hours)

**Result:** Professional UX, working multi-tenancy demo

---

### Week 2: Medusa + Observability
6. Medusa Helm chart (2 days)
7. Prometheus metrics (1 day)
8. Grafana dashboards (4 hours)

**Result:** Multi-engine platform with monitoring

---

### Week 3: Scaling + Production
9. Worker pool for concurrent provisioning (2 days)
10. External secrets setup (4 hours)
11. Managed database migration (3 hours)
12. Timeout detection (1 hour)

**Result:** Production-ready, scalable platform

---

## Interview Talking Points

When discussing this system in interviews:

### Architecture Decisions
- "Started with polling for simplicity, but designed for easy migration to event-driven (Postgres LISTEN/NOTIFY)"
- "Chose advisory locks over leader election for lower complexity while maintaining safety"
- "Used Helm for templating but isolated injection vulnerabilities with values files"

### Scaling Strategy
- "Current: Sequential provisioning, 12-30 stores/hour"
- "Phase 1: Worker pool, 5x throughput"
- "Phase 2: Kubernetes Jobs, unlimited parallelism"
- "Bottleneck shifts from orchestrator to Kubernetes API rate limits"

### Reliability
- "Idempotent operations at every level: API (idempotency keys), orchestrator (existence checks), Helm (--wait)"
- "Graceful degradation: DB errors don't crash service, failed provisions don't block others"
- "Observability: Correlation IDs, structured logs, metrics, event timeline"

### Multi-Tenancy
- "Phase 1: Pseudo-auth for demo (localStorage)"
- "Phase 2: JWT + user table"
- "Isolation: Namespace-per-store with ResourceQuotas"
- "Future: Network Policies for network-level isolation"

---

**Total Effort: 2-3 weeks part-time for full implementation**

This roadmap balances **demonstration value** (impress interviewers) with **production viability** (actually use for side projects/customers).