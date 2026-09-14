import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeCron } from '@/lib/cronAuth';

/**
 * GET /api/cron/cleanup-promo-codes
 *
 * Elimina PromoCode con status PENDING cuya promo:
 *   - tenga validUntil en el pasado, O
 *   - tenga isActive = false
 *
 * Protegido por CRON_SECRET. Ejecutar 1x/día via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const authError = authorizeCron(request);
  if (authError) return authError;

  try {
    const now = new Date();

    const deleted = await prisma.promoCode.deleteMany({
      where: {
        status: 'PENDING',
        promo: {
          OR: [
            { isActive: false },
            { validUntil: { lt: now } },
          ],
        },
      },
    });

    console.log(`[cron/cleanup-promo-codes] Eliminados ${deleted.count} códigos PENDING vencidos`);

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      runAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[cron/cleanup-promo-codes] Error:', error);
    return NextResponse.json({ error: 'Error al limpiar códigos' }, { status: 500 });
  }
}
