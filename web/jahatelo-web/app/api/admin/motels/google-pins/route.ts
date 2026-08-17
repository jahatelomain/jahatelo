import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/adminAccess';
import { prisma } from '@/lib/prisma';
import { findOfficialGooglePlace } from '@/lib/googlePlaces';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vista previa, sin escrituras, de los pines oficiales que Google puede
 * validar. La aplicación posterior exige una confirmación separada.
 */
export async function POST(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
  if (access.error) return access.error;

  try {
    const motels = await prisma.motel.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: { id: true, name: true, address: true, city: true, country: true, latitude: true, longitude: true },
      orderBy: { name: 'asc' },
    });

    const matches: Array<{
      id: string;
      name: string;
      current: { latitude: number | null; longitude: number | null };
      proposed: { name: string; address: string | null; latitude: number; longitude: number };
    }> = [];
    const unresolved: Array<{ id: string; name: string }> = [];

    for (const motel of motels) {
      const place = await findOfficialGooglePlace(motel);
      if (!place) {
        unresolved.push({ id: motel.id, name: motel.name });
        continue;
      }
      matches.push({
        id: motel.id,
        name: motel.name,
        current: { latitude: motel.latitude, longitude: motel.longitude },
        proposed: {
          name: place.name,
          address: place.formattedAddress,
          latitude: place.latitude,
          longitude: place.longitude,
        },
      });
    }

    return NextResponse.json({ success: true, total: motels.length, matches, unresolved });
  } catch (error) {
    console.error('Error al previsualizar pines oficiales:', error);
    return NextResponse.json({ error: 'No se pudo preparar la vista previa de pines oficiales.' }, { status: 500 });
  }
}

/**
 * Completa únicamente los pines faltantes. Nunca reemplaza una coordenada ya
 * guardada: así se preservan las ubicaciones que ya fueron revisadas.
 */
export async function PATCH(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
  if (access.error) return access.error;

  try {
    const motels = await prisma.motel.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        OR: [{ latitude: null }, { longitude: null }],
      },
      select: { id: true, name: true, address: true, city: true, country: true },
      orderBy: { name: 'asc' },
    });

    const updated: Array<{ id: string; name: string }> = [];
    const unresolved: Array<{ id: string; name: string }> = [];

    for (const motel of motels) {
      const place = await findOfficialGooglePlace(motel);
      if (!place) {
        unresolved.push({ id: motel.id, name: motel.name });
        continue;
      }

      await prisma.motel.update({
        where: { id: motel.id },
        data: {
          latitude: place.latitude,
          longitude: place.longitude,
          googlePlaceId: place.id,
        },
      });
      updated.push({ id: motel.id, name: motel.name });
    }

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Motel',
      entityId: null,
      module: 'motels',
      metadata: {
        action: 'COMPLETE_MISSING_GOOGLE_PINS',
        updated: updated.length,
        unresolved: unresolved.length,
        motelIds: updated.map((motel) => motel.id),
      },
    });

    return NextResponse.json({ success: true, total: motels.length, updated, unresolved });
  } catch (error) {
    console.error('Error al completar pines oficiales:', error);
    return NextResponse.json({ error: 'No se pudieron guardar los pines oficiales.' }, { status: 500 });
  }
}
