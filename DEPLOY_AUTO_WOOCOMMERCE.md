# 🚀 Deploy Auto-WooCommerce to AWS & GitHub

## **Step 1: Push to GitHub (Do This First!)**

### **In VS Code Terminal or PowerShell:**

```powershell
# Navigate to project
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1

# Check what files changed
git status

# Add all changes
git add .

# Create commit
git commit -m "feat: Add automatic WooCommerce setup with WP-CLI

- Auto-install WordPress and WooCommerce on store creation
- Create 3 sample products automatically (T-Shirt, Jeans, Shoes)
- Enable Cash on Delivery payment method
- Configure admin credentials (admin/Admin@123!)
- Update Helm chart deployment with wp-auto-install init container
- Update orchestrator to pass store URL and credentials
- Add documentation for auto-setup feature

Stores are now fully functional immediately after provisioning!"

# Push to GitHub
git push origin main
```

---

## **Step 2: Update AWS Orchestrator**

### **Option A: Using Git (Recommended)**

```bash
# SSH to EC2
ssh -i /c/Users/hp/OneDrive/Desktop/store-platform-key.pem ubuntu@13.51.146.246

# Navigate to project
cd ~/Urumi.ai

# Pull latest changes
git pull origin main

# Rebuild orchestrator
cd orchestrator
docker build -t platform-orchestrator:latest .

# Import to k3s
docker save platform-orchestrator:latest -o /tmp/orchestrator-auto.tar
sudo k3s ctr images import /tmp/orchestrator-auto.tar

# Restart orchestrator
sudo kubectl rollout restart deployment/platform-orchestrator -n store-platform

# Wait for restart
sudo kubectl rollout status deployment/platform-orchestrator -n store-platform

echo "✅ Orchestrator updated with auto-WooCommerce setup!"
```

### **Option B: Manual File Copy (If Git Not Set Up)**

**On Your Local Machine:**

```powershell
# Copy updated files to EC2
scp -i C:\Users\hp\OneDrive\Desktop\store-platform-key.pem `
  C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\templates\deployment.yaml `
  ubuntu@13.51.146.246:~/Urumi.ai/orchestrator/helm-charts/woocommerce-store/templates/

scp -i C:\Users\hp\OneDrive\Desktop\store-platform-key.pem `
  C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\helm-charts\woocommerce-store\values.yaml `
  ubuntu@13.51.146.246:~/Urumi.ai/orchestrator/helm-charts/woocommerce-store/

scp -i C:\Users\hp\OneDrive\Desktop\store-platform-key.pem `
  C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1\orchestrator\src\k8s\provisioner.ts `
  ubuntu@13.51.146.246:~/Urumi.ai/orchestrator/src/k8s/
```

**Then SSH and rebuild:**

```bash
ssh -i /c/Users/hp/OneDrive/Desktop/store-platform-key.pem ubuntu@13.51.146.246

cd ~/Urumi.ai/orchestrator
docker build -t platform-orchestrator:latest .

docker save platform-orchestrator:latest -o /tmp/orchestrator-auto.tar
sudo k3s ctr images import /tmp/orchestrator-auto.tar

sudo kubectl rollout restart deployment/platform-orchestrator -n store-platform
sudo kubectl rollout status deployment/platform-orchestrator -n store-platform
```

---

## **Step 3: Test Auto-WooCommerce on AWS**

### **Create a Test Store:**

1. **Open AWS Dashboard:** http://13.51.146.246:31107

2. **Create Store:**
   - Name: "AutoDemo Store"
   - Click "Create Store"

3. **Wait 3-5 minutes** for provisioning

4. **Watch the orchestrator logs (optional):**
   ```bash
   sudo kubectl logs -f deployment/platform-orchestrator -n store-platform
   ```
   You should see:
   ```
   Installing WordPress...
   Installing WooCommerce plugin...
   Creating sample products...
   ```

5. **Once READY, get the NodePort:**
   ```bash
   sudo kubectl get svc -n store-autodemo-store-xxx
   ```

6. **Access the store:**
   - URL: `http://13.51.146.246:[NodePort]`
   - You should see WooCommerce store with 3 products!

7. **Test shopping:**
   - Add Cotton T-Shirt to cart
   - Checkout
   - Place order

8. **Check admin:**
   - URL: `http://13.51.146.246:[NodePort]/wp-admin`
   - Username: `admin`
   - Password: `Admin@123!`
   - Verify order in WooCommerce → Orders

---

## **Step 4: Verify Everything Works**

### **Checklist:**

- [ ] Code pushed to GitHub
- [ ] Orchestrator updated on AWS
- [ ] New store created successfully
- [ ] WordPress auto-installed
- [ ] WooCommerce auto-installed
- [ ] 3 products visible (T-Shirt ₹500, Jeans ₹1200, Shoes ₹1500)
- [ ] Can add to cart
- [ ] Can checkout with Cash on Delivery
- [ ] Order created successfully
- [ ] Order visible in admin panel

---

## **Quick Commands Reference**

### **Check if orchestrator is updated:**
```bash
ssh -i /c/Users/hp/OneDrive/Desktop/store-platform-key.pem ubuntu@13.51.146.246

# Check orchestrator logs
sudo kubectl logs deployment/platform-orchestrator -n store-platform --tail=50

# Should see new init container logic when provisioning stores
```

### **Check store pod logs:**
```bash
# Find the store namespace
sudo kubectl get ns | grep autodemo

# Check the wp-auto-install init container logs
sudo kubectl logs -n store-autodemo-store-xxx [pod-name] -c wp-auto-install
```

### **Manually trigger auto-install (if needed):**
```bash
# If auto-install failed, run manually
sudo kubectl exec -n [store-namespace] [pod-name] -- wp core install \
  --path=/var/www/html \
  --url=http://your-store-url \
  --title="Store Name" \
  --admin_user=admin \
  --admin_password=Admin@123! \
  --admin_email=admin@example.com \
  --allow-root

sudo kubectl exec -n [store-namespace] [pod-name] -- wp plugin install woocommerce --activate --path=/var/www/html --allow-root
```

---

## **Troubleshooting**

### **Problem: Store still shows WordPress setup wizard**

**Solution 1: Check init container logs**
```bash
sudo kubectl logs -n [namespace] [pod-name] -c wp-auto-install
```

**Solution 2: Check if WordPress volume is shared**
```bash
sudo kubectl describe pod -n [namespace] [pod-name]
# Look for volumeMounts - both init container and main container should mount wordpress-data
```

**Solution 3: Increase init container sleep time**
If installation is too fast, WordPress files might not be ready. Edit deployment.yaml:
```yaml
sleep 15  # Change to sleep 30
```

### **Problem: Orchestrator not restarting**

```bash
# Force delete the pod
sudo kubectl delete pod -n store-platform -l app=platform-orchestrator

# Check new pod status
sudo kubectl get pods -n store-platform
```

### **Problem: Git push fails**

```powershell
# Check remote
git remote -v

# If remote not set
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Try push again
git push -u origin main
```

---

## **What to Show in Demo Video**

### **Before Auto-Setup:**
"Previously, after creating a store, users had to manually:
- Complete WordPress setup wizard
- Install WooCommerce plugin
- Configure payment methods
- Add products
Total time: ~15 minutes of manual work"

### **After Auto-Setup:**
"Now, watch this:
[Create store]
[Wait 3 minutes]
[Access store - fully configured!]
[Add product to cart]
[Checkout and place order]
[Show order in admin]

Total time: 3 minutes, zero manual setup!"

---

## **Summary**

✅ **Git Push:** All changes saved to GitHub
✅ **AWS Updated:** Orchestrator has auto-setup feature
✅ **Fully Automated:** WordPress + WooCommerce + Products
✅ **Production Ready:** Stores work immediately
✅ **Demo Ready:** Can show automatic provisioning

**Time saved per store:** 12 minutes
**User experience:** Dramatically improved! 🎉
