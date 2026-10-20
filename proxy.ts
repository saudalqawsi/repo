import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['ar', 'en'] as const
const PROTECTED = ['/account']

function buildCsp(nonce: string) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const isDev = process.env.NODE_ENV === 'development'
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self' ${supabase} ${supabase.replace('https://', 'wss://')}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

function pickLocale(req: NextRequest): (typeof LOCALES)[number] {
  const saved = req.cookies.get('lang')?.value
  if (saved === 'ar' || saved === 'en') return saved
  const accept = req.headers.get('accept-language') ?? ''
  return /^en/i.test(accept) && !/ar/i.test(accept.split(',')[0]) ? 'en' : 'ar'
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const first = pathname.split('/')[1]

  // 1. Every page lives under /ar or /en
  if (!LOCALES.includes(first as (typeof LOCALES)[number])) {
    const url = request.nextUrl.clone()
    url.pathname = `/${pickLocale(request)}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  // 2. Per-request CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  // 3. Refresh the Supabase session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v as string))
        },
      },
    },
  )
  const { data } = await supabase.auth.getClaims()

  // 4. Signed-in-only pages
  const rest = '/' + pathname.split('/').slice(2).join('/')
  if (!data?.claims && PROTECTED.some((p) => rest.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = `/${first}/login`
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  response.headers.set('Content-Security-Policy', csp)
  response.cookies.set('lang', first, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 })
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api|auth|_next/static|_next/image|img|fonts|favicon.ico|icon.svg|robots.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
