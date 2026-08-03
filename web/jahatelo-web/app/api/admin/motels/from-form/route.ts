import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { extractCoordinatesFromGoogleMapsUrl, normalizeGoogleMapsUrl } from '@/lib/utils/coordinates';
import { normalizeLocationName } from '@/lib/locationCatalog';

const RoomFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price1h: z.union([z.string(), z.number()]).optional().nullable(),
  price1_5h: z.union([z.string(), z.number()]).optional().nullable(),
  price2h: z.union([z.string(), z.number()]).optional().nullable(),
  price3h: z.union([z.string(), z.number()]).optional().nullable(),
  price12h: z.union([z.string(), z.number()]).optional().nullable(),
  price24h: z.union([z.string(), z.number()]).optional().nullable(),
  priceNight: z.union([z.string(), z.number()]).optional().nullable(),
  amenityIds: z.array(z.string()).default([]),
});

const MotelFormSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  country: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  googleMapsUrl: z.preprocess(
    (value) => typeof value === 'string' && value.trim() ? normalizeGoogleMapsUrl(value) : undefined,
    z.string().url().optional(),
  ),
  description: z.string().optional(),
  prospectId: z.string().cuid().optional(),
  rooms: z.array(RoomFormSchema).default([]),
  plan: z.enum(['FREE', 'BASIC', 'GOLD', 'DIAMOND']).default('FREE'),
}).superRefine((data, context) => {
  if (!data.prospectId) return;
  const requiredFields: Array<[keyof typeof data, string]> = [
    ['contactName', 'Contacto'], ['phone', 'Teléfono'], ['whatsapp', 'WhatsApp'],
    ['email', 'Correo'], ['address', 'Dirección'], ['googleMapsUrl', 'Google Maps'],
  ];
  requiredFields.forEach(([field, label]) => {
    if (!String(data[field] || '').trim()) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${label} es obligatorio al convertir un prospecto.` });
    }
  });
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseMoney(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Number(String(raw).replace(/[^\d]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const validated = MotelFormSchema.parse(body);

    const country = await prisma.countryCatalog.findUnique({
      where: { normalizedName: normalizeLocationName(validated.country) },
      include: { cities: true },
    });
    const city = country?.cities.find((item) => item.isActive && item.normalizedName === normalizeLocationName(validated.city));
    if (!country?.isActive || !city) {
      return NextResponse.json({ error: 'Seleccioná un país y una ciudad válidos del catálogo.' }, { status: 400 });
    }

    const coordinates = validated.googleMapsUrl
      ? extractCoordinatesFromGoogleMapsUrl(validated.googleMapsUrl)
      : null;

    const requestedAmenityIds = [...new Set(validated.rooms.flatMap((room) => room.amenityIds))];
    if (requestedAmenityIds.length) {
      const registeredAmenities = await prisma.amenity.count({ where: { id: { in: requestedAmenityIds } } });
      if (registeredAmenities !== requestedAmenityIds.length) {
        return NextResponse.json({ error: 'Uno o más amenities no existen en el catálogo.' }, { status: 400 });
      }
    }

    const baseSlug = generateSlug(validated.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.motel.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const motel = await prisma.$transaction(async (tx) => {
      let prospectNotes: string | null = null;
      if (validated.prospectId) {
        const prospect = await tx.motelProspect.findUnique({ where: { id: validated.prospectId } });
        if (!prospect) throw new Error('El prospect seleccionado ya no existe.');
        prospectNotes = prospect.notes;
      }
      const createdMotel = await tx.motel.create({
        data: {
        name: validated.name,
        slug,
        description: validated.description?.trim() || null,
        address: validated.address?.trim() || '',
        country: country.name,
        city: city.name,
        mapUrl: validated.googleMapsUrl || null,
        latitude: coordinates?.lat ?? null,
        longitude: coordinates?.lng ?? null,
        phone: validated.phone?.trim() || null,
        whatsapp: validated.whatsapp || null,
        instagram: validated.instagram || null,
        contactName: validated.contactName?.trim() || null,
        contactEmail: validated.email || null,
        contactPhone: validated.phone?.trim() || null,
        plan: validated.plan,
        status: 'PENDING',
        isActive: false,
        isFeatured: validated.plan === 'GOLD' || validated.plan === 'DIAMOND',
        },
      });

      for (const room of validated.rooms) {
      const amenityIds = [...new Set(room.amenityIds)];

        await tx.roomType.create({
        data: {
          motelId: createdMotel.id,
          name: room.name,
          description: room.description || null,
          price1h: parseMoney(room.price1h),
          price1_5h: parseMoney(room.price1_5h),
          price2h: parseMoney(room.price2h),
          price3h: parseMoney(room.price3h),
          price12h: parseMoney(room.price12h),
          price24h: parseMoney(room.price24h),
          priceNight: parseMoney(room.priceNight),
          isActive: true,
          amenities: amenityIds.length
            ? {
                create: amenityIds.map((amenityId) => ({ amenityId })),
              }
            : undefined,
        },
        });
      }

      if (validated.prospectId) {
        await tx.motelProspect.update({
          where: { id: validated.prospectId },
          data: {
            status: 'WON',
            notes: [prospectNotes, `Motel creado desde este prospecto: ${createdMotel.name} (${createdMotel.id}).`]
              .filter(Boolean)
              .join('\n\n'),
          },
        });
      }
      return createdMotel;
    });

    return NextResponse.json({
      success: true,
      motel: { id: motel.id, slug: motel.slug, name: motel.name },
      message: 'Motel creado exitosamente.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating motel from form:', error);
    return NextResponse.json({ error: 'Error al crear motel' }, { status: 500 });
  }
}
