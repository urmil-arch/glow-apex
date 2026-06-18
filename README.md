# BuyRealViews + Glow Apex — Social Media Growth Platform

A full-stack platform hosting two products:

- **BuyRealViews** — YouTube engagement service platform (likes, views, subscribers, comments, shorts)
- **Glow Apex** — PR & communications agency landing site with pricing calculator

Both products share the same React frontend codebase and Python FastAPI backend with a unified admin panel.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Radix UI primitives
- React Router v7
- Zustand (cross-page order state, persisted to sessionStorage)
- Axios (centralized API client with JWT attach + 401 refresh)

**Backend**
- Python + FastAPI
- MongoDB (all data) via Motor (async)
- Redis (OTP cache, rate limiting, session locks)
- JWT authentication (python-jose + bcrypt)
- Email via SMTP (`aiosmtplib`) — OTP delivery and contact confirmations

---

## Repository Structure

```
glow-apex/
├── frontend/
│   ├── public/assets/              # Static images, SVGs, icons
│   └── src/
│       ├── App.tsx                 # Root component + all route definitions
│       ├── config.ts               # All API base URLs and endpoint constants
│       │
│       ├── pages/                  # BuyRealViews route-level pages
│       │   ├── Home/               # BuyRealViews home page
│       │   ├── services/           # YouTube service pages
│       │   ├── checkout/           # Checkout + status/cancel pages
│       │   ├── dashboard/          # Authenticated user area
│       │   │   ├── orders/         # Order history
│       │   │   ├── payments/       # Payment history
│       │   │   ├── tickets/        # Support tickets
│       │   │   ├── notifications/  # Admin-broadcast notifications (IST display)
│       │   │   └── profile/        # Account settings
│       │   ├── admin/              # Admin panel (is_admin or staff with permissions)
│       │   │   ├── users/          # User management + export
│       │   │   ├── staff/          # Staff + role/permission management
│       │   │   ├── orders/         # All orders + resend/refund/cancel
│       │   │   ├── tasks/          # Failed-order task queue
│       │   │   ├── payments/       # All payments
│       │   │   ├── services/       # Service categories + packages + fallback chains
│       │   │   ├── service-stats/  # Per-service usage analytics (last used, most used)
│       │   │   ├── reports/        # Revenue / profit / order analytics
│       │   │   ├── support/        # Tickets + contact messages
│       │   │   ├── notifications/  # Broadcast notifications to users
│       │   │   ├── blogs/          # Blog post management
│       │   │   └── settings/       # Platform settings (maintenance mode, etc.)
│       │   ├── blogs/              # Public blog pages
│       │   ├── contact/            # Contact form
│       │   └── auth/               # Sign-in / Sign-up / OTP verify / Suspended
│       │
│       ├── glowapex/               # Glow Apex PR agency site
│       │   ├── pages/
│       │   │   ├── Home/           # Landing page with pricing calculator
│       │   │   └── Checkout/       # Glow Apex checkout
│       │   └── components/
│       │
│       ├── components/             # Shared UI components
│       │   ├── ui/                 # Radix-based primitives
│       │   ├── admin/              # AdminGuard, RequirePermission
│       │   ├── common/             # FAQ, RaiseTicketModal, AdminFAB, etc.
│       │   ├── payment/            # StripePayment, CryptomusPayment, etc.
│       │   └── sections/           # Per-service hero + DynamicPackageSelector
│       │
│       ├── context/
│       │   ├── AuthContext.tsx     # Auth state: user, JWT, is_admin, permissions
│       │   ├── ServicesContext.tsx # Public services list (fetched on mount)
│       │   ├── PricingContext.tsx  # Dynamic portal pricing (fetched on mount)
│       │   └── CurrencyContext.tsx # Currency selector
│       ├── store/
│       │   └── useOrderStore.ts    # Zustand: cross-page order data (sessionStorage)
│       └── config/
│           ├── data.ts             # Static content: FAQs, descriptions, blog posts
│           └── menu-items.ts       # Navbar menu config
│
└── backend/
    └── app/
        ├── main.py                 # FastAPI entry, CORS, middleware, MongoDB indexes
        ├── app_components.py       # Router registration
        ├── common/                 # config.py (pydantic-settings), crypto.py (AES-GCM)
        │
        ├── user_management/        # Auth + profiles + OTP + staff + permissions
        ├── checkout/               # POST /checkout/initiate — creates order + payment
        ├── orders/                 # User order endpoints + fulfillment + pricing utils
        ├── payments/               # Cashfree / Stripe / Cryptomus / Payeer / Razorpay
        ├── notifications/          # Admin-to-user broadcast notifications
        ├── tickets/                # User support tickets
        ├── contact/                # Public contact form (Redis rate-limited)
        ├── blog/                   # Public blog posts
        ├── public_services/        # GET /services (no auth)
        ├── public_pricing/         # GET /pricing (no auth)
        ├── public_settings/        # GET /settings — maintenance mode flag
        ├── smm/                    # Legacy Postlikes.com proxy
        └── admin/                  # All /admin/* endpoints
            ├── users/              # User list, suspend, export
            ├── orders/             # All orders, resend, refund, cancel, service-stats
            ├── payments/           # All payments, manual payment
            ├── providers/          # SMM provider CRUD + credentials (AES-encrypted)
            ├── services/           # Service categories + individual services
            ├── service_packages/   # Packages + ordered provider fallback chains
            ├── pricing/            # Dynamic portal pricing per service type
            ├── reports/            # Aggregated revenue / order / ticket reports
            ├── tasks/              # Failed-order and manual task management
            ├── support/            # Admin view of tickets + contact messages
            ├── notifications/      # Send / delete notifications
            ├── settings/           # Platform settings upsert
            └── staff/              # Staff management + role/permission editor
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
pip install -r backend/requirements.txt

# Start infrastructure
docker-compose -f backend/docker-compose.dev.yml up -d

cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Environment Variables

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### `backend/.env`

```env
# App
BACKEND_BASE_URL=http://localhost:8000
FRONTEND_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=buyrealviews

# Auth
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Email (SMTP via aiosmtplib — Gmail requires an app password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# Redis
REDIS_URL=redis://localhost:6379

# Provider key encryption (64 hex chars = 32 bytes AES-256)
API_KEY_ENCRYPTION_SECRET=

# Legacy SMM panel
POSTLIKES_API_KEY=

# Payment Gateways
CASHFREE_CLIENT_ID=
CASHFREE_CLIENT_SECRET=
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg

STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

CRYPTOMUS_MERCHANT_ID=
CRYPTOMUS_API_KEY=

PAYEER_MERCHANT_ID=
PAYEER_SECRET_KEY=
PAYEER_ENCRYPTION_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Contact form
CONTACT_OWNER_EMAIL=
```

---

## Architecture

### Payment Gateways

| Gateway | Currency | Method |
|---------|----------|--------|
| Cashfree | INR (USD → INR server-side) | Redirect to Cashfree SDK |
| Stripe | USD | Redirect to Stripe Checkout |
| Cryptomus | USD | Redirect to Cryptomus page |
| Payeer | USD | Redirect via form POST |
| Razorpay | INR (USD → INR server-side) | Razorpay checkout |

All payment secrets live in the backend. The frontend never calls payment APIs directly.

After each successful webhook, the backend calls `fulfillment.py → place_smm_order()` which tries the service package's default provider and then its fallbacks in order until one accepts.

### Service Packages + Provider Routing

Orders are fulfilled via admin-configured **service packages**, not hardcoded service IDs. Each package defines:

- A service type + quantity tier
- A default provider + provider service ID
- An ordered list of fallback providers (tried on failure)
- Portal price (what the user pays) vs. provider rate (what we pay)

Pricing seen by users comes from the admin Pricing page — not from provider rates.

### Authentication Flow

1. User registers → backend sends 6-digit OTP via SMTP
2. User verifies OTP → backend returns JWT
3. JWT stored in `AuthContext` and attached to all requests via axios interceptor
4. `401` responses → interceptor clears auth + redirects to `/sign-in`
5. Suspended accounts → any API call returns `403 reason=suspended` → redirected to `/suspended`
6. Admin accounts (`is_admin: true`) access `/admin/*`; staff accounts need explicit permissions

### Admin Panel

Full admin panel at `/admin` with:
- **Users**: list, search, suspend, export CSV
- **Staff**: create staff accounts with role-based permission sets
- **Orders**: full order history, resend/refund/cancel, per-service usage analytics
- **Tasks**: failed-order queue for manual review and retry
- **Payments**: full payment ledger, manual payment recording
- **Services**: service categories, individual services, packages with fallback chains
- **Reports**: revenue, profit, and order trend charts
- **Support**: ticket thread view + contact message inbox
- **Notifications**: broadcast messages to all or selected users
- **Blogs**: create/edit/delete blog posts
- **Settings**: maintenance mode, payment gateway toggles

The first admin must be set directly in MongoDB: `db.users.updateOne({email:"..."}, {$set:{is_admin:true}})`.

### Checkout → Order Flow

1. User selects a package on a service page → stored in Zustand (`useOrderStore`)
2. User fills checkout form and selects payment method
3. Frontend calls `POST /checkout/initiate` → backend creates pending order + payment record, returns redirect URL
4. User completes payment on gateway page
5. Gateway calls `POST /payments/{gateway}/webhook` on the backend
6. Backend verifies signature → resolves service package → tries providers in order → updates order status
7. User lands on `/checkout/check-status/:orderid` and polls for live status

---

## Deployment

- **Frontend** → Vercel (config: `frontend/vercel.json`)
- **Backend** → Render / Railway (set all env vars in dashboard)

Set `VITE_API_BASE_URL` in the frontend to point at the deployed backend URL.
