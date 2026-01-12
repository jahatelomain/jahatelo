import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewContactMessageNotification } from '@/lib/push-notifications';

/**
 * POST /api/contact
 * Envía un mensaje de contacto (público)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, message } = body;

    // Validaciones
    if (!name || !message) {
      return NextResponse.json(
        { error: 'Nombre y mensaje son requeridos' },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'El nombre debe tener entre 2 y 100 caracteres' },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 1000) {
      return NextResponse.json(
        { error: 'El mensaje debe tener entre 10 y 1000 caracteres' },
        { status: 400 }
      );
    }

    if (phone && phone.length > 50) {
      return NextResponse.json(
        { error: 'El teléfono es demasiado largo' },
        { status: 400 }
      );
    }

    // Crear mensaje de contacto
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        message: message.trim(),
      },
    });

    // Enviar notificación push a administradores
    // No esperamos la respuesta para no retrasar la respuesta al usuario
    sendNewContactMessageNotification({
      id: contactMessage.id,
      name: contactMessage.name,
      message: contactMessage.message,
    }).catch((error) => {
      console.error('Error sending push notification:', error);
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
    console.error('Error creating contact message:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}
