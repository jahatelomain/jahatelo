import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { RedeemPromoCodeSchema } from '@/lib/validations/schemas';

// POST /api/admin/promos/[id]/redeem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const { id: promoId } = await params;

    const body = await request.json();
    const validated = RedeemPromoCodeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: validated.error.issues }, { status: 400 });
    }
    const { code, confirm } = validated.data;

    // Find the code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
      include: {
        promo: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            isActive: true,
            validUntil: true,
            motelId: true,
          },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json({ valid: false, reason: 'INVALID_CODE' });
    }

    // Verify the code belongs to this promo
    if (promoCode.promoId !== promoId) {
      return NextResponse.json({ valid: false, reason: 'WRONG_PROMO' });
    }

    // MOTEL_ADMIN scope check
    if (access.user?.role === 'MOTEL_ADMIN' && promoCode.promo.motelId !== access.user.motelId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    if (promoCode.status === 'USED') {
      return NextResponse.json({ valid: false, reason: 'ALREADY_USED', redeemedAt: promoCode.redeemedAt });
    }

    const now = new Date();
    if (!promoCode.promo.isActive || (promoCode.promo.validUntil && new Date(promoCode.promo.validUntil) < now)) {
      return NextResponse.json({ valid: false, reason: 'PROMO_INACTIVE' });
    }

    if (!confirm) {
      // Just validate — return promo info
      return NextResponse.json({
        valid: true,
        codeId: promoCode.id,
        promoTitle: promoCode.promo.title,
        promoDescription: promoCode.promo.description,
        promoImageUrl: promoCode.promo.imageUrl,
      });
    }

    // Confirm: mark as USED irreversibly
    await prisma.promoCode.update({
      where: { id: promoCode.id },
      data: {
        status: 'USED',
        redeemedAt: now,
        redeemedBy: access.user?.id ?? null,
      },
    });

    return NextResponse.json({ valid: true, confirmed: true });
  } catch (error) {
    console.error('Error redeeming promo code:', error);
    return NextResponse.json({ error: 'Error al validar código' }, { status: 500 });
  }
}
