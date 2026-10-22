import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { ProviderForm } from '@/components/ProviderForm'
import { PageBanner } from '@/components/PageBanner'
import { SecHead } from '@/components/SecHead'
import { ContactNote } from '@/components/Contact'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).prov.title } : {}
}

export default async function ProvidersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang).prov
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  return (
    <>
      <PageBanner locale={lang} title={d.title} lead={d.lead} image="/img/eq/excavator.jpg" />
      <section className="sec">
        <div className="wrap side">
          <div>
            <img className="prov-img" src="/img/cut/excavator.webp" alt="" />
            <div className="gcards gcards-1">
              {d.benefits.map((b) => (
                <div className="gcard" key={b.t}>
                  <h3>{b.t}</h3>
                  <p className="muted">{b.d}</p>
                </div>
              ))}
            </div>
            <h2 className="h-sm">{d.needTitle}</h2>
            <ul className="list">
              {d.needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <ContactNote locale={lang} lead={t(lang).contact.ownerLead} />
          </div>
          <ProviderForm locale={lang} d={d} signedIn={Boolean(data?.claims)} />
        </div>
      </section>
    </>
  )
}
