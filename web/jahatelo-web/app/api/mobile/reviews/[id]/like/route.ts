import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { IdSchema } from '@/lib/validations/schemas';
import { sendReviewLikeNotification } from '@/lib/push-notifications';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getTokenFromRequest(request);
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const parsed = IdSchema.safeParse((await params).id);
  if (!parsed.success) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const review = await prisma.review.findUnique({ where: { id: parsed.data }, select: { id: true, userId: true } });
  if (!review) return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
  if (review.userId === user.id) {
    return NextResponse.json({ error: 'No puedes indicar que te gusta tu propia reseña' }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.reviewLike.findUnique({
      where: { reviewId_userId: { reviewId: review.id, userId: user.id } },
    });
    if (existing) await tx.reviewLike.delete({ where: { id: existing.id } });
    else await tx.reviewLike.create({ data: { reviewId: review.id, userId: user.id } });
    const likes = await tx.reviewLike.count({ where: { reviewId: review.id } });
    await tx.review.update({ where: { id: review.id }, data: { likes } });
    return { liked: !existing, likes };
  });

  if (result.liked) void sendReviewLikeNotification(review.id, user.id);
  return NextResponse.json({ success: true, ...result });
}
