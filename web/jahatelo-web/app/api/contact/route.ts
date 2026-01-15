import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContactMessageSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * POST /api/contact
 * Envía un mensaje de contacto (público)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = ContactMessageSchema.parse(sanitized);
    const { name, phone, message } = validated;

    // Crear mensaje de contacto
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        message: message.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Mensaje enviado correctamente',
        id: contactMessage.id
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

    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}
