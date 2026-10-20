import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { getCatalog } from '@/lib/catalog.server'
import { createClient } from '@/lib/supabase/server'
import { RequestWizard } from '@/components/RequestWizard'
import { PageBanner } from '@/components/PageBanner'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).req.title } : {}
}

export default async function RequestPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang)
  const [{ equipment, categories }, supabase] = await Promise.all([getCatalog(), createClient()])
  const { data } = await supabase.auth.getClaims()
  return (
    <>
    <PageBanner locale={lang} title={d.req.title} slim />
    <div className="flow lift" style={{ maxWidth: 760 }}>
      <Suspense>
        <RequestWizard locale={lang} d={d.req} eqd={d.eq} cd={d.contract} ad={d.after} equipment={equipment} categories={categories} signedIn={Boolean(data?.claims)} />
      </Suspense>
    </div>
    </>
  )
}
