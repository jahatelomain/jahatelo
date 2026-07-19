'use client';

import { formatGuaranies } from '@/lib/formatCurrency';

type PriceItem = {
  label: string;
  price: number;
};

export default function PriceTable({ prices }: { prices: PriceItem[] }) {
  if (!prices || prices.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {prices.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 p-3 text-center"
        >
          <p className="text-xs text-slate-500">{item.label}</p>
          <p className="text-lg font-bold text-slate-900">{formatGuaranies(item.price)}</p>
        </div>
      ))}
    </div>
  );
}
