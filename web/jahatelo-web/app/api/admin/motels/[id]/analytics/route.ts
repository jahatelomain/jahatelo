import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';

/**
 * GET /api/admin/motels/[id]/analytics
 * Obtiene estadísticas de analytics de un motel
 * Solo accesible por SUPERADMIN y el MOTEL_ADMIN dueño del motel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id: motelId } = await params;

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
      select: { id: true, name: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: SUPERADMIN o MOTEL_ADMIN dueño del motel
    const isSuperAdmin = hasRole(user, ['SUPERADMIN']);
    const isMotelOwner = user.role === 'MOTEL_ADMIN' && user.motelId === motelId;

    if (!isSuperAdmin && !isMotelOwner) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // días (7, 30, 90)
    const days = parseInt(period);

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener eventos del período
    const events = await prisma.motelAnalytics.findMany({
      where: {
        motelId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Calcular métricas agregadas
    const totalViews = events.filter((e) => e.eventType === 'VIEW').length;
    const totalClicksPhone = events.filter((e) => e.eventType === 'CLICK_PHONE').length;
    const totalClicksWhatsApp = events.filter((e) => e.eventType === 'CLICK_WHATSAPP').length;
    const totalClicksMap = events.filter((e) => e.eventType === 'CLICK_MAP').length;
    const totalClicksWebsite = events.filter((e) => e.eventType === 'CLICK_WEBSITE').length;
    const totalFavoritesAdded = events.filter((e) => e.eventType === 'FAVORITE_ADD').length;
    const totalFavoritesRemoved = events.filter((e) => e.eventType === 'FAVORITE_REMOVE').length;

    // Agrupar vistas por día
    const viewsByDay: Record<string, number> = {};
    events
      .filter((e) => e.eventType === 'VIEW')
      .forEach((event) => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        viewsByDay[date] = (viewsByDay[date] || 0) + 1;
      });

    // Agrupar por fuente
    const bySource: Record<string, number> = {};
    events.forEach((event) => {
      if (event.source) {
        bySource[event.source] = (bySource[event.source] || 0) + 1;
      }
    });

    // Agrupar por tipo de dispositivo
    const byDevice: Record<string, number> = {};
    events.forEach((event) => {
      if (event.deviceType) {
        byDevice[event.deviceType] = (byDevice[event.deviceType] || 0) + 1;
      }
    });

    // Top ciudades
    const byCityMap: Record<string, number> = {};
    events.forEach((event) => {
      if (event.userCity) {
        byCityMap[event.userCity] = (byCityMap[event.userCity] || 0) + 1;
      }
    });
    const topCities = Object.entries(byCityMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // Calcular tasa de conversión (clicks / views)
    const totalClicks = totalClicksPhone + totalClicksWhatsApp + totalClicksMap + totalClicksWebsite;
    const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    return NextResponse.json({
      motel: {
        id: motel.id,
        name: motel.name,
      },
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      summary: {
        totalViews,
        totalClicksPhone,
        totalClicksWhatsApp,
        totalClicksMap,
        totalClicksWebsite,
        totalClicks,
        totalFavoritesAdded,
        totalFavoritesRemoved,
        netFavorites: totalFavoritesAdded - totalFavoritesRemoved,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      charts: {
        viewsByDay: Object.entries(viewsByDay).map(([date, count]) => ({
          date,
          count,
        })),
        bySource: Object.entries(bySource).map(([source, count]) => ({
          source,
          count,
        })),
        byDevice: Object.entries(byDevice).map(([device, count]) => ({
          device,
          count,
        })),
        topCities,
      },
      recentEvents: events.slice(0, 50).map((e) => ({
        id: e.id,
        eventType: e.eventType,
        timestamp: e.timestamp,
        source: e.source,
        userCity: e.userCity,
        deviceType: e.deviceType,
      })),
    });
  } catch (error) {
    console.error('Error fetching motel analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
