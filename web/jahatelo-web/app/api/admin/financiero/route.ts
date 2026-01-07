import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';

/**
 * GET /api/admin/financiero
 * Lista todos los moteles con datos financieros (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

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
