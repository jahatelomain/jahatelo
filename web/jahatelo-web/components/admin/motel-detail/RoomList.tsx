import { useState, type ChangeEvent, type DragEvent } from 'react';
import type { RoomType } from './types';
import RoomActions from './RoomActions';
import RoomAmenitiesSummary from './RoomAmenitiesSummary';
import RoomPhotoManager from './RoomPhotoManager';
import RoomRatesSummary from './RoomRatesSummary';
import RoomSummary from './RoomSummary';

type RoomPhoto = NonNullable<RoomType['roomPhotos']>[number];

type Props = {
  rooms: RoomType[];
  planLabel: string;
  photoLimit: string;
  uploadingRoomId: string | null;
  onReorder: (rooms: RoomType[]) => void;
  onEdit: (room: RoomType) => void;
  onDelete: (roomId: string) => void;
  onUploadPhoto: (roomId: string, event: ChangeEvent<HTMLInputElement>) => void;
  onReorderPhotos: (roomId: string, photos: RoomPhoto[]) => void;
  onDeletePhoto: (photoId: string) => void;
};

export default function RoomList({
  rooms,
  planLabel,
  photoLimit,
  uploadingRoomId,
  onReorder,
  onEdit,
  onDelete,
  onUploadPhoto,
  onReorderPhotos,
  onDeletePhoto,
}: Props) {
  const [draggedRoomId, setDraggedRoomId] = useState<string | null>(null);
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null);

  const clearDrag = () => {
    setDraggedRoomId(null);
    setDragOverRoomId(null);
  };

  const dropRoom = (event: DragEvent<HTMLDivElement>, targetRoomId: string) => {
    event.preventDefault();
    if (!draggedRoomId || draggedRoomId === targetRoomId) return clearDrag();
    const fromIndex = rooms.findIndex((room) => room.id === draggedRoomId);
    const toIndex = rooms.findIndex((room) => room.id === targetRoomId);
    if (fromIndex < 0 || toIndex < 0) return clearDrag();
    const reordered = [...rooms];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered);
    clearDrag();
  };

  const moveRoom = (fromIndex: number, toIndex: number) => {
    const reordered = [...rooms];
    [reordered[fromIndex], reordered[toIndex]] = [reordered[toIndex], reordered[fromIndex]];
    onReorder(reordered);
  };

  if (!rooms.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl text-slate-300">🛏️</span>
          <p className="text-slate-500 font-medium">No hay habitaciones registradas</p>
          <p className="text-sm text-slate-400">Creá la primera habitación usando el botón de arriba</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rooms.map((room, index) => (
        <div
          key={room.id}
          draggable
          onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; setDraggedRoomId(room.id); }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; if (room.id !== draggedRoomId) setDragOverRoomId(room.id); }}
          onDragLeave={() => setDragOverRoomId(null)}
          onDrop={(event) => dropRoom(event, room.id)}
          onDragEnd={clearDrag}
          className={[
            'bg-white rounded-xl border shadow-sm p-6 transition-all cursor-grab active:cursor-grabbing',
            draggedRoomId === room.id ? 'opacity-50 scale-[0.98]' : '',
            dragOverRoomId === room.id && draggedRoomId !== room.id
              ? 'ring-2 ring-purple-400 border-purple-300'
              : 'border-slate-200 hover:border-purple-200',
          ].join(' ')}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4 pb-4 border-b border-slate-200">
            <RoomSummary room={room} />
            <RoomActions room={room} index={index} total={rooms.length} onMove={moveRoom} onEdit={onEdit} onDelete={onDelete} />
          </div>
          <RoomRatesSummary room={room} />
          <RoomAmenitiesSummary room={room} />
          <RoomPhotoManager
            roomId={room.id}
            roomName={room.name}
            photos={room.roomPhotos ?? []}
            planLabel={planLabel}
            photoLimit={photoLimit}
            uploading={uploadingRoomId === room.id}
            onUpload={onUploadPhoto}
            onReorder={(photos) => onReorderPhotos(room.id, photos)}
            onDelete={onDeletePhoto}
          />
        </div>
      ))}
    </div>
  );
}
