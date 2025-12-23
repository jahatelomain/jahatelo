import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    // Try to find by slug first, then by id
    const motel = await prisma.motel.findFirst({
      where: {
        OR: [
          { slug: id },
          { id },
        ],
      },
      include: {
        rooms: {
          include: {
            amenities: {
              include: {
                amenity: true,
              },
            },
            photos: true,
          },
        },
        menuCategories: {
          include: {
            items: true,
          },
        },
        motelAmenities: {
          include: {
            amenity: true,
          },
        },
        photos: true,
        promos: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!motel) {
      return NextResponse.json(
        { error: 'Motel not found' },
        { status: 404 }
      );
    }

    // Transform the data to match what the app expects
    const sortedPhotos = motel.photos.sort((a, b) => a.order - b.order);
    const facadePhoto = sortedPhotos.find(p => p.kind === 'FACADE');
    const thumbnail = facadePhoto?.url || sortedPhotos[0]?.url || motel.featuredPhoto || null;
    const photos = sortedPhotos.map(p => p.url);

    // Calculate starting price from room prices
    const roomPrices = motel.rooms.flatMap(room => [
      room.price1h,
      room.price1_5h,
      room.price2h,
      room.price3h,
      room.price12h,
      room.price24h,
      room.priceNight,
      room.basePrice,
    ].filter((price): price is number => price != null && price > 0));
    const startingPrice = roomPrices.length > 0 ? Math.min(...roomPrices) : 0;

    const transformedMotel = {
      id: motel.id,
      slug: motel.slug,
      name: motel.name,
      neighborhood: motel.neighborhood,
      city: motel.city,
      startingPrice,
      latitude: motel.latitude,
      longitude: motel.longitude,
      description: motel.description,
      isFeatured: motel.isFeatured || false,
      hasPromo: motel.promos.length > 0,
      thumbnail,
      featuredPhoto: thumbnail,
      photos,
      allPhotos: photos,
      hasPhotos: photos.length > 0,
      rating: {
        average: motel.ratingAvg || 0,
        count: motel.ratingCount || 0,
      },
      contact: {
        phone: motel.phone || null,
        whatsapp: motel.whatsapp || null,
      },
      schedules: [], // Add if you have schedule data
      amenities: motel.motelAmenities.map(ma => ({
        id: ma.amenity.id,
        name: ma.amenity.name,
        icon: ma.amenity.icon,
      })),
      rooms: motel.rooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        basePrice: room.basePrice || 0,
        priceLabel: room.priceLabel || null,
        photos: room.photos.map(p => p.url).sort((a, b) => {
          const aPhoto = room.photos.find(p => p.url === a);
          const bPhoto = room.photos.find(p => p.url === b);
          return (aPhoto?.order || 0) - (bPhoto?.order || 0);
        }),
        amenities: room.amenities.map(ra => ({
          id: ra.amenity.id,
          name: ra.amenity.name,
          icon: ra.amenity.icon,
        })),
        maxPersons: room.maxPersons,
        hasJacuzzi: room.hasJacuzzi || false,
        hasPrivateGarage: room.hasPrivateGarage || false,
        isFeatured: room.isFeatured || false,
      })),
      menu: motel.menuCategories.map(category => ({
        id: category.id,
        name: category.name,
        items: category.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          photoUrl: item.photoUrl || null,
        })),
      })),
      paymentMethods: [], // Add if you have payment methods data
      promos: motel.promos.map(promo => ({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        imageUrl: promo.imageUrl,
        validFrom: promo.validFrom,
        validUntil: promo.validUntil,
        isGlobal: promo.isGlobal,
      })),
    };

    return NextResponse.json(transformedMotel);
  } catch (error) {
    console.error('Error in GET /api/motels/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch motel' },
      { status: 500 }
    );
  }
}
