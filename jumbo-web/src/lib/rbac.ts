import type { UserRole } from "@/lib/db/schema";

/**
 * RBAC Permission System
 * Defines what actions each role can perform
 */

export type Permission =
  | "leads:read"
  | "leads:create"
  | "leads:update"
  | "leads:assign"
  | "leads:delete"
  | "seller_leads:read"
  | "seller_leads:create"
  | "seller_leads:update"
  | "seller_leads:assign"
  | "seller_leads:delete"
  | "listings:read"
  | "listings:create"
  | "listings:update"
  | "listings:delete"
  | "listings:publish"
  | "listings:verify"
  | "visits:read"
  | "visits:create"
  | "visits:update"
  | "visits:complete"
  | "tours:read"
  | "tours:create"
  | "tours:update"
  | "tours:dispatch"
  | "sellers:read"
  | "sellers:create"
  | "sellers:update"
  | "sellers:delete"
  | "buildings:read"
  | "buildings:create"
  | "buildings:update"
  | "buildings:delete"
  | "units:read"
  | "units:create"
  | "units:update"
  | "units:delete"
  | "communications:read"
  | "communications:create"
  | "notes:read"
  | "notes:create"
  | "notes:update"
  | "notes:delete"
  | "buyer_events:read"
  | "buyer_events:create"
  | "audit_logs:read"
  | "media:read"
  | "media:create"
  | "media:update"
  | "media:delete"
  | "inspections:read"
  | "inspections:create"
  | "inspections:update"
  | "catalogues:read"
  | "catalogues:create"
  | "catalogues:update"
  | "offers:read"
  | "offers:create"
  | "offers:update"
  | "audit_logs:read"
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "settings:read"
  | "settings:update";

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    // Super admin has all permissions
    "leads:read",
    "leads:create",
    "leads:update",
    "leads:assign",
    "leads:delete",
    "seller_leads:read",
    "seller_leads:create",
    "seller_leads:update",
    "seller_leads:assign",
    "seller_leads:delete",
    "listings:read",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:publish",
    "listings:verify",
    "visits:read",
    "visits:create",
    "visits:update",
    "visits:complete",
    "tours:read",
    "tours:create",
    "tours:update",
    "tours:dispatch",
    "sellers:read",
    "sellers:create",
    "sellers:update",
    "sellers:delete",
    "buildings:read",
    "buildings:create",
    "buildings:update",
    "buildings:delete",
    "units:read",
    "units:create",
    "units:update",
    "units:delete",
    "communications:read",
    "communications:create",
    "notes:read",
    "notes:create",
    "notes:update",
    "notes:delete",
    "media:read",
    "media:create",
    "media:update",
    "media:delete",
    "inspections:read",
    "inspections:create",
    "inspections:update",
    "catalogues:read",
    "catalogues:create",
    "catalogues:update",
    "offers:read",
    "offers:create",
    "offers:update",
    "audit_logs:read",
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "settings:read",
    "settings:update",
  ],
  team_lead: [
    "leads:read",
    "leads:create",
    "leads:update",
    "leads:assign",
    "seller_leads:read",
    "seller_leads:create",
    "seller_leads:update",
    "seller_leads:assign",
    "listings:read",
    "listings:create",
    "listings:update",
    "listings:publish",
    "visits:read",
    "visits:create",
    "visits:update",
    "visits:complete",
    "tours:read",
    "tours:create",
    "tours:update",
    "tours:dispatch",
    "sellers:read",
    "sellers:create",
    "sellers:update",
    "buildings:read",
    "buildings:create",
    "buildings:update",
    "units:read",
    "units:create",
    "units:update",
    "communications:read",
    "communications:create",
    "notes:read",
    "notes:create",
    "notes:update",
    "notes:delete",
    "media:read",
    "media:create",
    "media:update",
    "media:delete",
    "inspections:read",
    "inspections:create",
    "inspections:update",
    "catalogues:read",
    "catalogues:create",
    "catalogues:update",
    "offers:read",
    "offers:create",
    "offers:update",
    "audit_logs:read",
    "users:read",
  ],
  listing_agent: [
    "leads:read",
    "seller_leads:read",
    "seller_leads:create",
    "listings:read",
    "listings:create",
    "listings:update",
    "listings:publish",
    "sellers:read",
    "sellers:create",
    "sellers:update",
    "buildings:read",
    "buildings:create",
    "buildings:update",
    "units:read",
    "units:create",
    "units:update",
    "communications:read",
    "communications:create",
    "notes:read",
    "notes:create",
    "notes:update",
    "media:read",
    "media:create",
    "media:update",
    "inspections:read",
    "inspections:create",
    "inspections:update",
    "catalogues:read",
    "catalogues:create",
    "catalogues:update",
    "offers:read",
    "offers:create",
  ],
  buyer_agent: [
    "leads:read",
    "leads:create",
    "leads:update",
    "listings:read",
    "visits:read",
    "visits:create",
    "visits:update",
    "visits:complete",
    "sellers:read",
    "communications:read",
    "communications:create",
    "notes:read",
    "notes:create",
    "notes:update",
    "media:read",
    "offers:read",
    "offers:create",
  ],
  visit_agent: [
    "leads:read",
    "listings:read",
    "visits:read",
    "visits:update",
    "visits:complete",
    "tours:read",
    "communications:read",
    "communications:create",
  ],
  dispatch_agent: [
    "leads:read",
    "listings:read",
    "visits:read",
    "tours:read",
    "tours:create",
    "tours:update",
    "tours:dispatch",
    "communications:read",
  ],
  closing_agent: [
    "leads:read",
    "seller_leads:read",
    "seller_leads:update",
    "listings:read",
    "sellers:read",
    "sellers:update",
    "communications:read",
    "communications:create",
  ],
  seller_agent: [
    "seller_leads:read",
    "seller_leads:create",
    "seller_leads:update",
    "seller_leads:assign",
    "sellers:read",
    "sellers:create",
    "sellers:update",
    "listings:read",
    "communications:read",
    "communications:create",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole | null | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user can access a resource based on ownership or assignment
 * This is used for resource-level permissions (e.g., can only edit your own listings)
 */
export function canAccessResource(
  role: UserRole | null | undefined,
  permission: Permission,
  resourceUserId?: string | null,
  currentUserId?: string | null
): boolean {
  // First check if role has the permission
  if (!hasPermission(role, permission)) {
    return false;
  }

  // Super admin and team leads can access all resources
  if (role === "super_admin" || role === "team_lead") {
    return true;
  }

  // For other roles, check if they own or are assigned to the resource
  if (resourceUserId && currentUserId) {
    return resourceUserId === currentUserId;
  }

  // If no resource user ID, allow access (e.g., for creating new resources)
  return true;
}

