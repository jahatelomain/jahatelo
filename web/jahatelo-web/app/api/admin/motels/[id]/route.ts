import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { canAccessMotel } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateMotelSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { normalizeLocationName } from '@/lib/locationCatalog';
import { extractCoordinatesFromGoogleMapsUrl, normalizeGoogleMapsUrl } from '@/lib/utils/coordinates';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Los detalles de un motel se editan desde el mismo panel y nunca deben servir
// una respuesta anterior tras un PATCH exitoso.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    const safeFetch = async <T>(label: string, fetcher: () => Promise<T>, fallback: T) => {
      try {
        return await fetcher();
      } catch (error) {
        console.error(`Error fetching ${label} for motel ${id}:`, error);
        return fallback;
      }
    };

    const rooms = await safeFetch(
      'rooms',
      () =>
        prisma.roomType.findMany({
          where: { motelId: idResult.data },
          include: {
            amenities: {
              include: {
                amenity: true,
              },
            },
            roomPhotos: {
              orderBy: {
                order: 'asc',
              },
            },
            // El formulario de edición necesita las tarifas por grupo de día
            // para poder volver a mostrarlas sin perderlas al guardar.
            dayRates: true,
          },
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        }),
      []
    );

    const menuCategories = await safeFetch(
      'menu categories',
      () =>
        prisma.menuCategory.findMany({
          where: { motelId: idResult.data },
          include: {
            items: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        }),
      []
    );

    return NextResponse.json(
      {
        ...motel,
        rooms,
        menuCategories,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    console.error('Error fetching motel:', error);
    return NextResponse.json(
      { error: 'Error al obtener motel' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();

    // Validar con Zod
    const validated = UpdateMotelSchema.parse(body);

    if (validated.country !== undefined || validated.city !== undefined) {
      const current = await prisma.motel.findUnique({ where: { id: idResult.data }, select: { country: true, city: true } });
      const requestedCountry = validated.country ?? current?.country ?? '';
      const requestedCity = validated.city ?? current?.city ?? '';
      const country = await prisma.countryCatalog.findUnique({
        where: { normalizedName: normalizeLocationName(requestedCountry) },
        include: { cities: true },
      });
      const city = country?.cities.find((item) => item.isActive && item.normalizedName === normalizeLocationName(requestedCity));
      if (!country?.isActive || !city) {
        return NextResponse.json({ error: 'Seleccioná un país y una ciudad válidos del catálogo.' }, { status: 400 });
      }
      validated.country = country.name;
      validated.city = city.name;
    }

    // Sanitizar campos de texto
    const data: Prisma.MotelUpdateInput = {
      ...validated,
      ...(validated.name ? { name: sanitizeText(validated.name) } : {}),
      ...(validated.description ? { description: sanitizeText(validated.description) } : {}),
      ...(validated.city ? { city: sanitizeText(validated.city) } : {}),
      ...(validated.address ? { address: sanitizeText(validated.address) } : {}),
    };

    // mapUrl y sus coordenadas representan una sola ubicación. Nunca se debe
    // conservar la coordenada previa cuando cambia el enlace, porque la web y
    // las apps priorizan latitude/longitude para abrir el mapa y marcarlo.
    if (validated.mapUrl !== undefined) {
      const mapUrl = validated.mapUrl ? normalizeGoogleMapsUrl(validated.mapUrl) : null;
      const coordinates = mapUrl ? extractCoordinatesFromGoogleMapsUrl(mapUrl) : null;
      data.mapUrl = mapUrl;
      data.latitude = coordinates?.lat ?? null;
      data.longitude = coordinates?.lng ?? null;
    }

    // Manejar nextBillingAt si existe
    if (body.nextBillingAt !== undefined) {
      data.nextBillingAt = body.nextBillingAt ? new Date(body.nextBillingAt).toISOString() : null;
    }

    const motel = await prisma.motel.update({
      where: { id: idResult.data },
      data,
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'UPDATE',
      entityType: 'Motel',
      entityId: motel.id,
      metadata: { name: motel.name },
    });

    return NextResponse.json(motel);
  } catch (error) {
    // Errores de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
        },
        { status: 400 }
      );
    }

    console.error('Error updating motel:', error);
    return NextResponse.json(
      { error: 'Error al actualizar motel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;
    const idResult = IdSchema.safeParse(id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (!canAccessMotel(access.user || null, id)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const motel = await prisma.motel.findUnique({
      where: { id: idResult.data },
      select: { id: true, name: true },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel no encontrado' },
        { status: 404 }
      );
    }

    await prisma.motel.delete({
      where: { id: idResult.data },
    });

    await logAuditEvent({
      userId: access.user?.id,
      action: 'DELETE',
      entityType: 'Motel',
      entityId: motel.id,
      metadata: { name: motel.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting motel:', error);
    return NextResponse.json(
      { error: 'Error al eliminar motel' },
      { status: 500 }
    );
  }
}
