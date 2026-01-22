import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminAnalyticsQuerySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

/**
 * GET /api/admin/analytics
 * Obtiene estadísticas globales de analytics de todos los moteles o filtrado por motel
 * Solo accesible por SUPERADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'analytics');
    if (access.error) return access.error;

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const queryResult = AdminAnalyticsQuerySchema.safeParse({
      period: searchParams.get('period') || undefined,
      motelId: searchParams.get('motelId') || undefined,
      source: searchParams.get('source') || undefined,
      deviceType: searchParams.get('deviceType') || undefined,
      eventType: searchParams.get('eventType') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.errors }, { status: 400 });
    }
    const { period, motelId, source, deviceType, eventType } = queryResult.data;
    const days = period || 30;

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Construir filtro de eventos
    const eventFilter: any = {
      timestamp: {
        gte: startDate,
      },
    };

    // Si se especifica motelId, filtrar por ese motel
    if (motelId) {
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

      eventFilter.motelId = motelId;
    }

    if (source) {
      eventFilter.source = source;
    }

    if (deviceType) {
      eventFilter.deviceType = deviceType;
    }

    if (eventType) {
      eventFilter.eventType = eventType;
    }

    // Obtener eventos del período
    const events = await prisma.motelAnalytics.findMany({
      where: eventFilter,
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Obtener información de motel(es) si se filtró
    let motelInfo = null;
    if (motelId) {
      const motel = await prisma.motel.findUnique({
        where: { id: motelId },
        select: { id: true, name: true },
      });
      motelInfo = motel;
    }

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

    // Top moteles (solo si no se filtró por motelId)
    let topMotels: { motelId: string; motelName: string; count: number }[] = [];
    if (!motelId) {
      const byMotelMap: Record<string, number> = {};
      events.forEach((event) => {
        byMotelMap[event.motelId] = (byMotelMap[event.motelId] || 0) + 1;
      });

      // Obtener nombres de moteles
      const motelIds = Object.keys(byMotelMap);
      const motels = await prisma.motel.findMany({
        where: { id: { in: motelIds } },
        select: { id: true, name: true },
      });

      topMotels = Object.entries(byMotelMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, count]) => ({
          motelId: id,
          motelName: motels.find((m) => m.id === id)?.name || 'Desconocido',
          count,
        }));
    }

    // Calcular tasa de conversión (clicks / views)
    const totalClicks = totalClicksPhone + totalClicksWhatsApp + totalClicksMap + totalClicksWebsite;
    const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    return NextResponse.json({
      motel: motelInfo,
      isGlobal: !motelId,
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
        topMotels,
      },
      recentEvents: events.slice(0, 50).map((e) => ({
        id: e.id,
        motelId: e.motelId,
        eventType: e.eventType,
        timestamp: e.timestamp,
        source: e.source,
        userCity: e.userCity,
        deviceType: e.deviceType,
      })),
    });
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al obtener estadísticas globales' },
      { status: 500 }
    );
  }
}
