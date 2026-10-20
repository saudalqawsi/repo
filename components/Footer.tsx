import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { Brand } from './Logo'

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale)
  const L = (p: string) => `/${locale}${p}`
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
          <span className="brand"><Brand label={locale === 'ar' ? 'شيول' : 'Shayul'} /></span>
          <p className="muted">{d.footer.tagline}</p>
        </div>
        <nav aria-label="footer">
          <Link href={L('/equipment')}>{d.nav.equipment}</Link>
          <Link href={L('/how-it-works')}>{d.nav.how}</Link>
          <Link href={L('/providers')}>{d.nav.providers}</Link>
          {process.env.NEXT_PUBLIC_CONTACT_EMAIL ? (
            <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>{d.footer.contact}</a>
          ) : null}
        </nav>
      </div>
      <div className="wrap" style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <span className="muted small">© 2026 · {d.footer.entity}</span>
      </div>
    </footer>
  )
}
