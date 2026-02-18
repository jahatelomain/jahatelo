import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import PwaRegistrar from "@/components/public/PwaRegistrar";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AgeGate from "@/components/public/AgeGate";
import AnalyticsProvider from "@/components/AnalyticsProvider";

const lato = Lato({
  weight: ['400', '700'],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#822DE2',
};

export const metadata: Metadata = {
  title: "Jahatelo - Encuentra tu motel ideal",
  description: "Descubre los mejores moteles cerca de ti. Promociones, ubicaciones y toda la información que necesitas.",
  keywords: ["moteles", "alojamiento", "hospedaje", "promociones", "jahatelo"],
  authors: [{ name: "Jahatelo" }],
  creator: "Jahatelo",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com'),
  openGraph: {
    title: "Jahatelo - Encuentra tu motel ideal",
    description: "Descubre los mejores moteles cerca de ti",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com',
    siteName: 'Jahatelo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jahatelo - Encuentra tu motel ideal',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jahatelo - Encuentra tu motel ideal',
    description: 'Descubre los mejores moteles cerca de ti',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/manifest.json',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${lato.variable} antialiased bg-white text-slate-900`}>
        <AuthProvider>
          <ToastProvider>
            <AgeGate />
            <PwaRegistrar />
            <AnalyticsProvider />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
