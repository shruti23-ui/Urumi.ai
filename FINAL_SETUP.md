# Urumi Store Platform - Final Setup Guide

## 🎯 What's Being Deployed

Your **Urumi Clothing Store** platform is being deployed to AWS at **51.20.42.151**.

This creates:
1. **Platform Dashboard** - Create and manage multiple stores
2. **Urumi Clothing Store** - Your WooCommerce e-commerce website
3. **Admin Panel** - Manage products, orders, customers
4. **Database** - PostgreSQL + MySQL for each store
5. **Kubernetes Cluster** - Automated orchestration and scaling

---

## 📱 Access from ANY Device

Once deployed, your Urumi Clothing website will work on:
- ✅ Desktop computers
- ✅ Laptops
- ✅ Mobile phones (iOS & Android)
- ✅ Tablets (iPad, Android tablets)
- ✅ Any device with a web browser

**No app installation needed** - just open the URL in any browser!

---

## 🔗 Your URLs (After Deployment)

### 1. Platform Dashboard
```
http://51.20.42.151:[NODEPORT]/
```
**What you can do:**
- Create new stores
- View all stores
- Delete stores
- Monitor status

### 2. Urumi Clothing Store
```
http://51.20.42.151:[STORE_PORT]/
```
**Features:**
- Browse products
- Add to cart
- Checkout
- Customer accounts
- Order tracking

### 3. Admin Panel
```
http://51.20.42.151:[STORE_PORT]/wp-admin
```
**Credentials:**
- Username: `admin`
- Password: `Admin@123!`

**Admin features:**
- Add/edit products
- Manage orders
- Configure shipping
- Set payment methods
- View analytics

---

## ⏱️ Deployment Status

### Current Progress:
1. ✅ AWS Instance Running (51.20.42.151)
2. ✅ SSH Connection Configured
3. ✅ Docker Installed
4. ✅ k3s (Kubernetes) Installed
5. ✅ Helm Installed
6. ✅ Repository Cloned
7. 🔄 **Building Docker Images** (5-10 minutes)
   - Backend API
   - Frontend Dashboard
   - Orchestrator Service
8. ⏳ Import Images to Kubernetes
9. ⏳ Deploy with Helm
10. ⏳ Create Urumi Store
11. ⏳ Configure Products

**Total Time:** 15-20 minutes

---

##  What Happens After Deployment

###  Automatic Steps:
1. Platform dashboard becomes accessible
2. Kubernetes creates isolated namespaces
3. PostgreSQL database initializes
4. API and dashboard pods start running
5. Ingress controller routes traffic

### Manual Steps (Your Part):
1. **Get the URLs** (provided after deployment)
2. **Create Urumi Clothing Store** via dashboard
3. **Add products** via WooCommerce admin
4. **Test ordering** from phone/desktop
5. **Share URL** with anyone to access your store

---

## 🛍️ Sample Products for Urumi Clothing

Once your store is created, add these products:

### Fashion Items:
1. **Summer Dress** - ₹2,500
   - Light, breezy, perfect for summer
   - Available in multiple colors

2. **Leather Jacket** - ₹5,500
   - Premium quality leather
   - Classic design

3. **Designer Handbag** - ₹3,500
   - Stylish and spacious
   - Multiple compartments

4. **Designer Sunglasses** - ₹1,800
   - UV protected
   - Trendy frames

5. **High Heels** - ₹3,200
   - Comfortable fit
   - Various sizes

**Or use the automated setup script to add all products at once!**

---

## 🔧 Quick Commands Reference

### Get Platform URL
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
NODEPORT=$(sudo kubectl get svc -n store-platform platform-dashboard -o jsonpath='{.spec.ports[0].nodePort}')
echo "Platform: http://51.20.42.151:$NODEPORT/"
```

### Check Deployment Status
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
sudo kubectl get pods -n store-platform
```

### Create Store via API
```bash
curl -X POST "http://51.20.42.151:$NODEPORT/api/stores" \
  -H "Content-Type: application/json" \
  -d '{"name":"Urumi Clothing","engine":"woocommerce"}'
```

### Find Store URL
```bash
sudo kubectl get svc -A | grep urumi-clothing
```

### Add Products (Automated)
```bash
ssh -i store-platform-key.pem ubuntu@51.20.42.151
cd Urumi.ai
STORE_NS=$(sudo kubectl get ns | grep urumi-clothing | awk '{print $1}')
sed -i "s/NAMESPACE=.*/NAMESPACE=\"$STORE_NS\"/" setup-fashion-store.sh
chmod +x setup-fashion-store.sh
./setup-fashion-store.sh
```

---

## 📊 Architecture

```
Internet
    ↓
AWS EC2 (51.20.42.151)
    ↓
Security Group (Firewall)
    ↓
k3s Kubernetes Cluster
    ├── Platform Namespace
    │   ├── Backend API (2 pods)
    │   ├── Frontend Dashboard (2 pods)
    │   ├── Orchestrator (1 pod)
    │   └── PostgreSQL (1 pod)
    │
    └── Store Namespace (per store)
        ├── WordPress + WooCommerce (1 pod)
        └── MySQL (1 pod)
```

**Each store is isolated:**
- Own Kubernetes namespace
- Own database
- Own resources
- Own URL

---

## 🔐 Security Features

- ✅ HTTPS ready (can add SSL certificate)
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Rate limiting on API
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Kubernetes network policies
- ✅ Resource quotas per store

---

## 🎨 Customization Options

### Theme
- Change WordPress theme from admin
- Customize colors, fonts, layout
- Add logo and branding

### Products
- Add unlimited products
- Set categories and tags
- Add product variations (sizes, colors)
- Upload multiple images per product

### Payments
- Cash on Delivery (enabled by default)
- Add Razorpay for online payments
- Add Stripe for international orders
- Add PayPal integration

### Shipping
- Configure shipping zones
- Set flat rate or free shipping
- Add weight-based shipping
- Integrate with shipping providers

---

## 📈 Scaling

Your platform can handle:
- **Multiple Stores:** Create as many stores as needed
- **High Traffic:** Each pod can be replicated
- **Large Catalog:** Thousands of products per store
- **Concurrent Users:** Hundreds of simultaneous shoppers

To scale:
```bash
# Scale API
kubectl scale deployment platform-api -n store-platform --replicas=4

# Scale Dashboard
kubectl scale deployment platform-dashboard -n store-platform --replicas=3
```

---

## 🐛 Troubleshooting

### Platform not accessible?
1. Check Security Group has port 30000-32767 open
2. Verify pods are running: `kubectl get pods -n store-platform`
3. Check logs: `kubectl logs -n store-platform deployment/platform-api`

### Store creation fails?
1. Check orchestrator logs: `kubectl logs -n store-platform deployment/platform-orchestrator`
2. Verify sufficient resources on node
3. Check RBAC permissions

### Products not showing?
1. Clear WordPress cache
2. Check permalink settings: Settings → Permalinks → Save
3. Reindex WooCommerce products

### Can't login to admin?
- Username: `admin`
- Password: `Admin@123!`
- URL: `http://51.20.42.151:[PORT]/wp-admin`

---

## 📞 Next Steps

1. **Wait for deployment to complete** (check progress with commands above)
2. **Get your platform URL**
3. **Open dashboard** in browser
4. **Create Urumi Clothing Store**
5. **Add products** (manually or with script)
6. **Test on mobile device**
7. **Place a test order**
8. **Verify order in admin panel**
9. **Share store URL** with others
10. **Start selling!** 🎉

---

## 🎬 Demo Checklist

For your demo video/presentation:

- [ ] Show platform dashboard
- [ ] Create new store live
- [ ] Show store loading status
- [ ] Access Urumi store URL
- [ ] Browse products
- [ ] Add product to cart
- [ ] Go through checkout
- [ ] Place order
- [ ] Login to wp-admin
- [ ] Show order in admin panel
- [ ] Show products management
- [ ] Delete a store (optional)
- [ ] Show multi-tenancy (multiple stores)

---

**Deployment Started:** Now
**Expected Completion:** 15-20 minutes
**Your Store Will Be Live At:** http://51.20.42.151:[PORT]/

Check deployment status anytime with: `ssh -i store-platform-key.pem ubuntu@51.20.42.151 'sudo kubectl get pods -n store-platform'`

🚀 Your Urumi Clothing Store is on its way!
