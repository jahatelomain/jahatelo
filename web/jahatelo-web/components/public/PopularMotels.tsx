import MotelCard from '@/components/public/MotelCard';

export default function PopularMotels({ motels }: { motels: any[] }) {
  if (!motels || motels.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Los mas visitados</h2>
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
