import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import FavoriteButtonClient from '@/components/public/FavoriteButtonClient';
import ContactButtons from '@/components/public/ContactButtons';
import PromosTab from '@/components/public/PromosTab';
import RoomPhotoGallery from '@/components/public/RoomPhotoGallery';
import { MOTEL_PATTERN_STYLE } from '@/components/public/motelPattern';
import ShareButton from '@/components/public/ShareButton';
import ReviewsSection from '@/components/public/ReviewsSection';
import PriceTable from '@/components/public/PriceTable';
import AmenityList from '@/components/public/AmenityList';
import MobilePageHeader from '@/components/public/MobilePageHeader';
import { formatGuaranies } from '@/lib/formatCurrency';
import JsonLd from '@/components/JsonLd';
import * as LucideIcons from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { generateBreadcrumbSchema, generateMotelSchema } from '@/lib/seo';
import Tabs from '@/components/public/Tabs';
import { getPublicMotelDetail } from '@/lib/domain/motels/getMotelDetail';
import { normalizeLocalUploadPath } from '@/lib/normalizeLocalUrl';
import { getEffectivePrices } from '@/app/api/mobile/mappers';
import { getGoogleMapsExternalUrl } from '@/components/admin/motel-detail/formUtils';
import { PRICE_UPDATING_MESSAGE } from '@/lib/domain/motels/pricePresentation';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com';
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const formatScheduleTime = (value: string | null) => value?.slice(0, 5) || '--:--';

interface MotelDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MotelDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const motel = await prisma.motel.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      city: true,
      featuredPhoto: true,
      featuredPhotoWeb: true,
      status: true,
      isActive: true,
      plan: true,
    },
  });

  if (!motel || motel.status !== 'APPROVED' || !motel.isActive) {
    return { title: 'Motel no encontrado | Jahatelo' };
  }

  const title = `${motel.name} — ${motel.city} | Jahatelo`;
  const description =
    motel.description
      ? motel.description.slice(0, 155).trim()
      : `Reservá en ${motel.name}, ubicado en ${motel.city}. Habitaciones, precios y promos en Jahatelo.`;

  const ogImage = motel.featuredPhotoWeb || motel.featuredPhoto || undefined;
  const url = `${BASE_URL}/motels/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Jahatelo',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: motel.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function MotelDetailPage({ params }: MotelDetailPageProps) {
  const { slug } = await params;
  const iconLibrary = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  let motel = await getPublicMotelDetail(slug);

  if (!motel || motel.status !== 'APPROVED' || !motel.isActive) {
    notFound();
    return null;
  }

  const normalizedMotel = {
    ...motel,
    featuredPhoto: normalizeLocalUploadPath(motel.featuredPhoto),
    featuredPhotoWeb: normalizeLocalUploadPath(motel.featuredPhotoWeb),
    featuredPhotoApp: normalizeLocalUploadPath(motel.featuredPhotoApp),
    promos: motel.promos.map((promo) => ({
      ...promo,
      imageUrl: normalizeLocalUploadPath(promo.imageUrl),
    })),
    rooms: motel.rooms.map((room) => ({
      ...room,
      roomPhotos: room.roomPhotos.map((photo) => ({
        ...photo,
        url: normalizeLocalUploadPath(photo.url) || photo.url,
      })),
    })),
    menuCategories: motel.menuCategories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({
        ...item,
        photoUrl: normalizeLocalUploadPath(item.photoUrl),
      })),
    })),
  };

  motel = normalizedMotel as typeof motel;
  const isFreePlan = motel.plan === 'FREE';

  // Get main photo
  const featuredPhotoWeb = motel.featuredPhotoWeb || motel.featuredPhoto || null;
  const heroPhotoUrl =
    featuredPhotoWeb ||
    motel.featuredPhotoApp ||
    motel.featuredPhoto ||
    null;

  // Safe rating
  const safeRating = isFreePlan ? 0 : motel.ratingAvg || 0;
  const hasReviews = !isFreePlan && motel.ratingCount > 0;

  // Aggregate unique amenities from all active rooms
  const amenityAggMap = new Map<string, { id: string; name: string; icon: string | null }>();
  for (const room of motel.rooms) {
    for (const ra of room.amenities) {
      const amenity = ra?.amenity;
      if (amenity?.id && amenity.name && !amenityAggMap.has(amenity.id)) {
        amenityAggMap.set(amenity.id, { id: amenity.id, name: amenity.name, icon: amenity.icon });
      }
    }
  }
  const roomAmenitiesSummary = Array.from(amenityAggMap.values());

  // Build tabs dynamically
  const tabs = [];

  // Always add Details tab first
  tabs.push({
    id: 'details',
    label: 'Detalles',
    intro: motel.description ? (
      <p className={`mb-2 whitespace-pre-line text-base italic leading-7 text-slate-600 md:text-lg${isFreePlan ? ' opacity-45' : ''}`}>
        {motel.description}
      </p>
    ) : undefined,
    content: (
        <div className={isFreePlan ? 'opacity-45' : undefined}>
          {/* Galería removida: la imagen principal vive en el header */}
          {motel.schedules.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Horarios</h3>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {motel.schedules.map((schedule) => (
                  <div key={schedule.dayOfWeek} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="font-medium text-gray-700">{DAY_NAMES[schedule.dayOfWeek]}</span>
                    <span className="text-gray-600">
                      {schedule.isClosed
                        ? 'Cerrado'
                        : schedule.is24Hours
                          ? 'Abierto 24h'
                          : `${formatScheduleTime(schedule.openTime)} - ${formatScheduleTime(schedule.closeTime)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities derived from rooms */}
          {roomAmenitiesSummary.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h3>
              <AmenityList amenities={roomAmenitiesSummary} />
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

            </div>
          </div>
        </div>
      ),
    });

  // Add Promos tab if there are active promos
  if (!isFreePlan && motel.promos && motel.promos.length > 0) {
    tabs.push({
      id: 'promos',
      label: 'Promos',
      content: <PromosTab promos={motel.promos} />,
    });
  }

  // Add Rooms tab only if there are active rooms
  if (!isFreePlan && motel.rooms && motel.rooms.length > 0) {
    tabs.push({
      id: 'rooms',
      label: 'Habitaciones',
      content: (
        <div>
          {motel.rooms.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {motel.rooms.map((room) => {
                const roomPhotos = room.roomPhotos.map((photo, index) => ({
                  url: photo.url,
                  alt: `${room.name}, foto ${index + 1}`,
                }));
                const roomWithRates = room as Parameters<typeof getEffectivePrices>[0];
                const weekdayPrices = getEffectivePrices(roomWithRates, 'WEEKDAY');
                const weekendPrices = getEffectivePrices(roomWithRates, 'WEEKEND');
                const toPriceTableItems = (source: typeof weekdayPrices) => [
                  { label: '1h', value: source.price1h },
                  { label: '1.5h', value: source.price1_5h },
                  { label: '2h', value: source.price2h },
                  { label: '3h', value: source.price3h },
                  { label: '12h', value: source.price12h },
                  { label: '24h', value: source.price24h },
                  { label: 'Dormida', value: source.priceNight },
                ].filter((price): price is { label: string; value: number } =>
                  typeof price.value === 'number' && price.value > 0,
                );
                const weekdayRateItems = toPriceTableItems(weekdayPrices);
                const weekendRateItems = toPriceTableItems(weekendPrices);
                const hasDayPriceVariation = weekdayRateItems.some((weekdayPrice) =>
                  weekendRateItems.some(
                    (weekendPrice) => weekdayPrice.label === weekendPrice.label && weekdayPrice.value !== weekendPrice.value,
                  ),
                );
                const prices = weekdayRateItems;
                const weekdayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                const weekdayLabels: Record<string, string> = { MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mié', THURSDAY: 'Jue', FRIDAY: 'Vie', SATURDAY: 'Sáb', SUNDAY: 'Dom' };
                const specificRates = Array.from(room.weekdayRates.reduce((groups, rate) => {
                  const key = `${rate.duration}:${rate.price}`;
                  const group = groups.get(key) ?? { duration: rate.duration, price: rate.price, weekdays: [] as string[] };
                  group.weekdays.push(rate.weekday);
                  groups.set(key, group);
                  return groups;
                }, new Map<string, { duration: string; price: number; weekdays: string[] }>()).values()).map((rate) => ({
                  ...rate,
                  days: rate.weekdays.sort((first, second) => weekdayOrder.indexOf(first) - weekdayOrder.indexOf(second)).map((weekday) => weekdayLabels[weekday] ?? weekday),
                })).sort((first, second) => weekdayOrder.indexOf(first.weekdays[0] ?? '') - weekdayOrder.indexOf(second.weekdays[0] ?? ''));
                const durationLabel: Record<string, string> = { H1: '1h', H1_5: '1.5h', H2: '2h', H3: '3h', H12: '12h', H24: '24h', NIGHT: 'Dormida' };

                return (
                  <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="md:flex">
                      {/* Room Photo */}
                      {roomPhotos.length > 0 && (
                        <RoomPhotoGallery images={roomPhotos} roomName={room.name} />
                      )}

                      {/* Room Info */}
                      <div className={`p-6 ${roomPhotos.length > 0 ? 'md:w-2/3' : 'w-full'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-xl font-bold text-gray-900">{room.name}</h4>
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
                        </div>

                        {/* Room Amenities */}
                        {room.amenities.some((ra) => Boolean(ra?.amenity?.name)) && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.filter((ra) => Boolean(ra?.amenity?.name)).map((ra) => (
                                <span
                                  key={ra.id}
                                  title={ra.amenity.name}
                                  aria-label={ra.amenity.name}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600"
                                >
                                  {(() => {
                                    const IconComponent = ra.amenity.icon ? iconLibrary[ra.amenity.icon] : undefined;
                                    return IconComponent ? (
                                      <IconComponent size={12} />
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
                        {prices.length > 0 ? (
                          <div className="border-t border-gray-200 pt-4">
                            {hasDayPriceVariation ? (
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div>
                                  <span className="mb-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Dom – Jue</span>
                                  <PriceTable prices={weekdayRateItems.map(({ label, value }) => ({ label, price: value }))} />
                                </div>
                                <div>
                                  <span className="mb-2 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Vie – Sáb</span>
                                  <PriceTable prices={weekendRateItems.map(({ label, value }) => ({ label, price: value }))} />
                                </div>
                              </div>
                            ) : (
                              <PriceTable prices={prices.map(({ label, value }) => ({ label, price: value }))} />
                            )}
                            {specificRates.length > 0 && (
                              <div className="mt-4 space-y-2 border-t border-dashed border-purple-200 pt-3">
                                <p className="text-xs font-semibold text-purple-700">Tarifas según día</p>
                                {specificRates.map((rate) => <div key={`${rate.duration}-${rate.price}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm"><span className="font-medium text-purple-800">{rate.days.join(', ')}</span><span className="font-semibold text-gray-900">{durationLabel[rate.duration]} · Gs. {rate.price.toLocaleString('es-PY')}</span></div>)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border-t border-gray-200 pt-4 text-sm font-semibold leading-5 text-slate-500">{PRICE_UPDATING_MESSAGE}</div>
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
  if (!isFreePlan && motel.menuCategories && motel.menuCategories.length > 0) {
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
                                quality={85}
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <span className="text-lg font-bold text-purple-600 ml-2">
                                {formatGuaranies(item.price)}
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
                    <p className="text-gray-500">Sin items en esta categoría</p>
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

  if (!isFreePlan) {
    tabs.push({
      id: 'reviews',
      label: 'Reseñas',
      content: <ReviewsSection motelId={motel.id} motelSlug={motel.slug} />,
    });
  }

  const motelSchema = generateMotelSchema({
    name: motel.name,
    description: motel.description,
    image: heroPhotoUrl || undefined,
    address: motel.address,
    city: motel.city,
    country: motel.country,
    ratingAvg: motel.ratingAvg,
    ratingCount: motel.ratingCount,
    phone: motel.phone,
    url: `${BASE_URL}/motels/${motel.slug}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', url: BASE_URL },
    { name: 'Buscar Moteles', url: `${BASE_URL}/search` },
    { name: motel.name, url: `${BASE_URL}/motels/${motel.slug}` },
  ]);

  return (
    <>
      <JsonLd data={[motelSchema, breadcrumbSchema]} />
      <Navbar />
      <MobilePageHeader title={motel.name} subtitle={motel.city} />
      <div className="bg-gray-50 min-h-screen">
      {/* Hero Image */}
      <div
        className="relative h-64 md:h-96"
        style={{
          ...MOTEL_PATTERN_STYLE,
          ...(heroPhotoUrl
            ? {
                backgroundImage: `url(${heroPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {!isFreePlan && motel.promos && motel.promos.length > 0 && (
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

      {/* Main Content */}
      <div className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pb-8 md:-mt-20 md:px-6 md:pb-16 lg:px-8">
        {/* Header Card */}
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-lg md:mb-8 md:rounded-lg md:p-6">
          <div className="mb-4 flex items-start justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-4xl">
                {motel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 md:gap-4 md:text-base">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{motel.city}</span>
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

            <div className="flex items-center gap-1.5 md:gap-3">
              <ContactButtons motelId={motel.id} phone={motel.phone} whatsapp={motel.whatsapp} />
              <FavoriteButtonClient motelId={motel.id} source="DETAIL" />
      <ShareButton title={motel.name} url={`${BASE_URL}/motels/${motel.slug}`} />
            </div>
          </div>

          {/* Address & Map Link */}
          {(() => {
            const mapsHref = getGoogleMapsExternalUrl(
              motel.mapUrl,
              [motel.address, motel.city].filter(Boolean).join(', '),
            ) || (
              motel.latitude != null && motel.longitude != null
                ? `https://www.google.com/maps/search/?api=1&query=${motel.latitude},${motel.longitude}`
                : null
            );
            return (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 md:gap-4">
                <span>{motel.address}</span>
                {mapsHref && (
                  <a
                    href={mapsHref}
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
            );
          })()}
        </div>

        {/* Índice y secciones continuas; #promos apunta a la sección correspondiente. */}
        <div className="rounded-2xl bg-white p-4 shadow-sm md:rounded-lg md:p-6">
          <Tabs tabs={tabs} defaultTab={tabs[0]?.id} />
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
