import type { NextConfig } from 'next'

// Security headers that do not depend on a per-request nonce.
// The Content-Security-Policy (with nonce) is set in proxy.ts.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  // Photos ship in /public/img. If a deployment was made without them (an inline
  // upload with source only), fall back to the same files in the repo via jsDelivr.
  async rewrites() {
    const origin = process.env.IMG_FALLBACK_ORIGIN
    return origin ? { beforeFiles: [], afterFiles: [], fallback: [{ source: '/img/:path*', destination: `${origin}/:path*` }] } : []
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default config
