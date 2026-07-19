import type { ReactNode } from 'react';
import type { Promo } from './types';
import AdminImage from './AdminImage';

type Props = { promo: Promo; superAdmin: boolean; menuOpen: boolean; children?: ReactNode; onEdit: (promo: Promo) => void; onDelete: (id: string) => void; onMenuChange: (id: string | null) => void };

export default function PromoCard({ promo, superAdmin, menuOpen, children, onEdit, onDelete, onMenuChange }: Props) {
  return <article className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
    {promo.imageUrl && <AdminImage src={promo.imageUrl} alt={promo.title} className="w-full h-48 object-cover rounded-t-xl" />}
    <div className="p-4">
      <div className="flex items-start justify-between mb-2"><h3 className="text-lg font-semibold text-slate-900 flex-1">{promo.title}</h3><div className="flex items-center gap-1 flex-shrink-0">{promo.hasPromoCode && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-semibold">Código</span>}{superAdmin && promo.isGlobal && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-semibold">🏠 Home</span>}</div></div>
      {promo.description && <p className="text-sm text-slate-600 mb-3">{promo.description}</p>}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-200"><button type="button" onClick={() => onEdit(promo)} className="rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700">Editar</button><div className="relative"><button type="button" onClick={() => onMenuChange(menuOpen ? null : promo.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200" aria-label="Más acciones" title="Más acciones">•••</button>{menuOpen && <><button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => onMenuChange(null)} aria-label="Cerrar acciones" /><div className="absolute right-0 mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-20"><button type="button" onClick={() => { onDelete(promo.id); onMenuChange(null); }} className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50">Eliminar</button></div></>}</div></div>
      {children}
    </div>
  </article>;
}
