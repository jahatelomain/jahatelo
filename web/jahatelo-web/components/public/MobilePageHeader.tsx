import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function MobilePageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="bg-purple-600 px-4 pb-5 pt-[max(16px,env(safe-area-inset-top))] text-white md:hidden"><div className="flex items-center gap-3"><Link href="/" aria-label="Volver al inicio" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><ChevronLeft size={22} /></Link><div><h1 className="text-xl font-bold">{title}</h1>{subtitle && <p className="mt-0.5 text-sm text-purple-200">{subtitle}</p>}</div></div></header>;
}
