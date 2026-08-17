import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { canAccessMotel } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { IdSchema, UpdateMotelSchema } from '@/lib/validations/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { normalizeLocationName } from '@/lib/locationCatalog';
import { normalizeGoogleMapsUrl } from '@/lib/utils/coordinates';
import { findOfficialGooglePlace } from '@/lib/googlePlaces';
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
            weekdayRates: true,
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

    if (access.user?.role !== 'SUPERADMIN') {
      if (validated.status !== undefined || validated.isActive !== undefined) {
        return NextResponse.json(
          { error: 'Solo un superadministrador puede modificar el estado o la habilitación del motel.' },
          { status: 403 }
        );
      }
      const currentLocation = await prisma.motel.findUnique({
        where: { id: idResult.data },
        select: { country: true, city: true, address: true, mapUrl: true },
      });
      if (!currentLocation) {
        return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
      }
      const locationChanged =
        (validated.country !== undefined && normalizeLocationName(validated.country || '') !== normalizeLocationName(currentLocation.country || '')) ||
        (validated.city !== undefined && normalizeLocationName(validated.city || '') !== normalizeLocationName(currentLocation.city || '')) ||
        (validated.address !== undefined && (validated.address || '') !== (currentLocation.address || '')) ||
        (validated.mapUrl !== undefined && normalizeGoogleMapsUrl(validated.mapUrl || '') !== normalizeGoogleMapsUrl(currentLocation.mapUrl || ''));
      if (locationChanged) {
        return NextResponse.json({ error: 'Solo un superadministrador puede modificar la ubicación del motel.' }, { status: 403 });
      }
      delete validated.country;
      delete validated.city;
      delete validated.address;
      delete validated.mapUrl;
    }

    if (validated.country !== undefined || validated.city !== undefined) {
      const current = await prisma.motel.findUnique({ where: { id: idResult.data }, select: { country: true, city: true } });
      if (!current) {
        return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
      }
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

    let locationWarning: string | null = null;
    // La ubicación que aparece en un iframe es el centro de su vista, no
    // necesariamente el pin del negocio. Al cambiar el enlace, resolvemos la
    // ficha canónica con Places API y guardamos su Place ID y coordenadas.
    if (validated.mapUrl !== undefined) {
      const mapUrl = validated.mapUrl ? normalizeGoogleMapsUrl(validated.mapUrl) : null;
      data.mapUrl = mapUrl;
      if (!mapUrl) {
        data.googlePlaceId = null;
        data.latitude = null;
        data.longitude = null;
      } else {
        const currentMotel = await prisma.motel.findUnique({
          where: { id: idResult.data },
          select: { name: true, address: true, city: true, country: true },
        });
        if (!currentMotel) return NextResponse.json({ error: 'Motel no encontrado' }, { status: 404 });
        const place = await findOfficialGooglePlace(currentMotel);
        if (place) {
          data.googlePlaceId = place.id;
          data.latitude = place.latitude;
          data.longitude = place.longitude;
          // El enlace devuelto por Places abre la ficha del establecimiento.
          data.mapUrl = place.googleMapsUri || mapUrl;
        } else {
          // Guardamos el enlace, pero no sobrescribimos un pin previo con el
          // centro del iframe. El administrador puede volver a intentarlo
          // una vez habilitada Places API (New) o revisada la ficha.
          locationWarning = 'Se guardó el enlace, pero no se pudo verificar el pin oficial de Google. Se conservó la ubicación anterior.';
        }
      }
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

    return NextResponse.json({ ...motel, locationWarning });
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
