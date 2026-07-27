import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ClaimPromoCodeSchema } from '@/lib/validations/schemas';

// GET /api/public/promo-codes?deviceId=... — historial del dispositivo actual.
export async function GET(request: NextRequest) {
  const deviceId = new URL(request.url).searchParams.get('deviceId');
  const parsed = ClaimPromoCodeSchema.safeParse({ deviceId });
  if (!parsed.success) return NextResponse.json({ error: 'Dispositivo inválido' }, { status: 400 });

  const codes = await prisma.promoCode.findMany({
    where: { deviceId: parsed.data.deviceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, promoId: true, code: true, status: true, createdAt: true, redeemedAt: true,
      promo: { select: { title: true, description: true, imageUrl: true, validUntil: true, isActive: true } },
    },
  });

  return NextResponse.json({ codes });
}
