'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Power, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const MODULES = [
  ['dashboard', 'Dashboard'], ['motels', 'Moteles'], ['promos', 'Promos'], ['amenities', 'Amenities'],
  ['users', 'Usuarios'], ['roles', 'Perfiles'], ['prospects', 'Prospects'], ['financiero', 'Financiero'],
  ['analytics', 'Analytics'], ['notifications', 'Notificaciones'], ['banners', 'Banners'], ['audit', 'Auditoría'],
  ['inbox', 'Inbox'], ['configuracion', 'Configuración'], ['export', 'Exportaciones'],
] as const;

const ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'MANAGE'] as const;
type Role = 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
type Action = typeof ACTIONS[number];
type Permission = { module: string; actions: Action[] };
type Profile = {
  id: string; key: string; name: string; description: string | null; isSystem: boolean;
  baseRole: Role; isActive: boolean; permissions: Permission[]; _count: { users: number };
};

const emptyForm = () => ({ key: '', name: '', description: '', baseRole: 'USER' as Role, permissions: [] as Permission[] });

export default function AccessProfilesPanel() {
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/admin/access-profiles');
      if (!response.ok) throw new Error('No se pudieron cargar los perfiles');
      setProfiles(await response.json());
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar los perfiles de acceso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProfiles(); }, []);

  const selectedModules = useMemo(() => new Map(form.permissions.map((item) => [item.module, item.actions])), [form.permissions]);

  const setActions = (module: string, action: Action, checked: boolean) => {
    setForm((current) => {
      const previous = current.permissions.find((item) => item.module === module)?.actions ?? [];
      const nextActions = checked ? [...new Set([...previous, action])] : previous.filter((value) => value !== action);
      return {
        ...current,
        permissions: nextActions.length
          ? [...current.permissions.filter((item) => item.module !== module), { module, actions: nextActions }]
          : current.permissions.filter((item) => item.module !== module),
      };
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setForm({ key: profile.key, name: profile.name, description: profile.description ?? '', baseRole: profile.baseRole, permissions: profile.permissions });
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        key: form.key.trim().toLowerCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      const response = await fetch(editing ? `/api/admin/access-profiles/${editing.id}` : '/api/admin/access-profiles', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { name: payload.name, description: payload.description, permissions: payload.permissions } : payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el perfil');
      toast.success(editing ? 'Perfil actualizado' : 'Perfil creado');
      setShowForm(false);
      await loadProfiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (profile: Profile) => {
    try {
      const response = await fetch(`/api/admin/access-profiles/${profile.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !profile.isActive }),
      });
      if (!response.ok) throw new Error();
      toast.success(profile.isActive ? 'Perfil desactivado' : 'Perfil activado');
      await loadProfiles();
    } catch {
      toast.error('No se pudo actualizar el perfil');
    }
  };

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">Cargando perfiles de acceso…</div>;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Perfiles de acceso</h2>
          <p className="mt-1 text-sm text-slate-600">Definí permisos reutilizables y asigná un perfil a cada usuario.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-purple-200 hover:bg-purple-700"><Plus size={18} />Nuevo perfil</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {profiles.map((profile) => (
          <article key={profile.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="rounded-lg bg-purple-50 p-2.5 text-purple-700"><ShieldCheck size={22} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                  {profile.isSystem && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Sistema</span>}
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${profile.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{profile.isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{profile.description || 'Sin descripción'}</p>
                <p className="mt-3 text-xs text-slate-500">Rol base: <strong>{profile.baseRole}</strong> · {profile.permissions.length} módulos · {profile._count.users} usuarios</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => openEdit(profile)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-purple-200 hover:text-purple-700" title="Editar perfil" aria-label="Editar perfil"><Pencil size={15} /></button>
              <button onClick={() => void toggleActive(profile)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-purple-200 hover:text-purple-700" title={profile.isActive ? 'Desactivar perfil' : 'Activar perfil'} aria-label={profile.isActive ? 'Desactivar perfil' : 'Activar perfil'}><Power size={15} /></button>
            </div>
          </article>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
          <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">{editing ? 'Editar perfil' : 'Nuevo perfil de acceso'}</h2><p className="mt-1 text-sm text-slate-600">El rol base define el alcance general; los permisos definen las acciones habilitadas.</p></div><button onClick={() => setShowForm(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X /></button></div>
            <form onSubmit={save} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Nombre<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Clave técnica<input required disabled={Boolean(editing)} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="ej. comercial" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" /></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Descripción<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Rol base<select disabled={Boolean(editing)} value={form.baseRole} onChange={(e) => setForm({ ...form, baseRole: e.target.value as Role })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"><option value="USER">Usuario</option><option value="MOTEL_ADMIN">Administrador de motel</option><option value="SUPERADMIN">Administrador interno</option></select></label>
              </div>
              <fieldset><legend className="text-sm font-semibold text-slate-900">Permisos por módulo</legend><p className="mt-1 text-xs text-slate-500">MANAGE permite todas las operaciones del módulo. Elegí acciones específicas para acceso limitado.</p>
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Módulo</th>{ACTIONS.map((action) => <th key={action} className="px-2 py-2 text-center">{action}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{MODULES.map(([module, label]) => <tr key={module}><td className="px-3 py-2 font-medium text-slate-700">{label}</td>{ACTIONS.map((action) => <td key={action} className="px-2 py-2 text-center"><input type="checkbox" checked={selectedModules.get(module)?.includes(action) ?? false} onChange={(e) => setActions(module, action, e.target.checked)} className="rounded border-slate-300 text-purple-600 focus:ring-purple-600" aria-label={`${label}: ${action}`} /></td>)}</tr>)}</tbody></table></div>
              </fieldset>
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700">Cancelar</button><button disabled={saving} type="submit" className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar perfil'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
