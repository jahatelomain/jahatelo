'use client';

type PriceItem = {
  label: string;
  price: number;
  hours?: number;
};

export default function PriceTable({ prices }: { prices: PriceItem[] }) {
  if (!prices || prices.length === 0) return null;

  const pricePerHour = prices.map((item) => {
    const hours = item.hours || 1;
    return { ...item, perHour: item.price / hours };
  });

  const best = pricePerHour.reduce((prev, current) => (current.perHour < prev.perHour ? current : prev), pricePerHour[0]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {pricePerHour.map((item) => (
        <div
          key={item.label}
          className={`border rounded-xl p-3 text-center ${item.label === best.label ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}
        >
          <p className="text-xs text-slate-500">{item.label}</p>
          <p className="text-lg font-bold text-slate-900">Gs {item.price.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Gs {Math.round(item.perHour).toLocaleString()}/hora</p>
          {item.label === best.label && (
            <span className="inline-block mt-2 text-xs font-semibold text-purple-600">Mejor precio</span>
          )}
        </div>
      ))}
    </div>
  );
}
