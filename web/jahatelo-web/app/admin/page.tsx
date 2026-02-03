import { prisma } from '@/lib/prisma';
import { MotelStatus, ProspectStatus } from '@prisma/client';
import QuickActions from './components/QuickActions';
import AnalyticsMetrics from './components/AnalyticsMetrics';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  const user = await verifyToken(token);
  if (!user) {
    redirect('/admin/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, motelId: true },
  });
  const role = dbUser?.role || user.role;
  const motelId = dbUser?.motelId || user.motelId;

  if (role === 'MOTEL_ADMIN') {
    if (!motelId) {
      redirect('/admin/login');
    }
    redirect(`/admin/financiero/${motelId}`);
  }

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
  let pendingMotelsDetails: Array<{
    id: string;
    name: string;
    city: string;
    neighborhood: string;
    createdAt: Date;
  }> = [];

  // Obtener métricas de la base de datos
  if (e2eMode) {
    pendingMotels = await prisma.motel.count({ where: { status: MotelStatus.PENDING } });
    activeMotels = await prisma.motel.count({ where: { isActive: true } });
    activePromotions = await prisma.promo.count({
      where: {
        isActive: true,
        motel: {
          status: MotelStatus.APPROVED,
          isActive: true,
        },
      },
    });
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
    pendingMotelsDetails = await prisma.motel.findMany({
      where: { status: MotelStatus.PENDING },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        neighborhood: true,
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
      pendingMotelsDetails,
    ] = await Promise.all([
      Promise.resolve(0), // Placeholder para vistas - implementar más adelante
      prisma.motel.count({ where: { status: MotelStatus.PENDING } }),
      prisma.motel.count({ where: { isActive: true } }),
      prisma.promo.count({
        where: {
          isActive: true,
          motel: {
            status: MotelStatus.APPROVED,
            isActive: true,
          },
        },
      }),
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
      prisma.motel.findMany({
        where: { status: MotelStatus.PENDING },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          neighborhood: true,
          createdAt: true,
        },
      }),
    ]);
  }

  const recentMotels = recentMotelsRaw ?? [];

  // ============================================
  // CÁLCULO DE ANALYTICS
  // ============================================

  // 1. Tasa de Conversión (Prospects WON / Total)
  const totalProspects = await prisma.motelProspect.count();
  const wonProspects = await prisma.motelProspect.count({
    where: { status: ProspectStatus.WON },
  });
  const conversionRate = totalProspects > 0 ? Math.round((wonProspects / totalProspects) * 100) : 0;

  // Tasa del mes anterior para comparar
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 2);
  lastMonthStart.setDate(1);
  const lastMonthEnd = new Date();
  lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);
  lastMonthEnd.setDate(0);

  const lastMonthProspectsTotal = await prisma.motelProspect.count({
    where: {
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  });
  const lastMonthProspectsWon = await prisma.motelProspect.count({
    where: {
      status: ProspectStatus.WON,
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  });
  const lastMonthConversionRate =
    lastMonthProspectsTotal > 0 ? Math.round((lastMonthProspectsWon / lastMonthProspectsTotal) * 100) : 0;
  const conversionTrend = conversionRate - lastMonthConversionRate;

  // 2. Tiempo Promedio de Aprobación
  const approvedMotels = await prisma.motel.findMany({
    where: { status: MotelStatus.APPROVED },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  let avgApprovalTime = 0;
  if (approvedMotels.length > 0) {
    const totalDays = approvedMotels.reduce((sum, motel) => {
      const days = Math.floor(
        (new Date(motel.updatedAt).getTime() - new Date(motel.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    avgApprovalTime = Math.round(totalDays / approvedMotels.length);
  }

  // Tiempo promedio del mes anterior
  const lastMonthApprovedMotels = await prisma.motel.findMany({
    where: {
      status: MotelStatus.APPROVED,
      updatedAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  let lastMonthAvgApprovalTime = 0;
  if (lastMonthApprovedMotels.length > 0) {
    const totalDays = lastMonthApprovedMotels.reduce((sum, motel) => {
      const days = Math.floor(
        (new Date(motel.updatedAt).getTime() - new Date(motel.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    lastMonthAvgApprovalTime = Math.round(totalDays / lastMonthApprovedMotels.length);
  }
  const approvalTimeTrend = avgApprovalTime - lastMonthAvgApprovalTime;

  // 3. Crecimiento Mensual (moteles creados este mes vs mes anterior)
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisMonthMotels = await prisma.motel.count({
    where: {
      createdAt: {
        gte: thisMonthStart,
      },
    },
  });

  const lastMonthMotels = await prisma.motel.count({
    where: {
      createdAt: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
  });

  const monthlyGrowth = thisMonthMotels;
  const growthTrend = lastMonthMotels > 0 ? Math.round(((thisMonthMotels - lastMonthMotels) / lastMonthMotels) * 100) : 0;

  // 4. Revenue Potencial (precios ficticios por plan)
  const planPrices = {
    FREE: 0,
    BASIC: 0,
    GOLD: 500000, // 500k PYG/mes
    DIAMOND: 1000000, // 1M PYG/mes
  };

  const planCounts = await prisma.motel.groupBy({
    by: ['plan'],
    where: { isActive: true },
    _count: true,
  });

  let revenueEstimate = 0;
  planCounts.forEach((item) => {
    const price = planPrices[item.plan as keyof typeof planPrices] || 0;
    revenueEstimate += price * item._count;
  });

  // Revenue del mes anterior
  const lastMonthPlanCounts = await prisma.motel.groupBy({
    by: ['plan'],
    where: {
      isActive: true,
      createdAt: {
        lte: lastMonthEnd,
      },
    },
    _count: true,
  });

  let lastMonthRevenue = 0;
  lastMonthPlanCounts.forEach((item) => {
    const price = planPrices[item.plan as keyof typeof planPrices] || 0;
    lastMonthRevenue += price * item._count;
  });

  const revenueTrend =
    lastMonthRevenue > 0 ? Math.round(((revenueEstimate - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

  // 5. Moteles por Ciudad (top 5)
  const motelsByCity = await prisma.motel.groupBy({
    by: ['city'],
    where: { isActive: true },
    _count: true,
    orderBy: {
      _count: {
        city: 'desc',
      },
    },
    take: 5,
  });

  const motelsByCityFormatted = motelsByCity.map((item) => ({
    city: item.city,
    count: item._count,
  }));

  // 6. Distribución de Planes
  const planDistribution = await prisma.motel.groupBy({
    by: ['plan'],
    where: { isActive: true },
    _count: true,
  });

  const totalActivePlans = planDistribution.reduce((sum, item) => sum + item._count, 0);
  const planDistributionFormatted = planDistribution.map((item) => ({
    plan: item.plan,
    count: item._count,
    percentage: totalActivePlans > 0 ? Math.round((item._count / totalActivePlans) * 100) : 0,
  }));

  const analyticsData = {
    conversionRate,
    conversionTrend,
    avgApprovalTime,
    approvalTimeTrend,
    monthlyGrowth,
    growthTrend,
    revenueEstimate,
    revenueTrend,
    motelsByCity: motelsByCityFormatted,
    planDistribution: planDistributionFormatted,
  };

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

      {/* Analytics y Métricas Útiles */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Analytics y Métricas</h2>
          <p className="text-sm text-slate-600">Datos en tiempo real del rendimiento de la plataforma</p>
        </div>
        <AnalyticsMetrics data={analyticsData} />
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

        {/* Widget de Acciones Rápidas */}
        <QuickActions initialMotels={pendingMotelsDetails} />
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
