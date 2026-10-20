import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { LoginFlow } from '@/components/LoginFlow'
import { safeNext } from '@/lib/safe-next'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).auth.title, robots: { index: false } } : {}
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const { next } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect(safeNext(next ?? null, lang))
  return (
    <div className="flow" style={{ maxWidth: 480 }}>
      <LoginFlow locale={lang} d={t(lang).auth} next={next ?? null} />
    </div>
  )
}
