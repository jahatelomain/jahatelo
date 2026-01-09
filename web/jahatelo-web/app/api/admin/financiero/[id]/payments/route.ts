import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

const PAYMENT_TYPES = ['DIRECT_DEBIT', 'TRANSFER', 'EXCHANGE'] as const;
const PAYMENT_STATUSES = ['PAID', 'PENDING', 'FAILED', 'REFUNDED'] as const;

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
    const body = await request.json();
    const {
      amount,
      currency,
      paidAt,
      status,
      paymentType,
      reference,
      notes,
    } = body;

    if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 });
    }

    if (status && !PAYMENT_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Estado de pago inválido' }, { status: 400 });
    }

    if (paymentType && !PAYMENT_TYPES.includes(paymentType)) {
      return NextResponse.json({ error: 'Tipo de pago inválido' }, { status: 400 });
    }

    let parsedPaidAt: Date | undefined;
    if (paidAt) {
      const parsed = new Date(paidAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Fecha de pago inválida' }, { status: 400 });
      }
      parsedPaidAt = parsed;
    }

    const motel = await prisma.motel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!motel) {
      return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
    }

    const payment = await prisma.paymentHistory.create({
      data: {
        motelId: id,
        amount: Math.round(Number(amount)),
        currency: currency || 'PYG',
        paidAt: parsedPaidAt,
        status: status || 'PAID',
        paymentType: paymentType || null,
        reference: reference || null,
        notes: notes || null,
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
      metadata: { motelId: id, amount: payment.amount, status: payment.status },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment history:', error);
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    );
  }
}
