import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { sanitizeObject } from '@/lib/sanitize';

const ReportReviewSchema = z.object({
  reviewId: z.string().cuid(),
  reason: z.enum([
    'REVIEW_SPAM',
    'REVIEW_OFFENSIVE',
    'REVIEW_PRIVACY',
    'REVIEW_FALSE',
    'REVIEW_OTHER',
  ]),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    const currentUser = token ? await verifyToken(token) : null;
    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión para denunciar una reseña.' }, { status: 401 });
    }

    const validated = ReportReviewSchema.parse(sanitizeObject(await request.json()));
    const review = await prisma.review.findUnique({
      where: { id: validated.reviewId },
      select: { id: true, userId: true, motelId: true, motel: { select: { status: true, isActive: true } } },
    });
    if (!review?.motelId || review.motel?.status !== 'APPROVED' || !review.motel.isActive) {
      return NextResponse.json({ error: 'Reseña no encontrada.' }, { status: 404 });
    }
    if (review.userId === currentUser.id) {
      return NextResponse.json({ error: 'Puedes eliminar tu propia reseña sin denunciarla.' }, { status: 400 });
    }

    const existing = await prisma.motelReport.findFirst({
      where: {
        reviewId: review.id,
        userId: currentUser.id,
        status: { in: ['PENDING', 'IN_REVIEW'] },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, report: existing, alreadyReported: true });
    }

    const report = await prisma.motelReport.create({
      data: {
        motelId: review.motelId,
        reviewId: review.id,
        userId: currentUser.id,
        reason: validated.reason,
        comment: validated.comment || null,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'La denuncia contiene datos inválidos.' }, { status: 400 });
    }
    console.error('Error creating review report:', error);
    return NextResponse.json({ error: 'No pudimos guardar la denuncia.' }, { status: 500 });
  }
}
