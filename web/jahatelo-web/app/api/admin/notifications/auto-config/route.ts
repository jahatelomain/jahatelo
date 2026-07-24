import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';

const DEFAULT_CONFIGS = [
  {
    key: 'contact_message',
    label: 'Alerta de mensaje de contacto',
    description: 'Notifica a los admins cuando llega un nuevo mensaje de contacto desde la app o web',
    category: 'security',
  },
  {
    key: 'promo_favorites',
    label: 'Promo a usuarios favoritos',
    description: 'Notifica a los usuarios que tienen el motel en favoritos cuando se crea una nueva promo',
    category: 'advertising',
  },
  {
    key: 'new_prospect',
    label: 'Alerta de nuevo prospecto',
    description: 'Notifica a los admins cuando llega un nuevo prospecto (registro de motel interesado)',
    category: 'security',
  },
];

/**
 * GET /api/admin/notifications/auto-config
 * Lista todos los AutoNotificationConfig. Solo SUPERADMIN.
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'notifications');
    if (access.error) return access.error;

    // Upsert de defaults para asegurar que existan todos los registros
    await Promise.all(
      DEFAULT_CONFIGS.map((cfg) =>
        prisma.autoNotificationConfig.upsert({
          where: { key: cfg.key },
          update: {},
          create: {
            key: cfg.key,
            label: cfg.label,
            description: cfg.description,
            category: cfg.category,
            enabled: false,
          },
        })
      )
    );

    const configs = await prisma.autoNotificationConfig.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ success: true, configs });
  } catch (error) {
    console.error('Error fetching auto-notification configs:', error);
    return NextResponse.json({ error: 'Error al obtener configuraciones' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/notifications/auto-config
 * Actualiza el campo enabled de una config por key. Solo SUPERADMIN.
 * Body: { key: string; enabled: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'notifications');
    if (access.error) return access.error;

    const body = await request.json();
    const { key, enabled } = body;

    if (typeof key !== 'string' || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos: se requiere key (string) y enabled (boolean)' }, { status: 400 });
    }

    const isValidKey = DEFAULT_CONFIGS.some((cfg) => cfg.key === key);
    if (!isValidKey) {
      return NextResponse.json({ error: 'Clave de configuración no reconocida' }, { status: 400 });
    }

    const updated = await prisma.autoNotificationConfig.update({
      where: { key },
      data: {
        enabled,
        updatedBy: access.user?.id,
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Error updating auto-notification config:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
