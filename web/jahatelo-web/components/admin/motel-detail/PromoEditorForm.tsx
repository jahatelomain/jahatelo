import type { ChangeEvent, FormEvent } from 'react';
import DirtyBanner from '@/components/admin/DirtyBanner';
import type { createInitialPromoForm } from './formDefaults';
import PromoCodeSettings from './PromoCodeSettings';
import PromoMediaSettings from './PromoMediaSettings';

type PromoForm = ReturnType<typeof createInitialPromoForm>;
type Props = {
  editing: boolean;
  dirty: boolean;
  uploading: boolean;
  canPublishGlobally: boolean;
  form: PromoForm;
  onChange: (form: PromoForm) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function PromoEditorForm({ editing, dirty, uploading, canPublishGlobally, form, onChange, onFileChange, onCancel, onSubmit }: Props) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{editing ? 'Editar Promo' : 'Nueva Promo'}</h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none" aria-label="Cerrar formulario" title="Cerrar">×</button>
      </div>
      <DirtyBanner visible={dirty} />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="promo-title" className="block text-sm font-medium text-slate-700 mb-2">Título *</label>
          <input id="promo-title" type="text" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder="Ej: 2x1 en habitaciones los fines de semana" required />
        </div>
        <div>
          <label htmlFor="promo-description" className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
          <textarea id="promo-description" value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent" rows={3} placeholder="Detalles de la promoción (opcional)" />
        </div>
        <PromoMediaSettings form={form} uploading={uploading} canPublishGlobally={canPublishGlobally} onChange={onChange} onFileChange={onFileChange} />
        <PromoCodeSettings form={form} onChange={onChange} />
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 pt-4 pb-4 -mx-6 px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Cancelar</button>
          <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm shadow-purple-200">{editing ? 'Guardar Cambios' : 'Crear Promo'}</button>
        </div>
      </form>
    </div>
  );
}
