import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import AdPopup from '@/components/public/AdPopup';
import MobileHome from '@/components/public/MobileHome';
import CinematicHero from '@/components/public/CinematicHero';
import EditorialFeatures from '@/components/public/EditorialFeatures';
import BrandKitSection from '@/components/public/BrandKitSection';
import FullBleedImageBreak from '@/components/public/FullBleedImageBreak';
import CinematicCTA from '@/components/public/CinematicCTA';
import { headers } from 'next/headers';
import type { PublicMotelListResponse } from '@/lib/domain/motels/publicListItem';

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';

  const [citiesResponse, featuredResponse, promosResponse] = await Promise.all([
    fetch(`${baseUrl}/api/mobile/cities`, { next: { revalidate: 60 } }),
    fetch(`${baseUrl}/api/mobile/motels?featured=true&limit=50`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/mobile/motels?promos=true&limit=50`, { cache: 'no-store' }),
  ]);

  const citiesPayload = citiesResponse.ok ? await citiesResponse.json() : { cities: [] };
  const cities = (citiesPayload.cities || [])
    .slice(0, 12)
    .map((item: { name: string; count: number }) => ({
      name: item.name,
      total: item.count,
    }));

  const featuredPayload: PublicMotelListResponse = featuredResponse.ok
    ? await featuredResponse.json()
    : { data: [], meta: { page: 1, limit: 50, total: 0, latestUpdatedAt: 0 } };
  const promosPayload: PublicMotelListResponse = promosResponse.ok
    ? await promosResponse.json()
    : { data: [], meta: { page: 1, limit: 50, total: 0, latestUpdatedAt: 0 } };

  const featuredMotels = featuredPayload.data.slice(0, 6);
  const promosCount = promosPayload.meta?.total ?? promosPayload.data.length ?? 0;

  return (
    <>
      <AdPopup />
      <Navbar />
      <MobileHome featuredMotels={featuredMotels} cities={cities} />
      <main data-testid="homepage-main" className="hidden md:block bg-white text-neutral-950">
        <CinematicHero featuredMotels={featuredMotels} />
        <EditorialFeatures cities={cities} promosCount={promosCount} />
        <BrandKitSection />
        <FullBleedImageBreak />
        <CinematicCTA />
      </main>
      <Footer />
    </>
  );
}