// Role-based access control definitions for the admin panel.
// Mirrors the backend (app/user_management/utils/permissions.py). The backend is
// the source of truth for enforcement; these mirrors drive nav/route gating and
// the role-management UI only.

export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ORDERS: 'orders',
  TASKS: 'tasks',
  PAYMENTS: 'payments',
  SERVICES: 'services',
  ROUTING: 'routing',
  SUPPORT: 'support',
  PRICING: 'pricing',
  BLOGS: 'blogs',
  SETTINGS: 'settings',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSION_KEYS: PermissionKey[] = [
  'dashboard', 'users', 'orders', 'tasks', 'payments', 'services',
  'routing', 'support', 'pricing', 'blogs', 'settings',
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'Dashboard (Reports)',
  users: 'Users',
  orders: 'Orders',
  tasks: 'Tasks',
  payments: 'Payments',
  services: 'Services',
  routing: 'Routing',
  support: 'Support',
  pricing: 'Pricing',
  blogs: 'Blogs',
  settings: 'Settings',
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  OPERATIONS_MANAGER: 'operations_manager',
  SUPPORT: 'support',
  ACCOUNTS_MANAGER: 'accounts_manager',
  SEO_MANAGER: 'seo_manager',
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  user: 'User',
  operations_manager: 'Senior Operation Manager',
  support: 'Support Agent',
  accounts_manager: 'Accounts Manager',
  seo_manager: 'SEO Manager',
};

// Default page permissions granted by each role (mirror of ROLE_PERMISSIONS).
export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin: ALL_PERMISSION_KEYS,
  operations_manager: ALL_PERMISSION_KEYS,
  support: ['orders', 'payments', 'support'],
  accounts_manager: ['dashboard', 'orders', 'payments'],
  seo_manager: ['blogs'],
  user: [],
};

// Roles an administrator can assign, ordered from least to most privileged.
export const ASSIGNABLE_ROLES: RoleKey[] = [
  'user', 'support', 'seo_manager', 'accounts_manager', 'operations_manager', 'admin',
];

// Admin nav order with paths, used to pick a user's landing page based on the
// first permission they hold.
export const ADMIN_NAV_ORDER: { perm: PermissionKey; path: string }[] = [
  { perm: 'dashboard', path: '/admin' },
  { perm: 'orders', path: '/admin/orders' },
  { perm: 'payments', path: '/admin/payments' },
  { perm: 'support', path: '/admin/support' },
  { perm: 'users', path: '/admin/users' },
  { perm: 'tasks', path: '/admin/tasks' },
  { perm: 'services', path: '/admin/services' },
  { perm: 'routing', path: '/admin/routing' },
  { perm: 'pricing', path: '/admin/pricing' },
  { perm: 'blogs', path: '/admin/blogs' },
  { perm: 'settings', path: '/admin/settings' },
];

/** Return the path of the first admin page the given permissions allow, or '/' if none. */
export function firstAllowedAdminPath(permissions: string[]): string {
  const found = ADMIN_NAV_ORDER.find((n) => permissions.includes(n.perm));
  return found ? found.path : '/';
}
