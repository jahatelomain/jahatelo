import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublicProspectSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = PublicProspectSchema.parse(sanitized);
    const { contactName, phone, motelName, channel } = validated;
    const finalChannel = channel || 'WEB';

    // Crear prospect
    const prospect = await prisma.motelProspect.create({
      data: {
        contactName: contactName.trim(),
        phone: phone.trim(),
        motelName: motelName.trim(),
        channel: finalChannel,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '¡Gracias por tus datos! Nos contactaremos en la brevedad posible.',
        prospect: {
          id: prospect.id,
          contactName: prospect.contactName,
          motelName: prospect.motelName,
          channel: prospect.channel,
        }
      },
      { status: 201 }
    );

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

    console.error('Error al crear prospect:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
