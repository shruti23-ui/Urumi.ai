# 🚀 START HERE - Complete Testing Guide

**For Non-Technical Users | Zero Coding Knowledge Required**

---

## ⚠️ IMPORTANT: PowerShell vs Command Prompt

**Are you using PowerShell?** (Blue window, says "PowerShell" in title)

👉 **READ THIS FIRST:** [POWERSHELL_COMMANDS.md](POWERSHELL_COMMANDS.md)

**Key differences:**
- Use `curl.exe` instead of `curl`
- Use `Select-String` instead of `findstr`
- Use `Invoke-RestMethod` for API calls

**Want it simpler?** Use Command Prompt instead:
- Press `Windows Key + R`
- Type `cmd`
- Press Enter
- Commands are easier!

---

## 📚 What You Have (5 Testing Documents)

I've created 4 comprehensive guides for you:

1. **[POWERSHELL_COMMANDS.md](POWERSHELL_COMMANDS.md)** 💙 POWERSHELL USERS READ THIS
   - PowerShell-specific commands
   - Differences from Command Prompt
   - Ready-to-use scripts

2. **[SIMPLE_TESTING_GUIDE.md](SIMPLE_TESTING_GUIDE.md)** ⭐ START HERE
   - Explains what each part does
   - Step-by-step testing instructions
   - Both PowerShell AND Command Prompt versions

3. **[TESTING_COMMANDS_CHEATSHEET.md](TESTING_COMMANDS_CHEATSHEET.md)** 📋 QUICK REFERENCE
   - All commands in one place
   - Copy-paste ready
   - No explanations, just commands

4. **[WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md)** 🔄 VISUAL GUIDE
   - Visual diagrams
   - Timeline of what happens when
   - Troubleshooting by component

5. **[QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)** ✅ CHECKLIST
   - Pre-made checklist format
   - Track your progress
   - Quick smoke tests

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Open Command Prompt

Press `Windows Key + R`, type `cmd`, press Enter

### Step 2: Copy-Paste These Commands One by One

```bash
# Check Docker is running
docker ps
```
✅ Should show a table (even if empty)

```bash
# Check Kubernetes is running
kubectl get nodes
```
✅ Should show node STATUS as "Ready"

```bash
# Start PostgreSQL database
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=store_platform -p 5432:5432 postgres:16
```
✅ Should output a long container ID

---

### Step 3: Start the 3 Services

**Open 3 Command Prompt windows:**

**Window 1 - Backend:**
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\backend
npm run dev
```
✅ Wait for: `Platform API started on port 3001`

**Window 2 - Orchestrator:**
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator
npm run dev
```
✅ Wait for: `Reconciliation loop running`

**Window 3 - Frontend:**
```bash
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\frontend
npm run dev
```
✅ Wait for: `Local: http://localhost:5173/`

---

### Step 4: Test in Browser

1. Open browser
2. Go to: http://localhost:5173
3. Fill in:
   - **Store Name:** TestShop
   - **Engine:** WooCommerce
4. Click "Create Store"
5. Wait 2-5 minutes
6. Status changes to "Ready" ✅

**🎉 If you see "Ready" - EVERYTHING WORKS!**

---

## 🎯 What to Test (Choose Your Path)

### Path A: Quick Demo (15 minutes)
Perfect for: Showing the system works

1. Follow "Quick Start" above
2. Create 1 store
3. Wait for "Ready"
4. Delete the store
5. Done!

**Use:** [TESTING_COMMANDS_CHEATSHEET.md](TESTING_COMMANDS_CHEATSHEET.md)

---

### Path B: Component Testing (30 minutes)
Perfect for: Understanding each part

1. Test Backend only
2. Test Orchestrator only
3. Test Frontend only
4. Test everything together

**Use:** [SIMPLE_TESTING_GUIDE.md](SIMPLE_TESTING_GUIDE.md)

---

### Path C: Full Validation (60 minutes)
Perfect for: Complete verification before important demo

1. Test all infrastructure
2. Test each component individually
3. Test complete workflows
4. Test error scenarios
5. Practice demo script

**Use:** [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md)

---

## 🆘 If Something Goes Wrong

### Problem: "Docker not running"
**Fix:**
1. Open Docker Desktop application
2. Wait for whale icon in system tray
3. Try again

---

### Problem: "Port already in use"
**Fix:**
```bash
# Find what's using the port (example: 3001)
netstat -ano | findstr :3001

# Kill it (replace 12345 with the number you see)
taskkill /PID 12345 /F

# Start service again
```

---

### Problem: "Cannot connect to database"
**Fix:**
```bash
# Restart PostgreSQL
docker restart postgres

# Wait 5 seconds
timeout 5

# Try starting your services again
```

---

### Problem: "Kubernetes not working"
**Fix:**
1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Click "Reset Kubernetes Cluster"
4. Wait 2-3 minutes
5. Run: `kubectl get nodes`

---

### Problem: "Store stuck in Provisioning"
**Fix:**
```bash
# Check what's happening
kubectl get namespaces | findstr store-

# Check the store's pods
kubectl get pods -n store-<name>-<id>

# See events
kubectl get events -n store-<name>-<id> --sort-by='.lastTimestamp'
```

**Delete if stuck:**
```bash
kubectl delete namespace store-<name>-<id> --force --grace-period=0
```

---

## 📊 How to Know Everything Works

### ✅ All Green Indicators

**Backend Window Shows:**
```
✅ Platform API started on port 3001
✅ Database connection successful
```

**Orchestrator Window Shows:**
```
✅ Store Platform Orchestrator starting...
✅ Reconciliation loop running
```

**Frontend Window Shows:**
```
✅ Local: http://localhost:5173/
```

**Browser Shows:**
```
✅ Page loads
✅ Can create store
✅ Status changes to "Ready"
```

**Kubernetes Shows:**
```bash
kubectl get pods --all-namespaces | findstr store-
# Shows pods with STATUS "Running" ✅
```

---

## 🎬 Demo Script (7 Minutes)

**For presenting to others:**

### Minute 0-1: Setup
Show the 3 terminal windows running:
- Backend
- Orchestrator
- Frontend

### Minute 1-2: Explanation
> "This platform automatically provisions WooCommerce stores on Kubernetes. Each store gets its own isolated environment with WordPress and MySQL."

### Minute 2-3: Create Store
1. Show browser at http://localhost:5173
2. Fill form: Store name "DemoShop", Engine "WooCommerce"
3. Click Create
4. Show status: "Provisioning"

### Minute 3-5: Show What's Happening
Point to orchestrator window:
> "The orchestrator is now creating Kubernetes resources..."

Show terminal:
```bash
kubectl get namespaces | findstr store-
kubectl get pods -n store-demoshop-xxx
```

> "Each store gets its own namespace with isolated resources."

### Minute 5-6: Store Ready
Show browser:
> "Status changed to Ready! The store is now fully functional."

Show the store URL

### Minute 6-7: Cleanup
Click Delete button
> "One-click deletion removes all resources cleanly."

Show terminal:
```bash
kubectl get namespaces | findstr store-
# Namespace is gone ✅
```

---

## 📈 Expected Timings

| Action | Expected Time |
|--------|---------------|
| Backend startup | 3-5 seconds |
| Orchestrator startup | 3-5 seconds |
| Frontend startup | 5-10 seconds |
| Store provisioning | 2-5 minutes |
| Store deletion | 30-60 seconds |

**If times are much longer, something is wrong!**

---

## 🔧 Testing Checklist

Print this and check off as you go:

### Infrastructure
- [ ] Docker Desktop running
- [ ] Kubernetes working (`kubectl get nodes`)
- [ ] PostgreSQL running (`docker ps | findstr postgres`)

### Services Started
- [ ] Backend started (port 3001)
- [ ] Orchestrator started (port 3002)
- [ ] Frontend started (port 5173)
- [ ] All show "ready" messages in logs

### Basic Tests
- [ ] Backend health check works (`curl http://localhost:3001/health`)
- [ ] Frontend loads in browser
- [ ] Can see store creation form

### Complete Workflow
- [ ] Can create store from UI
- [ ] Status shows "Provisioning"
- [ ] Orchestrator shows activity in logs
- [ ] Kubernetes namespace created
- [ ] Pods show "Running" status
- [ ] Status changes to "Ready"
- [ ] Can delete store
- [ ] Namespace gets removed

---

## 🗂️ Document Index

**Which guide to use when:**

| Situation | Use This Document |
|-----------|------------------|
| First time testing | [SIMPLE_TESTING_GUIDE.md](SIMPLE_TESTING_GUIDE.md) |
| Need quick commands | [TESTING_COMMANDS_CHEATSHEET.md](TESTING_COMMANDS_CHEATSHEET.md) |
| Understanding flow | [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md) |
| Following checklist | [QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md) |
| Overall summary | This file |

---

## 💡 Pro Tips

1. **Keep Windows Arranged**
   - Arrange the 3 terminal windows side-by-side
   - You can see all logs at once
   - Easy to spot issues

2. **Use Tab Completion**
   - Type `kubectl get pods -n store-` then press `Tab`
   - Windows will auto-complete the namespace name

3. **Copy-Paste Commands**
   - Don't type commands manually
   - Copy from the cheatsheet
   - Reduces errors

4. **Watch the Logs**
   - Logs tell you what's happening
   - If stuck, read the logs
   - Error messages are descriptive

5. **Test Before Demo**
   - Run through complete workflow once
   - Make sure timing is right
   - Practice the demo script

---

## 📞 Common Questions

**Q: How long does store creation take?**
A: 2-5 minutes. Depends on internet speed (downloading images) and computer resources.

**Q: Can I create multiple stores?**
A: Yes! Each gets isolated resources.

**Q: What if Kubernetes is slow?**
A: This is normal on first run (downloading images). Subsequent stores are faster.

**Q: Do I need internet?**
A: Yes, for first run (downloads Docker images). After that, can work offline.

**Q: Can I stop and restart?**
A: Yes! Press Ctrl+C in each window to stop. Run `npm run dev` again to restart.

**Q: Will this delete my existing data?**
A: No. Each store uses its own namespace. Your other Kubernetes resources are safe.

---

## 🎓 Learning Path

**Day 1:** Follow Quick Start (above)
- Get everything running
- Create one store
- Understand basic flow

**Day 2:** Read [SIMPLE_TESTING_GUIDE.md](SIMPLE_TESTING_GUIDE.md)
- Test each component
- Understand what each part does
- Try troubleshooting commands

**Day 3:** Read [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md)
- Understand the architecture
- Learn the timeline
- Practice demo script

**Day 4:** Practice full demo
- Use [TESTING_COMMANDS_CHEATSHEET.md](TESTING_COMMANDS_CHEATSHEET.md)
- Time yourself
- Refine presentation

---

## ✅ Ready Checklist

You're ready to demo when:

- [ ] Can start all services without errors
- [ ] Can create store and it becomes "Ready"
- [ ] Understand what each component does
- [ ] Can show Kubernetes resources
- [ ] Can delete store cleanly
- [ ] Know how to troubleshoot common issues
- [ ] Demo takes 7-10 minutes
- [ ] Feel confident explaining the system

---

## 🚀 Next Steps

1. **Right Now:** Follow "Quick Start" above
2. **Next 30 min:** Read [SIMPLE_TESTING_GUIDE.md](SIMPLE_TESTING_GUIDE.md)
3. **Next Hour:** Test everything with [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md)
4. **Before Demo:** Practice with [TESTING_COMMANDS_CHEATSHEET.md](TESTING_COMMANDS_CHEATSHEET.md)

---

## 📋 Command Reference Card (Print This)

```bash
# Start services
cd backend && npm run dev           # Window 1
cd orchestrator && npm run dev      # Window 2
cd frontend && npm run dev          # Window 3

# Test health
curl http://localhost:3001/health

# Open frontend
start http://localhost:5173

# Check Kubernetes
kubectl get namespaces | findstr store-
kubectl get pods --all-namespaces | findstr store-

# Troubleshoot
docker ps                           # Check Docker
kubectl get nodes                   # Check Kubernetes
docker restart postgres             # Restart database
```

---

**🎉 You're all set! Start with the Quick Start section above.**

**Good luck with your demo!**

---

**Need help?**
- Check [SIMPLE_TESTING_GUIDE.md](SIMPLE_TESTING_GUIDE.md) - Detailed explanations
- Check [TESTING_COMMANDS_CHEATSHEET.md](TESTING_COMMANDS_CHEATSHEET.md) - All commands
- Check [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md) - Visual diagrams
- Check [QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md) - Checklist format

**Remember:** The logs are your friend! Read them when stuck.
