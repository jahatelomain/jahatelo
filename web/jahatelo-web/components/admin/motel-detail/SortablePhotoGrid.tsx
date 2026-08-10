import { useMemo, useState } from 'react';
import { normalizeLocalUrl } from '@/lib/normalizeLocalUrl';
import AdminImage from './AdminImage';

export type SortablePhoto = { id: string; url: string; order: number };

type Props = {
  photos: SortablePhoto[];
  alt: string;
  onReorder: (photos: SortablePhoto[]) => void;
  onDelete: (photoId: string) => void;
  square?: boolean;
  publishedPhotoLimit?: number;
};

export default function SortablePhotoGrid({ photos, alt, onReorder, onDelete, square = false, publishedPhotoLimit = Number.POSITIVE_INFINITY }: Props) {
  const ordered = useMemo(() => [...photos].sort((a, b) => a.order - b.order), [photos]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const move = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const reordered = [...ordered];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered);
  };

  if (!ordered.length) return null;

  return (
    <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3">
      {ordered.map((photo, index) => {
        const isPublished = index < publishedPhotoLimit;
        return (
        <div
          key={photo.id}
          draggable
          onDragStart={(event) => { setDraggedId(photo.id); event.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverId(photo.id); }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(event) => { event.preventDefault(); move(ordered.findIndex((item) => item.id === draggedId), index); setDraggedId(null); setDragOverId(null); }}
          onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
          className={`group relative cursor-move transition-all ${draggedId === photo.id ? 'scale-95 opacity-50' : ''} ${dragOverId === photo.id && draggedId !== photo.id ? 'scale-105 ring-2 ring-purple-600' : ''}`}
        >
          <AdminImage src={normalizeLocalUrl(photo.url) || ''} alt={alt} className={`pointer-events-none w-full rounded-lg border border-slate-200 object-cover ${square ? 'aspect-square' : 'h-32'} ${isPublished ? '' : 'opacity-40 grayscale'}`} />
          <div className="absolute left-2 top-2 rounded bg-slate-900/70 px-2 py-1 text-xs font-semibold text-white">{index + 1}</div>
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <MoveButton direction="left" disabled={index === 0} onClick={() => move(index, index - 1)} />
            <MoveButton direction="right" disabled={index === ordered.length - 1} onClick={() => move(index, index + 1)} />
            <button type="button" onClick={() => onDelete(photo.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700" title="Eliminar foto" aria-label="Eliminar foto">×</button>
          </div>
          {!isPublished && <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/25 p-3 text-center"><div className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-white">Hacé upgrade de tu plan para visualizar</div></div>}
          {isPublished && <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"><div className="rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-white">Arrastrá para reordenar</div></div>}
        </div>
      )})}
    </div>
  );
}

function MoveButton({ direction, disabled, onClick }: { direction: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  const label = direction === 'left' ? 'Mover foto hacia la izquierda' : 'Mover foto hacia la derecha';
  return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40" title={label} aria-label={label}>{direction === 'left' ? '←' : '→'}</button>;
}
