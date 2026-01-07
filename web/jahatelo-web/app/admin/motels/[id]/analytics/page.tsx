'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface AnalyticsData {
  motel: {
    id: string;
    name: string;
  };
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalViews: number;
    totalClicksPhone: number;
    totalClicksWhatsApp: number;
    totalClicksMap: number;
    totalClicksWebsite: number;
    totalClicks: number;
    totalFavoritesAdded: number;
    totalFavoritesRemoved: number;
    netFavorites: number;
    conversionRate: number;
  };
  charts: {
    viewsByDay: { date: string; count: number }[];
    bySource: { source: string; count: number }[];
    byDevice: { device: string; count: number }[];
    topCities: { city: string; count: number }[];
  };
}

export default function MotelAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // 7, 30, 90 días

  useEffect(() => {
    if (params?.id) {
      fetchAnalytics(params.id as string, period);
    }
  }, [params?.id, period]);

  const fetchAnalytics = async (id: string, periodDays: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/motels/${id}/analytics?period=${periodDays}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast?.showToast('Error al cargar estadísticas', 'error');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast?.showToast('Error al cargar estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">No se pudieron cargar las estadísticas</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href={`/admin/motels/${params.id}`}
            className="text-purple-600 hover:text-purple-800 text-sm mb-2 inline-block"
          >
            ← Volver al Motel
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{analytics.motel.name}</h1>
          <p className="text-sm text-gray-600 mt-1">Estadísticas y métricas de rendimiento</p>
        </div>

        {/* Selector de período */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30">Últimos 30 días</option>
          <option value="90">Últimos 90 días</option>
        </select>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vistas Totales</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clicks Totales</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalClicks.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasa de Conversión</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.summary.conversionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Favoritos Netos</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.summary.netFavorites >= 0 ? '+' : ''}{analytics.summary.netFavorites}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de Clicks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks por Tipo</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">📞 Teléfono</span>
              <span className="font-semibold">{analytics.summary.totalClicksPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">💬 WhatsApp</span>
              <span className="font-semibold">{analytics.summary.totalClicksWhatsApp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">🗺️ Mapa</span>
              <span className="font-semibold">{analytics.summary.totalClicksMap}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">🌐 Sitio Web</span>
              <span className="font-semibold">{analytics.summary.totalClicksWebsite}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favoritos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">❤️ Agregados</span>
              <span className="font-semibold text-green-600">+{analytics.summary.totalFavoritesAdded}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">💔 Removidos</span>
              <span className="font-semibold text-red-600">-{analytics.summary.totalFavoritesRemoved}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Balance</span>
                <span className={`font-bold ${analytics.summary.netFavorites >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.summary.netFavorites >= 0 ? '+' : ''}{analytics.summary.netFavorites}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Ciudades */}
      {analytics.charts.topCities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Ciudades</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.charts.topCities.slice(0, 5).map((city, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold text-purple-600">{city.count}</p>
                <p className="text-sm text-gray-600">{city.city}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuentes de Tráfico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.charts.bySource.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Fuente</h3>
            <div className="space-y-3">
              {analytics.charts.bySource.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{item.source?.toLowerCase()}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.charts.byDevice.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Dispositivo</h3>
            <div className="space-y-3">
              {analytics.charts.byDevice.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.device === 'MOBILE' ? '📱 Móvil' : '💻 Web'}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Estas métricas te ayudan a entender el rendimiento de tu motel. Una tasa de conversión alta indica que los visitantes están interesados en contactarte. Considera actualizar tus fotos y descripciones para mejorar estos números.
        </p>
      </div>
    </div>
  );
}
