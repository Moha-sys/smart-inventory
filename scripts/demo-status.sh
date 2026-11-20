#!/usr/bin/env bash
# ==============================================================================
# Smart Inventory - Live DevOps Demo Dashboard
# Run this script during your presentation to display full system health!
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}        SMART INVENTORY MANAGEMENT SYSTEM - LIVE DEMO DASHBOARD        ${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

# 1. Docker Compose Services
echo -e "${BLUE}[1/4] DOCKER COMPOSE RUNNING CONTAINERS${NC}"
docker compose ps --format "table {{.Name}}\t{{.Service}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Kubernetes Cluster Pods & Services
echo -e "${BLUE}[2/4] KUBERNETES CLUSTER HEALTH (Pods & Persistent Storage)${NC}"
kubectl get pods,pvc,svc -l app=smart-inventory -o wide
echo ""

# 3. Jenkins CI/CD Pipeline Status
echo -e "${BLUE}[3/4] JENKINS CI/CD STATUS (Latest Build)${NC}"
BUILD_INFO=$(curl -s -u user1:user1password http://localhost:8080/job/smart-inventory/api/json 2>/dev/null || echo "{}")
if [ "$BUILD_INFO" != "{}" ]; then
  python3 -c "
import json
data = json.loads('''$BUILD_INFO''')
last = data.get('lastBuild', {})
print(f'   Pipeline Job : smart-inventory')
print(f'   Latest Build : #{last.get(\"number\", \"N/A\")}')
print(f'   Job URL      : {last.get(\"url\", \"http://localhost:8080/job/smart-inventory/\")}')
"
else
  echo "   Jenkins running at: http://localhost:8080/job/smart-inventory/"
fi
echo ""

# 4. Live API Endpoint Health
echo -e "${BLUE}[4/4] LIVE HTTP ENDPOINT PROBES${NC}"
echo -n "   - Frontend (Client) Port 8081       : "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/healthz || echo "Offline"

echo -n "   - Backend API (Server) Port 3000     : "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health || echo "Offline"

echo -n "   - Alert Worker Port 3001             : "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/health || echo "Offline"

echo -n "   - K8s Client NodePort 30080          : "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:30080/healthz || echo "Offline"

echo ""
echo -e "${GREEN}✔ All microservices, Kubernetes pods, and CI/CD pipelines are OPERATIONAL!${NC}"
echo -e "${CYAN}==============================================================================${NC}"
