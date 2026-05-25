# BuyRealViews — YouTube Growth Service Platform

A full-stack platform where users purchase YouTube engagement: Likes, Views, Subscribers, Comments, and Shorts. Built with a separated React frontend and Python FastAPI backend.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Radix UI primitives
- React Router v7
- Zustand (state management)
- Axios (centralized API client)

**Backend**
- Python + FastAPI
- MongoDB (users, orders) via Motor (async)
- Redis (caching / rate limiting)
- JWT authentication (python-jose + bcrypt)
- SMTP email (OTP delivery via aiosmtplib)

---

## Repository Structure

```
glow-apex/
├── frontend/
│   ├── public/assets/          # Static images, SVGs, icons
│   └── src/
│       ├── App.tsx             # Root component + all route definitions
│       ├── config.ts           # All API base URLs and endpoint constants
│       ├── pages/              # Route-level page components
│       │   ├── Home/
│       │   ├── services/       # YouTube service pages (views, likes, etc.)
│       │   ├── checkout/       # Checkout, success, cancel, status pages
│       │   ├── dashboard/      # Authenticated user area
│       │   ├── blogs/
│       │   ├── contact/
│       │   └── auth/           # Sign-in / Sign-up pages
│       ├── components/         # Shared UI components
│       ├── context/
│       │   ├── AuthContext.tsx       # Global auth state (JWT-backed)
│       │   └── ServicesContext.tsx   # SMM services list (fetched on mount)
│       ├── store/              # Zustand stores (auth, order)
│       ├── hooks/              # Custom React hooks
│       └── config/
│           ├── data.ts         # All static content: FAQs, pricing, blog posts
│           └── menu-items.ts   # Navbar menu config
│
└── backend/
    └── app/
        ├── main.py             # FastAPI entry point, middleware, lifespan
        ├── app_components.py   # Router registration
        ├── common/             # Shared config, DB connection, Redis
        ├── payments/
        │   ├── cashfree/       # INR payments — create / verify / webhook
        │   ├── stripe/         # USD payments — create / verify / webhook
        │   ├── cryptomus/      # Crypto payments — create / verify / webhook
        │   └── payeer/         # Payeer payments — create / verify / webhook
        ├── smm/                # Postlikes.com proxy — services + add-order
        ├── orders/             # Order records and history
        ├── user_management/    # JWT auth, registration, OTP, profile
        └── platform_settings/  # Runtime config and limits
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB instance
- Redis instance

### Frontend

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

### Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start infrastructure (MongoDB + Redis)
docker-compose -f backend/docker-compose.dev.yml up -d

# Run API server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Environment Variables

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### `backend/.env`

```env
# App
BACKEND_BASE_URL=http://localhost:8000
FRONTEND_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=buyrealviews
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Email (OTP delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your@email.com

# Redis
REDIS_URL=redis://localhost:6379

# SMM Panel
POSTLIKES_API_KEY=

# Payment Gateways
CASHFREE_CLIENT_ID=
CASHFREE_CLIENT_SECRET=
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

CRYPTOMUS_MERCHANT_ID=
CRYPTOMUS_API_KEY=

PAYEER_MERCHANT_ID=
PAYEER_SECRET_KEY=
PAYEER_ENCRYPTION_KEY=
```

---

## Architecture

### Payment Gateways

| Gateway | Currency | Method |
|---------|----------|--------|
| Cashfree | INR (converted from USD server-side) | Redirect to Cashfree SDK |
| Stripe | USD | Redirect to Stripe Checkout |
| Cryptomus | USD | Redirect to Cryptomus page |
| Payeer | USD | Redirect via form POST |

All payment secrets live exclusively in the backend. The frontend only calls backend endpoints — never payment gateway APIs directly.

After a successful webhook, the backend calls the SMM panel (`POST /smm/add-order`) to place the order. The frontend never triggers order placement.

### Authentication Flow

1. User registers → backend sends 6-digit OTP via email
2. User verifies OTP → backend returns JWT
3. JWT stored by frontend (`AuthContext`) and attached to all subsequent requests
4. Protected routes redirect to `/sign-in` if no valid token

### Checkout → Order Flow

1. User selects a package on a service page → stored in Zustand (`useOrderStore`)
2. User fills checkout form, selects payment method
3. Frontend calls `POST /payments/{gateway}/create` → backend returns redirect URL
4. User completes payment on the gateway's page
5. Gateway calls `POST /payments/{gateway}/webhook` on the backend
6. Backend verifies webhook signature → places SMM order → stores order record
7. User lands on `/checkout/success` or `/checkout/check-status`

### SMM Panel

Services are proxied from [Postlikes.com](https://postlikes.com). Active service IDs:

| Service | ID |
|---------|----|
| YouTube Views | 5209 |
| YouTube Likes | 2342 |
| YouTube Shorts | 5648 |
| YouTube Subscribers | 376 |

---

## Deployment

- **Frontend** → [Vercel](https://vercel.com) (config: `frontend/vercel.json`)
- **Backend** → [Railway](https://railway.app) (config: `backend/railway.toml`)

Set all environment variables in the respective platform dashboards. The frontend only needs `VITE_API_BASE_URL` pointing to the deployed backend URL.