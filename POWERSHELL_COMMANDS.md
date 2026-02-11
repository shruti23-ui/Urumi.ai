# PowerShell Command Reference

**You're using PowerShell!** This guide shows the correct commands for PowerShell users.

---

## 🔍 How to Know You're in PowerShell

- Window title says "Windows PowerShell" or "PowerShell"
- Prompt shows `PS C:\>`
- Window is usually blue background

**If you want to use Command Prompt instead:**
- Press `Windows Key + R`
- Type `cmd`
- Press Enter
- Commands are simpler in Command Prompt!

---

## ✅ Quick Start Commands (PowerShell)

### 1. Check Docker
```powershell
docker ps
```

### 2. Check Kubernetes
```powershell
kubectl get nodes
```

### 3. Start PostgreSQL
```powershell
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=store_platform -p 5432:5432 postgres:16
```

### 4. Check PostgreSQL Running
```powershell
docker ps | Select-String postgres
```

---

## 🚀 Starting Services (PowerShell)

Open 3 PowerShell windows:

### Window 1 - Backend
```powershell
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev
```

### Window 2 - Orchestrator
```powershell
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev
```

### Window 3 - Frontend
```powershell
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev
```

---

## 🧪 Testing Commands (PowerShell)

### Test Backend Health
```powershell
curl.exe http://localhost:3001/health
```

**OR using PowerShell native:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### Create a Store
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"TestStore","engine":"woocommerce"}'
```

**OR using curl.exe:**
```powershell
curl.exe -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d '{\"name\":\"TestStore\",\"engine\":\"woocommerce\"}'
```

### List All Stores
```powershell
curl.exe http://localhost:3001/api/stores
```

**OR:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stores"
```

---

## 🎯 Kubernetes Commands (PowerShell)

### Check All Store Namespaces
```powershell
kubectl get namespaces | Select-String store-
```

### Check Pods in a Namespace
```powershell
kubectl get pods -n store-teststore-abc123
```
(Replace with your actual namespace)

### Check Ingress
```powershell
kubectl get ingress -n store-teststore-abc123
```

### Check Events
```powershell
kubectl get events -n store-teststore-abc123 --sort-by='.lastTimestamp'
```

---

## 🔧 Troubleshooting (PowerShell)

### Find Process Using a Port
```powershell
# Backend (port 3001)
netstat -ano | Select-String :3001

# Orchestrator (port 3002)
netstat -ano | Select-String :3002

# Frontend (port 5173)
netstat -ano | Select-String :5173
```

### Kill a Process
```powershell
Stop-Process -Id <PID> -Force
```

**Example:**
```powershell
# First find the PID
netstat -ano | Select-String :3001
# Output shows: TCP  0.0.0.0:3001  ...  12345

# Then kill it
Stop-Process -Id 12345 -Force
```

### Restart PostgreSQL
```powershell
docker restart postgres
```

### Delete Stuck Namespace
```powershell
kubectl delete namespace store-xxx-xxx --force --grace-period=0
```

---

## 📊 Complete Testing Script (PowerShell)

Copy and paste this entire block to test everything:

```powershell
Write-Host "=== Docker Status ===" -ForegroundColor Green
docker ps

Write-Host "`n=== Kubernetes Status ===" -ForegroundColor Green
kubectl get nodes

Write-Host "`n=== PostgreSQL Status ===" -ForegroundColor Green
docker ps | Select-String postgres

Write-Host "`n=== Backend Health ===" -ForegroundColor Green
curl.exe http://localhost:3001/health

Write-Host "`n=== All Stores ===" -ForegroundColor Green
curl.exe http://localhost:3001/api/stores

Write-Host "`n=== Store Namespaces ===" -ForegroundColor Green
kubectl get namespaces | Select-String store-

Write-Host "`n=== All Store Pods ===" -ForegroundColor Green
kubectl get pods --all-namespaces | Select-String store-
```

---

## 🎬 Demo Commands (PowerShell)

### 1. Show Backend Health
```powershell
curl.exe http://localhost:3001/health
```

### 2. Create Demo Store
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"DemoStore","engine":"woocommerce"}'
```

### 3. Wait 30 Seconds
```powershell
Start-Sleep -Seconds 30
```

### 4. Show Kubernetes Resources
```powershell
kubectl get namespaces | Select-String store-
kubectl get pods --all-namespaces | Select-String store-
```

### 5. Show Store Ready
```powershell
curl.exe http://localhost:3001/api/stores
```

### 6. Get Store ID for Deletion
```powershell
$stores = Invoke-RestMethod -Uri "http://localhost:3001/api/stores"
$stores[0].id
```

### 7. Delete Store
```powershell
$storeId = $stores[0].id
Invoke-RestMethod -Uri "http://localhost:3001/api/stores/$storeId" -Method DELETE
```

---

## 💡 PowerShell vs Command Prompt Comparison

| Task | Command Prompt | PowerShell |
|------|----------------|------------|
| **Filter text** | `\| findstr text` | `\| Select-String text` |
| **Use curl** | `curl <url>` | `curl.exe <url>` |
| **POST request** | `curl -X POST -H "..." -d "..."` | `Invoke-RestMethod -Method POST -Headers @{...} -Body '...'` |
| **Kill process** | `taskkill /PID <num> /F` | `Stop-Process -Id <num> -Force` |
| **Sleep/Wait** | `timeout 30` | `Start-Sleep -Seconds 30` |
| **Docker commands** | Same | Same |
| **kubectl commands** | Same (except pipe to findstr) | Same (except pipe to Select-String) |
| **npm commands** | Same | Same |

---

## 🎯 Most Important PowerShell Differences

### 1. Always use `curl.exe` instead of `curl`
❌ Wrong:
```powershell
curl http://localhost:3001/health
```

✅ Correct:
```powershell
curl.exe http://localhost:3001/health
```

### 2. Use `Select-String` instead of `findstr`
❌ Wrong:
```powershell
kubectl get namespaces | findstr store-
```

✅ Correct:
```powershell
kubectl get namespaces | Select-String store-
```

### 3. Use `Invoke-RestMethod` for API calls
❌ Complex (but works):
```powershell
curl.exe -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d '{\"name\":\"TestStore\",\"engine\":\"woocommerce\"}'
```

✅ Better (PowerShell native):
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"TestStore","engine":"woocommerce"}'
```

### 4. Use `Stop-Process` instead of `taskkill`
❌ Works but not native:
```powershell
taskkill /PID 12345 /F
```

✅ Better (PowerShell native):
```powershell
Stop-Process -Id 12345 -Force
```

---

## 🆘 Common PowerShell Errors

### Error: "Cannot bind parameter 'Headers'"
**Cause:** Using `curl` instead of `curl.exe` or wrong syntax

**Fix:** Use `curl.exe` or `Invoke-RestMethod`:
```powershell
# Option 1
curl.exe -X POST http://localhost:3001/api/stores -H "Content-Type: application/json" -d '{\"name\":\"Test\",\"engine\":\"woocommerce\"}'

# Option 2
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Test","engine":"woocommerce"}'
```

### Error: "findstr is not recognized"
**Cause:** `findstr` is Command Prompt, not PowerShell

**Fix:** Use `Select-String`:
```powershell
kubectl get namespaces | Select-String store-
```

### Error: "taskkill is not recognized as a cmdlet"
**Cause:** Wrong syntax for PowerShell

**Fix:** Use `Stop-Process`:
```powershell
Stop-Process -Id 12345 -Force
```

---

## ✅ Ready-to-Use Testing Sequence

Copy this entire block and run in PowerShell:

```powershell
# 1. Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan
docker ps
kubectl get nodes

# 2. Start PostgreSQL (if not running)
Write-Host "`nStarting PostgreSQL..." -ForegroundColor Cyan
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=store_platform -p 5432:5432 postgres:16

# 3. Wait for PostgreSQL
Write-Host "`nWaiting for PostgreSQL to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# 4. Verify PostgreSQL
Write-Host "`nVerifying PostgreSQL..." -ForegroundColor Cyan
docker ps | Select-String postgres

# 5. Test backend (make sure backend is running in another window!)
Write-Host "`nTesting backend health..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
curl.exe http://localhost:3001/health

# 6. Create test store
Write-Host "`nCreating test store..." -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"PowerShellTest","engine":"woocommerce"}'

# 7. List stores
Write-Host "`nListing all stores..." -ForegroundColor Cyan
curl.exe http://localhost:3001/api/stores

# 8. Check Kubernetes
Write-Host "`nChecking Kubernetes namespaces..." -ForegroundColor Cyan
kubectl get namespaces | Select-String store-

Write-Host "`nAll tests complete!" -ForegroundColor Green
```

---

## 📋 Quick Reference Card (Print This!)

```powershell
# POWERSHELL QUICK REFERENCE

# Health Checks
curl.exe http://localhost:3001/health
curl.exe http://localhost:3002/health

# Create Store
Invoke-RestMethod -Uri "http://localhost:3001/api/stores" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Test","engine":"woocommerce"}'

# List Stores
curl.exe http://localhost:3001/api/stores

# Check Kubernetes
kubectl get namespaces | Select-String store-
kubectl get pods --all-namespaces | Select-String store-

# Find & Kill Process
netstat -ano | Select-String :3001
Stop-Process -Id <PID> -Force

# Restart Database
docker restart postgres
```

---

## 🎓 Pro Tips for PowerShell Users

1. **Tab completion works!** Type `kubectl get pods -n store-` then press `Tab`

2. **Use aliases:**
   ```powershell
   Set-Alias -Name curl -Value curl.exe
   ```
   Now `curl` will work like Command Prompt!

3. **Save your testing script:**
   Copy the "Ready-to-Use Testing Sequence" above into a file called `test.ps1`
   Run it anytime with: `.\test.ps1`

4. **Colorize output:**
   ```powershell
   kubectl get pods -n store-xxx | Select-String "Running" | Write-Host -ForegroundColor Green
   ```

5. **Switch to Command Prompt if frustrated!**
   - Commands are simpler
   - Less syntax to remember
   - Just type `cmd` in Windows search

---

**🎉 You're ready to test with PowerShell!**

**Remember:** Use `curl.exe` and `Select-String` - those are the two main differences!
