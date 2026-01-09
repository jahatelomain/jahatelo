import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

/**
 * GET /api/admin/financiero
 * Lista todos los moteles con datos financieros (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'financiero');
    if (access.error) return access.error;

    const motels = await prisma.motel.findMany({
      select: {
        id: true,
        name: true,
        billingDay: true,
        paymentType: true,
        financialStatus: true,
        isFinanciallyEnabled: true,
        billingCompanyName: true,
        billingTaxId: true,
        adminContactName: true,
        adminContactEmail: true,
        adminContactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { financialStatus: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(motels);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos financieros' },
      { status: 500 }
    );
  }
}
