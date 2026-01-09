'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { TableSkeleton } from '@/components/SkeletonLoader';

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
  createdAt: string;
  motel?: Motel | null;
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Form state para crear
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: 'USER' as UserRole,
    motelId: '',
    modulePermissions: [] as string[],
  });

  // Form state para editar
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'USER' as UserRole,
    motelId: '',
    isActive: true,
    modulePermissions: [] as string[],
  });

  const moduleOptions = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'motels', label: 'Moteles' },
    { value: 'promos', label: 'Promos' },
    { value: 'amenities', label: 'Amenities' },
    { value: 'users', label: 'Usuarios' },
    { value: 'prospects', label: 'Prospects' },
    { value: 'financiero', label: 'Financiero' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'audit', label: 'Auditoría' },
  ];

  useEffect(() => {
    checkAccess();
    fetchUsers();
    fetchMotels();
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
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchMotels = async () => {
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
        setCreateForm({ email: '', name: '', role: 'USER', motelId: '', modulePermissions: [] });
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
      modulePermissions: user.modulePermissions || [],
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const badges = {
      SUPERADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      MOTEL_ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
      USER: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return badges[role];
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter((user) => {
    // Filtro por rol
    if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;

    // Filtro por estado
    if (statusFilter === 'ACTIVE' && !user.isActive) return false;
    if (statusFilter === 'INACTIVE' && user.isActive) return false;

    // Búsqueda por nombre o email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = user.name.toLowerCase().includes(query);
      const matchEmail = user.email.toLowerCase().includes(query);
      const matchMotel = user.motel?.name.toLowerCase().includes(query);
      if (!matchName && !matchEmail && !matchMotel) {
        return false;
      }
    }

    return true;
  });

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
      <div className="bg-white rounded-lg p-8 text-center">
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
                Superadmin <span className="ml-1 opacity-75">({users.filter((u) => u.role === 'SUPERADMIN').length})</span>
              </button>
              <button
                onClick={() => setRoleFilter('MOTEL_ADMIN')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === 'MOTEL_ADMIN'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-300'
                }`}
              >
                Motel Admin <span className="ml-1 opacity-75">({users.filter((u) => u.role === 'MOTEL_ADMIN').length})</span>
              </button>
              <button
                onClick={() => setRoleFilter('USER')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  roleFilter === 'USER'
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Usuario <span className="ml-1 opacity-75">({users.filter((u) => u.role === 'USER').length})</span>
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
                Activos <span className="ml-1 opacity-75">({users.filter((u) => u.isActive).length})</span>
              </button>
              <button
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-red-300'
                }`}
              >
                Inactivos <span className="ml-1 opacity-75">({users.filter((u) => !u.isActive).length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold text-slate-900">{filteredUsers.length}</span> de{' '}
            <span className="font-semibold text-slate-900">{users.length}</span> usuarios
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{user.name}</div>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded transition"
                          title="Resetear contraseña"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`px-3 py-1 text-sm rounded transition ${
                            user.isActive
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                    const defaultModules =
                      nextRole === 'MOTEL_ADMIN' && createForm.modulePermissions.length === 0
                        ? ['dashboard', 'motels']
                        : createForm.modulePermissions;
                    setCreateForm({ ...createForm, role: nextRole, modulePermissions: defaultModules });
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
                  <select
                    value={createForm.motelId}
                    onChange={(e) => setCreateForm({ ...createForm, motelId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un motel</option>
                    {motels.map((motel) => (
                      <option key={motel.id} value={motel.id}>
                        {motel.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Permisos por módulo
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Si no elegís ninguno, SUPERADMIN mantiene acceso total.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {moduleOptions.map((module) => (
                    <label key={module.value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={createForm.modulePermissions.includes(module.value)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...createForm.modulePermissions, module.value]
                            : createForm.modulePermissions.filter((value) => value !== module.value);
                          setCreateForm({ ...createForm, modulePermissions: next });
                        }}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                      />
                      {module.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      email: '',
                      name: '',
                      role: 'USER',
                      motelId: '',
                      modulePermissions: [],
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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
                    const defaultModules =
                      nextRole === 'MOTEL_ADMIN' && editForm.modulePermissions.length === 0
                        ? ['dashboard', 'motels']
                        : editForm.modulePermissions;
                    setEditForm({ ...editForm, role: nextRole, modulePermissions: defaultModules });
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
                  <select
                    value={editForm.motelId}
                    onChange={(e) => setEditForm({ ...editForm, motelId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un motel</option>
                    {motels.map((motel) => (
                      <option key={motel.id} value={motel.id}>
                        {motel.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Permisos por módulo
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Si no elegís ninguno, SUPERADMIN mantiene acceso total.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {moduleOptions.map((module) => (
                    <label key={module.value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={editForm.modulePermissions.includes(module.value)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...editForm.modulePermissions, module.value]
                            : editForm.modulePermissions.filter((value) => value !== module.value);
                          setEditForm({ ...editForm, modulePermissions: next });
                        }}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                      />
                      {module.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{confirmAction.title}</h2>
            <p className="text-slate-600 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                {confirmAction.cancelText}
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                  confirmAction.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {confirmAction.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
