import type { RoomType } from './types';

export default function RoomSummary({ room }: { room: RoomType }) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {room.maxPersons && (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-full font-semibold">
            👥 Hasta {room.maxPersons} {room.maxPersons === 1 ? 'persona' : 'personas'}
          </span>
        )}
      </div>
      {room.description && <p className="text-sm text-slate-600 mt-3">{room.description}</p>}
    </div>
  );
}
