import type { ReactNode } from 'react';
import type { Promo } from './types';
import AdminImage from './AdminImage';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';

type Props = { promo: Promo; menuOpen: boolean; children?: ReactNode; onEdit: (promo: Promo) => void; onDelete: (id: string) => void; onToggleActive: (promo: Promo) => void; onMenuChange: (id: string | null) => void };

export default function PromoCard({ promo, menuOpen, children, onEdit, onDelete, onToggleActive, onMenuChange }: Props) {
  return <article className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
    {promo.imageUrl && <AdminImage src={promo.imageUrl} alt={promo.title} className="w-full h-48 object-cover rounded-t-xl" />}
    <div className="p-4">
      <div className="flex items-start justify-between mb-2"><h3 className="text-lg font-semibold text-slate-900 flex-1">{promo.title}</h3><div className="flex items-center justify-end gap-1 flex-shrink-0 flex-wrap">{promo.hasPromoCode && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-semibold">Código</span>}<span className={`px-2 py-1 text-xs rounded-full font-semibold ${promo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{promo.isActive ? 'Activa' : 'Inactiva'}</span></div></div>
      {promo.description && <p className="text-sm text-slate-600 mb-3">{promo.description}</p>}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-200"><button type="button" onClick={() => onEdit(promo)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700" title="Editar promoción" aria-label="Editar promoción"><Pencil size={15} /></button><div className="relative"><button type="button" onClick={() => onMenuChange(menuOpen ? null : promo.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-slate-900" aria-label="Más acciones" title="Más acciones"><MoreHorizontal size={16} /></button>{menuOpen && <><button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => onMenuChange(null)} aria-label="Cerrar acciones" /><div className="absolute right-0 mt-2 flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg z-20"><button type="button" onClick={() => { onToggleActive(promo); onMenuChange(null); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-purple-50 hover:text-purple-700" title={promo.isActive ? 'Desactivar promoción' : 'Reactivar promoción'} aria-label={promo.isActive ? 'Desactivar promoción' : 'Reactivar promoción'}><Power size={15} /></button><button type="button" onClick={() => { onDelete(promo.id); onMenuChange(null); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50" title="Eliminar promoción" aria-label="Eliminar promoción"><Trash2 size={15} /></button></div></>}</div></div>
      {children}
    </div>
  </article>;
}
