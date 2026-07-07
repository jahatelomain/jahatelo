import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/cleanup-data
 *
 * Política de retención de datos:
 * - AuditLog:       elimina registros > 90 días
 * - MotelAnalytics: elimina registros > 180 días
 * - VisitorEvent:   elimina registros > 90 días
 * - OtpCode:        elimina registros expirados hace > 1 día
 *
 * Protegido por CRON_SECRET. Ejecutar 1x/día via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const cutoff90 = new Date(now);
  cutoff90.setDate(cutoff90.getDate() - 90);

  const cutoff180 = new Date(now);
  cutoff180.setDate(cutoff180.getDate() - 180);

  const otpCutoff = new Date(now);
  otpCutoff.setDate(otpCutoff.getDate() - 1);

  try {
    const [auditLog, analytics, visitor, otp] = await Promise.all([
      prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff90 } },
      }),
      prisma.motelAnalytics.deleteMany({
        where: { timestamp: { lt: cutoff180 } },
      }),
      prisma.visitorEvent.deleteMany({
        where: { createdAt: { lt: cutoff90 } },
      }),
      prisma.whatsappOtp.deleteMany({
        where: { expiresAt: { lt: otpCutoff } },
      }),
    ]);

    const summary = {
      auditLogsDeleted: auditLog.count,
      analyticsDeleted: analytics.count,
      visitorEventsDeleted: visitor.count,
      whatsappOtpsDeleted: otp.count,
      ranAt: now.toISOString(),
    };

    console.log('[cron/cleanup-data]', summary);

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[cron/cleanup-data] Error:', error);
    return NextResponse.json(
      { error: 'Error durante la limpieza de datos', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
