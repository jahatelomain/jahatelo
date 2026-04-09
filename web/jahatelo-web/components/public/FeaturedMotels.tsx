import MotelCard from '@/components/public/MotelCard';

export default function FeaturedMotels({ motels, title }: { motels: any[]; title?: string }) {
  if (!motels || motels.length === 0) return null;

  return (
    <section className="py-14 bg-gradient-to-b from-[#0f0520] to-[#130828]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-1">Selección especial</p>
            <h2 className="text-2xl font-bold text-white">{title || 'Moteles destacados'}</h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-purple-700/60 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {motels.map((motel) => (
            <MotelCard key={motel.id} motel={motel} />
          ))}
        </div>
      </div>
    </section>
  );
}
