import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== req.headers.get('host')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const form = await req.formData().catch(() => null)
  const lang = form?.get('lang') === 'en' ? 'en' : 'ar'
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL(`/${lang}`, req.url), { status: 303 })
}
