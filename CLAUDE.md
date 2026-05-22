# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Glow Apex** (branded as **BuyRealViews**) is a YouTube social media growth service platform. Users purchase YouTube Likes, Views, Subscribers, Comments, and Shorts engagement. The architecture is a **separated frontend + backend**:

- **Frontend**: React + TypeScript + Vite (migrated from Next.js)
- **Backend**: Python + FastAPI (handles all API, payment, and SMM panel logic)

---

## Repository Layout

```
glow-apex/
├── frontend/                         # React + TypeScript + Vite
│   ├── public/
│   │   └── assets/                   # Static images, SVGs, icons
│   │       ├── icons/
│   │       ├── illustration/
│   │       └── images/
│   ├── src/
│   │   ├── main.tsx                  # Vite entry point
│   │   ├── App.tsx                   # Root component, router setup
│   │   ├── config.ts                 # All API base URLs + endpoint constants
│   │   ├── pages/                    # Route-level page components
│   │   │   ├── Home/
│   │   │   ├── services/             # YouTube service pages (views, likes, etc.)
│   │   │   ├── checkout/             # Checkout + success/cancel/status pages
│   │   │   ├── dashboard/            # Authenticated user area
│   │   │   ├── blogs/
│   │   │   ├── contact/
│   │   │   └── auth/                 # Sign-in / Sign-up pages
│   │   ├── components/               # Shared UI components
│   │   │   ├── ui/                   # Radix-based UI primitives
│   │   │   ├── cards/
│   │   │   ├── common/               # FAQ, benefits, boost, etc.
│   │   │   ├── payment/              # StripePayment, CryptomusPayment, PayeerPayment
│   │   │   ├── sections/             # Page-specific sections (hero, pricing, etc.)
│   │   │   └── magicui/              # Marquee animation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Global auth state (JWT-based)
│   │   │   └── ServicesContext.tsx   # Fetches + stores services list
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── store/                    # Zustand stores (useAuthStore, etc.)
│   │   ├── lib/                      # Utility helpers (cn, etc.)
│   │   ├── config/
│   │   │   ├── data.ts               # All static content: FAQs, pricing, blog posts
│   │   │   └── menu-items.ts         # Navbar menu config
│   │   └── types/
│   │       ├── index.ts
│   │       └── pricing.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── backend/                          # Python + FastAPI
    └── app/
        ├── main.py                   # Entry point, lifespan, middleware, router registration
        ├── app_components.py         # Router loader
        ├── common/                   # Shared infrastructure (DB, auth, Redis)
        ├── payments/                 # Payment gateway logic
        │   ├── cashfree/             # Cashfree create/verify/webhook
        │   ├── stripe/               # Stripe create/verify/webhook
        │   ├── cryptomus/            # Cryptomus create/verify/webhook
        │   └── payeer/               # Payeer create/verify/webhook
        ├── smm/                      # SMM panel (Postlikes.com) integration
        │   ├── routers/
        │   ├── services/
        │   └── repositories/
        ├── orders/                   # Order management
        ├── user_management/          # Auth (JWT), users
        └── platform_settings/        # Config, limits
```

---

## Development Commands

### Frontend

```bash
# Install dependencies
cd frontend && npm install

# Run dev server (default port 5173)
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Backend

```bash
# Run dev server (from backend/)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Install dependencies
pip install -r backend/requirements.txt

# Start infrastructure (Redis, PostgreSQL, MongoDB if needed)
docker-compose -f backend/docker-compose.dev.yml up
```

---

## Architecture

### Frontend API Layer

- All API base URLs and endpoint constants live in `src/config.ts`. **Never hardcode URLs in components.**
- Use the central `api` axios instance (defined in `src/lib/api.ts`) for all requests. It handles JWT attachment, token refresh (401 → `/auth/refresh`), and global error toasts automatically.
- Auth state lives in `src/context/AuthContext.tsx` (Zustand-backed, JWT-based — not cookie mock).
- Services list is provided globally via `src/context/ServicesContext.tsx`, fetched from the backend on mount.
- Order data passed between pages goes through React state or Zustand — not cookies (cookies were used in the old Next.js monolith; do not reintroduce that pattern).

### Backend API Structure

Every authenticated request carries a JWT. The backend validates it via middleware in `main.py`. Use FastAPI dependencies defined in each module's `dependencies.py` to inject services into routers.

**Adding a new backend module:**

1. Create the module directory under `app/` with `routers/`, `services/`, `repositories/`, `models/`.
2. Import the router in `app_components.py` and register it in `include_routers()`.
3. Initialise any service container or index setup in `main.py`'s `lifespan`.

### Payment Gateway Integrations

All payment logic lives exclusively in the backend. The frontend never holds secrets or calls payment gateway APIs directly — it only calls backend endpoints.

| Gateway | Backend Module | Input Currency | Method |
|---------|---------------|----------------|--------|
| Cashfree | `app/payments/cashfree/` | INR (converted from USD) | Redirect to Cashfree SDK |
| Stripe | `app/payments/stripe/` | USD | Redirect to Stripe Checkout |
| Cryptomus | `app/payments/cryptomus/` | USD | Redirect to Cryptomus page |
| Payeer | `app/payments/payeer/` | USD | Redirect via form POST |

**Important:** After payment confirmation (webhook), the backend must call the SMM panel (`/smm/add-order`) to place the actual order. Webhook handlers are the source of truth for triggering order placement — the frontend must not trigger this.

### SMM Panel (Postlikes.com)

- Service list is fetched by the backend at `GET /smm/services` and proxied to the frontend.
- Orders are placed by the backend at `POST /smm/add-order` after webhook confirmation.
- Filtered service IDs: `5209` (Views), `2342` (Likes), `5648` (Shorts), `376` (Subscribers).

### CORS

The backend must explicitly allow requests from the frontend origin. Configure this in `main.py` via `CORSMiddleware`. Never allow `*` in production.

### Image Serving

Product images are stored in MinIO (`product-images` bucket). The backend proxies them. The frontend references them via `API_PRODUCT_IMAGE_URL` from `src/config.ts`.

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

- All payment gateway secrets (`STRIPE_SECRET_KEY`, `CASHFREE_CLIENT_SECRET`, etc.) must be loaded from environment variables only — never hardcoded, never committed.
- Each payment module must implement three endpoints: `create`, `verify`, and `webhook`.
- Webhook handlers are responsible for calling `smm/add-order` after successful payment verification. This must not be skipped or deferred.
- Webhook signatures must be verified before any order logic is executed.
- Currency conversion (USD → INR for Cashfree) must be done in the backend, not the frontend.

### Assumptions

- If any model field, schema shape, or data flow is unclear, ask before writing code that assumes a structure.
- Do not guess at field names, collection names, or query shapes. Verify from existing code or ask.

---

## 6. Frontend / React Rules

- **Stack**: React 19 + Vite + TypeScript + **Tailwind CSS v4** + **Radix UI** primitives. There is no Next.js in this project — do not introduce Next.js-specific APIs (`useRouter` from `next/router`, `Link` from `next/link`, server components, route handlers, etc.).
- **Routing**: Use React Router v7 (`react-router-dom`). All routes are defined in `src/App.tsx`.
- **No cookie-based state**. The old Next.js monolith passed order data via cookies (`form_data`, `currency`). In this architecture, use React state, Zustand stores, or URL search params instead.
- All API calls go through the central `api` axios instance in `src/lib/api.ts`. Never use raw `fetch` or create a second axios instance.
- All API endpoint strings are defined in `src/config.ts`. Never hardcode URLs or paths in components or hooks.

### Component rules

- Components must be functions. No class components.
- One component per file. File name matches the exported component name.
- Props must be typed with a TypeScript interface defined at the top of the file.
- No inline styles except for dynamic values (e.g. computed widths). Use Tailwind classes for everything else.
- Do not reach into a child component's state from a parent — lift state up or use a shared store.

### State management

- **Global auth** → `src/context/AuthContext.tsx` (Zustand-backed, JWT in memory or `httpOnly` cookie set by backend).
- **Global services list** → `src/context/ServicesContext.tsx` (fetched from backend on app mount).
- **Page-level state** → `useState` / `useReducer` inside the page component.
- **Cross-page order data** → Zustand store (`src/store/useOrderStore.ts`). Do not use cookies or localStorage for this.

### Static content

All marketing copy, FAQs, pricing tiers, blog posts, and service packages live in `src/config/data.ts`. This is the single source of truth for static content. Do not duplicate content across components.

### Code quality mandates

- No `any` type. If the shape is unknown, define a proper interface or use `unknown` with a type guard.
- No unused imports or variables. Run lint before considering a task complete.
- Extract repeated JSX patterns into a shared component after the second occurrence.
- All async operations inside components must handle loading and error states explicitly.

---

## 7. Environment Variables

### Backend (`backend/.env`)

```env
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

# SMM Panel
POSTLIKES_API_KEY=

# App
BACKEND_BASE_URL=https://api.buyrealviews.com
FRONTEND_ORIGIN=https://buyrealviews.com

# Infrastructure
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=https://api.buyrealviews.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Rules:**
- Backend secrets never appear in frontend env files.
- Frontend env vars are prefixed with `VITE_` and are safe to be public (no secrets).
- `VITE_API_BASE_URL` is the only base URL the frontend needs — all endpoint paths are derived from it via `src/config.ts`.

---

## 8. Key Data Flows

### Service discovery

```
App mounts → ServicesContext calls GET /smm/services (backend)
  → Backend calls Postlikes.com API
  → Returns filtered list (IDs: 5209, 2342, 5648, 376)
  → Stored in ServicesContext
  → ServiceSelectionComponent renders packages
```

### Checkout → Payment → Order placement

```
User selects package + enters YouTube URL
  → Stored in useOrderStore (Zustand)
  → User navigates to /checkout

/checkout page loads
  → Reads order from useOrderStore
  → User fills in name, email, phone
  → Selects payment method

On submit:
  → Frontend calls POST /payments/{gateway}/create with order details
  → Backend creates payment session, returns redirect URL
  → Frontend redirects user to payment gateway

User completes payment
  → Gateway calls POST /payments/{gateway}/webhook (backend only)
  → Backend verifies webhook signature
  → Backend calls POST /smm/add-order to place SMM order
  → Backend stores order record in DB

User lands on /checkout/success or /checkout/check-status
  → Frontend calls GET /payments/{gateway}/verify?session_id=...
  → Displays result
```

### Authentication

```
User submits sign-in form
  → Frontend calls POST /auth/login
  → Backend validates credentials, returns JWT
  → AuthContext stores JWT (httpOnly cookie set by backend, or in memory)
  → User redirected to dashboard

Protected routes check AuthContext.isAuthenticated
  → If false, redirect to /sign-in
```

---

## 9. Known Issues / Technical Debt

These are pre-existing issues from the Next.js monolith. Fix them when the relevant code is touched — do not introduce them into the new architecture.

- **Webhook handlers do not call `/smm/add-order`**: All four payment webhooks are stubs. SMM order placement after payment confirmation is the highest-priority missing piece.
- **Authentication is mock**: The old auth used simulated delays and fake tokens. The new backend must implement real JWT auth with password hashing (bcrypt) and no mock paths in production.
- **Cashfree currency conversion is frontend-only**: USD → INR conversion used a hardcoded rate (83.12) in the old checkout page. This must be done server-side in the new backend.
- **`/api/add-order` bug**: The old Next.js route sent `serviceId` as both `service` and `link` to the Postlikes API. Verify and fix this in the new SMM service layer.
- **Dashboard uses mock data**: Orders, payments, and analytics pages show hardcoded static data. These need real DB queries once the order storage layer is implemented.
- **Stripe currency mismatch**: The old Stripe session creation hardcoded INR despite the user selecting USD. The new backend must respect the currency passed in the create-order request.

---

## 10. What Not to Do

- Do not re-introduce Next.js, server components, or route handlers anywhere in the frontend.
- Do not pass payment secrets to the frontend under any circumstances.
- Do not use cookies to pass order data between pages — use Zustand.
- Do not hardcode exchange rates in the frontend — currency conversion belongs in the backend.
- Do not call Postlikes.com directly from the frontend — always go through the backend.
- Do not call payment gateway APIs directly from the frontend — always go through the backend.
- Do not mix the two backend module patterns within a single module.
- Do not create a new axios instance in a component — use the shared `api` instance from `src/lib/api.ts`.