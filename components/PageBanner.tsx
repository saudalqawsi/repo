import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'

/** Dark photo banner that every inner page opens with; the header floats over it. */
export function PageBanner({ locale, title, lead, image = '/img/hero.jpg', slim }: { locale: Locale; title: string; lead?: string; image?: string; slim?: boolean }) {
  const d = t(locale)
  return (
    <section className={`banner${slim ? ' banner-slim' : ''}`}>
      <img className="banner-img" src={image} alt="" />
      <div className="wrap banner-in">
        <nav aria-label={d.ui.crumbs} className="crumbs">
          <Link href={`/${locale}`}>{d.ui.home}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        <span className="dash" aria-hidden="true"><i /><i /></span>
        {lead ? <p>{lead}</p> : null}
      </div>
    </section>
  )
}
