import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ReviewSchema } from '@/lib/validations/schemas';
import { sanitizeObject, sanitizeText } from '@/lib/sanitize';
import { z } from 'zod';

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
    const sanitized = sanitizeObject(body);
    const normalizedComment =
      typeof sanitized.comment === 'string' && sanitized.comment.trim() === ''
        ? undefined
        : sanitized.comment;
    const validated = ReviewSchema.parse({
      ...sanitized,
      comment: normalizedComment,
      rating: sanitized.score,
    });
    const { motelId, rating, comment } = validated;
    const sanitizedComment = comment ? sanitizeText(comment) : null;

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
          score: rating,
          comment: sanitizedComment,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error al crear reseña' }, { status: 500 });
  }
}
