import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactName, phone, motelName, channel } = body;

    // Validación básica
    if (!contactName || !phone || !motelName) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validación de nombre de contacto (mínimo 2 caracteres)
    if (contactName.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre de contacto debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Validación de teléfono (mínimo 7 dígitos)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return NextResponse.json(
        { error: 'El teléfono debe tener al menos 7 dígitos' },
        { status: 400 }
      );
    }

    // Validación de nombre del motel (mínimo 2 caracteres)
    if (motelName.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre del motel debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Validar canal si se proporciona
    const validChannels = ['WEB', 'APP', 'MANUAL'];
    const finalChannel = channel && validChannels.includes(channel) ? channel : 'WEB';

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
    console.error('Error al crear prospect:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
