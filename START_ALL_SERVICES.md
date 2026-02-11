# How to Start All Services - Simple Guide

## ✅ Complete System Startup (3 PowerShell Windows)

### Window 1: Backend
```powershell
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev
```
**Wait for:** `Platform API started on port 3001`

---

### Window 2: Orchestrator
```powershell
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev
```
**Wait for:** `Reconciliation loop running`

---

### Window 3: Frontend
```powershell
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1
.\START_FRONTEND.ps1
```
**Wait for:** `Local: http://localhost:5173/`

---

## 🌐 Then Open Browser

Go to: **http://localhost:5173**

---

## 🔧 If Frontend Won't Start

### Manual Method:

```powershell
# 1. Stop anything on port 5173
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 2. Wait 2 seconds
Start-Sleep -Seconds 2

# 3. Start frontend
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev
```

---

## ✅ Verify All Services Running

```powershell
# Check backend
curl.exe http://localhost:3001/health

# Check frontend
curl.exe http://localhost:5173
```

Both should return data (not errors).

---

## 📊 Expected Ports

| Service | Port | URL |
|---------|------|-----|
| Backend | 3001 | http://localhost:3001 |
| Orchestrator | 3002 | (no web interface) |
| Frontend | 5173 | http://localhost:5173 |

---

## 🎯 Quick Status Check

```powershell
netstat -ano | Select-String ":3001|:5173"
```

Should show 2 lines (backend on 3001, frontend on 5173).

---

## 🚨 Emergency Reset

If nothing works:

```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 5 seconds
Start-Sleep -Seconds 5

# Start backend
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start orchestrator
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start frontend
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
```

This opens 3 new PowerShell windows automatically.
