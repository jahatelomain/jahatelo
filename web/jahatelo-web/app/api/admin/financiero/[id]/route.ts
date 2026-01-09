import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { logAuditEvent } from '@/lib/audit';

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

    const motel = await prisma.motel.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        billingDay: true,
        paymentType: true,
        financialStatus: true,
        isFinanciallyEnabled: true,
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
    const body = await request.json();
    const {
      billingDay,
      paymentType,
      financialStatus,
      isFinanciallyEnabled,
      billingCompanyName,
      billingTaxId,
      adminContactName,
      adminContactEmail,
      adminContactPhone,
    } = body;

    // Validar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Validar billingDay si se provee
    if (billingDay !== undefined && billingDay !== null) {
      if (billingDay < 1 || billingDay > 31) {
        return NextResponse.json(
          { error: 'El día de cobro debe estar entre 1 y 31' },
          { status: 400 }
        );
      }
    }

    // Validar paymentType si se provee
    if (paymentType && !['DIRECT_DEBIT', 'TRANSFER', 'EXCHANGE'].includes(paymentType)) {
      return NextResponse.json(
        { error: 'Tipo de pago inválido' },
        { status: 400 }
      );
    }

    // Validar financialStatus si se provee
    if (financialStatus && !['ACTIVE', 'INACTIVE', 'DISABLED'].includes(financialStatus)) {
      return NextResponse.json(
        { error: 'Estado financiero inválido' },
        { status: 400 }
      );
    }

    // Actualizar motel
    const updatedMotel = await prisma.motel.update({
      where: { id },
      data: {
        ...(billingDay !== undefined && { billingDay }),
        ...(paymentType && { paymentType }),
        ...(financialStatus && { financialStatus }),
        ...(isFinanciallyEnabled !== undefined && { isFinanciallyEnabled }),
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
        isFinanciallyEnabled: true,
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
    return NextResponse.json(
      { error: 'Error al actualizar datos del motel' },
      { status: 500 }
    );
  }
}
