# Deployment Guide

This guide deploys the project to a remote Ubuntu server using Docker.
Both sites run over HTTP on the server IP. When you point a domain via Cloudflare,
SSL is handled at Cloudflare's edge — no changes needed on the server itself.

---

## Architecture

```
Browser
  │
  ├── :80   → Nginx → BRV frontend (React SPA)
  │              └── /api/* → backend:8000 (FastAPI)
  │
  └── :3001 → Nginx → GA  frontend (same React build, different app)
                 └── /api/* → backend:8000 (FastAPI)

backend ──► mongo:27017
        ──► redis:6379
```

| Site | Dev | Production |
|---|---|---|
| BRV (BuyRealViews) | `http://localhost:5173` | `http://SERVER_IP` |
| GA (Glow Apex) | `http://localhost:3001` | `http://SERVER_IP:3001` |
| Backend API | `http://localhost:8000` | `http://SERVER_IP/api/` |

---

## 1. Prerequisites — on the server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 2. Open Firewall Ports — on the server

```bash
sudo ufw allow 22/tcp    # SSH — keep this open
sudo ufw allow 80/tcp    # BRV site
sudo ufw allow 3001/tcp  # GA site
sudo ufw enable
```

---

## 3. Transfer the Project — from your local machine

The `.env` files are gitignored and contain secrets, so **rsync** is the only correct
transfer method — it copies the full working tree including env files.

```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.venv' \
  /home/urmil/glow-apex-web-development/ \
  user@SERVER_IP:/opt/glow-apex/
```

Replace `user` with your server login (e.g. `root` or `ubuntu`) and `SERVER_IP` with your IP.

This copies:
- All source code
- `backend/.env` (secrets included — never commit this)
- `frontend/.env.production` (baked into the JS bundle at build time)

---

## 4. Environment Files

Both env files already exist locally and are transferred by rsync above.
If you need to create them from scratch on the server:

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

| Variable | Value |
|---|---|
| `BACKEND_BASE_URL` | `http://SERVER_IP/api` |
| `FRONTEND_ORIGIN` | `http://SERVER_IP` |
| `GLOWAPEX_ORIGIN` | `http://SERVER_IP:3001` |
| `JWT_SECRET_KEY` | `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `API_KEY_ENCRYPTION_SECRET` | `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password (16-char, not your login password) |
| `SMTP_FROM` | Same Gmail address |
| `CONTACT_OWNER_EMAIL` | Email to receive contact form submissions |
| `POSTLIKES_API_KEY` | From your Postlikes.com account |
| Payment keys | From each gateway's dashboard |

Leave `MONGODB_URI` and `REDIS_URL` as-is — docker-compose overrides them automatically.

### Frontend (`frontend/.env.production`)

```bash
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

```env
VITE_API_BASE_URL=http://SERVER_IP/api
VITE_GLOWAPEX_URL=http://SERVER_IP:3001
VITE_D1_URL=http://SERVER_IP
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

> These values are baked into the JS bundle at build time. Any change requires a frontend rebuild.

---

## 5. Build and Start — on the server

```bash
cd /opt/glow-apex
docker compose -f docker-compose.prod.yml up --build -d
```

First run takes 3–5 minutes (pulls base images and builds frontend + backend).
Watch progress:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## 6. Verify the Deployment

```bash
docker compose -f docker-compose.prod.yml ps
```

All 5 containers should show **Up (healthy)**:

| Container | Role |
|---|---|
| `mongo` | Database |
| `redis` | Cache / rate limiting |
| `backend` | FastAPI |
| `frontend` | React SPA (nginx) |
| `nginx` | Reverse proxy |

Open in browser:
- BRV site → `http://SERVER_IP`
- GA site → `http://SERVER_IP:3001`
- API health → `http://SERVER_IP/api/openapi.json` (should return JSON)

---

## 7. Payment Gateway Webhook URLs

Register these in each gateway's dashboard:

| Gateway | Webhook URL |
|---|---|
| Stripe | `http://SERVER_IP/api/payments/stripe/webhook` |
| Razorpay | `http://SERVER_IP/api/payments/razorpay/webhook` |
| Cashfree | `http://SERVER_IP/api/payments/cashfree/webhook` |
| Cryptomus | `http://SERVER_IP/api/payments/cryptomus/webhook` |
| Payeer | `http://SERVER_IP/api/payments/payeer/webhook` |

---

## 8. Future Deploys (after code changes)

Run from your local machine:

```bash
# 1. Push updated code + env files to the server
rsync -avz --progress \
  --exclude='node_modules' --exclude='dist' --exclude='.git' \
  --exclude='__pycache__' --exclude='*.pyc' --exclude='.venv' \
  /home/urmil/glow-apex-web-development/ \
  user@SERVER_IP:/opt/glow-apex/

# 2. Rebuild and restart on the server
ssh user@SERVER_IP "cd /opt/glow-apex && docker compose -f docker-compose.prod.yml up --build -d"
```

To rebuild only one service (faster when only the backend changed):

```bash
ssh user@SERVER_IP "cd /opt/glow-apex && docker compose -f docker-compose.prod.yml up --build -d backend"
```

---

## 9. Switching to Cloudflare + Custom Domains

When DNS is pointed at this server via Cloudflare:

**Backend** (`backend/.env`):

```env
BACKEND_BASE_URL=https://buyrealviews.com/api
FRONTEND_ORIGIN=https://buyrealviews.com
GLOWAPEX_ORIGIN=https://glowapex.com
ALLOWED_RETURN_ORIGINS=https://buyrealviews.com,https://buyrealsubscribers.com
```

> **Three domains, one build.** buyrealviews.com and buyrealsubscribers.com are served by
> the same React store build — the hostname picks the landing page (Views vs Subscribers).
> glowapex.com renders the payment portal. Point all three A-records at this server via
> Cloudflare (SSL Flexible). Stripe/Razorpay redirect to glowapex.com and bounce the user
> back to the originating store (validated against `ALLOWED_RETURN_ORIGINS`); Cryptomus is
> paid inline on the store itself, no redirect.

**Frontend** (`frontend/.env.production`):

```env
VITE_API_BASE_URL=https://buyrealviews.com/api
VITE_GLOWAPEX_URL=https://glowapex.com
VITE_D1_URL=https://buyrealviews.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Rebuild after changing env files:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Nginx config does **not** need to change — Cloudflare terminates SSL at their edge,
your server continues to receive plain HTTP on ports 80 and 3001.

> Cloudflare dashboard: set SSL/TLS mode to **Flexible** (origin is HTTP only).

**Webhook URLs** after Cloudflare:
Replace `http://SERVER_IP` with `https://buyrealviews.com` in all gateway dashboards.

---

## 10. Useful Commands

```bash
# View all container statuses
docker compose -f docker-compose.prod.yml ps

# Tail logs for a specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart a single service (without rebuild)
docker compose -f docker-compose.prod.yml restart backend

# Stop everything (database volumes are preserved)
docker compose -f docker-compose.prod.yml down

# Stop and wipe all data (WARNING: deletes database)
docker compose -f docker-compose.prod.yml down -v
```

---

## 11. Rollback

```bash
# On the server — stop current containers
docker compose -f docker-compose.prod.yml down

# From local — rsync the previous version
rsync -avz --progress \
  --exclude='node_modules' --exclude='dist' --exclude='.git' \
  /path/to/previous-version/ user@SERVER_IP:/opt/glow-apex/

# On the server — rebuild
cd /opt/glow-apex && docker compose -f docker-compose.prod.yml up --build -d
```

Volumes (`mongo_data`, `redis_data`) survive `down` without `-v`, so your database
is safe across rollbacks.

---

## 12. Common Issues

**Container exits immediately:**
```bash
docker compose -f docker-compose.prod.yml logs backend
```
Usually a missing or malformed `.env` value (`JWT_SECRET_KEY`, `API_KEY_ENCRYPTION_SECRET`).

**Frontend shows blank page or API calls fail:**
Check `VITE_API_BASE_URL` in `frontend/.env.production` points to the correct address,
then rebuild: `docker compose -f docker-compose.prod.yml up --build -d frontend`.

**GA site (port 3001) not loading:**
Check the firewall: `sudo ufw status` — port 3001 must be allowed.

**Email not sending:**
`SMTP_PASSWORD` must be a Gmail **App Password** (16-char code from
Google Account → Security → 2-Step Verification → App Passwords),
not your regular Gmail login password.

**MongoDB healthcheck failing:**
```bash
docker compose -f docker-compose.prod.yml exec mongo mongosh --eval "db.adminCommand('ping')"
```
