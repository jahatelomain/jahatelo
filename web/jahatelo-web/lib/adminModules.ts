export const ADMIN_MODULES = [
  'dashboard',
  'motels',
  'promos',
  'amenities',
  'users',
  'roles',
  'prospects',
  'financiero',
  'analytics',
  'notifications',
  'banners',
  'audit',
  'inbox',
] as const;

export type AdminModule = typeof ADMIN_MODULES[number];

export const ADMIN_MODULE_LABELS: Record<AdminModule, string> = {
  dashboard: 'Dashboard',
  motels: 'Moteles',
  promos: 'Promos',
  amenities: 'Amenities',
  users: 'Usuarios',
  roles: 'Roles y Permisos',
  prospects: 'Prospects',
  financiero: 'Financiero',
  analytics: 'Analytics',
  notifications: 'Notificaciones Masivas',
  banners: 'Banners Publicitarios',
  audit: 'Auditoría',
  inbox: 'Inbox',
};

export function hasModuleAccess(
  user: { role?: string; modulePermissions?: string[] | null } | null,
  module: AdminModule
): boolean {
  if (!user) return false;
  if (user.role === 'SUPERADMIN') {
    if (!user.modulePermissions || user.modulePermissions.length === 0) return true;
    return user.modulePermissions.includes(module);
  }
  if (user.role === 'MOTEL_ADMIN') {
    if (!user.modulePermissions || user.modulePermissions.length === 0) {
      return module === 'dashboard' || module === 'motels';
    }
    return user.modulePermissions.includes(module);
  }
  return user.modulePermissions?.includes(module) ?? false;
}
