import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FavoriteButtonClient from '@/components/public/FavoriteButtonClient';
import ContactButtons from '@/components/public/ContactButtons';
import PromosTab from '@/components/public/PromosTab';
import ImageGallery from '@/components/public/ImageGallery';
import ShareButton from '@/components/public/ShareButton';
import ReviewsSection from '@/components/public/ReviewsSection';
import PriceTable from '@/components/public/PriceTable';
import JsonLd from '@/components/JsonLd';
import * as LucideIcons from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { generateBreadcrumbSchema, generateMotelSchema } from '@/lib/seo';
import Tabs from '@/components/public/Tabs';

interface MotelDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MotelDetailPage({ params }: MotelDetailPageProps) {
  const { slug } = await params;
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>;

  const motel = await prisma.motel.findUnique({
    where: { slug },
    include: {
      photos: {
        orderBy: { order: 'asc' },
      },
      motelAmenities: {
        include: {
          amenity: true,
        },
      },
      promos: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
      rooms: {
        where: { isActive: true },
        include: {
          amenities: {
            include: {
              amenity: true,
            },
          },
          photos: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { isFeatured: 'desc' },
      },
      menuCategories: {
        include: {
          items: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!motel || motel.status !== 'APPROVED' || !motel.isActive) {
    notFound();
  }

  // Get main photo
  const facadePhoto = motel.photos.find((p) => p.kind === 'FACADE');
  const mainPhoto = facadePhoto || motel.photos[0];

  // Safe rating
  const safeRating = motel.ratingAvg || 0;
  const hasReviews = motel.ratingCount > 0;

  // Build tabs dynamically
  const tabs = [];

  // Add Promos tab first if there are active promos
  if (motel.promos && motel.promos.length > 0) {
    tabs.push({
      id: 'promos',
      label: 'Promos',
      content: <PromosTab promos={motel.promos} />,
    });
  }

  // Always add Details tab
  tabs.push({
    id: 'details',
    label: 'Detalles',
    content: (
        <div>
          {motel.photos.length > 0 && (
            <div className="mb-8">
              <ImageGallery images={motel.photos.map((photo) => ({ url: photo.url, alt: motel.name }))} />
            </div>
          )}
          {/* Description */}
          {motel.description && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 whitespace-pre-line">{motel.description}</p>
            </div>
          )}

          {/* Amenities */}
          {motel.motelAmenities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Servicios e instalaciones</h3>
              <div className="flex flex-wrap gap-3">
                {motel.motelAmenities.map((ma) => (
                  <div
                    key={ma.id}
                    title={ma.amenity.name}
                    aria-label={ma.amenity.name}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 text-purple-600"
                  >
                    {(() => {
                      const IconComponent = ma.amenity.icon ? iconLibrary[ma.amenity.icon] : undefined;
                      return IconComponent ? (
                        <IconComponent size={18} className="text-purple-600" />
                      ) : (
                        <span className="text-purple-600 text-base font-semibold">•</span>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Contacto</h3>
            <div className="space-y-3">
              {motel.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${motel.phone}`} className="hover:text-purple-600 transition-colors">
                    {motel.phone}
                  </a>
                </div>
              )}

              {motel.whatsapp && (
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <a
                    href={`https://wa.me/${motel.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-600 transition-colors"
                  >
                    {motel.whatsapp}
                  </a>
                </div>
              )}

              {motel.website && (
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <a
                    href={motel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-600 transition-colors"
                  >
                    Sitio web
                  </a>
                </div>
              )}

              {motel.instagram && (
                <div className="flex items-center gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <a
                    href={`https://instagram.com/${motel.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-600 transition-colors"
                  >
                    @{motel.instagram.replace('@', '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    });

  // Add Rooms tab only if there are active rooms
  if (motel.rooms && motel.rooms.length > 0) {
    tabs.push({
      id: 'rooms',
      label: 'Habitaciones',
      content: (
        <div>
          {motel.rooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {motel.rooms.map((room) => {
                const roomPhoto = room.photos[0];
                const prices = [
                  { label: '1h', value: room.price1h },
                  { label: '1.5h', value: room.price1_5h },
                  { label: '2h', value: room.price2h },
                  { label: '3h', value: room.price3h },
                  { label: '12h', value: room.price12h },
                  { label: '24h', value: room.price24h },
                  { label: 'Noche', value: room.priceNight },
                ].filter((p) => p.value !== null && p.value !== undefined);

                return (
                  <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="md:flex">
                      {/* Room Photo */}
                      {roomPhoto && (
                        <div className="md:w-1/3 relative h-64 md:h-auto bg-gray-200">
                          <Image
                            src={roomPhoto.url}
                            alt={room.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}

                      {/* Room Info */}
                      <div className={`p-6 ${roomPhoto ? 'md:w-2/3' : 'w-full'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-xl font-bold text-gray-900">{room.name}</h4>
                          <div className="flex gap-2">
                            {room.isFeatured && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                Destacada
                              </span>
                            )}
                          </div>
                        </div>

                        {room.description && (
                          <p className="text-gray-600 mb-4">{room.description}</p>
                        )}

                        {/* Features */}
                        <div className="flex flex-wrap gap-3 mb-4">
                          {room.maxPersons && (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Hasta {room.maxPersons} {room.maxPersons === 1 ? 'persona' : 'personas'}
                            </span>
                          )}
                          {room.hasJacuzzi && (
                            <span className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium">
                              ♨️ Jacuzzi
                            </span>
                          )}
                          {room.hasPrivateGarage && (
                            <span className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium">
                              🚗 Cochera privada
                            </span>
                          )}
                        </div>

                        {/* Room Amenities */}
                        {room.amenities.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Comodidades:</p>
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.map((ra) => (
                                <span
                                  key={ra.id}
                                  title={ra.amenity.name}
                                  aria-label={ra.amenity.name}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600"
                                >
                                  {(() => {
                                    const IconComponent = ra.amenity.icon ? iconLibrary[ra.amenity.icon] : undefined;
                                    return IconComponent ? (
                                      <IconComponent size={12} className="text-purple-600" />
                                    ) : (
                                      <span className="text-purple-600 text-[10px] font-semibold">•</span>
                                    );
                                  })()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Prices */}
                        {prices.length > 0 && (
                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Precios:</p>
                            <PriceTable
                              prices={prices.map((price) => ({
                                label: price.label,
                                price: Number(price.value),
                                hours:
                                  price.label === '1h'
                                    ? 1
                                    : price.label === '1.5h'
                                      ? 1.5
                                      : price.label === '2h'
                                        ? 2
                                        : price.label === '3h'
                                          ? 3
                                          : price.label === '12h'
                                            ? 12
                                            : price.label === '24h'
                                              ? 24
                                              : 8,
                              }))}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay habitaciones cargadas para este motel.</p>
            </div>
          )}
        </div>
      ),
    });
  }

  // Add Menu tab only if there are menu categories
  if (motel.menuCategories && motel.menuCategories.length > 0) {
    tabs.push({
      id: 'menu',
      label: 'Menú',
      content: (
        <div>
          {motel.menuCategories.length > 0 ? (
            <div className="space-y-8">
              {motel.menuCategories.map((category) => (
                <div key={category.id}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {category.name || category.title || 'Sin categoría'}
                  </h3>

                  {category.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.items.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4">
                          {item.photoUrl && (
                            <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                              <Image
                                src={item.photoUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <span className="text-lg font-bold text-purple-600 ml-2">
                                ${item.price.toLocaleString()}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay ítems en esta categoría.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Este motel no tiene menú cargado todavía.</p>
            </div>
          )}
        </div>
      ),
    });
  }

  tabs.push({
    id: 'reviews',
    label: 'Reseñas',
    content: <ReviewsSection motelId={motel.id} />,
  });

  const motelSchema = generateMotelSchema({
    name: motel.name,
    description: motel.description,
    image: mainPhoto?.url,
    address: motel.address,
    city: motel.city,
    country: motel.country,
    ratingAvg: motel.ratingAvg,
    ratingCount: motel.ratingCount,
    phone: motel.phone,
    url: `https://jahatelo.vercel.app/motels/${motel.slug}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', url: 'https://jahatelo.vercel.app' },
    { name: 'Moteles', url: 'https://jahatelo.vercel.app/motels' },
    { name: motel.name, url: `https://jahatelo.vercel.app/motels/${motel.slug}` },
  ]);

  return (
    <>
      <JsonLd data={[motelSchema, breadcrumbSchema]} />
      <Navbar />
      <div className="bg-gray-50 min-h-screen">
      {/* Hero Image */}
      {mainPhoto && (
        <div className="relative h-96 bg-gray-200">
          <Image
            src={mainPhoto.url}
            alt={motel.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {motel.promos && motel.promos.length > 0 && (
              <div className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                PROMO
              </div>
            )}
            {motel.isFeatured && (
              <div className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                DESTACADO
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {motel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{motel.city}, {motel.neighborhood}</span>
                </div>

                {hasReviews && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-medium">{safeRating.toFixed(1)}</span>
                    <span className="text-gray-400">
                      ({motel.ratingCount} {motel.ratingCount === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ContactButtons motelId={motel.id} phone={motel.phone} whatsapp={motel.whatsapp} />
              <FavoriteButtonClient motelId={motel.id} source="DETAIL" />
              <ShareButton title={motel.name} url={`https://jahatelo.vercel.app/motels/${motel.slug}`} />
            </div>
          </div>

          {/* Address & Map Link */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>{motel.address}</span>
            {(motel.mapUrl || (motel.latitude && motel.longitude)) && (
              <a
                href={
                  motel.mapUrl ||
                  `https://www.google.com/maps?q=${motel.latitude},${motel.longitude}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-600 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver en Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Tabs tabs={tabs} defaultTab={tabs[0]?.id} />
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
