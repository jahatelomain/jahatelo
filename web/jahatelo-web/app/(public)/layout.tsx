import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import AgeGate from '@/components/public/AgeGate';
import AnalyticsProvider from '@/components/AnalyticsProvider';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Jahatelo',
  url: 'https://jahatelo.com',
  logo: 'https://jahatelo.com/logo.png',
  sameAs: [
    'https://www.instagram.com/jahatelopy',
    'https://www.tiktok.com/@jahatelo',
  ],
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <AgeGate />
      <AnalyticsProvider />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}