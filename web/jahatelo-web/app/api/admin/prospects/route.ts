import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasRole } from '@/lib/auth';

/**
 * GET /api/admin/prospects
 * Lista todos los prospects (solo SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const prospects = await prisma.motelProspect.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Error al obtener prospects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/prospects
 * Crea un prospect manualmente desde el admin (solo SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!hasRole(user, ['SUPERADMIN'])) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { contactName, phone, motelName, channel, notes } = body;

    // Validación básica
    if (!contactName || !phone || !motelName) {
      return NextResponse.json(
        { error: 'contactName, phone y motelName son requeridos' },
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

    // Validar canal si se proporciona, default MANUAL para admin
    const validChannels = ['WEB', 'APP', 'MANUAL'];
    const finalChannel = channel && validChannels.includes(channel) ? channel : 'MANUAL';

    // Crear prospect
    const prospect = await prisma.motelProspect.create({
      data: {
        contactName: contactName.trim(),
        phone: phone.trim(),
        motelName: motelName.trim(),
        channel: finalChannel,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { error: 'Error al crear prospect' },
      { status: 500 }
    );
  }
}
