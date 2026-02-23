'use client';

import { useEffect, useState, useCallback } from 'react';

interface VisitorStats {
  period: { days: number; since: string };
  summary: {
    totalEvents: number;
    uniqueDevices: number;
    returningDevices: number;
    newDevices: number;
    retentionRate: number;
  };
  platforms: { platform: string; sessions: number }[];
  daily: { day: string; sessions: number; uniqueDevices: number }[];
  topPaths: { path: string | null; views: number }[];
}

const RANGES = [
  { label: '7 das', value: '7' },
  { label: '30 das', value: '30' },
  { label: '90 das', value: '90' },
];

const PLATFORM_LABELS: Record<string, string> = {
  web: 'Web',
  ios: 'iOS',
  android: 'Android',
};

const PLATFORM_COLORS: Record<string, string> = {
  web: 'bg-blue-100 text-blue-700',
  ios: 'bg-gray-100 text-gray-700',
  android: 'bg-green-100 text-green-700',
};

const formatPathLabel = (path: string | null) => {
  if (!path) return '(sin ruta)';
  if (path === '/') return '/home';
  return path;
};

export default function VisitorAnalyticsPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/visitors?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const maxSessions = stats?.daily.length
    ? Math.max(...stats.daily.map((d) => d.sessions), 1)
    : 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitantes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Estadsticas annimas de usuarios nicos (web + app)
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">Cargando estadsticas...</div>
      )}

      {!loading && stats && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Eventos totales"
              value={stats.summary.totalEvents.toLocaleString()}
              sub="acciones registradas"
            />
            <StatCard
              label="Dispositivos nicos"
              value={stats.summary.uniqueDevices.toLocaleString()}
              sub="usuarios distintos"
            />
            <StatCard
              label="Nuevos"
              value={stats.summary.newDevices.toLocaleString()}
              sub="primera visita en el perodo"
            />
            <StatCard
              label="Recurrentes"
              value={stats.summary.returningDevices.toLocaleString()}
              sub="volvieron a visitar"
            />
            <StatCard
              label="Tasa de retorno"
              value={`${stats.summary.retentionRate}%`}
              sub="recurrentes / total"
              highlight
            />
          </div>

          {/* Plataformas */}
          {stats.platforms.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Sesiones por plataforma</h2>
              <div className="flex flex-wrap gap-3">
                {stats.platforms.map((p) => (
                  <div
                    key={p.platform}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                      PLATFORM_COLORS[p.platform] ?? 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    <span>{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                    <span className="font-bold">{p.sessions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grfico diario */}
          {stats.daily.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Sesiones diarias (ltimos {range} das)
              </h2>
              <div className="flex items-end gap-1 h-32">
                {stats.daily.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full">
                      <div
                        className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                        style={{ height: `${Math.max(Math.round((d.sessions / maxSessions) * 112), 2)}px` }}
                        title={`${d.day}: ${d.sessions} sesiones, ${d.uniqueDevices} nicos`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{stats.daily[0]?.day}</span>
                <span>{stats.daily[stats.daily.length - 1]?.day}</span>
              </div>
            </div>
          )}

          {/* Top pginas */}
          {stats.topPaths.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Pginas / pantallas ms visitadas
              </h2>
              <div className="space-y-2">
                {stats.topPaths.map((p, i) => {
                  const maxViews = stats.topPaths[0]?.views ?? 1;
                  return (
                    <div key={p.path ?? i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm text-gray-700 truncate font-mono">
                            {formatPathLabel(p.path)}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 ml-2 shrink-0">
                            {p.views.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: `${Math.round((p.views / maxViews) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.summary.totalEvents === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              No hay datos de visitantes para este perodo todava.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'
      }`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-purple-700' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
