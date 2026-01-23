'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Motel {
  id: string;
  nombre: string;
  slug: string;
  ciudad?: string;
  barrio?: string;
  mainPhoto?: string;
  precioDesde?: number;
  plan: string;
  promos: any[];
}

interface Favorite {
  id: string;
  motelId: string;
  createdAt: string;
  motel?: Motel;
}

export default function MisFavoritosPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/mis-favoritos');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      } else {
        setError('Error al cargar favoritos');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (motelId: string) => {
    if (!confirm('¿Deseas eliminar este motel de tus favoritos?')) {
      return;
    }

    try {
      setRemovingId(motelId);
      const response = await fetch(`/api/favorites?motelId=${motelId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Actualizar lista local
        setFavorites(prev => prev.filter(fav => fav.motelId !== motelId));
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar favorito');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Error al conectar con el servidor');
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Consultar';
    return `${price.toLocaleString('es-PY')} Gs.`;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Mis Favoritos</h1>
              <p className="text-white/80 mt-1">
                {loading ? 'Cargando...' : `${favorites.length} ${favorites.length === 1 ? 'motel' : 'moteles'}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && favorites.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Sin favoritos aún
            </h3>
            <p className="text-slate-600 mb-6">
              Todavía no agregaste moteles a favoritos.<br />
              Toca el corazón en cualquier motel para guardarlo aquí.
            </p>
            <Link
              href="/search"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Buscar Moteles
            </Link>
          </div>
        )}

        {/* Favorites Grid */}
        {!loading && favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(favorite => {
              const motel = favorite.motel;
              if (!motel) return null;

              return (
                <div
                  key={favorite.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group"
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFavorite(motel.id)}
                    disabled={removingId === motel.id}
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-red-500 hover:text-red-600 rounded-full p-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar de favoritos"
                  >
                    {removingId === motel.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <Link href={`/motels/${motel.slug}`}>
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200">
                      {motel.mainPhoto ? (
                        <Image
                          src={motel.mainPhoto}
                          alt={motel.nombre}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-2">
                        {motel.promos && motel.promos.length > 0 && (
                          <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded">
                            PROMO
                          </span>
                        )}
                        {motel.plan === 'DIAMOND' && (
                          <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            DIAMOND
                          </span>
                        )}
                        {motel.plan === 'GOLD' && (
                          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            GOLD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 truncate">
                        {motel.nombre}
                      </h3>

                      <div className="flex items-center text-sm text-slate-600 mb-3">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {motel.ciudad || motel.barrio || 'Sin ubicación'}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-purple-600">
                          {formatPrice(motel.precioDesde)}
                        </p>
                        <span className="text-sm text-purple-600 font-medium group-hover:underline">
                          Ver detalles →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
