'use client';

import { useState, useEffect } from 'react';

export default function AgeGate() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already confirmed age
    const ageConfirmed = localStorage.getItem('age_confirmed');
    if (!ageConfirmed) {
      setShow(true);
    }
    setLoading(false);
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('age_confirmed', 'true');
    setShow(false);
  };

  const handleDeny = () => {
    // Redirect to a safe page
    window.location.href = 'https://www.google.com';
  };

  if (loading || !show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-0 mb-6">
            <img src="/logo-icon.png" alt="Jahatelo" className="w-16 h-16 object-contain" />
            <img
              src="/logo-text-gradient.png"
              alt="Jahatelo"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verificación de Edad
          </h2>
          <p className="text-gray-600 mb-2">
            Este sitio contiene contenido destinado a personas mayores de 18 años.
          </p>
          <p className="text-gray-600 mb-8">
            ¿Sos mayor de 18 años?
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
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
    </div>
  );
}
