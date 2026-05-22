# CHANGES

[2026-05-22 00:00] | add | frontend/src/pages/services/ServiceDetail.tsx | Converted Next.js service detail page to React Router. Replaced useRouter/useParams from next/navigation with react-router-dom equivalents, removed js-cookie dependency, replaced Cookies.get("selected_package") with useOrderStore.selectedPackage + clearSelectedPackage(), replaced Cookies.set("form_data") with useOrderStore.setOrderData(), replaced Cookies.get("currency") with localStorage.getItem("currency"), replaced next/image Image with plain img tag.

[2026-05-22 00:00] | add | frontend/src/pages/checkout/CheckoutPage.tsx | Converted Next.js checkout page to React Router. Removed all js-cookie usage, reads order data from useOrderStore.orderData instead of Cookies.get("form_data"), reads currency from localStorage instead of cookies, replaced raw axios.post("/api/payment/create-order") with api.post(API_ENDPOINTS.CASHFREE_CREATE), replaced process.env.NEXT_PUBLIC_CASHFREE_REDIRECT_ORIGIN with window.location.origin, typed currentService state with explicit ServiceInfo interface instead of any, fixed the Payeer/option2 conditional in paymentOptions array (option2 no longer appears in the list but JSX branch retained for compatibility).

[2026-05-22 10:00] | add | backend/ (entire directory) | Created Python FastAPI backend to replace all Next.js API routes. Structure: app/main.py (FastAPI + CORS), app/app_components.py (router loader), app/common/config.py (pydantic-settings env vars). SMM module (app/smm/): proxies Postlikes.com services and add-order endpoints — fixes original bug where 'link' field sent serviceId instead of the YouTube URL. Cashfree module (app/payments/cashfree/): create/verify/webhook endpoints using httpx. Stripe module (app/payments/stripe/): create/verify/webhook using stripe Python SDK with run_in_threadpool — fixes original bug where session was hardcoded to INR regardless of order_currency. Cryptomus module (app/payments/cryptomus/): utils.py with MD5 signature generation/verification, create/verify/webhook endpoints. Payeer module (app/payments/payeer/): utils.py with SHA256 signature and AES-256-CBC encryption via pycryptodome, create/verify/webhook with IP allowlist validation — webhook returns '{m_orderid}|success' as Payeer expects. Unified verify endpoint (app/payments/router.py): GET /payments/verify?method=X routes to correct gateway. All webhook handlers log events and return success (SMM order placement deferred pending DB integration).

[2026-05-22 10:00] | discovery | backend/app/payments/stripe/service.py | Stripe session currency was hardcoded to INR in the original Next.js codebase (src/lib/stripe/utils.ts). Fixed in FastAPI service to use order_currency from the create request, which correctly reflects the user's selected currency (USD).

[2026-05-22 10:00] | discovery | backend/app/smm/service.py | Original /api/add-order route (src/app/api/add-order/route.ts) sent body.serviceId as both 'service' and 'link' to Postlikes API. Fixed in FastAPI service to use the 'link' field from the request body (the YouTube URL) as intended.

[2026-05-22 11:00] | delete | src/, public/, .next/, scripts/, test/, next.config.ts, next-env.d.ts, tsconfig.json, package.json, postcss.config.mjs, components.json, eslint.config.mjs, tasks.md, youtube_services.json, *.md docs | Removed all Next.js monolith files. Root now contains only CLAUDE.md, README.md, frontend/, and backend/.

[2026-05-22 12:00] | add | backend/app/user_management/ (entire module) | Implemented real auth system. New module: models, schemas, repositories, services, utils, routers. Password hashing via passlib/bcrypt. OTP: 6-digit cryptographically random, SHA-256 hashed before MongoDB storage, 10-minute expiry. Email delivery via aiosmtplib (Gmail SMTP, port 587 TLS). JWT: python-jose, 24h expiry, signed with JWT_SECRET_KEY. Endpoints: POST /auth/register (creates unverified user, sends OTP), POST /auth/verify-otp (validates OTP, marks verified, returns JWT), POST /auth/resend-otp (issues fresh OTP), POST /auth/login (email or username + password). Login identifier resolved via MongoDB $or query on email/username fields.

[2026-05-22 12:00] | modify | backend/app/main.py | Added asynccontextmanager lifespan: opens AsyncIOMotorClient on startup, stores db in app.state.db, creates unique indexes on users.email and users.username, closes client on shutdown.

[2026-05-22 12:00] | modify | backend/app/app_components.py | Registered auth_router at prefix /auth.

[2026-05-22 12:00] | modify | backend/app/common/config.py | Added MONGODB_URI, MONGODB_DB_NAME, JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM settings.

[2026-05-22 12:00] | modify | backend/requirements.txt | Added motor, passlib[bcrypt], python-jose[cryptography], aiosmtplib, pydantic[email].

[2026-05-22 12:00] | modify | frontend/src/config.ts | Added AUTH_REGISTER, AUTH_VERIFY_OTP, AUTH_RESEND_OTP, AUTH_LOGIN endpoint constants.

[2026-05-22 12:00] | modify | frontend/src/context/AuthContext.tsx | Replaced all mock auth with real API calls. Added register(), verifyOtp(), resendOtp() methods. login() now accepts identifier (email or username). User type updated: full_name + username fields. JWT and user stored in localStorage on login/verify.

[2026-05-22 12:00] | modify | frontend/src/pages/auth/SignUpPage.tsx | Added two-step registration flow: step 1 = form (full_name, username, email, password), step 2 = OTP input with resend button. On OTP verify success → redirect to /dashboard. Server errors displayed inline. OTP field strips non-digits, accepts only 6 digits.

[2026-05-22 12:00] | modify | frontend/src/pages/auth/SignInPage.tsx | Replaced email-only field with email-or-username identifier field. Removed email regex validation (username is valid input). Replaced mock setTimeout with real login() API call. 403 response (unverified account) shown as distinct message. Server errors displayed inline above the form.

[2026-05-22 14:00] | modify | backend/app/user_management/services/auth_service.py | login(): on unverified account, now calls _issue_new_otp before raising 403 (so OTP is always fresh regardless of when registration happened). 403 detail changed from a plain string to a dict {"message": ..., "email": ...} so the frontend can bind the OTP step to the correct email when login was attempted with a username.

[2026-05-22 14:00] | modify | frontend/src/pages/auth/SignInPage.tsx | Added two-step flow (step: "login" | "verify"). On 403 response, reads detail.email, stores it in unverifiedEmail, and transitions to OTP verification step inline — same UX pattern as SignUpPage. OTP step includes resend button and back-to-sign-in link. On verifyOtp success, navigates to /.

[2026-05-22 15:00] | add | backend/app/user_management/utils/dependencies.py | get_current_user FastAPI dependency: reads Bearer JWT, decodes it via decode_access_token, fetches user from DB by sub claim, raises 401 if token invalid or user missing.

[2026-05-22 15:00] | add | backend/app/user_management/services/profile_service.py | ProfileService with get_profile (returns ProfileResponse from user doc), update_profile (patches full_name/username, checks username uniqueness, re-fetches after write), change_password (verifies current password hash before storing new hash).

[2026-05-22 15:00] | add | backend/app/user_management/routers/profile_router.py | Protected profile endpoints: GET /auth/me, PATCH /auth/me, POST /auth/change-password. All require valid JWT via get_current_user dependency.

[2026-05-22 15:00] | modify | backend/app/user_management/schemas/auth_schemas.py | Added ProfileResponse, UpdateProfileRequest (optional full_name + username with validators), ChangePasswordRequest (current + new password with length validator).

[2026-05-22 15:00] | modify | backend/app/user_management/repositories/user_repository.py | Added update_profile (partial $set by _id) and update_password (replaces hashed_password by _id).

[2026-05-22 15:00] | modify | backend/app/app_components.py | Registered profile_router at /auth prefix with "Profile" tag.

[2026-05-22 15:00] | modify | frontend/src/config.ts | Added AUTH_ME and AUTH_CHANGE_PASSWORD endpoint constants.

[2026-05-22 15:00] | modify | frontend/src/context/AuthContext.tsx | Added updateProfile (PATCH /auth/me via api instance, updates user in state + localStorage) and changePassword (POST /auth/change-password). Imported api instance. Exposed both methods on context.

[2026-05-22 15:00] | add | frontend/src/pages/dashboard/profile/ProfilePage.tsx | Profile settings page with two cards: (1) Account Info — editable full_name and username, read-only email display; (2) Change Password — current/new/confirm fields with show/hide toggles. Both forms have inline error and success states.

[2026-05-22 15:00] | modify | frontend/src/App.tsx | Added ProfilePage import and /dashboard/profile route inside the dashboard route group.

[2026-05-22 15:00] | modify | frontend/src/pages/dashboard/DashboardLayout.tsx | Header profile icon button now navigates to /dashboard/profile and highlights when active. Added Profile sidebar nav link with active state. Removed dead user.avatar branch (User type has no avatar field). Removed unused Avatar import.

[2026-05-22 15:30] | modify | frontend/src/pages/dashboard/DashboardLayout.tsx | Profile page now renders in its own full content area — when pathname includes "profile", main renders only <Outlet /> without the welcome card, stat cards, or tab navigation. Header title switches to "Profile Settings" on that route.
