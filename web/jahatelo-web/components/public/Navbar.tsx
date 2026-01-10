'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Jahatelo" className="w-20 h-20 object-contain" />
            <span className="text-2xl font-bold font-[var(--font-lato)] bg-gradient-to-r from-purple-600 to-fuchsia-500 bg-clip-text text-transparent">
              Jahatelo
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`font-medium transition-colors ${
                isActive('/')
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/motels"
              className={`font-medium transition-colors ${
                isActive('/motels') || pathname.startsWith('/motels')
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Moteles
            </Link>
            <Link
              href="/search"
              className={`font-medium transition-colors ${
                isActive('/search')
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Buscar
            </Link>
            <Link
              href="/nearby"
              className={`font-medium transition-colors ${
                isActive('/nearby')
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Cerca mío
            </Link>
            <Link
              href="/mapa"
              className={`font-medium transition-colors ${
                isActive('/mapa')
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Mapa
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-purple-600 p-2 transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium transition-colors ${
                  isActive('/')
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Inicio
              </Link>
              <Link
                href="/motels"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium transition-colors ${
                  isActive('/motels') || pathname.startsWith('/motels')
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Moteles
              </Link>
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium transition-colors ${
                  isActive('/search')
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Buscar
              </Link>
              <Link
                href="/nearby"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium transition-colors ${
                  isActive('/nearby')
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Cerca mío
              </Link>
              <Link
                href="/mapa"
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium transition-colors ${
                  isActive('/mapa')
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Mapa
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
