import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Looks a commercial registration up on Wathq (Ministry of Commerce data) and returns the
 * registered name and status. Signed-in users only, since every lookup is billed.
 * Without WATHQ_API_KEY it answers 501 and the form falls back to manual review.
 */
export async function GET(req: NextRequest) {
  const key = process.env.WATHQ_API_KEY
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 501 })
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) return NextResponse.json({ error: 'auth' }, { status: 401 })
  const cr = (req.nextUrl.searchParams.get('cr') ?? '').replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
  if (!/^7\d{9}$/.test(cr)) return NextResponse.json({ error: 'format' }, { status: 400 })
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ar'
  try {
    const res = await fetch(`https://api.wathq.sa/v5/commercialregistration/info/${cr}?language=${lang}`, {
      headers: { apiKey: key, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (res.status === 404 || res.status === 400) return NextResponse.json({ found: false }, { status: 200 })
    if (!res.ok) return NextResponse.json({ error: 'upstream' }, { status: 502 })
    const j = (await res.json()) as { name?: string; crName?: string; status?: { name?: string; id?: number | string } }
    return NextResponse.json(
      { found: true, name: j.name ?? j.crName ?? null, status: j.status?.name ?? null },
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch {
    return NextResponse.json({ error: 'upstream' }, { status: 502 })
  }
}
