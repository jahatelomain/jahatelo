import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const motels = await prisma.motel.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        neighborhood: true,
        status: true,
        isActive: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(motels ?? []);
  } catch (error) {
    console.error('Error fetching motels:', error);
    return NextResponse.json([], { status: 500 });
  }
}
