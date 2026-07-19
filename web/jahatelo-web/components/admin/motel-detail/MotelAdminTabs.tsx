import Link from 'next/link';
import type { MotelAdminTab } from './types';

type Props = {
  activeTab: MotelAdminTab;
  motelId: string;
  roomCount: number;
  promoCount: number;
  menuCategoryCount: number;
  reviewCount: number;
  onChange: (tab: MotelAdminTab) => void;
};

const tabClassName = (active: boolean) =>
  `px-5 py-3 font-medium text-sm transition-colors ${
    active
      ? 'border-b-2 border-purple-600 text-purple-700 -mb-[2px]'
      : 'text-slate-500 hover:text-slate-700'
  }`;

export default function MotelAdminTabs({
  activeTab,
  motelId,
  roomCount,
  promoCount,
  menuCategoryCount,
  reviewCount,
  onChange,
}: Props) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      <button onClick={() => onChange('details')} className={tabClassName(activeTab === 'details')}>
        Detalles
      </button>
      <button onClick={() => onChange('rooms')} className={tabClassName(activeTab === 'rooms')}>
        Habitaciones <span className="ml-1 opacity-70">({roomCount})</span>
      </button>
      <button onClick={() => onChange('promos')} className={tabClassName(activeTab === 'promos')}>
        Promos <span className="ml-1 opacity-70">({promoCount})</span>
      </button>
      <button onClick={() => onChange('menu')} className={tabClassName(activeTab === 'menu')}>
        Menú <span className="ml-1 opacity-70">({menuCategoryCount})</span>
      </button>
      <button onClick={() => onChange('reviews')} className={tabClassName(activeTab === 'reviews')}>
        Reseñas <span className="ml-1 opacity-70">({reviewCount})</span>
      </button>
      <Link
        href={`/admin/motels/${motelId}/analytics`}
        className="px-5 py-3 font-medium text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        Analytics
      </Link>
    </div>
  );
}
