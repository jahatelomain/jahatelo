'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  createdAt: string;
  motel?: Motel | null;
}

interface CurrentUser {
  id: string;
  role: UserRole;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [motels, setMotels] = useState<Motel[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state para crear
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: 'USER' as UserRole,
    motelId: '',
  });

  // Form state para editar
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'USER' as UserRole,
    motelId: '',
    isActive: true,
  });

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
      showToast('Error al cargar usuarios', 'error');
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
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
        showToast(
          `Usuario creado. Contraseña temporal: ${data.temporaryPassword}`,
          'success'
        );
        setShowCreateModal(false);
        setCreateForm({ email: '', name: '', role: 'USER', motelId: '' });
        fetchUsers();
      } else {
        showToast(data.error || 'Error al crear usuario', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast('Error al crear usuario', 'error');
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
        showToast('Usuario actualizado exitosamente', 'success');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Error al actualizar usuario', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Error al actualizar usuario', 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('¿Estás seguro de resetear la contraseña de este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      });

      const data = await response.json();

      if (response.ok && data.temporaryPassword) {
        showToast(
          `Contraseña reseteada. Nueva contraseña: ${data.temporaryPassword}`,
          'success'
        );
        fetchUsers();
      } else {
        showToast(data.error || 'Error al resetear contraseña', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('Error al resetear contraseña', 'error');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        showToast(
          `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`,
          'success'
        );
        fetchUsers();
      } else {
        const data = await response.json();
        showToast(data.error || 'Error al cambiar estado', 'error');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Error al cambiar estado', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Usuario eliminado exitosamente', 'success');
        fetchUsers();
      } else {
        const data = await response.json();
        showToast(data.error || 'Error al eliminar usuario', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Error al eliminar usuario', 'error');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      motelId: user.motelId || '',
      isActive: user.isActive,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Cargando usuarios...</div>
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            + Agregar Usuario
          </button>
        </div>
        <p className="text-slate-600">
          Total: {users.length} usuario{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white z-50`}
        >
          {toast.message}
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
              {users.map((user) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ email: '', name: '', role: 'USER', motelId: '' });
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
    </div>
  );
}
