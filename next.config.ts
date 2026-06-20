import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [45, 55, 60, 70, 75],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/en/articles',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/en/articles/:slug',
        permanent: true,
      },
      {
        source: '/:locale(en|ar)/blog',
        destination: '/:locale/articles',
        permanent: true,
      },
      {
        source: '/:locale(en|ar)/blog/:slug',
        destination: '/:locale/articles/:slug',
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

export default withAnalyzer(withNextIntl(nextConfig));
