'use client';

import { useState } from 'react';

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        console.error('Share cancelled:', error);
      }
      return;
    }

    setOpen((prev) => !prev);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-600"
      >
        Compartir
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20">
          <button
            onClick={handleCopy}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
          >
            Copiar enlace
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
          >
            Compartir en WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
          >
            Compartir en Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded"
          >
            Compartir en X
          </a>
        </div>
      )}
    </div>
  );
}
