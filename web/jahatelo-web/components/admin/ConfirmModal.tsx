'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      // La acción normalmente cierra el modal. Si no lo hace por un error,
      // devolvemos el control para que la persona pueda reintentar o cancelar.
      setConfirming(false);
    }
  }, [confirming, onConfirm]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel, handleConfirm]);

  // El detalle de motel tiene contenedores largos y desplazables. Renderizar
  // el modal dentro de ellos puede dejar el cuadro fuera del viewport mientras
  // el fondo oscuro sigue visible. El portal lo fija al viewport real.
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={confirming}
            className={`px-4 py-2 text-white rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {confirming ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
