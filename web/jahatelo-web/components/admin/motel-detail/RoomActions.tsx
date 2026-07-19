import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { RoomType } from './types';

type Props = {
  room: RoomType;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onEdit: (room: RoomType) => void;
  onDelete: (roomId: string) => void;
};

export default function RoomActions({ room, index, total, onMove, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label={`Ordenar ${room.name}`}>
        <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="inline-flex h-8 w-8 items-center justify-center border-r border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-30" title="Mover habitación hacia arriba" aria-label="Mover habitación hacia arriba">↑</button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(index, index + 1)} className="inline-flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-30" title="Mover habitación hacia abajo" aria-label="Mover habitación hacia abajo">↓</button>
      </div>
      <button type="button" onClick={() => onEdit(room)} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700" title="Editar habitación" aria-label="Editar habitación">
        <Pencil size={15} />
      </button>
      <details className="relative">
        <summary className="list-none inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-purple-200 cursor-pointer" title="Más acciones" aria-label="Más acciones">
          <MoreHorizontal size={16} />
        </summary>
        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
          <button type="button" onClick={() => onDelete(room.id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50">
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </details>
    </div>
  );
}
