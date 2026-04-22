import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ClaimPromoCodeSchema } from '@/lib/validations/schemas';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function getPeriodStart(period: string | null): Date | null {
  const now = new Date();
  if (period === 'WEEKLY') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'MONTHLY') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  return null;
}

// POST /api/public/promos/[id]/claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoId } = await params;

    const body = await request.json();
    const validated = ClaimPromoCodeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: validated.error.issues }, { status: 400 });
    }
    const { deviceId } = validated.data;

    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: 'Esta promoción ya no está vigente' }, { status: 404 });
    }

    const now = new Date();
    if (promo.validUntil && new Date(promo.validUntil) < now) {
      return NextResponse.json({ error: 'Esta promoción ya no está vigente' }, { status: 404 });
    }

    if (!promo.hasPromoCode) {
      return NextResponse.json({ error: 'Esta promoción no tiene códigos disponibles' }, { status: 400 });
    }

    // Idempotent: return existing PENDING code for this device
    const existing = await prisma.promoCode.findFirst({
      where: { promoId, deviceId, status: 'PENDING' },
    });
    if (existing) {
      return NextResponse.json({
        code: existing.code,
        promoTitle: promo.title,
        promoDescription: promo.description,
        promoImageUrl: promo.imageUrl,
      });
    }

    // Check codeRepeatRule against USED codes for this deviceId
    if (promo.codeRepeatRule && promo.codeRepeatRule !== 'NEVER') {
      const repeatPeriodStart = getPeriodStart(
        promo.codeRepeatRule === 'DAILY' ? null :
        promo.codeRepeatRule === 'WEEKLY' ? 'WEEKLY' :
        'MONTHLY'
      );

      let usedInPeriod: number;
      if (promo.codeRepeatRule === 'DAILY') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        usedInPeriod = await prisma.promoCode.count({
          where: { promoId, deviceId, status: 'USED', redeemedAt: { gte: startOfDay } },
        });
      } else if (repeatPeriodStart) {
        usedInPeriod = await prisma.promoCode.count({
          where: { promoId, deviceId, status: 'USED', redeemedAt: { gte: repeatPeriodStart } },
        });
      } else {
        usedInPeriod = 0;
      }

      if (usedInPeriod > 0) {
        return NextResponse.json({ error: 'Ya utilizaste tu código en este período' }, { status: 400 });
      }
    } else if (promo.codeRepeatRule === 'NEVER') {
      // Never allow re-claim after USED
      const hasUsed = await prisma.promoCode.count({
        where: { promoId, deviceId, status: 'USED' },
      });
      if (hasUsed > 0) {
        return NextResponse.json({ error: 'Ya utilizaste tu código para esta promoción' }, { status: 400 });
      }
    }

    // Check global code limit
    if (promo.codeLimit !== null && promo.codeLimit !== undefined) {
      const limitPeriodStart = getPeriodStart(promo.codeLimitPeriod ?? null);
      const usedCount = await prisma.promoCode.count({
        where: {
          promoId,
          ...(limitPeriodStart ? { createdAt: { gte: limitPeriodStart } } : {}),
        },
      });
      if (usedCount >= promo.codeLimit) {
        return NextResponse.json({ error: 'Esta promo ya no tiene códigos disponibles' }, { status: 400 });
      }
    }

    // Generate unique code with retry
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const collision = await prisma.promoCode.findUnique({ where: { code: candidate } });
      if (!collision) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return NextResponse.json({ error: 'Error al generar código, intente nuevamente' }, { status: 500 });
    }

    const promoCode = await prisma.promoCode.create({
      data: { promoId, code, deviceId, status: 'PENDING' },
    });

    return NextResponse.json({
      code: promoCode.code,
      promoTitle: promo.title,
      promoDescription: promo.description,
      promoImageUrl: promo.imageUrl,
    });
  } catch (error) {
    console.error('Error claiming promo code:', error);
    return NextResponse.json({ error: 'Error al obtener código' }, { status: 500 });
  }
}
