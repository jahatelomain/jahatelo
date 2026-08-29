import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import PwaRegistrar from "@/components/public/PwaRegistrar";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AgeGate from "@/components/public/AgeGate";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";
import PublicMobileShell from "@/components/public/PublicMobileShell";

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
  description: "Encontrá tu mejor lugar para disfrutar!",
  keywords: ["moteles", "alojamiento", "hospedaje", "promociones", "jahatelo"],
  authors: [{ name: "Jahatelo" }],
  creator: "Jahatelo",
  verification: {
    google: "xdLQRuzM5b1dwASHb89DYgS3SAWpW_VS1OuMvQg_IyU",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com'),
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com',
  },
  openGraph: {
    title: "Jahatelo - Encuentra tu motel ideal",
    description: "Encontrá tu mejor lugar para disfrutar!",
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
    locale: 'es_PY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jahatelo - Encuentra tu motel ideal',
    description: 'Encontrá tu mejor lugar para disfrutar!',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/logo-icon.png?v=2', type: 'image/png', sizes: '1024x1024' },
    ],
    shortcut: [{ url: '/logo-icon.png?v=2', type: 'image/png' }],
    apple: [
      { url: '/logo-icon.png?v=2', type: 'image/png', sizes: '1024x1024' },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Jahatelo',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXT_PUBLIC_APP_URL || 'https://jahatelo.com'}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <GoogleAuthProvider>
          <AuthProvider>
            <ToastProvider>
              <AgeGate />
              <PwaRegistrar />
              <AnalyticsProvider />
              <PublicMobileShell>{children}</PublicMobileShell>
            </ToastProvider>
          </AuthProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
