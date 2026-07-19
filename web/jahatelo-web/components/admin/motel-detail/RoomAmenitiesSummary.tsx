import * as LucideIcons from 'lucide-react';
import type { RoomType } from './types';

export default function RoomAmenitiesSummary({ room }: { room: RoomType }) {
  if (!room.amenities?.length) return null;
  const iconMap = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ size?: number }>
  >;

  return (
    <div className="pt-4 border-t border-slate-200">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Amenities</h4>
      <div className="flex flex-wrap gap-2">
        {room.amenities.map(({ amenity }) => {
          const IconComponent = amenity.icon ? iconMap[amenity.icon] : undefined;
          return (
            <span key={amenity.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-full font-medium">
              {IconComponent && <IconComponent size={14} />}
              {amenity.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
