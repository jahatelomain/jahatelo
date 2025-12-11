import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, city, neighborhood, address, contactName, contactEmail, contactPhone } = body;

    // Validación básica
    if (!name || !city || !neighborhood || !address) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: name, city, neighborhood, address' },
        { status: 400 }
      );
    }

    if (!contactEmail && !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar al menos contactEmail o contactPhone' },
        { status: 400 }
      );
    }

    // Generar slug único
    let slug = generateSlug(name);
    let slugExists = await prisma.motel.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await prisma.motel.findUnique({ where: { slug } });
      counter++;
    }

    // Crear motel con status PENDING
    const motel = await prisma.motel.create({
      data: {
        name,
        slug,
        city,
        neighborhood,
        address,
        contactName,
        contactEmail,
        contactPhone,
        status: 'PENDING',
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      id: motel.id,
      message: 'Solicitud de registro enviada. Será revisada por nuestro equipo.',
    });
  } catch (error) {
    console.error('Error creating motel registration:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
