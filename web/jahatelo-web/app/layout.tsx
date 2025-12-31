import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  weight: ['400', '700'],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jahatelo - Encuentra tu motel ideal",
  description: "Descubre los mejores moteles cerca de ti. Promociones, ubicaciones y toda la información que necesitas.",
  keywords: ["moteles", "alojamiento", "hospedaje", "promociones", "jahatelo"],
  authors: [{ name: "Jahatelo" }],
  creator: "Jahatelo",
  metadataBase: new URL('https://jahatelo.vercel.app'),
  openGraph: {
    title: "Jahatelo - Encuentra tu motel ideal",
    description: "Descubre los mejores moteles cerca de ti",
    url: 'https://jahatelo.vercel.app',
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
  themeColor: '#822DE2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#822DE2" />
      </head>
      <body className={`${lato.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
