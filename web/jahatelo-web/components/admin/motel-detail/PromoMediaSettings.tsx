import type { ChangeEvent } from 'react';
import { createInitialPromoForm } from './formDefaults';
import AdminImage from './AdminImage';

type PromoForm = ReturnType<typeof createInitialPromoForm>;

type Props = {
  form: PromoForm;
  uploading: boolean;
  canPublishGlobally: boolean;
  onChange: (form: PromoForm) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function PromoMediaSettings({ form, uploading, canPublishGlobally, onChange, onFileChange }: Props) {
  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">URL de Imagen</label>
        <input type="text" value={form.imageUrl} onChange={(event) => onChange({ ...form, imageUrl: event.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-purple-600" placeholder="https://ejemplo.com/promo.jpg" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className={`inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200 ${uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} disabled={uploading} />
            {uploading ? 'Subiendo...' : 'Subir desde archivo'}
          </label>
          <p className="text-xs text-slate-500">Formatos sugeridos: JPG o PNG.</p>
        </div>
        {form.imageUrl && <AdminImage src={form.imageUrl} alt="Preview" className="mt-3 h-48 w-full max-w-md rounded-lg border border-slate-200 object-cover" />}
      </div>
      {canPublishGlobally && (
        <div className="border-t border-slate-200 pt-4">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={form.isGlobal} onChange={(event) => onChange({ ...form, isGlobal: event.target.checked })} className="rounded text-purple-600 focus:ring-purple-600" />
            <span className="text-sm text-slate-700"><span className="font-medium">Mostrar en Home</span><span className="block text-xs text-slate-500">Esta promo aparecerá en la sección de promociones del Home de la app y la web</span></span>
          </label>
        </div>
      )}
    </>
  );
}
