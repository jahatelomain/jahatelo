import SortablePhotoGrid, { type SortablePhoto } from './SortablePhotoGrid';

type Props = {
  roomId: string;
  roomName: string;
  photos: SortablePhoto[];
  planLabel: string;
  photoLimit: string;
  uploading: boolean;
  onUpload: (roomId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onReorder: (photos: SortablePhoto[]) => void;
  onDelete: (photoId: string) => void;
};

export default function RoomPhotoManager({
  roomId,
  roomName,
  photos,
  planLabel,
  photoLimit,
  uploading,
  onUpload,
  onReorder,
  onDelete,
}: Props) {
  return (
    <div className="pt-4 border-t border-slate-200">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Fotos</h4>
      <p className="text-xs text-slate-500 mb-3">
        Límite por plan ({planLabel}): Básico 1 · Gold 3 · Diamond ilimitadas.
        <span className="ml-2">Esta habitación tiene {photos.length}/{photoLimit}.</span>
      </p>
      <div className="space-y-3">
        <SortablePhotoGrid
          photos={photos}
          alt={`Fotos de ${roomName}`}
          onReorder={onReorder}
          onDelete={onDelete}
        />
        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-200 transition ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onUpload(roomId, event)}
              disabled={uploading}
            />
            {uploading ? 'Subiendo...' : 'Subir archivo'}
          </label>
        </div>
      </div>
    </div>
  );
}
