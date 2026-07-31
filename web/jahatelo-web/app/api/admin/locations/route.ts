import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { cleanLocationName, normalizeLocationName } from '@/lib/locationCatalog';
import { logAuditEvent } from '@/lib/audit';

const LocationSchema = z.object({
  action: z.enum(['createCountry', 'createCity', 'updateCountry', 'updateCity', 'setCountryActive', 'setCityActive', 'deleteCountry', 'deleteCity']),
  id: z.string().optional(),
  countryId: z.string().optional(),
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
  if (access.error) return access.error;
  const countries = await prisma.countryCatalog.findMany({
    include: { cities: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ countries });
}

export async function POST(request: NextRequest) {
  const access = await requireAdminAccess(request, ['SUPERADMIN'], 'configuracion');
  if (access.error) return access.error;
  const parsed = LocationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos de ubicación inválidos.' }, { status: 400 });
  const data = parsed.data;

  try {
    let result;
    if (data.action === 'createCountry') {
      if (!data.name) throw new Error('Indicá el país.');
      result = await prisma.countryCatalog.create({ data: { name: cleanLocationName(data.name), normalizedName: normalizeLocationName(data.name) } });
    } else if (data.action === 'createCity') {
      if (!data.name || !data.countryId) throw new Error('Indicá país y ciudad.');
      result = await prisma.cityCatalog.create({ data: { countryId: data.countryId, name: cleanLocationName(data.name), normalizedName: normalizeLocationName(data.name) } });
    } else if (data.action === 'updateCountry') {
      if (!data.id || !data.name) throw new Error('Datos incompletos.');
      result = await prisma.countryCatalog.update({ where: { id: data.id }, data: { name: cleanLocationName(data.name), normalizedName: normalizeLocationName(data.name) } });
    } else if (data.action === 'updateCity') {
      if (!data.id || !data.name) throw new Error('Datos incompletos.');
      result = await prisma.cityCatalog.update({ where: { id: data.id }, data: { name: cleanLocationName(data.name), normalizedName: normalizeLocationName(data.name) } });
    } else if (data.action === 'setCountryActive') {
      if (!data.id || data.isActive === undefined) throw new Error('Datos incompletos.');
      result = await prisma.countryCatalog.update({ where: { id: data.id }, data: { isActive: data.isActive } });
    } else if (data.action === 'setCityActive') {
      if (!data.id || data.isActive === undefined) throw new Error('Datos incompletos.');
      result = await prisma.cityCatalog.update({ where: { id: data.id }, data: { isActive: data.isActive } });
    } else if (data.action === 'deleteCountry') {
      if (!data.id) throw new Error('País inválido.');
      const country = await prisma.countryCatalog.findUnique({ where: { id: data.id }, include: { _count: { select: { cities: true } } } });
      if (!country) throw new Error('País no encontrado.');
      if (country._count.cities) throw new Error('No se puede eliminar un país con ciudades. Desactivalo si ya no se usa.');
      if (await prisma.motel.count({ where: { country: country.name } })) throw new Error('El país está en uso por moteles.');
      result = await prisma.countryCatalog.delete({ where: { id: data.id } });
    } else {
      if (!data.id) throw new Error('Ciudad inválida.');
      const city = await prisma.cityCatalog.findUnique({ where: { id: data.id }, include: { country: true } });
      if (!city) throw new Error('Ciudad no encontrada.');
      if (await prisma.motel.count({ where: { city: city.name, country: city.country.name } })) throw new Error('La ciudad está en uso por moteles. Desactívala si ya no se usa.');
      result = await prisma.cityCatalog.delete({ where: { id: data.id } });
    }
    await logAuditEvent({ userId: access.user?.id, action: 'UPDATE', entityType: 'LocationCatalog', entityId: result.id, module: 'configuracion', metadata: { action: data.action, name: result.name } });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el catálogo.';
    const status = /Unique constraint/.test(message) ? 409 : 400;
    return NextResponse.json({ error: message.includes('Unique constraint') ? 'Ya existe una ubicación equivalente.' : message }, { status });
  }
}
