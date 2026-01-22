import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// GET /api/promos/active
export async function GET() {
  try {
    EmptySchema.parse({});
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ promos: [], error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ promos: [] }, { status: 500 });
  }
}
