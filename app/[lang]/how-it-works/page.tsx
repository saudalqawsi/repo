import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { PageBanner } from '@/components/PageBanner'
import { SecHead } from '@/components/SecHead'
import { GUARANTEE_ICONS } from '@/components/Icons'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).how.title } : {}
}

export default async function HowPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const all = t(lang)
  const d = all.how
  return (
    <>
      <PageBanner locale={lang} title={d.title} lead={d.lead} photo="how" />

      <section className="sec" aria-labelledby="steps-h">
        <div className="wrap">
          <SecHead id="steps-h" eyebrow={all.ui.howEyebrow} title={d.stepsTitle} />
          <ol className="seq">
            {d.steps.map((s) => (
              <li key={s.t}>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec sec-grey" aria-labelledby="g-h">
        <div className="wrap">
          <SecHead id="g-h" eyebrow={all.ui.whyEyebrow} title={d.guaranteeTitle} />
          <div className="gcards">
            {d.guarantees.map((g, i) => {
              const Icon = GUARANTEE_ICONS[i % GUARANTEE_ICONS.length]
              return (
              <div className="gcard" key={g.t}>
                <span className="g-icon"><Icon /></span>
                <h3>{g.t}</h3>
                <p>{g.d}</p>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="price-h">
        <div className="wrap side">
          <div>
            <SecHead id="price-h" eyebrow={all.eq.indicative} title={d.pricingTitle} />
            <ul className="list">
              {d.pricing.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <Link className="btn btn-primary" style={{ marginTop: 24 }} href={`/${lang}/request`}>{all.nav.request}</Link>
          </div>
          <div>
            <SecHead eyebrow="FAQ" title={d.faqTitle} />
            {d.faq.map((f) => (
              <details className="faq" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
