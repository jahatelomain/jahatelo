import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/promos/active
export async function GET() {
  try {
    const promos = await prisma.promo.findMany({
      where: {
        isActive: true,
        motel: {
          status: 'APPROVED',
          isActive: true,
        },
      },
      include: {
        motel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ promos });
  } catch (error) {
    console.error('Error fetching promos:', error);
    return NextResponse.json({ promos: [] }, { status: 500 });
  }
}
