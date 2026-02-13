# Urumi Clothing - Multi-Tenant E-Commerce Platform

A Kubernetes-based platform for provisioning and managing WooCommerce stores. Each store gets its own isolated namespace with automated WordPress installation, product setup, and lifecycle management.

## Current Status

**Store Status:** Fully operational
**Theme:** Storefront (WooCommerce official theme)
**Cart & Checkout:** Working
**Payment:** Cash on Delivery enabled
**Products:** 3 products live (Shoes, Jeans, T-Shirt)

**Recent Updates:**
- Deployed React dashboard for store creation on public IP (http://51.20.42.151:30300)
- Fixed cart by disabling WooCommerce "Coming Soon" mode
- Switched to Storefront theme for compatibility
- Improved UX copy: "Curated Fashion for the Modern You"
- Updated all URLs to production endpoints
- Added comprehensive admin documentation
- Cleaned up codebase (removed .claude traces)

---

## Live Deployment

**Production:** http://51.20.42.151:30232/

### Urumi Clothing Store
- Homepage: http://51.20.42.151:30232/
- Shop: http://51.20.42.151:30232/shop/
- Admin: http://51.20.42.151:30232/wp-admin
  - Username: `admin`
  - Password: `Admin@123!`

### Platform API (Public Access)
**Base URL:** http://51.20.42.151:30395

**Endpoints:**
- Root: http://51.20.42.151:30395/
- Health Check: http://51.20.42.151:30395/health
- List Stores: http://51.20.42.151:30395/api/stores
- Create Store: `POST http://51.20.42.151:30395/api/stores`

**Quick Test:**
```bash
# Test API health
curl http://51.20.42.151:30395/health

# Create a new store
curl -X POST http://51.20.42.151:30395/api/stores \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{
    "name": "My Fashion Store",
    "engine": "woocommerce"
  }'
```

### React Dashboard (Store Creation UI)
**Dashboard URL:** http://51.20.42.151:30300/

The React dashboard provides a web interface for managing stores:
- Create new WooCommerce stores with a simple form
- View all existing stores and their status
- Monitor store health and provisioning progress
- Delete stores when no longer needed

The dashboard automatically connects to the Platform API at http://51.20.42.151:30395/api for backend operations.

### AWS Security Group Configuration

To access from external networks, configure AWS Security Group inbound rule:

```
Type: Custom TCP
Port Range: 30000-32767
Source: 0.0.0.0/0
Description: Kubernetes NodePort Services
```

**Location:** AWS Console → EC2 → Security Groups → launch-wizard-2 (eu-north-1)

---

## Store Features

**Products:**
- Casual Shoes - ₹1,500.00
- Denim Jeans - ₹1,200.00
- Cotton T-Shirt - ₹500.00

**What's included:**
- Hero banner with brand identity
- Featured products display
- Shopping cart with session persistence
- Cash on Delivery payment
- Mobile-responsive design
- WordPress 6.4 + WooCommerce
- Storefront theme (optimized for WooCommerce)

---

## Admin Access

### Accessing the Store Admin Panel

**URL:** http://51.20.42.151:30232/wp-admin

**Credentials:**
- Username: `admin`
- Password: `Admin@123!`

### What You Can Do as Admin

**Dashboard Overview:**
- View orders, sales, and store statistics
- Monitor recent customer activity
- Check WooCommerce analytics

**Products Management:**
- Add, edit, or delete products
- Set prices and manage inventory
- Upload product images
- Configure product categories and tags

**Orders:**
- View all customer orders
- Change order status (Processing, Completed, Cancelled)
- Process refunds
- Print invoices

**WooCommerce Settings:**
- Configure payment gateways (COD enabled by default)
- Set up shipping methods and rates
- Manage tax settings
- Configure email notifications

**Theme & Appearance:**
- Currently using Storefront theme
- Customize colors and typography
- Manage menus and widgets
- Edit homepage layout

**Users:**
- View customer accounts
- Add new admin users
- Manage user roles and permissions

### Viewing Store as Customer

To see what customers see:
1. Open http://51.20.42.151:30232/ in an incognito/private window
2. Browse products at http://51.20.42.151:30232/shop/
3. Add items to cart and test checkout flow
4. Use COD (Cash on Delivery) payment method

### Quick Admin Tasks

**Add a new product:**
```
1. Go to Products → Add New
2. Enter product name and description
3. Set regular price in INR (₹)
4. Upload product image
5. Set stock status to "In stock"
6. Click Publish
```

**View orders:**
```
1. Go to WooCommerce → Orders
2. Click on any order to see details
3. Change status using dropdown (Processing/Completed)
4. Save changes
```

**Check store settings:**
```
1. Go to WooCommerce → Settings
2. Review General, Products, Shipping, Payments tabs
3. Payment: COD is enabled
4. Currency: INR (₹)
```

---

## API Access

### Public API (Production)
**For creating stores and external access, use the public IP:**

```bash
# Base URL
http://51.20.42.151:30395

# Test connection
curl http://51.20.42.151:30395/health

# List all stores
curl http://51.20.42.151:30395/api/stores -H "x-user-id: your-user-id"

# Create a new store
curl -X POST http://51.20.42.151:30395/api/stores \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{"name": "My Store", "engine": "woocommerce"}'
```

**Response example:**
```json
{
  "store": {
    "id": "abc123",
    "name": "My Store",
    "status": "provisioning",
    "url": "http://51.20.42.151:30XXX",
    "namespace": "store-my-store-abc123"
  }
}
```

Store will be ready in 2-3 minutes at the provided URL.

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL 15 (or use Docker)

### Quick Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- Backend API: http://localhost:3001/ (Platform management)
- Backend Health: http://localhost:3001/health
- Frontend Dashboard: http://localhost:3000 (Store management UI)
- PostgreSQL: localhost:5432

**Test localhost:**
```bash
# Check backend health
curl http://localhost:3001/health

# Expected: {"status":"healthy","database":"connected",...}
```

**Note:** Localhost is for platform development only. For creating stores, use the public IP: http://51.20.42.151:30395

### Manual Setup

**1. Database:**
```bash
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=store_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:15-alpine
```

**2. Backend API:**
```bash
cd backend
npm install
npm run dev
```
Runs at: http://localhost:3001

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs at: http://localhost:5173

**4. Verify Installation:**
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"healthy","database":"connected","timestamp":"..."}
```

---

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌────────────┐     ┌─────────────┐
│   Client    │────▶│   API    │────▶│ PostgreSQL │◀────│ Orchestrator│
│  (Browser)  │     │ (Express)│     │            │     │   (Node.js) │
└─────────────┘     └──────────┘     └────────────┘     └──────┬──────┘
                                                                │
                                                                ▼
                                                         ┌──────────────┐
                                                         │     Helm     │
                                                         │   Operator   │
                                                         └──────┬───────┘
                                                                │
                                                                ▼
                                                    ┌───────────────────────┐
                                                    │  Kubernetes (k3s)     │
                                                    │  ┌─────────────────┐  │
                                                    │  │ Store Namespace │  │
                                                    │  │  - WordPress    │  │
                                                    │  │  - MySQL        │  │
                                                    │  │  - PVC          │  │
                                                    │  └─────────────────┘  │
                                                    └───────────────────────┘
```

### Components

**Backend API** (Node.js/Express/TypeScript)
- REST API for store management
- Rate limiting: 100 requests per 15 minutes
- User quotas: 10 stores per user
- CORS with origin whitelist
- Health check endpoints

**Orchestrator** (Node.js/TypeScript)
- Reconciliation loop polls every 5-30 seconds
- Deploys Helm charts automatically
- Manages store lifecycle
- Exponential backoff on failures

**Frontend** (React/Vite/TypeScript)
- Store creation interface
- Status monitoring
- Event logs

**PostgreSQL 15**
- Platform metadata
- Store provisioning queue
- Audit logs

**Helm Charts**
- WooCommerce store templates
- WordPress 6.4 + MySQL 8.0
- Persistent volumes
- Resource quotas

---

## Platform Features

**Namespace Isolation**
- Dedicated Kubernetes namespace per store
- Resource quotas: 2 CPU, 4Gi RAM
- Network policies for pod isolation
- Persistent storage: 20Gi per store

**Automated Store Provisioning**
- WordPress installation via sidecar container
- WooCommerce activation and configuration
- Sample products with Pexels images
- Currency configuration (INR)
- Payment gateway setup (COD)

**Security & RBAC**
- Service account with least-privilege permissions
- Kubernetes secrets for credentials
- Non-root containers (except setup sidecar)
- Helmet.js security headers
- CORS origin validation

**Access Control**
- NodePort services (30000-32767 range)
- Rate limiting middleware
- Request size limits (1MB)
- Correlation ID tracking

---

## Deployment on AWS

### Prerequisites
- AWS EC2 instance (t2.medium minimum, 2 vCPU, 4GB RAM)
- k3s Kubernetes distribution
- Docker runtime
- kubectl CLI
- Helm 3

### Installation Steps

```bash
# Clone repository
git clone https://github.com/shruti23-ui/Urumi.ai
cd Urumi.ai_Round_1

# Deploy platform using Helm
helm upgrade --install store-platform ./helm-charts/platform \
  -f helm-charts/platform/values-vps.yaml \
  --namespace store-platform \
  --create-namespace

# Verify deployment
kubectl get pods -n store-platform
kubectl get svc -n store-platform

# Check platform API
curl http://localhost:30395/health
```

### Create a Store via API

```bash
curl -X POST http://<AWS_IP>:30395/api/stores \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{
    "name": "My Fashion Store",
    "engine": "woocommerce"
  }'
```

Response:
```json
{
  "store": {
    "id": "abc123",
    "name": "My Fashion Store",
    "status": "provisioning",
    "namespace": "store-my-fashion-store-abc123"
  }
}
```

Store will be ready in 2-3 minutes. Access via NodePort URL returned in response.

---

## Technology Stack

**Backend**
- Runtime: Node.js 20
- Framework: Express 4
- Language: TypeScript 5
- Database: PostgreSQL 15
- ORM: node-postgres

**Orchestrator**
- Runtime: Node.js 20
- Language: TypeScript 5
- Kubernetes Client: Helm SDK
- Database: PostgreSQL 15

**Frontend**
- Framework: React 18
- Build Tool: Vite 5
- Language: TypeScript 5
- HTTP Client: Axios

**Store Template**
- CMS: WordPress 6.4
- E-commerce: WooCommerce 8+
- Database: MySQL 8.0
- Server: Apache 2.4

**Infrastructure**
- Orchestration: Kubernetes (k3s)
- Package Manager: Helm 3
- Container Runtime: Docker
- Cloud Provider: AWS EC2
- Region: eu-north-1

---

## Environment Configuration

### Backend (.env)

```bash
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_platform
DB_USER=postgres
DB_PASSWORD=postgres
KUBECONFIG=/path/to/.kube/config
PLATFORM_NAMESPACE=store-platform
MAX_STORES_PER_USER=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DEFAULT_DOMAIN_SUFFIX=.local.stores.dev
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (.env)

```bash
# Local development
VITE_API_URL=http://localhost:3001/api
```

### Frontend (.env.production)

```bash
# AWS production
VITE_API_URL=http://51.20.42.151:30395/api
```

### Orchestrator (.env)

```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_platform
DB_USER=postgres
DB_PASSWORD=postgres
KUBECONFIG=/path/to/.kube/config
PLATFORM_NAMESPACE=store-platform
MIN_POLL_INTERVAL_MS=5000
MAX_POLL_INTERVAL_MS=30000
HELM_CHARTS_PATH=./helm-charts
DEFAULT_DOMAIN_SUFFIX=.local.stores.dev
HELM_RELEASE_TIMEOUT=600
```

---

## API Documentation

### Endpoints

**GET /** - API Information
```bash
curl http://localhost:3001/
```

**GET /health** - Health Check
```bash
curl http://localhost:3001/health
```

**GET /api/stores** - List All Stores
```bash
curl http://localhost:3001/api/stores \
  -H "x-user-id: user123"
```

**POST /api/stores** - Create Store
```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "name": "Fashion Boutique",
    "engine": "woocommerce"
  }'
```

**GET /api/stores/:id** - Get Store Details
```bash
curl http://localhost:3001/api/stores/abc123 \
  -H "x-user-id: user123"
```

**DELETE /api/stores/:id** - Delete Store
```bash
curl -X DELETE http://localhost:3001/api/stores/abc123 \
  -H "x-user-id: user123"
```

**GET /api/stores/:id/events** - Get Store Events
```bash
curl http://localhost:3001/api/stores/abc123/events \
  -H "x-user-id: user123"
```

---

## Troubleshooting

### Can't connect to localhost:3001

**Problem:** Getting `ERR_CONNECTION_REFUSED`

**Fix:**
```bash
# Check if backend is running
netstat -ano | findstr :3001

# Start backend
cd backend
npm install
npm run dev

# Verify
curl http://localhost:3001/health
```

### Can't access AWS store

**Problem:** Site not loading in browser

**Fix:** Add Security Group rule
1. Navigate to: AWS Console → EC2 → Security Groups
2. Select: launch-wizard-2 (eu-north-1)
3. Add inbound rule: TCP ports 30000-32767, source 0.0.0.0/0

### Cart shows "Great things are on the horizon" placeholder

**Problem:** Cart and other pages show placeholder text instead of actual content

**Root Cause:** WooCommerce "Coming Soon" mode was enabled

**Solution:**
```bash
# SSH into AWS
ssh -i ~/.ssh/aws-key.pem ubuntu@51.20.42.151

# Get pod name
POD=$(sudo k3s kubectl get pods -n store-urumi-clothing-04f87684 -l app=urumi-clothing -o jsonpath='{.items[0].metadata.name}')

# Disable coming soon mode
sudo k3s kubectl exec -n store-urumi-clothing-04f87684 $POD -c wp-setup -- \
  wp option update woocommerce_coming_soon no --allow-root

# Clear cache
sudo k3s kubectl exec -n store-urumi-clothing-04f87684 $POD -c wp-setup -- \
  wp cache flush --allow-root
```

Cart and checkout should now work properly.

### Store creation fails locally

**Problem:** Error when creating store

**Note:** Store creation needs a Kubernetes cluster. Local dev doesn't support provisioning. Use AWS deployment for full functionality.

### Database connection error

**Problem:** Backend can't connect to PostgreSQL

**Fix:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=store_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:15-alpine

# Test connection
psql -h localhost -U postgres -d store_platform
```

### Pods stuck in Pending

**Problem:** Platform pods not starting

**Fix:**
```bash
# Check pod status
kubectl get pods -n store-platform

# Check events
kubectl describe pod <pod-name> -n store-platform

# Check logs
kubectl logs <pod-name> -n store-platform

# Restart deployment
kubectl rollout restart deployment/platform-api -n store-platform
```

---

## Security Considerations

**Rate Limiting**
- Global: 100 requests per 15-minute window
- Store creation: Maximum 10 stores per user
- Health endpoints: Exempt from rate limiting

**CORS Policy**
- Whitelist-based origin validation
- Credentials support enabled
- Preflight request handling

**Authentication**
- User identification via x-user-id header
- Future: JWT token-based authentication

**Container Security**
- Non-root user execution (except WordPress setup sidecar)
- Read-only root filesystem where applicable
- Security context constraints

**Network Security**
- Kubernetes network policies
- Namespace isolation
- Service-to-service communication restrictions

---

## Project Structure

```
Urumi.ai_Round_1/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── index.ts           # Application entry point
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Rate limiting, validation
│   │   └── utils/             # Logger, helpers
│   ├── migrations/            # Database migrations
│   ├── .env                   # Environment variables
│   └── Dockerfile
│
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── services/          # API client
│   ├── .env                   # API URL configuration
│   └── Dockerfile
│
├── orchestrator/               # Kubernetes reconciliation
│   ├── src/
│   │   ├── index.ts
│   │   ├── k8s/               # Helm SDK integration
│   │   └── services/          # Reconciler logic
│   ├── .env
│   └── Dockerfile
│
├── helm-charts/
│   ├── platform/              # Platform infrastructure
│   │   ├── values.yaml
│   │   ├── values-vps.yaml    # AWS configuration
│   │   └── templates/
│   │       ├── platform-deployments.yaml
│   │       ├── postgres-statefulset.yaml
│   │       ├── ingress.yaml
│   │       └── rbac.yaml
│   │
│   └── woocommerce-store/     # Store template
│       ├── values.yaml
│       └── templates/
│           ├── wordpress-deployment.yaml
│           ├── mysql-deployment.yaml
│           └── service.yaml
│
├── k8s/                       # Kubernetes manifests
│   └── rbac/
│       └── orchestrator-rbac.yaml
│
├── scripts/                   # Automation scripts
│   └── setup-fashion-store.sh
│
├── docker-compose.yml         # Local development
├── README.md                  # This file
├── Home.jpeg                  # Screenshots
├── Products.jpeg
├── Product.jpeg
└── Admin.jpeg
```

---

## Performance Metrics

**API Response Times**
- Health check: <10ms
- Store listing: <50ms
- Store creation: 2-3 minutes (Kubernetes provisioning)

**Resource Usage (per store)**
- CPU: 100m-1000m (requests-limits)
- Memory: 256Mi-2Gi (requests-limits)
- Storage: 10Gi (WordPress) + 5Gi (MySQL)

**Scalability**
- Platform API: Horizontal scaling (2+ replicas)
- Orchestrator: Single instance (leader election recommended for HA)
- Stores: Isolated namespaces with quotas

---

## Screenshots

### Home Page
![Home Page](Home.jpeg)

### Featured Products
![Products](Products.jpeg)

### Order Confirmation
![Checkout](Product.jpeg)

### Admin Dashboard
![Admin](Admin.jpeg)

---

## Disclaimer

"Urumi Clothing" is a fictional brand name used exclusively for demonstration purposes. This project is not associated with any real business or commercial entity.

---

## License

MIT License - See LICENSE file for details

---

## Author

**Shruti Priya**
GitHub: [@shruti23-ui](https://github.com/shruti23-ui)
Repository: [Urumi.ai](https://github.com/shruti23-ui/Urumi.ai)

---

## Contributing

This is a demonstration project. For issues or suggestions, please open an issue on GitHub.
