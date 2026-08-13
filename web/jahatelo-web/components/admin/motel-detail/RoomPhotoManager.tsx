import SortablePhotoGrid, { type SortablePhoto } from './SortablePhotoGrid';
import { MAX_STORED_ROOM_PHOTOS } from '@/lib/domain/motels/roomPhotoLimits';

type Props = {
  roomId: string;
  roomName: string;
  photos: SortablePhoto[];
  planLabel: string;
  publishedPhotoLimit: number;
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
  publishedPhotoLimit,
  uploading,
  onUpload,
  onReorder,
  onDelete,
}: Props) {
  const hasReachedStorageLimit = photos.length >= MAX_STORED_ROOM_PHOTOS;

  return (
    <div className="pt-4 border-t border-slate-200">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Fotos</h4>
      <p className="text-xs text-slate-500 mb-3">
        Podés cargar hasta {MAX_STORED_ROOM_PHOTOS} fotos. El plan {planLabel} publica {publishedPhotoLimit}; las restantes quedan guardadas y se habilitan al mejorar el plan.
        <span className="ml-2">Arrastrá una foto a las primeras {publishedPhotoLimit} posiciones para publicarla.</span>
      </p>
      <div className="space-y-3">
        <SortablePhotoGrid
          photos={photos}
          alt={`Fotos de ${roomName}`}
          publishedPhotoLimit={publishedPhotoLimit}
          onReorder={onReorder}
          onDelete={onDelete}
        />
        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-200 transition ${(uploading || hasReachedStorageLimit) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => onUpload(roomId, event)}
              disabled={uploading || hasReachedStorageLimit}
            />
            {uploading ? 'Subiendo fotos...' : hasReachedStorageLimit ? `Límite de ${MAX_STORED_ROOM_PHOTOS} fotos alcanzado` : 'Seleccionar fotos'}
          </label>
        </div>
      </div>
    </div>
  );
}
