#!/bin/bash
# =============================================================
# Urumi Store Platform - Production Diagnostics & Fix Script
# Run this on the EC2 instance after SSH
# Usage: bash fix-production.sh
# =============================================================

set -e

AWS_IP="${1:-51.20.42.151}"
NS_PLATFORM="store-platform"

echo "======================================================"
echo " Urumi Store Platform - EC2 Diagnostics & Fix"
echo " Server: $AWS_IP"
echo "======================================================"

# --- Step 1: Check k3s ---
echo ""
echo "[1/7] Checking k3s status..."
if ! sudo systemctl is-active --quiet k3s; then
  echo "  k3s is NOT running. Starting..."
  sudo systemctl start k3s
  sleep 10
  echo "  k3s started."
else
  echo "  k3s is running."
fi

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# --- Step 2: Check platform pods ---
echo ""
echo "[2/7] Platform pod status:"
sudo k3s kubectl get pods -n $NS_PLATFORM 2>/dev/null || echo "  Namespace not found."

# --- Step 3: Check all NodePort services ---
echo ""
echo "[3/7] All NodePort services:"
sudo k3s kubectl get svc -A | grep NodePort

# --- Step 4: Restart any crashed pods ---
echo ""
echo "[4/7] Restarting failed platform pods..."
CRASH_PODS=$(sudo k3s kubectl get pods -n $NS_PLATFORM --field-selector=status.phase!=Running -o name 2>/dev/null || true)
if [ -n "$CRASH_PODS" ]; then
  echo "  Restarting: $CRASH_PODS"
  sudo k3s kubectl delete $CRASH_PODS -n $NS_PLATFORM 2>/dev/null || true
  sleep 5
else
  echo "  No crashed pods found."
fi

# --- Step 5: Check/fix existing store ---
echo ""
echo "[5/7] Checking store namespaces..."
STORE_NS=$(sudo k3s kubectl get namespaces -o name 2>/dev/null | grep "namespace/store-" | grep -v "namespace/store-platform" | head -1 | sed 's|namespace/||')

if [ -n "$STORE_NS" ]; then
  echo "  Found store namespace: $STORE_NS"
  echo ""
  echo "  Store pods:"
  sudo k3s kubectl get pods -n $STORE_NS
  echo ""
  echo "  Store services (NodePorts):"
  sudo k3s kubectl get svc -n $STORE_NS

  # Get the actual NodePort
  ACTUAL_PORT=$(sudo k3s kubectl get svc -n $STORE_NS -o jsonpath='{.items[?(@.spec.type=="NodePort")].spec.ports[0].nodePort}' 2>/dev/null || echo "")
  if [ -n "$ACTUAL_PORT" ]; then
    echo ""
    echo "  Store is on port: $ACTUAL_PORT"
    echo "  Access at: http://$AWS_IP:$ACTUAL_PORT/"

    # Fix WordPress URLs in DB
    WP_POD=$(sudo k3s kubectl get pods -n $STORE_NS -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$WP_POD" ]; then
      WP_READY=$(sudo k3s kubectl get pod $WP_POD -n $STORE_NS -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
      if [ "$WP_READY" = "true" ]; then
        echo ""
        echo "  Fixing WordPress siteurl and home in database..."
        sudo k3s kubectl exec -n $STORE_NS $WP_POD -- wp option update siteurl "http://$AWS_IP:$ACTUAL_PORT" --allow-root 2>/dev/null && echo "  siteurl updated" || echo "  wp-cli not available (using WORDPRESS_CONFIG_EXTRA instead)"
        sudo k3s kubectl exec -n $STORE_NS $WP_POD -- wp option update home "http://$AWS_IP:$ACTUAL_PORT" --allow-root 2>/dev/null && echo "  home updated" || true
      else
        echo "  WordPress pod not ready yet. Wait and re-run this script."
      fi
    fi
  fi
else
  echo "  No stores found. Creating Urumi Clothing store..."

  # Get the API NodePort
  API_PORT=$(sudo k3s kubectl get svc platform-api -n $NS_PLATFORM -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30395")
  echo "  Using API at http://$AWS_IP:$API_PORT"

  curl -s -X POST "http://localhost:$API_PORT/api/stores" \
    -H "Content-Type: application/json" \
    -H "x-user-id: admin" \
    -d '{"name":"Urumi Clothing","engine":"woocommerce"}' | python3 -m json.tool 2>/dev/null || \
  curl -s -X POST "http://localhost:$API_PORT/api/stores" \
    -H "Content-Type: application/json" \
    -H "x-user-id: admin" \
    -d '{"name":"Urumi Clothing","engine":"woocommerce"}'

  echo ""
  echo "  Store creation initiated. Wait 3-5 minutes, then re-run this script."
fi

# --- Step 6: Pull latest code and upgrade helm ---
echo ""
echo "[6/7] Pulling latest code..."
if [ -d "Urumi.ai" ]; then
  cd Urumi.ai
  git pull origin main
  cd ..
fi

echo "  Upgrading Helm chart..."
if [ -d "Urumi.ai" ]; then
  helm upgrade store-platform Urumi.ai/helm-charts/platform \
    -f Urumi.ai/helm-charts/platform/values-vps.yaml \
    --namespace $NS_PLATFORM \
    --reuse-values \
    2>/dev/null && echo "  Helm upgraded." || echo "  Helm upgrade skipped (chart not changed)."
fi

# --- Step 7: Final status ---
echo ""
echo "[7/7] Final status:"
echo ""
echo "  Platform pods:"
sudo k3s kubectl get pods -n $NS_PLATFORM
echo ""
echo "  All NodePort services:"
sudo k3s kubectl get svc -A --field-selector spec.type=NodePort 2>/dev/null | grep -v "^NAMESPACE"
echo ""
echo "======================================================"
echo " URLs to try:"
echo "  Dashboard:  http://$AWS_IP:30300/"
echo "  API Health: http://$AWS_IP:30395/health"
echo "  Store:      check NodePort above"
echo "======================================================"
