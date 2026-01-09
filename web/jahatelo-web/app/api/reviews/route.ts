import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// GET /api/reviews?motelId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const motelId = searchParams.get('motelId');

    if (!motelId) {
      return NextResponse.json({ error: 'motelId es requerido' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { motelId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    const ratingSummary = await prisma.review.aggregate({
      where: { motelId },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      reviews,
      summary: {
        avg: ratingSummary._avg.score || 0,
        count: ratingSummary._count.score || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    const user = token ? await verifyToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { motelId, score, comment } = body;

    if (!motelId || !score) {
      return NextResponse.json({ error: 'motelId y score son requeridos' }, { status: 400 });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 5) {
      return NextResponse.json({ error: 'score debe ser entre 1 y 5' }, { status: 400 });
    }

    const existing = await prisma.review.findFirst({
      where: { motelId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una reseña para este motel' }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          motelId,
          userId: user.id,
          score: numericScore,
          comment: comment || null,
        },
      });

      const ratingSummary = await tx.review.aggregate({
        where: { motelId },
        _avg: { score: true },
        _count: { score: true },
      });

      await tx.motel.update({
        where: { id: motelId },
        data: {
          ratingAvg: ratingSummary._avg.score || 0,
          ratingCount: ratingSummary._count.score || 0,
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error al crear reseña' }, { status: 500 });
  }
}
