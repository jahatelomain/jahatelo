import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { IdSchema, MotelAnalyticsQuerySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

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
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;
    const user = access.user;

    const { id: motelId } = await params;
    const idResult = IdSchema.safeParse(motelId);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
      select: { id: true, name: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: SUPERADMIN o MOTEL_ADMIN dueño del motel
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isMotelOwner = user?.role === 'MOTEL_ADMIN' && user.motelId === idResult.data;

    if (!isSuperAdmin && !isMotelOwner) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const queryResult = MotelAnalyticsQuerySchema.safeParse({
      period: searchParams.get('period') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const days = queryResult.data.period || 30;

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener eventos del período
    const events = await prisma.motelAnalytics.findMany({
      where: {
        motelId: idResult.data,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
