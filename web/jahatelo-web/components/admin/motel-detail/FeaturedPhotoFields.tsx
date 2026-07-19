import type { ChangeEvent } from 'react';
import { normalizeLocalUrl } from '@/lib/normalizeLocalUrl';
import AdminImage from './AdminImage';

type PhotoForm = { featuredPhotoWeb: string; featuredPhotoApp: string };
type Props<T extends PhotoForm> = {
  form: T;
  uploadingAuto: boolean;
  uploadingWeb: boolean;
  uploadingApp: boolean;
  onChange: (form: T) => void;
  onAutoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onVariantUpload: (variant: 'web' | 'app', event: ChangeEvent<HTMLInputElement>) => void;
};

export default function FeaturedPhotoFields<T extends PhotoForm>({ form, uploadingAuto, uploadingWeb, uploadingApp, onChange, onAutoUpload, onVariantUpload }: Props<T>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Foto principal (auto)</label>
      <div className="flex flex-wrap items-center gap-3">
        <UploadButton uploading={uploadingAuto} label="Subir y generar 16:9 + 4:5" onChange={onAutoUpload} />
        <p className="text-xs text-slate-500">Usamos recorte central para web (16:9) y app (4:5).</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <VariantField variant="web" value={form.featuredPhotoWeb} uploading={uploadingWeb} onValueChange={(value) => onChange({ ...form, featuredPhotoWeb: value })} onUpload={onVariantUpload} />
        <VariantField variant="app" value={form.featuredPhotoApp} uploading={uploadingApp} onValueChange={(value) => onChange({ ...form, featuredPhotoApp: value })} onUpload={onVariantUpload} />
      </div>
    </div>
  );
}

function UploadButton({ uploading, label, onChange }: { uploading: boolean; label: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer font-medium hover:bg-slate-200 transition ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}><input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={uploading} /><span aria-hidden="true">{uploading ? '◌' : '↑'}</span>{uploading ? 'Subiendo...' : label}</label>;
}

function VariantField({ variant, value, uploading, onValueChange, onUpload }: { variant: 'web' | 'app'; value: string; uploading: boolean; onValueChange: (value: string) => void; onUpload: (variant: 'web' | 'app', event: ChangeEvent<HTMLInputElement>) => void }) {
  const web = variant === 'web';
  const label = web ? 'Web (16:9)' : 'App (4:5)';
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">URL Foto {label}</label>
      <input type="text" value={value} onChange={(event) => onValueChange(event.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-600 focus:border-transparent" placeholder={`https://ejemplo.com/foto-${variant}.jpg`} />
      <div className="flex flex-wrap items-center gap-3 mt-3"><UploadButton uploading={uploading} label={`Reemplazar ${web ? 'Web' : 'App'}`} onChange={(event) => onUpload(variant, event)} /><p className="text-xs text-slate-500">Recomendado {web ? '16:9' : '4:5'}.</p></div>
      {value && <div className="mt-3"><AdminImage src={normalizeLocalUrl(value) || ''} alt={`Preview ${variant}`} width={800} height={web ? 450 : 1000} className={`w-full ${web ? 'aspect-[16/9]' : 'aspect-[4/5]'} object-cover rounded-lg border border-slate-200`} /></div>}
    </div>
  );
}
