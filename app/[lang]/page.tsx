import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { getCatalog } from '@/lib/catalog.server'
import { JobPrompt } from '@/components/JobPrompt'
import { EquipmentGrid } from '@/components/EquipmentGrid'

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang)
  const { equipment, categories } = await getCatalog()

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <JobPrompt
            locale={lang}
            d={d.home}
            eqd={d.eq}
            equipment={equipment}
            heroImage="/img/eq/loader-66.jpg"
            heroAlt={lang === 'ar' ? 'شيول في موقع عمل' : 'Wheel loader on a work site'}
          />
        </div>
      </section>

      <section className="sec sec-alt" aria-labelledby="eq-h">
        <div className="wrap">
          <div className="sec-h">
            <h2 id="eq-h">{d.home.eqTitle}</h2>
            <Link href={`/${lang}/equipment`} className="btn-link">{d.home.eqAll}</Link>
          </div>
          <EquipmentGrid locale={lang} d={d.eq} equipment={equipment} categories={categories} limit={8} />
          <p className="note">{d.eq.indicativeNote}</p>
        </div>
      </section>

      <section className="sec" aria-labelledby="how-h">
        <div className="wrap">
          <div className="sec-h">
            <h2 id="how-h">{d.home.howTitle}</h2>
            <Link href={`/${lang}/how-it-works`} className="btn-link">{d.home.howMore}</Link>
          </div>
          <ol className="steps">
            {d.home.steps.map((s) => (
              <li key={s.t}>
                <h3>{s.t}</h3>
                <p className="muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 24 }}>
        <div className="band">
          <div>
            <h2>{d.home.providerTitle}</h2>
            <p>{d.home.providerText}</p>
          </div>
          <Link className="btn btn-primary" href={`/${lang}/providers`}>{d.home.providerCta}</Link>
        </div>
      </section>
    </>
  )
}
