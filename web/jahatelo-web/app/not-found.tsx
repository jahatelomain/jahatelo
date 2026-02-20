import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página no encontrada | Jahatelo',
  description: 'La página que buscás no existe o fue movida.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-8xl font-bold text-purple-600 leading-none">404</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Página no encontrada
        </h1>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          La página que buscás no existe o fue movida. Podés explorar los moteles disponibles o volver al inicio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/mapa"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Ver mapa de moteles
          </Link>
        </div>
      </div>
    </div>
  );
}
