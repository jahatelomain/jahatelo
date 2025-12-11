import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const motels = await prisma.motel.findMany({
      select: {
        id: true,
        name: true,
        neighborhood: true,
        city: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(motels);
  } catch (error) {
    console.error('Error in GET /api/motels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch motels' },
      { status: 500 }
    );
  }
}
