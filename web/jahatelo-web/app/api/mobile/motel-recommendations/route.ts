import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeObject } from '@/lib/sanitize';

const RecommendationSchema = z.object({
  motelName: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
});

/** Guarda recomendaciones anónimas enviadas desde las apps de Jahatelo. */
export async function POST(request: NextRequest) {
  try {
    const sanitized = sanitizeObject(await request.json());
    const { motelName, city } = RecommendationSchema.parse(sanitized);

    const recommendation = await prisma.motelProspect.create({
      data: {
        motelName,
        channel: 'APP',
        notes: `Recomendación de usuario · Ciudad: ${city}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: recommendation.id,
        message: 'Recomendación recibida',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Completá el nombre del motel y la ciudad.' }, { status: 400 });
    }

    console.error('Error creating motel recommendation:', error);
    return NextResponse.json({ error: 'No pudimos guardar la recomendación.' }, { status: 500 });
  }
}
