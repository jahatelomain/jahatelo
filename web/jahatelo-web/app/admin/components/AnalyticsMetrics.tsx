'use client';

import { useRouter } from 'next/navigation';

type AnalyticsData = {
  conversionRate: number;
  conversionTrend: number;
  avgApprovalTime: number;
  approvalTimeTrend: number;
  monthlyGrowth: number;
  growthTrend: number;
  revenueEstimate: number;
  revenueTrend: number;
  motelsByCity: Array<{ city: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number; percentage: number }>;
};

type AnalyticsMetricsProps = {
  data: AnalyticsData;
};

export default function AnalyticsMetrics({ data }: AnalyticsMetricsProps) {
  const router = useRouter();

  const formatTrend = (value: number) => {
    if (value === 0) return { icon: '→', color: 'text-slate-500', text: 'Sin cambios' };
    if (value > 0) return { icon: '↗', color: 'text-green-600', text: `+${value}%` };
    return { icon: '↘', color: 'text-red-600', text: `${value}%` };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Métricas principales en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tasa de Conversión */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <span className="text-2xl">📊</span>
            </div>
            {data.conversionTrend !== 0 && (
              <div className={`text-xs font-semibold ${formatTrend(data.conversionTrend).color}`}>
                {formatTrend(data.conversionTrend).icon} {formatTrend(data.conversionTrend).text}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Tasa de Conversión</p>
          <p className="text-3xl font-bold text-slate-900">{data.conversionRate}%</p>
          <p className="text-xs text-slate-500 mt-2">Prospects → Moteles</p>
        </div>

        {/* Tiempo Promedio de Aprobación */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <span className="text-2xl">⏱️</span>
            </div>
            {data.approvalTimeTrend !== 0 && (
              <div className={`text-xs font-semibold ${formatTrend(-data.approvalTimeTrend).color}`}>
                {formatTrend(-data.approvalTimeTrend).icon} {Math.abs(data.approvalTimeTrend)} días
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Tiempo Promedio</p>
          <p className="text-3xl font-bold text-slate-900">
            {data.avgApprovalTime === 0 ? '-' : `${data.avgApprovalTime}d`}
          </p>
          <p className="text-xs text-slate-500 mt-2">Aprobación de moteles</p>
        </div>

        {/* Crecimiento Mensual */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-50 text-green-700">
              <span className="text-2xl">📈</span>
            </div>
            {data.growthTrend !== 0 && (
              <div className={`text-xs font-semibold ${formatTrend(data.growthTrend).color}`}>
                {formatTrend(data.growthTrend).icon} {formatTrend(data.growthTrend).text}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Crecimiento Mensual</p>
          <p className="text-3xl font-bold text-slate-900">
            {data.monthlyGrowth > 0 ? `+${data.monthlyGrowth}` : data.monthlyGrowth}
          </p>
          <p className="text-xs text-slate-500 mt-2">Nuevos moteles este mes</p>
        </div>

        {/* Revenue Estimado */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-yellow-50 text-yellow-700">
              <span className="text-2xl">💰</span>
            </div>
            {data.revenueTrend !== 0 && (
              <div className={`text-xs font-semibold ${formatTrend(data.revenueTrend).color}`}>
                {formatTrend(data.revenueTrend).icon} {formatTrend(data.revenueTrend).text}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Revenue Potencial</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.revenueEstimate)}</p>
          <p className="text-xs text-slate-500 mt-2">Mensual estimado</p>
        </div>
      </div>

      {/* Gráficos: Moteles por ciudad y Distribución de planes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moteles por Ciudad */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Moteles por Ciudad</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Top {data.motelsByCity.length}
            </span>
          </div>

          {data.motelsByCity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl text-slate-300 mb-3">🏙️</span>
              <p className="text-slate-500 font-medium">No hay datos disponibles</p>
              <p className="text-sm text-slate-400 mt-1">Los datos aparecerán cuando haya moteles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.motelsByCity.map((item, index) => {
                const maxCount = Math.max(...data.motelsByCity.map((c) => c.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.city}</span>
                      <span className="text-slate-900 font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribución de Planes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Distribución de Planes</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Activos</span>
          </div>

          {data.planDistribution.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl text-slate-300 mb-3">📦</span>
              <p className="text-slate-500 font-medium">No hay planes activos</p>
              <p className="text-sm text-slate-400 mt-1">Los datos aparecerán cuando haya moteles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.planDistribution.map((item, index) => {
                const colors = {
                  FREE: { bg: 'bg-slate-100', bar: 'bg-slate-300', text: 'text-slate-700', icon: '🪙' },
                  BASIC: { bg: 'bg-blue-50', bar: 'bg-blue-500', text: 'text-blue-700', icon: '🥉' },
                  GOLD: { bg: 'bg-yellow-50', bar: 'bg-yellow-500', text: 'text-yellow-700', icon: '🥈' },
                  DIAMOND: { bg: 'bg-purple-50', bar: 'bg-purple-600', text: 'text-purple-700', icon: '🥇' },
                };

                const color = colors[item.plan as keyof typeof colors] || colors.BASIC;

                return (
                  <div key={index} className={`${color.bg} rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{color.icon}</span>
                        <span className={`font-semibold ${color.text}`}>{item.plan}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${color.text}`}>{item.count}</span>
                        <span className="text-sm text-slate-500 ml-2">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${color.bar} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
