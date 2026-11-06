# Smart Inventory Management System

Microservices: `inventory-service` (Node/Express + Postgres), `alert-service` (polls low stock, raises/auto-resolves alerts, optional webhook), `frontend` (React + Vite, served by Nginx which also reverse-proxies the APIs).

## Run with Docker

Each service has two Dockerfiles: `Dockerfile` (production) and `Dockerfile.dev` (development).

| | Production / deployment | Development |
|---|---|---|
| Compose file | `docker-compose.yml` | `docker-compose.dev.yml` |
| Command | `docker compose up -d --build` | `docker compose -f docker-compose.dev.yml up --build` |
| Frontend | Nginx serving the built app → http://localhost:8080 | Vite dev server, hot reload → http://localhost:5173 |
| Backends | `node` with prod deps only | `node --watch`, source mounted from host |
| Config | `.env` (see `.env.example`) | built-in dev defaults |

Inventory API: :3000 · Alert API: :3001 (both modes). Stop with `docker compose down` (add `-v` to wipe the database).

## Endpoints
Inventory: `GET/POST /items`, `PUT/DELETE /items/:id`, `POST /items/:id/adjust {delta,reason}`, `GET /low-stock`, `GET /reports/summary`, `GET /reports/movements`, `GET /health`, `GET /metrics`
Alerts: `GET /alerts?status=active|resolved|all`, `POST /alerts/check`, `GET /health`, `GET /metrics`

## Prometheus metrics
Both services expose `/metrics`: default Node metrics plus `inventory_items_total`, `inventory_low_stock_items`, `inventory_stock_value`, `inventory_stock_movements_total`, `alert_active_total`, `alert_raised_total`.

## Local dev (no Docker)
Run Postgres, then `npm install && npm start` in each service, and `npm install && npm run dev` in `frontend` (Vite proxies `/api/*`).

## Config (env vars)
`DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME`, `PORT`; alert-service: `INVENTORY_URL POLL_INTERVAL_MS WEBHOOK_URL`.

## DevOps & Deployment
- **Kubernetes**: Production manifests located in `k8s/` (`client`, `server`, `worker`, `postgres`, `ingress-service`, PVC, ConfigMap, and Secret).
- **Ansible**: Provisioning & rollout automation in `ansible/` (`setup-environment.yml` and `deploy-k8s.yml`).
- **CI/CD Pipeline**: Automated build, test, push, and Kubernetes rollout via `Jenkinsfile`.
- **System Architecture & Runbook**: See `DEVOPS_ARCHITECTURE.md` for complete architectural diagrams (Mermaid.js) and step-by-step instructions.

## Still to add
Prometheus/Grafana monitoring dashboard stack, Terraform (VPC/EC2/S3).

## Frontend: themes & languages
The dashboard supports Light / Dark / System themes and English / Arabic (RTL). Choices are saved in `localStorage`. Add strings in `frontend/src/i18n.jsx`; to add a language, add a dictionary and its code to `LANGS`.
