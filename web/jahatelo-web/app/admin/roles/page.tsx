'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { ADMIN_MODULES, ADMIN_MODULE_LABELS } from '@/lib/adminModules';
import type { AdminModule } from '@/lib/adminModules';
import PaginationControls from '../components/PaginationControls';
import { useDebounce } from '@/hooks/useDebounce';

type UserRole = 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  modulePermissions: string[];
  isActive: boolean;
  motel?: {
    name: string;
  } | null;
}

interface CurrentUser {
  id: string;
  role: UserRole;
}

export default function RolesPage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Filtros
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<AdminModule | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.user || data.user.role !== 'SUPERADMIN') {
        router.push('/admin');
        return;
      }

      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/admin');
    }
  };

  const fetchUsers = async () => {
    try {
      let url = '/api/admin/users';
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (moduleFilter !== 'ALL') params.append('module', moduleFilter);
      if (debouncedSearchQuery.trim()) params.append('search', debouncedSearchQuery.trim());
      params.append('page', String(page));
      params.append('limit', String(pageSize));
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const usersData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.users)
          ? data.users
          : [];
        const meta = Array.isArray(data) ? undefined : data?.meta;
        setUsers(usersData);
        setTotalItems(meta?.total ?? usersData.length);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsEditor = (user: User) => {
    setSelectedUser(user);
    setEditingPermissions(user.modulePermissions || []);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    setSaving(selectedUser.id);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulePermissions: editingPermissions }),
      });

      if (response.ok) {
        toast.success('Permisos actualizados correctamente');
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al actualizar permisos');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Error al actualizar permisos');
    } finally {
      setSaving(null);
    }
  };

  const togglePermission = (module: string) => {
    setEditingPermissions((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const badges = {
      SUPERADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      MOTEL_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
      USER: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return badges[role];
  };

  const getPermissionCount = (user: User): number => {
    if (user.role === 'SUPERADMIN' && (!user.modulePermissions || user.modulePermissions.length === 0)) {
      return ADMIN_MODULES.length; // Acceso total
    }
    return user.modulePermissions?.length || 0;
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    const nextKey = `${roleFilter}|${moduleFilter}|${debouncedSearchQuery.trim()}`;
    if (filtersKeyRef.current !== nextKey) {
      filtersKeyRef.current = nextKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, moduleFilter, debouncedSearchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-64" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-96" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'SUPERADMIN') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-600">Solo los SUPERADMIN pueden gestionar roles y permisos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Roles y Permisos</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona permisos de acceso a módulos por usuario
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <svg
                className="w-5 h-5 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filtro por Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Filtrar por Rol
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="ALL">Todos los roles</option>
              <option value="SUPERADMIN">Superadmin</option>
              <option value="MOTEL_ADMIN">Motel Admin</option>
              <option value="USER">Usuario</option>
            </select>
          </div>

          {/* Filtro por Módulo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Filtrar por Módulo
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as AdminModule | 'ALL')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="ALL">Todos los módulos</option>
              {ADMIN_MODULES.map((module) => (
                <option key={module} value={module}>
                  {ADMIN_MODULE_LABELS[module]}
                </option>
              ))}
            </select>
          </div>

          {/* Resultados */}
          <div className="flex items-end">
            <p className="text-sm text-slate-600">
              Mostrando <span className="font-semibold text-slate-900">{users.length}</span> de{' '}
              <span className="font-semibold text-slate-900">{totalItems}</span> usuarios
            </p>
          </div>
        </div>
      </div>

      {/* Lista de usuarios con permisos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Motel
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Permisos
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl text-slate-300">🔐</span>
                      <p className="text-slate-500 font-medium">
                        No se encontraron usuarios
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {user.motel?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {getPermissionCount(user)} / {ADMIN_MODULES.length}
                        </span>
                        <span className="text-xs text-slate-500">módulos</span>
                      </div>
                      {user.role === 'SUPERADMIN' &&
                       (!user.modulePermissions || user.modulePermissions.length === 0) && (
                        <span className="text-xs text-purple-600 font-medium">
                          Acceso total
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openPermissionsEditor(user)}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Editar Permisos
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && (
          <div className="px-6 pb-6">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal Editor de Permisos */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar Permisos
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedUser.name} ({selectedUser.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Información sobre permisos:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• <strong>SUPERADMIN sin permisos</strong> = Acceso total a todos los módulos</li>
                    <li>• <strong>SUPERADMIN con permisos</strong> = Solo acceso a los módulos seleccionados</li>
                    <li>• <strong>MOTEL_ADMIN sin permisos</strong> = Acceso solo a Dashboard y Moteles</li>
                    <li>• <strong>MOTEL_ADMIN con permisos</strong> = Acceso a los módulos seleccionados</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">
                  Módulos disponibles
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPermissions([...ADMIN_MODULES])}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    onClick={() => setEditingPermissions([])}
                    className="text-xs text-slate-600 hover:text-slate-700 font-medium"
                  >
                    Deseleccionar todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ADMIN_MODULES.map((module) => (
                  <label
                    key={module}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      editingPermissions.includes(module)
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editingPermissions.includes(module)}
                      onChange={() => togglePermission(module)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-600 w-5 h-5"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {ADMIN_MODULE_LABELS[module]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving === selectedUser.id}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-purple-200"
              >
                {saving === selectedUser.id ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
