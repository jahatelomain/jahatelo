'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

interface AnalyticsData {
  motel: {
    id: string;
    name: string;
  } | null;
  isGlobal: boolean;
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
    topMotels?: { motelId: string; motelName: string; count: number }[];
  };
}

interface Motel {
  id: string;
  name: string;
}

interface CurrentUser {
  id: string;
  role: 'SUPERADMIN' | 'MOTEL_ADMIN' | 'USER';
}

export default function GlobalAnalyticsPage() {
  const router = useRouter();
  const toast = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [motels, setMotels] = useState<Motel[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [selectedMotelId, setSelectedMotelId] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchMotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchAnalytics(period, selectedMotelId, sourceFilter, deviceFilter, eventTypeFilter);
  }, [period, selectedMotelId, sourceFilter, deviceFilter, eventTypeFilter, currentUser]);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.user || data.user.role !== 'SUPERADMIN') {
        router.push('/admin');
        return;
      }
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error checking access:', error);
      router.push('/admin');
    }
  };

  const fetchMotels = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/admin/motels');
      if (response.ok) {
        const data = await response.json();
        setMotels(data);
      }
    } catch (error) {
      console.error('Error fetching motels:', error);
    }
  };

  const fetchAnalytics = async (
    periodDays: string,
    motelId: string,
    source: string,
    deviceType: string,
    eventType: string
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period: periodDays });
      if (motelId) {
        params.append('motelId', motelId);
      }
      if (source) {
        params.append('source', source);
      }
      if (deviceType) {
        params.append('deviceType', deviceType);
      }
      if (eventType) {
        params.append('eventType', eventType);
      }

      const response = await fetch(`/api/admin/analytics?${params.toString()}`);
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
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-500">No se pudieron cargar las estadísticas</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
            {analytics.isGlobal ? 'Analytics Global' : `Analytics - ${analytics.motel?.name}`}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {analytics.isGlobal
                ? 'Estadísticas y métricas de todos los moteles'
                : 'Estadísticas filtradas por motel seleccionado'}
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            {/* Selector de Motel */}
            <select
              value={selectedMotelId}
              onChange={(e) => setSelectedMotelId(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Todos los moteles</option>
              {motels.map((motel) => (
                <option key={motel.id} value={motel.id}>
                  {motel.name}
                </option>
              ))}
            </select>

            {/* Selector de período */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
            </select>

            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Todos los eventos</option>
              <option value="VIEW">Vistas</option>
              <option value="CLICK_PHONE">Click Teléfono</option>
              <option value="CLICK_WHATSAPP">Click WhatsApp</option>
              <option value="CLICK_MAP">Click Mapa</option>
              <option value="CLICK_WEBSITE">Click Web</option>
              <option value="FAVORITE_ADD">Favorito agregado</option>
              <option value="FAVORITE_REMOVE">Favorito removido</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Todas las fuentes</option>
              <option value="HOME">Pantalla de Inicio</option>
              <option value="LIST">Pantalla de Listado</option>
              <option value="SEARCH">Pantalla de Búsqueda</option>
              <option value="DETAIL">Pantalla de Detalles</option>
              <option value="MAP">Pantalla de Mapa</option>
            </select>

            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Todos los dispositivos</option>
              <option value="WEB">Web</option>
              <option value="MOBILE">Móvil</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Vistas Totales</p>
              <p className="text-3xl font-semibold text-slate-900">{analytics.summary.totalViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Clicks Totales</p>
              <p className="text-3xl font-semibold text-slate-900">{analytics.summary.totalClicks.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Tasa de Conversión</p>
              <p className="text-3xl font-semibold text-slate-900">{analytics.summary.conversionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Favoritos Netos</p>
              <p className="text-3xl font-semibold text-slate-900">{analytics.summary.netFavorites >= 0 ? '+' : ''}{analytics.summary.netFavorites}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Clicks por Tipo</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">📞 Teléfono</span>
              <span className="font-semibold">{analytics.summary.totalClicksPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">💬 WhatsApp</span>
              <span className="font-semibold">{analytics.summary.totalClicksWhatsApp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">🗺️ Mapa</span>
              <span className="font-semibold">{analytics.summary.totalClicksMap}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">🌐 Sitio Web</span>
              <span className="font-semibold">{analytics.summary.totalClicksWebsite}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Favoritos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">❤️ Agregados</span>
              <span className="font-semibold text-green-600">+{analytics.summary.totalFavoritesAdded}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">💔 Removidos</span>
              <span className="font-semibold text-red-600">-{analytics.summary.totalFavoritesRemoved}</span>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-medium">Balance</span>
                <span className={`font-bold ${analytics.summary.netFavorites >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.summary.netFavorites >= 0 ? '+' : ''}{analytics.summary.netFavorites}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Moteles (solo en vista global) */}
      {analytics.isGlobal && analytics.charts.topMotels && analytics.charts.topMotels.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top 10 Moteles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.charts.topMotels.slice(0, 10).map((motel, index) => (
              <div key={index} className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{motel.count}</p>
                <p className="text-sm text-slate-700 mt-1 truncate" title={motel.motelName}>
                  {motel.motelName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Ciudades */}
      {analytics.charts.topCities.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Ciudades</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.charts.topCities.slice(0, 5).map((city, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold text-purple-600">{city.count}</p>
                <p className="text-sm text-slate-600">{city.city}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuentes de Tráfico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.charts.bySource.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Por Fuente</h3>
            <div className="space-y-3">
              {analytics.charts.bySource.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-slate-600 capitalize">{item.source?.toLowerCase()}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.charts.byDevice.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Por Dispositivo</h3>
            <div className="space-y-3">
              {analytics.charts.byDevice.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-slate-600">{item.device === 'MOBILE' ? '📱 Móvil' : '💻 Web'}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> {analytics.isGlobal
            ? 'Estas métricas te muestran el rendimiento general de toda la plataforma. Selecciona un motel específico para ver sus estadísticas individuales.'
            : 'Estas métricas muestran el rendimiento del motel seleccionado. Selecciona "Todos los moteles" para ver estadísticas globales.'}
        </p>
      </div>
    </div>
  );
}
