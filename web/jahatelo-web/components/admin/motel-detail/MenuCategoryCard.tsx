import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from './displayUtils';
import type { MenuCategory } from './types';

type Props = { category: MenuCategory; onAddItem: (categoryId: string) => void; onEditCategory: (category: MenuCategory) => void; onDeleteCategory: (categoryId: string) => void; onEditItem: (categoryId: string, item: MenuCategory['items'][number]) => void; onDeleteItem: (itemId: string) => void };

export default function MenuCategoryCard({ category, onAddItem, onEditCategory, onDeleteCategory, onEditItem, onDeleteItem }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{category.title}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => onAddItem(category.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700" title="Agregar item" aria-label="Agregar item"><Plus size={16} /></button>
          <button onClick={() => onEditCategory(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700" title="Editar categoría" aria-label="Editar categoría"><Pencil size={15} /></button>
          <details className="relative">
            <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer" title="Más acciones" aria-label="Más acciones"><MoreHorizontal size={16} /></summary>
            <div className="absolute right-0 mt-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg z-10">
              <button onClick={() => onDeleteCategory(category.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50" title="Eliminar categoría" aria-label="Eliminar categoría"><Trash2 size={15} /></button>
            </div>
          </details>
        </div>
      </div>
      {!category.items?.length ? <p className="text-slate-400 text-sm italic">No hay items en esta categoría</p> : (
        <div className="space-y-3">
          {category.items.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 py-3 border-b border-slate-100 last:border-b-0">
              <div className="flex-1"><p className="font-medium text-slate-900">{item.name}</p>{item.description && <p className="text-sm text-slate-600 mt-1">{item.description}</p>}</div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900">Gs. {formatPrice(item.price)}</p>
                <button onClick={() => onEditItem(category.id, item)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:text-purple-700" title="Editar item" aria-label={`Editar ${item.name}`}><Pencil size={15} /></button>
                <button onClick={() => onDeleteItem(item.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50" title="Eliminar item" aria-label="Eliminar item"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
