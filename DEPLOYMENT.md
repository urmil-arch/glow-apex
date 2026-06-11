# Deployment Guide — BuyRealViews

This guide deploys the app to an Ubuntu server using Docker and Nginx.
The site runs over HTTP on your server IP. When you configure Cloudflare later,
SSL is handled by Cloudflare — no changes needed on the server.

---

## Architecture

```
Browser
  │
  ▼
Nginx  :80  (reverse proxy)
  ├── /api/*  →  backend:8000  (FastAPI)
  └── /*      →  frontend:80   (React SPA / nginx)

backend ──► mongo:27017
        ──► redis:6379
```

---

## 1. Prerequisites

On your Ubuntu server:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

## 2. Transfer the Repository

```bash
# Option A — clone from git
git clone <your-repo-url> /opt/buyrealviews
cd /opt/buyrealviews

# Option B — rsync from your machine
rsync -avz --exclude='node_modules' --exclude='.git' \
  /local/path/glow-apex-web-development/ user@SERVER_IP:/opt/buyrealviews/
```

---

## 3. Create Environment Files

### Backend

```bash
cd /opt/buyrealviews
cp backend/.env.example backend/.env
nano backend/.env
```

**Required changes:**

| Variable | Value |
|---|---|
| `BACKEND_BASE_URL` | `http://YOUR_SERVER_IP/api` |
| `FRONTEND_ORIGIN` | `http://YOUR_SERVER_IP` |
| `JWT_SECRET_KEY` | Run: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `API_KEY_ENCRYPTION_SECRET` | Run: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password (not your login password) |
| `SMTP_FROM` | Same Gmail address |
| `CONTACT_OWNER_EMAIL` | Email to receive contact form submissions |
| `POSTLIKES_API_KEY` | From your Postlikes.com account |
| Payment keys | From each gateway's dashboard |

Leave `MONGODB_URI` and `REDIS_URL` unchanged — docker-compose overrides them automatically.

### Frontend

```bash
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

Set `VITE_API_BASE_URL=http://YOUR_SERVER_IP/api` and fill in `VITE_STRIPE_PUBLISHABLE_KEY`.

> **Note:** These values are baked into the JavaScript bundle at build time.
> If you change them later you must rebuild the frontend image.

---

## 4. Build and Start

```bash
cd /opt/buyrealviews

# Build all images (takes 3–5 minutes on first run)
docker compose -f docker-compose.prod.yml build

# Start everything
docker compose -f docker-compose.prod.yml up -d

# Watch logs during startup
docker compose -f docker-compose.prod.yml logs -f
```

---

## 5. Verify the Deployment

```bash
# Check all containers are healthy
docker compose -f docker-compose.prod.yml ps

# All services should show "healthy" or "running"
```

Open a browser: `http://YOUR_SERVER_IP`

Test the API: `http://YOUR_SERVER_IP/api/openapi.json` — should return JSON.

---

## 6. Payment Gateway Webhook URLs

Register these URLs in each payment gateway dashboard:

| Gateway | Webhook URL |
|---|---|
| Stripe | `http://YOUR_SERVER_IP/api/payments/stripe/webhook` |
| Razorpay | `http://YOUR_SERVER_IP/api/payments/razorpay/webhook` |
| Cashfree | `http://YOUR_SERVER_IP/api/payments/cashfree/webhook` |
| Cryptomus | `http://YOUR_SERVER_IP/api/payments/cryptomus/webhook` |
| Payeer | `http://YOUR_SERVER_IP/api/payments/payeer/webhook` |

> After switching to Cloudflare, replace `http://YOUR_SERVER_IP` with `https://buyrealviews.com`.

---

## 7. Switching to Cloudflare + Custom Domain

When your domain is pointed at this server via Cloudflare:

### Step 1 — Update backend env

```bash
nano backend/.env
```

Change two lines:
```
BACKEND_BASE_URL=https://buyrealviews.com/api
FRONTEND_ORIGIN=https://buyrealviews.com
```

### Step 2 — Update frontend env

```bash
nano frontend/.env.production
```

Change one line:
```
VITE_API_BASE_URL=https://buyrealviews.com/api
```

### Step 3 — Rebuild and restart

```bash
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d
```

Nginx config does **not** need to change — Cloudflare handles SSL at their edge;
your server continues to receive plain HTTP on port 80.

> In Cloudflare dashboard: set SSL/TLS mode to **Flexible** (origin is HTTP only).

---

## 8. Useful Commands

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# Tail logs for a specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# Restart a single service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and delete volumes (WARNING: deletes database)
docker compose -f docker-compose.prod.yml down -v
```

---

## 9. Rollback Procedure

```bash
# Stop the current deployment
docker compose -f docker-compose.prod.yml down

# Restore the previous code (if using git)
git checkout <previous-commit>

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Volumes (`mongo_data`, `redis_data`) are **not** deleted by `down` without `-v`,
so your database survives a code rollback.

---

## 10. Common Issues

**Containers restart immediately:**
```bash
docker compose -f docker-compose.prod.yml logs backend
```
Usually a missing `.env` value or incorrect `JWT_SECRET_KEY`.

**Frontend shows blank page / API calls fail:**
Check that `VITE_API_BASE_URL` in `frontend/.env.production` uses the correct IP
and you ran `docker compose build` after creating the file.

**Email not sending:**
Ensure `SMTP_PASSWORD` is a Gmail **App Password** (16-char code from
Google Account → Security → 2-Step Verification → App Passwords),
not your regular Gmail password.

**MongoDB healthcheck failing:**
```bash
docker compose -f docker-compose.prod.yml exec mongo mongosh --eval "db.adminCommand('ping')"
```
