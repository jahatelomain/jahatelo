import type { Motel } from './types';
import FeaturedPhotoDisplay from './FeaturedPhotoDisplay';

type Props = { motel: Motel; featuredPhotoWeb: string | null; featuredPhotoApp: string | null };

export default function GeneralInfoSummary({ motel, featuredPhotoWeb, featuredPhotoApp }: Props) {
  const rating = typeof motel.ratingAvg === 'number' ? motel.ratingAvg : 0;
  const count = typeof motel.ratingCount === 'number' ? motel.ratingCount : 0;
  return <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
    <div className="flex items-center justify-between mb-5"><h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Datos generales</h3><span className="text-xs text-slate-500">ID: {motel.id}</span></div>
    <dl className="grid md:grid-cols-2 gap-4">
      <Value label="Nombre" value={motel.name} strong />
      <Value label="Slug" value={motel.slug} mono />
      <Value label="Descripción" value={motel.description || '-'} wide />
      <Value label="Teléfono" value={motel.phone || '-'} />
      <Value label="WhatsApp" value={motel.whatsapp || '-'} />
      <Value label="Calificación" value={`${rating.toFixed(1)} ⭐ ${count === 0 ? '(Sin reseñas aún)' : `(${count} ${count === 1 ? 'reseña' : 'reseñas'})`}`} />
      <FeaturedPhotoDisplay motelName={motel.name} webPhoto={featuredPhotoWeb} appPhoto={featuredPhotoApp} />
    </dl>
  </section>;
}

function Value({ label, value, wide = false, strong = false, mono = false }: { label: string; value: string; wide?: boolean; strong?: boolean; mono?: boolean }) {
  return <div className={`${wide ? 'md:col-span-2 ' : ''}rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm`}><dt className="text-xs font-medium text-slate-500 uppercase">{label}</dt><dd className={`mt-1 text-sm text-slate-900 ${strong ? 'font-semibold' : ''} ${mono ? 'font-mono' : ''}`}>{value}</dd></div>;
}
