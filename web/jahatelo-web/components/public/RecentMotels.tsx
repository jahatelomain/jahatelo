import MotelCard from '@/components/public/MotelCard';

export default function RecentMotels({ motels }: { motels: any[] }) {
  if (!motels || motels.length === 0) return null;

  return (
    <section className="py-14 bg-gradient-to-b from-[#130828] to-[#0a0118]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-pink-400 mb-1">Recién llegados</p>
            <h2 className="text-2xl font-bold text-white">Nuevos en Jahatelo</h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-pink-700/60 to-transparent" />
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
