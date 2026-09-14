'use client';

import { formatGuaranies } from '@/lib/formatCurrency';

type PriceItem = {
  label: string;
  price: number;
};

export default function PriceTable({ prices }: { prices: PriceItem[] }) {
  if (!prices || prices.length === 0) return null;

  return (
    <div className="space-y-2">
      {prices.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-xl bg-purple-50 px-3 py-2.5"
        >
          <p className="text-sm font-semibold text-purple-950">{item.label}</p>
          <p className="whitespace-nowrap text-base font-bold text-purple-700">{formatGuaranies(item.price)}</p>
        </div>
      ))}
    </div>
  );
}
