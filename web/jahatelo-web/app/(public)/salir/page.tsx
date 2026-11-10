import Link from 'next/link';

export default function SalirPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-slate-950 px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-900/40 border border-purple-700/40 mx-auto">
          <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Acceso restringido</h1>
        <p className="text-purple-200 text-lg leading-relaxed">
          Este sitio está destinado exclusivamente a personas mayores de 18 años. Si no cumplís con ese requisito, no podés continuar.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-block rounded-xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}