import { useState } from 'react';
import SortablePhotoGrid, { type SortablePhoto } from './SortablePhotoGrid';

type Props = {
  motelName: string;
  photos: SortablePhoto[];
  onReorder: (photos: SortablePhoto[]) => void;
  onDelete: (photoId: string) => void;
  onUpload: (file: File) => Promise<void>;
};

export default function MotelPhotoGalleryCard({ motelName, photos, onReorder, onDelete, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      alert('Error al subir la foto');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-700">Galería de fotos</h3>
      {photos.length > 0 && <p className="mb-4 text-xs text-slate-400">Usá las flechas o arrastrá para reordenar</p>}
      <SortablePhotoGrid photos={photos} alt={`Fotos de ${motelName}`} square onReorder={onReorder} onDelete={onDelete} />
      <label className={`flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:border-purple-400 hover:text-purple-600 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
        <span aria-hidden>＋</span>{uploading ? 'Subiendo...' : 'Agregar foto'}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFile} />
      </label>
    </section>
  );
}
