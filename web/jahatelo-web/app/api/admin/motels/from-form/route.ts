import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminAccess } from '@/lib/adminAccess';
import { extractCoordinatesFromGoogleMapsUrl } from '@/lib/utils/coordinates';

const RoomFormSchema = z.object({
  name: z.string().min(1),
  pricePerHour: z.string().min(1),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  otherAmenity: z.string().optional(),
});

const PromoFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  validUntil: z.string().optional(),
});

const MotelFormSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().min(1),
  phone: z.string().min(1),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().optional(),
  googleMapsUrl: z.string().url(),
  description: z.string().min(10),
  rooms: z.array(RoomFormSchema).min(1),
  promos: z.array(PromoFormSchema).optional(),
  plan: z.enum(['BASIC', 'GOLD', 'DIAMOND']),
  paymentMethod: z.enum(['transfer', 'card']).optional(),
  ruc: z.string().optional(),
  businessName: z.string().optional(),
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

function parseMoney(raw: string): number | null {
  const parsed = Number(raw.replace(/[^\d]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, ['SUPERADMIN', 'MOTEL_ADMIN'], 'motels');
    if (access.error) return access.error;

    const body = await request.json();
    const validated = MotelFormSchema.parse(body);

    const coordinates = extractCoordinatesFromGoogleMapsUrl(validated.googleMapsUrl);
    if (!coordinates) {
      return NextResponse.json(
        { error: 'No se pudieron extraer coordenadas del link de Google Maps' },
        { status: 400 }
      );
    }

    const baseSlug = generateSlug(validated.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.motel.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const motel = await prisma.motel.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        address: validated.address,
        city: validated.city,
        neighborhood: validated.neighborhood || 'Sin barrio',
        mapUrl: validated.googleMapsUrl,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        phone: validated.phone,
        whatsapp: validated.whatsapp || null,
        instagram: validated.instagram || null,
        contactName: validated.contactName,
        contactEmail: validated.email || null,
        contactPhone: validated.phone,
        plan: validated.plan,
        status: 'PENDING',
        isActive: false,
        isFeatured: validated.plan === 'GOLD' || validated.plan === 'DIAMOND',
        paymentType: validated.paymentMethod === 'transfer' ? 'TRANSFER' : validated.paymentMethod === 'card' ? 'DIRECT_DEBIT' : null,
        billingCompanyName: validated.businessName || null,
        billingTaxId: validated.ruc || null,
      },
    });

    for (const room of validated.rooms) {
      const amenityNames = [...room.amenities, room.otherAmenity].filter(Boolean) as string[];
      const amenityIds: string[] = [];

      for (const amenityName of amenityNames) {
        const amenity = await prisma.amenity.upsert({
          where: { name: amenityName.trim() },
          update: {},
          create: { name: amenityName.trim(), type: 'ROOM' },
          select: { id: true },
        });
        amenityIds.push(amenity.id);
      }

      await prisma.roomType.create({
        data: {
          motelId: motel.id,
          name: room.name,
          description: room.description || null,
          price1h: parseMoney(room.pricePerHour),
          isActive: true,
          amenities: amenityIds.length
            ? {
                create: amenityIds.map((amenityId) => ({ amenityId })),
              }
            : undefined,
        },
      });
    }

    if (validated.promos?.length) {
      for (const promo of validated.promos) {
        await prisma.promo.create({
          data: {
            motelId: motel.id,
            title: promo.title,
            description: promo.description || null,
            validUntil: promo.validUntil ? new Date(promo.validUntil) : null,
            isActive: true,
          },
        });
      }
    }

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
