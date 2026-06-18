# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This repository hosts **two products** sharing one codebase:

1. **BuyRealViews** (`frontend/src/pages/`) — YouTube social media growth service platform. Users purchase YouTube Likes, Views, Subscribers, Comments, and Shorts engagement via a checkout → payment → SMM fulfillment flow.

2. **Glow Apex** (`frontend/src/glowapex/`) — PR & communications agency landing site with marketing pages and a pricing calculator.

Both products share the same backend (Python + FastAPI) and the same admin panel.

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Python + FastAPI (all API, payment, SMM, admin, and notification logic)

---

## Repository Layout

```
glow-apex/
├── frontend/
│   ├── public/assets/              # Static images, SVGs, icons
│   └── src/
│       ├── App.tsx                 # Root component, all route definitions
│       ├── config.ts               # All API base URLs + endpoint constants
│       ├── main.tsx                # Vite entry point
│       │
│       ├── pages/                  # BuyRealViews route-level pages
│       │   ├── Home/               # BuyRealViews home page
│       │   ├── services/           # YouTube service pages (views, likes, etc.)
│       │   ├── checkout/           # Checkout + success/cancel/status pages
│       │   ├── dashboard/          # Authenticated user area
│       │   │   ├── orders/         # Order list + status modal
│       │   │   ├── payments/       # Payment history
│       │   │   ├── tickets/        # Support tickets (list + thread)
│       │   │   ├── notifications/  # Admin-to-user notifications
│       │   │   └── profile/        # Account settings + password change
│       │   ├── admin/              # Admin panel (protected, is_admin required)
│       │   │   ├── users/          # User management + export
│       │   │   ├── staff/          # Staff management + role/permission editor
│       │   │   ├── orders/         # All orders + resend/refund/cancel
│       │   │   ├── payments/       # All payments
│       │   │   ├── tasks/          # Failed-order tasks + manual tasks
│       │   │   ├── services/       # Service packages + provider fallback chains
│       │   │   ├── service-stats/  # Per-service usage analytics
│       │   │   ├── reports/        # Revenue / profit / order reports
│       │   │   ├── support/        # Tickets + contact messages
│       │   │   ├── notifications/  # Broadcast notifications to users
│       │   │   ├── blogs/          # Blog post management
│       │   │   └── settings/       # Platform settings (maintenance, payments, etc.)
│       │   ├── blogs/              # Public blog pages
│       │   ├── contact/            # Contact form
│       │   └── auth/               # Sign-in / Sign-up / OTP verify
│       │
│       ├── glowapex/               # Glow Apex PR agency frontend
│       │   ├── pages/
│       │   │   ├── Home/           # Landing page with pricing calculator
│       │   │   └── Checkout/       # Glow Apex checkout
│       │   ├── components/         # Glow Apex–specific components
│       │   └── lib/
│       │
│       ├── components/             # Shared UI components (BuyRealViews)
│       │   ├── ui/                 # Radix-based primitives
│       │   ├── admin/              # AdminGuard, RequirePermission
│       │   ├── common/             # FAQ, RaiseTicketModal, AdminFAB, etc.
│       │   ├── payment/            # StripePayment, CryptomusPayment, etc.
│       │   └── sections/hero/      # Per-service hero sections + DynamicPackageSelector
│       │
│       ├── context/
│       │   ├── AuthContext.tsx     # Global auth state (JWT, is_admin, permissions)
│       │   ├── ServicesContext.tsx # Public services list from backend
│       │   ├── PricingContext.tsx  # Dynamic pricing (value/bulk packages)
│       │   └── CurrencyContext.tsx # Currency selector
│       ├── store/
│       │   └── useOrderStore.ts    # Zustand: cross-page order data (persisted to sessionStorage)
│       ├── hooks/
│       ├── lib/
│       │   └── api.ts              # Axios instance — JWT attach, 401 refresh, suspension guard
│       ├── config/
│       │   ├── data.ts             # Static content: FAQs, service descriptions, blog posts
│       │   └── menu-items.ts       # Navbar menu config
│       └── types/
│           └── index.ts            # Shared TypeScript interfaces
│
└── backend/
    └── app/
        ├── main.py                 # FastAPI entry point, lifespan, CORS, index setup
        ├── app_components.py       # Router registration (include_routers)
        ├── common/                 # config.py (pydantic-settings), crypto.py (AES-GCM)
        │
        ├── user_management/        # Auth + profile
        │   ├── routers/            # auth_router (register/login/OTP), profile_router
        │   ├── services/           # auth_service, profile_service
        │   ├── repositories/       # user_repository, sign_in_log_repository
        │   ├── schemas/            # UserPublic, ProfileResponse, auth schemas
        │   └── utils/              # JWT helpers, OTP, bcrypt, permissions, dependencies
        │
        ├── checkout/               # Checkout session creation + payment initiation
        │   └── router.py           # POST /checkout/initiate — creates pending order + payment record
        │
        ├── orders/                 # User-facing order endpoints
        │   ├── router.py           # GET/POST /orders, refill, cancel
        │   ├── repository.py       # OrderRepository (includes aggregate_service_stats)
        │   ├── fulfillment.py      # place_smm_order() — provider fallback chain logic
        │   └── pricing_utils.py    # Shared charge calculation (admin pricing → user charge)
        │
        ├── payments/               # Payment gateway integrations
        │   ├── cashfree/           # INR — create / verify / webhook
        │   ├── stripe/             # USD — create / verify / webhook
        │   ├── cryptomus/          # Crypto — create / verify / webhook
        │   ├── payeer/             # USD — create / verify / webhook
        │   ├── razorpay/           # INR — create / verify / webhook
        │   ├── ledger_repository.py # payments collection CRUD
        │   └── user_router.py      # GET /payments (user payment history)
        │
        ├── notifications/          # Admin-to-user broadcast notifications
        │   ├── router.py           # admin_router + user_router
        │   └── repository.py       # MongoDB notifications collection
        │
        ├── tickets/                # User support tickets
        │   ├── router.py           # GET/POST /tickets, reply, thread view
        │   └── repository.py
        │
        ├── contact/                # Public contact form
        │   ├── router.py           # POST /contact/send (rate-limited via Redis)
        │   └── repository.py       # contact_messages collection
        │
        ├── blog/                   # Blog posts
        │   └── router.py           # public_router (GET /blogs)
        │
        ├── smm/                    # Legacy Postlikes.com proxy (services list)
        │
        ├── public_services/        # GET /services (public, no auth)
        ├── public_pricing/         # GET /pricing (public, no auth)
        ├── public_settings/        # GET /settings (public — maintenance mode check)
        │
        └── admin/                  # Admin-only modules (require is_admin or permission)
            ├── router.py           # Master admin router, includes all sub-routers
            ├── users/              # User list, stats, export, suspend
            ├── orders/             # All orders, resend, refund, cancel, service-stats
            ├── payments/           # All payments, manual payment, delete
            ├── providers/          # SMM provider CRUD + live balance/services fetch
            ├── services/           # Admin service categories + individual services
            ├── service_packages/   # Service packages with provider fallback chains
            ├── pricing/            # Dynamic portal pricing per service type
            ├── provider_config/    # Legacy routing configs (kept for reference)
            ├── reports/            # Aggregated revenue/order/ticket reports
            ├── tasks/              # Failed-order and manual task management
            ├── support/            # Admin side of tickets + contact messages
            ├── notifications/      # Send/delete broadcast notifications
            ├── settings/           # Platform settings upsert
            └── staff/              # Staff user management (roles + permissions)
```

---

## Development Commands

### Frontend

```bash
cd frontend && npm install
npm run dev          # dev server on http://localhost:5173
npm run build        # production build
npm run lint         # ESLint
```

### Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start infrastructure (MongoDB + Redis via Docker)
docker-compose -f backend/docker-compose.dev.yml up -d

# Run API server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Architecture

### Frontend API Layer

- All endpoint constants live in `src/config.ts`. **Never hardcode URLs in components.**
- Use the central `api` axios instance (`src/lib/api.ts`) for all requests. It attaches JWTs, handles 401 refresh, and redirects suspended users to `/suspended`.
- Auth state lives in `src/context/AuthContext.tsx` — exposes `user`, `isLoading`, `hasPermission()`, `login()`, `logout()`, `updateProfile()`.
- `PricingContext.tsx` fetches `GET /pricing` on mount and exposes `getPricing(serviceType)` and `calcPackagePrice()`.
- Order data between pages travels via Zustand (`src/store/useOrderStore.ts`) persisted to `sessionStorage` — never cookies.

### Backend API Structure

Authenticated requests carry a JWT validated by `get_current_user` (dependency in `user_management/utils/dependencies.py`). Admin endpoints use `get_current_admin` or `require_permission(PERM_*)`.

**Adding a new backend module:**

1. Create the module directory under `app/` with `router.py`, `repository.py`, `schemas.py`.
2. Import and register the router in `app_components.py → include_routers()`.
3. If the module needs a MongoDB index, add a `create_index()` call in `main.py`'s `lifespan`.

### Payment Gateway Integrations

All payment secrets live exclusively in the backend. The frontend never calls gateway APIs directly.

| Gateway | Backend Module | Currency | Method |
|---------|---------------|----------|--------|
| Cashfree | `app/payments/cashfree/` | INR (USD → INR server-side) | Redirect to Cashfree SDK |
| Stripe | `app/payments/stripe/` | USD | Redirect to Stripe Checkout |
| Cryptomus | `app/payments/cryptomus/` | USD | Redirect to Cryptomus page |
| Payeer | `app/payments/payeer/` | USD | Redirect via form POST |
| Razorpay | `app/payments/razorpay/` | INR (USD → INR server-side) | Razorpay checkout |

After a successful webhook, the backend calls `fulfillment.py → place_smm_order()` which tries the service package's default provider and then its ordered fallbacks until one accepts.

### Service Packages + Provider Routing

Orders are fulfilled via **service packages** (`admin/service_packages/`), not hardcoded service IDs. Each package defines:

- A quantity tier (e.g. 5,000 Views)
- A default provider + service ID
- An ordered list of fallback providers (tried in sequence if the default fails)
- Portal pricing (what the user pays) separate from provider rate (what we pay)

`fulfillment.py → _resolve_candidates_from_package()` builds the candidate list; `place_smm_order()` iterates it until one succeeds. Failed orders create a `failed_order` task for admin review.

### Admin Panel Permissions

Staff accounts have a `role` field and an `extra_permissions` list. `require_permission(PERM_*)` checks both. Permission constants are in `user_management/utils/permissions.py`. Admin (`is_admin: true`) bypasses all permission checks. There is no seed script — the first admin must be set directly in MongoDB (`is_admin: true`).

### Provider API Key Encryption

Provider API keys are stored AES-256-GCM encrypted in MongoDB. `common/crypto.py` handles encrypt/decrypt. The key is loaded from `API_KEY_ENCRYPTION_SECRET` (64 hex chars = 32 bytes). The repository layer transparently encrypts on write and decrypts on read.

### Email Delivery

OTP emails and contact form confirmations are sent via **SMTP** (`aiosmtplib`). Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `backend/.env`. Gmail requires an app password (not the account password) when 2FA is enabled.

### Datetime / Timezone

Python's `datetime.isoformat()` produces strings without a `Z` suffix (e.g. `"2026-06-04T10:00:00"`). Browsers parse these as local time. **Always append `Z`** in backend serializers or use the `toUtc()` frontend helper (which appends `Z` when no timezone indicator is present) before passing to `new Date()`. All date displays should use IST (`timeZone: 'Asia/Kolkata'`).

### CORS

Configured in `main.py` via `CORSMiddleware`. `FRONTEND_ORIGIN` env var controls the allowed origin. Never use `*` in production.

---

## 1. Core Workflow (Non-Negotiable)

- **Never write code on the first response. No exceptions.**
- On any task — bug fix, feature, refactor, UI change — always do the following first:
  1. State what you understand the problem or requirement to be.
  2. Identify every file that will be read, changed, or deleted.
  3. Explain the approach and why.
  4. Flag trade-offs or risks.
  5. Ask for explicit approval.
- Only after approval: write code.
- If the user's assumption is suboptimal or incorrect, push back clearly with reasoning and an alternative before proceeding.

---

## 2. Change Tracking

- On every session start, read `.claude/CHANGES.md` before reading any source file.
- Use the changelog as the primary source of truth for what has changed and why.
- Only read source files if the changelog does not answer the question.
- After every significant change — new file, logic change, refactor, new component, bug fix — append an entry to `.claude/CHANGES.md`.

### Entry format

```
[YYYY-MM-DD HH:MM] | <type> | <file(s)> | <summary>
```

### Types

- `add` — new file or component created
- `modify` — existing logic or UI changed
- `fix` — bug or regression fixed
- `delete` — file or block removed
- `refactor` — restructured without behavior change
- `discovery` — something found during investigation that is not yet fixed

### Rules

- Log only significant changes. Skip trivial formatting or whitespace-only edits.
- Keep summaries concise but meaningful — enough to understand the change without reading code.
- Never delete or rewrite past entries.
- On request, generate a formatted summary report from `.claude/CHANGES.md`.
- When a fix required significant investigation or multiple attempts, document the root cause and resolution approach so repeated issues can be resolved faster in future sessions.

---

## 3. Bug Fixing Protocol

Fixing the reported location is not enough. Follow this protocol on every bug fix:

### Step 1: Root cause analysis

Before touching any code, answer these in writing:
- What is the exact root cause, not just the symptom?
- Where does this pattern originate (model, service, repository, utility)?
- Is this a logic error, a data assumption, a missing guard, or an integration issue?

### Step 2: Codebase-wide pattern scan

Search the entire codebase for every location that contains the same faulty pattern. Explicitly list all occurrences found. If the same bug exists in 4 places, fix all 4. Never fix one and leave the others.

### Step 3: Fix with full context

- Fix every occurrence found in Step 2.
- Do not introduce new utility functions without checking if one already exists.
- Do not duplicate fix logic across files — extract to a shared utility if it is used in more than one place.

### Step 4: Dead code removal

After every fix or change, actively look for and remove:
- Unused imports in every file touched.
- Variables declared but never used.
- Functions or methods that are now unreachable or superseded.
- Commented-out code blocks that are no longer relevant.
- Duplicate logic made redundant by the fix.

### Step 5: Self-verification

Before presenting the fix:
- Trace through the corrected logic manually with a concrete example (write the trace out).
- Identify at least two edge cases and confirm the fix handles them.
- State explicitly what could still break and why it is acceptable risk or out of scope.

### Step 6: Document

Log a `fix` entry and a `discovery` entry in `.claude/CHANGES.md` covering the root cause, pattern scan findings, and all files changed.

---

## 4. Feature Implementation Protocol

When implementing any new feature or making changes to existing logic, follow this sequence without exception:

### Step 1: Impact mapping

Before writing anything, map out every layer the feature touches:
- **Backend**: router, service, repository, model, schema, dependency, utility
- **Frontend**: page, component, hook, API constant in `src/config.ts`, store/context
- **Infrastructure**: any new index, migration, environment variable, or CORS update

Document this map explicitly. If any layer is unclear, ask before proceeding.

### Step 2: Existing code audit

Read the relevant existing code before writing anything new:
- Identify patterns already in use (naming, structure, error handling, validation).
- Check if any utility, helper, or base class already handles part of the requirement.
- If something exists that can be reused or extended, do that instead of writing from scratch.

### Step 3: Implementation completeness

When you write the feature, implement every layer identified in Step 1. A feature is not done if:
- The backend router exists but the service method is missing.
- The service exists but the repository query is not written.
- The backend endpoint exists but `src/config.ts` has no corresponding constant.
- The API is done but the frontend page has no wiring.
- A new payment route exists but the webhook handler does not trigger order placement.

Partial implementation is not acceptable. If scope must be limited, state explicitly what is deferred and why.

### Step 4: Dead code and leftover cleanup

After implementation:
- Remove any scaffolding, placeholder comments, or TODO stubs that are not actionable.
- Remove any code replaced or made redundant by the new feature.
- Remove unused imports from every file touched.

### Step 5: Logical soundness check

Before presenting code, write out in plain English:
- The happy path: what happens step by step when everything works.
- At least two failure paths: what happens when input is invalid, a dependency fails, or data is missing.
- Confirm the implementation handles all three paths correctly.

### Step 6: Document

Log an `add` or `modify` entry in `.claude/CHANGES.md` covering every file created or changed, with a summary meaningful enough to reconstruct intent without reading the code.

---

## 5. Python / Backend Rules

- Act as a senior Python developer at all times.
- Write clean, idiomatic, efficient Python following SOLID and DRY principles.
- Prioritize readability and maintainability over cleverness.
- No emojis in logs, print statements, comments, or code.
- Keep all existing variable, function, and class names unchanged unless renaming is the explicit task.
- Do not append suffixes like `_enhanced`, `_new`, `_v2` to any names.
- Always explain existing behavior before proposing any modification.

### Code quality mandates

- Every function does one thing. If a function is doing two things, split it.
- If a block of logic appears more than once, extract it to a shared utility. Never copy-paste logic.
- All error paths must be explicit. Never silently swallow exceptions.
- Type hints are required on all function signatures.
- Docstrings are required on all non-trivial functions — one line for simple, multi-line for anything with business logic.
- No bare `except:` clauses. Always catch specific exceptions.
- No mutable default arguments.
- No implicit returns from functions that are expected to return a value.

### Payment-specific rules

- All payment gateway secrets must be loaded from environment variables only — never hardcoded, never committed.
- Each payment module must implement three endpoints: `create`, `verify`, and `webhook`.
- Webhook handlers are responsible for calling `fulfillment.py → place_smm_order()` after successful payment verification.
- Webhook signatures must be verified before any order logic is executed.
- Currency conversion (USD → INR for Cashfree and Razorpay) must be done in the backend.
- User charge is calculated from `admin/pricing/` records (portal price), not from provider rate. Use `pricing_utils.py → _calc_pricing_charge()`.

### Assumptions

- If any model field, schema shape, or data flow is unclear, ask before writing code that assumes a structure.
- Do not guess at field names, collection names, or query shapes. Verify from existing code or ask.

---

## 6. Frontend / React Rules

- **Stack**: React 19 + Vite + TypeScript + **Tailwind CSS v4** + **Radix UI** primitives. There is no Next.js in this project.
- **Routing**: React Router v7 (`react-router-dom`). All routes defined in `src/App.tsx`.
- **No cookie-based state**. Use React state, Zustand stores, or URL search params.
- All API calls go through the central `api` axios instance in `src/lib/api.ts`.
- All API endpoint strings are defined in `src/config.ts`. Never hardcode URLs.

### Component rules

- Components must be functions. No class components.
- One component per file. File name matches the exported component name.
- Props must be typed with a TypeScript interface defined at the top of the file.
- No inline styles except for dynamic values. Use Tailwind classes for everything else.

### State management

- **Global auth** → `src/context/AuthContext.tsx`
- **Global services list** → `src/context/ServicesContext.tsx`
- **Dynamic pricing** → `src/context/PricingContext.tsx`
- **Page-level state** → `useState` / `useReducer`
- **Cross-page order data** → `src/store/useOrderStore.ts` (Zustand, sessionStorage-persisted)

### Static content

All marketing copy, FAQs, service descriptions, and blog posts live in `src/config/data.ts`.

### Code quality mandates

- No `any` type. Use a proper interface or `unknown` with a type guard.
- No unused imports or variables.
- Extract repeated JSX patterns into a shared component after the second occurrence.
- All async operations inside components must handle loading and error states explicitly.

---

## 7. Environment Variables

### Backend (`backend/.env`)

```env
# App
BACKEND_BASE_URL=https://api.buyrealviews.com
FRONTEND_ORIGIN=https://buyrealviews.com

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

# Provider key encryption (64 hex chars = 32 bytes)
API_KEY_ENCRYPTION_SECRET=

# SMM Panel (legacy)
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

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=https://api.buyrealviews.com
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_RAZORPAY_KEY_ID=
```

**Rules:**
- Backend secrets never appear in frontend env files.
- Frontend env vars are prefixed with `VITE_`.
- `VITE_API_BASE_URL` is the only base URL the frontend needs.

---

## 8. Key Data Flows

### Checkout → Payment → Order Fulfillment

```
User selects package on service page
  → DynamicPackageSelector stores {categoryName, quantity} in useOrderStore
  → Navigates to /checkout

/checkout reads useOrderStore
  → Resolves matching ServicePackage (quantity + service_type)
  → Calculates charge via PricingContext (portal price, not provider rate)
  → User selects payment method, submits

Frontend calls POST /checkout/initiate
  → Backend creates pending order doc + payment ledger record
  → Initiates payment session with chosen gateway
  → Returns redirect URL

User completes payment on gateway
  → Gateway calls POST /payments/{gateway}/webhook
  → Backend verifies webhook signature
  → Calls fulfillment.py → place_smm_order()
    → Loads ServicePackage for the order
    → Tries default provider → fallback #1 → fallback #2 … until one accepts
    → Updates order with provider_id + provider_order_id + status
    → If all fail: sets status=provider_error, creates high-priority Task

User lands on /checkout/check-status
  → Polls GET /orders/{id} for live status
```

### Authentication

```
Register → POST /auth/register → OTP sent via Resend
OTP verify → POST /auth/verify-otp → JWT returned
Login → POST /auth/login → JWT returned (403 if unverified → re-sends OTP)
JWT stored in AuthContext (localStorage)
All requests attach Authorization: Bearer <token>
401 → api.ts interceptor → clear auth → redirect /sign-in
Suspended → any request → 403 with reason=suspended → redirect /suspended
```

### Admin Notifications

```
Admin creates notification (target: all / selective / personal)
  → Stored in MongoDB notifications collection
User opens /dashboard/notifications
  → GET /notifications returns all matching (target=all OR user_id in user_ids)
  → is_read = user_id in read_by array
User clicks notification → POST /notifications/{id}/read → user_id added to read_by
```

---

## 9. Known Issues / Active Debt

- **Glow Apex checkout** (`frontend/src/glowapex/pages/Checkout/`) is not yet wired to the backend payment flow.
- **SMM module** (`app/smm/`) is a legacy Postlikes.com proxy used only for the old service list endpoint. New orders go through `app/admin/service_packages/` + `fulfillment.py`. The smm module can be removed once no frontend references remain.
- **Admin seeding removed**: There is no bootstrap script. The first admin account must be promoted directly in MongoDB: `db.users.updateOne({email:"..."}, {$set:{is_admin:true}})`.

---

## 10. What Not to Do

- Do not re-introduce Next.js, server components, or route handlers anywhere in the frontend.
- Do not pass payment secrets to the frontend under any circumstances.
- Do not use cookies to pass order data between pages — use Zustand.
- Do not hardcode exchange rates in the frontend — currency conversion belongs in the backend.
- Do not call SMM provider APIs directly from the frontend — always go through the backend.
- Do not call payment gateway APIs directly from the frontend.
- Do not create a new axios instance in a component — use `src/lib/api.ts`.
- Do not use `new Date(isoString)` without first passing through `toUtc()` — Python datetimes have no Z suffix and will be misread as local time.
- Do not charge users the provider rate — always use the admin pricing page rate via `pricing_utils.py`.
- Do not add new admin routes without adding the corresponding `RequirePermission` guard in `App.tsx`.
