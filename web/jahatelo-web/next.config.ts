import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/mobile/motels/map-marker': [
      './node_modules/@fontsource/roboto/files/roboto-latin-500-normal.woff',
    ],
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Bucket S3 principal de Jahatelo
      {
        protocol: 'https',
        hostname: 'jahatelo-media.s3.us-east-1.amazonaws.com',
        pathname: '/uploads/**',
      },
      // Google Maps (markers y tiles estáticos)
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
      },
      // Unsplash (imágenes de demo/placeholder)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Dev: permitir cualquier origen HTTP (solo en desarrollo)
      ...(process.env.NODE_ENV !== 'production'
        ? [{ protocol: 'http' as const, hostname: '**' }]
        : []),
    ],
  },

  // Redirects (301 permanentes para SEO)
  async redirects() {
    return [
      // Migración de /ciudades a /ciudad (mejor SEO y soporte de barrios)
      {
        source: '/ciudades',
        destination: '/search',
        permanent: true,
      },
      {
        source: '/ciudades/:city',
        destination: '/ciudad/:city',
        permanent: true,
      },
    ];
  },

  // Security Headers
  async headers() {
    return [
      // Headers para Universal Links (iOS) y App Links (Android)
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/:path*',
        headers: [
          // HSTS - Forzar HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "base-uri 'self'",
              "default-src 'self'",
              `script-src 'self'${isDev ? " 'unsafe-eval'" : ''} 'wasm-unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://accounts.google.com https://apis.google.com`,
              // Google Maps vectorial crea workers desde blob:. Sin esta
              // excepción puede degradarse a raster y perder el mapa base.
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              `img-src 'self' data: https:${isDev ? ' http:' : ''} blob: https://jahatelo-media.s3.us-east-1.amazonaws.com`,
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://jahatelo.com https://www.jahatelo.com https://maps.googleapis.com https://maps.gstatic.com https://mapsresources-pa.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com https://accounts.google.com https://exp.host https://jahatelo-media.s3.us-east-1.amazonaws.com",
              "frame-src 'self' https://maps.google.com https://accounts.google.com",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              'upgrade-insecure-requests',
              'block-all-mixed-content',
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
