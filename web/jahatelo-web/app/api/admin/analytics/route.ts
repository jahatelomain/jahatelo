import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type Prisma, AnalyticsEventType } from '@prisma/client';
import { requireAdminAccess } from '@/lib/adminAccess';
import { AdminAnalyticsQuerySchema } from '@/lib/validations/schemas';
import { getMotelAnalyticsAccess } from '@/lib/domain/motels/planPresentation';

const CONTACT_EVENTS: AnalyticsEventType[] = ['CLICK_PHONE', 'CLICK_WHATSAPP', 'CLICK_MAP', 'CLICK_WEBSITE'];

const percentChange = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const dayKey = (value: Date) => value.toISOString().slice(0, 10);

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { searchParams } = new URL(request.url);
    const parsed = AdminAnalyticsQuerySchema.safeParse({
      period: searchParams.get('period') || undefined,
      motelId: searchParams.get('motelId') || undefined,
      source: searchParams.get('source') || undefined,
      deviceType: searchParams.get('deviceType') || undefined,
      eventType: searchParams.get('eventType') || undefined,
    });
    if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos', details: parsed.error.issues }, { status: 400 });

    const requestedMotelId = parsed.data.motelId;
    const motelId = access.user?.role === 'MOTEL_ADMIN' ? access.user.motelId : requestedMotelId;
    if (access.user?.role === 'MOTEL_ADMIN' && !motelId) return NextResponse.json({ error: 'El usuario no tiene un motel asignado' }, { status: 403 });

    let analyticsAccess: 'FULL' | 'SUMMARY' = 'FULL';
    let motelInfo: { id: string; name: string } | null = null;
    if (motelId) {
      const motel = await prisma.motel.findUnique({ where: { id: motelId }, select: { id: true, name: true, plan: true } });
      if (!motel) return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
      motelInfo = { id: motel.id, name: motel.name };
      if (access.user?.role === 'MOTEL_ADMIN') {
        const planAccess = getMotelAnalyticsAccess(motel.plan);
        if (planAccess === 'NONE') return NextResponse.json({ error: 'Analytics no está incluido en el plan FREE', code: 'ANALYTICS_PLAN_REQUIRED' }, { status: 403 });
        analyticsAccess = planAccess;
      }
    }

    const days = analyticsAccess === 'SUMMARY' ? 30 : parsed.data.period || 30;
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - days + 1);
    startDate.setUTCHours(0, 0, 0, 0);
    const previousStart = new Date(startDate);
    previousStart.setUTCDate(previousStart.getUTCDate() - days);

    const commonFilter: Prisma.MotelAnalyticsWhereInput = {
      environment: 'production',
      ...(motelId ? { motelId } : {}),
      ...(analyticsAccess === 'FULL' && parsed.data.source ? { source: parsed.data.source } : {}),
      ...(analyticsAccess === 'FULL' && parsed.data.deviceType ? { deviceType: parsed.data.deviceType } : {}),
    };
    const select = { id: true, motelId: true, eventType: true, timestamp: true, source: true, userCity: true, deviceType: true, deviceId: true } as const;
    const [events, previousEvents] = await Promise.all([
      prisma.motelAnalytics.findMany({ where: { ...commonFilter, timestamp: { gte: startDate, lte: endDate } }, orderBy: { timestamp: 'desc' }, select }),
      prisma.motelAnalytics.findMany({ where: { ...commonFilter, timestamp: { gte: previousStart, lt: startDate } }, select }),
    ]);

    const summarize = (rows: typeof events) => {
      const count = (type: AnalyticsEventType) => rows.filter((event) => event.eventType === type).length;
      const totalViews = count('VIEW');
      const totalClicksPhone = count('CLICK_PHONE');
      const totalClicksWhatsApp = count('CLICK_WHATSAPP');
      const totalClicksMap = count('CLICK_MAP');
      const totalClicksWebsite = count('CLICK_WEBSITE');
      const totalContacts = totalClicksPhone + totalClicksWhatsApp + totalClicksMap + totalClicksWebsite;
      const viewerIds = new Set(rows.filter((event) => event.eventType === 'VIEW' && event.deviceId).map((event) => event.deviceId as string));
      const contactIds = new Set(rows.filter((event) => CONTACT_EVENTS.includes(event.eventType) && event.deviceId).map((event) => event.deviceId as string));
      const convertedIds = new Set([...contactIds].filter((id) => viewerIds.has(id)));
      return {
        totalViews, totalContacts, totalClicksPhone, totalClicksWhatsApp, totalClicksMap, totalClicksWebsite,
        totalFavoritesAdded: count('FAVORITE_ADD'), totalFavoritesRemoved: count('FAVORITE_REMOVE'),
        netFavorites: count('FAVORITE_ADD') - count('FAVORITE_REMOVE'),
        identifiedViewers: viewerIds.size,
        uniqueContacts: contactIds.size,
        conversionRate: viewerIds.size ? Math.round((convertedIds.size / viewerIds.size) * 1000) / 10 : null,
      };
    };
    const summary = summarize(events);
    const previous = summarize(previousEvents);

    const dailyMap = new Map<string, { views: number; contacts: number; favorites: number }>();
    for (let index = 0; index < days; index += 1) {
      const date = new Date(startDate); date.setUTCDate(date.getUTCDate() + index);
      dailyMap.set(dayKey(date), { views: 0, contacts: 0, favorites: 0 });
    }
    events.forEach((event) => {
      const item = dailyMap.get(dayKey(event.timestamp));
      if (!item) return;
      if (event.eventType === 'VIEW') item.views += 1;
      if (CONTACT_EVENTS.includes(event.eventType)) item.contacts += 1;
      if (event.eventType === 'FAVORITE_ADD') item.favorites += 1;
    });

    const groupViews = (field: 'source' | 'deviceType' | 'userCity') => {
      const grouped = new Map<string, number>();
      events.filter((event) => event.eventType === 'VIEW').forEach((event) => {
        const value = event[field]; if (value) grouped.set(value, (grouped.get(value) || 0) + 1);
      });
      return [...grouped].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    };

    let topMotels: { motelId: string; motelName: string; views: number; contacts: number; conversionRate: number | null }[] = [];
    if (!motelId) {
      const grouped = new Map<string, typeof events>();
      events.forEach((event) => grouped.set(event.motelId, [...(grouped.get(event.motelId) || []), event]));
      const motelIds = [...grouped.keys()];
      const names = new Map((await prisma.motel.findMany({ where: { id: { in: motelIds } }, select: { id: true, name: true } })).map((item) => [item.id, item.name]));
      topMotels = [...grouped].map(([id, rows]) => { const totals = summarize(rows); return { motelId: id, motelName: names.get(id) || 'Desconocido', views: totals.totalViews, contacts: totals.totalContacts, conversionRate: totals.conversionRate }; }).sort((a, b) => b.views - a.views).slice(0, 10);
    }

    return NextResponse.json({
      motel: motelInfo, isGlobal: !motelId, analyticsAccess,
      period: { days, startDate, endDate },
      summary,
      comparison: {
        views: percentChange(summary.totalViews, previous.totalViews),
        contacts: percentChange(summary.totalContacts, previous.totalContacts),
        favorites: percentChange(summary.totalFavoritesAdded, previous.totalFavoritesAdded),
        conversion: summary.conversionRate === null || previous.conversionRate === null ? null : Math.round((summary.conversionRate - previous.conversionRate) * 10) / 10,
      },
      charts: analyticsAccess === 'FULL' ? {
        daily: [...dailyMap].map(([date, values]) => ({ date, ...values })),
        bySource: groupViews('source').map(({ label, count }) => ({ source: label, count })),
        byDevice: groupViews('deviceType').map(({ label, count }) => ({ device: label, count })),
        topCities: groupViews('userCity').slice(0, 10).map(({ label, count }) => ({ city: label, count })),
        topMotels,
      } : { daily: [], bySource: [], byDevice: [], topCities: [], topMotels: [] },
      recentEvents: analyticsAccess === 'FULL' ? events.slice(0, 50).map((event) => ({ ...event, deviceId: event.deviceId ? event.deviceId.slice(0, 8) : null })) : [],
    });
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
