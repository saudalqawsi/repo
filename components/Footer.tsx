import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { Brand } from './Logo'

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale)
  const L = (p: string) => `/${locale}${p}`
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div className="ftr-brand">
          <span className="brand"><Brand label={locale === 'ar' ? 'شيول' : 'Shayul'} /></span>
          <p>{d.footer.tagline}</p>
        </div>
        <nav aria-label={d.ui.explore}>
          <h2>{d.ui.explore}</h2>
          <Link href={L('/equipment')}>{d.nav.equipment}</Link>
          <Link href={L('/how-it-works')}>{d.nav.how}</Link>
          <Link href={L('/providers')}>{d.nav.providers}</Link>
        </nav>
        <nav aria-label={d.ui.account}>
          <h2>{d.ui.account}</h2>
          <Link href={L('/request')}>{d.nav.request}</Link>
          <Link href={L('/account')}>{d.nav.myRequests}</Link>
          {contact ? <a href={`mailto:${contact}`}>{d.footer.contact}</a> : null}
        </nav>
      </div>
      <div className="ftr-bar">
        <div className="wrap">© 2026 · {d.footer.entity}</div>
      </div>
    </footer>
  )
}
