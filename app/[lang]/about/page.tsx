import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { PageBanner } from '@/components/PageBanner'
import { AboutNav } from '@/components/AboutNav'
import { Mark } from '@/components/Logo'
import { ABOUT_ICONS, IconRenter } from '@/components/Icons'
import { photoProps } from '@/lib/photos'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const d = t(lang).about
  return { title: d.title, description: d.lead }
}

const IDS = ['intro', 'vision', 'fix', 'v2030', 'market'] as const
const PROGRAM_PHOTOS = ['ntp', 'economy', 'logistics', 'housing'] as const

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const all = t(lang)
  const d = all.about
  const L = (p: string) => `/${lang}${p}`
  const nav = IDS.map((id, i) => ({ id, label: d.nav[i] }))

  return (
    <>
      <PageBanner locale={lang} title={d.title} lead={d.lead} photo="about" />
      <AboutNav items={nav} label={d.toc} />

      {/* 1 · Who we are */}
      <section id="intro" className="ab-sec" aria-labelledby="intro-h">
        <div className="wrap ab-split">
          <div className="ab-text reveal">
            <p className="ab-eyebrow">{d.introEyebrow}</p>
            <h2 id="intro-h">{d.introTitle}</h2>
            <p className="ab-lead">{d.introText}</p>
            <ul className="ab-points">
              {d.introPoints.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
          <figure className="ab-photo reveal">
            <div className="ab-photo-in"><img alt={all.ui.heroAlt} loading="lazy" {...photoProps('hero', '(max-width: 900px) 100vw, 50vw')} /></div>
          </figure>
        </div>
      </section>

      {/* 2 · Vision and mission over Riyadh */}
      <section id="vision" className="ab-vm" aria-labelledby="vision-h">
        <img className="ab-vm-img" alt={d.photoAlt.riyadh} loading="lazy" {...photoProps('riyadh')} />
        <div className="wrap ab-vm-in">
          <h2 id="vision-h" className="sr-only">{d.nav[1]}</h2>
          <article className="ab-vm-card reveal">
            <span className="ab-vm-mark"><Mark size={40} /></span>
            <h3>{d.visionTitle}</h3>
            <p>{d.vision}</p>
          </article>
          <article className="ab-vm-card reveal">
            <span className="ab-vm-mark"><Mark size={40} /></span>
            <h3>{d.missionTitle}</h3>
            <p>{d.mission}</p>
          </article>
        </div>
      </section>

      {/* 3 · What we fix */}
      <section id="fix" className="ab-sec sec-grey" aria-labelledby="fix-h">
        <div className="wrap">
          <div className="ab-head reveal">
            <p className="ab-eyebrow">{d.problemEyebrow}</p>
            <h2 id="fix-h">{d.problemTitle}</h2>
            <p className="ab-lead">{d.problemLead}</p>
          </div>
          <ul className="ab-pillars">
            {d.pillars.map((p, i) => {
              const Icon = ABOUT_ICONS[i]
              return (
                <li key={p.t} className="reveal">
                  <span className="g-icon"><Icon /></span>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </li>
              )
            })}
          </ul>
          <div className="ab-split ab-effect">
            <figure className="ab-photo ab-photo-alt reveal">
              <div className="ab-photo-in"><img alt="" loading="lazy" {...photoProps('owners', '(max-width: 900px) 100vw, 50vw')} /></div>
            </figure>
            <div className="ab-text reveal">
              <h3 className="ab-h3">{d.effectTitle}</h3>
              <ol className="ab-effects">
                {d.effects.map((e) => (
                  <li key={e.t}>
                    <b>{e.t}</b>
                    <span>{e.d}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 4 · Vision 2030 */}
      <section id="v2030" className="ab-sec" aria-labelledby="v-h">
        <div className="wrap">
          <div className="ab-head reveal">
            <p className="ab-eyebrow">{d.v2030Eyebrow}</p>
            <h2 id="v-h">{d.v2030Title}</h2>
            <p className="ab-lead">{d.v2030Lead}</p>
          </div>
          <ul className="ab-programs">
            {d.programs.map((p, i) => (
              <li key={p.name} className="reveal">
                <div className="ab-prog-img"><img alt="" loading="lazy" {...photoProps(PROGRAM_PHOTOS[i], '(max-width: 900px) 100vw, 600px')} /></div>
                <h3>{p.name}</h3>
                <p className="ab-target"><span>{d.targetLabel}</span>{p.target}</p>
                <p>{p.d}</p>
                <a className="ab-src" href={p.url} target="_blank" rel="noopener noreferrer">{d.readMore} ↗</a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 · The Saudi market */}
      <section id="market" className="ab-market" aria-labelledby="m-h">
        <div className="wrap">
          <div className="ab-head ab-head-dark reveal">
            <p className="ab-eyebrow">{d.marketEyebrow}</p>
            <h2 id="m-h">{d.marketTitle}</h2>
          </div>
          <ul className="ab-stats">
            {d.market.map((m) => (
              <li key={m.u} className="reveal">
                <b>{m.n}</b>
                <span className="ab-unit">{m.u}</span>
                <p>{m.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sources */}
      <section className="ab-sources" aria-labelledby="src-h">
        <div className="wrap">
          <h2 id="src-h">{d.sourcesTitle}</h2>
          <ol>
            {d.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.t}</a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Call to action */}
      <section className="split" aria-label={d.ctaTitle}>
        <div className="split-half split-dark">
          <span className="split-role"><Mark size={30} /> {all.ui.owners}</span>
          <h2>{all.home.providerTitle}</h2>
          <p>{all.home.providerText}</p>
          <Link className="btn btn-primary" href={L('/providers')}>{all.home.providerCta}</Link>
        </div>
        <div className="split-half split-sun">
          <span className="split-role"><IconRenter size={24} /> {all.ui.renters}</span>
          <h2>{d.ctaTitle}</h2>
          <p>{d.ctaText}</p>
          <Link className="btn btn-dark" href={L('/request')}>{all.nav.request}</Link>
        </div>
      </section>
    </>
  )
}
