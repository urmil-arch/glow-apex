"""Role and page-permission definitions for admin-panel access control.

Page permissions gate which admin pages a staff member can open. Two capabilities
(changing user roles, managing SMM providers) are reserved for the full
administrator even when another role can open the page that hosts them.
"""

# Page permission keys — one per admin page / sidebar nav item.
PERM_DASHBOARD = "dashboard"
PERM_USERS = "users"
PERM_ORDERS = "orders"
PERM_TASKS = "tasks"
PERM_PAYMENTS = "payments"
PERM_SERVICES = "services"
PERM_ROUTING = "routing"
PERM_SUPPORT = "support"
PERM_PRICING = "pricing"
PERM_BLOGS = "blogs"
PERM_SETTINGS = "settings"

ALL_PERMISSIONS: frozenset[str] = frozenset(
    {
        PERM_DASHBOARD,
        PERM_USERS,
        PERM_ORDERS,
        PERM_TASKS,
        PERM_PAYMENTS,
        PERM_SERVICES,
        PERM_ROUTING,
        PERM_SUPPORT,
        PERM_PRICING,
        PERM_BLOGS,
        PERM_SETTINGS,
    }
)

# Role identifiers stored on the user document.
ROLE_ADMIN = "admin"
ROLE_USER = "user"
ROLE_OPERATIONS_MANAGER = "operations_manager"
ROLE_SUPPORT = "support"
ROLE_ACCOUNTS_MANAGER = "accounts_manager"
ROLE_SEO_MANAGER = "seo_manager"

ALL_ROLES: frozenset[str] = frozenset(
    {
        ROLE_ADMIN,
        ROLE_USER,
        ROLE_OPERATIONS_MANAGER,
        ROLE_SUPPORT,
        ROLE_ACCOUNTS_MANAGER,
        ROLE_SEO_MANAGER,
    }
)

# Default page permissions granted by each role. admin and operations_manager
# both receive every page; they differ only in capabilities (admin alone may
# change roles and manage providers).
ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    ROLE_ADMIN: ALL_PERMISSIONS,
    ROLE_OPERATIONS_MANAGER: ALL_PERMISSIONS,
    ROLE_SUPPORT: frozenset({PERM_ORDERS, PERM_PAYMENTS, PERM_SUPPORT}),
    ROLE_ACCOUNTS_MANAGER: frozenset({PERM_DASHBOARD, PERM_ORDERS, PERM_PAYMENTS}),
    ROLE_SEO_MANAGER: frozenset({PERM_BLOGS}),
    ROLE_USER: frozenset(),
}


def effective_permissions(user: dict) -> set[str]:
    """Return the page permissions a user effectively has.

    Combines the role's default permissions with any admin-granted extra
    permissions, discarding unknown keys.
    """
    role = user.get("role", ROLE_USER)
    base = ROLE_PERMISSIONS.get(role, frozenset())
    extra = set(user.get("extra_permissions") or [])
    return (set(base) | extra) & set(ALL_PERMISSIONS)


def is_full_admin(user: dict) -> bool:
    """Return True only for the full administrator role.

    Gate for the two reserved capabilities: changing user roles and creating,
    editing, or deleting SMM providers.
    """
    return user.get("role") == ROLE_ADMIN
