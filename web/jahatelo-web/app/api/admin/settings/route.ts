import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/settings
 * Obtener todas las configuraciones del sistema
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo SUPERADMIN puede acceder.' },
        { status: 403 }
      );
    }

    // Obtener todas las configuraciones
    const settings = await prisma.settings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Convertir a un objeto key-value para facilitar el uso
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = {
        value: setting.value,
        category: setting.category,
        description: setting.description,
      };
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      raw: settings, // También incluir el array completo
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Actualizar configuraciones del sistema
 * Body: { [key]: value, ... }
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo SUPERADMIN puede modificar configuraciones.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar que el body no esté vacío
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron configuraciones para actualizar' },
        { status: 400 }
      );
    }

    // Actualizar cada configuración
    const updates = [];
    for (const [key, value] of Object.entries(body)) {
      const update = prisma.settings.upsert({
        where: { key },
        update: {
          value: String(value),
          updatedAt: new Date(),
        },
        create: {
          key,
          value: String(value),
          category: 'general', // Categoría por defecto
        },
      });
      updates.push(update);
    }

    // Ejecutar todas las actualizaciones
    await Promise.all(updates);

    // Obtener las configuraciones actualizadas
    const settings = await prisma.settings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = {
        value: setting.value,
        category: setting.category,
        description: setting.description,
      };
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      message: 'Configuraciones actualizadas exitosamente',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuraciones' },
      { status: 500 }
    );
  }
}
