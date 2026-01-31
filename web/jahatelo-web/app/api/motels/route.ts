import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmptySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export async function GET() {
  try {
    EmptySchema.parse({});
    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        neighborhood: true,
        city: true,
        isActive: true,
        featuredPhoto: true,
        featuredPhotoWeb: true,
        featuredPhotoApp: true,
        plan: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(motels);
  } catch (error) {
    console.error('Error in GET /api/motels:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch motels' },
      { status: 500 }
    );
  }
}
