import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type Prisma, AnalyticsEventType } from '@prisma/client';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminAnalyticsQuerySchema } from '@/lib/validations/schemas';
import { getMotelAnalyticsAccess } from '@/lib/domain/motels/planPresentation';
import { z } from 'zod';

/**
 * GET /api/admin/analytics
 * Obtiene estadísticas globales de analytics de todos los moteles o filtrado por motel
 * Solo accesible por SUPERADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
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
      return NextResponse.json({ error: 'Parámetros inválidos', details: queryResult.error.issues }, { status: 400 });
    }
    const { period, motelId: requestedMotelId, source, deviceType, eventType } = queryResult.data;
    const motelId = access.user?.role === 'MOTEL_ADMIN' ? access.user.motelId : requestedMotelId;
    if (access.user?.role === 'MOTEL_ADMIN' && !motelId) {
      return NextResponse.json({ error: 'El usuario no tiene un motel asignado' }, { status: 403 });
    }
    let analyticsAccess: 'FULL' | 'SUMMARY' = 'FULL';
    let motelInfo: { id: string; name: string } | null = null;

    if (motelId) {
      const motel = await prisma.motel.findUnique({
        where: { id: motelId },
        select: { id: true, name: true, plan: true },
      });

      if (!motel) {
        return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
      }

      motelInfo = { id: motel.id, name: motel.name };

      // El plan restringe solo al propio motel. Superadmin conserva la visión
      // global y las herramientas necesarias para administrar la plataforma.
      if (access.user?.role === 'MOTEL_ADMIN') {
        const planAccess = getMotelAnalyticsAccess(motel.plan);
        if (planAccess === 'NONE') {
          return NextResponse.json(
            { error: 'Analytics no está incluido en el plan FREE', code: 'ANALYTICS_PLAN_REQUIRED' },
            { status: 403 }
          );
        }
        analyticsAccess = planAccess;
      }
    }

    // BASIC recibe un resumen mensual sin filtros, desglose ni historial.
    // La misma regla se aplica en API para impedir que se evada desde la URL.
    const days = analyticsAccess === 'SUMMARY' ? 30 : period || 30;

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Construir filtro de eventos
    const eventFilter: Prisma.MotelAnalyticsWhereInput = {
      timestamp: {
        gte: startDate,
      },
    };

    // Si se especifica motelId, filtrar por ese motel
    if (motelId) {
      eventFilter.motelId = motelId;
    }

    if (analyticsAccess === 'FULL' && source) {
      eventFilter.source = source;
    }

    if (analyticsAccess === 'FULL' && deviceType) {
      eventFilter.deviceType = deviceType;
    }

    if (analyticsAccess === 'FULL' && eventType) {
      eventFilter.eventType = eventType as AnalyticsEventType;
    }

    // Obtener eventos del período
    const events = await prisma.motelAnalytics.findMany({
      where: eventFilter,
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
      analyticsAccess,
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
        viewsByDay: analyticsAccess === 'FULL' ? Object.entries(viewsByDay).map(([date, count]) => ({
          date,
          count,
        })) : [],
        bySource: analyticsAccess === 'FULL' ? Object.entries(bySource).map(([source, count]) => ({
          source,
          count,
        })) : [],
        byDevice: analyticsAccess === 'FULL' ? Object.entries(byDevice).map(([device, count]) => ({
          device,
          count,
        })) : [],
        topCities: analyticsAccess === 'FULL' ? topCities : [],
        topMotels: analyticsAccess === 'FULL' ? topMotels : [],
      },
      recentEvents: analyticsAccess === 'FULL' ? events.slice(0, 50).map((e) => ({
        id: e.id,
        motelId: e.motelId,
        eventType: e.eventType,
        timestamp: e.timestamp,
        source: e.source,
        userCity: e.userCity,
        deviceType: e.deviceType,
      })) : [],
    });
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al obtener estadísticas globales' },
      { status: 500 }
    );
  }
}
