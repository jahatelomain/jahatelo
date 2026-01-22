import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { FinancialPaymentCreateSchema, IdSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * POST /api/admin/financiero/[id]/payments
 * Crea un registro de pago manual para un motel (solo SUPERADMIN)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'financiero');
    if (access.error) return access.error;

    const { id } = await params;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = FinancialPaymentCreateSchema.parse(sanitized);
    const parsedPaidAt = validated.paidAt ? new Date(validated.paidAt) : undefined;

    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
      select: { id: true },
    });

    if (!motel) {
      return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
    }

    const payment = await prisma.paymentHistory.create({
      data: {
        motelId: idResult.data,
        amount: Math.round(Number(validated.amount)),
        currency: validated.currency || 'PYG',
        paidAt: parsedPaidAt,
        status: validated.status || 'PAID',
        paymentType: validated.paymentType || null,
        reference: validated.reference || null,
        notes: validated.notes || null,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        paidAt: true,
        status: true,
        paymentType: true,
        reference: true,
        notes: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'CREATE',
      entityType: 'PaymentHistory',
      entityId: payment.id,
      metadata: { motelId: idResult.data, amount: payment.amount, status: payment.status },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment history:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    );
  }
}
