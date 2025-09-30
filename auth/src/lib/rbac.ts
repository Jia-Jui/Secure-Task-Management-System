export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';
export type Permission =
  | 'tasks:create' | 'tasks:read' | 'tasks:update' | 'tasks:delete' | 'audit:read';

export const ROLE_PERMS: Record<Role, Permission[]> = {
  OWNER: ['tasks:create','tasks:read','tasks:update','tasks:delete','audit:read'],
  ADMIN: ['tasks:create','tasks:read','tasks:update','tasks:delete','audit:read'],
  VIEWER: ['tasks:read'],
};

export function hasPermission(role: Role, perm: Permission) {
  return ROLE_PERMS[role]?.includes(perm) ?? false;
}
