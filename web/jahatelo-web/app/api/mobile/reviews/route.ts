import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ReviewSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const REVIEW_COOLDOWN_DAYS = 30; // 1 review cada 30 días por motel

/**
 * GET /api/mobile/reviews
 *
 * Obtiene reviews con filtros opcionales
 * Query: ?motelId=xxx&userId=xxx&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const motelId = searchParams.get('motelId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};

    if (motelId) where.motelId = motelId;
    if (userId) where.userId = userId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              provider: true,
            },
          },
          motel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r.id,
        motelId: r.motelId,
        motelName: r.motel?.name,
        motelSlug: r.motel?.slug,
        score: r.score,
        comment: r.comment,
        isVerified: r.isVerified,
        isAnonymous: r.isAnonymous,
        likes: r.likes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.isAnonymous ? {
          id: 'anonymous',
          name: 'Usuario Anónimo',
          profilePhoto: null,
        } : {
          id: r.user?.id,
          name: r.user?.name || 'Usuario',
          profilePhoto: r.user?.profilePhoto,
        },
      })),
      meta: {
        total,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Error in GET /api/mobile/reviews:', error);
    return NextResponse.json(
      { error: 'Error al obtener reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/reviews
 *
 * Crea una nueva review
 * Body: { motelId, score, comment?, isAnonymous? }
 * Restricciones:
 * - Usuario debe estar autenticado
 * - Solo 1 review cada 30 días por motel
 * - Score entre 1-5
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para dejar una reseña' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validar con Zod (rating es score en el schema)
    const validated = ReviewSchema.parse({
      ...body,
      rating: body.score, // Mapear score a rating
    });
    const { motelId, rating, comment } = validated;
    const isAnonymous = body.isAnonymous !== undefined ? body.isAnonymous : false;

    // Sanitizar comment si existe
    const sanitizedComment = comment ? sanitizeText(comment) : null;

    // Verificar que el motel existe
    const motel = await prisma.motel.findUnique({
      where: { id: motelId },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya dejó una review reciente (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - REVIEW_COOLDOWN_DAYS);

    const recentReview = await prisma.review.findFirst({
      where: {
        userId: payload.id,
        motelId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (recentReview) {
      const daysSince = Math.floor(
        (Date.now() - recentReview.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = REVIEW_COOLDOWN_DAYS - daysSince;

      return NextResponse.json(
        {
          error: `Ya dejaste una reseña para este motel. Puedes dejar otra en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}.`,
          cooldownEndsAt: new Date(recentReview.createdAt.getTime() + REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000),
        },
        { status: 429 }
      );
    }

    // Crear review
    const review = await prisma.review.create({
      data: {
        userId: payload.id,
        motelId,
        score: rating, // Usamos rating validado
        comment: sanitizedComment,
        isVerified: true, // Usuarios registrados tienen reviews verificadas
        isAnonymous,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Actualizar rating promedio del motel
    const allReviews = await prisma.review.findMany({
      where: { motelId },
      select: { score: true },
    });

    const totalScore = allReviews.reduce((sum, r) => sum + r.score, 0);
    const avgRating = totalScore / allReviews.length;

    await prisma.motel.update({
      where: { id: motelId },
      data: {
        ratingAvg: avgRating,
        ratingCount: allReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        motelId: review.motelId,
        score: review.score,
        comment: review.comment,
        isVerified: review.isVerified,
        isAnonymous: review.isAnonymous,
        createdAt: review.createdAt,
        user: isAnonymous ? {
          id: 'anonymous',
          name: 'Usuario Anónimo',
          profilePhoto: null,
        } : {
          id: review.user?.id,
          name: review.user?.name || 'Usuario',
          profilePhoto: review.user?.profilePhoto,
        },
      },
      message: 'Reseña publicada exitosamente',
    }, { status: 201 });

  } catch (error) {
    // Errores de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/mobile/reviews:', error);
    return NextResponse.json(
      { error: 'Error al crear review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mobile/reviews/:id
 *
 * Elimina una review del usuario
 * Solo el dueño de la review puede eliminarla
 */
export async function DELETE(request: NextRequest) {
  try {
    // Obtener token
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'reviewId es requerido' },
        { status: 400 }
      );
    }

    // Buscar review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el dueño
    if (review.userId !== payload.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta review' },
        { status: 403 }
      );
    }

    // Eliminar review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalcular rating del motel
    const allReviews = await prisma.review.findMany({
      where: { motelId: review.motelId! },
      select: { score: true },
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.score, 0) / allReviews.length
      : 0;

    await prisma.motel.update({
      where: { id: review.motelId! },
      data: {
        ratingAvg: avgRating,
        ratingCount: allReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review eliminada',
    });

  } catch (error) {
    console.error('Error in DELETE /api/mobile/reviews:', error);
    return NextResponse.json(
      { error: 'Error al eliminar review' },
      { status: 500 }
    );
  }
}
