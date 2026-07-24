import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { SettingsUpdateSchema } from '@/lib/validations/schemas';
import { sanitizeObject } from '@/lib/sanitize';
import { z } from 'zod';

/**
 * GET /api/admin/settings
 * Obtener todas las configuraciones del sistema
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'configuracion');
    if (access.error) return access.error;

    // Obtener todas las configuraciones
    const settings = await prisma.settings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Convertir a un objeto key-value para facilitar el uso
    const settingsMap: Record<string, { value: string | null; category: string; description: string | null }> = {};
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
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'configuracion');
    if (access.error) return access.error;

    const body = await request.json();
    const sanitized = sanitizeObject(body);
    const validated = SettingsUpdateSchema.parse(sanitized);

    // Actualizar cada configuración
    const updates = [];
    for (const [key, value] of Object.entries(validated)) {
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

    const settingsMap: Record<string, { value: string | null; category: string; description: string | null }> = {};
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validación fallida', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al actualizar configuraciones' },
      { status: 500 }
    );
  }
}
