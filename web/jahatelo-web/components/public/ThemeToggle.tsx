'use client';

export default function ThemeToggle() {
  return (
    <button
      type="button"
      disabled
      className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 cursor-not-allowed"
      title="Modo nocturno deshabilitado"
      aria-label="Modo nocturno deshabilitado"
    >
      🌙
    </button>
  );
}
