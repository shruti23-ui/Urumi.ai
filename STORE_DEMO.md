# Store Platform Demo - Complete Guide

## Live Demo Store (Urumi Clothing)

### 🌐 Store URLs

- **Storefront**: http://13.51.146.246:31303
- **Shop Page**: http://13.51.146.246:31303/shop/
- **Cart**: http://13.51.146.246:31303/cart/
- **Checkout**: http://13.51.146.246:31303/checkout/
- **My Account**: http://13.51.146.246:31303/my-account/
- **Admin Dashboard**: http://13.51.146.246:31303/wp-admin/

### 🔐 Admin Credentials

```
Username: admin
Password: Admin@123!
```

### 🎯 Platform Dashboard

- **Dashboard URL**: http://13.51.146.246:31107
- **API Endpoint**: http://13.51.146.246:32129/api/stores

---

## 🛍️ Demo Store Features

### Pre-configured Products

1. **Cotton T-Shirt** - ₹500
   - Stock: 100 units
   - With product image

2. **Denim Jeans** - ₹1,200
   - Stock: 50 units
   - With product image

3. **Casual Shoes** - ₹1,500
   - Stock: 30 units
   - With product image

### Store Features

✅ Modern Astra theme with custom styling
✅ Hero banner with fashion photography
✅ Professional navigation menu
✅ WooCommerce fully configured
✅ Cash on Delivery (COD) payment enabled
✅ AJAX add-to-cart functionality
✅ Cart and checkout pages working
✅ My Account dashboard for customers
✅ Product images from Unsplash
✅ Mobile responsive design
✅ INR currency configured

---

## 📋 How to Test the Store (For Manager)

### Step 1: View the Store
1. Open: http://13.51.146.246:31303
2. You'll see the modern homepage with hero banner
3. Browse the 3 pre-loaded products

### Step 2: Add Items to Cart
1. Go to Shop page: http://13.51.146.246:31303/shop/
2. Click "Add to Cart" on any product
3. Cart icon in header will update (if you see it)
4. Click "View Cart" or navigate to http://13.51.146.246:31303/cart/

### Step 3: Proceed to Checkout
1. From cart page, click "Proceed to Checkout"
2. Fill in the billing details:
   - First Name
   - Last Name
   - Address
   - City
   - State
   - PIN code
   - Phone
   - Email

### Step 4: Complete Order
1. Select "Cash on Delivery" as payment method
2. Click "Place Order"
3. You'll receive an order confirmation

### Step 5: Check Admin Panel
1. Login to admin: http://13.51.146.246:31303/wp-admin/
2. Username: `admin`
3. Password: `Admin@123!`
4. Go to WooCommerce → Orders to see the test order
5. Go to Products → All Products to manage products

---

## 🚀 Creating a New Store (For Manager)

### Using the Platform Dashboard

1. **Open Platform Dashboard**
   - URL: http://13.51.146.246:31107

2. **Create New Store**
   - Click "Create Store" button
   - Enter store name (e.g., "Electronics Store", "Fashion Hub")
   - Select engine: "WooCommerce"
   - Click "Create"

3. **Wait for Provisioning**
   - Status will show "PROVISIONING"
   - Wait 2-3 minutes
   - Status will change to "READY"
   - Store URL will be displayed

4. **Access New Store**
   - Click on the store URL shown
   - Admin credentials will be:
     - Username: `admin`
     - Password: `Admin@123!`

5. **What Gets Auto-Configured**
   - ✅ WordPress installed
   - ✅ WooCommerce activated
   - ✅ 3 sample products with images
   - ✅ Cash on Delivery enabled
   - ✅ INR currency set
   - ✅ Cart, Checkout, My Account pages created
   - ✅ All permalinks configured

---

## 🔧 Admin Panel Guide

### Login to Admin
```
URL: http://13.51.146.246:31303/wp-admin/
Username: admin
Password: Admin@123!
```

### Key Admin Sections

#### 1. **Products (WooCommerce → Products)**
- View all products
- Add new products
- Edit existing products
- Manage stock levels
- Set prices

#### 2. **Orders (WooCommerce → Orders)**
- View all customer orders
- Update order status
- Process refunds
- View customer details

#### 3. **WooCommerce Settings (WooCommerce → Settings)**
- **General**: Store address, currency
- **Products**: Stock management, downloadable products
- **Shipping**: Shipping zones and methods
- **Payments**: Payment gateways (COD is enabled)
- **Accounts**: Customer account options

#### 4. **Appearance (Appearance → Themes)**
- Current theme: Astra
- Customize theme colors and layout
- Manage menus

#### 5. **Pages (Pages → All Pages)**
- Homepage (custom with hero banner)
- Shop page
- Cart page
- Checkout page
- My Account page

---

## 🎨 Store Customization

### Change Site Name & Tagline
1. Go to Settings → General
2. Update "Site Title" and "Tagline"
3. Click "Save Changes"

### Customize Theme Colors
1. Go to Appearance → Customize
2. Navigate to "Colors & Background"
3. Change primary color, text color, etc.
4. Click "Publish"

### Add New Products
1. Go to Products → Add New
2. Enter product details:
   - Product name
   - Description
   - Regular price
   - Stock quantity
   - Product image
3. Click "Publish"

### Manage Menu
1. Go to Appearance → Menus
2. Current menu: "Main Menu"
3. Add/remove menu items
4. Click "Save Menu"

---

## 📊 Platform Management (via API)

### Get All Stores
```bash
curl http://13.51.146.246:32129/api/stores
```

### Create New Store
```bash
curl -X POST http://13.51.146.246:32129/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Store",
    "engine": "woocommerce"
  }'
```

### Delete Store
```bash
curl -X DELETE http://13.51.146.246:32129/api/stores/{store_id}
```

---

## ⚠️ Important Notes for Manager

### Browser Cache
- **Always use Incognito/Private mode** when testing
- Or press `Ctrl+Shift+R` to hard refresh
- Old cached pages may show outdated content

### Store Limits
- Maximum 10 stores per user
- Rate limit: 100 requests per 15 minutes

### Troubleshooting

#### Cart Not Working?
1. Clear browser cache (`Ctrl+Shift+Del`)
2. Try incognito mode
3. Check if products are in stock
4. Verify you're on the correct URL

#### Can't Login to Admin?
- **Username**: `admin` (lowercase)
- **Password**: `Admin@123!` (case-sensitive)
- URL must be: http://13.51.146.246:31303/wp-admin/

#### Order Not Showing?
1. Login to admin panel
2. Go to WooCommerce → Orders
3. Check all order statuses (Pending, Processing, Completed)

#### Product Images Not Loading?
1. Images are from Unsplash
2. Check internet connection
3. Hard refresh page (`Ctrl+Shift+R`)

---

## 🎯 Complete Test Checklist

Use this checklist to verify everything works:

### Frontend Testing
- [ ] Homepage loads with hero banner
- [ ] Shop page shows 3 products with images
- [ ] Products have prices in INR (₹)
- [ ] "Add to Cart" button works
- [ ] Cart page shows added items
- [ ] Quantity can be updated in cart
- [ ] "Proceed to Checkout" works
- [ ] Checkout form accepts details
- [ ] "Cash on Delivery" payment option visible
- [ ] Order can be placed successfully
- [ ] Order confirmation page displays

### Admin Testing
- [ ] Can login to wp-admin
- [ ] Dashboard loads without errors
- [ ] Can view orders in WooCommerce → Orders
- [ ] Can view products in Products → All Products
- [ ] Can add new product
- [ ] Can edit existing product
- [ ] Can update product stock
- [ ] WooCommerce settings accessible
- [ ] Can customize theme colors

### Platform Testing
- [ ] Dashboard shows store as "READY"
- [ ] Store URL is accessible
- [ ] Can create new store from dashboard
- [ ] New store provisions in 2-3 minutes
- [ ] Can delete store from dashboard

---

## 📞 Support Information

### Architecture
- **Platform**: Kubernetes (k3s) on AWS EC2
- **Orchestrator**: Helm-based store provisioning
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend Dashboard**: React
- **Store Engine**: WordPress + WooCommerce

### Server Details
- **IP**: 13.51.146.246
- **Dashboard Port**: 31107
- **API Port**: 32129
- **Current Store Port**: 31303

### For Developers
- Repository: https://github.com/shruti23-ui/Urumi.ai.git
- Latest commit: Automatic product images from Unsplash
- Documentation: README.md in repository

---

## 🎉 Quick Demo Script

**For presenting to stakeholders:**

1. "Here's our live store running on Kubernetes" → Show http://13.51.146.246:31303
2. "It has a modern design with product images" → Browse shop page
3. "Customers can add items to cart" → Add product to cart
4. "Complete checkout with Cash on Delivery" → Go through checkout
5. "Store owner can manage everything from admin" → Show wp-admin
6. "We can create unlimited stores in 2-3 minutes" → Show platform dashboard
7. "Each store is fully isolated and secure" → Explain Kubernetes namespaces

---

## ✅ Store is Production-Ready

The demo store is fully functional and ready to showcase:
- ✅ Professional design
- ✅ Complete e-commerce flow
- ✅ Admin panel access
- ✅ Automated provisioning
- ✅ Sample products with real images
- ✅ Payment gateway (COD)
- ✅ Mobile responsive

**Share this URL with your manager**: http://13.51.146.246:31303
