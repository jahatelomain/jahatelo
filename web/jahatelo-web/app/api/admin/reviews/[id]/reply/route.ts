import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { IdSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { sendReviewReplyNotification } from '@/lib/push-notifications';

const ReplySchema = z.object({ reply: z.string().trim().min(2).max(500) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
  if (access.error) return access.error;
  const parsedId = IdSchema.safeParse((await params).id);
  const parsedBody = ReplySchema.safeParse(await request.json());
  if (!parsedId.success || !parsedBody.success) {
    return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 });
  }
  const review = await prisma.review.findUnique({
    where: { id: parsedId.data },
    select: { motelId: true },
  });
  if (!review) return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
  if (access.user?.role === 'MOTEL_ADMIN' && access.user.motelId !== review.motelId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }
  const updated = await prisma.review.update({
    where: { id: parsedId.data },
    data: { ownerReply: sanitizeText(parsedBody.data.reply), ownerReplyAt: new Date() },
  });
  void sendReviewReplyNotification(updated.id, access.user!.id);
  return NextResponse.json({ success: true, review: updated });
}
