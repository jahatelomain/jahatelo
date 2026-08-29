import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { sanitizeObject } from '@/lib/sanitize';

const ReportSchema = z.object({
  motelId: z.string().cuid(),
  reason: z.enum(['PRICE', 'PHOTO', 'LOCATION_OR_CONTACT', 'CLOSED', 'INFORMATION', 'OTHER']),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const validated = ReportSchema.parse(sanitizeObject(await request.json()));
    const motel = await prisma.motel.findFirst({
      where: { id: validated.motelId, status: 'APPROVED', isActive: true },
      select: { id: true },
    });
    if (!motel) return NextResponse.json({ error: 'Motel no encontrado.' }, { status: 404 });

    const token = await getTokenFromRequest(request);
    const currentUser = token ? await verifyToken(token) : null;
    const report = await prisma.motelReport.create({
      data: {
        motelId: motel.id,
        userId: currentUser?.id || null,
        reason: validated.reason,
        comment: validated.comment || null,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'El reporte contiene datos inválidos.' }, { status: 400 });
    }
    console.error('Error creating motel report:', error);
    return NextResponse.json({ error: 'No pudimos guardar el reporte.' }, { status: 500 });
  }
}
