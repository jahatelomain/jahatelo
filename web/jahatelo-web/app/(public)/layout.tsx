import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import AgeGate from '@/components/public/AgeGate';
import AnalyticsProvider from '@/components/AnalyticsProvider';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AgeGate />
      <AnalyticsProvider />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}