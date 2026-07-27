import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { RedeemPromoCodeSchema } from '@/lib/validations/schemas';

// Resuelve la promoción de un código para el canje rápido de recepción.
export async function POST(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
  if (access.error) return access.error;
  const parsed = RedeemPromoCodeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Código inválido' }, { status: 400 });

  const promoCode = await prisma.promoCode.findUnique({
    where: { code: parsed.data.code },
    select: { promoId: true, promo: { select: { motelId: true } } },
  });
  if (!promoCode) return NextResponse.json({ error: 'Código no encontrado' }, { status: 404 });
  if (access.user?.role === 'MOTEL_ADMIN' && promoCode.promo.motelId !== access.user.motelId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }
  return NextResponse.json({ promoId: promoCode.promoId });
}
