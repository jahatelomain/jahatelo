import type { FormEvent } from 'react';
import DirtyBanner from '@/components/admin/DirtyBanner';

type CategoryForm = { title: string; sortOrder: number };
type ItemForm = { name: string; price: string; description: string };

type Props = {
  showCategoryForm: boolean;
  showItemForm: boolean;
  editingCategory?: boolean;
  editingItem?: boolean;
  categoryForm: CategoryForm;
  itemForm: ItemForm;
  categoryFormDirty: boolean;
  itemFormDirty: boolean;
  onCategoryChange: (form: CategoryForm) => void;
  onItemChange: (form: ItemForm) => void;
  onSaveCategory: (event: FormEvent) => void;
  onSaveItem: (event: FormEvent) => void;
  onCancelCategory: () => void;
  onCancelItem: () => void;
};

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function MenuForms({
  showCategoryForm,
  showItemForm,
  editingCategory = false,
  editingItem = false,
  categoryForm,
  itemForm,
  categoryFormDirty,
  itemFormDirty,
  onCategoryChange,
  onItemChange,
  onSaveCategory,
  onSaveItem,
  onCancelCategory,
  onCancelItem,
}: Props) {
  if (!showCategoryForm && !showItemForm) return null;

  if (showCategoryForm) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button type="button" onClick={onCancelCategory} aria-label="Cerrar formulario de categoría" className="text-slate-400 transition-colors hover:text-slate-600">
            <CloseIcon />
          </button>
        </div>
        <DirtyBanner visible={categoryFormDirty} />
        <form onSubmit={onSaveCategory} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Título *</label>
            <input
              type="text"
              value={categoryForm.title}
              onChange={(event) => onCategoryChange({ ...categoryForm, title: event.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600"
              placeholder="Ej: Bebidas, Comidas, etc."
              required
            />
          </div>
          <FormActions submitLabel={editingCategory ? 'Guardar Categoría' : 'Crear Categoría'} onCancel={onCancelCategory} />
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{editingItem ? 'Editar Item' : 'Nuevo Item'}</h3>
        <button type="button" onClick={onCancelItem} aria-label="Cerrar formulario de item" className="text-slate-400 transition-colors hover:text-slate-600">
          <CloseIcon />
        </button>
      </div>
      <DirtyBanner visible={itemFormDirty} />
      <form onSubmit={onSaveItem} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Nombre *</label>
          <input type="text" value={itemForm.name} onChange={(event) => onItemChange({ ...itemForm, name: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600" placeholder="Ej: Coca-Cola, Hamburguesa" required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Precio *</label>
          <input type="number" value={itemForm.price} onChange={(event) => onItemChange({ ...itemForm, price: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600" placeholder="Gs." required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Descripción <span className="text-slate-400">(opcional)</span></label>
          <textarea value={itemForm.description} onChange={(event) => onItemChange({ ...itemForm, description: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600" rows={3} placeholder="Descripción del item" />
        </div>
        <FormActions submitLabel={editingItem ? 'Guardar Item' : 'Crear Item'} onCancel={onCancelItem} />
      </form>
    </div>
  );
}

function FormActions({ submitLabel, onCancel }: { submitLabel: string; onCancel: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-6 pb-4 pt-4 backdrop-blur sm:flex-row sm:justify-end">
      <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50">Cancelar</button>
      <button type="submit" className="rounded-lg bg-purple-600 px-6 py-2.5 font-medium text-white shadow-sm shadow-purple-200 transition-colors hover:bg-purple-700">{submitLabel}</button>
    </div>
  );
}
