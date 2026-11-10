'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AgeGate() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const checkAgeGate = async () => {
      try {
        const response = await fetch('/api/settings/public');
        const data = await response.json();

        if (!data.settings?.age_gate_enabled) {
          setLoading(false);
          return;
        }

        const ageConfirmed = localStorage.getItem('age_confirmed');
        if (!ageConfirmed) {
          triggerRef.current = document.activeElement as HTMLElement | null;
          setShow(true);
        }
      } catch (error) {
        console.error('Error fetching age gate settings:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAgeGate();
  }, []);

  useEffect(() => {
    if (!show) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    // Focus first interactive element when opened
    requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
    });
  }, [show]);

  const restoreFocus = useCallback(() => {
    if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
      triggerRef.current.focus();
    }
    triggerRef.current = null;
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('age_confirmed', 'true');
    setShow(false);
    dialogRef.current?.close();
    restoreFocus();
  };

  const handleDeny = () => {
    setShow(false);
    dialogRef.current?.close();
    restoreFocus();
    router.push('/salir');
  };

  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    // Prevent closing via Escape or backdrop click without explicit choice
    event.preventDefault();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first || !dialog.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  if (loading) {
    return null;
  }

  if (!show) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="agegate-title"
      aria-describedby="agegate-description"
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[9999] m-0 h-full w-full max-w-none max-h-none bg-transparent p-0 backdrop:bg-black/95 backdrop:backdrop-blur-sm open:flex open:items-center open:justify-center"
    >
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-0 mb-6">
            <Image src="/logo-icon.png" alt="Jahatelo" width={64} height={64} className="w-16 h-16 object-contain" />
            <Image
              src="/logo-text-gradient.png"
              alt="Jahatelo"
              width={160}
              height={32}
              className="h-8 w-auto object-contain -ml-0.5"
            />
          </div>

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>

          {/* Content */}
          <h2 id="agegate-title" className="text-2xl font-bold text-gray-900 mb-4">
            Verificación de Edad
          </h2>
          <p id="agegate-description" className="text-gray-600 mb-2">
            Este sitio contiene contenido destinado a personas mayores de 18 años.
          </p>
          <p className="text-gray-600 mb-8">¿Sos mayor de 18 años?</p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              Sí, soy mayor de 18 años
            </button>
            <button
              onClick={handleDeny}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-xl border-2 border-gray-300 transition-colors"
            >
              No, soy menor de 18 años
            </button>
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-gray-500">
            Al confirmar tu edad, aceptás que sos responsable de acceder a este contenido según las leyes de tu país.
          </p>
        </div>
      </div>
    </dialog>
  );
}