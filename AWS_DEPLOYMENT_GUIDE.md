# 🚀 Complete AWS Deployment Guide - Exact Steps

## ⚠️ Prerequisites

Before starting:
- [ ] AWS Account created (free tier)
- [ ] Credit card added to AWS account
- [ ] Logged into AWS Console

**Estimated Cost:** $0-5 for demo (can delete after submission to avoid charges)

---

## Part 1: Launch EC2 Instance on AWS (15 minutes)

### Step 1.1: Go to EC2 Dashboard

1. Open browser and go to: **https://console.aws.amazon.com/**
2. Sign in with your AWS account
3. Once logged in, you'll see the AWS Management Console
4. In the top search bar, type: **`EC2`**
5. Click on **"EC2"** (with orange icon) - it says "Virtual Servers in the Cloud"

**You should now see the EC2 Dashboard**

---

### Step 1.2: Launch Instance

1. On the EC2 Dashboard page, look for orange button **"Launch instance"**
2. Click **"Launch instance"**

**You're now on the "Launch an instance" configuration page**

---

### Step 1.3: Configure Instance - Name and Tags

**Section: "Name and tags"**

1. Find the text box under "Name"
2. Type: **`store-platform-k3s`**

---

### Step 1.4: Configure Instance - Application and OS Images

**Section: "Application and OS Images (Amazon Machine Image)"**

1. You'll see several tabs: "Quick Start", "My AMIs", etc.
2. Make sure **"Quick Start"** tab is selected
3. Click on **"Ubuntu"** (purple icon)
4. Under "Amazon Machine Image (AMI)", select:
   - **"Ubuntu Server 22.04 LTS (HVM), SSD Volume Type"**
   - Should say **"Free tier eligible"** in green
5. Architecture: Select **"64-bit (x86)"**

---

### Step 1.5: Configure Instance - Instance Type

**Section: "Instance type"**

1. Click on the dropdown (default shows "t2.micro")
2. Search for: **`t3.medium`**
3. Select **"t3.medium"**
   - Shows: 2 vCPU, 4 GiB Memory
   - **Note:** This is NOT free tier, costs ~$0.04/hour
   - **Alternative:** Use t2.micro (free tier) but might be slow

**Why t3.medium?**
- Kubernetes needs at least 2GB RAM
- t2.micro (1GB RAM) might not work well

---

### Step 1.6: Configure Instance - Key Pair

**Section: "Key pair (login)"**

1. Click **"Create new key pair"** link
2. A popup appears "Create key pair"
3. Fill in:
   - **Key pair name:** `store-platform-key`
   - **Key pair type:** RSA (selected by default)
   - **Private key file format:**
     - Windows: Select **".pem"**
     - Mac/Linux: Select **".pem"**
4. Click **"Create key pair"** button
5. **A file will download:** `store-platform-key.pem`
6. **IMPORTANT:** Save this file! You'll need it to connect to the server
7. Move it to a safe location (like Downloads folder)

---

### Step 1.7: Configure Instance - Network Settings

**Section: "Network settings"**

1. Click **"Edit"** button on the right side of "Network settings"
2. You'll see expanded network options

**Auto-assign public IP:**
- Make sure it says **"Enable"**

**Firewall (security groups):**
- Select **"Create security group"**
- Security group name: `store-platform-sg` (auto-filled, leave as is)
- Description: Can leave as is

**Inbound Security Group Rules:**

You need to add these rules (click "Add security group rule" for each):

**Rule 1 - SSH (already exists):**
- Type: SSH
- Protocol: TCP
- Port range: 22
- Source type: My IP (recommended) or Anywhere
- Leave as is

**Rule 2 - HTTP:**
- Click **"Add security group rule"**
- Type: Select **"HTTP"** from dropdown
- Protocol: TCP (auto-filled)
- Port range: 80 (auto-filled)
- Source type: Select **"Anywhere"** from dropdown
- CIDR: 0.0.0.0/0 (auto-filled)

**Rule 3 - HTTPS:**
- Click **"Add security group rule"**
- Type: Select **"HTTPS"** from dropdown
- Protocol: TCP (auto-filled)
- Port range: 443 (auto-filled)
- Source type: Select **"Anywhere"**
- CIDR: 0.0.0.0/0 (auto-filled)

**Rule 4 - Custom TCP for Dashboard:**
- Click **"Add security group rule"**
- Type: Select **"Custom TCP"** from dropdown
- Protocol: TCP (auto-filled)
- Port range: **`5173`**
- Source type: Select **"Anywhere"**
- CIDR: 0.0.0.0/0 (auto-filled)
- Description: "Dashboard access"

**Rule 5 - Custom TCP for API:**
- Click **"Add security group rule"**
- Type: Select **"Custom TCP"**
- Port range: **`3001`**
- Source type: Select **"Anywhere"**
- CIDR: 0.0.0.0/0
- Description: "API access"

**You should now have 5 inbound rules total**

---

### Step 1.8: Configure Instance - Storage

**Section: "Configure storage"**

1. Find "Size (GiB)" field
2. Change from **8** to **30** (type 30)
3. Volume type: **gp3** (should be default)
4. Delete on termination: **Checked** (default)

**Why 30GB?**
- Kubernetes + Docker images + stores need space
- 8GB is too small

---

### Step 1.9: Review and Launch

**Section: "Summary"**

On the right side, you'll see a summary:
- Number of instances: 1
- Instance type: t3.medium
- Software image: Ubuntu 22.04
- Virtual server pricing: ~$0.04/hour

1. Scroll down to the bottom
2. Click the orange **"Launch instance"** button
3. You'll see a success message: "Successfully initiated launch of instance"
4. Click **"View all instances"** button

---

### Step 1.10: Get Your Instance IP Address

**You're now on the "Instances" page**

1. You'll see your instance: `store-platform-k3s`
2. Wait for:
   - **Instance state** column: Changes from "Pending" to **"Running"** (2-3 minutes)
   - **Status check** column: Changes to **"2/2 checks passed"** (2-3 minutes)
3. Click on your instance row to select it
4. In the **Details** tab at the bottom, find:
   - **Public IPv4 address:** Something like `54.123.45.67`
5. **COPY THIS IP ADDRESS** - you'll need it many times!

**Write it down here:**
```
My EC2 IP: _________________
```

---

## Part 2: Connect to Your EC2 Instance (10 minutes)

### Step 2.1: Prepare Your SSH Key (Windows)

Open PowerShell:

```powershell
# Navigate to where you saved the .pem file
cd Downloads

# Check the file exists
dir store-platform-key.pem

# Fix permissions (important on Windows)

```
icacls store-platform-key.pem /inheritance:r
icacls store-platform-key.pem /grant:r "${env:USERNAME}:(R)"
---

### Step 2.2: Connect via SSH

In the same PowerShell window:

```powershell
# Replace YOUR_EC2_IP with the IP you copied
ssh -i store-platform-key.pem ubuntu@YOUR_EC2_IP
```

**Example (use YOUR actual IP):**
```powershell
ssh -i store-platform-key.pem ubuntu@54.123.45.67
```

**You'll see a message:**
```
The authenticity of host '54.123.45.67' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Type: **`yes`** and press Enter

**You should now see:**
```
Welcome to Ubuntu 22.04.3 LTS
ubuntu@ip-xxx-xxx-xxx:~$
```

**✅ You're connected to your EC2 instance!**

---

## Part 3: Install k3s (5 minutes)

Run these commands one by one in the SSH session:

```bash
# Update package lists
sudo apt update

# Install k3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# Wait 30 seconds for k3s to start
sleep 30

# Check k3s status
sudo systemctl status k3s
```

Press **`q`** to exit the status view

```bash
# Set up kubectl access for ubuntu user
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown ubuntu:ubuntu ~/.kube/config
export KUBECONFIG=~/.kube/config

# Add to .bashrc so it persists
echo "export KUBECONFIG=~/.kube/config" >> ~/.bashrc

# Verify Kubernetes is running
kubectl get nodes
```

**You should see:**
```
NAME                          STATUS   ROLES                  AGE   VERSION
ip-xxx-xxx-xxx-xxx.ec2...     Ready    control-plane,master   1m    v1.28.x
```

**✅ Kubernetes (k3s) is installed and running!**

---

## Part 4: Install Required Tools (10 minutes)

### Step 4.1: Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

**You should see:** `version.BuildInfo{Version:"v3.xx.x"...}`

---

### Step 4.2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Verify Docker installed
docker --version
```

**You should see:** `Docker version 24.x.x`

---

### Step 4.3: Log Out and Back In

```bash
# Exit SSH session
exit
```

**In PowerShell, reconnect:**
```powershell
ssh -i Downloads\store-platform-key.pem ubuntu@YOUR_EC2_IP
```

**Now test Docker:**
```bash
docker ps
```

Should work without sudo!

---

## Part 5: Transfer Your Code to EC2 (15 minutes)

### Step 5.1: Install Git and Clone (If you have GitHub repo)

**If you already pushed to GitHub:**
```bash
# On EC2
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

---

### Step 5.2: Manual File Transfer (If no GitHub yet)

**On your Windows machine, open NEW PowerShell window:**

```powershell
# Navigate to your project
cd c:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1

# Create tar file (excluding large folders)
tar --exclude=node_modules --exclude=.git --exclude=frontend/node_modules --exclude=backend/node_modules --exclude=orchestrator/node_modules -czf platform.tar.gz backend frontend orchestrator

# Transfer to EC2 (replace YOUR_EC2_IP)
scp -i Downloads\store-platform-key.pem platform.tar.gz ubuntu@YOUR_EC2_IP:~/
```

**Wait for upload to complete (may take 5-10 minutes depending on internet speed)**

**Back on EC2 (SSH session):**
```bash
# Extract the files
tar -xzf platform.tar.gz

# Verify files are there
ls -la
```

You should see: `backend/  frontend/  orchestrator/`

---

## Part 6: Build Docker Images on EC2 (20 minutes)

```bash
# Install Node.js (needed for npm install before Docker build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Build Backend Image

```bash
cd ~/backend

# Install dependencies
npm install

# Build Docker image
docker build -t platform-api:latest .

# Verify image built
docker images | grep platform-api
```

---

### Build Orchestrator Image

```bash
cd ~/orchestrator

# Install dependencies
npm install

# Build Docker image
docker build -t platform-orchestrator:latest .

# Verify
docker images | grep platform-orchestrator
```

---

### Build Frontend Image

```bash
cd ~/frontend

# Install dependencies
npm install

# Build Docker image
docker build -t platform-dashboard:latest .

# Verify
docker images | grep platform-dashboard
```

---

### Import Images into k3s

```bash
# k3s has its own container runtime, need to import images
sudo k3s ctr images import <(docker save platform-api:latest)
sudo k3s ctr images import <(docker save platform-orchestrator:latest)
sudo k3s ctr images import <(docker save platform-dashboard:latest)

# Verify images in k3s
sudo k3s crictl images | grep platform
```

**✅ All Docker images built and imported into k3s!**

---

## Part 7: Deploy PostgreSQL Database (5 minutes)

```bash
# Create namespace
kubectl create namespace store-platform

# Deploy PostgreSQL
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: postgres
  namespace: store-platform
  labels:
    app: postgres
spec:
  containers:
  - name: postgres
    image: postgres:16
    env:
    - name: POSTGRES_PASSWORD
      value: "postgres"
    - name: POSTGRES_DB
      value: "store_platform"
    ports:
    - containerPort: 5432
    volumeMounts:
    - name: postgres-storage
      mountPath: /var/lib/postgresql/data
  volumes:
  - name: postgres-storage
    emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: store-platform
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
EOF

# Wait for postgres to be ready
kubectl wait --for=condition=ready pod/postgres -n store-platform --timeout=120s

# Verify
kubectl get pods -n store-platform
```

**You should see:** `postgres   1/1   Running`

---

## Part 8: Deploy Backend API (10 minutes)

```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: platform-api
  namespace: store-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: platform-api
  template:
    metadata:
      labels:
        app: platform-api
    spec:
      containers:
      - name: api
        image: platform-api:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_HOST
          value: "postgres.store-platform.svc.cluster.local"
        - name: DATABASE_PORT
          value: "5432"
        - name: DATABASE_NAME
          value: "store_platform"
        - name: DATABASE_USER
          value: "postgres"
        - name: DATABASE_PASSWORD
          value: "postgres"
        - name: PORT
          value: "3001"
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: platform-api
  namespace: store-platform
spec:
  selector:
    app: platform-api
  type: NodePort
  ports:
  - port: 3001
    targetPort: 3001
    nodePort: 30001
EOF

# Wait for deployment
kubectl wait --for=condition=available deployment/platform-api -n store-platform --timeout=120s

# Check status
kubectl get pods -n store-platform
```

**Test API:**
```bash
# Get your EC2 IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Your EC2 IP: $EC2_IP"

# Test API health endpoint
curl http://localhost:3001/health
```

Should return: `{"status":"healthy"...}`

---

## Part 9: Deploy Orchestrator (10 minutes)

```bash
# Create service account and RBAC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: orchestrator
  namespace: store-platform
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: orchestrator-role
rules:
- apiGroups: [""]
  resources: ["namespaces", "pods", "services", "secrets", "persistentvolumeclaims", "resourcequotas"]
  verbs: ["get", "list", "create", "delete", "watch", "update", "patch"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets"]
  verbs: ["get", "list", "create", "delete", "watch", "update", "patch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "create", "delete", "watch", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: orchestrator-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: orchestrator-role
subjects:
- kind: ServiceAccount
  name: orchestrator
  namespace: store-platform
EOF

# Deploy orchestrator
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: platform-orchestrator
  namespace: store-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: platform-orchestrator
  template:
    metadata:
      labels:
        app: platform-orchestrator
    spec:
      serviceAccountName: orchestrator
      containers:
      - name: orchestrator
        image: platform-orchestrator:latest
        imagePullPolicy: Never
        env:
        - name: DATABASE_HOST
          value: "postgres.store-platform.svc.cluster.local"
        - name: DATABASE_PORT
          value: "5432"
        - name: DATABASE_NAME
          value: "store_platform"
        - name: DATABASE_USER
          value: "postgres"
        - name: DATABASE_PASSWORD
          value: "postgres"
        - name: NODE_ENV
          value: "production"
EOF

# Check orchestrator logs
kubectl logs -f deployment/platform-orchestrator -n store-platform
```

Press Ctrl+C to stop following logs

---

## Part 10: Deploy Frontend Dashboard (10 minutes)

First, we need to build frontend with correct API URL:

**On EC2:**
```bash
cd ~/frontend

# Create production .env file
cat <<EOF > .env.production
VITE_API_URL=http://YOUR_EC2_IP:30001/api
EOF

# Replace YOUR_EC2_IP with actual IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
sed -i "s/YOUR_EC2_IP/$EC2_IP/g" .env.production

# Rebuild Docker image with production env
docker build -t platform-dashboard:latest .

# Re-import to k3s
sudo k3s ctr images import <(docker save platform-dashboard:latest)
```

**Deploy frontend:**
```bash
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: platform-dashboard
  namespace: store-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: platform-dashboard
  template:
    metadata:
      labels:
        app: platform-dashboard
    spec:
      containers:
      - name: dashboard
        image: platform-dashboard:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: platform-dashboard
  namespace: store-platform
spec:
  selector:
    app: platform-dashboard
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
EOF

# Wait for deployment
kubectl wait --for=condition=available deployment/platform-dashboard -n store-platform --timeout=120s

# Check status
kubectl get pods -n store-platform
```

---

## Part 11: Access Your Application (FINAL STEP!)

### Get Your URLs

```bash
# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "================================"
echo ""
echo "Dashboard URL: http://$EC2_IP:30080"
echo "API URL: http://$EC2_IP:30001"
echo ""
echo "================================"
```

**Open in your browser:**
- Dashboard: `http://YOUR_EC2_IP:30080`
- API Health: `http://YOUR_EC2_IP:30001/health`

---

## ✅ Verification Checklist

- [ ] Dashboard loads in browser
- [ ] Can create a store from dashboard
- [ ] Store status changes from "Provisioning" to "Ready"
- [ ] Can access store via port-forward
- [ ] Can delete store

---

## 🎬 For Your Demo Video

You can now show:
1. **Local deployment** (localhost:5173)
2. **AWS deployment** (http://EC2_IP:30080)
3. Same Helm charts, different deployment!

---

## 💰 Cost Management

**After submission, to avoid charges:**

1. Go to EC2 Console
2. Select your instance
3. Click "Instance state" → "Terminate instance"
4. Confirm termination

**Estimated cost if you forget:**
- t3.medium: ~$30/month
- 30GB storage: ~$3/month

**For 2-3 days of demo: <$5 total**

---

## 🐛 Troubleshooting

### Dashboard not loading:
```bash
# Check pods
kubectl get pods -n store-platform

# Check logs
kubectl logs deployment/platform-dashboard -n store-platform
kubectl logs deployment/platform-api -n store-platform
```

### API connection error:
```bash
# Test API locally
curl http://localhost:3001/health

# Check if NodePort is open
kubectl get svc -n store-platform
```

### Security group issue:
- Go to EC2 Console → Security Groups
- Find `store-platform-sg`
- Check ports 30001 and 30080 are open

---

## 📞 Next Steps After AWS Deployment

1. ✅ Test dashboard on AWS
2. ✅ Create a store on AWS
3. ✅ Take screenshots
4. ✅ Record demo video (show both local AND AWS!)
5. ✅ Push to GitHub
6. ✅ Submit to Urumi.ai

**You're ready to submit!** 🚀
