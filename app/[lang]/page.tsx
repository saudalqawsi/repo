import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { getCatalog } from '@/lib/catalog.server'
import { JobPrompt } from '@/components/JobPrompt'
import { EquipmentGrid } from '@/components/EquipmentGrid'
import { SecHead } from '@/components/SecHead'
import { LoaderMark } from '@/components/Logo'
import { FEATURE_ICONS } from '@/components/Icons'

const RAIL = [
  { cat: 'loaders', img: 'loader-66' },
  { cat: 'excavators', img: 'excavator' },
  { cat: 'lifting', img: 'scissor-lift' },
  { cat: 'grading', img: 'vibratory-roller' },
]

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang)
  const u = d.ui
  const { equipment, categories } = await getCatalog()
  const usedCats = categories.filter((c) => equipment.some((e) => e.category === c.slug))
  const num = (n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(n)
  const L = (p: string) => `/${lang}${p}`

  const factsStart = [
    { n: equipment.length, l: u.facts.types },
    { n: usedCats.length, l: u.facts.cats },
    { n: 24, l: u.facts.hours },
  ]
  const factsEnd = [
    { n: 1, l: u.facts.operator },
    { n: d.how.steps.length, l: u.facts.steps },
    { n: 4, l: u.facts.bases },
  ]

  return (
    <>
      {/* 1 · Hero */}
      <section className="hero">
        <img className="hero-img" src="/img/hero.jpg" alt={u.heroAlt} />
        <div className="wrap hero-in">
          <p className="hero-light">{u.heroLight}</p>
          <h1 className="hero-bold">{u.heroBold}</h1>
          <span className="dash" aria-hidden="true"><i /><i /></span>
          <p className="hero-lead">{u.heroLead}</p>
          <div className="hero-ctas">
            <Link className="btn btn-tab" href={L('/request')}>
              <span>{d.nav.request}</span>
              <i aria-hidden="true" />
            </Link>
            <a className="btn btn-outline-light" href="#start">{u.describe}</a>
          </div>
        </div>
        <nav className="rail" aria-label={u.railLabel}>
          {RAIL.map((r, i) => {
            const c = categories.find((x) => x.slug === r.cat)
            if (!c) return null
            const label = lang === 'ar' ? c.name_ar : c.name_en
            return (
              <Link key={r.cat} href={L(`/equipment?cat=${r.cat}`)} className={i === 0 ? 'on' : undefined} title={label} aria-label={label}>
                <img src={`/img/cut/${r.img}.webp`} alt="" />
              </Link>
            )
          })}
        </nav>
      </section>

      {/* 2 · Describe the job */}
      <section className="sec" id="start" aria-labelledby="start-h">
        <div className="wrap narrow">
          <SecHead id="start-h" eyebrow={u.startEyebrow} title={d.home.title} lead={d.home.lead} />
          <JobPrompt locale={lang} d={d.home} eqd={d.eq} equipment={equipment} />
        </div>
      </section>

      {/* 3 · Fleet */}
      <section className="sec sec-grey" aria-labelledby="fleet-h">
        <div className="wrap">
          <SecHead id="fleet-h" eyebrow={u.fleetEyebrow} title={u.fleetTitle} />
          <EquipmentGrid locale={lang} d={d.eq} equipment={equipment} categories={categories} limit={8} />
          <div className="center-row">
            <p className="note">{d.eq.indicativeNote}</p>
            <Link className="btn btn-dark" href={L('/equipment')}>{d.home.eqAll}</Link>
          </div>
        </div>
      </section>

      {/* 4 · Why Shayul */}
      <section className="sec" aria-labelledby="why-h">
        <div className="wrap">
          <SecHead id="why-h" eyebrow={u.whyEyebrow} title={u.whyTitle} lead={u.whyLead} />
          <div className="why">
            <ul className="features">
              {u.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i]
                return (
                  <li key={f.t}>
                    <div>
                      <h3>{f.t}</h3>
                      <p>{f.d}</p>
                    </div>
                    <span className="f-icon"><Icon /></span>
                  </li>
                )
              })}
            </ul>
            <div className="why-img">
              <img src="/img/cut/loader-80.webp" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* 5 · Steps */}
      <section className="sec sec-grey" aria-labelledby="how-h">
        <div className="wrap">
          <SecHead id="how-h" eyebrow={u.howEyebrow} title={u.howTitle} />
          <ol className="seq">
            {d.how.steps.map((s) => (
              <li key={s.t}>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="center-row">
            <Link className="btn btn-dark" href={L('/how-it-works')}>{d.home.howMore}</Link>
          </div>
        </div>
      </section>

      {/* 6 · Aim + loader line-up */}
      <section className="sec aim" aria-labelledby="aim-h">
        <div className="wrap">
          <h2 id="aim-h" className="aim-h">
            <span>{u.aimA}</span>{' '}
            <span className="aim-badge" aria-hidden="true"><LoaderMark size={40} color="var(--sun)" /></span>{' '}
            <span>{u.aimB}</span>
          </h2>
          <p className="aim-lead">{u.aimLead}</p>
          <div className="lineup">
            <ul className="facts">
              {factsStart.map((f) => (
                <li key={f.l}><b>{num(f.n)}</b><span>{f.l}</span></li>
              ))}
            </ul>
            <img src="/img/cut/lineup.webp" alt={u.lineupAlt} />
            <ul className="facts">
              {factsEnd.map((f) => (
                <li key={f.l}><b>{num(f.n)}</b><span>{f.l}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7 · Split call to action */}
      <section className="split" aria-label={d.nav.request}>
        <div className="split-dark">
          <div>
            <h2>{d.home.providerTitle}</h2>
            <p>{d.home.providerText}</p>
          </div>
          <Link className="btn btn-primary" href={L('/providers')}>{d.home.providerCta}</Link>
        </div>
        <div className="split-sun">
          <div>
            <h2>{u.needTitle}</h2>
            <p>{u.needText}</p>
          </div>
          <Link className="btn btn-dark" href={L('/request')}>{d.nav.request}</Link>
        </div>
      </section>
    </>
  )
}
