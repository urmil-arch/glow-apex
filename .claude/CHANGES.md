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

[2026-05-30 10:00] | add | backend/app/orders/schemas.py, backend/app/orders/router.py, backend/app/orders/repository.py | Added POST /orders/stripe/initiate endpoint — validates service/qty, creates pending order in DB (status: pending_payment, payment_method: stripe), creates Stripe Checkout session, returns checkout_url. Added InitiateStripeOrderRequest and StripeInitiateResponse schemas. Added find_by_stripe_session() to repository. Added payment_method/payment_status fields to OrderResponse.
[2026-05-30 10:00] | modify | backend/app/payments/stripe/router.py | Implemented checkout.session.completed webhook — fetches pending order by client_reference_id, marks payment_status=paid, calls SMM provider via call_provider(), updates order with provider_order_id and status. Handles expired sessions (marks failed). Previously a stub.
[2026-05-30 10:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Replaced direct POST /orders with POST /orders/stripe/initiate → window.location.href = checkout_url. Both service and category flows now go through Stripe. Button label updated to 'Pay with Stripe'.
[2026-05-30 10:00] | modify | frontend/src/pages/dashboard/payments/PaymentsPage.tsx | Replaced all mock data with real API — fetches GET /orders, filters for payment_method !== 'direct', shows service name, amount, method badge, payment status badge, date.
[2026-05-30 10:00] | modify | frontend/src/types/index.ts, frontend/src/config.ts | Added payment_method and payment_status to UserOrder. Added ORDERS_STRIPE_INITIATE endpoint constant.

[2026-05-30 12:00] | add | backend/app/payments/ledger_repository.py | New PaymentLedgerRepository for separate 'payments' MongoDB collection. Methods: insert, find_by_id, find_by_order_id, find_by_user_id (paginated), find_all_admin (with method/status/search filters), update, update_by_order_id, delete.
[2026-05-30 12:00] | add | backend/app/payments/user_router.py | GET /payments — authenticated user's payment history from the payments collection. Serializes with display_id starting at 100001.
[2026-05-30 12:00] | add | backend/app/admin/payments/router.py, backend/app/admin/payments/schemas.py | Admin payments endpoints: GET /admin/payments (list all with filters), POST /admin/payments (manual payment), DELETE /admin/payments/{id}. Registered in admin/router.py.
[2026-05-30 12:00] | modify | backend/app/orders/router.py | initiate_stripe_order now creates a payment record in the payments collection after creating the pending order. Order doc is clean (no payment_method/stripe_session_id).
[2026-05-30 12:00] | modify | backend/app/payments/stripe/router.py | Webhook updates PaymentLedgerRepository instead of order document. Expired sessions also update payment record to failed.
[2026-05-30 12:00] | modify | backend/app/main.py, backend/app/app_components.py, backend/app/admin/router.py | Registered user_payments_router at /payments and admin payments router at /admin/payments. Added PaymentLedgerRepository.create_indexes() to lifespan.
[2026-05-30 12:00] | modify | frontend/src/pages/dashboard/payments/PaymentsPage.tsx, frontend/src/config.ts | User payments page now fetches from GET /payments (dedicated endpoint). Added USER_PAYMENTS constant.

[2026-06-02 00:00] | modify | backend/app/user_management/utils/otp.py | Added SMTP debug prints (SMTP_HOST, SMTP_PORT, SMTP_USER) and try/except around aiosmtplib.send() to expose SMTP errors in Render logs. Added timeout=30 to the send call. Temporary — remove once root cause is identified.

[2026-06-02 01:00] | modify | backend/app/user_management/utils/otp.py, backend/app/contact/utils.py, backend/app/common/config.py, backend/requirements.txt | Switched email delivery from aiosmtplib (SMTP) to Resend HTTP API. Root cause: Render blocks all outbound SMTP connections (port 587) at the network level — confirmed via socket.create_connection test returning errno 101. send_otp_email() and send_contact_emails() now call resend.Emails.send() via asyncio.to_thread(). SMTP code kept as commented-out block in both files for easy rollback. Added RESEND_API_KEY and RESEND_FROM to config.py; all SMTP_* settings preserved. aiosmtplib replaced by resend>=2.0.0 in requirements.txt (old line commented). Requires RESEND_API_KEY and RESEND_FROM in backend/.env.

[2026-06-02 02:00] | add | frontend/src/components/common/RaiseTicketModal.tsx | New shared ticket creation modal. Props: initialType (locks type field to order_related/payment_related), initialOrderId (locks order ID field, shown read-only), onClose, onSuccess. When props are omitted (TicketsPage usage), both fields are editable. Submits POST /tickets.
[2026-06-02 02:00] | modify | frontend/src/pages/dashboard/orders/OrderPage.tsx | Date column now shows date + time. Status mapped to 4 user-facing values (Payment Pending/Success/In Progress/Error) via mapOrderStatus(). Filter dropdown updated to match 4 statuses. StatusModal no longer shows Provider Order ID; status uses mapped value; Refill/Cancel disable on Error. Per-row action column adds "Raise Ticket" button (opens RaiseTicketModal pre-filled with order_related + order.id). Search no longer searches provider_order_id.
[2026-06-02 02:00] | modify | frontend/src/pages/dashboard/payments/PaymentsPage.tsx | ID column replaced display_id with last 8 chars of order_id. Column headers renamed: "Payment" → "Payment Status", "Order" → "Order Status". Order status badge uses same 4-value mapOrderStatus() mapping. Expanded row no longer shows provider_order_id. Per-row Raise Ticket button opens RaiseTicketModal pre-filled with payment_related + p.order_id. colSpan updated from 7 to 8 for new Action column.
[2026-06-02 02:00] | modify | frontend/src/pages/dashboard/tickets/TicketsPage.tsx | Replaced 60-line inline modal with shared RaiseTicketModal (no initialType/initialOrderId — editable). Removed unused axios, X, NewTicketForm, form, submitting, submitError, handleCreate.

[2026-06-02 03:00] | modify | backend/app/orders/schemas.py | Added category_name: str = "" to OrderResponse.
[2026-06-02 03:00] | modify | backend/app/orders/router.py | All three order creation paths now resolve and store category_name in the order document. place_order: looks up category via CategoryRepository.find_by_id(service.category_id). place_order_by_category: uses body.category_name directly. initiate_stripe_order: uses body.category_name if category path, else CategoryRepository.find_by_id for service_id path. category_name stored in order_doc and payment_doc. memo updated to use category_name. _serialize_order now includes category_name.
[2026-06-02 03:00] | modify | backend/app/payments/user_router.py | Added category_name to _serialize output from payment ledger document.
[2026-06-02 03:00] | modify | frontend/src/types/index.ts | Added category_name: string to UserOrder interface.
[2026-06-02 03:00] | modify | frontend/src/pages/dashboard/orders/OrderPage.tsx, frontend/src/pages/dashboard/payments/PaymentsPage.tsx | Service name display now uses category_name || service_name. Old records without category_name fall back to service_name.

[2026-06-02 04:00] | modify | backend/app/admin/orders/schemas.py | Added category_name, payment_method, payment_status to AdminOrderResponse (were missing — frontend already referenced them). Added ResendOrderRequest schema (provider_id, provider_service_id, quantity).
[2026-06-02 04:00] | modify | backend/app/admin/orders/router.py | Updated _serialize to include category_name, payment_method, payment_status. Added POST /{order_id}/resend endpoint — takes provider_id + provider_service_id + quantity, calls call_provider directly, updates order with new provider_id/provider_order_id/status=Pending.
[2026-06-02 04:00] | modify | frontend/src/pages/admin/orders/OrdersPage.tsx | Service column shows category_name || service_name. Status column uses mapAdminStatus() — friendly labels with error context (e.g. "Error: Payment Failed", "Error: Provider Unavailable"). Status filter dropdown shows friendly labels. Added Custom Resend action: provider dropdown → service dropdown (live from provider API) → quantity → POST resend. Detail modal shows both friendly status label and raw status for admin context.

[2026-06-02 05:00] | modify | frontend/src/pages/admin/payments/PaymentsPage.tsx | Replaced per-row trash button with portal action menu (MoreVertical). Menu items: Custom Resend (only shown when order_id exists) + Delete. Added Custom Resend modal identical to orders page: link read-only from order_link, provider dropdown, service search + scrollable list, quantity, sends POST /admin/orders/{order_id}/resend. Added order_id to Payment interface (already in API response, was missing from frontend type).

[2026-06-02 06:00] | modify | backend/app/admin/payments/schemas.py, backend/app/admin/payments/router.py | Added category_name to PaymentResponse schema and _serialize.
[2026-06-02 06:00] | modify | frontend/src/pages/admin/payments/PaymentsPage.tsx | Removed Custom Resend entirely. Reverted to simple trash button. ID column now shows last 8 chars of order_id (#XXXXXXXX). Service column shows category_name || service_name || memo. Order Status uses same mapOrderStatus() mapping as orders page. Date format fixed: month short + no seconds, matches orders page. Added category_name to Payment interface.

[2026-06-02 07:00] | add | backend/app/admin/pricing/ (schemas, repository, router), backend/app/public_pricing/router.py | New dynamic pricing system. Admin sets price_per_1000 + packages (quantity + optional discount: fixed $ or %) per service type. 7 service types: youtube_views, youtube_likes, youtube_subscribers, youtube_comments, youtube_shorts_views, youtube_shorts_likes, country_targeted_subscribers. Admin CRUD: PUT /admin/pricing/{service_type}. Public read: GET /pricing (no auth).
[2026-06-02 07:00] | modify | backend/app/app_components.py, backend/app/main.py | Registered admin_pricing_router at /admin/pricing and public_pricing_router at /pricing. Added PricingRepository.create_index() to lifespan.
[2026-06-02 07:00] | add | frontend/src/context/PricingContext.tsx | PricingProvider fetches GET /pricing on mount. Exposes getPricing(serviceType) and calcPackagePrice() helper (applies fixed/percentage discount). isLoading state exposed so hero sections can show spinner.
[2026-06-02 07:00] | add | frontend/src/components/sections/hero/DynamicPackageSelector.tsx | Shared form card component replacing all hardcoded package selectors. Reads from PricingContext by serviceType. Shows loading spinner, empty state, or quantity cards with calculated prices and discount badges. Buy Now → setCategoryOrder + navigate /checkout.
[2026-06-02 07:00] | add | frontend/src/pages/admin/pricing/PricingPage.tsx | Admin pricing management page. One ServiceCard per service type: active toggle, price_per_1000 input, package table (quantity + discount type + discount value + live calculated price preview + delete), add package row. Save per card via PUT /admin/pricing/{service_type}.
[2026-06-02 07:00] | modify | frontend/src/main.tsx | Wrapped App with PricingProvider.
[2026-06-02 07:00] | modify | frontend/src/App.tsx, frontend/src/pages/admin/AdminLayout.tsx | Added /admin/pricing route and Pricing nav item (DollarSign icon).
[2026-06-02 07:00] | modify | frontend/src/config.ts | Added ADMIN_PRICING and PUBLIC_PRICING endpoint constants.
[2026-06-02 07:00] | modify | frontend/src/components/sections/hero/service-selection-component.tsx | Replaced all package/price/currency logic with thin wrapper over DynamicPackageSelector. Maps short service keys (views, likes…) to backend service_type and categoryName.
[2026-06-02 07:00] | modify | frontend/src/components/sections/hero/youtube-views-hero.tsx, youtube-likes-hero.tsx, youtube-subscribers-hero-section.tsx, youtube-comments-hero.tsx, youtube-short-views-hero.tsx, youtube-shorts-likes-hero.tsx, country-targeted-subscribers-hero.tsx | All 7 hero sections stripped of servicesPackages/currency/state/functions. Left side (marketing content, features, animations) preserved. Right side replaced with DynamicPackageSelector.

[2026-06-02 08:00] | modify | backend/app/admin/pricing/schemas.py | Replaced single packages list with value_packages + bulk_packages in both ServicePricingRequest and ServicePricingResponse.
[2026-06-02 08:00] | modify | backend/app/admin/pricing/router.py, backend/app/public_pricing/router.py | Updated _serialize and upsert_pricing to read/write value_packages and bulk_packages.
[2026-06-02 08:00] | modify | frontend/src/context/PricingContext.tsx | Updated ServicePricing interface to value_packages + bulk_packages. calcPackagePrice() now takes a packageType param ("value"|"bulk") to look up the correct list.
[2026-06-02 08:00] | modify | frontend/src/components/sections/hero/DynamicPackageSelector.tsx | Added "Value Packages / Bulk Packages" toggle tab. Toggle only shown when both types have active packages. Switching tab resets selected quantity. Price/discount display and Buy Now all keyed to selected type. If only one type has packages, that type shows without toggle.
[2026-06-02 08:00] | modify | frontend/src/pages/admin/pricing/PricingPage.tsx | LocalConfig updated to value_packages + bulk_packages. Extracted PackageList sub-component handling one list type (table + add row + qty bounds validation). Each ServiceCard renders two PackageList sections (Value + Bulk) separated by a divider. allQuantities shared across both lists to prevent duplicate entries. Footer shows active count per type.

[2026-06-04 00:00] | fix | frontend/src/pages/admin/payments/PaymentsPage.tsx, frontend/src/pages/admin/orders/OrdersPage.tsx, frontend/src/pages/dashboard/orders/OrderPage.tsx, frontend/src/pages/dashboard/payments/PaymentsPage.tsx, frontend/src/pages/dashboard/tickets/TicketThreadPage.tsx | Fixed timezone display bug across all date-showing pages. Root cause: Python datetime.isoformat() returns strings without Z suffix (e.g. "2026-06-04T09:27:00") which browsers parse as local time instead of UTC, causing ~5.5h offset for IST users. Added toUtc() helper appending Z when no timezone indicator is present, wrapping every new Date() call.

[2026-06-04 01:00] | modify | frontend/src/pages/admin/pricing/PricingPage.tsx | Added min/max quantity bounds to PackageList add-package input. Fetches GET /admin/routing alongside pricing on mount; builds serviceMinMax map from routing config default service's min/max per service type. Passes minQty/maxQty to each ServiceCard → PackageList. addPackage blocks with inline red error if qty < min or qty > max. Valid range hint shown below input when bounds are known. Input turns red-bordered on error, clears on change.

[2026-06-04 02:00] | modify | frontend/src/pages/admin/orders/OrdersPage.tsx | Custom Resend service selector replaced native <select> with search input + scrollable div list. After provider is selected, all services show as clickable rows (ID, name, rate, min/max). Search filters by name or ID in real time. Selected service shown as teal chip with × to clear. Selecting a row clears the search and closes the list naturally. Reverted dropdown's size attribute which caused listbox mode (no auto-close).

[2026-06-04 03:00] | modify | frontend/src/pages/dashboard/tickets/TicketThreadPage.tsx | Full chat UI redesign. Messages render as bubbles: user=right/teal (rounded-br-none), admin=left/white (rounded-bl-none) with ShieldCheck avatar. Sender label + timestamp below each bubble. Chat area has bg-gray-50 background with border, fixed height (100vh-120px), scroll to bottom on new messages. System messages injected inline (not stored): after first user message → "Your request has been received…"; before first admin reply → "A support executive has joined…". Reply box redesigned with textarea + rounded send button. Removed handleReply/FormEvent — extracted submitReply() called from both form onSubmit and onKeyDown Enter.

[2026-06-04 04:00] | modify | frontend/src/pages/dashboard/orders/OrderPage.tsx | Error status no longer visible to users — mapOrderStatus() fallback changed from {label:"Error", key:"error"} to {label:"In Progress", key:"in_progress"}. Users only see Payment Pending, Success, or In Progress. Removed "Error" option from filter dropdown. Removed unused XCircle import.

[2026-06-04 05:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Full UI redesign.

[2026-06-04 06:00] | fix | backend/app/orders/router.py | initiate_stripe_order was charging users the SMM provider rate (service["rate"] × qty/1000) instead of the admin pricing page price. Root cause: the two prices are independent — admin_services.rate is what we pay the provider; service_pricing.price_per_1000 is what we charge users. Fix: added _calc_pricing_charge() helper that looks up the service_pricing collection by category → service_type key, finds the exact quantity package, applies any configured discount, and uses that as charge. Falls back to service rate only when no pricing package is configured. Added _CATEGORY_TO_SERVICE_TYPE mapping. Imported PricingRepository.

[2026-06-04 10:00] | fix | backend/app/payments/razorpay/router.py, backend/app/orders/pricing_utils.py, backend/app/orders/router.py | Razorpay orders had server_cost=0 in reports, used SMM service rate instead of admin pricing page price, and ignored personal discount. Root cause: create_razorpay_order was never updated when initiate_stripe_order received those fixes. Extracted _CATEGORY_TO_SERVICE_TYPE and _calc_pricing_charge into shared app/orders/pricing_utils.py. Razorpay router now applies admin pricing lookup, personal discount, stores server_cost and category_name in order_doc and payment ledger. orders/router.py updated to import from shared module.

[2026-06-04 09:00] | fix | backend/app/orders/router.py, backend/app/user_management/schemas/auth_schemas.py, backend/app/user_management/services/auth_service.py, backend/app/user_management/services/profile_service.py, frontend/src/context/AuthContext.tsx, frontend/src/pages/checkout/CheckoutPage.tsx | Personal discount not applied at checkout. Added personal_discount field to UserPublic and ProfileResponse schemas. Passed it from user doc in all auth/profile service constructors. In initiate_stripe_order: after computing base charge, applies user.personal_discount as charge × (1 - discount/100), logged with user info. Frontend: User type gains personal_discount?: number. Checkout summary shows "Personal Discount −X%" line when non-zero; finalCharge computed after discount.

[2026-06-04 08:00] | modify | backend/app/orders/router.py | All 3 order creation paths (place_order, place_order_by_category, initiate_stripe_order) now store server_cost = service["rate"] * quantity / 1000 in the order doc. server_cost = what we pay the SMM provider (provider rate); charge = what we bill the user (admin pricing page price for Stripe flow). These are now two distinct fields.
[2026-06-04 08:00] | modify | backend/app/admin/reports/router.py | Fixed revenue/profit logic. _agg_orders now sums server_cost field with $ifNull fallback. charges = sum(order.charge) = user billing. server_price = sum(order.server_cost) = provider cost. revenue = charges - server_price = our margin. profit = revenue (same, kept for API compat).
[2026-06-04 08:00] | modify | frontend/src/pages/admin/reports/ReportsPage.tsx | Profit tab: removed redundant Profit column — now shows Charges → Server Price → Revenue (margin). Summary cards: renamed Revenue card to show charges, revenue card now shows margin. Bottom stat cards updated with clarifying labels.

[2026-06-04 07:00] | add | backend/app/admin/reports/__init__.py, backend/app/admin/reports/router.py | Implemented GET /admin/reports?period=&group_by= endpoint. Runs 3 parallel MongoDB aggregations (orders, payments, tickets) grouped by day or month. Merges results by period key into ReportRow list. Fields: payments (count), revenue (sum of paid payment amounts), orders (count), quantity (sum), charges (sum of order.charge), profit (revenue - server_price), server_price (0 — not tracked per order), tickets (count), ticket_replies (sum of messages array lengths), refills/refill_quantity (0 — not tracked). Summary totals computed from rows. Period filters: today/week/month/3months/year/all.
[2026-06-04 06:00] | modify | backend/app/admin/router.py | Registered reports_router at /reports prefix. Category flow: package cards grid (Value=teal, Bulk=indigo) with discount badges and scale-on-select. Service flow: styled number input. Steps numbered 1-2-3 in separate white cards. Payment method cards with icon+color per gateway. Pay button shows price inline with Lock icon. Right panel: service badge, selected package highlight card, price breakdown with discount line, total, trust badges (Secure/Fast/Support). Background: soft teal-50 gradient. All logic preserved. Imports usePricing + calcPackagePrice from PricingContext. Builds PackageOption list from value_packages + bulk_packages for the selected service type (mapped via CATEGORY_TO_SERVICE_TYPE). Dropdown uses <optgroup> to separate Value / Bulk sections; each option shows "X,XXX units — $X.XX (Y% OFF)". Auto-selects package matching the hero-page quantity on load; falls back to first option. Summary panel shows package type, discount label, and exact calculated price. Falls back to static quantity display if no pricing is configured. Service flow (from /services page) unchanged.

[2026-06-08 10:00] | modify | frontend/src/components/sections/hero/DynamicPackageSelector.tsx | Removed discount label (e.g. "5% OFF") from inside quantity cards. Discount info already shown next to the price display below the cards — removed the duplicate that cluttered the selectors.

[2026-06-08 10:10] | modify | frontend/src/App.tsx, frontend/src/pages/admin/AdminLayout.tsx | Made Reports page the main admin dashboard. Index route at /admin now renders AdminReportsPage instead of AdminDashboard. Removed /admin/reports route (no duplicate). Removed "Reports" nav item from sidebar since Dashboard IS Reports. Removed unused AdminDashboard import and BarChart3 icon import.

[2026-06-08 10:20] | modify | frontend/src/pages/admin/reports/ReportsPage.tsx | Added welcome banner ("Welcome back, [name]") at the top of the page using useAuth. Changed default period from 'today' to 'all' so data is visible immediately on dashboard load.

[2026-06-08 10:30] | fix | frontend/src/components/navbar.tsx | Currency dropdown button turned blue when opened. Root cause: Radix MenubarTrigger applies a default highlight via data-[state=open]. Fix: added data-[state=open]:bg-emerald-700 data-[state=open]:text-white to the currency trigger className to preserve green color when dropdown is open.

[2026-06-08 10:35] | fix | frontend/src/components/navbar.tsx | Currency dropdown extended to the right of the screen. Fix: added align="end" to MenubarContent so it aligns its right edge with the trigger, and w-fit min-w-0 so it only takes as much width as the content needs.

[2026-06-08 10:40] | modify | frontend/src/components/navbar.tsx | "Other YouTube Services" dropdown changed from click-based (Radix Menubar) to hover-based (CSS group-hover). Replaced Menubar/MenubarMenu/MenubarTrigger/MenubarContent/MenubarItem with a relative li using Tailwind group class. Dropdown div uses hidden group-hover:block. Invisible bridge div between trigger and panel prevents the menu closing when moving the cursor down. Links use React Router Link instead of navigate().

[2026-06-08 10:50] | modify | frontend/src/components/common/boost-section.tsx | Added left/right arrow navigation buttons to the boost section carousel. Buttons are positioned absolutely on both sides of the card using ChevronLeft/ChevronRight icons. Auto-rotation and tab button navigation both preserved. Clicking an arrow calls handleSectionClick (same as tabs), which also pauses auto-rotation.

[2026-06-08 11:00] | fix | frontend/src/components/common/benefits-card.tsx | Background color flashed on first card before animation started. Root cause: animate={} (empty object) causes Framer Motion to strip initial styles and snap the element to its natural CSS state (opacity 1), making the white card background visible before inView fires. Fix: changed all animate fallbacks from {} to explicit initial values (e.g. { opacity: 0, y: 30 }) so the card stays fully invisible until the intersection observer triggers. Also corrected duration from 0.1 to 0.5 on the outer card.

[2026-06-08 11:10] | modify | frontend/src/components/common/purchase-flow.tsx | CTA button now always scrolls to page top (smooth) instead of navigating to /buy-youtube-views. Previously the button hardcoded navigation to a single URL regardless of which service page was active. Removed useNavigate and useLocation imports (now unused).

[2026-06-08 11:20] | fix | frontend/src/pages/auth/SignInPage.tsx | After successful login on the direct password path, non-admin users were redirected to "/" instead of "/dashboard". Fix: changed the navigate fallback from "/" to "/dashboard". Both the direct login path and the OTP verify path now consistently send admins to /admin and users to /dashboard.

[2026-06-08 11:30] | fix | frontend/src/pages/dashboard/orders/OrderPage.tsx | Search was broken — only matched service_name and link, not category_name (what is actually displayed) or order ID. Fix: search now checks (category_name || service_name) and the short order ID (id.slice(-8)) against the query.

[2026-06-08 11:35] | fix | frontend/src/pages/dashboard/orders/OrderPage.tsx, frontend/src/pages/dashboard/payments/PaymentsPage.tsx | Raise Ticket modal was receiving the full MongoDB ObjectId (e.g. "6a2171670273aa1d796339de") as the order ID. Fix: changed initialOrderId to use id.slice(-8) / order_id.slice(-8) to match the short ID shown in the list (e.g. "796339de").

[2026-06-08 00:00] | add | backend/app/admin/tasks/ (new module) | Task management system. TaskRepository with MongoDB collection admin_tasks, indexes on status/type/seen_by_admin/order_id. Schemas: TaskCreate, TaskUpdate, TaskResponse, TaskListResponse, UnreadCountResponse. Router endpoints: GET /admin/tasks (list + mark-all-seen), POST /admin/tasks (manual create), PATCH /admin/tasks/{id} (update status/priority/notes), GET /admin/tasks/unread-count (nav badge). Task types: failed_order, refund_request, manual. Statuses: open, in_progress, resolved.

[2026-06-08 00:00] | modify | backend/app/admin/router.py | Registered tasks_router at /admin/tasks prefix.

[2026-06-08 00:00] | modify | backend/app/main.py | Imported TaskRepository and called create_indexes() in lifespan to set up admin_tasks collection indexes on startup.

[2026-06-08 00:00] | modify | backend/app/orders/router.py | Added failed_order task auto-creation in get_order when provider status transitions to Failed (deduped by order_id). Added refund_request task auto-creation in cancel_order after provider confirms cancellation. Both use TaskRepository; UserRepository used to resolve user details for the task.

[2026-06-08 00:00] | modify | backend/app/admin/orders/router.py | Added failed_order task auto-creation in admin get_order when provider status transitions to Failed (deduped by order_id). Uses user_info from the aggregation join already present on the order document.

[2026-06-08 00:00] | modify | frontend/src/config.ts | Added ADMIN_TASKS and ADMIN_TASKS_UNREAD endpoint constants.

[2026-06-08 00:00] | modify | frontend/src/pages/admin/tasks/TasksPage.tsx | Full rewrite. Removed old SMM order list. New task management UI: tabs (All / Failed Orders / Refund Requests / Manual), task table with type/status/priority badges, AddTaskModal for manual creation, TaskDetailPanel for managing status + notes + priority. Resolved tasks rendered at 50% opacity. No search (tasks are low-volume operational items).

[2026-06-08 00:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added unread task badge on Tasks nav link — polls GET /admin/tasks/unread-count every 60s, resets to 0 when admin navigates to /admin/tasks. Badge shows red count bubble, capped at 99+.

[2026-06-08 00:00] | fix | backend/app/payments/stripe/router.py, backend/app/orders/router.py, backend/app/admin/orders/router.py | Failed order tasks not created for provider_error status. Root cause: (1) Stripe webhook set status to "provider_error" when all providers fail but never created a task. (2) get_order hooks only matched status == "failed" exactly, missing "provider_error" and any other error-like strings. Fix: added task creation directly in Stripe webhook `if not placed` block; introduced _is_error_status() helper (matches "fail", "error", "provider_error" substrings) in both get_order hooks; broadened task title to include actual status string.

[2026-06-08 00:00] | discovery | backend/app/payments/stripe/router.py | Status "provider_error" (set when all SMM providers fail after Stripe payment) was the actual status triggering the admin panel display. Previous task hook only checked for literal "failed" — "provider_error" never matched.

[2026-06-08 00:00] | fix | backend/app/payments/razorpay/router.py | Same provider_error gap as Stripe webhook — Razorpay verify_razorpay_payment set status to "provider_error" when all providers fail but never created a failed_order task. Added TaskRepository import and identical task creation block in the `if not placed:` branch. Confirmed only Razorpay and Stripe have SMM order placement logic; Cashfree/Cryptomus/Payeer do not.

[2026-06-08 18:00] | fix | frontend/src/pages/dashboard/orders/OrderPage.tsx | Cancelled orders now show a distinct grey 'Cancelled' badge instead of 'In Progress'. Added 'cancelled' to StatusKey type and mapOrderStatus handler. Added XCircle grey badge in getStatusBadge. Cancel button hidden when order.status === 'cancelled'. Added Cancelled filter option to status dropdown.

[2026-06-08 19:00] | fix | backend/app/orders/router.py, frontend/src/pages/dashboard/orders/OrderPage.tsx | User-side cancel flow: (1) mapOrderStatus now handles both 'Canceled' (provider spelling, one l) and 'Cancelled' (two l). Cancel button also hidden for 'canceled'. (2) get_order skips live provider sync when DB status is already cancelled/canceled/completed — prevents provider lag overwriting our confirmed cancel. Admin-side get_order unchanged (always live-syncs).

[2026-06-09 00:00] | fix | frontend/src/pages/admin/users/UsersPage.tsx | Login history timestamps were displaying in local time instead of IST. Root cause: Python datetime.isoformat() omits Z suffix — browser parsed as local time. Fix: added toUtc() helper (appends Z when no timezone indicator present); applied to fmt() date formatter and sign-in log timestamp display.

[2026-06-09 00:10] | modify | frontend/src/pages/contact/ContactPage.tsx | "Start Chat" button now navigates to /dashboard/tickets via Link component instead of dead href="#".

[2026-06-09 00:20] | modify | frontend/src/components/common/faq-section.tsx | "Live Support 24x7" button in FAQ section now navigates to /dashboard/tickets instead of "#".

[2026-06-09 01:00] | add | backend/app/blog/ (__init__.py, schemas.py, repository.py, router.py) | New dynamic blog module. BlogRepository stores posts in blog_posts MongoDB collection with indexes on slug (unique), (published, created_at), (category, published). public_router (no auth): GET /blogs (paginated, filter by category/search), GET /blogs/{slug}, GET /blogs/{slug}/related. admin_router (admin JWT): GET /admin/blogs, POST /admin/blogs, PATCH /admin/blogs/{id}, DELETE /admin/blogs/{id}. PATCH uses exclude_unset=True so only sent fields are updated.

[2026-06-09 01:10] | modify | backend/app/admin/router.py | Registered blog_admin_router at /admin/blogs prefix.

[2026-06-09 01:20] | modify | backend/app/app_components.py | Registered blog_public_router at /blogs prefix.

[2026-06-09 01:30] | modify | backend/app/main.py | Imported BlogRepository and added create_indexes() call in lifespan.

[2026-06-09 01:40] | modify | frontend/src/config.ts | Added ADMIN_BLOGS and PUBLIC_BLOGS endpoint constants.

[2026-06-09 02:00] | add | frontend/src/pages/admin/blogs/BlogsPage.tsx | Admin blog management page. Table lists all posts (title, slug, category, date, published/draft badge). "New Post" button opens a right-side form panel (drawer). Form fields: title, slug (auto-generated from title, editable), excerpt, content (large textarea), category, tags (comma-separated), author, read time, image URL, date, published toggle. Edit action re-opens form pre-filled. Delete action shows confirmation modal. Pagination for large lists. Calls PATCH with exclude_unset-compatible payload.

[2026-06-09 02:10] | modify | frontend/src/pages/blogs/AllBlogsPage.tsx | Replaced static blogPosts/blogCategories import with live API fetch from PUBLIC_BLOGS endpoint. Categories derived dynamically from fetched posts. Loading spinner shown while fetching. Same grid UI preserved. Handles empty state.

[2026-06-09 02:20] | modify | frontend/src/pages/blogs/BlogSlugPage.tsx | Replaced static getBlogPostBySlug/getRelatedPosts with API fetch: GET /blogs/{slug} for post, GET /blogs/{slug}/related for related posts. Loading and not-found states handled. Field names updated to match API (image_url, author_name, read_time vs old camelCase). Related posts use separate RelatedPost interface.

[2026-06-09 02:30] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added Newspaper icon import and Blogs nav item at /admin/blogs between Pricing and Settings.

[2026-06-09 02:40] | modify | frontend/src/App.tsx | Imported AdminBlogsPage and registered /admin/blogs route inside the admin guard.

[2026-06-09 04:00] | add | backend/app/user_management/utils/permissions.py | New RBAC permission module. Page permission keys (dashboard, users, orders, tasks, payments, services, routing, support, pricing, blogs, settings) and 6 roles (admin, user, operations_manager [SOM], support, accounts_manager, seo_manager). ROLE_PERMISSIONS matrix: admin + operations_manager get all pages (differ only in capabilities); support=orders/payments/support; accounts_manager=dashboard/orders/payments; seo_manager=blogs; user=none. effective_permissions(user) = role defaults UNION extra_permissions. is_full_admin(user) gates the two reserved capabilities (change roles, manage providers) to role==admin only.

[2026-06-09 04:05] | modify | backend/app/user_management/utils/dependencies.py | Added require_permission(key) dependency factory (403 if key not in effective_permissions) and require_admin_role (403 unless role==admin). get_current_admin retained for the admin health check. Since get_current_user re-fetches the user doc from Mongo every request, role/permission changes take effect immediately with no re-login.

[2026-06-09 04:10] | modify | backend/app/admin/{reports,orders,tasks,pricing,provider_config,support,services,settings,payments}/router.py, backend/app/blog/router.py | Replaced blanket get_current_admin guard with page-specific require_permission(...) on every admin sub-router (reports->dashboard, orders->orders, tasks->tasks, pricing->pricing, provider_config->routing, support->support, services->services, settings->settings, payments->payments, blog admin->blogs). Router-level guards swapped in the APIRouter(dependencies=[...]) call; endpoint-level guards swapped per endpoint.

[2026-06-09 04:15] | modify | backend/app/admin/providers/router.py | Provider GET endpoints (list/get/balance/services) require the settings permission (shown on the Settings page); create/update/delete require require_admin_role. This is how 'SOM can view but not change SMM providers' is enforced server-side.

[2026-06-09 04:20] | modify | backend/app/admin/users/router.py, backend/app/admin/users/schemas.py | Users router guarded by require_permission(users). Added PATCH /admin/users/{id}/role (require_admin_role): sets role + extra_permissions, keeps is_admin synced (role==admin), blocks self role change. AdminUserResponse now includes role + extra_permissions. New AdminUpdateRoleRequest validates role in ALL_ROLES and extra_permissions subset of ALL_PERMISSIONS. create_user now stores role (admin if is_admin else user) + extra_permissions.

[2026-06-09 04:25] | modify | backend/app/user_management/schemas/auth_schemas.py, backend/app/user_management/services/auth_service.py, backend/app/user_management/services/profile_service.py | UserPublic and ProfileResponse now carry role + effective permissions list. login/verify_otp/get_profile/update_profile populate them via effective_permissions(). register insert sets role=user, extra_permissions=[].

[2026-06-09 04:30] | modify | backend/app/user_management/repositories/user_repository.py, backend/app/main.py | Added update_role() and idempotent backfill_roles() (existing is_admin:true -> admin, else user; only touches docs missing a role). Lifespan calls backfill_roles() once on startup after create_indexes.

[2026-06-09 05:00] | add | frontend/src/config/permissions.ts | RBAC mirror of the backend: PERMISSIONS keys, ROLES, ROLE_LABELS, PERMISSION_LABELS, ROLE_DEFAULT_PERMISSIONS, ASSIGNABLE_ROLES, ADMIN_NAV_ORDER, and firstAllowedAdminPath(perms) which returns the landing path for a user's first held permission. Drives nav/route gating and the role UI only; backend remains the enforcement authority.

[2026-06-09 05:05] | modify | frontend/src/context/AuthContext.tsx | User interface gains role + permissions. Added hasPermission(key) to context (checks user.permissions). Login/verifyOtp/auth-me already persist the richer user object, so permissions flow through automatically.

[2026-06-09 05:10] | modify | frontend/src/components/admin/AdminGuard.tsx | Admin panel entry now allows any staff member (>=1 permission) instead of is_admin only. Per-page access is enforced by RequirePermission.

[2026-06-09 05:15] | add | frontend/src/components/admin/RequirePermission.tsx | Route wrapper that redirects users lacking a page permission to their first allowed admin page (firstAllowedAdminPath), or home if none.

[2026-06-09 05:20] | modify | frontend/src/App.tsx | Each /admin sub-route wrapped in RequirePermission with its page key. The index (dashboard) route redirects roles without dashboard access (support, seo) to their first allowed page.

[2026-06-09 05:25] | modify | frontend/src/pages/admin/AdminLayout.tsx | NAV_ITEMS tagged with perm keys; sidebar renders only items the user has permission for (visibleNav). Support-ticket and task-badge polling now gated by hasPermission so non-permitted roles do not fire 403 requests.

[2026-06-09 05:30] | modify | frontend/src/pages/auth/SignInPage.tsx | Post-login and post-OTP redirect now sends any staff (permissions.length > 0) to /admin, customers to /dashboard (was is_admin only, which excluded the new non-admin staff roles).

[2026-06-09 05:35] | modify | frontend/src/pages/admin/users/UsersPage.tsx | AdminUser gains role + extra_permissions. Status cell shows a role badge (teal for admin, indigo for other staff roles). New 'Change Role' action (visible only when the logged-in user's role is admin) opens RoleModal: role dropdown (ASSIGNABLE_ROLES) + page-access checkboxes where role-default pages are locked-on and extra grants are toggleable. Saves PATCH /admin/users/{id}/role with extra_permissions = checked pages beyond the role defaults.

[2026-06-09 05:40] | modify | frontend/src/pages/admin/settings/SettingsPage.tsx | Provider add/edit/delete controls gated behind canManageProviders (user.role === 'admin'). SOM and other staff with settings access can view providers and check balances but cannot mutate them; ProviderCard takes a canManage prop hiding its edit/delete buttons. Mirrors backend require_admin_role on provider mutations.

[2026-06-09 03:10] | modify | frontend/src/pages/blogs/AllBlogsPage.tsx, frontend/src/pages/blogs/BlogSlugPage.tsx | Blog cover images now fill their containers. Changed all three (list card header, detail hero, related cards) from h-XX w-auto object-contain (image sat small on a colored box) to w-full h-full object-cover. Containers already have fixed heights + overflow-hidden, so images cover-crop cleanly.

[2026-06-09 03:00] | fix | frontend/src/pages/blogs/BlogSlugPage.tsx, backend/app/blog/router.py, backend/app/blog/repository.py | BlogSlugPage crashed with "Cannot read properties of undefined (reading 'length')". Root cause: /blogs/{slug}/related returns a bare array (response_model=list[BlogResponse]) but the frontend read res.data.posts (undefined), so setRelated(undefined) made related.length throw. Fix: frontend reads relRes.data directly. Second bug: find_related filtered by a category query param the frontend never sent, so related posts were always empty — made the endpoint self-contained by deriving the post's category from the slug internally (dropped the category param in router + repository). Third: related fetch is now fire-and-forget with its own catch so a related-fetch failure no longer marks the post as Not Found. Pattern scan: AllBlogsPage and admin BlogsPage call list endpoints that genuinely return {posts,total,...} — res.data.posts correct there, no change.

[2026-06-09 06:00] | modify | frontend/src/components/common/boost-section.tsx | Moved carousel navigation arrows inside the card. Removed old absolute-outside positioning (-translate-x-4/translate-x-4) and white bg/shadow/border styling. Arrows now sit at left-4/right-4 top-1/2 inside the card's relative container, styled with text-emerald-400/70 hover:text-emerald-600 — no background, gradient-colored.

[2026-06-09 06:30] | modify | backend/app/user_management/repositories/user_repository.py | Added _TOTAL_SPENT_LOOKUP pipeline stages (shared constant). admin_list_users switched from find() cursor to $facet aggregation; $lookup joins payments where user_id matches and status="paid", $group sums amount → total_spent on each user doc. Added "paid" filter: pre-fetches distinct user_ids from payments.distinct("user_id", {status:"paid"}), converts to ObjectIds, restricts the users query — efficient index-backed lookup. admin_export_users also uses the lookup pipeline for CSV export.

[2026-06-09 06:30] | modify | backend/app/admin/users/schemas.py | Added total_spent: float = 0.0 to AdminUserResponse.

[2026-06-09 06:30] | modify | backend/app/admin/users/router.py | _user_to_response reads total_spent from user doc with float cast and 0.0 fallback.

[2026-06-09 06:30] | modify | frontend/src/pages/admin/users/UsersPage.tsx | Added total_spent: number to AdminUser interface. Added "Spent" column header and cell (shows $X.XX or — if zero). Added "paid" filter tab. toCSV includes total_spent_usd column. colspan updated 6→7 on loading/empty rows.

[2026-06-09 06:45] | modify | backend/app/user_management/repositories/user_repository.py, backend/app/admin/users/router.py, frontend/src/pages/admin/users/UsersPage.tsx | Replaced "paid" filter tab with ascending/descending sort on the Spent column. Backend admin_list_users accepts sort_by and sort_order params; when sort_by="total_spent" the spend lookup runs on all matching users before pagination for accurate cross-page ordering; otherwise lookup runs only on the current page. Router exposes sort_by/sort_order query params. Frontend: removed "paid" from FILTERS, added sortBy/sortOrder state, handleSpentSort toggles asc/desc, Spent column header is a clickable button showing a teal arrow when active or a faint arrow otherwise.

[2026-06-09 07:00] | modify | backend/app/admin/users/schemas.py, backend/app/admin/users/router.py, frontend/src/pages/admin/users/UsersPage.tsx | Add User form now includes role selector and page-access permissions. Backend: AdminCreateUserRequest replaces is_admin bool with role (validated against ALL_ROLES) + extra_permissions (validated against ALL_PERMISSIONS); create_user derives is_admin from role=="admin". Frontend: AddForm interface drops is_admin, adds role + extra_permissions; add modal replaces checkbox with role dropdown + permission checkboxes grid matching the Change Role modal UX; extra_permissions resets when role changes.

[2026-06-09 09:00] | modify | backend/app/admin/settings/schemas.py, backend/app/admin/settings/router.py | Settings overhaul: removed EUR currency option (now USD/INR only via Literal), removed order limits fields (min_order_quantity, max_order_quantity), removed email notification fields (notify_new_order, notify_new_ticket), removed Cashfree/Cryptomus/Payeer payment flags, added payment_razorpay_enabled, added social_twitter/instagram/youtube/facebook string fields. _merge_defaults updated to match new schema.

[2026-06-09 09:00] | add | backend/app/public_settings/__init__.py, backend/app/public_settings/router.py | New unauthenticated GET /settings endpoint returning maintenance_mode, payment_stripe_enabled, payment_razorpay_enabled, and social link fields. Used by frontend footer (social links) and checkout (payment method gating) without requiring auth.

[2026-06-09 09:00] | modify | backend/app/app_components.py | Registered public_settings_router at prefix /settings.

[2026-06-09 09:00] | modify | frontend/src/config.ts | Added PUBLIC_SETTINGS endpoint constant.

[2026-06-09 09:00] | add | frontend/src/pages/MaintenancePage.tsx | Full-screen maintenance page: amber Wrench icon, pulsing status dot, site logo, copy explaining downtime. No navigation links.

[2026-06-09 09:00] | modify | frontend/src/pages/admin/settings/SettingsPage.tsx | General tab overhauled: removed Order Limits card, removed Email Notifications card. Currency card now 2-button grid (USD/INR only). Payment Methods card shows only Stripe + Razorpay toggles with a "all methods off" warning banner when both are disabled. Social Links card subtitle updated. Maintenance Mode description updated to clarify admins bypass.

[2026-06-09 09:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Fetches public settings on mount. Payment method buttons are conditionally rendered based on payment_stripe_enabled / payment_razorpay_enabled flags. If a single method is active the grid becomes single-column. If both are off the entire payment step shows a "payment unavailable" banner instead of buttons. Auto-selects first available method when settings load and current selection is disabled.

[2026-06-09 09:00] | modify | frontend/src/components/footer.tsx | Fetches public settings on mount. Renders a social links row (Twitter/X, Instagram, YouTube, Facebook) below the footer grid if any social_* field is non-empty. Icons are inline SVGs to avoid deprecated lucide-react brand icon imports.

[2026-06-09 09:00] | modify | frontend/src/App.tsx | Added MaintenancePage import. Added MaintenanceGuard component: fetches public settings once on mount, redirects non-admin users to /maintenance if maintenance_mode is true; exempt paths: /maintenance, /sign-in, /sign-up, /suspended. Added /maintenance route. MaintenanceGuard wraps SuspensionGuard inside AuthProvider so both guards share the same auth context.

[2026-06-10 00:00] | add | backend/app/user_management/schemas/auth_schemas.py | Added GoogleAuthRequest schema with a single `credential` field (Google id_token).

[2026-06-10 00:00] | modify | backend/app/user_management/repositories/user_repository.py | Added find_by_google_id() and insert_google_user() methods for Google OAuth user storage.

[2026-06-10 00:00] | modify | backend/app/user_management/services/auth_service.py | Added google_auth() method: verifies Google id_token via Google tokeninfo API, creates verified user on first login (auth_provider="google", is_verified=True, no password), finds returning user by google_id. Added _verify_google_token() helper and _generate_unique_username() helper. Updated login() to detect google-only accounts (auth_provider="google") and raise 403 with reason="google_login_required" before attempting password verification.

[2026-06-10 00:00] | modify | backend/app/user_management/routers/auth_router.py | Added POST /auth/google endpoint that calls service.google_auth().

[2026-06-10 00:00] | modify | backend/app/common/config.py | Added GOOGLE_CLIENT_ID setting.

[2026-06-10 00:00] | modify | frontend/src/config.ts | Added AUTH_GOOGLE endpoint constant.

[2026-06-10 00:00] | modify | frontend/src/main.tsx | Wrapped app with GoogleOAuthProvider using VITE_GOOGLE_CLIENT_ID.

[2026-06-10 00:00] | modify | frontend/src/context/AuthContext.tsx | Added googleAuth(credential) function: POSTs id_token to /auth/google, stores JWT and user in localStorage, returns User.

[2026-06-10 00:00] | modify | frontend/src/pages/auth/SignInPage.tsx | Added Google Sign-In button (GoogleLogin component from @react-oauth/google) below the submit button with an "or continue with" divider. Added handleGoogleSuccess() which calls googleAuth() and redirects. Added error handling for reason="google_login_required" (show inline message) and reason="password_login_required" (show inline message).

[2026-06-10 00:01] | modify | backend/requirements.txt | Replaced resend>=2.0.0 with aiosmtplib>=3.0.0.

[2026-06-10 00:01] | modify | backend/app/user_management/utils/otp.py | Switched send_otp_email() from Resend to aiosmtplib SMTP (was previously the commented-out fallback). Removed resend import.

[2026-06-10 00:01] | modify | backend/app/contact/utils.py | Rewrote send_contact_emails() to use aiosmtplib SMTP instead of Resend. Added _smtp_send() helper to avoid duplicating connection params. CONTACT_OWNER_EMAIL fallback now uses SMTP_FROM instead of RESEND_FROM. Removed resend import.

[2026-06-10 00:01] | modify | backend/app/common/config.py | Removed RESEND_API_KEY and RESEND_FROM fields (dead code). Updated CONTACT_OWNER_EMAIL comment to reference SMTP_FROM.

[2026-06-10 13:00] | modify | backend/app/admin/users/router.py | Restricted Senior Operations Manager (operations_manager role) from mutating user records. Changed Depends from require_permission(PERM_USERS) to require_admin_role on: export_users, create_user, update_user, set_password, toggle_suspend. Read-only endpoints (list_users, get_user, get_stats, get_sign_in_history) still use require_permission(PERM_USERS) so SOM can view the list and sign-in history.

[2026-06-10 13:00] | modify | frontend/src/pages/admin/users/UsersPage.tsx | Added isSOM flag (role === 'operations_manager'). When isSOM: toolbar hides Export Emails, Export Users, and Add User buttons; per-row action menu shows only Sign-in History (Edit, Set Password, Change Role, and Suspend/Unsuspend are hidden). Non-SOM behavior unchanged.

[2026-06-11 00:00] | add | backend/app/common/redis_cache.py | New shared Redis cache utility. Defines cache key constants (CACHE_SERVICES, CACHE_CATEGORIES, CACHE_PRICING, CACHE_ROUTING, CACHE_PUBLIC_SERVICES) with TTLs (2–10 min) and three helpers: cache_get (read-through, fail-open), cache_set, cache_delete. All errors are caught and logged as warnings so cache failures never break the app.

[2026-06-11 00:00] | modify | backend/app/main.py | Added shared aioredis connection pool (max_connections=20) initialised in lifespan and stored as app.state.redis. Pool is cleanly closed on shutdown before MongoDB client.

[2026-06-11 00:00] | modify | backend/app/admin/services/router.py | Two improvements: (1) Eliminated N+1 query problem in list_services — new _build_service_responses fetches all providers and categories in one query each (3 total vs 2N+1 before). (2) Added Redis read-through cache on list_categories (TTL 10 min) and list_services (TTL 5 min). Cache is invalidated on create/update/delete for both categories and services. CACHE_PUBLIC_SERVICES is also invalidated on service and category mutation.

[2026-06-11 00:00] | modify | backend/app/admin/pricing/router.py | Added Redis read-through cache on list_pricing (TTL 5 min). Cache invalidated on upsert_pricing.

[2026-06-11 00:00] | modify | backend/app/admin/provider_config/router.py | Added Redis read-through cache on list_routing_configs (TTL 5 min). Cache invalidated on upsert_routing_config and delete_routing_config. CACHE_PUBLIC_SERVICES also invalidated on routing changes.

[2026-06-11 00:00] | modify | backend/app/public_services/router.py | Added Redis read-through cache (TTL 2 min). Cache is invalidated by the admin services and routing routers when data changes — no write operations in this router itself.

[2026-06-11 00:00] | modify | backend/app/contact/router.py | Replaced per-request Redis connection (get_redis generator + aioredis.from_url per call) with app.state.redis from the shared pool. Removed AsyncGenerator import and settings import (no longer needed). Rate limiting behaviour unchanged.

[2026-06-11 00:00] | modify | backend/Dockerfile | Production-ready: removed --reload dev flag, switched to uvicorn with --workers 2, added non-root appuser for container security.

[2026-06-11 00:00] | modify | frontend/nginx.conf | Added gzip compression for JS/CSS/JSON/SVG/fonts. Added Cache-Control: immutable for /assets/ (Vite-fingerprinted). Added no-cache for index.html so browsers revalidate on deploy. SPA try_files fallback preserved.

[2026-06-11 00:00] | modify | nginx/nginx.conf | Full production rewrite: proxy_buffer sizes for large API responses, /api/ location strips prefix and proxies to backend:8000 with X-Forwarded headers, 120s read timeout for payment/SMM calls, proxy_request_buffering off (required for Stripe/Razorpay webhook raw body). / proxies to frontend:80. HTTP only (Cloudflare handles SSL).

[2026-06-11 00:00] | modify | docker-compose.prod.yml | Removed hardcoded IP 100.79.26.55. Added healthchecks on all 4 services (mongo/redis/backend/frontend). backend/frontend health conditions used in depends_on. Added redis_data named volume for persistence. MONGODB_URI/REDIS_URL overridden in environment section; BACKEND_BASE_URL/FRONTEND_ORIGIN come from backend/.env.

[2026-06-11 00:00] | add | backend/.env.example | All backend env vars with placeholder values and inline documentation. Covers app URLs, infrastructure, JWT, encryption, SMTP, Google OAuth, SMM panel, and all 5 payment gateways.

[2026-06-11 00:00] | add | frontend/.env.production.example | Production frontend env template: VITE_API_BASE_URL, VITE_STRIPE_PUBLISHABLE_KEY, VITE_GOOGLE_CLIENT_ID. Includes commented Cloudflare domain variant.

[2026-06-11 00:00] | add | DEPLOYMENT.md | Complete deployment guide: Docker install, env file setup, build commands, health verification, webhook URLs for all 5 gateways, Cloudflare migration steps (3 var changes + 1 rebuild command), rollback procedure, common issues.

[2026-06-12 00:00] | add | backend/app/checkout/schemas.py, backend/app/checkout/router.py | New checkout portal module: POST /checkout/init (JWT-required) creates a pending order + payment session and returns a 15-min signed token; GET /checkout/session/{token} returns session data to D2 without JWT; POST /checkout/verify/razorpay processes Razorpay payment via token instead of JWT and places the SMM order. Token stored in Redis under checkout:portal:{token}.

[2026-06-12 00:00] | modify | backend/app/common/config.py | Added GLOWAPEX_ORIGIN setting (default http://localhost:3001) for cross-domain CORS and Stripe/Razorpay return URL construction.

[2026-06-12 00:00] | modify | backend/app/app_components.py, backend/app/main.py | Registered checkout router at /checkout prefix; added GLOWAPEX_ORIGIN to CORS allow_origins list.

[2026-06-12 00:00] | modify | backend/.env.example | Added GLOWAPEX_ORIGIN placeholder with IP-based and Cloudflare variants.

[2026-06-12 00:00] | modify | frontend/src/config.ts | Added CHECKOUT_INIT constant (POST /checkout/init) and exported GLOWAPEX_CHECKOUT_URL derived from VITE_GLOWAPEX_URL env var.

[2026-06-12 00:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Replaced handleStripe/handleRazorpay direct payment calls with redirectToGlowApex() which calls POST /checkout/init, then redirects to D2/checkout?token=xxx. Removed Razorpay modal from D1 — payment is now handled entirely on D2.

[2026-06-12 00:00] | modify | frontend/.env.production.example | Added VITE_GLOWAPEX_URL placeholder.

[2026-06-12 00:00] | add | glowapex/src/lib/api.ts | Axios instance pointing at VITE_API_BASE_URL (D1 backend).

[2026-06-12 00:00] | add | glowapex/src/pages/Checkout/index.tsx | Payment portal page: reads token from URL, fetches session from D1, shows order summary, handles Stripe redirect and Razorpay modal, calls POST /checkout/verify/razorpay on success.

[2026-06-12 00:00] | add | glowapex/src/pages/CheckoutSuccess.tsx | Post-Stripe payment confirmation page: verifies via GET /payments/stripe/verify, shows success/failure state, redirects to D1 dashboard.

[2026-06-12 00:00] | add | glowapex/src/pages/CheckoutCancel.tsx | Cancelled payment page with link back to D1 store.

[2026-06-12 00:00] | modify | glowapex/src/App.tsx | Restructured into MainLayout (Navbar+Footer) and standalone checkout routes. /checkout, /checkout/success, /checkout/cancel render without Navbar/Footer.

[2026-06-12 00:00] | add | glowapex/.env.production.example | VITE_API_BASE_URL (D1 backend) and VITE_D1_URL (D1 frontend for redirect) with Cloudflare variants.

[2026-06-12 00:00] | add | glowapex/Dockerfile | Multi-stage build (dev/build/prod) identical to frontend/Dockerfile.

[2026-06-12 00:00] | add | glowapex/nginx.conf | SPA nginx config identical to frontend/nginx.conf.

[2026-06-12 00:00] | modify | docker-compose.prod.yml | Added glowapex service on port 3001:80 with healthcheck.

[2026-06-12 00:00] | discovery | backend/app/payments/stripe/router.py, backend/app/payments/razorpay/router.py, backend/app/checkout/router.py | SMM order placement logic (iterate candidates, call_provider, fallback, create failed_order task) is duplicated across 3 files. Should be extracted to a shared utility in a future refactor.

[2026-06-12 01:00] | add | frontend/src/glowapex/ | Merged Glow Apex frontend into frontend/ codebase. Created frontend/src/glowapex/{App.tsx,lib/api.ts,components/{AnimatedCounter,Navbar,Footer}.tsx,pages/{Home/index,About,Services,Contact,Checkout/index,CheckoutSuccess,CheckoutCancel}.tsx}. Hostname detection in main.tsx renders GlowApexApp when port===3001 or hostname===glowapex.com; otherwise renders BuyRealViewsApp. Both brands share one build and one Docker container.

[2026-06-12 01:00] | modify | frontend/src/main.tsx | Added isGlowApex hostname/port detection. BrowserRouter moved to main.tsx so both apps share it. GlowApexApp renders standalone (no GoogleOAuthProvider/PricingProvider); BuyRealViewsApp keeps existing providers.

[2026-06-12 01:00] | modify | frontend/src/index.css | Added Glow Apex shared utilities: .gradient-text, .glass, .glass-hover, .emerald-glow under @layer utilities.

[2026-06-12 01:00] | modify | frontend/package.json | Added @hookform/resolvers, react-hook-form, zod (needed by Glow Apex Contact page). Added dev:glowapex script (vite --port 3001) for local Glow Apex dev.

[2026-06-12 01:00] | modify | docker-compose.prod.yml | Removed separate glowapex service. Added port 3001:3001 to nginx service — nginx now serves Glow Apex on 3001 from the same frontend container.

[2026-06-12 01:00] | modify | nginx/nginx.conf | Added second server block on port 3001 — identical proxy config to port 80, pointing to same frontend:80 container. Browser window.location.port===3001 triggers GlowApexApp in React.

[2026-06-12 01:00] | modify | frontend/.env.production | Added VITE_D1_URL=http://100.69.104.64 — used by Glow Apex checkout pages to link back to BuyRealViews after payment.

[2026-06-12 01:05] | delete | glowapex/ | Removed entire glowapex/ project folder. All source merged into frontend/src/glowapex/. Dockerfile, nginx.conf, package.json, and all source files are no longer needed.

[2026-06-12 02:00] | add | backend/app/checkout/schemas.py | Added PreAuthRequest, PreAuthResponse, PreAuthInfo, InitWithPreAuthRequest schemas to support the cross-domain pre-auth checkout flow.

[2026-06-12 02:00] | refactor | backend/app/checkout/router.py | Extracted _create_checkout_session() helper so /init and /init-with-pre-auth share one implementation. Added POST /checkout/pre-auth (JWT required — creates short-lived Redis token with user+service context), GET /checkout/pre-auth/{token} (no auth — returns service info for GA form), POST /checkout/init-with-pre-auth (no JWT — validates pre-auth token and creates payment session). Pre-auth token is single-use and deleted after session creation.

[2026-06-12 02:00] | modify | frontend/src/config.ts | Added CHECKOUT_PRE_AUTH and CHECKOUT_INIT_WITH_PRE_AUTH endpoint constants.

[2026-06-12 02:00] | modify | frontend/src/pages/services/ServicesListPage.tsx | handleOrderNow now calls POST /checkout/pre-auth (JWT, via BRV api instance) and redirects window.location.href to GLOWAPEX_CHECKOUT_URL?pre_auth=xxx. Removed useOrderStore dependency. Button shows spinner while redirecting.

[2026-06-12 02:00] | modify | frontend/src/pages/services/ServiceDetail.tsx | handleSubmit now calls POST /checkout/pre-auth and redirects to GA checkout with ?pre_auth=xxx&link=url&qty=N URL params so GA can pre-fill the form. Removed setOrderData usage; kept storeSelectedPackage/clearSelectedPackage for pre-selection logic. Removed unused OrderDataItem interface.

[2026-06-12 02:00] | modify | frontend/src/glowapex/pages/Checkout/index.tsx | Replaced minimal payment-card portal with a two-mode checkout: (1) FormMode — reads ?pre_auth=xxx, fetches service info from GET /checkout/pre-auth/{token}, shows quantity input, YouTube link, payment method cards; on submit calls POST /checkout/init-with-pre-auth and transitions to SessionMode. (2) SessionMode (backward compat) — reads ?token=xxx, fetches session data, shows pay button with Stripe redirect or Razorpay modal. Existing verify/razorpay flow unchanged.

[2026-06-12 02:10] | modify | frontend/src/App.tsx | Removed /checkout route and CheckoutPage import. BRV no longer serves the checkout form — all checkout now happens on Glow Apex (port 3001).

[2026-06-12 03:00] | modify | frontend/src/App.tsx | Reverted: restored CheckoutPage import and /checkout route. Architecture returned to: BRV hosts the full checkout form, GA only handles the payment step (?token= portal). Removed CheckoutRedirect component.

[2026-06-12 03:00] | modify | frontend/src/pages/services/ServicesListPage.tsx | Reverted: handleOrderNow uses setServiceOrder + navigate('/checkout') again. Pre-auth API call removed.

[2026-06-12 03:00] | modify | frontend/src/pages/services/ServiceDetail.tsx | Reverted: handleSubmit uses setOrderData + navigate('/checkout') again. OrderDataItem interface restored. Pre-auth API call removed.

[2026-06-12 03:00] | modify | frontend/src/glowapex/pages/Checkout/index.tsx | Reverted: removed FormMode and GuestMode. GA checkout is now the simple token-only payment portal (?token=xxx → fetch session → pay button).

[2026-06-12 04:00] | modify | frontend/src/glowapex/App.tsx | Moved /checkout, /checkout/success, /checkout/cancel routes inside AnimatedRoutes so they render within MainLayout (Navbar + Footer + dotted background). Removed standalone route block.

[2026-06-12 04:00] | modify | frontend/src/glowapex/pages/Checkout/index.tsx | Redesigned as a full page (no standalone full-screen wrapper). Now has a hero section (pt-36), page heading matching Contact/About style, and payment card using the glass class. Removed GlowApexLogo and fixed inset glow overlay (MainLayout owns those). ErrorPage and SessionPage renamed from ErrorScreen/SessionMode to reflect page-level components.

[2026-06-12 04:00] | modify | frontend/src/glowapex/pages/CheckoutSuccess.tsx | Same redesign: removed standalone full-screen wrapper and GA logo. Now a proper page with hero heading and a glass card status display.

[2026-06-12 04:00] | modify | frontend/src/glowapex/pages/CheckoutCancel.tsx | Same redesign: removed standalone full-screen wrapper and GA logo. Now a proper page with hero heading and glass card.

[2026-06-12 00:00] | delete | frontend/src/pages/services/ServicesListPage.tsx | Removed ServicesListPage from BRV site. File deleted.
[2026-06-12 00:00] | modify | frontend/src/App.tsx | Removed commented-out ServicesListPage import and /services route.
[2026-06-12 00:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Removed redirect guard useEffect that navigated to /services when no order data; simplified back button to always navigate(-1) instead of falling back to /services.
[2026-06-12 00:00] | modify | frontend/src/pages/dashboard/orders/OrderPage.tsx | Removed Link to /services in the empty-orders state; replaced with plain "No orders yet." text.

[2026-06-15 00:00] | refactor | backend/app/orders/fulfillment.py (new), backend/app/payments/stripe/router.py, backend/app/checkout/router.py | Extracted place_smm_order() shared helper (provider resolution via routing config, default+fallback attempts, order update, failed_order task on total failure). Replaced two duplicated copies of this logic — the Stripe webhook and the Razorpay verify-via-token endpoint — with calls to the helper. Removed now-unused imports (ProviderRepository, TaskRepository, RoutingConfigRepository, ServiceRepository, call_provider, datetime) from both routers.

[2026-06-15 00:00] | add | backend/app/common/config.py, backend/app/main.py | Added ALLOWED_RETURN_ORIGINS setting + allowed_return_origins/cors_origins computed properties; CORS allow_origins now built from settings.cors_origins (stores + portal) instead of the two hardcoded origins. Added CRYPTOMUS_DEFAULT_CURRENCY (USDT) and CRYPTOMUS_DEFAULT_NETWORK (tron) for inline crypto payments.

[2026-06-15 00:00] | modify | backend/app/checkout/schemas.py, backend/app/checkout/router.py | Cross-domain 3-store support. Added return_origin to CheckoutInitRequest/GuestInitRequest/InitWithPreAuthRequest and to CheckoutSessionData; added "cryptomus" to all payment_method validators; added cryptomus_* invoice fields to CheckoutSessionData; added CryptomusVerifyViaTokenRequest. _create_checkout_session now validates return_origin against the allowlist (open-redirect guard via _validated_return_origin), persists it on the order doc + session data, and has a cryptomus branch that creates a Cryptomus invoice (single coin/network) for inline on-store payment. Stripe success/cancel URLs now carry the validated origin so the portal bounces back to the correct store. Added POST /checkout/verify/cryptomus token endpoint that polls invoice status and places the SMM order (claim-guarded) on PAID.

[2026-06-15 00:00] | fix | backend/app/payments/cryptomus/router.py | Cryptomus webhook was a stub (TODO). Now on a PAID status it atomically claims the payment, marks the order paid, and places the SMM order via the shared helper. Claim guard makes it idempotent with the store's status poll — the order is never placed twice.

[2026-06-15 00:00] | add | backend/app/admin/settings/schemas.py, backend/app/admin/settings/router.py, backend/app/public_settings/router.py | Added payment_cryptomus_enabled flag (default true) to platform settings, admin update, and public settings response so the store can show/hide the crypto method.

[2026-06-15 00:00] | add | frontend/src/pages/checkout/CryptomusInlinePayment.tsx (new) | Inline crypto payment view rendered on the store (no redirect). Loads the invoice via GET /checkout/session/{token}, shows exact amount + wallet address (copy) + network + expiry countdown, polls POST /checkout/verify/cryptomus, and on PAID navigates to the dashboard. Falls back to the hosted Cryptomus invoice link for QR/wallet-connect.

[2026-06-15 00:00] | modify | frontend/src/config.ts, frontend/src/pages/checkout/CheckoutPage.tsx | Added CHECKOUT_SESSION and CHECKOUT_VERIFY_CRYPTOMUS endpoints. CheckoutPage now supports the "cryptomus" method (third payment option, dynamic method grid, payment_cryptomus_enabled gating), sends return_origin=window.location.origin on init for stripe/razorpay (portal bounce target), and renders CryptomusInlinePayment inline for crypto.

[2026-06-15 00:00] | modify | frontend/src/App.tsx | Added RootLanding component: buyrealviews.com lands on the Views page, buyrealsubscribers.com on the Subscribers page, all other hosts on Home. Root route now uses RootLanding instead of HomePage.

[2026-06-15 00:00] | add | frontend/src/glowapex/lib/returnOrigin.ts (new) | Helper to resolve the per-session return origin (from ?origin query for Stripe or session.return_origin for Razorpay, with VITE_D1_URL fallback) and a store-name lookup for portal copy.

[2026-06-15 00:00] | modify | frontend/src/glowapex/pages/Checkout/index.tsx, frontend/src/glowapex/pages/CheckoutSuccess.tsx, frontend/src/glowapex/pages/CheckoutCancel.tsx | Portal now bounces the user back to the originating store using the per-session return origin instead of a single baked VITE_D1_URL, and shows the dynamic store name ("Redirected from X", "Back to X Store") instead of hardcoded BuyRealViews.

[2026-06-15 00:00] | modify | frontend/src/pages/admin/settings/SettingsPage.tsx | Added Crypto (Cryptomus) toggle to the admin Payment Methods card; updated the all-off warning to include cryptomus.

[2026-06-15 00:00] | discovery | backend/app/payments/stripe/router.py, backend/app/checkout/router.py, backend/app/payments/cryptomus/router.py | The SMM provider-placement+fallback logic was duplicated verbatim in the Stripe webhook and the Razorpay verify endpoint; the Cryptomus webhook was a stub that never placed orders. Consolidated into orders/fulfillment.place_smm_order and wired all three gateways through it.

[2026-06-15 10:00] | fix | frontend/src/pages/checkout/CheckoutPage.tsx | Removed unused variables left from previous session's blank-page fix: clearServiceOrder, clearCategoryOrder from useOrderStore destructure; paymentSucceeded ref; useRef from React imports.

[2026-06-15 10:10] | modify | frontend/src/glowapex/pages/CheckoutSuccess.tsx | Full redesign: rewritten as a centered min-h-screen flex layout with ambient emerald glow backdrop. Animated CheckCircle icon (spring) with Sparkles corner accent, pulsing "Payment Confirmed" badge, progress bar filling 0→100% over REDIRECT_MS (4000ms), and manual "Go to dashboard now" CTA. Reads VITE_D1_URL env var for redirect target.

[2026-06-15 10:20] | add | frontend/src/components/common/AdminFAB.tsx | New floating action button rendered at bottom-right of every page. Visible only to staff (is_admin or permissions.length > 0). Links to /admin. Hover tooltip "Admin Panel" revealed via Tailwind group/group-hover (slides in from right with opacity transition).

[2026-06-15 10:30] | modify | frontend/src/App.tsx | Added AdminFAB alongside RouteScrollReset so it appears on all pages. Fixed SuspensionGuard: added `&& user && !user.is_suspended` condition so unauthenticated users (login failed for suspended account) can reach /suspended without being redirected. Added AdminOnlyRoute guard component (redirects non-admin to /admin). Added /admin/staff route wrapped in AdminOnlyRoute. Fixed MaintenanceGuard to poll every 60s and re-run on every route change — ensures maintenance mode takes effect for active sessions without requiring a page reload.

[2026-06-15 10:40] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added UserCog import and Staff nav item at /admin/staff (perm: 'admin') after Users. Updated visibleNav filter: items with perm='admin' now require user?.is_admin === true instead of falling through to hasPermission. Extracted support unread fetch into fetchSupportUnread() with 30s polling via setInterval — nav dot now updates without needing a route change.

[2026-06-15 10:45] | modify | frontend/src/pages/admin/support/SupportPage.tsx | Added 30s polling for the ticket list (setInterval on fetchTickets, keyed to ticketStatusFilter). Ensures new tickets appear in the support tab without manual refresh.

[2026-06-15 10:50] | fix | frontend/src/components/navbar.tsx | isStaff check was using role field (undefined in the User type); changed to user.is_admin || (user.permissions ?? []).length > 0. Added unread task fetch inside pollNotifications: calls ADMIN_TASKS_UNREAD, injects a synthetic 'new_task' NotifItem when count > 0. Task notifications now appear in the bell icon alongside ticket notifications.

[2026-06-15 10:55] | modify | frontend/src/components/common/notification-panel.tsx | Added 'new_task' to NotifItem type union. Added ListTodo icon (violet) and bg-violet-100 background for task notification items.

[2026-06-15 11:00] | modify | backend/app/user_management/repositories/user_repository.py | Added 'staff' case to filter_by in admin_list_users: applies {"role": {"$ne": "user"}} query to return all non-user accounts for the Staff page.

[2026-06-15 11:05] | add | frontend/src/pages/admin/staff/StaffPage.tsx | New admin-only Staff page. Lists all non-user accounts (filter_by=staff) in a table: member avatar (initials), name, email, admin shield (is_admin), role badge, permissions chips, active/suspended status. Edit button (hidden for self) opens EditModal. EditModal: role dropdown, static default-permissions block (grey chips showing role's built-in grants, "All permissions" text for admin/ops_manager), extra permissions checkboxes where role defaults are locked (disabled + "default" label). Saves via PATCH /admin/users/{id}/role. handleSaved updates the row in-place without re-fetching.

[2026-06-15 11:10] | fix | frontend/src/pages/admin/users/UsersPage.tsx | White screen crash when creating a user with a Pydantic validation error. Root cause: FastAPI 422 returns detail as an array of {type,loc,msg,...} objects; passing the array directly into a string state threw during React render. Added parseApiError() helper: handles both array detail (joins msg fields) and string detail, applied to all 4 catch blocks (handleAddUser, handleEditUser, handleSetPassword, role update modal).

[2026-06-16 00:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Removed "Add subscription" toolbar button and "Add subscription here" category dropdown item (subscription creation was unused). Removed onAddSubscription prop from CategorySection entirely. Edit-existing-subscription path preserved via handleEdit().

[2026-06-16 00:00] | add | backend/app/orders/repository.py | Added aggregate_service_stats() — MongoDB $group aggregation on orders collection grouped by service_id. Returns total_orders and working_orders per service. working_orders counts orders with status in [Pending, Processing, InProgress, In progress, Completed, Partial, Active].

[2026-06-16 00:00] | add | backend/app/admin/orders/router.py | Added GET /service-stats endpoint (before /{order_id} to avoid path conflict). Returns aggregate_service_stats() result. Used by the Working Services panel on the admin Services page.

[2026-06-16 00:00] | modify | frontend/src/config.ts | Added ADMIN_ORDERS_SERVICE_STATS endpoint constant.

[2026-06-16 00:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Added Working Services tab to the Services page. Page is now split into two tabs: "Services" (existing toolbar + category list) and "Working Services" (new section). Working Services fetches GET /admin/orders/service-stats and GET /admin/routing in parallel on mount. Shows a summary strip (Working / Not Tested / Errors Only / Total counts) and per-category cards. Each card shows the routing chain (Value + Bulk) with ChainEntry components displaying position badge (Default/Fallback N), service name, provider, rate, and a status badge per service derived from order history. Services with working_orders > 0 → green "Working · N", total_orders > 0 but working_orders = 0 → red "Errors only", no orders → gray "Not tested". Tab pill on "Working Services" shows a green count badge of working services when > 0.

[2026-06-16 00:00] | modify | frontend/src/components/navbar.tsx | Currency dropdown now opens on hover in addition to click. Replaced Radix Menubar currency block with a CSS group/group-hover div pattern. Invisible 8px bridge div between trigger and panel prevents the dropdown from closing as the cursor moves from button to list. Radix Menubar imports retained for avatar dropdown.

[2026-06-16 00:10] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Package selector now shows unit labels matching the service type instead of generic "units". Added CATEGORY_TO_UNIT constant mapping category names (YouTube Views, YouTube Likes, etc.) to their unit strings (Views, Likes, etc.). unitLabel derived from categoryOrder.categoryName with "units" fallback. Replaced all 4 hardcoded "units" occurrences in select options and summary card.

[2026-06-16 00:20] | modify | frontend/src/pages/admin/settings/SettingsPage.tsx | Moved Save button to the top of the settings form (above the 2-column grid). Converted Social Links section to a collapsible card: header is a clickable button with rotating ChevronDown icon, content toggled via socialOpen state (defaults open).

[2026-06-16 00:30] | modify | frontend/src/pages/admin/reports/ReportsPage.tsx | Tickets stat card now shows active tickets (open + in_progress) instead of all-time total. Added fetchTicketBreakdown using page_size:1 requests to get accurate status counts without downloading all rows. Added mount-time useEffect so the stat card is populated on page load, not only on tab change. Card label changed to "Active Tickets", value = open + in_progress counts, sub-label "Open + In Progress".

[2026-06-16 00:40] | modify | frontend/src/pages/admin/users/UsersPage.tsx | Added page size selector (25/50/100) to the admin users list. Replaced hardcoded PAGE_SIZE=20 with PAGE_SIZE_OPTIONS constant and pageSize state (default 25). Pagination footer now always visible when total > 0 with 3 sections: "Showing X–Y of Z users" / page size pills / prev-page-next navigation.

[2026-06-16 00:50] | modify | frontend/src/pages/admin/users/UsersPage.tsx, backend/app/admin/users/router.py, backend/app/user_management/repositories/user_repository.py | Export buttons now open a date range modal before downloading. ExportModal accepts from/to date inputs, shows a preview line ("Exporting users registered from X to Y"), validates from ≤ to, then calls handleExport with optional date params. Backend export_users endpoint accepts created_from/created_to YYYY-MM-DD query strings, parses to UTC day boundaries (from=midnight, to=23:59:59), and passes Optional[datetime] to admin_export_users. Repository conditionally prepends a $match stage when dates are provided.

[2026-06-16 00:55] | fix | frontend/src/pages/admin/users/UsersPage.tsx | ExportModal export button was missing flex layout — Download icon and label were not aligned. Added flex items-center gap-2 to the button className alongside the existing primaryCls.

[2026-06-16 01:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Live API Rate/Min/Max values now auto-refresh every 15 minutes. Added servicesRef (useRef) kept in sync inside fetchAll. Mount useEffect now sets a setInterval calling fetchProviderSvcMap(servicesRef.current) every 900 000 ms; clearInterval runs on unmount. Only the provider comparison values refresh — stored DB values are unaffected.

[2026-06-16 02:00] | modify | backend/app/admin/provider_config/schemas.py | Replaced single default/fallbacks shape with four fields: value_default_service_id, value_fallback_service_ids, bulk_default_service_id, bulk_fallback_service_ids on both UpsertRoutingConfigRequest and RoutingConfigResponse.

[2026-06-16 02:00] | modify | backend/app/admin/provider_config/repository.py | upsert() updated to store the four new fields. Legacy default_service_id/fallback_service_ids kept in sync with value config so existing order routing code (orders/router.py, fulfillment.py) continues working without change.

[2026-06-16 02:00] | modify | backend/app/admin/provider_config/router.py | _config_to_response reads new value_*/bulk_* fields with legacy fallback for old documents. upsert_routing_config validates and passes all 4 new fields to the repository.

[2026-06-16 02:00] | modify | frontend/src/types/index.ts | RoutingConfig interface updated: replaced default/fallbacks with value_default/value_fallbacks/bulk_default/bulk_fallbacks.

[2026-06-16 02:00] | modify | frontend/src/pages/admin/routing/ProviderConfigPage.tsx | Full rewrite. Category cards are now collapsible (closed by default) with ChevronDown toggle. Each card shows a Value Packages / Bulk Packages tab strip. Both tabs have independent default + fallback service pickers. Same service can be selected in both tabs (no cross-tab exclusion). Header shows "Value configured" / "Bulk configured" badges when set. Save sends all 4 fields together. Clear Config resets both configs at once.

[2026-06-16 02:00] | fix | frontend/src/pages/admin/pricing/PricingPage.tsx | Updated r.default → r.value_default when reading routing config min/max bounds for the pricing page package validator (broken by the RoutingConfig type change).

[2026-06-16 03:00] | modify | frontend/src/components/common/purchase-flow.tsx | Replaced auto-cycle timer with scroll-driven step highlighting. Removed autoAnimate state, 3s interval, 2s resume timeout, and unused useParams. Added sectionRef + passive scroll listener: progress = (vh - rect.top) / vh (uses viewport height as denominator so transitions complete as the section scrolls into view, not across full travel). Framer Motion durations reduced to 0.15–0.2s for snappier visual feedback.

[2026-06-16 04:00] | add | backend/app/admin/settings/router.py (GET /admin/settings/server-info), backend/requirements.txt | New server-info endpoint. Returns CPU %, core count, memory used/total/%, disk used/total/%, uptime seconds, Python version, OS platform+release, MongoDB ping status+latency, Redis ping status+latency. Protected by require_admin_role. psutil>=5.9.0 added to requirements.

[2026-06-16 04:00] | modify | frontend/src/config.ts | Added ADMIN_SERVER_INFO endpoint constant.

[2026-06-16 04:00] | modify | frontend/src/pages/admin/settings/SettingsPage.tsx | Added "Server" third tab. Fetches GET /admin/settings/server-info on first tab open (lazy) and on Refresh button click. Shows: Connections card (MongoDB/Redis status pills with latency), Resources card (CPU/Memory/Disk progress bars coloured teal/amber/red by threshold), System card (Python version, OS, uptime, CPU cores). Progress bars turn amber at 60% and red at 85%.

[2026-06-16 11:00] | fix | frontend/src/pages/checkout/CheckoutPage.tsx | Cryptomus now routes through GlowApex portal instead of redirecting directly to the Cryptomus payment URL. Removed startCryptomus() function, widened redirectToGlowApex() type from "stripe"|"razorpay" to PaymentMethod, updated handlePlaceOrder() to always call redirectToGlowApex(). Updated loading button label — Cryptomus now shows "Redirecting…" matching Stripe behaviour.

[2026-06-16 12:00] | add | backend/app/blog/router.py, backend/app/main.py, backend/static/blog-images/ | Blog image upload. POST /admin/blogs/upload-image accepts multipart file upload (jpg/jpeg/png/gif/webp, max 5 MB), saves to backend/static/blog-images/<uuid>.<ext>, returns {"url": "<BACKEND_BASE_URL>/static/blog-images/<filename>"}. FastAPI StaticFiles mounted at /static to serve uploaded images. Directory created at startup via Path.mkdir in main.py.

[2026-06-16 12:00] | modify | frontend/src/pages/admin/blogs/BlogsPage.tsx, frontend/src/config.ts | Blog form Cover Image field now has URL/Upload toggle. URL mode keeps existing text input. Upload mode shows a file picker that POSTs to ADMIN_BLOGS_UPLOAD_IMAGE, sets form.image_url from the response URL, and shows inline upload errors. Image preview (20px thumbnail) renders below the field in both modes when image_url is set.

[2026-06-16 13:00] | fix | backend/app/checkout/router.py, backend/app/checkout/schemas.py | Cryptomus CHECKOUT_INIT was calling the Cryptomus API immediately, causing 502 before the frontend could redirect to GlowApex. Deferred invoice creation: CHECKOUT_INIT now just creates the order + ledger entry + session token for Cryptomus (no API call). Added POST /checkout/create-cryptomus-invoice endpoint — called by GlowApex using the session token to create the invoice lazily when it loads the payment screen. Idempotent: returns existing invoice data if already created. Root cause: old Cryptomus flow was designed for inline (on-store) payment, not the portal redirect flow.

[2026-06-16 14:00] | add | backend/app/notifications/ (new module) | Full notifications module: repository.py (MongoDB collection with indexes on created_at, target, user_ids, read_by; unread_count uses $ne on read_by; mark_all_read_for_user uses $addToSet + update_many for idempotency), schemas.py (NotificationCreate, NotificationResponse, NotificationListResponse, UnreadCountResponse), router.py (admin_router gated by PERM_NOTIFICATIONS: list/create/delete; user_router: list/unread-count/mark-read/mark-all-read — /read-all defined before /{id}/read to avoid routing conflict).

[2026-06-16 14:00] | modify | backend/app/user_management/utils/permissions.py | Added PERM_NOTIFICATIONS = "notifications" and included it in ALL_PERMISSIONS frozenset. Admin and operations_manager roles get it automatically. Added to ROLE_PERMISSIONS docs.

[2026-06-16 14:00] | modify | backend/app/admin/router.py | Imported notifications admin_router and registered it at prefix /notifications.

[2026-06-16 14:00] | modify | backend/app/app_components.py | Imported notifications user_router and registered it at prefix /notifications.

[2026-06-16 14:00] | modify | backend/app/main.py | Imported NotificationRepository and added create_indexes() call in lifespan startup.

[2026-06-16 14:00] | modify | frontend/src/config.ts | Added ADMIN_NOTIFICATIONS, USER_NOTIFICATIONS, USER_NOTIFICATIONS_UNREAD, USER_NOTIFICATIONS_READ_ALL endpoint constants.

[2026-06-16 14:00] | modify | frontend/src/components/common/notification-panel.tsx | Added 'admin_notification' to NotifItem type union. Added Megaphone icon import with emerald-100/emerald-600 color theme for admin_notification type.

[2026-06-16 14:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Added Bell icon import and Notifications nav item (perm: 'notifications') between Blogs and Settings.

[2026-06-16 14:00] | add | frontend/src/pages/admin/notifications/NotificationsPage.tsx | Admin notifications page: compose panel (title, message, type info/success/warning, target all/selective/personal, debounced user search with chip picker for selective/personal). History table with type badge, target badge, read count, created-by, relative timestamp, per-item delete button and pagination.

[2026-06-16 14:00] | modify | frontend/src/App.tsx | Added import and route for AdminNotificationsPage at /admin/notifications (gated by RequirePermission "notifications").

[2026-06-16 14:00] | modify | frontend/src/components/navbar.tsx | pollNotifications now also fetches GET /notifications for both staff and regular users and appends unread admin-sent notifications as admin_notification items to the panel. handleOpenPanel now calls POST /notifications/read-all on the backend when the panel opens (in addition to updating local acknowledgedIds).

[2026-06-16 15:00] | modify | frontend/src/components/common/notification-panel.tsx | Added is_read? and backend_id? to NotifItem. Added onRead? callback prop. handleClick now calls onRead for admin_notification items before navigating. Unread admin notifications show left emerald border + bold title + green dot. Added "View all notifications" footer link to /dashboard/notifications.

[2026-06-16 15:00] | modify | frontend/src/components/navbar.tsx | Fetches last 10 admin notifications (both read+unread, not filtered) for panel history. Maps is_read and backend_id onto items. unreadCount formula: admin_notification items use n.is_read===false, others use acknowledgedIds. handleOpenPanel now locally sets is_read=true on all admin notifs (for immediate badge clear) before calling POST /notifications/read-all. Added handleMarkNotifRead callback (calls POST /{id}/read) passed as onRead to panel.

[2026-06-16 15:00] | modify | frontend/src/pages/dashboard/DashboardLayout.tsx | Added Bell icon import, Notifications nav item at /dashboard/notifications. getPageTitle handles "notifications". Added unreadNotifCount state fetched from USER_NOTIFICATIONS_UNREAD on route change. Sidebar shows emerald badge count; mobile bottom nav shows dot. Clearing count when navigating to /dashboard/notifications.

[2026-06-16 15:00] | add | frontend/src/pages/dashboard/notifications/NotificationsPage.tsx | Dashboard notifications history page. Fetches GET /notifications paginated. Unread items: emerald left border, green dot, bold title, bg-emerald-50, clicking calls POST /{id}/read and updates is_read locally. Read items: normal weight, gray text. "Mark all as read" button calls POST /read-all. Pagination for large history.

[2026-06-16 15:00] | modify | frontend/src/App.tsx | Added DashboardNotificationsPage import and /dashboard/notifications route.


[2026-06-17 00:00] | modify | docker-compose.yml, docker-compose.prod.yml | Added named Docker volume `blog_images` mounted at `/app/static/blog-images` in the backend container. Persists uploaded blog images across container rebuilds and `docker-compose down/up` cycles. Root cause of image loss was backend storing files on container ephemeral filesystem; volume survives rebuilds.

[2026-06-17 12:00] | add | frontend/src/pages/admin/services/WorkingServicesSection.tsx | Extracted WorkingServicesSection and ChainEntry from old monolithic ServicesPage. Shows per-category routing chain health (working/untested/error counts) with a summary strip and grid of category cards. Exports RoutingConfigData, ServiceStat, Category interfaces used by other sub-files.

[2026-06-17 12:00] | add | frontend/src/pages/admin/services/modals.tsx | Extracted all modal components and shared styles from old ServicesPage into a standalone file. Exports: Modal, AddCategoryModal, ServiceFormModal (preserved exactly), SubscriptionFormModal, DeleteModal, DropdownMenu (portal-positioned to avoid overflow clipping). Also exports shared CSS class strings (inputCls, primaryCls, ghostCls, cancelCls) and the Provider, Category, Service, ProviderServiceItem interfaces.

[2026-06-17 12:00] | add | frontend/src/pages/admin/services/CategoryCard.tsx | New combined per-category card component replacing the separate Routing and Pricing pages. Each card has three inner tabs: Services (service table with sort/select/actions + Add Service button), Routing (value/bulk sub-tabs with default + ordered fallback service dropdowns, save/clear), Pricing (price_per_1000 + value/bulk package quantity tables with discount config, save). Routing saves to PUT /admin/routing/{categoryId}; pricing saves to PUT /admin/pricing/{serviceType}. Both call onSaved() to trigger parent fetchAll().

[2026-06-17 12:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Rewrote from 2115-line monolith to ~380-line orchestration page. Now fetches pricingConfigs in addition to existing data and renders 6 fixed CategoryCards (YouTube Views/Likes/Subscribers/Comments/Shorts Views/Shorts Likes). Global toolbar handles: Add Category, bulk delete, sync, export, filter/search. Global modals manage add/edit/delete service and category. Two top-level tabs: Configuration (CategoryCards) and Working Services (WorkingServicesSection).

[2026-06-17 12:00] | delete | frontend/src/pages/admin/routing/ProviderConfigPage.tsx | Removed — routing config is now in the Routing tab inside each CategoryCard.

[2026-06-17 12:00] | delete | frontend/src/pages/admin/pricing/PricingPage.tsx | Removed — pricing config is now in the Pricing tab inside each CategoryCard.

[2026-06-17 12:00] | modify | frontend/src/App.tsx | Removed imports and routes for ProviderConfigPage (/admin/routing) and PricingPage (/admin/pricing).

[2026-06-17 12:00] | modify | frontend/src/pages/admin/AdminLayout.tsx | Removed Routing and Pricing entries from NAV_ITEMS; removed unused GitBranch and DollarSign icon imports.

[2026-06-17 12:00] | modify | frontend/src/config/permissions.ts | Removed /admin/routing and /admin/pricing from ADMIN_NAV_ORDER (the nav-based first-page resolver). Backend permission keys 'routing' and 'pricing' remain — they still guard API endpoints.

[2026-06-17 18:00] | fix | backend/app/admin/reports/router.py | Fixed profit/revenue calculation in summary. total_revenue was using (total_charges - total_server_price) formula (same as profit). Fixed: total_revenue = total_charges, total_profit = total_charges - total_server_price.

[2026-06-17 18:00] | delete | frontend/src/pages/admin/routing/ProviderConfigPage.tsx, frontend/src/pages/admin/pricing/PricingPage.tsx | Removed old separate routing and pricing pages. Replaced by the new unified Services page.

[2026-06-17 18:00] | add | backend/app/admin/service_packages/__init__.py, schemas.py, repository.py, router.py | New service_packages module. MongoDB collection: service_packages. Schema: service_type (6 hardcoded YouTube types), package_type (value/bulk), quantity, default provider service, portal_rate ($/1000), discount (none/fixed/%), fallbacks array. CRUD endpoints at /admin/service-packages. Fallback endpoints: add, update by index, delete by index, reorder (PUT /fallbacks/reorder accepts full ordered array). All routes require PERM_SERVICES.

[2026-06-17 18:00] | modify | backend/app/app_components.py | Registered service_packages_router at /admin/service-packages prefix.

[2026-06-17 18:00] | modify | frontend/src/config.ts | Removed ADMIN_ROUTING_CONFIG. Added ADMIN_SERVICE_PACKAGES pointing to /admin/service-packages.

[2026-06-17 18:00] | add | frontend/src/pages/admin/services/PackageModals.tsx | Shared modal components for the new Services page: AddQuantityModal (full form with quantity, provider/service select, provider price, portal rate $/1000 with live price preview, discount, min/max, active toggle, admin note), AddFallbackModal (prefilled quantity/price, provider/service select), DeleteModal. Also exports shared types (ServicePackage, FallbackService, Provider, ProviderService) and calcPrice utility.

[2026-06-17 18:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Complete rewrite. Six hardcoded sections (YouTube Views/Likes/Subscribers/Comments/Shorts Views/Shorts Likes). Each section has Value/Bulk package type tab switcher. Quantity rows show provider, service ID+name, provider cost, portal price, priority, active badge, fallback count. Expandable row reveals default service summary + fallback list with HTML5 drag-drop reorder (PUT /fallbacks/reorder). Action menu per row: edit and delete. Add Fallback button inline in expanded row.

[2026-06-17 19:00] | modify | backend/app/public_pricing/router.py | Replaced data source from service_pricing collection to service_packages collection. Now reads all active packages, groups by service_type, and returns ServicePricingResponse shape. Per-package portal_rate is included; price_per_1000 set to 0.0 (no longer used). Buy pages now reflect only admin-configured quantities.

[2026-06-17 19:00] | modify | backend/app/admin/pricing/schemas.py | Added portal_rate: float = 0.0 to PricingPackage model to carry per-package $/1000 rate through the public pricing response.

[2026-06-17 19:00] | modify | frontend/src/context/PricingContext.tsx | Added portal_rate: number to PricingPackage interface. Updated calcPackagePrice to derive base price from pkg.portal_rate (falling back to pricing.price_per_1000 for backward compatibility) instead of always using the service-level price_per_1000.

[2026-06-17 19:00] | modify | frontend/src/components/sections/hero/DynamicPackageSelector.tsx | Updated basePrice and per-unit display to use per-package pkgPortalRate (selectedPkg.portal_rate) instead of the service-level pricing.price_per_1000.

[2026-06-17 20:00] | fix | backend/app/checkout/router.py, backend/app/orders/fulfillment.py | Fixed order routing to use new service_packages system instead of old routing_config. Root cause: checkout resolver and fulfillment both still read from legacy services/routing_config collections. Fix: checkout now tries ServicePackageRepository.find_by_service_and_quantity first; if found, charges are derived from portal_rate and service_package_id is stored on the order. Fulfillment checks service_package_id first and calls new _resolve_candidates_from_package (default provider + ordered fallbacks from the package doc). Old routing path preserved as fallback for pre-auth and legacy orders.

[2026-06-17 20:00] | modify | backend/app/admin/service_packages/repository.py | Added find_by_service_and_quantity(service_type, quantity, package_type=None) method.

[2026-06-17 20:00] | modify | backend/app/orders/pricing_utils.py | Added calc_service_package_charge(pkg) function — computes portal price from portal_rate + discount for a service_packages document.

[2026-06-17 20:00] | modify | backend/app/checkout/schemas.py | Added package_type: Optional[str] = None to CheckoutInitRequest.

[2026-06-17 20:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | buildOrderBody() now includes package_type when selectedPkg is available, so the backend can match the exact value/bulk package the user selected.

[2026-06-17 21:00] | modify | backend/app/orders/fulfillment.py | Removed _resolve_candidates_from_routing function and RoutingConfigRepository/ServiceRepository imports. place_smm_order now requires service_package_id on every order; orders missing it are immediately failed instead of falling back to legacy routing.

[2026-06-17 21:00] | modify | backend/app/checkout/router.py | Removed pre-auth flow (create_pre_auth, get_pre_auth_info, checkout_init_with_pre_auth) and _PRE_AUTH_PREFIX constant. Removed legacy service_id path and old routing fallback from _resolve_service_and_charge — now requires category_name and resolves only via service_packages. Removed imports: PricingRepository, RoutingConfigRepository, CategoryRepository, ServiceRepository, calc_pricing_charge, InitWithPreAuthRequest, PreAuthInfo, PreAuthRequest, PreAuthResponse.

[2026-06-17 21:00] | modify | backend/app/checkout/schemas.py | Removed service_id field from CheckoutInitRequest. Removed PreAuthRequest, PreAuthResponse, PreAuthInfo, InitWithPreAuthRequest schemas.

[2026-06-17 21:00] | modify | backend/app/orders/router.py | Removed place_order, place_order_by_category, initiate_stripe_order endpoints (all dead — frontend never called them). Removed imports: PricingRepository, RoutingConfigRepository, CategoryRepository, ServiceRepository, run_in_threadpool, CATEGORY_TO_SERVICE_TYPE, calc_pricing_charge, PaymentLedgerRepository, stripe_service, PlaceOrderRequest, PlaceOrderByCategoryRequest, InitiateStripeOrderRequest, StripeInitiateResponse, settings.

[2026-06-17 21:00] | modify | backend/app/admin/router.py | Removed provider_config_router import and /routing registration.

[2026-06-17 21:00] | modify | backend/app/main.py | Removed CategoryRepository and ServiceRepository imports and their create_index() calls from lifespan.

[2026-06-17 21:00] | modify | backend/app/app_components.py | Removed razorpay_router import and /payments/razorpay registration (entire old Razorpay flow was dead — new checkout uses /checkout/verify/razorpay).

[2026-06-17 21:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Removed useServices import and activeRate variable; rawCharge in category flow now uses selectedPkg.price directly or 0 when no package selected.

[2026-06-17 22:00] | fix | backend/app/orders/fulfillment.py | After creating a failed_order task in _open_failed_order_task, now also inserts a "selective" notification for the order's user_id — surfaces in the user's bell icon and in admin notifications list.

[2026-06-17 22:00] | fix | backend/app/orders/router.py | get_order: after creating a failed_order task on error status transition, now also inserts a notification for the user. cancel_order: after creating a refund_request task, now also inserts a notification for the user.

[2026-06-17 23:00] | fix | frontend/src/pages/admin/services/PackageModals.tsx | DuplicateModal: after creating the new package, now loops through pkg.fallbacks and POSTs each one to the new package's /fallbacks endpoint — sequential calls so the last response (with all fallbacks) is passed to onSaved. Updated "Copying from" panel to show portal price and fallback count. Updated hint text to correctly state all settings are copied.

[2026-06-17 23:30] | modify | backend/app/admin/service_packages/schemas.py | Added description, service_label, mode (manual/auto), start_count_type (supplier/custom/zero) to ServicePackageCreate, ServicePackageUpdate, and ServicePackageOut. Added RoutingEntry and RoutingReorderRequest schemas for the combined routing reorder endpoint.

[2026-06-17 23:30] | modify | backend/app/admin/service_packages/router.py | Added PUT /{pkg_id}/routing/reorder endpoint (placed before fallback routes to avoid conflicts) — atomically updates default provider fields and fallbacks array in one MongoDB $set call. Updated create_package to persist description/service_label/mode/start_count_type. Updated _to_out to map these four new fields from doc with sensible defaults.

[2026-06-17 23:30] | modify | frontend/src/pages/admin/services/PackageModals.tsx | ServicePackage interface: added description, service_label, mode, start_count_type fields. AddQuantityModal: added pkgLabel/mode/startCountType/description state; added section with textarea, service label dropdown (Standard/Premium/HQ/Organic/Real/Bot/Instant/Drip Feed/Guaranteed), Manual/Auto toggle, and start count type dropdown. DuplicateModal: copies new fields in POST payload. SERVICE_LABELS constant defined at module level.

[2026-06-17 23:30] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Replaced FallbackList component with RoutingList — combines default (index 0, teal "Default" badge) and all fallbacks in one draggable list; drag reorder calls PUT /{pkg_id}/routing/reorder so the default can be promoted to a fallback and vice versa. QuantityRow expanded section simplified to just RoutingList + Add fallback button. Removed max-w-5xl page width constraint so services section uses full admin layout width.

[2026-06-17 23:45] | modify | backend/app/admin/service_packages/schemas.py | Added description, service_label, mode, start_count_type to FallbackServiceCreate (inherited by FallbackServiceOut) and to RoutingEntry — ensures per-fallback client-facing metadata is preserved through routing reorders.

[2026-06-17 23:45] | modify | frontend/src/pages/admin/services/PackageModals.tsx | FallbackService interface: added description, service_label, mode, start_count_type fields. AddFallbackModal: added same four client-facing state variables plus form section identical to AddQuantityModal — description textarea, service label dropdown, Manual/Auto toggle, start count type dropdown. Fields included in POST payload.

[2026-06-17 23:45] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | buildRoutingEntries: default entry (index 0) now carries description/service_label/mode/start_count_type from package top-level fields so metadata is preserved when the default is dragged into a fallback position.

[2026-06-18 00:00] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | RoutingList: default entry (index 0) visually distinguished — larger padding, filled teal-600 "Default" badge, teal-500 border + shadow, bolder provider name, larger grip icon. Fallbacks remain compact for clear visual hierarchy.

[2026-06-18 00:15] | add | frontend/src/pages/admin/services/ServicesPage.tsx | ServiceDetailPopup: eye button on every routing entry opens a popup that fetches GET /admin/providers/{id}/services live and shows Service ID, Name, Type, Rate, Min, Max. Shows spinner while loading and error message on failure.

[2026-06-18 00:30] | modify | frontend/src/pages/admin/services/ServicesPage.tsx | Full UI redesign. Sections: thin colored accent bar, colored icon badge with ring halo (TrendingUp/ThumbsUp/Users/MessageSquare/Film/Heart mapped per service type), V·B·active count badges always visible, icon-centered empty state, SECTION_META constant maps keys to colors and icons. Quantity rows: text-xl quantity with vertical rule divider, two-line provider block, discount badge inline, fallback count as +N teal badge, hover shadow. Page header: Total and Active counts as large numbers. Loading spinner uses teal. Section gap reduced from space-y-6 to space-y-4.

[2026-06-17 12:00] | modify | frontend/src/pages/checkout/CheckoutPage.tsx | Added SERVICE_UNIT map and unitLabel derived value. Package select options, the no-package quantity display, the package details card, and the price breakdown Quantity row now show the service unit label (Likes/Views/Subscribers/Comments/Shorts Views/Shorts Likes) instead of generic "units".

[2026-06-18 12:00] | fix | backend/Dockerfile, backend/entrypoint.sh | Permission denied on blog image upload in Docker. Root cause: named Docker volume (blog_images) initialises as root:root, overriding the image's chown to appuser. Fix: install gosu, add entrypoint.sh that chowns /app/static/blog-images to appuser before exec-ing gosu to drop privileges. Removed USER appuser directive (entrypoint handles the privilege drop). mkdir -p ensures the directory exists in the image for clean first-run volume initialisation.
