import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // Security Headers
  async headers() {
    return [
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
              `script-src 'self'${isDev ? " 'unsafe-eval'" : ''} 'unsafe-inline' https://maps.googleapis.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob: https://jahatelo-media.s3.us-east-1.amazonaws.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://jahatelo.com https://www.jahatelo.com https://maps.googleapis.com https://exp.host https://jahatelo-media.s3.us-east-1.amazonaws.com",
              "frame-src 'self' https://maps.google.com",
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
