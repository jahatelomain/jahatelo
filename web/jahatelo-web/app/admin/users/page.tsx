'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useDebounce } from '@/hooks/useDebounce';
import { usePersistentAdminFilters } from '@/hooks/usePersistentAdminFilters';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import SearchableSelect from '@/components/admin/SearchableSelect';
import { KeyRound, Pencil, Power, Trash2 } from 'lucide-react';

type UserRole = 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';

interface Motel {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  motelId?: string | null;
  modulePermissions?: string[];
  accessProfile?: AccessProfile | null;
  createdAt: string;
  motel?: Motel | null;
}

interface AccessProfile {
  id: string;
  key: string;
  name: string;
  baseRole: UserRole;
  isActive: boolean;
}

interface CurrentUser {
  id: string;
  role: UserRole;
}

type ConfirmAction = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  danger?: boolean;
} | null;

export default function UsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [motels, setMotels] = useState<Motel[]>([]);
  const [accessProfiles, setAccessProfiles] = useState<AccessProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<{
    activeCount: number;
    inactiveCount: number;
    roleCounts: Record<string, number>;
  }>({
    activeCount: 0,
    inactiveCount: 0,
    roleCounts: {},
  });
  const [searchQuery, setSearchQuery] = usePersistentAdminFilters('users-search', '');
  const [roleFilter, setRoleFilter] = usePersistentAdminFilters<UserRole | 'ALL'>('users-role', 'ALL');
  const [statusFilter, setStatusFilter] = usePersistentAdminFilters<'ALL' | 'ACTIVE' | 'INACTIVE'>('users-status', 'ALL');
  const pageSize = 20;
  const filtersKeyRef = useRef('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const hasMore = users.length < totalItems;

  // Form state para crear
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: 'USER' as UserRole,
    motelId: '',
    accessProfileId: '',
  });

  // Form state para editar
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'USER' as UserRole,
    motelId: '',
    isActive: true,
    accessProfileId: '',
  });

  // La verificación de acceso se ejecuta una sola vez al montar la pantalla.
  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchUsers = async (isLoadingMore = false) => {
    if (!currentUser) return;
    if (isLoadingMore) {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
      const response = await fetch(`/api/admin/users?${params.toString()}`);
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
        setUsers((prev) => (isLoadingMore ? [...prev, ...usersData] : usersData));
        setTotalItems(meta?.total ?? usersData.length);
        setSummary({
          activeCount: meta?.summary?.activeCount ?? usersData.filter((u: User) => u.isActive).length,
          inactiveCount:
            meta?.summary?.inactiveCount ??
            usersData.filter((u: User) => !u.isActive).length,
          roleCounts: meta?.summary?.roleCounts ?? {},
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!isLoadingMore) {
        toast.error('Error al cargar usuarios');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMotels = async () => {
    if (!currentUser || currentUser.role !== 'SUPERADMIN') return;
    try {
      const response = await fetch('/api/admin/motels');
      if (response.ok) {
        const data = await response.json();
        setMotels(data);
      }
    } catch (error) {
      console.error('Error fetching motels:', error);
    }
  };

  const fetchAccessProfiles = async () => {
    if (!currentUser || currentUser.role !== 'SUPERADMIN') return;
    try {
      const response = await fetch('/api/admin/access-profiles');
      if (response.ok) {
        setAccessProfiles(await response.json());
      }
    } catch (error) {
      console.error('Error fetching access profiles:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Usuario creado. Contraseña temporal: ${data.temporaryPassword}`
        );
        setShowCreateModal(false);
        setCreateForm({ email: '', name: '', role: 'USER', motelId: '', accessProfileId: '' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Usuario actualizado exitosamente');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  const handleResetPassword = (userId: string) => {
    setConfirmAction({
      title: 'Resetear Contraseña',
      message: '¿Estás seguro de resetear la contraseña de este usuario?',
      confirmText: 'Resetear',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetPassword: true }),
          });

          const data = await response.json();

          if (response.ok && data.temporaryPassword) {
            toast.success(
              `Contraseña reseteada. Nueva contraseña: ${data.temporaryPassword}`
            );
            fetchUsers();
          } else {
            toast.error(data.error || 'Error al resetear contraseña');
          }
        } catch (error) {
          console.error('Error resetting password:', error);
          toast.error('Error al resetear contraseña');
        }
        setConfirmAction(null);
      },
    });
  };

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    setConfirmAction({
      title: currentStatus ? 'Desactivar Usuario' : 'Activar Usuario',
      message: `¿Estás seguro de ${currentStatus ? 'desactivar' : 'activar'} este usuario?`,
      confirmText: currentStatus ? 'Desactivar' : 'Activar',
      cancelText: 'Cancelar',
      danger: currentStatus,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !currentStatus }),
          });

          if (response.ok) {
            toast.success(
              `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
            );
            fetchUsers();
          } else {
            const data = await response.json();
            toast.error(data.error || 'Error al cambiar estado');
          }
        } catch (error) {
          console.error('Error toggling user status:', error);
          toast.error('Error al cambiar estado');
        }
        setConfirmAction(null);
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmAction({
      title: 'Eliminar Usuario',
      message: '¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Usuario eliminado exitosamente');
            fetchUsers();
          } else {
            const data = await response.json();
            toast.error(data.error || 'Error al eliminar usuario');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          toast.error('Error al eliminar usuario');
        }
        setConfirmAction(null);
      },
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      motelId: user.motelId || '',
      isActive: user.isActive,
      accessProfileId: user.accessProfile?.id || '',
    });
    setShowEditModal(true);
  };

  const { sentinelRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: () => setPage((prev) => prev + 1),
    threshold: 200,
  });

  const getRoleBadge = (role: UserRole) => {
    const badges = {
      SUPERADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      MOTEL_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
      USER: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return badges[role];
  };

  useEffect(() => {
    if (!currentUser) return;
    const nextKey = `${roleFilter}|${statusFilter}|${debouncedSearchQuery.trim()}`;
    const filtersChanged = filtersKeyRef.current !== nextKey;

    if (filtersChanged) {
      filtersKeyRef.current = nextKey;
      setUsers([]);
      setPage(1);
      setLoading(true);
      fetchUsers(false);
    } else {
      const isLoadingMore = page > 1;
      fetchUsers(isLoadingMore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter, debouncedSearchQuery, currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'SUPERADMIN') return;
    fetchMotels();
    fetchAccessProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-48" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-64" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 bg-slate-50 rounded animate-pulse flex-1" />
              <div className="h-10 bg-slate-50 rounded animate-pulse flex-1" />
            </div>
          </div>
        </div>
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'SUPERADMIN') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-600">Solo los SUPERADMIN pueden acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-600 mt-1">
            Administrá los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Usuario
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Barra de búsqueda */}
          <div className="md:col-span-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, email o motel..."
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros tipo pill */}
        <div className="space-y-3">
          {/* Rol */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Rol</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-300'
                }`}
              >
                Todos <span className="ml-1 opacity-75">({users.length})</span>
              </button>
              <button
                onClick={() => setRoleFilter('SUPERADMIN')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === 'SUPERADMIN'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-purple-300'
                }`}
              >
                Superadmin <span className="ml-1 opacity-75">({summary.roleCounts.SUPERADMIN ?? 0})</span>
              </button>
              <button
                onClick={() => setRoleFilter('MOTEL_ADMIN')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === 'MOTEL_ADMIN'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-300'
                }`}
              >
                Motel Admin <span className="ml-1 opacity-75">({summary.roleCounts.MOTEL_ADMIN ?? 0})</span>
              </button>
              <button
                onClick={() => setRoleFilter('USER')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === 'USER'
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Usuario <span className="ml-1 opacity-75">({summary.roleCounts.USER ?? 0})</span>
              </button>
            </div>
          </div>

          {/* Estado */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-green-300'
                }`}
              >
                Activos <span className="ml-1 opacity-75">({summary.activeCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-red-300'
                }`}
              >
                Inactivos <span className="ml-1 opacity-75">({summary.inactiveCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{users.length}</span> de{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span> usuarios
          </p>
          {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Perfil
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Motel
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl text-slate-300">🔍</span>
                      <p className="text-slate-500 font-medium">
                        {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'No se encontraron usuarios con estos filtros'
                          : 'No hay usuarios registrados'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'Intentá con otros criterios de búsqueda'
                          : 'Los usuarios aparecerán aquí cuando sean creados'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{user.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.accessProfile?.name || 'Sin perfil'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{user.email}</td>
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button onClick={() => openEditModal(user)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors" title="Editar usuario" aria-label="Editar usuario"><Pencil size={16} /></button>
                        <button onClick={() => handleResetPassword(user.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700 transition-colors" title="Resetear contraseña" aria-label="Resetear contraseña"><KeyRound size={16} /></button>
                        {user.id !== currentUser?.id && <button onClick={() => handleToggleActive(user.id, user.isActive)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700 transition-colors" title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'} aria-label={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}><Power size={16} /></button>}
                        {user.id !== currentUser?.id && <button onClick={() => handleDeleteUser(user.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors" title="Eliminar usuario" aria-label="Eliminar usuario"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite scroll sentinel y loader */}
        {users.length > 0 && (
          <div ref={sentinelRef} className="px-6 pb-6">
            {loadingMore && (
              <div className="flex justify-center items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600">Cargando más usuarios...</span>
              </div>
            )}
            {!hasMore && totalItems > pageSize && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">
                  Mostrando todos los usuarios ({users.length} de {totalItems})
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as UserRole;
                    setCreateForm({ ...createForm, role: nextRole, accessProfileId: '' });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="USER">USER</option>
                  <option value="MOTEL_ADMIN">MOTEL_ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>
              {createForm.role === 'MOTEL_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motel *
                  </label>
                  <SearchableSelect
                    value={createForm.motelId}
                    onChange={(motelId) => setCreateForm({ ...createForm, motelId })}
                    placeholder="Buscar motel..."
                    options={motels.map((motel) => ({ value: motel.id, label: motel.name, searchText: motel.slug }))}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Perfil de acceso
                </label>
                <select
                  value={createForm.accessProfileId}
                  onChange={(e) => setCreateForm({ ...createForm, accessProfileId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Perfil predeterminado del rol</option>
                  {accessProfiles
                    .filter((profile) => profile.isActive && profile.baseRole === createForm.role)
                    .map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">Los permisos se definen y reutilizan desde Configuración → Perfiles de acceso.</p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      email: '',
                      name: '',
                      role: 'USER',
                      motelId: '',
                      accessProfileId: '',
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm shadow-purple-200"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Editar Usuario</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email (no editable)
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as UserRole;
                    setEditForm({ ...editForm, role: nextRole, accessProfileId: '' });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="USER">USER</option>
                  <option value="MOTEL_ADMIN">MOTEL_ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>
              {editForm.role === 'MOTEL_ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motel *
                  </label>
                  <SearchableSelect
                    value={editForm.motelId}
                    onChange={(motelId) => setEditForm({ ...editForm, motelId })}
                    placeholder="Buscar motel..."
                    options={motels.map((motel) => ({ value: motel.id, label: motel.name, searchText: motel.slug }))}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Perfil de acceso
                </label>
                <select
                  value={editForm.accessProfileId}
                  onChange={(e) => setEditForm({ ...editForm, accessProfileId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Perfil predeterminado del rol</option>
                  {accessProfiles
                    .filter((profile) => profile.isActive && profile.baseRole === editForm.role)
                    .map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">Los permisos se administran desde Configuración → Perfiles de acceso.</p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm shadow-purple-200"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText}
        cancelText={confirmAction?.cancelText}
        danger={confirmAction?.danger}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </div>
  );
}
