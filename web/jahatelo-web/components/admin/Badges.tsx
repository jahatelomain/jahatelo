'use client';

import React from 'react';

/**
 * Tokens de color centralizados para badges del panel admin.
 * Paleta slate/violet consistente con el diseño del admin.
 */

const badgeBase = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';

// StatusBadge: estados de aprobación/revisión (PENDING, APPROVED, REJECTED)
export type StatusVariant = 'PENDING' | 'APPROVED' | 'REJECTED';

const statusStyles: Record<StatusVariant, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<StatusVariant, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

export function StatusBadge({ status }: { status: StatusVariant }) {
  return (
    <span className={`${badgeBase} ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

// ActiveBadge: estado activo/inactivo
export type ActiveVariant = 'ACTIVE' | 'INACTIVE';

const activeStyles: Record<ActiveVariant, string> = {
  ACTIVE: 'bg-violet-50 text-violet-700 border-violet-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
};

const activeLabels: Record<ActiveVariant, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

export function ActiveBadge({ active }: { active: boolean | ActiveVariant }) {
  const variant: ActiveVariant =
    active === true || active === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
  return (
    <span className={`${badgeBase} ${activeStyles[variant]}`}>
      {activeLabels[variant]}
    </span>
  );
}

// RoleBadge: roles de usuario
export type RoleVariant = 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';

const roleStyles: Record<RoleVariant, string> = {
  SUPERADMIN: 'bg-violet-100 text-violet-700 border-violet-200',
  MOTEL_ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  USER: 'bg-slate-100 text-slate-600 border-slate-200',
};

const roleLabels: Record<RoleVariant, string> = {
  SUPERADMIN: 'Super Admin',
  MOTEL_ADMIN: 'Admin Motel',
  USER: 'Usuario',
};

export function RoleBadge({ role }: { role: RoleVariant }) {
  return (
    <span className={`${badgeBase} ${roleStyles[role]}`}>
      {roleLabels[role]}
    </span>
  );
}

// ReadBadge: para inbox (leído/no leído)
export type ReadVariant = 'READ' | 'UNREAD';

const readStyles: Record<ReadVariant, string> = {
  READ: 'bg-slate-100 text-slate-600 border-slate-200',
  UNREAD: 'bg-violet-50 text-violet-700 border-violet-200',
};

const readLabels: Record<ReadVariant, string> = {
  READ: 'Leído',
  UNREAD: 'No leído',
};

export function ReadBadge({ read }: { read: boolean | ReadVariant }) {
  const variant: ReadVariant =
    read === true || read === 'READ' ? 'READ' : 'UNREAD';
  return (
    <span className={`${badgeBase} ${readStyles[variant]}`}>
      {readLabels[variant]}
    </span>
  );
}