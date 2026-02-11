# PowerShell Commands for Demo Video

## Pre-Demo Verification

```powershell
cd C:\Users\hp\OneDrive\Desktop\Urumi.ai_Round_1
docker ps
kubectl cluster-info
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing
```

## Command 1: Create Store

```powershell
$response = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "demostore", "engine": "woocommerce"}' -UseBasicParsing
```

## Command 2: Show Response

```powershell
$response.Content | ConvertFrom-Json | ConvertTo-Json
```

## Command 3: Extract Namespace

```powershell
$namespace = ($response.Content | ConvertFrom-Json).store.namespace
Write-Host "Namespace: $namespace" -ForegroundColor Green
```

## Command 4: Watch Pods

```powershell
kubectl get pods -n $namespace --watch
```

Press Ctrl+C when both pods show 1/1 Running

## Command 5: Show All Resources

```powershell
kubectl get all,ingress,pvc -n $namespace
```

## Command 6: Check Store Status

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/stores" -Headers @{"x-user-id"="shruti"} -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

## Command 7: Port Forward

```powershell
kubectl port-forward -n $namespace service/demostore 8080:80
```

Then open browser: http://localhost:8080

## Command 8: Show All Namespaces

```powershell
kubectl get namespaces | Select-String "store"
```

## Alternative: Single Variable Method

```powershell
$r = Invoke-WebRequest -Method POST -Uri "http://localhost:3001/api/stores" -Headers @{"Content-Type"="application/json"; "x-user-id"="shruti"} -Body '{"name": "myshop", "engine": "woocommerce"}' -UseBasicParsing
$ns = ($r.Content | ConvertFrom-Json).store.namespace
$r.Content | ConvertFrom-Json | ConvertTo-Json
kubectl get pods -n $ns --watch
kubectl get all -n $ns
kubectl port-forward -n $ns service/myshop 8080:80
```

## Key Points

- All commands use -UseBasicParsing to avoid security warnings
- $namespace variable auto-stores the namespace name
- Use Ctrl+C to stop watching pods
- Each store gets a unique namespace like store-demostore-abc123de
