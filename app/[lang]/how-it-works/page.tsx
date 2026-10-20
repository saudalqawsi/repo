import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).how.title } : {}
}

export default async function HowPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang).how
  return (
    <>
      <div className="wrap phead">
        <h1>{d.title}</h1>
        <p>{d.lead}</p>
      </div>

      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap side">
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>{d.stepsTitle}</h2>
            <ol className="timeline">
              {d.steps.map((s) => (
                <li key={s.t}>
                  <div>
                    <h3>{s.t}</h3>
                    <p className="muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="panel" aria-labelledby="price-h">
            <h2 id="price-h" style={{ fontSize: 20, marginBottom: 6 }}>{d.pricingTitle}</h2>
            <ul className="list">
              {d.pricing.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link className="btn btn-primary btn-block" style={{ marginTop: 20 }} href={`/${lang}/request`}>
              {t(lang).nav.request}
            </Link>
          </aside>
        </div>
      </section>

      <section className="sec sec-alt" aria-labelledby="g-h">
        <div className="wrap">
          <h2 id="g-h" style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)', marginBottom: 20 }}>{d.guaranteeTitle}</h2>
          <div className="two">
            {d.guarantees.map((g) => (
              <div className="g" key={g.t}>
                <h3>{g.t}</h3>
                <p className="muted">{g.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="faq-h">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <h2 id="faq-h" style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)', marginBottom: 8 }}>{d.faqTitle}</h2>
          {d.faq.map((f) => (
            <details className="faq" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
