# Cross-Domain Checkout Redirect — Implementation Plan

## Overview

When a user on **BuyRealViews (D1)** selects a package and proceeds to checkout,
they are redirected to **Glow Apex (D2)** for payment. After successful payment,
they are sent back to the BuyRealViews dashboard.

D1 backend handles all payment logic, webhooks, and SMM order placement.
D2 is purely a frontend payment portal — it calls D1's API and never holds secrets.

---

## Domain / Port Map

| | Development | Production |
|---|---|---|
| D1 Frontend | `http://IP/` | `https://buyrealviews.com` |
| D1 Backend | `http://IP/api/` | `https://buyrealviews.com/api/` |
| D2 Frontend | `http://IP:3001/` | `https://glowapex.com` |

---

## Full Flow

```
1. User on D1 selects package, fills in name/email, picks payment method
2. D1 frontend  →  POST /api/checkout/init  (order details)
3. D1 backend   →  stores order in Redis (TTL 15 min), returns signed token
4. D1 frontend  →  redirects to  http://IP:3001/checkout?token=<token>
5. D2 frontend  →  GET /api/checkout/session/<token>  (calls D1 backend)
6. D1 backend   →  validates token, returns order details
7. D2 frontend  →  renders payment UI (Stripe / Crypto / etc.)
8. User pays    →  D2 calls  POST /api/payments/{gateway}/create
9. D1 backend   →  creates payment session, returns redirect URL
10. User lands on gateway page, completes payment
11. Gateway webhook  →  POST /api/payments/{gateway}/webhook  (D1 backend only)
12. D1 backend  →  verifies signature, places SMM order, stores record
13. D2 frontend →  payment success page  →  redirect to buyrealviews.com/dashboard
```

---

## Phase 1 — D1 Backend: Checkout Session Endpoints

### Files to create / modify

| Action | File |
|---|---|
| Create | `backend/app/checkout/router.py` |
| Create | `backend/app/checkout/schemas.py` |
| Modify | `backend/app/app_components.py` |
| Modify | `backend/app/main.py` (CORS) |

### 1.1 `backend/app/checkout/schemas.py`

```python
from pydantic import BaseModel, EmailStr

class CheckoutInitRequest(BaseModel):
    service_id: str
    quantity: int
    link: str          # YouTube URL
    name: str
    email: EmailStr
    phone: str
    payment_method: str   # "stripe" | "cryptomus" | "payeer" | "cashfree"
    amount_usd: float

class CheckoutSessionResponse(BaseModel):
    token: str
    expires_in: int       # seconds
```

### 1.2 `backend/app/checkout/router.py`

Two endpoints:

**`POST /checkout/init`**
- Accepts `CheckoutInitRequest`
- Generates a `secrets.token_urlsafe(32)` token
- Stores `json.dumps(order_dict)` in Redis at key `checkout:session:{token}` with TTL 900 (15 min)
- Returns `{ token, expires_in: 900 }`

**`GET /checkout/session/{token}`**
- Looks up `checkout:session:{token}` in Redis
- If missing or expired → 404
- Returns the stored order dict
- Does NOT delete the key (D2 may call it multiple times on page refresh)

### 1.3 `backend/app/app_components.py`

Register the new router:

```python
from app.checkout.router import router as checkout_router

def include_routers(app):
    ...
    app.include_router(checkout_router, prefix="/checkout", tags=["checkout"])
```

### 1.4 CORS update in `backend/app/main.py`

Add D2 origins to `allow_origins`:

```python
allow_origins=[
    settings.FRONTEND_ORIGIN,        # buyrealviews.com
    settings.GLOWAPEX_ORIGIN,        # glowapex.com  (new env var)
]
```

Add to `backend/.env` and `backend/.env.example`:

```env
GLOWAPEX_ORIGIN=http://YOUR_SERVER_IP:3001
```

---

## Phase 2 — D1 Frontend: Redirect on Checkout Submit

### Files to modify

| Action | File |
|---|---|
| Modify | `frontend/src/config.ts` |
| Modify | `frontend/src/pages/checkout/index.tsx` (or equivalent checkout page) |

### 2.1 `frontend/src/config.ts`

Add two constants:

```ts
export const CHECKOUT_INIT_URL = `${API_BASE}/checkout/init`
export const GLOWAPEX_CHECKOUT_URL = import.meta.env.VITE_GLOWAPEX_URL + '/checkout'
```

Add to `frontend/.env.production` and `frontend/.env.production.example`:

```env
VITE_GLOWAPEX_URL=http://YOUR_SERVER_IP:3001
```

### 2.2 Checkout page `onSubmit` change

Replace the current direct payment call with:

```ts
// 1. Call checkout/init to get a token
const { data } = await api.post(CHECKOUT_INIT_URL, {
  service_id, quantity, link, name, email, phone, payment_method, amount_usd
})

// 2. Redirect to D2
window.location.href = `${GLOWAPEX_CHECKOUT_URL}?token=${data.token}`
```

---

## Phase 3 — D2 Frontend: Checkout Page

### Files to create / modify

| Action | File |
|---|---|
| Create | `glowapex/src/pages/Checkout/index.tsx` |
| Create | `glowapex/src/pages/CheckoutSuccess.tsx` |
| Modify | `glowapex/src/App.tsx` (add routes) |
| Create | `glowapex/src/lib/api.ts` (axios instance pointing to D1 backend) |
| Create | `glowapex/.env.example` |

### 3.1 `glowapex/.env.example`

```env
VITE_API_BASE_URL=http://YOUR_SERVER_IP/api
VITE_D1_URL=http://YOUR_SERVER_IP
```

### 3.2 `glowapex/src/lib/api.ts`

Single axios instance that points at D1's backend:

```ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

export default api
```

### 3.3 `glowapex/src/pages/Checkout/index.tsx`

Page logic:
1. Read `?token` from `useSearchParams`
2. On mount: `GET /checkout/session/{token}` → get order details
3. Render order summary (service, quantity, amount, payment method)
4. On "Pay Now": call `POST /payments/{payment_method}/create` with order details
5. Redirect user to the gateway URL returned
6. Handle loading / error / expired token states

### 3.4 `glowapex/src/pages/CheckoutSuccess.tsx`

- Shown after gateway redirects back to D2 with success params
- Calls `GET /payments/{gateway}/verify?session_id=...` to confirm
- On confirmed: shows success message + "Go to Dashboard" button
- "Go to Dashboard" links to `VITE_D1_URL/dashboard`

### 3.5 `glowapex/src/App.tsx` — new routes

```tsx
<Route path="/checkout" element={<Checkout />} />
<Route path="/checkout/success" element={<CheckoutSuccess />} />
<Route path="/checkout/cancel" element={<CheckoutCancel />} />
```

---

## Phase 4 — D1 Backend: Gateway Return URL Update

Each payment gateway `create` endpoint currently returns a success redirect URL pointing back to D1. These need to point to D2 instead.

### Files to modify

| File | Change |
|---|---|
| `backend/app/payments/stripe/service.py` | `success_url` → `{GLOWAPEX_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}` |
| `backend/app/payments/cryptomus/service.py` | Return URL → D2 success page |
| `backend/app/payments/cashfree/service.py` | Return URL → D2 success page |
| `backend/app/payments/payeer/service.py` | Return URL → D2 success page |

Add to `backend/.env`:

```env
GLOWAPEX_ORIGIN=http://YOUR_SERVER_IP:3001
```

The return URL pattern for all gateways:

```
Success: {GLOWAPEX_ORIGIN}/checkout/success?gateway={name}&session_id={id}
Cancel:  {GLOWAPEX_ORIGIN}/checkout/cancel
```

---

## Phase 5 — Docker: Add Glow Apex Service

### `docker-compose.prod.yml` — add glowapex service

```yaml
glowapex:
  build:
    context: ./glowapex
    target: prod           # requires glowapex/Dockerfile (same as frontend/Dockerfile)
  restart: unless-stopped
  ports:
    - "3001:80"
  healthcheck:
    test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 20s
```

### `glowapex/Dockerfile`

Copy the same multi-stage Dockerfile from `frontend/Dockerfile` (dev → build → prod nginx stages).

### `glowapex/nginx.conf`

Copy `frontend/nginx.conf` — same SPA routing config, no changes needed.

---

## Phase 6 — Environment Variable Checklist

### `backend/.env`

```env
# Add this
GLOWAPEX_ORIGIN=http://YOUR_SERVER_IP:3001
# After Cloudflare:
# GLOWAPEX_ORIGIN=https://glowapex.com
```

### `frontend/.env.production`

```env
# Add this
VITE_GLOWAPEX_URL=http://YOUR_SERVER_IP:3001
# After Cloudflare:
# VITE_GLOWAPEX_URL=https://glowapex.com
```

### `glowapex/.env.production` (new file)

```env
VITE_API_BASE_URL=http://YOUR_SERVER_IP/api
VITE_D1_URL=http://YOUR_SERVER_IP
# After Cloudflare:
# VITE_API_BASE_URL=https://buyrealviews.com/api
# VITE_D1_URL=https://buyrealviews.com
```

---

## Implementation Order

| Phase | What | Dependency |
|---|---|---|
| 1 | D1 backend: checkout session endpoints | None |
| 2 | D1 frontend: redirect on submit | Phase 1 done |
| 3 | D2 frontend: checkout + success pages | Phase 1 done |
| 4 | D1 backend: gateway return URLs → D2 | Phase 3 routes exist |
| 5 | Docker: glowapex service + Dockerfile | Phase 3 done |
| 6 | Env vars: all files updated | All phases |

Phases 2 and 3 can be built in parallel after Phase 1.

---

## After Cloudflare

Three env var changes across three files:

| File | Variable | New value |
|---|---|---|
| `backend/.env` | `GLOWAPEX_ORIGIN` | `https://glowapex.com` |
| `frontend/.env.production` | `VITE_GLOWAPEX_URL` | `https://glowapex.com` |
| `glowapex/.env.production` | `VITE_API_BASE_URL` | `https://buyrealviews.com/api` |
| `glowapex/.env.production` | `VITE_D1_URL` | `https://buyrealviews.com` |

Then rebuild both frontends:

```bash
docker compose -f docker-compose.prod.yml build frontend glowapex
docker compose -f docker-compose.prod.yml up -d
```
