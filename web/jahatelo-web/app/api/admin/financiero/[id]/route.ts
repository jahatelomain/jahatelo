import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';
import { FinancialUpdateSchema, IdSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * GET /api/admin/financiero/[id]
 * Obtiene datos financieros de un motel específico (solo SUPERADMIN)
 */
export async function GET(
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

    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
      select: {
        id: true,
        name: true,
        slug: true,
        billingDay: true,
        paymentType: true,
        financialStatus: true,
        plan: true,
        billingCompanyName: true,
        billingTaxId: true,
        adminContactName: true,
        adminContactEmail: true,
        adminContactPhone: true,
        paymentHistory: {
          orderBy: { paidAt: 'desc' },
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
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(motel);
  } catch (error) {
    console.error('Error fetching motel financial data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del motel' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/financiero/[id]
 * Actualiza datos financieros de un motel (solo SUPERADMIN)
 */
export async function PATCH(
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
    const validated = FinancialUpdateSchema.parse(sanitized);
    const {
      billingDay,
      paymentType,
      financialStatus,
      plan,
      billingCompanyName,
      billingTaxId,
      adminContactName,
      adminContactEmail,
      adminContactPhone,
    } = validated;

    // Validar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar motel
    const updatedMotel = await prisma.motel.update({
      where: { id: idResult.data },
      data: {
        ...(billingDay !== undefined && { billingDay }),
        ...(paymentType && { paymentType }),
        ...(financialStatus && { financialStatus }),
        ...(plan && { plan }),
        ...(billingCompanyName !== undefined && { billingCompanyName }),
        ...(billingTaxId !== undefined && { billingTaxId }),
        ...(adminContactName !== undefined && { adminContactName }),
        ...(adminContactEmail !== undefined && { adminContactEmail }),
        ...(adminContactPhone !== undefined && { adminContactPhone }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        billingDay: true,
        paymentType: true,
        financialStatus: true,
        plan: true,
        billingCompanyName: true,
        billingTaxId: true,
        adminContactName: true,
        adminContactEmail: true,
        adminContactPhone: true,
        updatedAt: true,
      },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'MotelFinanzas',
      entityId: updatedMotel.id,
      metadata: { name: updatedMotel.name, paymentType: updatedMotel.paymentType },
    });

    return NextResponse.json(updatedMotel);
  } catch (error) {
    console.error('Error updating motel financial data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar datos del motel' },
      { status: 500 }
    );
  }
}
