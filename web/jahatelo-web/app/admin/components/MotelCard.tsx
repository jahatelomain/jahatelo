import Link from 'next/link';
import Image from 'next/image';

type MotelStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type MotelCardProps = {
  motel: {
    id: string;
    name: string;
    neighborhood: string;
    city: string;
    status: MotelStatus;
    isActive: boolean;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    description: string | null;
    featuredPhoto: string | null;
    featuredPhotoWeb?: string | null;
    featuredPhotoApp?: string | null;
    _count?: {
      photos: number;
      rooms: number;
      motelAmenities: number;
    };
  };
};

export default function MotelCard({ motel }: MotelCardProps) {
  const getStatusBadge = (status: MotelStatus) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };

    const labels = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const displayPhoto = motel.featuredPhotoWeb || motel.featuredPhoto || null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
      {/* Imagen */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {displayPhoto ? (
          <Image
            src={displayPhoto}
            alt={motel.name}
            fill
            quality={85}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl text-slate-300">🏨</span>
          </div>
        )}

        {/* Badges flotantes */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {getStatusBadge(motel.status)}
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              motel.isActive
                ? 'bg-purple-100 text-purple-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {motel.isActive ? 'Habilitado' : 'Deshabilitado'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-1">
          {motel.name}
        </h3>

        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{motel.neighborhood}, {motel.city}</span>
          </div>

          {(motel.contactName || motel.contactPhone || motel.contactEmail) && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="line-clamp-1">
                {motel.contactName || motel.contactEmail || motel.contactPhone}
              </span>
            </div>
          )}

          {motel.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-3">
              {motel.description}
            </p>
          )}
        </div>

        {/* Stats */}
        {motel._count && (
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{motel._count.photos} fotos</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>{motel._count.rooms} habita.</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>{motel._count.motelAmenities} amenities</span>
            </div>
          </div>
        )}

        {/* Acciones */}
        <Link
          href={`/admin/motels/${motel.id}`}
          className="block w-full text-center bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm shadow-purple-200"
        >
          Ver Detalles
        </Link>
      </div>
    </div>
  );
}
