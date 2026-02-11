# 🌐 How to Access Your WooCommerce Stores

Your stores are running in Kubernetes, but the URLs need additional setup to work on your local machine.

---

## 🎯 **Why URLs Don't Work**

The URLs shown are:
- `http://teststore.local.stores.dev`
- `http://powershelltest.local.stores.dev`

These are **internal Kubernetes DNS names** that your browser doesn't know how to resolve.

---

## ✅ **Solution 1: Port Forwarding (Easiest - Works Immediately)**

This creates a direct tunnel from your computer to the Kubernetes pod.

### **Access TestStore:**

**PowerShell:**
```powershell
kubectl port-forward -n store-teststore-8f5d2fcb service/teststore 8080:80
```

Then open in browser: **http://localhost:8080**

Keep this PowerShell window open while using the store!

---

### **Access PowerShellTest:**

**PowerShell:**
```powershell
kubectl port-forward -n store-powershelltest-740f852d service/powershelltest 8081:80
```

Then open in browser: **http://localhost:8081**

---

### **Access Clothing Store:**

**PowerShell:**
```powershell
kubectl port-forward -n store-clothing-96aa0836 service/clothing 8082:80
```

Then open in browser: **http://localhost:8082**

---

## ✅ **Solution 2: Edit Hosts File (Permanent - More Setup)**

This makes the `.local.stores.dev` domains work in your browser.

### **Step 1: Open Notepad as Administrator**

1. Press `Windows Key`
2. Type `notepad`
3. **Right-click** on Notepad
4. Click **"Run as administrator"**
5. Click **Yes** when asked

### **Step 2: Open Hosts File**

1. In Notepad, click **File → Open**
2. Navigate to: `C:\Windows\System32\drivers\etc`
3. Change filter from "Text Documents" to **"All Files (*.*)"**
4. Select the file named **`hosts`**
5. Click **Open**

### **Step 3: Add These Lines at the Bottom**

```
# WooCommerce Stores
127.0.0.1   teststore.local.stores.dev
127.0.0.1   powershelltest.local.stores.dev
127.0.0.1   clothing.local.stores.dev
```

### **Step 4: Save and Close**

1. Click **File → Save**
2. Close Notepad

### **Step 5: Set Up Ingress Controller**

You need an Nginx Ingress Controller running in Kubernetes:

**PowerShell:**
```powershell
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready (takes 1-2 minutes)
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s

# Forward port 80 from ingress to your machine
kubectl port-forward --namespace=ingress-nginx service/ingress-nginx-controller 80:80
```

Then the URLs will work: `http://teststore.local.stores.dev`

---

## 🎯 **Recommended Approach**

**Use Solution 1 (Port Forwarding)** because:
- ✅ Works immediately
- ✅ No system file changes
- ✅ Easy to stop (just close PowerShell window)
- ✅ Different port for each store (no conflicts)

---

## 📋 **Quick Access Commands**

Copy-paste these into **separate PowerShell windows**:

### **TestStore (Port 8080):**
```powershell
kubectl port-forward -n store-teststore-8f5d2fcb service/teststore 8080:80
```
**Browser:** http://localhost:8080

---

### **PowerShellTest (Port 8081):**
```powershell
kubectl port-forward -n store-powershelltest-740f852d service/powershelltest 8081:80
```
**Browser:** http://localhost:8081

---

### **Clothing (Port 8082):**
```powershell
kubectl port-forward -n store-clothing-96aa0836 service/clothing 8082:80
```
**Browser:** http://localhost:8082

---

## 🔍 **To Stop Port Forwarding**

Just press `Ctrl + C` in the PowerShell window running the port-forward command.

---

## 💡 **What You'll See**

When you access a store via port forwarding, you'll see:
1. **WooCommerce Setup Wizard** (first time only)
2. Or the **WordPress/WooCommerce site** if already configured

Each store runs:
- WordPress
- WooCommerce plugin
- MySQL database (dedicated to that store)
- All isolated in its own Kubernetes namespace

---

## ⚡ **Example Workflow**

1. Open PowerShell
2. Run: `kubectl port-forward -n store-teststore-8f5d2fcb service/teststore 8080:80`
3. See message: `Forwarding from 127.0.0.1:8080 -> 80`
4. Open browser: http://localhost:8080
5. See your WooCommerce store!
6. When done, press `Ctrl + C` in PowerShell

---

## 🎉 **Summary**

Your stores ARE running and working perfectly in Kubernetes!

You just need to use **port forwarding** to access them from your browser.

The clickable URLs in the dashboard would work if you set up the ingress controller + hosts file, but port forwarding is simpler and works instantly!
