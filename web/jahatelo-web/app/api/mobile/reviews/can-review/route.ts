import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { MobileReviewQuerySchema } from '@/lib/validations/schemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const REVIEW_COOLDOWN_DAYS = 30;

/**
 * GET /api/mobile/reviews/can-review
 *
 * Verifica si el usuario puede dejar una reseña para un motel específico
 * Query: ?motelId=xxx
 *
 * Returns:
 * - 200: { canReview: true }
 * - 429: { canReview: false, error: "mensaje", daysRemaining: N }
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const queryResult = MobileReviewQuerySchema.safeParse({
      motelId: searchParams.get('motelId') || undefined,
    });
    if (!queryResult.success) {
      return NextResponse.json({ error: 'motelId es requerido', details: queryResult.error.errors }, { status: 400 });
    }
    const { motelId } = queryResult.data;

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
          canReview: false,
          error: `Ya dejaste una reseña para este motel. Puedes dejar otra en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}.`,
          daysRemaining,
          cooldownEndsAt: new Date(
            recentReview.createdAt.getTime() + REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
          ),
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      canReview: true,
    });

  } catch (error) {
    console.error('Error in GET /api/mobile/reviews/can-review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al verificar disponibilidad de reseña' },
      { status: 500 }
    );
  }
}
