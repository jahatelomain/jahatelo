import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/promos?motelId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const motelId = searchParams.get('motelId');

    const promos = await prisma.promo.findMany({
      where: motelId ? { motelId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        motel: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json(promos);
  } catch (error) {
    console.error('Error fetching promos:', error);
    return NextResponse.json({ error: 'Error al obtener promos' }, { status: 500 });
  }
}

// POST /api/admin/promos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { motelId, title, description, imageUrl, validFrom, validUntil, isActive, isGlobal } = body;

    if (!motelId || !title) {
      return NextResponse.json(
        { error: 'motelId y title son requeridos' },
        { status: 400 }
      );
    }

    const promo = await prisma.promo.create({
      data: {
        motelId,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive ?? true,
        isGlobal: isGlobal ?? false,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    console.error('Error creating promo:', error);
    return NextResponse.json({ error: 'Error al crear promo' }, { status: 500 });
  }
}
