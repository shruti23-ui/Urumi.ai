# Testing Commands Cheatsheet

## Quick Start (Copy and Run These)

### 1. Check Prerequisites
```bash
# Check Docker
docker ps

# Check Kubernetes
kubectl get nodes

# Check PostgreSQL
docker ps | findstr postgres
```

---

### 2. Start PostgreSQL (if not running)
```bash
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=store_platform -p 5432:5432 postgres:16
```

---

### 3. Start Backend (Window 1)
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev
```
✅ **Look for:** `Platform API started on port 3001`

---

### 4. Start Orchestrator (Window 2)
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev
```
✅ **Look for:** `Store Platform Orchestrator starting...`

---

### 5. Start Frontend (Window 3)
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev
```
✅ **Look for:** `Local: http://localhost:5173/`

---

## Testing Commands (Copy One by One)

### Test 1: Backend Health
```bash
curl http://localhost:3001/health
```
✅ **Expected:** `{"status":"healthy",...}`

---

### Test 2: Create Store via API
```bash
curl -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d "{\"name\":\"TestStore\",\"engine\":\"woocommerce\"}"
```
✅ **Expected:** `{"id":"...","name":"TestStore","status":"provisioning"}`

---

### Test 3: List All Stores
```bash
curl http://localhost:3001/api/stores
```
✅ **Expected:** `[{...stores array...}]`

---

### Test 4: Check Kubernetes Namespaces
```bash
kubectl get namespaces | findstr store-
```
✅ **Expected:** Shows lines with `store-teststore-...`

---

### Test 5: Check Store Pods
```bash
kubectl get pods -n store-teststore-<TAB to autocomplete>
```
✅ **Expected:** Shows pods with STATUS `Running`

---

### Test 6: Check Store Ingress
```bash
kubectl get ingress --all-namespaces | findstr store-
```
✅ **Expected:** Shows ingress URLs for stores

---

### Test 7: Watch Orchestrator Work
```bash
kubectl get events -n store-teststore-<namespace> --sort-by='.lastTimestamp'
```
✅ **Expected:** Shows Kubernetes events for store creation

---

### Test 8: Delete a Store via API
```bash
curl -X DELETE http://localhost:3001/api/stores/<store-id>
```
✅ **Expected:** `{"message":"Store deleted successfully"}`

---

## Browser Testing

### Test 1: Open Frontend
1. Open browser
2. Go to: http://localhost:5173
✅ **Expected:** See "E-commerce Store Provisioning Platform"

---

### Test 2: Create Store from UI
1. Enter Store Name: `DemoShop`
2. Select Engine: `WooCommerce`
3. Click "Create Store"
✅ **Expected:** Status shows "Provisioning"

---

### Test 3: Wait for Ready
1. Wait 2-5 minutes
2. Page auto-refreshes
✅ **Expected:** Status changes to "Ready"

---

### Test 4: Delete Store
1. Click "Delete" button
2. Confirm
✅ **Expected:** Store disappears from list

---

## Troubleshooting Commands

### Kill Processes on Port
```bash
# Backend (3001)
netstat -ano | findstr :3001
taskkill /PID <number> /F

# Orchestrator (3002)
netstat -ano | findstr :3002
taskkill /PID <number> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <number> /F
```

---

### Restart PostgreSQL
```bash
docker restart postgres
```

---

### Check PostgreSQL Connection
```bash
docker exec -it postgres psql -U postgres -d store_platform -c "SELECT 1;"
```
✅ **Expected:** `?column? 1`

---

### Delete Stuck Store Namespace
```bash
kubectl delete namespace store-<name>-<id> --grace-period=0 --force
```

---

### View All Resources in Namespace
```bash
kubectl get all -n store-<namespace>
```

---

### View Pod Logs
```bash
kubectl logs <pod-name> -n store-<namespace>
```

---

### Describe Pod (for errors)
```bash
kubectl describe pod <pod-name> -n store-<namespace>
```

---

## One-Command Full Test

```bash
curl http://localhost:3001/health && curl http://localhost:3001/api/stores && kubectl get nodes && docker ps | findstr postgres && echo "All systems operational!"
```

---

## Demo Mode (Run in Sequence)

```bash
# 1. Show backend health
curl http://localhost:3001/health

# 2. Create store
curl -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d "{\"name\":\"DemoStore\",\"engine\":\"woocommerce\"}"

# 3. Show orchestrator working (wait 30 seconds)
timeout 30

# 4. Show Kubernetes resources
kubectl get namespaces | findstr store-
kubectl get pods --all-namespaces | findstr store-

# 5. Show store ready
curl http://localhost:3001/api/stores

# 6. Clean up (optional)
curl -X DELETE http://localhost:3001/api/stores/<store-id>
```

---

## Status Check Script

Copy this entire block and run to check everything:

```bash
echo "=== Docker Status ==="
docker ps

echo ""
echo "=== Kubernetes Status ==="
kubectl get nodes

echo ""
echo "=== PostgreSQL Status ==="
docker ps | findstr postgres

echo ""
echo "=== Backend Health ==="
curl -s http://localhost:3001/health

echo ""
echo "=== All Stores ==="
curl -s http://localhost:3001/api/stores

echo ""
echo "=== Store Namespaces ==="
kubectl get namespaces | findstr store-

echo ""
echo "=== All Store Pods ==="
kubectl get pods --all-namespaces | findstr store-
```

---

## URLs to Remember

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Backend Health | http://localhost:3001/health |
| Orchestrator | http://localhost:3002 |
| API Stores List | http://localhost:3001/api/stores |

---

## Expected Timings

| Action | Time |
|--------|------|
| Backend start | 3-5 seconds |
| Orchestrator start | 3-5 seconds |
| Frontend start | 5-10 seconds |
| Store provisioning | 2-5 minutes |
| Store deletion | 30-60 seconds |

---

## Success Indicators

### Backend Running
```
✅ Platform API started on port 3001
✅ Database connection successful
```

### Orchestrator Running
```
✅ Store Platform Orchestrator starting...
✅ Database connection successful
✅ Starting reconciliation loop...
```

### Frontend Running
```
✅ Local: http://localhost:5173/
```

### Store Provisioning Success
```
✅ Orchestrator logs: "Store ... is now ready"
✅ kubectl get pods: All show "Running"
✅ API response: status = "ready"
```

---

**Print this page and keep it handy during your demo!**
