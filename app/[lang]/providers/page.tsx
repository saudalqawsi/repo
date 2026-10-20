import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { ProviderForm } from '@/components/ProviderForm'

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
      <div className="wrap phead">
        <h1>{d.title}</h1>
        <p>{d.lead}</p>
      </div>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap side">
          <div>
            <div className="stage" style={{ minHeight: 280, marginBottom: 28 }}>
              <img src="/img/eq/bulldozer-d9.jpg" alt={lang === 'ar' ? 'بلدوزر في موقع عمل' : 'Bulldozer on site'} />
            </div>
            <div className="two" style={{ gridTemplateColumns: '1fr' }}>
              {d.benefits.map((b) => (
                <div className="g" key={b.t}>
                  <h3>{b.t}</h3>
                  <p className="muted">{b.d}</p>
                </div>
              ))}
            </div>
            <h2 style={{ fontSize: 20, margin: '28px 0 6px' }}>{d.needTitle}</h2>
            <ul className="list">
              {d.needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <ProviderForm locale={lang} d={d} signedIn={Boolean(data?.claims)} />
        </div>
      </section>
    </>
  )
}
