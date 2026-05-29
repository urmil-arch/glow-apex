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

[2026-05-25 00:00] | modify | README.md | Replaced stale Next.js boilerplate README with accurate project documentation covering tech stack, repo structure, dev setup, environment variables, payment gateway table, auth flow, checkout-to-order flow, SMM service IDs, and deployment targets (Vercel + Railway).

[2026-05-25 00:00] | modify | frontend/src/pages/dashboard/DashboardLayout.tsx | Full redesign: replaced generic gray admin template with dark slate-900 sidebar using teal-to-emerald brand gradient accents. Removed Analytics tab, in-content tab bar, Bell notification, and fake stat cards from layout. Sidebar now has Orders/Payments/Profile nav + Back to Site/Logout. Active state uses left border teal accent. Branding updated to BuyRealViews. Sidebar is always visible on desktop (lg:translate-x-0), slides in as drawer on mobile.
[2026-05-25 00:00] | modify | frontend/src/pages/dashboard/orders/OrderPage.tsx | Added welcome banner (teal-to-emerald gradient) with user name and New Order CTA. Added 4 service quick-buy cards (Views, Likes, Subscribers, Shorts) with correct service IDs. Added 2 honest stat cards (Total Orders, Total Spent) computed from order data — no fake percentages. Fixed Reorder link to navigate to the correct service page (via SERVICE_ROUTES map) instead of the YouTube video URL.
[2026-05-25 00:00] | fix | frontend/src/pages/dashboard/payments/PaymentsPage.tsx | Removed 'use client' Next.js directive (leftover from monolith migration). Removed unused React import.
[2026-05-25 00:00] | delete | frontend/src/pages/dashboard/analytics/AnalyticsPage.tsx | Removed analytics page — all data was hardcoded mock with a chart placeholder. Not appropriate for the current stage.
[2026-05-25 00:00] | modify | frontend/src/App.tsx | Removed AnalyticsPage import and /dashboard/analytics route.

[2026-05-25 00:00] | add | backend/app/contact/__init__.py, schemas.py, utils.py, router.py | New contact module. POST /contact/send: validates ContactRequest (name, email, subject, message, type), enforces 1-per-hour rate limit per client IP via Redis (key: contact_ratelimit:{ip}, TTL 3600s — fails open if Redis is down), then fires send_contact_emails() which uses asyncio.gather to send two emails in parallel: HTML owner notification (to CONTACT_OWNER_EMAIL, Reply-To = user email) and HTML user confirmation. All user-supplied content is html.escape()d before insertion into email templates.
[2026-05-25 00:00] | modify | backend/app/common/config.py | Added CONTACT_OWNER_EMAIL setting (falls back to SMTP_FROM if empty).
[2026-05-25 00:00] | modify | backend/requirements.txt | Added redis[asyncio]>=5.0.0 for contact form rate limiting.
[2026-05-25 00:00] | modify | backend/app/app_components.py | Registered contact_router at /contact prefix.
[2026-05-25 00:00] | modify | frontend/src/config.ts | Added CONTACT_SEND endpoint constant.
[2026-05-25 00:00] | modify | frontend/src/pages/contact/ContactPage.tsx | Replaced mailto: hack with real api.post(CONTACT_SEND) call. Added isSubmitting state (spinner + disabled button during request), submitError state (inline red banner for 429/500 responses), clean success state without email-client fallback copy. Fixed React.FormEvent deprecation hint by adding HTMLFormElement type parameter.

[2026-05-25 12:00] | modify | frontend/src/**/*.ts, frontend/src/**/*.tsx, frontend/index.html, backend/app/main.py, backend/app/contact/utils.py, backend/app/user_management/utils/otp.py, backend/app/payments/*/service.py, README.md | Site-wide rename: BuyRealViews/GlowApex/Glow Apex/GLOW APEX → Glow-Apex; buyrealviews.com/BuyRealViews.com → glowapex.com; support@buyrealviews.com → support@glowapex.com. MongoDB DB name (buyrealviews) explicitly preserved.

[2026-05-26 00:00] | add | backend/app/admin/__init__.py, backend/app/admin/router.py | New admin module scaffold. GET /admin/health verifies admin JWT access.
[2026-05-26 00:00] | modify | backend/app/common/config.py | Added ADMIN_EMAIL and ADMIN_PASSWORD settings for seeding initial admin on startup.
[2026-05-26 00:00] | modify | backend/app/user_management/schemas/auth_schemas.py | Added is_admin: bool = False to UserPublic and ProfileResponse so the field is included in all auth and profile API responses.
[2026-05-26 00:00] | modify | backend/app/user_management/services/auth_service.py | register() now sets is_admin: False on new user document. verify_otp() and login() now include is_admin in returned UserPublic.
[2026-05-26 00:00] | modify | backend/app/user_management/services/profile_service.py | get_profile() and update_profile() now include is_admin in ProfileResponse.
[2026-05-26 00:00] | modify | backend/app/user_management/repositories/user_repository.py | Added find_any_admin() and seed_admin() — seed_admin promotes existing user or creates new admin user if none exists.
[2026-05-26 00:00] | modify | backend/app/user_management/utils/dependencies.py | Added get_current_admin dependency — wraps get_current_user and raises 403 if is_admin is False.
[2026-05-26 00:00] | modify | backend/app/main.py | Lifespan now calls repo.seed_admin() on startup if ADMIN_EMAIL + ADMIN_PASSWORD are set and no admin exists yet.
[2026-05-26 00:00] | modify | backend/app/app_components.py | Registered admin_router at /admin prefix.
[2026-05-26 00:00] | modify | frontend/src/context/AuthContext.tsx | User.role replaced with is_admin?: boolean. login() and verifyOtp() now return User so callers can inspect is_admin for redirect decisions.
[2026-05-26 00:00] | modify | frontend/src/pages/auth/SignInPage.tsx | Post-login and post-OTP-verify redirect now goes to /admin if is_admin, else /dashboard.
[2026-05-26 00:00] | add | frontend/src/components/admin/AdminGuard.tsx | Route guard: redirects to /sign-in if not authenticated, to / if authenticated but not admin.
[2026-05-26 00:00] | add | frontend/src/pages/admin/AdminLayout.tsx | Dark sidebar layout for admin panel. Nav: Dashboard / Users / Services / Settings. Mobile drawer. Logout and back-to-site in footer.
[2026-05-26 00:00] | add | frontend/src/pages/admin/AdminDashboard.tsx | Placeholder admin index page shown at /admin.
[2026-05-26 00:00] | modify | frontend/src/App.tsx | Added /admin route group protected by AdminGuard, rendered inside AdminLayout.

[2026-05-26 00:00] | add | backend/app/user_management/repositories/sign_in_log_repository.py | New repository for sign_in_logs collection. log() writes IP + user-agent + timestamp on each login. find_by_user_id() returns 20 most recent events.
[2026-05-26 00:00] | modify | backend/app/user_management/repositories/user_repository.py | Added admin_list_users (paginated + search + filter), admin_get_stats, admin_export_users, admin_suspend_user.
[2026-05-26 00:00] | modify | backend/app/user_management/routers/auth_router.py | Login endpoint now accepts Request and logs sign-in event to sign_in_logs collection via SignInLogRepository after successful auth.
[2026-05-26 00:00] | modify | backend/app/main.py | Lifespan now creates sign_in_logs index on startup via SignInLogRepository.create_index().
[2026-05-26 00:00] | add | backend/app/admin/users/__init__.py, schemas.py, router.py | Admin users module. Endpoints: GET /admin/users (paginated list), GET /admin/users/stats, GET /admin/users/export, POST /admin/users (create), GET/PATCH /admin/users/{id}, POST /admin/users/{id}/set-password, POST /admin/users/{id}/suspend, GET /admin/users/{id}/sign-in-history.
[2026-05-26 00:00] | modify | backend/app/admin/router.py | Includes users_router at /users prefix.
[2026-05-26 00:00] | modify | frontend/src/config.ts | Added ADMIN_USERS, ADMIN_USERS_STATS, ADMIN_USERS_EXPORT endpoint constants.
[2026-05-26 00:00] | add | frontend/src/pages/admin/users/UsersPage.tsx | Admin users page. Stats cards (total/active/suspended), search + filter bar, paginated table with status badges, per-row actions menu (edit, set password, sign-in history, suspend). Modals for add user, edit user, set password, sign-in history, suspend confirm. Export users/emails as CSV.
[2026-05-26 00:00] | modify | frontend/src/App.tsx | Added /admin/users route.

[2026-05-26 12:00] | add | backend/app/admin/providers/__init__.py, repository.py, schemas.py, router.py | Admin providers module. CRUD on providers collection (name, url, api_key). Proxy endpoints: GET /admin/providers/{id}/balance and GET /admin/providers/{id}/services — both forward to the provider's API and return the response.
[2026-05-26 12:00] | add | backend/app/admin/services/__init__.py, repository.py, schemas.py, router.py | Admin services module. CategoryRepository (service_categories collection) + ServiceRepository (admin_services collection). Endpoints: GET/POST /admin/services/categories, DELETE /admin/services/categories/{id}, GET/POST /admin/services, GET/PATCH/DELETE /admin/services/{id}. ServiceResponse resolves provider_name and category_name by joining referenced documents.
[2026-05-26 12:00] | modify | backend/app/admin/router.py | Includes providers_router at /providers and services_router at /services.
[2026-05-26 12:00] | modify | backend/app/main.py | Lifespan now calls create_index() for ProviderRepository, CategoryRepository, and ServiceRepository on startup.
[2026-05-26 12:00] | modify | frontend/src/config.ts | Added ADMIN_PROVIDERS, ADMIN_SERVICES, ADMIN_CATEGORIES endpoint constants.
[2026-05-26 12:00] | add | frontend/src/pages/admin/services/ServicesPage.tsx | Admin services page. Services grouped by category in collapsible sections (matching standard SMM panel UX). Toolbar: Add service, Add category, bulk Delete, Sync, Export CSV, Search. Each category section has Actions dropdown (add service here, delete category) and Hide/Show toggle. Per-row Actions dropdown (edit, enable/disable, delete). Add service modal pre-fills form from live provider service list (provider picker → fetches services → dropdown pre-fills rate/min/max). Provider-sync picker has search. Bulk checkbox selection with count shown on Delete button.
[2026-05-26 12:00] | modify | frontend/src/App.tsx | Added /admin/services route.

[2026-05-26 14:00] | add | backend/app/admin/settings/__init__.py, schemas.py, repository.py, router.py | Platform settings module. Single document upserted in platform_settings collection keyed by "_key: platform". GET /admin/settings returns current values merged with defaults. PATCH /admin/settings applies partial updates. Fields: site_name, support_email, currency (USD/INR/EUR), maintenance_mode.
[2026-05-26 14:00] | modify | backend/app/admin/router.py | Includes settings_router at /settings prefix.
[2026-05-26 14:00] | modify | frontend/src/config.ts | Added ADMIN_SETTINGS endpoint constant.
[2026-05-26 14:00] | add | frontend/src/pages/admin/settings/SettingsPage.tsx | Admin settings page. Two tabs: General (site name, support email, currency pill selector, maintenance mode toggle with warning banner, save with inline success feedback) and SMM Providers (provider cards showing name/URL/balance-on-demand, add/edit/delete modals, empty state with CTA).
[2026-05-26 14:00] | modify | frontend/src/App.tsx | Added /admin/settings route.

[2026-05-26 15:00] | add | backend/app/common/crypto.py | AES-256-GCM encrypt/decrypt utility. encrypt_value() generates a random 16-byte nonce per call, stores nonce+tag+ciphertext as base64. decrypt_value() falls back to returning the input unchanged if decryption fails (migration safety). Key loaded from API_KEY_ENCRYPTION_SECRET env var (64 hex chars = 32 bytes).
[2026-05-26 15:00] | modify | backend/app/common/config.py | Added API_KEY_ENCRYPTION_SECRET setting.
[2026-05-26 15:00] | modify | backend/app/admin/providers/repository.py | insert() now encrypts api_key before storing. update() re-encrypts api_key if present in the update dict. find_all(), find_by_id(), find_by_name() all decrypt api_key after reading. MongoDB never stores plaintext API keys.
[2026-05-26 15:00] | modify | backend/.env | Added API_KEY_ENCRYPTION_SECRET with a generated 32-byte hex key.

[2026-05-26 16:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Wired SubscriptionFormModal into ServicesPage: added showAddSubscription/addSubscriptionCategory/editSubscription state, "Add subscription" toolbar button, handleEdit() that routes to ServiceFormModal or SubscriptionFormModal based on service_kind, onAddSubscription prop on CategorySection, "Add subscription here" option in category Actions dropdown, subscription kind badge (purple) in table rows, and both add/edit subscription modals at bottom of JSX.

[2026-05-26 16:30] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Added provider API reference data display in ServiceFormModal. When a service is selected from the provider list (or typed manually and matched), shows: a summary info box below the service ID picker (ID, name, type, category, rate, min, max from provider), and per-field "Provider: X" hint lines below Service Name, Service Type, Category, Rate, Min Order, and Max Order inputs.

[2026-05-27 00:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Auto/Manual mode lock in ServiceFormModal. Mode=Auto: useEffect syncs name/type/rate/min/max from selectedItem whenever mode or provider service changes; those five fields are disabled (opacity-60, bg-gray-50, cursor-not-allowed). Mode=Manual: all fields freely editable. Switching back to Manual retains current values but unlocks them.

[2026-05-27 12:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Replaced Mode dropdown with segmented pill toggle (Manual | Auto). Default changed from Auto to Manual. Removed admin seed system from backend (ADMIN_EMAIL/ADMIN_PASSWORD settings, seed_admin/find_any_admin repo methods, lifespan seed call, import re). Admin can now be added via admin panel or direct DB update is_admin:true.

[2026-05-27 14:00] | add | backend/app/orders/__init__.py, repository.py, schemas.py, provider_api.py, router.py | New orders module. OrderRepository: insert, find_by_id (user-scoped), find_by_user_id (paginated), update. call_provider() utility POSTs to any standard SMM panel API. 6 endpoints: POST /orders (validate service bounds, call provider action=add, store doc, charge = rate*qty/1000), GET /orders (paginated list), GET /orders/{id} (fetch + live status refresh from provider, persist updates), POST /orders/{id}/refill, GET /orders/{id}/refill-status, POST /orders/{id}/cancel (marks Cancelled in DB). All endpoints require JWT. _get_order_and_provider() helper shared across 4 endpoints.

[2026-05-27 14:00] | add | backend/app/public_services/__init__.py, router.py | Public GET /services endpoint (no auth). Returns all active admin_services with category_name resolved from service_categories. Used by the frontend services list page.

[2026-05-27 14:00] | modify | backend/app/app_components.py | Registered orders_router at /orders and public_services_router at /services.

[2026-05-27 14:00] | modify | backend/app/main.py | Lifespan now calls OrderRepository.create_index() on startup (compound index on user_id + created_at desc).

[2026-05-27 14:00] | modify | frontend/src/config.ts | Added PUBLIC_SERVICES and ORDERS endpoint constants.

[2026-05-27 14:00] | modify | frontend/src/types/index.ts | Added AdminService and UserOrder interfaces.

[2026-05-27 14:00] | modify | frontend/src/context/ServicesContext.tsx | Rewrote to fetch from GET /services (public, no auth) via plain axios.get instead of api.post. Returns AdminService[] instead of Service[]. Removed hardcoded Postlikes service ID filter [5209, 2342, 5648, 376].

[2026-05-27 14:00] | modify | frontend/src/store/useOrderStore.ts | Added ServiceOrderData interface and serviceOrder/setServiceOrder/clearServiceOrder to OrderStore. Used by ServicesListPage → CheckoutPage handoff.

[2026-05-27 14:00] | add | frontend/src/pages/services/ServicesListPage.tsx | Public services browsing page at /services. Hero banner, category filter pill tabs, 3-col responsive service card grid. Each card shows name, category badge, description (2-line truncate), rate/1k, min–max range, type badge. Order Now → sets serviceOrder in store, navigates to /checkout.

[2026-05-27 14:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Rewrote checkout page for direct order placement (payment deferred). Reads serviceOrder from store; redirects to /services if missing. Link + quantity inputs with min/max validation, live total price preview (rate * qty / 1000). Place Order calls POST /orders, then clearServiceOrder and navigates to /dashboard/orders on success.

[2026-05-27 14:00] | modify | frontend/src/pages/dashboard/orders/OrderPage.tsx | Rewrote orders page with real API data. fetchOrders() calls GET /orders on mount. StatusModal: per-order detail popup with Refresh (GET /orders/{id}), Refill (POST /orders/{id}/refill), Cancel (POST /orders/{id}/cancel) buttons. getStatusBadge() handles any string status. Stats (total orders, total spent) computed from real orders array. New Order button links to /services. No mock data.

[2026-05-27 14:00] | modify | frontend/src/App.tsx | Added ServicesListPage import and /services route inside PublicLayout.

[2026-05-27 15:00] | modify | frontend/src/components/navbar.tsx | Added "Services" nav link to /services alongside existing items.

[2026-05-27 15:00] | modify | frontend/src/components/sections/hero/home-hero-section.tsx | All 4 service card links (Likes, Views, Comments, Subscribers) changed from individual static service paths to /services.

[2026-05-27 15:00] | modify | frontend/src/components/sections/hero/service-selection-component.tsx | "Buy Now" navigate changed from /service/${serviceId} to /services.

[2026-05-27 15:00] | modify | frontend/src/components/sections/hero/youtube-views-hero.tsx, youtube-likes-hero.tsx, youtube-subscribers-hero-section.tsx, youtube-comments-hero.tsx, youtube-short-views-hero.tsx, youtube-shorts-likes-hero.tsx, country-targeted-subscribers-hero.tsx | All "Buy Now" onClick handlers changed from navigate(`/service/${service_id}`) to navigate("/services").

[2026-05-27 16:00] | fix | frontend/src/pages/dashboard/orders/OrderPage.tsx | StatusModal catch blocks now extract real API error detail from axios error response (err.response.data.detail). Added extractDetail() helper used by handleRefresh, handleRefill, and handleCancel. Before: all three showed hardcoded generic strings regardless of provider error. Now: provider errors like "Refill is disabled for this service" are surfaced directly to the user.

[2026-05-27 17:00] | modify | backend/app/admin/services/repository.py | Added find_active_by_category_id(category_id) to ServiceRepository. Returns all active services in a category sorted by _id asc (insertion/directory order). Used by the orders auto-selection logic.

[2026-05-27 17:00] | modify | backend/app/orders/router.py | place_order now auto-selects providers via directory order. Fetches all active services in the same category sorted by insertion order, tries each in sequence, uses the first that succeeds. Charge stays at the user-selected service's rate. fulfilled_provider._id stored in order doc. Removed _try_fallback_providers helper — replaced by a single loop covering all candidates including the original.

[2026-05-27 17:00] | modify | frontend/src/pages/services/ServicesListPage.tsx | Now reads ?category= URL search param on mount and initialises activeCategory with it (falls back to "All" if absent). Allows hero pages to deep-link directly into a filtered category view.

[2026-05-27 17:00] | modify | frontend/src/components/sections/hero/youtube-likes-hero.tsx, youtube-views-hero.tsx, youtube-comments-hero.tsx, youtube-subscribers-hero-section.tsx, youtube-shorts-likes-hero.tsx, youtube-short-views-hero.tsx, country-targeted-subscribers-hero.tsx, service-selection-component.tsx | All Buy Now buttons now navigate to /services with a ?category= param matching the page (e.g. /services?category=YouTube+Likes). service-selection-component derives category from its serviceTitles map keyed by serviceType prop. Admin panel category names must match exactly: "YouTube Likes", "YouTube Views", "YouTube Comments", "YouTube Subscribers", "YouTube Shorts Likes", "YouTube Shorts Views", "Country Targeted Subscribers".

[2026-05-28 00:00] | add | backend/app/orders/schemas.py | Added PlaceOrderByCategoryRequest(category_name, link, quantity) with validators.

[2026-05-28 00:00] | add | backend/app/orders/router.py | Added POST /orders/by-category endpoint. Looks up category by name, fetches all active services in that category sorted by insertion order, tries each provider in sequence, uses first success. Charge = winning service rate * quantity / 1000. Imported CategoryRepository.

[2026-05-28 00:00] | modify | frontend/src/config.ts | Added ORDERS_BY_CATEGORY endpoint constant.

[2026-05-28 00:00] | modify | frontend/src/store/useOrderStore.ts | Added CategoryOrderData interface (categoryName, quantity) and categoryOrder / setCategoryOrder / clearCategoryOrder to OrderStore.

[2026-05-28 00:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Extended to handle both serviceOrder (existing) and categoryOrder (new) flows. Category flow: quantity is locked (pre-selected on hero page), no price preview, submits to ORDERS_BY_CATEGORY. Service flow: unchanged. If neither store value is set, redirects to /services.

[2026-05-28 00:00] | modify | frontend/src/components/sections/hero/youtube-likes-hero.tsx, youtube-views-hero.tsx, youtube-comments-hero.tsx, youtube-subscribers-hero-section.tsx, youtube-shorts-likes-hero.tsx, youtube-short-views-hero.tsx, country-targeted-subscribers-hero.tsx | Buy Now now stores {categoryName, quantity} in categoryOrder and navigates to /checkout. Added useOrderStore import to each file.

[2026-05-28 00:00] | modify | frontend/src/components/sections/hero/service-selection-component.tsx | Buy Now now uses setCategoryOrder + navigate("/checkout"). Removed unused serviceConfig constant, SelectedPackageData interface, and storeSelectedPackage destructure.

[2026-05-28 00:00] | fix | frontend/src/config/data.ts, youtube-shorts-likes-hero.tsx, youtube-short-views-hero.tsx | Shorts Likes hero was using servicesPackages["likes"] and Shorts Views hero was using servicesPackages["views"] — both identical to the regular YouTube pages. Added distinct "shorts-likes" and "shorts-views" keys to servicesPackages with Shorts-appropriate quantity tiers. Both hero files updated to reference their own keys.

[2026-05-28 00:00] | modify | frontend/src/components/sections/hero/service-selection-component.tsx | Price sync: replaced static hardcoded prices with real admin panel service rates. Added useServices() hook, derives serviceRate by matching category_name to the service type label, computes total price as (rate * qty / 1000) and unit price as rate / 1000. Removed totalPrice/convertedPrice/discount state, removed updatePrice() function and its useEffect, removed fake "Save X%" discount labels from quantity tiles, removed "X% OFF" badge from price display, removed stale commented-out URL input block.

[2026-05-28 00:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Added filter bar to admin services page. New state: filterProvider, filterStatus, filterRateMin, filterRateMax, showFilters. Filter button in toolbar shows active-filter badge count. Expandable filter bar with provider dropdown, status dropdown (All/Active/Inactive), rate range inputs (min/max per 1k), and Clear filters button. All filtering is client-side on the already-loaded services list.

[2026-05-28 00:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Added per-category column sorting. Each CategorySection now has sortKey/sortDir state. Clicking any column header (ID, Service, Type, Provider, Rate, Min, Max, Status) sorts that category's rows; clicking again reverses direction. Active column shows teal chevron; inactive columns show grey chevron hint.

[2026-05-28 00:00] | modify | backend/app/admin/services/repository.py | Changed find_active_by_category_id to sort by provider_service_id numerically ascending (numeric IDs like "1","2","10" sort as integers). Previously sorted by MongoDB _id (insertion order). This means order auto-selection now tries service ID 1 before ID 2, with fallback to the next on provider error.

[2026-05-28 00:00] | add | backend/app/admin/provider_config/__init__.py, repository.py, schemas.py, router.py | New module: routing_configs MongoDB collection. RoutingConfigRepository supports find_all, find_by_category_id, upsert, delete. Schemas: RoutingConfigServiceInfo, RoutingConfigResponse, UpsertRoutingConfigRequest. Router: GET /admin/routing (list all), GET /admin/routing/{category_id}, PUT /admin/routing/{category_id} (upsert), DELETE /admin/routing/{category_id} (clear). _resolve_service_info joins service + provider for display.

[2026-05-28 00:00] | modify | backend/app/admin/router.py | Registered provider_config_router under /routing prefix with tag "Admin Routing Config".

[2026-05-28 00:00] | modify | backend/app/orders/router.py | place_order_by_category now checks routing_configs first. If a config exists, builds ordered candidate list [default_service, ...fallbacks]; only includes is_active services. Falls back to find_active_by_category_id if no config is set. Imported RoutingConfigRepository.

[2026-05-28 00:00] | modify | backend/app/public_services/router.py | Added is_default field to each service in the public response. True when the service is the configured default in routing_configs for its category. Imported RoutingConfigRepository.

[2026-05-28 00:00] | modify | frontend/src/types/index.ts | Added is_default?: boolean to AdminService. Added RoutingConfigServiceInfo and RoutingConfig interfaces.

[2026-05-28 00:00] | modify | frontend/src/config.ts | Added ADMIN_ROUTING_CONFIG endpoint constant.

[2026-05-28 00:00] | add | frontend/src/pages/admin/routing/ProviderConfigPage.tsx | Admin page for per-category routing configuration. Loads all categories, admin services, and existing routing configs in parallel. One card per category showing current default service and ordered fallback list with provider/ID/rate details. Dropdowns let admin pick any active service in the category. Save per category (PUT), Clear Config (DELETE) to revert to auto-select.

[2026-05-28 00:00] | modify | frontend/src/App.tsx | Added import and route for ProviderConfigPage at /admin/routing.

[2026-05-28 00:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added GitBranch nav item for /admin/routing (Routing) between Services and Settings.

[2026-05-28 00:00] | modify | frontend/src/components/sections/hero/service-selection-component.tsx | serviceRate now prefers the is_default-flagged service for the category, falling back to the first matching service if no default is configured.

[2026-05-28 12:00] | fix | backend/app/admin/settings/SettingsPage.tsx (frontend) | Added EyeOff hide-balance button inline with the balance display in ProviderCard. Clicking it clears the balance value without requiring a page refresh.

[2026-05-28 12:00] | modify | frontend/src/pages/admin/routing/ProviderConfigPage.tsx | Full rewrite: dropdowns now show ALL services (not filtered per category) grouped by category_name using <optgroup>. Added ServiceDetailCard component showing full service details (name, category, provider, service ID, rate, min, max, type). getGroupedServices(excludeIds) excludes already-selected services from each dropdown.

[2026-05-28 12:00] | fix | backend/app/public_services/router.py | Added default_for_category field to public services response. Maps service_id → routing category name (not the service's own category_name). Fixes cross-category routing: a "YouTube Likes" service set as default for "YouTube Comments" routing now correctly reports default_for_category="YouTube Comments".

[2026-05-28 12:00] | fix | frontend/src/types/index.ts | Added default_for_category?: string | null to AdminService interface to match the new public services response field.

[2026-05-28 12:00] | fix | frontend/src/components/sections/hero/service-selection-component.tsx | Changed rate lookup from services.find(s => s.category_name === categoryName && s.is_default) to services.find(s => s.default_for_category === categoryName). Root cause: is_default was on the service's own category_name, not the routing category — so cross-category routing configs showed $0. Rate is now 0 if no routing default is configured (no silent fallback to first category service).

[2026-05-28 12:00] | fix | backend/app/orders/router.py | Added per-candidate logging (WARNING) on provider failure and ERROR when all exhausted. Frontend now always receives generic HTTP 503 "Service is currently unavailable. Please try again later." — raw provider error strings (e.g. "Not enough funds on balance") are logged server-side only, never sent to users. Both place_order and place_order_by_category updated.

[2026-05-28 12:00] | fix | backend/app/orders/router.py | Removed last-resort auto-append from place_order_by_category. Previously, after trying routing config candidates, ALL active category services were appended as a silent extra fallback. This caused unconfigured services to be tried. Routing config is now strict: only default_service_id + fallback_service_ids are attempted; if all fail, 503 is returned. If no routing config exists for the category, falls back to find_active_by_category_id as before.

[2026-05-28 13:00] | fix | frontend/src/pages/admin/routing/ProviderConfigPage.tsx | Routing page now shows exactly the 6 frontend service categories (FRONTEND_CATEGORIES constant) instead of all DB categories. Iterates the hardcoded list; for each name, looks up the matching DB category by name to get its ID. If a name has no DB category yet, renders an amber warning card telling the admin to create it in the Services page. This prevents extra categories (e.g. Instagram) added via the Services page from appearing here, since orders can only ever arrive for the 6 frontend-known types.

[2026-05-28 14:00] | add | backend/app/admin/orders/__init__.py, schemas.py, router.py | New admin orders module. 10 endpoints all protected by get_current_admin at router level: GET /admin/orders (paginated, filter by status, search by link/service name), GET /admin/orders/{id} (with live provider status fetch), PATCH /{id}/link, PATCH /{id}/service, PATCH /{id}/start-count, PATCH /{id}/remains, PATCH /{id}/partial (sets status=Partial + remains), PATCH /{id}/status, POST /{id}/cancel (provider cancel + status=Cancelled), POST /{id}/refund (provider cancel + status=Refunded).

[2026-05-28 14:00] | modify | backend/app/orders/repository.py | Added find_by_id_admin (no user scope) and find_all_admin (paginated, filterable, with $lookup joining users collection for email/username). $lookup matches orders.user_id string against users._id via $toString conversion.

[2026-05-28 14:00] | modify | backend/app/admin/router.py | Registered admin orders router at /orders prefix.

[2026-05-28 14:00] | modify | frontend/src/config.ts | Added ADMIN_ORDERS endpoint constant.

[2026-05-28 14:00] | add | frontend/src/pages/admin/orders/OrdersPage.tsx | Admin orders page. Paginated table (50/page) showing all fields: ID, User (email+username), Charge, Link, Start Count, Current (computed = start_count + qty - remains), Qty, Service, Status badge, Remains, Created. Search by link/service, filter by status. Per-row action menu (transparent overlay pattern): Order Details (live provider fetch in modal), Edit Link, Edit Service (dropdown of all admin services), Set Start Count, Set Remains, Set Partial, Change Status, Cancel & Refund (separate Cancel/Refund buttons both call provider cancel, differ only in DB status label).

[2026-05-28 14:00] | modify | frontend/src/App.tsx | Added AdminOrdersPage import and /admin/orders route.

[2026-05-28 14:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added Orders nav item (ClipboardList icon) between Users and Services.

[2026-05-28 15:00] | fix | frontend/src/pages/admin/orders/OrdersPage.tsx | Action menu no longer clipped by overflow:auto table container. Moved dropdown rendering from inside <td> to a createPortal() targeting document.body. Button onClick captures getBoundingClientRect() and stores buttonTop/buttonBottom/right/openUpward in menuPosition state. Menu uses position:fixed with top=buttonBottom+4 (opens down) or bottom=innerHeight-buttonTop+4 (opens up). openUpward is true when less than 320px below the button, ensuring menus on the last visible rows open upward. closeMenu() helper resets both openMenuId and menuPosition.

[2026-05-28 16:00] | add | backend/app/contact/repository.py | New ContactMessageRepository. Stores contact form submissions (name, email, subject, message, type, is_read, created_at) in contact_messages collection. Methods: insert, find_all (paginated, filterable by is_read/type), mark_read.
[2026-05-28 16:00] | add | backend/app/tickets/__init__.py, schemas.py, repository.py, router.py | New tickets module. Thread-based support ticket model: type (order_related/payment_related/other), subject, order_id (optional), status (open/in_progress/resolved/closed), user_has_unread (bool), messages array ({sender, text, created_at}). Endpoints: GET /tickets (user's list), POST /tickets (create with first message), GET /tickets/{id} (view thread + auto-clear user_has_unread), POST /tickets/{id}/reply (user reply, blocked on resolved/closed).
[2026-05-28 16:00] | add | backend/app/admin/support/__init__.py, router.py | Admin support module at /admin/support. Ticket endpoints: GET /tickets, GET /tickets/{id}, POST /tickets/{id}/reply (sets user_has_unread=True + auto-transitions open→in_progress), PATCH /tickets/{id}/status. Contact message endpoints: GET /messages (paginated, filterable), POST /messages/{id}/read.
[2026-05-28 16:00] | modify | backend/app/contact/router.py | After sending email, fire-and-forget inserts contact message into contact_messages collection using asyncio.ensure_future(). Email success/failure is unaffected.
[2026-05-28 16:00] | modify | backend/app/admin/router.py | Registered support_router at /support prefix.
[2026-05-28 16:00] | modify | backend/app/app_components.py | Registered tickets_router at /tickets prefix.
[2026-05-28 16:00] | modify | backend/app/main.py | Lifespan now calls ContactMessageRepository.create_index() and TicketRepository.create_index() on startup.
[2026-05-28 16:00] | modify | frontend/src/config.ts | Added TICKETS, ADMIN_SUPPORT_TICKETS, ADMIN_SUPPORT_MESSAGES endpoint constants.
[2026-05-28 16:00] | add | frontend/src/pages/dashboard/tickets/TicketsPage.tsx | User ticket list page. Shows all user tickets sorted by updated_at. "New Ticket" button opens modal with type/order_id/subject/message fields. Each row shows status badge, type, subject, last message preview. Unread rows (user_has_unread) have teal-50 background, bold subject, teal last-message text. Clicking a row clears unread optimistically before navigating to thread.
[2026-05-28 16:00] | add | frontend/src/pages/dashboard/tickets/TicketThreadPage.tsx | Ticket thread view. Renders each message as a chat bubble (user=right/teal, admin=left/white). Admin GET clears user_has_unread server-side on load. Reply box with Enter-to-send, disabled for resolved/closed tickets. Back link to /dashboard/tickets.
[2026-05-28 16:00] | add | frontend/src/pages/admin/support/SupportPage.tsx | Admin support page with two tabs: Tickets (table with slide-over reply panel + status change dropdown) and Contact Messages (table with read/unread state, click to open detail modal with Reply via Email link). Badge counts show open tickets and unread messages.
[2026-05-28 16:00] | modify | frontend/src/pages/contact/ContactPage.tsx | Added "Submit Ticket" third tab (only visible to logged-in users). Ticket form: type dropdown, optional order ID, subject, message. On success shows confirmation with link to /dashboard/tickets.
[2026-05-28 16:00] | modify | frontend/src/App.tsx | Added routes: /dashboard/tickets, /dashboard/tickets/:ticketId, /admin/support.
[2026-05-28 16:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added HeadphonesIcon nav item for /admin/support (Support) between Routing and Settings.
[2026-05-28 16:00] | modify | frontend/src/pages/dashboard/DashboardLayout.tsx | Added Support nav item (Ticket icon) for /dashboard/tickets. On mount (and on route change) fetches GET /tickets to check for unread tickets and sets hasUnreadTicket state. Nav item shows a teal dot to the right when hasUnreadTicket is true. Mobile bottom nav shows dot badge on the icon. Clicking Support nav clears the dot immediately (optimistic).
[2026-05-28 16:00] | modify | backend/app/tickets/schemas.py | Added user_has_unread: bool to TicketResponse.
[2026-05-28 16:00] | modify | backend/app/tickets/repository.py | Added set_user_unread(ticket_id, value) method.
[2026-05-28 16:00] | modify | backend/app/tickets/router.py | GET /{ticket_id} now clears user_has_unread=False when the user opens a thread. POST /tickets sets user_has_unread=False on creation. _serialize includes user_has_unread.
[2026-05-28 16:00] | modify | backend/app/admin/support/router.py | admin_reply sets user_has_unread=True after appending admin message so the user sees a dot on that ticket.

[2026-05-28 17:00] | modify | backend/app/tickets/schemas.py | Added admin_has_unread: bool to TicketResponse (mirrors user_has_unread).
[2026-05-28 17:00] | modify | backend/app/tickets/repository.py | Added set_admin_unread(ticket_id, value) method.
[2026-05-28 17:00] | modify | backend/app/tickets/router.py | create_ticket sets admin_has_unread=True; reply_to_ticket sets admin_has_unread=True; _serialize includes admin_has_unread.
[2026-05-28 17:00] | modify | backend/app/admin/support/router.py | GET /tickets/{id} clears admin_has_unread=False when admin opens the thread.
[2026-05-28 17:00] | modify | frontend/src/pages/admin/support/SupportPage.tsx | Added admin_has_unread to TicketItem interface. Unread ticket rows get teal-50 background, teal dot, bold subject/email. Clicking a row clears unread optimistically. Tickets tab badge now shows "X new" in teal when there are unread tickets, falling back to open-count badge otherwise.
[2026-05-28 17:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added useLocation, useEffect, api, API_ENDPOINTS imports. Fetches GET /admin/support/tickets on every route change to check for admin_has_unread. Shows teal dot to the right of Support nav item when any unread ticket exists. Clicking Support nav clears the dot immediately (optimistic).

[2026-05-28 18:00] | fix | frontend/src/pages/admin/support/SupportPage.tsx | TicketPanel now fetches GET /admin/support/tickets/{id} on mount (keyed by ticket.id). This clears admin_has_unread on the server and calls onUpdate() with the fresh response, propagating the cleared flag back into SupportPage's tickets state. Root cause: the badge count was stuck and the nav dot never cleared because only an optimistic setTickets() was being done — the server flag was never cleared, so every re-fetch (route change, filter change) reverted the UI. Also removed the now-redundant optimistic clear from the row onClick.

[2026-05-28 19:00] | fix | frontend/src/pages/admin/AdminLayout.tsx, frontend/src/pages/admin/support/SupportPage.tsx, frontend/src/pages/dashboard/DashboardLayout.tsx, frontend/src/pages/dashboard/tickets/TicketThreadPage.tsx | Nav dot now clears instantly when the ticket is opened, not on the next route-change re-fetch. AdminLayout passes clearUnreadDot via Outlet context. SupportPage consumes it and calls clearUnreadDot() inside the setTickets updater when no unread tickets remain after onUpdate. DashboardLayout passes clearUnreadDot via Outlet context. TicketThreadPage calls clearUnreadDot() immediately after the ticket fetch resolves.

[2026-05-28 20:00] | fix | frontend/src/pages/admin/support/SupportPage.tsx | TicketPanel backdrop (fixed inset-0) now calls onClose on click. Inner panel div stops propagation so clicks inside the panel do not bubble to the backdrop.

[2026-05-29 00:00] | fix | frontend/src/store/useOrderStore.ts | Added Zustand persist middleware with sessionStorage backend, partializing to serviceOrder and categoryOrder only. Fixes checkout page redirecting to /services on page refresh — store now rehydrates from sessionStorage so order data survives a refresh but is cleared when the tab closes.

[2026-05-29 10:00] | add | frontend/src/components/common/route-scroll-reset.tsx, frontend/src/App.tsx | Added RouteScrollReset component that calls window.scrollTo(0, 0) on every pathname change via useLocation + useEffect. Rendered as sibling of Routes in App.tsx. Fixes all navigation buttons landing in the middle of destination pages.

[2026-05-29 11:00] | modify | frontend/src/pages/admin/settings/SettingsPage.tsx | Expanded general settings tab to full width (2-column grid). Added 4 new sections: Payment Methods (enable/disable Stripe/Cashfree/Cryptomus/Payeer toggles), Order Limits (min/max quantity), Email Notifications (new order/ticket toggles), Social Links (Twitter, Instagram, YouTube, Facebook). Added ToggleRow helper component. Extended PlatformSettings interface with new fields. Added helper set() utility to reduce repetition in onChange handlers.

[2026-05-29 12:00] | add | frontend/src/pages/auth/SuspendedPage.tsx | New suspended account page — shows ban icon, message, support link, and 'Sign in again' CTA that clears auth storage before navigating to /sign-in.
[2026-05-29 12:00] | modify | frontend/src/App.tsx | Added /suspended route (no Navbar/Footer).
[2026-05-29 12:00] | modify | frontend/src/lib/api.ts | Global 403 interceptor now checks detail.reason === 'suspended' — clears auth storage and hard-redirects to /suspended. Also fixed 401 handler to also clear user from localStorage.
[2026-05-29 12:00] | modify | frontend/src/pages/auth/SignInPage.tsx | Login 403 handler now checks reason === 'suspended' first and navigates to /suspended before falling through to the unverified-email OTP step.

[2026-05-29 12:30] | fix | frontend/src/context/AuthContext.tsx, frontend/src/lib/api.ts, frontend/src/pages/auth/SignInPage.tsx | Fixed suspended user not being redirected on refresh or re-login. Root cause 1: AuthContext mount only read localStorage without re-validating with backend — fixed by calling GET /auth/me on mount and checking is_suspended. Root cause 2: login() did not check is_suspended on the returned user object — fixed by checking before storing. Root cause 3: api.ts 403 check was too narrow (only matched {reason:'suspended'}) — broadened to also catch plain-string detail containing 'suspend'. SignInPage now silently ignores the suspended error thrown by login() since AuthContext already navigated away.

[2026-05-29 13:00] | fix | backend/app/user_management/schemas/auth_schemas.py, backend/app/user_management/services/auth_service.py, backend/app/user_management/services/profile_service.py | Root cause of suspended redirect not working: is_suspended was never included in UserPublic or ProfileResponse — frontend always received undefined. Fixed by adding is_suspended field to both schemas, passing it in all three UserPublic/ProfileResponse constructors, and adding a 403 suspension check in login() before the password check.

[2026-05-29 13:30] | fix | frontend/src/App.tsx, frontend/src/pages/auth/SuspendedPage.tsx, frontend/src/pages/auth/SignInPage.tsx, frontend/src/context/AuthContext.tsx | Added SuspensionGuard wrapping all Routes — any user with is_suspended:true is hard-redirected to /suspended regardless of which path they navigate to. Changed SuspendedPage contact link to mailto:support@buyrealviews.com. Removed frontend reason==='suspended' checks from SignInPage (backend 403 now shows detail.message directly). Removed dead suspended throw from AuthContext.login().

[2026-05-29 14:00] | fix | frontend/src/context/AuthContext.tsx | Suspended page refresh bug — root cause was validate() clearing the token on suspension, so on next refresh user=null and SuspensionGuard couldn't block. Fixed: validate() no longer clears token or navigates; it simply sets the user with whatever /auth/me returns (including is_suspended:true). SuspensionGuard is now the single authority for suspension redirects.
[2026-05-29 14:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Added auth guard: unauthenticated users are redirected to /sign-in before reaching checkout. This covers all Buy Now flows since every hero section converges on /checkout.

[2026-05-29 15:00] | modify | frontend/src/pages/checkout/StripeSuccess.tsx, frontend/src/pages/checkout/StripeCancel.tsx, frontend/src/pages/checkout/CheckStatus.tsx | Added auth guard to all three checkout result pages — unauthenticated users are redirected to /sign-in before any payment verification API calls are made.

[2026-05-29 16:00] | add | frontend/src/pages/admin/tasks/TasksPage.tsx | New admin Tasks page — tab-based filter (All/Manual/Pending/Processing/Success/Rejected/Error), error count badge, Order ID search, paginated table showing order details with status badges and refresh button. Reuses ADMIN_ORDERS endpoint with status_filter param.
[2026-05-29 16:00] | add | frontend/src/pages/admin/payments/PaymentsPage.tsx | New admin Payments page — Export CSV, Add Payment modal (user search, amount, credit/debit type, memo, status), Remove payment per row, method+status filters, search, paginated table with columns: ID (100001+), User, Balance, Amount (colored by credit/debit), Method, Status, Memo, Created. Uses new ADMIN_PAYMENTS endpoint.
[2026-05-29 16:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added Tasks (ListTodo) and Payments (CreditCard) nav items between Orders and Services.
[2026-05-29 16:00] | modify | frontend/src/App.tsx, frontend/src/config.ts | Added /admin/tasks and /admin/payments routes; added ADMIN_PAYMENTS endpoint constant.

[2026-05-29 16:30] | add | frontend/src/pages/admin/reports/ReportsPage.tsx | New admin Reports page — period selector (Today/Week/Month/Last 3 Months/Year/All Time), By Day/By Month toggle, 4 summary stat cards (Orders, Revenue, Profit, Tickets), 9 report tabs (Payments/Orders/Tickets/Ticket Replies/Profit/Charges/Quantity/Server Price/Refiller), data table with period rows + totals footer row, 3 secondary stat cards (Charges/Server Price/Refiller). Calls GET /admin/reports?period=&group_by= with graceful error state.
[2026-05-29 16:30] | modify | frontend/src/App.tsx, frontend/src/pages/admin/AdminLayout.tsx, frontend/src/config.ts | Added /admin/reports route, Reports nav item (BarChart3 icon), and ADMIN_REPORTS endpoint constant.

[2026-05-29 17:00] | add | frontend/src/components/common/notification-panel.tsx | New notification dropdown component — shows NotifItem list with type icons (ticket/reply), time-ago, click navigates to destination and removes item, Clear all button, empty state. Pure presentational — click-outside handled by parent.
[2026-05-29 17:00] | modify | frontend/src/components/navbar.tsx | Extended navbar to full screen width (removed container, uses px-4 sm:px-8). Added bell icon with red dot badge for unread notifications. Polls ADMIN_SUPPORT_TICKETS (admin) or TICKETS (user) every 30s for unread items. Dot clears when panel is opened (acknowledgedIds set). Click-outside handled via useRef+mousedown. Panel items navigate to destination on click and self-remove; Clear all empties list.
