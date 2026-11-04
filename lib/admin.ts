export const USER_STATUSES = ["pending", "active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && (USER_STATUSES as readonly string[]).includes(value);
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: "Pendientes",
  active: "Activas",
  suspended: "Suspendidas",
};

export const USER_ROLES = ["student", "company", "association", "entrepreneur", "teacher", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}
