export type AppRole = "owner" | "admin" | "editor" | "observer";

export type PermissionMatrix = Record<AppRole, Record<string, boolean>>;

type PermissionMap = Record<string, boolean>;

export const PERMISSION_STORAGE_KEY = "ansh_role_permissions";
export const USER_ROLE_SESSION_KEY = "ansh_user_role";
export const PERMISSION_DENIED_MESSAGE =
  "You don't have permission. Contact your Admin or Owner for permission.";
export const PERMISSION_DENIED_EVENT = "ansh:permission-denied";

export function getPermissionStorageKey(workspaceId: number | null | undefined) {
  const normalizedWorkspaceId =
    typeof workspaceId === "number" && Number.isFinite(workspaceId) ? workspaceId : 1;
  return `${PERMISSION_STORAGE_KEY}:${normalizedWorkspaceId}`;
}

export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  owner: {
    modify_workspace: true,
    manage_members: true,
    setup_integrations: true,
    create_channels: true,
    delete_channels: true,
    post_messages: true,
    manage_channel_members: true,
    create_projects: true,
    create_tasks: true,
    edit_tasks: true,
    delete_tasks: true,
    reorder_columns: true,
    view_invoices: true,
    manage_subscription: true,
    create_sticky_notes: true,
    edit_notes: true,
    delete_notes: true,
    post_announcements: true,
    manage_announcements: true,
  },
  admin: {
    modify_workspace: true,
    manage_members: true,
    setup_integrations: true,
    create_channels: true,
    delete_channels: true,
    post_messages: true,
    manage_channel_members: true,
    create_projects: true,
    create_tasks: true,
    edit_tasks: true,
    delete_tasks: true,
    reorder_columns: true,
    view_invoices: true,
    manage_subscription: false,
    create_sticky_notes: true,
    edit_notes: true,
    delete_notes: true,
    post_announcements: true,
    manage_announcements: true,
  },
  editor: {
    modify_workspace: false,
    manage_members: false,
    setup_integrations: false,
    create_channels: true,
    delete_channels: false,
    post_messages: true,
    manage_channel_members: true,
    create_projects: false,
    create_tasks: true,
    edit_tasks: true,
    delete_tasks: false,
    reorder_columns: false,
    view_invoices: false,
    manage_subscription: false,
    create_sticky_notes: true,
    edit_notes: true,
    delete_notes: true,
    post_announcements: false,
    manage_announcements: false,
  },
  observer: {
    modify_workspace: false,
    manage_members: false,
    setup_integrations: false,
    create_channels: false,
    delete_channels: false,
    post_messages: false,
    manage_channel_members: false,
    create_projects: false,
    create_tasks: false,
    edit_tasks: false,
    delete_tasks: false,
    reorder_columns: false,
    view_invoices: false,
    manage_subscription: false,
    create_sticky_notes: false,
    edit_notes: false,
    delete_notes: false,
    post_announcements: false,
    manage_announcements: false,
  },
};

const PATH_PERMISSION_RULES: Array<{ prefix: string; permission: string }> = [
  { prefix: "/management/teams", permission: "manage_members" },
  { prefix: "/settings/company", permission: "modify_workspace" },
  { prefix: "/settings/defaults", permission: "modify_workspace" },
  { prefix: "/settings/permissions", permission: "manage_members" },
  { prefix: "/settings/billing", permission: "view_invoices" },
];

export function normalizeRole(value: unknown): AppRole {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "owner") return "owner";
  if (normalized === "admin") return "admin";
  if (normalized === "observer") return "observer";
  return "editor";
}

export function getRequiredPermissionForPath(pathname: string): string | null {
  const matchedRule = PATH_PERMISSION_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
  return matchedRule?.permission ?? null;
}

export function parsePermissionMatrix(raw: string | null): PermissionMatrix {
  if (!raw) return DEFAULT_PERMISSION_MATRIX;
  try {
    return sanitizePermissionMatrix(JSON.parse(raw));
  } catch {
    return DEFAULT_PERMISSION_MATRIX;
  }
}

function sanitizeRolePermissions(defaults: PermissionMap, candidate: unknown, keepDefaults = false) {
  const next: PermissionMap = {};
  const source = candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};

  Object.keys(defaults).forEach((permissionId) => {
    const value = source[permissionId];
    next[permissionId] = keepDefaults ? defaults[permissionId] : typeof value === "boolean" ? value : defaults[permissionId];
  });

  return next;
}

export function sanitizePermissionMatrix(input: unknown): PermissionMatrix {
  const source = input && typeof input === "object" ? (input as Partial<PermissionMatrix>) : {};

  return {
    owner: sanitizeRolePermissions(DEFAULT_PERMISSION_MATRIX.owner, source.owner, true),
    admin: sanitizeRolePermissions(DEFAULT_PERMISSION_MATRIX.admin, source.admin),
    editor: sanitizeRolePermissions(DEFAULT_PERMISSION_MATRIX.editor, source.editor),
    observer: sanitizeRolePermissions(DEFAULT_PERMISSION_MATRIX.observer, source.observer),
  };
}

export function canAccessPermission(
  role: AppRole,
  permissionId: string | null | undefined,
  matrix: PermissionMatrix
): boolean {
  if (!permissionId) return true;
  if (role === "owner") return true;
  return matrix[role]?.[permissionId] ?? false;
}

export function showPermissionDeniedModal(message: string = PERMISSION_DENIED_MESSAGE) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PERMISSION_DENIED_EVENT, {
      detail: { message },
    })
  );
}
