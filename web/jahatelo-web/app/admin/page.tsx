import { prisma } from '@/lib/prisma';
import { MotelStatus } from '@prisma/client';
import Link from 'next/link';

export default async function AdminDashboard() {
  const e2eMode = process.env.E2E_MODE === '1';
  let totalViews = 0;
  let pendingMotels = 0;
  let activeMotels = 0;
  let activePromotions = 0;
  let recentMotelsRaw: Array<{
    id: string;
    name: string;
    city: string;
    status: MotelStatus;
    createdAt: Date;
  }> = [];

  // Obtener métricas de la base de datos
  if (e2eMode) {
    pendingMotels = await prisma.motel.count({ where: { status: MotelStatus.PENDING } });
    activeMotels = await prisma.motel.count({ where: { isActive: true } });
    recentMotelsRaw = await prisma.motel.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
        createdAt: true,
      },
    });
  } else {
    [
      totalViews,
      pendingMotels,
      activeMotels,
      activePromotions,
      recentMotelsRaw,
    ] = await Promise.all([
      Promise.resolve(0), // Placeholder para vistas - implementar más adelante
      prisma.motel.count({ where: { status: MotelStatus.PENDING } }),
      prisma.motel.count({ where: { isActive: true } }),
      Promise.resolve(0), // Placeholder para promociones - implementar más adelante
      prisma.motel.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);
  }

  const recentMotels = recentMotelsRaw ?? [];

  const kpis = [
    {
      title: 'Cantidad de Vistas',
      value: totalViews,
      icon: '👁️',
      color: 'purple',
      change: null,
    },
    {
      title: 'Pendientes de Aprobación',
      value: pendingMotels,
      icon: '⏳',
      color: 'yellow',
      change: null,
    },
    {
      title: 'Moteles Activos',
      value: activeMotels,
      icon: '✅',
      color: 'green',
      change: null,
    },
    {
      title: 'Promociones Activas',
      value: activePromotions,
      icon: '🎁',
      color: 'blue',
      change: null,
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    const labels = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-50 text-purple-700',
      yellow: 'bg-yellow-50 text-yellow-700',
      green: 'bg-green-50 text-green-700',
      blue: 'bg-blue-50 text-blue-700',
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  return (
    <div className="space-y-6">
      {/* Hero / Bienvenida Mejorado */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-600 to-fuchsia-500 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative px-8 py-10 md:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                ¡Bienvenido/a al panel de Jahatelo! 💜
              </h1>
              <p className="text-purple-100 text-base md:text-lg max-w-2xl">
                Gestioná moteles, habitaciones, amenities y promociones desde un solo lugar.
                Aquí podés ver métricas en tiempo real y administrar todo el contenido.
              </p>

              {/* Mini resumen inline */}
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                {pendingMotels > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-400/90 px-4 py-2 rounded-full">
                    <span className="text-yellow-900 font-semibold">{pendingMotels}</span>
                    <span className="text-yellow-900">Pendientes de aprobación</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-semibold">{activeMotels}</span>
                  <span className="text-purple-100">Moteles Activos</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-semibold">{totalViews}</span>
                  <span className="text-purple-100">Vistas este mes</span>
                </div>
              </div>
            </div>

            {/* Ilustración derecha */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="text-8xl opacity-90">🏨</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Grid Mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-purple-200 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(kpi.color)}`}>
                    <span className="text-2xl">{kpi.icon}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
                {kpi.change && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <span>↗</span> {kpi.change}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen de Actividad - 2 columnas */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Resumen de Actividad</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Actualizado ahora
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Moteles Aprobados</p>
              <p className="text-3xl font-bold text-slate-900">
                {activeMotels}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700 mb-1">Tasa de Activación</p>
              <p className="text-3xl font-bold text-purple-700">
                {activeMotels > 0
                  ? Math.round((activeMotels / (activeMotels + pendingMotels)) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Próximos Pasos / Actividades */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximos Pasos</h3>
          <div className="space-y-4">
            {pendingMotels > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-xl">⏳</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Hay {pendingMotels} motel{pendingMotels !== 1 ? 'es' : ''} pendiente{pendingMotels !== 1 ? 's' : ''} de aprobación
                  </p>
                  <Link
                    href="/admin/motels"
                    className="text-xs text-yellow-700 hover:text-yellow-800 font-medium mt-1 inline-block"
                  >
                    Revisar ahora →
                  </Link>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-xl">📊</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">
                  Revisá las estadísticas de uso
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Próximamente: gráficos y reportes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="text-xl">🎯</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  Todo en orden
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  El sistema funciona correctamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de moteles recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Últimos Moteles Creados</h3>
              <p className="text-xs text-slate-500 mt-1">Los 5 moteles más recientes del sistema</p>
            </div>
            <Link
              href="/admin/motels"
              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm px-4 py-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Ver todos
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentMotels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl text-slate-300">🏨</span>
                      <p className="text-slate-500 font-medium">No hay moteles registrados todavía</p>
                      <p className="text-sm text-slate-400">Los nuevos moteles aparecerán aquí</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentMotels.map((motel) => (
                  <tr key={motel.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {motel.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {motel.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(motel.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(motel.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/motels/${motel.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-200 hover:bg-purple-700 transition-colors"
                      >
                        Editar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
